import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { serverConfig } from '@/lib/config/server';

let adminClient: SupabaseClient | null = null;

/**
 * Privileged client using the secret (service-role) key. It bypasses Row Level
 * Security, so it is only used on the server, after the caller's identity and
 * permissions have been verified explicitly (order creation, payment webhooks,
 * signed download URLs). Never expose this client or its key to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!serverConfig.supabase.adminConfigured) return null;
  adminClient ??= createClient(serverConfig.supabase.url, serverConfig.supabase.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return adminClient;
}
