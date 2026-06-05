import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const supabase = createServerClient();
    const adminSupabase = createAdminClient();

    // Sign in with Supabase Auth (this sets the session cookies)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Get user profile with role using admin client (bypasses RLS during login transition)
    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('role, tenant_id, name')
      .eq('id', authData.user.id)
      .single();

    const role = profile?.role || 'student';
    const tenantId = profile?.tenant_id;

    // Role → redirect mapping
    const redirectMap: Record<string, string> = {
      super_admin: '/admin',
      owner:       '/dashboard',
      manager:     '/dashboard',
      pos:         '/pos',
      student:     '/mi-cuenta',
    };

    const redirect = redirectMap[role] || '/dashboard';

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.name || email.split('@')[0],
        role,
        tenantId,
      },
      session: authData.session,
      redirect,
    });
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
