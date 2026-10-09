import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { features } from '@/lib/config/site';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { newsletterSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';

/**
 * Newsletter sign-up. Stores only email + language. The response is the same
 * whether or not the address was already subscribed (no enumeration).
 */
export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!features.newsletter || !admin) return Response.json({ error: 'unavailable' }, { status: 503 });

  const limiter = rateLimit(`newsletter:${await clientKey()}`, 5, 10 * 60_000);
  if (!limiter.ok) return Response.json({ error: 'rate_limited' }, { status: 429 });

  const parsed = newsletterSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid' }, { status: 400 });

  const { email, locale } = parsed.data;
  const { data: existing } = await admin.from('newsletter_subscribers').select('id').eq('email', email).maybeSingle();
  const { error } = existing
    ? await admin.from('newsletter_subscribers').update({ status: 'subscribed', unsubscribed_at: null, locale }).eq('id', existing.id)
    : await admin.from('newsletter_subscribers').insert({ email, locale, source: 'website' });

  if (error) {
    logger.error('newsletter.subscribe_failed', { code: error.code });
    return Response.json({ error: 'failed' }, { status: 500 });
  }
  return Response.json({ ok: true });
}
