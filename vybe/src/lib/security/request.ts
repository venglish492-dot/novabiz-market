import 'server-only';
import { headers } from 'next/headers';
import { env } from '@/lib/env';

/** Best-effort client address used only as a rate-limit key; never stored. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
}

/**
 * CSRF defence for route handlers that change state. Server Actions already
 * verify Origin; route handlers check it here. Requests without an Origin
 * (old browsers, sendBeacon in some engines) fall back to Sec-Fetch-Site.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (origin) {
    try {
      const o = new URL(origin);
      if (host && o.host === host) return true;
      return o.origin === new URL(env.siteUrl).origin;
    } catch {
      return false;
    }
  }
  const site = request.headers.get('sec-fetch-site');
  return site === 'same-origin' || site === 'none';
}

export function deviceFromUserAgent(ua: string | null): 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown' {
  if (!ua) return 'unknown';
  if (isBot(ua)) return 'bot';
  if (/ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function isBot(ua: string | null): boolean {
  if (!ua) return true;
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora|pinterest|vkshare|whatsapp|telegram|discord|headless|lighthouse|curl|wget|python-requests|httpclient/i.test(
    ua,
  );
}

/** Two-letter country from a trusted edge header, when the host provides one. */
export function countryFromHeaders(h: Headers): string | null {
  const value = h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || h.get('x-country-code');
  return value && /^[A-Z]{2}$/.test(value) && value !== 'XX' && value !== 'T1' ? value : null;
}
