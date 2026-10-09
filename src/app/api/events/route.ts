import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { features } from '@/lib/config/site';
import { getSessionUser } from '@/lib/auth/session';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { analyticsEventSchema } from '@/lib/validation/schemas';

/**
 * First-party analytics events (off unless NEXT_PUBLIC_FEATURE_ANALYTICS=true).
 * Stores event name, product, path and a random per-tab session id — no IP
 * addresses, no payment data, no free-form personal data.
 */
export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!features.analytics || !admin) return new Response(null, { status: 204 });

  const limiter = rateLimit(`events:${await clientKey()}`, 120, 60_000);
  if (!limiter.ok) return new Response(null, { status: 429 });

  const parsed = analyticsEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });

  const user = await getSessionUser();
  await admin.from('analytics_events').insert({
    name: parsed.data.name,
    product_id: parsed.data.productId ?? null,
    user_id: user?.id ?? null,
    session_id: parsed.data.sessionId ?? null,
    path: parsed.data.path ?? null,
    props: parsed.data.props ?? {},
  });
  return new Response(null, { status: 204 });
}
