import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { triggerWorkflows } from '@/lib/automations';

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

// POST /api/orders — Process POS/eCommerce sale with real stock deduction
export async function POST(request: Request) {
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const {
      tenantId,
      items,
      total,
      paymentMethod = 'cash',
      cashTendered,
      changeGiven,
      customerEmail,
    }: {
      tenantId: string;
      items: OrderItem[];
      total: number;
      paymentMethod: string;
      cashTendered?: number;
      changeGiven?: number;
      customerEmail?: string;
    } = body;

    if (!tenantId || !items?.length || !total) {
      return NextResponse.json({ error: 'tenantId, items y total son requeridos' }, { status: 400 });
    }

    // 1. VERIFY STOCK for all items before doing anything
    for (const item of items) {
      const { data: product, error } = await supabase
        .from('products')
        .select('name, stock')
        .eq('id', item.productId)
        .single();

      if (error || !product) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productId}` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}` },
          { status: 409 }
        );
      }
    }

    // 2. CREATE ORDER RECORD
    const orderId = 'ord-' + Date.now();
    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      tenant_id: tenantId,
      customer_email: customerEmail || null,
      items: items,
      total: Number(total),
      payment_method: paymentMethod,
      status: 'completed',
      cash_tendered: cashTendered || null,
      change_given: changeGiven || null,
    });

    if (orderError) throw orderError;

    // 3. DEDUCT STOCK using stored procedure (atomic, prevents race conditions)
    for (const item of items) {
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        product_id: item.productId,
        qty: item.quantity,
      });

      if (stockError) {
        // If stock deduction fails, mark order as cancelled
        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
        throw new Error(`Error descontando stock: ${stockError.message}`);
      }
    }

    // 4. AUDIT LOG
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: 'cajero',
      action: 'Venta POS procesada',
      details: `Orden ${orderId} por $${total} (${paymentMethod}). ${items.length} producto(s).`,
    });

    // 5. TRIGGER AUTOMATIONS (email, WhatsApp, webhooks)
    try {
      await triggerWorkflows(tenantId, 'pos_sale', {
        orderId,
        items,
        total,
        paymentMethod,
        customerEmail,
      });
    } catch (automationErr) {
      // Don't fail the order if automations fail
      console.warn('[AUTOMATION WARNING]', automationErr);
    }

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Venta procesada con éxito',
    });

  } catch (err: any) {
    console.error('[ORDER ERROR]', err);
    return NextResponse.json(
      { error: err.message || 'Error al procesar la venta' },
      { status: 500 }
    );
  }
}

// GET /api/orders — Get orders by tenant
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createAdminClient();
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
  }
}
