import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// POST /api/auth/register  
export async function POST(request: Request) {
  try {
    const { email, password, name, companyName, subdomain, plan, businessType } = await request.json();

    if (!email || !password || !companyName || !subdomain) {
      return NextResponse.json({ error: 'Campos requeridos incompletos' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Check subdomain availability
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'El subdominio ya está en uso. Elige otro.' },
        { status: 409 }
      );
    }

    // 2. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Error al crear usuario' }, { status: 400 });
    }

    // 3. Create tenant
    const tenantId = 't-' + Date.now();
    const { error: tenantError } = await supabase.from('tenants').insert({
      id: tenantId,
      name: companyName,
      subdomain: subdomain.toLowerCase().trim(),
      plan: plan || 'Pro',
      status: 'active',
      is_lms_enabled: businessType === 'education',
      is_ecommerce_enabled: true,
      is_pos_enabled: true,
      is_reservas_enabled: false,
    });

    if (tenantError) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Error al crear el tenant' }, { status: 500 });
    }

    // 4. Create user profile with owner role
    await supabase.from('user_profiles').insert({
      id: authData.user.id,
      tenant_id: tenantId,
      role: 'owner',
      name: name || companyName,
    });

    // 5. Audit log
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: email,
      action: 'Registro de nuevo inquilino',
      details: `Empresa: ${companyName}, Plan: ${plan || 'Pro'}, Subdominio: ${subdomain}`,
      ip: '0.0.0.0',
    });

    return NextResponse.json({
      success: true,
      tenantId,
      message: `¡Empresa "${companyName}" registrada con éxito!`,
      redirect: '/dashboard',
    });

  } catch (err) {
    console.error('[AUTH REGISTER ERROR]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
