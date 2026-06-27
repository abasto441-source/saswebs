export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('partners_resellers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener socios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, tier } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y correo son obligatorios' }, { status: 400 });
    }

    const commissionRate = tier === 'Gold' ? 0.3 : tier === 'Silver' ? 0.2 : 0.1;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('partners_resellers')
      .insert({
        name,
        email,
        tier: tier || 'Bronze',
        commission_rate: commissionRate
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al crear socio' }, { status: 500 });
  }
}
