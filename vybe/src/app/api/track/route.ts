import { headers as nextHeaders } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/session';
import { recordEvent } from '@/features/analytics/service';
import { clientIp, countryFromHeaders, deviceFromUserAgent, isBot, isSameOrigin } from '@/lib/security/request';
import { rateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ok = () => new Response(null, { status: 204 });

/** Analytics beacon. Always answers 204 so it never affects the visitor's page. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return ok();
  const h = await nextHeaders();
  const ua = h.get('user-agent');
  if (isBot(ua)) return ok();

  let body: { p?: unknown; t?: unknown; id?: unknown; r?: unknown };
  try {
    const text = await request.text();
    if (text.length > 2000) return ok();
    body = JSON.parse(text);
  } catch {
    return ok();
  }
  const type = body.t === 'view' || body.t === 'click' || body.t === 'widget' ? body.t : null;
  if (!type || typeof body.p !== 'string' || !UUID.test(body.p)) return ok();
  const targetId = typeof body.id === 'string' && UUID.test(body.id) ? body.id.toLowerCase() : null;
  const referrerHost = typeof body.r === 'string' && /^[a-z0-9.-]{1,100}$/i.test(body.r) ? body.r.toLowerCase() : null;

  const ip = await clientIp();
  const limit = await rateLimit(`track:${ip}`, 240, 60);
  if (!limit.ok) return ok();

  const user = await getCurrentUser();
  await recordEvent({
    profileId: body.p.toLowerCase(),
    type,
    targetId,
    referrerHost,
    device: deviceFromUserAgent(ua),
    country: countryFromHeaders(h),
    ip,
    userAgent: ua ?? '',
    viewerUserId: user?.id ?? null,
    limitedTracking: h.get('sec-gpc') === '1' || h.get('dnt') === '1',
  }).catch(() => null);
  return ok();
}
