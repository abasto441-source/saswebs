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

    const { data: tickets, error } = await supabase
      .from('helpdesk_tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tickets: tickets || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener tickets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, tenantId, ticket } = body;
    const supabase = createAdminClient();

    if (action === 'create_ticket') {
      const { customerName, customerEmail, subject, description, priority } = ticket;
      const { data, error } = await supabase.from('helpdesk_tickets').insert({
        tenant_id: tenantId,
        customer_name: customerName,
        customer_email: customerEmail,
        subject,
        description,
        priority: priority || 'medium',
        status: 'open'
      }).select().single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'update_status') {
      const { id, status } = ticket;
      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en operación HelpDesk' }, { status: 500 });
  }
}
