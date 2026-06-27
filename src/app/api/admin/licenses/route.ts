export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('reseller_licenses')
      .select('*')
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener licencias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partnerId, tenantId, planTier, seats } = body;

    if (!partnerId || !tenantId || !planTier) {
      return NextResponse.json({ error: 'Socio, inquilino y plan son obligatorios' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('reseller_licenses')
      .insert({
        partner_id: partnerId,
        tenant_id: tenantId,
        plan_tier: planTier,
        seats: Number(seats) || 5,
        is_oem: true,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger update on tenant plan tier
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({ plan: planTier })
      .eq('id', tenantId);

    if (tenantError) throw tenantError;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al crear licencia' }, { status: 500 });
  }
}
