import 'server-only';
import { headers } from 'next/headers';

/**
 * In-memory sliding-window rate limiter.
 *
 * Limits are per server instance: on serverless platforms each instance keeps
 * its own window, so this blunts abuse (brute-force coupon guessing, review
 * spam, download hammering) rather than providing a global guarantee. For a
 * strict global limit, back this interface with Redis/Upstash.
 */

const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    const fresh = hits.filter((t) => now - t < windowMs);
    if (fresh.length) buckets.set(key, fresh);
    else buckets.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now, windowMs);
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    const retryAfterSeconds = Math.ceil((windowMs - (now - hits[0])) / 1000);
    buckets.set(key, hits);
    return { ok: false, retryAfterSeconds };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client identifier for rate limiting (not stored anywhere). */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || h.get('x-real-ip') || 'unknown';
}
