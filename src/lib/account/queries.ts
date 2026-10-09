import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { publicSupabase } from '@/lib/config/site';
import { serverConfig } from '@/lib/config/server';
import { PRODUCT_SELECT, asLocalized, mapProductRow } from '@/lib/catalog/mappers';
import type { LocalizedText } from '@/i18n/config';
import type { LicenseTier, OrderStatus, Product } from '@/types';

/*
 * Customer data access. Ownership-scoped reads use the user's own session
 * (RLS enforces `user_id = auth.uid()`); product details for owned items are
 * then loaded with the server key, because an owned product may have been
 * unpublished since the purchase.
 */

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  provider: string | null;
  isTest: boolean;
  createdAt: string;
  paidAt: string | null;
  items: Array<{ productId: string; title: LocalizedText; unitAmount: number; discountAmount: number; license: LicenseTier; version: string }>;
}

export interface LibraryFile {
  id: string;
  kind: 'download' | 'documentation' | 'external_link';
  label: LocalizedText;
  fileName: string | null;
  sizeBytes: number | null;
  version: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface LibraryItem {
  product: Product;
  license: LicenseTier;
  orderId: string;
  orderNumber: string;
  purchasedAt: string;
  isTest: boolean;
  files: LibraryFile[];
}

type Row = Record<string, unknown>;

function mapOrder(row: Row): OrderSummary {
  const items = Array.isArray(row.items) ? (row.items as Row[]) : [];
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    status: row.status as OrderStatus,
    currency: String(row.currency).trim(),
    subtotal: Number(row.subtotal_amount),
    discount: Number(row.discount_amount),
    total: Number(row.total_amount),
    couponCode: (row.coupon_code as string | null) ?? null,
    provider: (row.provider as string | null) ?? null,
    isTest: Boolean(row.is_test),
    createdAt: String(row.created_at),
    paidAt: (row.paid_at as string | null) ?? null,
    items: items.map((item) => ({
      productId: String(item.product_id),
      title: asLocalized(item.title_snapshot),
      unitAmount: Number(item.unit_amount),
      discountAmount: Number(item.discount_amount),
      license: item.license_tier as LicenseTier,
      version: String(item.version_at_purchase),
    })),
  };
}

const ORDER_SELECT =
  'id, order_number, status, currency, subtotal_amount, discount_amount, total_amount, coupon_code, provider, is_test, created_at, paid_at, items:order_items(product_id, title_snapshot, unit_amount, discount_amount, license_tier, version_at_purchase)';

export async function getOrders(limit = 50): Promise<OrderSummary[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('orders').select(ORDER_SELECT).order('created_at', { ascending: false }).limit(limit);
  return (data ?? []).map(mapOrder);
}

/** A single order, only if it belongs to the signed-in user (RLS). */
export async function getOrder(orderId: string): Promise<OrderSummary | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from('orders').select(ORDER_SELECT).eq('id', orderId).maybeSingle();
  return data ? mapOrder(data) : null;
}

export async function getLibrary(userId: string): Promise<LibraryItem[]> {
  const supabase = await createSupabaseServerClient();
  const admin = getSupabaseAdmin();
  if (!supabase || !admin) return [];

  const { data: entitlements } = await supabase
    .from('entitlements')
    .select('product_id, license_tier, granted_at, order:orders(id, order_number, is_test, created_at)')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .order('granted_at', { ascending: false });
  if (!entitlements?.length) return [];

  // One library entry per product (most recent purchase wins).
  const byProduct = new Map<string, Row>();
  for (const entitlement of entitlements as Row[]) {
    if (!byProduct.has(String(entitlement.product_id))) byProduct.set(String(entitlement.product_id), entitlement);
  }
  const productIds = [...byProduct.keys()];

  const [{ data: productRows }, { data: fileRows }] = await Promise.all([
    admin.from('products').select(PRODUCT_SELECT).in('id', productIds),
    supabase
      .from('product_files')
      .select('id, product_id, kind, label, file_name, size_bytes, version, is_current, created_at')
      .in('product_id', productIds)
      .order('created_at', { ascending: false }),
  ]);

  const ctx = { supabaseUrl: publicSupabase.url, mediaBucket: serverConfig.storage.mediaBucket };
  const products = new Map((productRows ?? []).map((row) => [String(row.id), mapProductRow(row, ctx)]));

  return productIds
    .map((productId): LibraryItem | null => {
      const product = products.get(productId);
      const entitlement = byProduct.get(productId);
      if (!product || !entitlement) return null;
      const order = (entitlement.order ?? {}) as Row;
      return {
        product,
        license: entitlement.license_tier as LicenseTier,
        orderId: String(order.id),
        orderNumber: String(order.order_number ?? ''),
        purchasedAt: String(entitlement.granted_at),
        isTest: Boolean(order.is_test),
        files: ((fileRows ?? []) as Row[])
          .filter((file) => file.product_id === productId)
          .map((file) => ({
            id: String(file.id),
            kind: file.kind as LibraryFile['kind'],
            label: asLocalized(file.label),
            fileName: (file.file_name as string | null) ?? null,
            sizeBytes: file.size_bytes === null ? null : Number(file.size_bytes),
            version: String(file.version),
            isCurrent: Boolean(file.is_current),
            createdAt: String(file.created_at),
          })),
      };
    })
    .filter((item): item is LibraryItem => Boolean(item));
}

export async function getOwnedProductIdsForUser(userId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('entitlements').select('product_id').eq('user_id', userId).is('revoked_at', null);
  return [...new Set((data ?? []).map((row) => String(row.product_id)))];
}

export interface DownloadRecord {
  id: string;
  status: 'success' | 'denied' | 'error';
  createdAt: string;
  productTitle: LocalizedText | null;
  fileName: string | null;
}

export async function getDownloadHistory(): Promise<DownloadRecord[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('downloads')
    .select('id, status, created_at, product:products(title), file:product_files(file_name)')
    .order('created_at', { ascending: false })
    .limit(100);
  return ((data ?? []) as Row[]).map((row) => {
    const product = row.product as Row | null;
    const file = row.file as Row | null;
    return {
      id: String(row.id),
      status: row.status as DownloadRecord['status'],
      createdAt: String(row.created_at),
      productTitle: product ? asLocalized(product.title) : null,
      fileName: (file?.file_name as string | undefined) ?? null,
    };
  });
}

export async function getProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('full_name, email, locale, marketing_opt_in, created_at')
    .eq('id', userId)
    .maybeSingle();
  return data
    ? {
        fullName: (data.full_name as string | null) ?? '',
        email: String(data.email),
        locale: String(data.locale),
        marketingOptIn: Boolean(data.marketing_opt_in),
        createdAt: String(data.created_at),
      }
    : null;
}

export async function getMyReview(productId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from('reviews').select('id, status').eq('product_id', productId).eq('user_id', userId).maybeSingle();
  return data ? { id: String(data.id), status: String(data.status) } : null;
}
