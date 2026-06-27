export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId es requerido' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: leads, error } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ leads: leads || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener prospectos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, tenantId, lead } = body;
    const supabase = createAdminClient();

    if (action === 'create_lead') {
      const { name, company, email, phone, value, stage } = lead;
      const { data, error } = await supabase.from('crm_leads').insert({
        tenant_id: tenantId,
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        value: value || 0,
        stage: stage || 'prospect'
      }).select().single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'update_stage') {
      const { id, stage } = lead;
      const { data, error } = await supabase
        .from('crm_leads')
        .update({ stage })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'delete_lead') {
      const { id } = lead;
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en operación CRM' }, { status: 500 });
  }
}
