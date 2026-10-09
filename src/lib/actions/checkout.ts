'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSessionUser, requireUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createOrder, completeSandboxPayment, type CheckoutError } from '@/lib/orders/service';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { getLocale } from '@/i18n/server';
import { uuidSchema } from '@/lib/validation/schemas';
import type { CouponRejection } from '@/types';

export interface CheckoutFormState {
  error?: CheckoutError | 'terms' | 'rateLimited' | 'signIn' | 'empty';
  couponReason?: CouponRejection;
}

const placeOrderSchema = z.object({
  provider: z.enum(['stripe', 'sandbox']),
  terms: z.literal('on'),
  coupon: z.string().max(40).optional().default(''),
});

/**
 * Create a server-priced order from the signed-in user's cart and send them
 * to the payment provider. Prices and totals are never read from the form.
 */
export async function placeOrderAction(_: CheckoutFormState, formData: FormData): Promise<CheckoutFormState> {
  const user = await getSessionUser();
  const supabase = await createSupabaseServerClient();
  if (!user || !supabase) return { error: 'signIn' };
  if (!rateLimit(`checkout:${user.id}:${await clientKey()}`, 8, 60_000).ok) return { error: 'rateLimited' };

  const parsed = placeOrderSchema.safeParse({
    provider: formData.get('provider'),
    terms: formData.get('terms'),
    coupon: formData.get('coupon') ?? '',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.some((issue) => issue.path[0] === 'terms') ? 'terms' : 'generic' };
  }

  const { data: cart } = await supabase.from('cart_items').select('product_id').eq('user_id', user.id).order('added_at');
  const productIds = (cart ?? []).map((row) => String(row.product_id));
  if (!productIds.length) return { error: 'empty' };

  const result = await createOrder({
    user,
    productIds,
    couponCode: parsed.data.coupon,
    providerId: parsed.data.provider,
    locale: await getLocale(),
  });
  if (!result.ok) return { error: result.error, couponReason: result.couponReason };
  redirect(result.redirectUrl);
}

const sandboxSchema = z.object({
  order: uuidSchema,
  session: z.string().regex(/^sbx_[0-9a-f]{24}$/),
  outcome: z.enum(['success', 'failure']),
});

/** Development sandbox only — simulates the provider's verified webhook. */
export async function completeSandboxAction(formData: FormData): Promise<void> {
  const user = await requireUser('/checkout');
  const parsed = sandboxSchema.safeParse({
    order: formData.get('order'),
    session: formData.get('session'),
    outcome: formData.get('outcome'),
  });
  if (!parsed.success) redirect('/checkout');
  const outcome = await completeSandboxPayment({
    orderId: parsed.data.order,
    sessionId: parsed.data.session,
    outcome: parsed.data.outcome,
    userId: user.id,
  });
  if (outcome === 'forbidden') redirect('/checkout');
  redirect(
    parsed.data.outcome === 'success'
      ? `/checkout/success?order=${parsed.data.order}`
      : `/checkout/cancelled?order=${parsed.data.order}&failed=1`,
  );
}
