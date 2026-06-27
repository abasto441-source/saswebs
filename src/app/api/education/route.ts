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

    // Fetch schools
    const { data: schools, error: schError } = await supabase
      .from('education_schools')
      .select('*')
      .eq('tenant_id', tenantId);

    if (schError) throw schError;

    // Fetch members
    const { data: members, error: memError } = await supabase
      .from('education_members')
      .select('*')
      .eq('tenant_id', tenantId);

    if (memError) throw memError;

    return NextResponse.json({ schools: schools || [], members: members || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener datos educativos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, tenantId, school, member } = body;
    const supabase = createAdminClient();

    if (action === 'create_school') {
      const { name, address } = school;
      const { data, error } = await supabase.from('education_schools').insert({
        tenant_id: tenantId,
        name,
        address: address || null
      }).select().single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'create_member') {
      const { schoolId, name, email, role } = member;
      const { data, error } = await supabase.from('education_members').insert({
        tenant_id: tenantId,
        school_id: schoolId || null,
        name,
        email,
        role
      }).select().single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al procesar la solicitud académica' }, { status: 500 });
  }
}
