import 'server-only';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Fixed-window rate limiter backed by the database, so limits hold across
 * every server instance. Fails open (logs) if the database is unreachable —
 * the action itself will fail anyway in that case.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; retryAfter: number }> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  try {
    const db = await getDb();
    const row = await db.one<{ count: number }>(
      `insert into rate_limits (key, window_start, count) values ($1, $2, 1)
       on conflict (key, window_start) do update set count = rate_limits.count + 1
       returning count`,
      [key, windowStart],
    );
    // Opportunistic cleanup of expired windows (~1% of calls).
    if (Math.random() < 0.01) await db.query(`delete from rate_limits where window_start < now() - interval '1 day'`);
    const count = row?.count ?? 0;
    const retryAfter = Math.ceil((windowStart.getTime() + windowMs - now) / 1000);
    return { ok: count <= limit, retryAfter };
  } catch (error) {
    logger.warn('rate_limit.unavailable', { error });
    return { ok: true, retryAfter: 0 };
  }
}
