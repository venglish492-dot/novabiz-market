'use server';

import { getCatalog } from '@/lib/catalog/repository';
import { toProductSummary, type ProductSummary } from '@/lib/catalog/summary';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { productIdsSchema, uuidSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';

/*
 * Cart and wishlist persistence. Guests keep both in local storage; signed-in
 * users additionally persist them in Supabase (RLS: own rows only), and the
 * guest state is merged into the account on sign-in.
 */

function validIds(ids: unknown): string[] {
  const parsed = productIdsSchema.safeParse(Array.isArray(ids) ? ids.slice(0, 50) : []);
  return parsed.success ? [...new Set(parsed.data)] : [];
}

/** Current, published product data for display. Unknown or unpublished IDs are dropped. */
export async function getProductSummariesAction(ids: string[]): Promise<ProductSummary[]> {
  const wanted = validIds(ids);
  if (!wanted.length) return [];
  const { products, categories } = await getCatalog();
  const byId = new Map(products.map((p) => [p.id, p]));
  return wanted
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => toProductSummary(p, categories));
}

type ListTable = 'cart_items' | 'wishlist_items';

async function syncList(table: ListTable, localIds: string[]): Promise<string[] | null> {
  const user = await getSessionUser();
  const supabase = await createSupabaseServerClient();
  if (!user || !supabase) return null;

  const { products } = await getCatalog();
  const published = new Set(products.map((p) => p.id));
  const toInsert = validIds(localIds).filter((id) => published.has(id));

  if (toInsert.length) {
    const { error } = await supabase
      .from(table)
      .upsert(
        toInsert.map((product_id) => ({ user_id: user.id, product_id })),
        { onConflict: 'user_id,product_id', ignoreDuplicates: true },
      );
    if (error) logger.warn('list.sync_failed', { table, code: error.code });
  }

  const orderColumn = table === 'cart_items' ? 'added_at' : 'created_at';
  const { data } = await supabase.from(table).select('product_id').eq('user_id', user.id).order(orderColumn);
  return (data ?? []).map((row) => String(row.product_id)).filter((id) => published.has(id));
}

async function setListItem(table: ListTable, productId: string, present: boolean): Promise<boolean> {
  const user = await getSessionUser();
  const supabase = await createSupabaseServerClient();
  const parsed = uuidSchema.safeParse(productId);
  if (!user || !supabase || !parsed.success) return false;
  const { error } = present
    ? await supabase
        .from(table)
        .upsert({ user_id: user.id, product_id: parsed.data }, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
    : await supabase.from(table).delete().eq('user_id', user.id).eq('product_id', parsed.data);
  if (error) logger.warn('list.update_failed', { table, code: error.code });
  return !error;
}

/** Merge the guest cart into the account and return the account cart. Null for guests. */
export async function syncCartAction(localIds: string[]): Promise<string[] | null> {
  return syncList('cart_items', localIds);
}

export async function setCartItemAction(productId: string, inCart: boolean): Promise<boolean> {
  return setListItem('cart_items', productId, inCart);
}

export async function clearCartAction(): Promise<boolean> {
  const user = await getSessionUser();
  const supabase = await createSupabaseServerClient();
  if (!user || !supabase) return false;
  const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
  return !error;
}

export async function syncWishlistAction(localIds: string[]): Promise<string[] | null> {
  return syncList('wishlist_items', localIds);
}

export async function setWishlistItemAction(productId: string, saved: boolean): Promise<boolean> {
  return setListItem('wishlist_items', productId, saved);
}
