import type { LocalizedList, LocalizedText } from '../../i18n/config.ts';
import type {
  Category,
  CategoryTone,
  ChangelogEntry,
  Collection,
  DeliveryMethod,
  FormatId,
  GoalId,
  LicenseTier,
  Product,
  ProductFaq,
  ProductImage,
  ProductSpec,
  ProductStatus,
  ProductType,
} from '../../types/index.ts';
import { isFormatId } from '../../data/formats.ts';

/* Defensive mapping from database rows (jsonb can be incomplete) to domain types. */

type Row = Record<string, unknown>;

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

export function asLocalized(value: unknown): LocalizedText {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const ru = str(v.ru);
  const en = str(v.en);
  const result: LocalizedText = { ru: ru || en, en: en || ru };
  if (typeof v.uz === 'string' && v.uz) result.uz = v.uz;
  return result;
}

export function asLocalizedOrNull(value: unknown): LocalizedText | null {
  if (!value || typeof value !== 'object') return null;
  const localized = asLocalized(value);
  return localized.ru || localized.en ? localized : null;
}

export function asLocalizedList(value: unknown): LocalizedList {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const ru = strArray(v.ru);
  const en = strArray(v.en);
  return { ru: ru.length ? ru : en, en: en.length ? en : ru };
}

function asSpecs(value: unknown): ProductSpec[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Row => Boolean(item) && typeof item === 'object')
    .map((item) => ({ label: asLocalized(item.label), value: asLocalized(item.value) }));
}

function asFaq(value: unknown): ProductFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Row => Boolean(item) && typeof item === 'object')
    .map((item) => ({ question: asLocalized(item.question), answer: asLocalized(item.answer) }));
}

export function mediaUrl(supabaseUrl: string, bucket: string, path: string): string {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encoded}`;
}

export interface MapContext {
  supabaseUrl: string;
  mediaBucket: string;
}

export function mapCategoryRow(row: Row): Category {
  return {
    id: str(row.id),
    slug: str(row.slug, str(row.id)),
    parentId: typeof row.parent_id === 'string' ? row.parent_id : null,
    name: asLocalized(row.name),
    description: asLocalized(row.description),
    tone: str(row.tone, 'business') as CategoryTone,
    sortOrder: num(row.sort_order),
  };
}

export function mapCollectionRow(row: Row): Collection {
  const items = Array.isArray(row.items) ? (row.items as Row[]) : [];
  return {
    id: str(row.id),
    slug: str(row.slug),
    title: asLocalized(row.title),
    description: asLocalized(row.description),
    productIds: [...items].sort((a, b) => num(a.sort_order) - num(b.sort_order)).map((item) => str(item.product_id)),
    featuredProductId: typeof row.featured_product_id === 'string' ? row.featured_product_id : null,
    sortOrder: num(row.sort_order),
  };
}

export function mapProductRow(row: Row, ctx: MapContext): Product {
  const images = (Array.isArray(row.images) ? (row.images as Row[]) : []).sort((a, b) => num(a.sort_order) - num(b.sort_order));
  const toImage = (image: Row): ProductImage => ({
    url: mediaUrl(ctx.supabaseUrl, ctx.mediaBucket, str(image.storage_path)),
    alt: asLocalized(image.alt),
    width: image.width === null || image.width === undefined ? null : num(image.width),
    height: image.height === null || image.height === undefined ? null : num(image.height),
  });
  const thumbnailRow = images.find((image) => image.kind === 'thumbnail');
  const gallery = images.filter((image) => image.kind === 'gallery').map(toImage);
  const changelog: ChangelogEntry[] = (Array.isArray(row.changelog) ? (row.changelog as Row[]) : [])
    .map((entry) => ({ version: str(entry.version), date: str(entry.released_at), notes: asLocalized(entry.notes) }))
    .sort((a, b) => b.date.localeCompare(a.date));
  const bundle = (Array.isArray(row.bundle) ? (row.bundle as Row[]) : [])
    .sort((a, b) => num(a.sort_order) - num(b.sort_order))
    .map((item) => str(item.product_id));
  const creator = (row.creator && typeof row.creator === 'object' ? row.creator : {}) as Row;
  const ratingCount = num(row.rating_count);

  return {
    id: str(row.id),
    slug: str(row.slug),
    status: str(row.status, 'draft') as ProductStatus,
    productType: str(row.product_type, 'guide') as ProductType,
    title: asLocalized(row.title),
    subtitle: asLocalized(row.subtitle),
    shortDescription: asLocalized(row.short_description),
    description: asLocalized(row.description),
    categoryId: str(row.category_id),
    secondaryCategoryIds: strArray(row.secondary_category_ids),
    goals: strArray(row.goals) as GoalId[],
    tags: strArray(row.tags),
    formats: strArray(row.formats).filter(isFormatId) as FormatId[],
    software: strArray(row.software),
    technologies: strArray(row.technologies),
    audience: asLocalizedList(row.audience),
    useCases: asLocalizedList(row.use_cases),
    features: asLocalizedList(row.features),
    includedItems: asLocalizedList(row.included_items),
    requirements: asLocalizedList(row.requirements),
    specs: asSpecs(row.specs),
    faq: asFaq(row.faq),
    changelog,
    price: { amount: num(row.price_amount), currency: str(row.currency, 'RUB').trim() },
    compareAtAmount: row.compare_at_amount === null || row.compare_at_amount === undefined ? null : num(row.compare_at_amount),
    license: str(row.license_tier, 'commercial') as LicenseTier,
    delivery: str(row.delivery, 'download') as DeliveryMethod,
    version: str(row.version, '1.0'),
    lastUpdated: str(row.last_updated),
    fileSize: typeof row.file_size_label === 'string' && row.file_size_label ? row.file_size_label : null,
    creator: { id: str(creator.id), slug: str(creator.slug), name: str(creator.name, 'Vektor Lab') },
    isFeatured: Boolean(row.is_featured),
    sortOrder: num(row.sort_order),
    rating: ratingCount > 0 ? { average: num(row.rating_average), count: ratingCount } : null,
    thumbnail: thumbnailRow ? toImage(thumbnailRow) : null,
    gallery,
    previewUrl: typeof row.preview_url === 'string' && row.preview_url ? row.preview_url : null,
    documentationUrl: typeof row.documentation_url === 'string' && row.documentation_url ? row.documentation_url : null,
    bundleProductIds: bundle,
    seo: { title: asLocalizedOrNull(row.seo_title), description: asLocalizedOrNull(row.seo_description) },
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    publishedAt: typeof row.published_at === 'string' ? row.published_at : null,
  };
}

export const PRODUCT_SELECT =
  '*, creator:creators(id, slug, name), images:product_images(storage_path, alt, kind, sort_order, width, height), changelog:product_changelog(version, notes, released_at), bundle:bundle_items!bundle_items_bundle_id_fkey(product_id, sort_order)';

export const COLLECTION_SELECT = '*, items:collection_products(product_id, sort_order)';
