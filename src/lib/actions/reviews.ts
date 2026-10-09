'use server';

import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { features } from '@/lib/config/site';
import { rateLimit } from '@/lib/rate-limit';
import { reviewSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';

export interface ReviewFormState {
  ok?: boolean;
  error?: 'signIn' | 'notOwner' | 'invalid' | 'alreadyReviewed' | 'rateLimited' | 'generic';
}

/**
 * Submit a review. Inserted with the user's own session, so the database
 * enforces ownership (RLS) and forces `pending` status; `verified_purchase`
 * is set by a trigger from real entitlements.
 */
export async function submitReviewAction(_: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  if (!features.reviews) return { error: 'generic' };
  const user = await getSessionUser();
  const supabase = await createSupabaseServerClient();
  if (!user || !supabase) return { error: 'signIn' };
  if (!rateLimit(`review:${user.id}`, 5, 60 * 60_000).ok) return { error: 'rateLimited' };

  const parsed = reviewSchema.safeParse({
    productId: formData.get('productId'),
    rating: formData.get('rating'),
    title: formData.get('title') ?? '',
    body: formData.get('body'),
  });
  if (!parsed.success) return { error: 'invalid' };

  const { error } = await supabase.from('reviews').insert({
    product_id: parsed.data.productId,
    user_id: user.id,
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    body: parsed.data.body,
    author_name: user.name?.trim() || (user.email.split('@')[0] ?? 'Customer').slice(0, 1).toUpperCase() + '.',
  });

  if (error) {
    if (error.code === '23505') return { error: 'alreadyReviewed' };
    if (error.code === '42501') return { error: 'notOwner' };
    logger.error('review.insert_failed', { code: error.code });
    return { error: 'generic' };
  }
  return { ok: true };
}
