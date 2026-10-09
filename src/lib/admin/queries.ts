import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { publicSupabase } from '@/lib/config/site';
import { serverConfig } from '@/lib/config/server';
import { PRODUCT_SELECT, COLLECTION_SELECT, mapCategoryRow, mapCollectionRow, mapProductRow } from '@/lib/catalog/mappers';
import type { Category, Collection, Product } from '@/types';

/*
 * Admin reads run with the signed-in staff member's session; RLS grants staff
 * and admins visibility (including drafts). All metrics are computed from real
 * rows — nothing is estimated or padded.
 */

async function db() {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error('Supabase is not configured');
  return client;
}

const ctx = () => ({ supabaseUrl: publicSupabase.url, mediaBucket: serverConfig.storage.mediaBucket });

export async function adminProducts(): Promise<Product[]> {
  const { data } = await (await db()).from('products').select(PRODUCT_SELECT).order('sort_order').order('created_at', { ascending: false });
  return (data ?? []).map((row) => mapProductRow(row, ctx()));
}

export async function adminProduct(id: string) {
  const client = await db();
  const [{ data: product }, { data: files }, { data: images }, { data: memberships }] = await Promise.all([
    client.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle(),
    client.from('product_files').select('*').eq('product_id', id).order('created_at', { ascending: false }),
    client.from('product_images').select('*').eq('product_id', id).order('sort_order'),
    client.from('collection_products').select('collection_id').eq('product_id', id),
  ]);
  return {
    product: product ? mapProductRow(product, ctx()) : null,
    raw: product as Record<string, unknown> | null,
    files: (files ?? []) as Array<Record<string, unknown>>,
    images: (images ?? []) as Array<Record<string, unknown>>,
    collectionIds: (memberships ?? []).map((m) => String(m.collection_id)),
  };
}

export async function adminCategories(): Promise<Array<Category & { isActive: boolean }>> {
  const { data } = await (await db()).from('categories').select('*').order('sort_order');
  return (data ?? []).map((row) => ({ ...mapCategoryRow(row), isActive: Boolean(row.is_active) }));
}

export async function adminCollections(): Promise<Array<Collection & { isPublished: boolean }>> {
  const { data } = await (await db()).from('collections').select(COLLECTION_SELECT).order('sort_order');
  return (data ?? []).map((row) => ({ ...mapCollectionRow(row), isPublished: Boolean(row.is_published) }));
}

export async function adminOverview() {
  const client = await db();
  const [paid, refunded, downloads, recent, items, pendingReviews, published, begin, success] = await Promise.all([
    client.from('orders').select('total_amount, currency').eq('status', 'paid').eq('is_test', false),
    client.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'refunded').eq('is_test', false),
    client.from('downloads').select('id', { count: 'exact', head: true }).eq('status', 'success'),
    client.from('orders').select('id, order_number, email, status, total_amount, currency, is_test, created_at').order('created_at', { ascending: false }).limit(8),
    client.from('order_items').select('product_id, title_snapshot, order:orders!inner(status, is_test)').eq('order.status', 'paid').eq('order.is_test', false),
    client.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    client.from('products').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    client.from('analytics_events').select('id', { count: 'exact', head: true }).eq('name', 'begin_checkout'),
    client.from('analytics_events').select('id', { count: 'exact', head: true }).eq('name', 'payment_success'),
  ]);

  const revenueByCurrency = new Map<string, number>();
  for (const row of paid.data ?? []) {
    const currency = String(row.currency).trim();
    revenueByCurrency.set(currency, Math.round(((revenueByCurrency.get(currency) ?? 0) + Number(row.total_amount)) * 100) / 100);
  }
  const productSales = new Map<string, { title: Record<string, string>; count: number }>();
  for (const row of (items.data ?? []) as Array<Record<string, unknown>>) {
    const id = String(row.product_id);
    const current = productSales.get(id) ?? { title: row.title_snapshot as Record<string, string>, count: 0 };
    current.count += 1;
    productSales.set(id, current);
  }

  return {
    paidCount: paid.data?.length ?? 0,
    revenueByCurrency: [...revenueByCurrency.entries()],
    refundCount: refunded.count ?? 0,
    downloadCount: downloads.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0,
    publishedProducts: published.count ?? 0,
    checkoutsStarted: begin.count ?? 0,
    paymentsSucceeded: success.count ?? 0,
    recentOrders: (recent.data ?? []) as Array<Record<string, unknown>>,
    topProducts: [...productSales.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 5),
  };
}

export async function adminOrders(status?: string) {
  let query = (await db())
    .from('orders')
    .select('id, order_number, email, status, total_amount, currency, provider, is_test, coupon_code, created_at, paid_at, items:order_items(title_snapshot)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status) query = query.eq('status', status);
  const { data } = await query;
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function adminPayments() {
  const client = await db();
  const [{ data: payments }, { data: events }] = await Promise.all([
    client.from('payments').select('id, provider, provider_session_id, provider_payment_id, status, amount, currency, failure_reason, created_at, order:orders(order_number)').order('created_at', { ascending: false }).limit(200),
    client.from('payment_events').select('id, provider, event_id, event_type, received_at, processed_at').order('received_at', { ascending: false }).limit(100),
  ]);
  return { payments: (payments ?? []) as Array<Record<string, unknown>>, events: (events ?? []) as Array<Record<string, unknown>> };
}

export async function adminCustomers() {
  const client = await db();
  const [{ data: profiles }, { data: orders }] = await Promise.all([
    client.from('profiles').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }).limit(500),
    client.from('orders').select('user_id').eq('status', 'paid'),
  ]);
  const counts = new Map<string, number>();
  for (const row of orders ?? []) counts.set(String(row.user_id), (counts.get(String(row.user_id)) ?? 0) + 1);
  return (profiles ?? []).map((p) => ({ ...p, paidOrders: counts.get(String(p.id)) ?? 0 })) as Array<Record<string, unknown> & { paidOrders: number }>;
}

export async function adminReviews() {
  const { data } = await (await db())
    .from('reviews')
    .select('id, rating, title, body, author_name, status, verified_purchase, created_at, product:products(slug, title)')
    .order('created_at', { ascending: false })
    .limit(300);
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function adminCoupons() {
  const { data } = await (await db()).from('coupons').select('*').order('created_at', { ascending: false });
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function adminFiles() {
  const { data } = await (await db())
    .from('product_files')
    .select('id, kind, file_name, size_bytes, version, is_current, external_url, created_at, product:products(id, slug, title)')
    .order('created_at', { ascending: false })
    .limit(500);
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function adminAnalytics() {
  const client = await db();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await client.from('analytics_events').select('name, product_id').gte('created_at', since).limit(50000);
  const counts = new Map<string, number>();
  const views = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(String(row.name), (counts.get(String(row.name)) ?? 0) + 1);
    if (row.name === 'product_view' && row.product_id) views.set(String(row.product_id), (views.get(String(row.product_id)) ?? 0) + 1);
  }
  return { counts, views };
}

export async function adminPosts() {
  const { data } = await (await db()).from('blog_posts').select('*').order('updated_at', { ascending: false });
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function adminAudit() {
  const { data } = await (await db()).from('audit_logs').select('*').order('created_at', { ascending: false }).limit(300);
  return (data ?? []) as Array<Record<string, unknown>>;
}
