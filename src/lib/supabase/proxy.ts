import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { publicSupabase } from '@/lib/config/site';

/**
 * Refresh the Supabase session cookies for the incoming request and report
 * whether a (cryptographically verified) session exists.
 */
export async function updateSession(request: NextRequest): Promise<{ response: NextResponse; hasSession: boolean }> {
  let response = NextResponse.next({ request });
  if (!publicSupabase.configured) return { response, hasSession: false };

  const supabase = createServerClient(publicSupabase.url, publicSupabase.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // getClaims() validates the JWT (locally for asymmetric keys, otherwise via
  // the Auth server) and refreshes an expired session when possible.
  const { data } = await supabase.auth.getClaims();
  return { response, hasSession: Boolean(data?.claims?.sub) };
}
