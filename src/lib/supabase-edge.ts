import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Edge-compatible Supabase client that reads/writes cookies from a Request object.
 * Use this in Edge API routes and middleware (not next/headers).
 */
export function createEdgeClient(request: Request, responseHeaders?: Headers) {
  const headers = responseHeaders || new Headers();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        const cookieHeader = request.headers.get("cookie") || "";
        const match = cookieHeader
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith(`${name}=`));
        return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : undefined;
      },
      set(name: string, value: string, options: any) {
        const cookieParts = [
          `${name}=${encodeURIComponent(value)}`,
          options.path ? `Path=${options.path}` : "Path=/",
          options.httpOnly ? "HttpOnly" : "",
          options.secure ? "Secure" : "",
          options.sameSite ? `SameSite=${options.sameSite}` : "SameSite=Lax",
          options.maxAge ? `Max-Age=${options.maxAge}` : "",
        ]
          .filter(Boolean)
          .join("; ");
        headers.append("Set-Cookie", cookieParts);
      },
      remove(name: string, options: any) {
        const cookieParts = [
          `${name}=`,
          options.path ? `Path=${options.path}` : "Path=/",
          "Max-Age=0",
          "HttpOnly",
          "Secure",
          "SameSite=Lax",
        ]
          .filter(Boolean)
          .join("; ");
        headers.append("Set-Cookie", cookieParts);
      },
    },
  });
}

/**
 * Admin client with service_role key (bypasses RLS).
 * Safe for use in Edge API routes — does NOT need cookies.
 */
export function createAdminEdgeClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Extract bearer token from Authorization header.
 */
export function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

/**
 * Verify JWT and return user. For use in API routes that accept Bearer tokens.
 */
export async function verifyBearerToken(request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return user;
}
