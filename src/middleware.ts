import { createServerClient as createSSR } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Role-based route protection
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin':     ['super_admin'],
  '/dashboard': ['super_admin', 'owner', 'manager'],
  '/builder':   ['super_admin', 'owner', 'manager'],
  '/pos':       ['super_admin', 'owner', 'manager', 'pos'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path needs protection
  const protectedPath = Object.keys(ROLE_ROUTES).find(route =>
    pathname.startsWith(route)
  );

  if (!protectedPath) {
    return NextResponse.next();
  }

  // If no Supabase env vars (local dev without credentials), skip auth
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('TU_PROJECT_ID')) {
    return NextResponse.next();
  }

  // Verify session
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createSSR(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return request.cookies.get(name)?.value; },
          set(name, value, options) { response.cookies.set({ name, value, ...options }); },
          remove(name, options) { response.cookies.set({ name, value: '', ...options }); },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'student';
    const allowedRoles = ROLE_ROUTES[protectedPath];

    if (!allowedRoles.includes(role)) {
      // Redirect to appropriate page based on role
      if (role === 'pos') return NextResponse.redirect(new URL('/pos', request.url));
      if (role === 'student') return NextResponse.redirect(new URL('/mi-cuenta', request.url));
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch {
    // If Supabase not configured yet, allow access (dev mode)
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/builder/:path*', '/pos/:path*'],
};
