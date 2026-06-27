export const runtime = "edge";

import { createEdgeClient, createAdminEdgeClient } from "@/lib/supabase-edge";
import { getRoleRedirect, SYSTEM_ROLE_PERMISSIONS } from "@/lib/rbac";
import { NextResponse } from "next/server";

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    const responseHeaders = new Headers();
    const supabase = createEdgeClient(request, responseHeaders);
    const adminClient = createAdminEdgeClient();

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // Get user profile (primary role + tenant)
    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("role, tenant_id, name")
      .eq("id", userId)
      .single();

    const primaryRole = profile?.role || "guest";
    const tenantId = profile?.tenant_id || null;

    // Get all roles assigned to the user (from user_roles table)
    const { data: userRolesData } = await adminClient
      .from("user_roles")
      .select("role_id, scope, roles(slug)")
      .eq("user_id", userId)
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`);

    const allRoles: string[] = userRolesData?.length
      ? userRolesData
          .map((ur: any) => ur.roles?.slug || "")
          .filter(Boolean)
      : [primaryRole];

    // Get effective permissions from DB
    const { data: permsData } = await adminClient.rpc(
      "get_user_permissions",
      { p_user_id: userId }
    );

    // Fallback to hardcoded permissions if DB returns empty
    const effectivePermissions: string[] =
      permsData?.length
        ? permsData
        : (SYSTEM_ROLE_PERMISSIONS[primaryRole as keyof typeof SYSTEM_ROLE_PERMISSIONS] || []);

    const redirect = getRoleRedirect(primaryRole);

    // Build the response with cookies from Supabase session
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: userId,
          email: authData.user.email,
          name: profile?.name || email.split("@")[0],
          role: primaryRole,
          roles: allRoles,
          permissions: effectivePermissions,
          tenantId,
        },
        session: authData.session,
        redirect,
      },
      { status: 200 }
    );

    // Forward Set-Cookie headers from Supabase session
    responseHeaders.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        response.headers.append("Set-Cookie", value);
      }
    });

    return response;
  } catch (err) {
    console.error("[AUTH LOGIN ERROR]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
