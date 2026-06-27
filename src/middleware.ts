import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRoleRedirect } from "@/lib/rbac";

// Routes that require authentication (and minimum role)
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin":     ["super_platform_admin", "platform_admin", "support_engineer", "security_auditor", "billing_admin", "marketplace_admin", "developer", "devops", "observability_admin", "partner_manager"],
  "/dashboard": ["super_platform_admin", "platform_admin", "support_engineer", "owner", "co_owner", "general_manager", "administrator", "supervisor", "accountant", "cashier", "warehouse", "sales", "purchasing", "hr"],
  "/builder":   ["super_platform_admin", "platform_admin", "owner", "co_owner", "general_manager", "administrator"],
  "/pos":       ["super_platform_admin", "platform_admin", "owner", "co_owner", "general_manager", "administrator", "supervisor", "cashier"],
};

// Public routes — never block
const PUBLIC_ROUTES = ["/", "/login", "/api/auth", "/favicon.ico", "/_next"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes and static assets
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Skip if Supabase is not configured (dev mode without real credentials)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    supabaseUrl.includes("TU_PROJECT_ID") ||
    !supabaseKey
  ) {
    // Demo mode — allow all access
    return NextResponse.next();
  }

  // Check if this path needs protection
  const protectedPath = Object.keys(PROTECTED_ROUTES).find((route) =>
    pathname.startsWith(route)
  );

  if (!protectedPath) {
    return NextResponse.next();
  }

  // Build response so we can forward Set-Cookie headers
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    // Create Edge-compatible Supabase client using cookies
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Not authenticated — redirect to login
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Get user role from profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();

    const role = (profile as any)?.role || "guest";
    const allowedRoles = PROTECTED_ROUTES[protectedPath];

    // Role not allowed — redirect to appropriate home
    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(
        new URL(getRoleRedirect(role), request.url)
      );
    }

    // POS gate — check if tenant has POS enabled
    if (pathname.startsWith("/pos") && (profile as any)?.tenant_id) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("is_pos_enabled")
        .eq("id", (profile as any).tenant_id)
        .single();

      if (tenant && !tenant.is_pos_enabled) {
        return NextResponse.redirect(
          new URL("/dashboard?error=pos_disabled", request.url)
        );
      }
    }

    return response;
  } catch {
    // Supabase not reachable — allow in dev mode
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
