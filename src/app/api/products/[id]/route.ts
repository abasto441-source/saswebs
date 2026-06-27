export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// PUT /api/products/[id] — update product
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, price, stock, barcode, imageUrl, category, tenantId } = body;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('products')
      .update({
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price: Number(price) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(barcode !== undefined && { barcode }),
        ...(imageUrl !== undefined && { image_url: imageUrl }),
        ...(category !== undefined && { category }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    if (tenantId) {
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        user_id: 'api',
        action: 'Actualizar producto',
        details: `Producto ${params.id} actualizado`,
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const supabase = createAdminClient();

    const { error } = await supabase.from('products').delete().eq('id', params.id);
    if (error) throw error;

    if (tenantId) {
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        user_id: 'api',
        action: 'Eliminar producto',
        details: `Producto ${params.id} eliminado`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
