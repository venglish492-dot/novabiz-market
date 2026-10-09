import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { publicSupabase } from '@/lib/config/site';
import type { Review } from '@/types';

/** Approved, verified-purchase reviews only. Empty when Supabase is not configured. */
export async function getApprovedReviews(productId?: string, limit = 20): Promise<Review[]> {
  if (!publicSupabase.configured) return [];
  const supabase = createClient(publicSupabase.url, publicSupabase.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let query = supabase
    .from('reviews')
    .select('id, product_id, author_name, rating, title, body, verified_purchase, created_at')
    .eq('status', 'approved')
    .eq('verified_purchase', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (productId) query = query.eq('product_id', productId);
  const { data } = await query;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    productId: String(row.product_id),
    authorName: String(row.author_name),
    rating: Number(row.rating),
    title: (row.title as string | null) ?? null,
    body: String(row.body),
    verifiedPurchase: Boolean(row.verified_purchase),
    createdAt: String(row.created_at),
  }));
}
