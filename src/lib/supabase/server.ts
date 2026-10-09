import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicSupabase } from '@/lib/config/site';

/**
 * Supabase client bound to the current request's auth cookies.
 * Queries run as the signed-in user, so Row Level Security applies.
 * Returns null when Supabase is not configured.
 */
export async function createSupabaseServerClient() {
  if (!publicSupabase.configured) return null;
  const cookieStore = await cookies();

  return createServerClient(publicSupabase.url, publicSupabase.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session cookies on the next request.
        }
      },
    },
  });
}
