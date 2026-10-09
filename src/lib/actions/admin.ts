'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath, updateTag } from 'next/cache';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin, requireStaff } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { serverConfig } from '@/lib/config/server';
import { CATALOG_TAG } from '@/lib/catalog/repository';
import { stripeProvider } from '@/lib/payments/stripe';
import { logger } from '@/lib/logger';
import { slugSchema, uuidSchema } from '@/lib/validation/schemas';
import { FORMAT_IDS } from '@/data/formats';
import { GOALS } from '@/data/goals';
import { USER_ROLES } from '@/lib/auth/roles';
import type { SessionUser } from '@/types';

/*
 * Admin mutations. Every action:
 *  1. re-verifies the caller's role on the server (layouts don't protect actions),
 *  2. validates input with Zod,
 *  3. writes with the caller's own session so RLS policies apply (defence in depth),
 *  4. records an audit log entry for sensitive changes.
 */

export interface AdminActionState {
  ok?: boolean;
  error?: string;
  id?: string;
}

async function staff(): Promise<{ user: SessionUser; db: SupabaseClient }> {
  const user = await requireStaff();
  const db = await createSupabaseServerClient();
  if (!db) throw new Error('Supabase is not configured');
  return { user, db };
}

async function admin(): Promise<{ user: SessionUser; db: SupabaseClient }> {
  const user = await requireAdmin();
  const db = await createSupabaseServerClient();
  if (!db) throw new Error('Supabase is not configured');
  return { user, db };
}

async function audit(
  db: SupabaseClient,
  user: SessionUser,
  action: string,
  entityType: string,
  entityId: string | null,
  summary?: string,
  diff?: Record<string, unknown>,
) {
  const { error } = await db.from('audit_logs').insert({
    actor_id: user.id,
    actor_email: user.email,
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary: summary ?? null,
    diff: diff ?? null,
  });
  if (error) logger.error('audit.insert_failed', { action, code: error.code });
}

function refreshCatalog() {
  updateTag(CATALOG_TAG);
}

/* ------------------------------------------------------------------ */
/* Form helpers                                                        */
/* ------------------------------------------------------------------ */

const str = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();
const localized = (fd: FormData, key: string) => ({ ru: str(fd, `${key}.ru`), en: str(fd, `${key}.en`) });
const lines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
const localizedList = (fd: FormData, key: string) => ({ ru: lines(str(fd, `${key}.ru`)), en: lines(str(fd, `${key}.en`)) });
const csv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const localizedTextSchema = z.object({ ru: z.string().max(5000), en: z.string().max(5000) });
const specsSchema = z.array(z.object({ label: localizedTextSchema, value: localizedTextSchema })).max(40);
const faqSchema = z.array(z.object({ question: localizedTextSchema, answer: localizedTextSchema })).max(40);
const httpsUrl = z.union([z.literal(''), z.url().regex(/^https:\/\//)]);

const productSchema = z.object({
  slug: slugSchema,
  status: z.enum(['draft', 'published', 'archived']),
  product_type: z.enum([
    'spreadsheet',
    'notion-template',
    'presentation',
    'playbook',
    'ui-kit',
    'design-system',
    'code',
    'prompt-pack',
    'workflow',
    '3d',
    'icons',
    'illustrations',
    'guide',
    'bundle',
  ]),
  category_id: z.string().min(1).max(80),
  price_amount: z.coerce.number().min(0).max(100_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  compare_at_amount: z.union([z.literal(''), z.coerce.number().positive()]),
  license_tier: z.enum(['personal', 'commercial', 'team', 'extended']),
  delivery: z.enum(['download', 'external-link', 'download-and-link']),
  version: z.string().min(1).max(40),
  last_updated: z.iso.date(),
  sort_order: z.coerce.number().int().min(-10000).max(10000),
  preview_url: httpsUrl,
  documentation_url: httpsUrl,
});

export async function saveProductAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user, db } = await staff();
  const id = str(formData, 'id');

  const parsed = productSchema.safeParse({
    slug: str(formData, 'slug'),
    status: str(formData, 'status'),
    product_type: str(formData, 'product_type'),
    category_id: str(formData, 'category_id'),
    price_amount: str(formData, 'price_amount'),
    currency: str(formData, 'currency').toUpperCase(),
    compare_at_amount: str(formData, 'compare_at_amount'),
    license_tier: str(formData, 'license_tier'),
    delivery: str(formData, 'delivery'),
    version: str(formData, 'version'),
    last_updated: str(formData, 'last_updated'),
    sort_order: str(formData, 'sort_order') || '0',
    preview_url: str(formData, 'preview_url'),
    documentation_url: str(formData, 'documentation_url'),
  });
  if (!parsed.success) return { error: `invalid:${parsed.error.issues[0]?.path.join('.')}` };

  let specs: unknown;
  let faq: unknown;
  try {
    specs = specsSchema.parse(JSON.parse(str(formData, 'specs') || '[]'));
    faq = faqSchema.parse(JSON.parse(str(formData, 'faq') || '[]'));
  } catch {
    return { error: 'invalid:specs' };
  }

  const title = localized(formData, 'title');
  if (!title.ru && !title.en) return { error: 'invalid:title' };
  const compareAt = parsed.data.compare_at_amount === '' ? null : parsed.data.compare_at_amount;
  if (compareAt !== null && compareAt <= parsed.data.price_amount) return { error: 'invalid:compare_at_amount' };

  const goalIds = new Set(GOALS.map((g) => g.id));
  const row = {
    ...parsed.data,
    compare_at_amount: compareAt,
    preview_url: parsed.data.preview_url || null,
    documentation_url: parsed.data.documentation_url || null,
    title,
    subtitle: localized(formData, 'subtitle'),
    short_description: localized(formData, 'short_description'),
    description: localized(formData, 'description'),
    audience: localizedList(formData, 'audience'),
    use_cases: localizedList(formData, 'use_cases'),
    features: localizedList(formData, 'features'),
    included_items: localizedList(formData, 'included_items'),
    requirements: localizedList(formData, 'requirements'),
    specs,
    faq,
    secondary_category_ids: formData.getAll('secondary_category_ids').map(String).slice(0, 20),
    goals: formData.getAll('goals').map(String).filter((g) => goalIds.has(g as never)),
    formats: formData.getAll('formats').map(String).filter((f) => (FORMAT_IDS as string[]).includes(f)),
    software: csv(str(formData, 'software')).slice(0, 20),
    technologies: csv(str(formData, 'technologies')).slice(0, 20),
    tags: csv(str(formData, 'tags')).slice(0, 30),
    file_size_label: str(formData, 'file_size_label') || null,
    is_featured: formData.get('is_featured') === 'on',
    seo_title: localized(formData, 'seo_title'),
    seo_description: localized(formData, 'seo_description'),
  };

  let productId = id;
  if (id) {
    if (!uuidSchema.safeParse(id).success) return { error: 'invalid:id' };
    const { data: before } = await db.from('products').select('price_amount, status, compare_at_amount').eq('id', id).maybeSingle();
    const { error } = await db.from('products').update(row).eq('id', id);
    if (error) return { error: error.code === '23505' ? 'slugTaken' : 'generic' };
    await audit(db, user, 'product.updated', 'product', id, row.slug);
    if (before && Number(before.price_amount) !== row.price_amount) {
      await audit(db, user, 'product.price_changed', 'product', id, row.slug, { from: before.price_amount, to: row.price_amount });
    }
    if (before && before.status !== row.status) {
      await audit(db, user, `product.${row.status}`, 'product', id, row.slug, { from: before.status, to: row.status });
    }
  } else {
    const { data: creator } = await db.from('creators').select('id').eq('is_internal', true).limit(1).maybeSingle();
    if (!creator) return { error: 'noCreator' };
    const { data, error } = await db.from('products').insert({ ...row, creator_id: creator.id }).select('id').single();
    if (error || !data) return { error: error?.code === '23505' ? 'slugTaken' : 'generic' };
    productId = data.id as string;
    await audit(db, user, 'product.created', 'product', productId, row.slug);
  }

  // Bundle contents.
  if (row.product_type === 'bundle') {
    const items = formData
      .getAll('bundle_items')
      .map(String)
      .filter((value) => uuidSchema.safeParse(value).success && value !== productId);
    await db.from('bundle_items').delete().eq('bundle_id', productId);
    if (items.length) {
      await db.from('bundle_items').insert(items.map((product_id, index) => ({ bundle_id: productId, product_id, sort_order: index })));
    }
  }

  // Collection membership.
  const collectionIds = formData
    .getAll('collection_ids')
    .map(String)
    .filter((value) => uuidSchema.safeParse(value).success);
  await db.from('collection_products').delete().eq('product_id', productId);
  if (collectionIds.length) {
    await db.from('collection_products').insert(collectionIds.map((collection_id) => ({ collection_id, product_id: productId, sort_order: 100 })));
  }

  refreshCatalog();
  revalidatePath('/admin/products');
  return { ok: true, id: productId };
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const { user, db } = await admin();
  const id = uuidSchema.parse(formData.get('id'));
  const { count } = await db.from('order_items').select('id', { count: 'exact', head: true }).eq('product_id', id);
  if ((count ?? 0) > 0) {
    // Products with orders are archived, never deleted, to preserve purchase records.
    await db.from('products').update({ status: 'archived' }).eq('id', id);
    await audit(db, user, 'product.archived', 'product', id, 'has orders — archived instead of deleted');
  } else {
    await db.from('products').delete().eq('id', id);
    await audit(db, user, 'product.deleted', 'product', id);
  }
  refreshCatalog();
  revalidatePath('/admin/products');
}

export async function addChangelogAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user, db } = await staff();
  const productId = uuidSchema.safeParse(formData.get('product_id'));
  const version = str(formData, 'version');
  const releasedAt = z.iso.date().safeParse(str(formData, 'released_at'));
  if (!productId.success || !version || !releasedAt.success) return { error: 'invalid' };
  const { error } = await db
    .from('product_changelog')
    .upsert({ product_id: productId.data, version, released_at: releasedAt.data, notes: localized(formData, 'notes') }, { onConflict: 'product_id,version' });
  if (error) return { error: 'generic' };
  await audit(db, user, 'product.changelog_added', 'product', productId.data, version);
  refreshCatalog();
  revalidatePath(`/admin/products/${productId.data}`);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Files & images (direct-to-storage uploads with signed upload URLs)  */
/* ------------------------------------------------------------------ */

function safeFileName(name: string): string {
  return (
    name
      .normalize('NFKD')
      .replace(/[^\w.\-]+/g, '-')
      .replace(/-+/g, '-')
      .slice(-120) || 'file'
  );
}

export async function createUploadUrlAction(input: {
  productId: string;
  fileName: string;
  target: 'files' | 'media';
}): Promise<{ path: string; token: string; bucket: string } | { error: string }> {
  await requireStaff();
  const storage = getSupabaseAdmin();
  const productId = uuidSchema.safeParse(input.productId);
  if (!storage || !productId.success) return { error: 'invalid' };
  const bucket = input.target === 'files' ? serverConfig.storage.filesBucket : serverConfig.storage.mediaBucket;
  const path = `${productId.data}/${randomUUID()}-${safeFileName(input.fileName)}`;
  const { data, error } = await storage.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    logger.error('admin.upload_url_failed', { message: error?.message });
    return { error: 'generic' };
  }
  return { path, token: data.token, bucket };
}

const registerFileSchema = z.object({
  productId: uuidSchema,
  path: z.string().min(3).max(400),
  fileName: z.string().min(1).max(200),
  mimeType: z.string().max(120).optional(),
  sizeBytes: z.number().int().min(0),
  version: z.string().min(1).max(40),
  kind: z.enum(['download', 'documentation']),
  label: localizedTextSchema,
  checksum: z.string().regex(/^[0-9a-f]{64}$/).optional(),
});

export async function registerFileAction(input: z.input<typeof registerFileSchema>): Promise<AdminActionState> {
  const { user, db } = await staff();
  const parsed = registerFileSchema.safeParse(input);
  if (!parsed.success || !parsed.data.path.startsWith(`${parsed.data.productId}/`)) return { error: 'invalid' };
  const value = parsed.data;
  await db.from('product_files').update({ is_current: false }).eq('product_id', value.productId).eq('kind', value.kind);
  const { data, error } = await db
    .from('product_files')
    .insert({
      product_id: value.productId,
      kind: value.kind,
      label: value.label,
      storage_path: value.path,
      file_name: value.fileName,
      mime_type: value.mimeType ?? null,
      size_bytes: value.sizeBytes,
      version: value.version,
      checksum_sha256: value.checksum ?? null,
      is_current: true,
      uploaded_by: user.id,
    })
    .select('id')
    .single();
  if (error || !data) return { error: 'generic' };
  await audit(db, user, 'file.uploaded', 'product_file', data.id as string, `${value.fileName} v${value.version}`, { product: value.productId });
  revalidatePath(`/admin/products/${value.productId}`);
  return { ok: true, id: data.id as string };
}

export async function addExternalLinkAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user, db } = await staff();
  const productId = uuidSchema.safeParse(formData.get('product_id'));
  const url = z.url().regex(/^https:\/\//).safeParse(str(formData, 'external_url'));
  const version = str(formData, 'version') || '1.0';
  if (!productId.success || !url.success) return { error: 'invalid' };
  await db.from('product_files').update({ is_current: false }).eq('product_id', productId.data).eq('kind', 'external_link');
  const { data, error } = await db
    .from('product_files')
    .insert({
      product_id: productId.data,
      kind: 'external_link',
      label: localized(formData, 'label'),
      external_url: url.data,
      version,
      is_current: true,
      uploaded_by: user.id,
    })
    .select('id')
    .single();
  if (error || !data) return { error: 'generic' };
  await audit(db, user, 'file.link_added', 'product_file', data.id as string, version, { product: productId.data });
  revalidatePath(`/admin/products/${productId.data}`);
  return { ok: true };
}

export async function setFileCurrentAction(formData: FormData): Promise<void> {
  const { user, db } = await staff();
  const fileId = uuidSchema.parse(formData.get('id'));
  const { data: file } = await db.from('product_files').select('product_id, kind').eq('id', fileId).single();
  if (!file) return;
  await db.from('product_files').update({ is_current: false }).eq('product_id', file.product_id).eq('kind', file.kind);
  await db.from('product_files').update({ is_current: true }).eq('id', fileId);
  await audit(db, user, 'file.made_current', 'product_file', fileId);
  revalidatePath(`/admin/products/${file.product_id}`);
}

export async function deleteFileAction(formData: FormData): Promise<void> {
  const { user, db } = await staff();
  const fileId = uuidSchema.parse(formData.get('id'));
  const { data: file } = await db.from('product_files').select('product_id, storage_path, file_name').eq('id', fileId).single();
  if (!file) return;
  if (file.storage_path) await getSupabaseAdmin()?.storage.from(serverConfig.storage.filesBucket).remove([file.storage_path as string]);
  await db.from('product_files').delete().eq('id', fileId);
  await audit(db, user, 'file.deleted', 'product_file', fileId, file.file_name as string);
  revalidatePath(`/admin/products/${file.product_id}`);
}

const registerImageSchema = z.object({
  productId: uuidSchema,
  path: z.string().min(3).max(400),
  kind: z.enum(['thumbnail', 'gallery', 'og']),
  alt: localizedTextSchema,
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export async function registerImageAction(input: z.input<typeof registerImageSchema>): Promise<AdminActionState> {
  const { user, db } = await staff();
  const parsed = registerImageSchema.safeParse(input);
  if (!parsed.success || !parsed.data.path.startsWith(`${parsed.data.productId}/`)) return { error: 'invalid' };
  const value = parsed.data;
  if (value.kind === 'thumbnail') await db.from('product_images').delete().eq('product_id', value.productId).eq('kind', 'thumbnail');
  const { error } = await db.from('product_images').insert({
    product_id: value.productId,
    storage_path: value.path,
    kind: value.kind,
    alt: value.alt,
    width: value.width ?? null,
    height: value.height ?? null,
    sort_order: Date.now() % 100000,
  });
  if (error) return { error: 'generic' };
  await audit(db, user, 'image.uploaded', 'product', value.productId, value.kind);
  refreshCatalog();
  revalidatePath(`/admin/products/${value.productId}`);
  return { ok: true };
}

export async function deleteImageAction(formData: FormData): Promise<void> {
  const { user, db } = await staff();
  const imageId = uuidSchema.parse(formData.get('id'));
  const { data: image } = await db.from('product_images').select('product_id, storage_path').eq('id', imageId).single();
  if (!image) return;
  await getSupabaseAdmin()?.storage.from(serverConfig.storage.mediaBucket).remove([image.storage_path as string]);
  await db.from('product_images').delete().eq('id', imageId);
  await audit(db, user, 'image.deleted', 'product', image.product_id as string);
  refreshCatalog();
  revalidatePath(`/admin/products/${image.product_id}`);
}

/* ------------------------------------------------------------------ */
/* Orders, reviews, customers                                          */
/* ------------------------------------------------------------------ */

export async function refundOrderAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user, db } = await admin();
  const orderId = uuidSchema.safeParse(formData.get('order_id'));
  const service = getSupabaseAdmin();
  if (!orderId.success || !service) return { error: 'invalid' };

  const { data: order } = await db.from('orders').select('id, status, provider, is_test').eq('id', orderId.data).single();
  if (!order || order.status !== 'paid') return { error: 'invalid' };

  if (order.provider === 'stripe') {
    const { data: payment } = await db
      .from('payments')
      .select('provider_payment_id')
      .eq('order_id', order.id)
      .eq('provider', 'stripe')
      .eq('status', 'succeeded')
      .maybeSingle();
    if (!payment?.provider_payment_id) return { error: 'refundFailed' };
    try {
      await stripeProvider.refund?.(payment.provider_payment_id as string);
    } catch (error) {
      logger.error('admin.refund_failed', { orderId: order.id, error });
      return { error: 'refundFailed' };
    }
  }

  // Revokes entitlements atomically. The provider's refund webhook is idempotent with this.
  const { error } = await service.rpc('mark_order_refunded', { p_order_id: order.id });
  if (error) return { error: 'generic' };
  await audit(db, user, 'order.refunded', 'order', order.id as string, String(order.provider));
  revalidatePath('/admin/orders');
  return { ok: true };
}

export async function moderateReviewAction(formData: FormData): Promise<void> {
  const { user, db } = await admin();
  const reviewId = uuidSchema.parse(formData.get('id'));
  const status = z.enum(['approved', 'rejected', 'pending']).parse(formData.get('status'));
  await db.from('reviews').update({ status, moderated_by: user.id, moderated_at: new Date().toISOString() }).eq('id', reviewId);
  await audit(db, user, `review.${status}`, 'review', reviewId);
  refreshCatalog();
  revalidatePath('/admin/reviews');
}

export async function setRoleAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (user.role !== 'super_admin') return;
  const db = await createSupabaseServerClient();
  const service = getSupabaseAdmin();
  const targetId = uuidSchema.parse(formData.get('id'));
  const role = z.enum(USER_ROLES as [string, ...string[]]).parse(formData.get('role'));
  if (!db || !service || targetId === user.id) return;
  // Role changes go through the service role (users cannot write the role column).
  await service.from('profiles').update({ role }).eq('id', targetId);
  await audit(db, user, 'customer.role_changed', 'profile', targetId, role);
  revalidatePath('/admin/customers');
}

/* ------------------------------------------------------------------ */
/* Taxonomy, collections, coupons, content                             */
/* ------------------------------------------------------------------ */

export async function saveCategoryAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user, db } = await staff();
  const id = slugSchema.safeParse(str(formData, 'id'));
  const parent = str(formData, 'parent_id');
  const tone = z
    .enum(['design', 'development', 'ai', 'business', 'marketing', 'product', 'notion', 'data', 'slides', 'assets'])
    .safeParse(str(formData, 'tone'));
  if (!id.success || !tone.success) return { error: 'invalid' };
  const { error } = await db.from('categories').upsert(
    {
      id: id.data,
      slug: id.data,
      parent_id: parent || null,
      name: localized(formData, 'name'),
      description: localized(formData, 'description'),
      tone: tone.data,
      sort_order: Number(str(formData, 'sort_order') || 0),
      is_active: formData.get('is_active') === 'on',
    },
    { onConflict: 'id' },
  );
  if (error) return { error: 'generic' };
  await audit(db, user, 'category.saved', 'category', id.data);
  refreshCatalog();
  revalidatePath('/admin/categories');
  return { ok: true };
}

export async function saveCollectionAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user, db } = await staff();
  const id = str(formData, 'id');
  const slug = slugSchema.safeParse(str(formData, 'slug'));
  if (!slug.success) return { error: 'invalid' };
  const productIds = formData
    .getAll('product_ids')
    .map(String)
    .filter((value) => uuidSchema.safeParse(value).success);
  const featured = str(formData, 'featured_product_id');
  const row = {
    slug: slug.data,
    title: localized(formData, 'title'),
    description: localized(formData, 'description'),
    is_published: formData.get('is_published') === 'on',
    sort_order: Number(str(formData, 'sort_order') || 0),
    featured_product_id: uuidSchema.safeParse(featured).success ? featured : null,
  };
  let collectionId = id;
  if (id && uuidSchema.safeParse(id).success) {
    const { error } = await db.from('collections').update(row).eq('id', id);
    if (error) return { error: error.code === '23505' ? 'slugTaken' : 'generic' };
  } else {
    const { data, error } = await db.from('collections').insert(row).select('id').single();
    if (error || !data) return { error: error?.code === '23505' ? 'slugTaken' : 'generic' };
    collectionId = data.id as string;
  }
  await db.from('collection_products').delete().eq('collection_id', collectionId);
  if (productIds.length) {
    await db.from('collection_products').insert(productIds.map((product_id, index) => ({ collection_id: collectionId, product_id, sort_order: index })));
  }
  await audit(db, user, 'collection.saved', 'collection', collectionId, row.slug);
  refreshCatalog();
  revalidatePath('/admin/collections');
  return { ok: true, id: collectionId };
}

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,32}$/),
    type: z.enum(['percent', 'fixed']),
    amount: z.coerce.number().positive(),
    currency: z.union([z.literal(''), z.string().regex(/^[A-Z]{3}$/)]),
    min_order_amount: z.union([z.literal(''), z.coerce.number().min(0)]),
    max_uses: z.union([z.literal(''), z.coerce.number().int().positive()]),
    per_user_limit: z.union([z.literal(''), z.coerce.number().int().positive()]),
    starts_at: z.string().max(40),
    expires_at: z.string().max(40),
    description: z.string().max(300),
  })
  .refine((v) => v.type !== 'percent' || v.amount <= 100, { path: ['amount'] })
  .refine((v) => v.type !== 'fixed' || v.currency !== '', { path: ['currency'] });

export async function saveCouponAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user, db } = await admin();
  const parsed = couponSchema.safeParse({
    code: str(formData, 'code'),
    type: str(formData, 'type'),
    amount: str(formData, 'amount'),
    currency: str(formData, 'currency').toUpperCase(),
    min_order_amount: str(formData, 'min_order_amount'),
    max_uses: str(formData, 'max_uses'),
    per_user_limit: str(formData, 'per_user_limit'),
    starts_at: str(formData, 'starts_at'),
    expires_at: str(formData, 'expires_at'),
    description: str(formData, 'description'),
  });
  if (!parsed.success) return { error: `invalid:${parsed.error.issues[0]?.path.join('.')}` };
  const v = parsed.data;
  const toDate = (value: string) => (value ? new Date(value).toISOString() : null);
  const ids = (key: string) =>
    formData
      .getAll(key)
      .map(String)
      .filter((value) => uuidSchema.safeParse(value).success);
  const { data, error } = await db
    .from('coupons')
    .insert({
      code: v.code,
      type: v.type,
      amount: v.amount,
      currency: v.currency || null,
      min_order_amount: v.min_order_amount === '' ? null : v.min_order_amount,
      max_uses: v.max_uses === '' ? null : v.max_uses,
      per_user_limit: v.per_user_limit === '' ? null : v.per_user_limit,
      starts_at: toDate(v.starts_at),
      expires_at: toDate(v.expires_at),
      product_ids: ids('product_ids'),
      collection_ids: ids('collection_ids'),
      description: v.description || null,
      is_active: true,
    })
    .select('id')
    .single();
  if (error || !data) return { error: error?.code === '23505' ? 'codeTaken' : 'generic' };
  await audit(db, user, 'coupon.created', 'coupon', data.id as string, v.code, { type: v.type, amount: v.amount });
  revalidatePath('/admin/coupons');
  return { ok: true };
}

export async function toggleCouponAction(formData: FormData): Promise<void> {
  const { user, db } = await admin();
  const id = uuidSchema.parse(formData.get('id'));
  const active = formData.get('active') === 'true';
  await db.from('coupons').update({ is_active: active }).eq('id', id);
  await audit(db, user, active ? 'coupon.activated' : 'coupon.deactivated', 'coupon', id);
  revalidatePath('/admin/coupons');
}

export async function savePostAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user, db } = await staff();
  const id = str(formData, 'id');
  const slug = slugSchema.safeParse(str(formData, 'slug'));
  const status = z.enum(['draft', 'published', 'archived']).safeParse(str(formData, 'status'));
  if (!slug.success || !status.success) return { error: 'invalid' };
  const publishedAt = str(formData, 'published_at');
  const row = {
    slug: slug.data,
    status: status.data,
    title: localized(formData, 'title'),
    excerpt: localized(formData, 'excerpt'),
    body: localized(formData, 'body'),
    author_name: str(formData, 'author_name') || 'Vektor Lab',
    related_product_ids: formData
      .getAll('related_product_ids')
      .map(String)
      .filter((value) => uuidSchema.safeParse(value).success),
    published_at: status.data === 'published' ? (publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString()) : null,
  };
  let postId = id;
  if (id && uuidSchema.safeParse(id).success) {
    const { error } = await db.from('blog_posts').update(row).eq('id', id);
    if (error) return { error: error.code === '23505' ? 'slugTaken' : 'generic' };
  } else {
    const { data, error } = await db.from('blog_posts').insert(row).select('id').single();
    if (error || !data) return { error: error?.code === '23505' ? 'slugTaken' : 'generic' };
    postId = data.id as string;
  }
  await audit(db, user, 'content.saved', 'blog_post', postId, row.slug);
  revalidatePath('/blog');
  revalidatePath('/admin/content');
  return { ok: true, id: postId };
}
