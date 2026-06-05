import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET /api/products?tenantId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    const supabase = createAdminClient();
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

// POST /api/products — create product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, name, price, stock, barcode, imageUrl, category } = body;

    if (!tenantId || !name || price === undefined) {
      return NextResponse.json({ error: 'Campos requeridos: tenantId, name, price' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.from('products').insert({
      tenant_id: tenantId,
      name,
      price: Number(price),
      stock: Number(stock) || 0,
      barcode: barcode || '',
      image_url: imageUrl || '',
      category: category || 'General',
    }).select().single();

    if (error) throw error;

    // Audit
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: 'api',
      action: 'Crear producto',
      details: `Producto "${name}" creado con precio $${price}`,
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
