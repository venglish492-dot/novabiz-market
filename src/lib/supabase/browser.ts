'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { publicSupabase } from '@/lib/config/site';

let browserClient: SupabaseClient | null = null;

/** Browser client (publishable key only). Used for direct-to-storage admin uploads. */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!publicSupabase.configured) return null;
  browserClient ??= createBrowserClient(publicSupabase.url, publicSupabase.publishableKey);
  return browserClient;
}
