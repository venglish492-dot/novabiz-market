import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { serverConfig } from '@/lib/config/server';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { uuidSchema } from '@/lib/validation/schemas';

/**
 * Secure delivery of purchased files.
 *
 *   GET /api/download?file=<product_file_id>
 *
 * 1. Requires a verified session (no anonymous or token-in-URL access).
 * 2. Resolves the file server-side; the client never supplies a storage path.
 * 3. Requires an unrevoked entitlement for the file's product owned by the caller.
 * 4. Applies per-user rate and daily limits.
 * 5. Issues a short-lived signed URL for the private bucket and redirects to it.
 * Every attempt is logged (without IP addresses).
 */

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0', 'Referrer-Policy': 'no-referrer' };

function json(status: number, error: string, extraHeaders: Record<string, string> = {}) {
  return Response.json({ error }, { status, headers: { ...NO_STORE, ...extraHeaders } });
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return json(401, 'unauthorized');

  // `mode=json` lets the library UI handle errors gracefully instead of navigating.
  const asJson = request.nextUrl.searchParams.get('mode') === 'json';
  const deliver = (location: string) =>
    asJson
      ? Response.json({ url: location }, { headers: NO_STORE })
      : new Response(null, { status: 302, headers: { ...NO_STORE, Location: location } });

  const parsed = uuidSchema.safeParse(request.nextUrl.searchParams.get('file'));
  if (!parsed.success) return json(400, 'invalid_file');
  const fileId = parsed.data;

  const admin = getSupabaseAdmin();
  if (!admin) return json(503, 'unavailable');

  const burst = rateLimit(`download:${user.id}`, 20, 60_000);
  if (!burst.ok) return json(429, 'rate_limited', { 'Retry-After': String(burst.retryAfterSeconds) });

  const userAgent = request.headers.get('user-agent')?.slice(0, 300) ?? null;
  const log = (status: 'success' | 'denied' | 'error', extra: { productId?: string; orderId?: string | null; reason?: string }) =>
    admin.from('downloads').insert({
      user_id: user.id,
      product_id: extra.productId ?? null,
      file_id: status === 'success' || extra.productId ? fileId : null,
      order_id: extra.orderId ?? null,
      status,
      reason: extra.reason ?? null,
      user_agent: userAgent,
    });

  const { data: file } = await admin
    .from('product_files')
    .select('id, product_id, kind, storage_path, external_url, file_name')
    .eq('id', fileId)
    .maybeSingle();
  if (!file) {
    await log('denied', { reason: 'file_not_found' });
    return json(404, 'not_found');
  }

  const { data: entitlement } = await admin
    .from('entitlements')
    .select('order_id')
    .eq('user_id', user.id)
    .eq('product_id', file.product_id)
    .is('revoked_at', null)
    .order('granted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!entitlement) {
    await log('denied', { productId: file.product_id, reason: 'not_owner' });
    logger.warn('download.denied', { userId: user.id, fileId });
    return json(403, 'forbidden');
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('downloads')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('product_id', file.product_id)
    .eq('status', 'success')
    .gte('created_at', since);
  if ((count ?? 0) >= serverConfig.storage.dailyDownloadLimit) {
    await log('denied', { productId: file.product_id, orderId: entitlement.order_id, reason: 'daily_limit' });
    return json(429, 'daily_limit');
  }

  if (file.kind === 'external_link' && file.external_url) {
    await log('success', { productId: file.product_id, orderId: entitlement.order_id });
    return deliver(file.external_url);
  }

  if (!file.storage_path) {
    await log('error', { productId: file.product_id, orderId: entitlement.order_id, reason: 'missing_path' });
    return json(404, 'not_found');
  }

  const { data: signed, error } = await admin.storage
    .from(serverConfig.storage.filesBucket)
    .createSignedUrl(file.storage_path, serverConfig.storage.downloadUrlTtlSeconds, {
      download: file.file_name || true,
    });
  if (error || !signed?.signedUrl) {
    await log('error', { productId: file.product_id, orderId: entitlement.order_id, reason: 'sign_failed' });
    logger.error('download.sign_failed', { fileId, message: error?.message });
    return json(502, 'unavailable');
  }

  await log('success', { productId: file.product_id, orderId: entitlement.order_id });
  return deliver(signed.signedUrl);
}
