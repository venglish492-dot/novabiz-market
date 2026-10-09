import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Coupon } from '@/types';

type Row = Record<string, unknown>;

export function mapCouponRow(row: Row): Coupon {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    id: String(row.id),
    code: String(row.code),
    type: row.type === 'fixed' ? 'fixed' : 'percent',
    amount: Number(row.amount),
    currency: typeof row.currency === 'string' ? row.currency.trim() : null,
    minOrderAmount: num(row.min_order_amount),
    productIds: Array.isArray(row.product_ids) ? (row.product_ids as string[]) : [],
    collectionIds: Array.isArray(row.collection_ids) ? (row.collection_ids as string[]) : [],
    startsAt: typeof row.starts_at === 'string' ? row.starts_at : null,
    expiresAt: typeof row.expires_at === 'string' ? row.expires_at : null,
    maxUses: num(row.max_uses),
    perUserLimit: num(row.per_user_limit),
    timesUsed: Number(row.times_used ?? 0),
    isActive: Boolean(row.is_active),
  };
}

/** Look up a coupon and how often this user redeemed it. Service-role client only. */
export async function findCoupon(
  admin: SupabaseClient,
  code: string,
  userId: string,
): Promise<{ coupon: Coupon | null; userRedemptions: number }> {
  const { data } = await admin.from('coupons').select('*').eq('code', code).maybeSingle();
  if (!data) return { coupon: null, userRedemptions: 0 };
  const coupon = mapCouponRow(data);
  const { count } = await admin
    .from('coupon_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_id', coupon.id)
    .eq('user_id', userId);
  return { coupon, userRedemptions: count ?? 0 };
}
