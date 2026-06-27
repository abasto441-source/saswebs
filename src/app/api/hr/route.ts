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

    const { data: employees, error } = await supabase
      .from('hr_employees')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ employees: employees || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener empleados' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, tenantId, employee } = body;
    const supabase = createAdminClient();

    if (action === 'create_employee') {
      const { firstName, lastName, email, role, salary, hireDate } = employee;
      const { data, error } = await supabase.from('hr_employees').insert({
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        email,
        role,
        salary: salary || 0,
        hire_date: hireDate || null,
        status: 'active'
      }).select().single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'update_status') {
      const { id, status } = employee;
      const { data, error } = await supabase
        .from('hr_employees')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en operación de Recursos Humanos' }, { status: 500 });
  }
}
