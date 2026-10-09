import type { LocalizedList, LocalizedText } from '../../i18n/config.ts';
import type { Category, CategoryTone, DeliveryMethod, FormatId, GoalId, LicenseTier, Money, Product, ProductType } from '../../types/index.ts';
import { productBadges, rootCategoryOf, type ProductBadgeKind } from './queries.ts';

/**
 * Client-safe product projection for cards, quick view, cart and wishlist.
 * Keeps payloads small: lists are trimmed and long descriptions omitted.
 */
export interface ProductSummary {
  id: string;
  slug: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  shortDescription: LocalizedText;
  productType: ProductType;
  categoryId: string;
  goals: GoalId[];
  categoryName: LocalizedText;
  tone: CategoryTone;
  formats: FormatId[];
  software: string[];
  price: Money;
  compareAtAmount: number | null;
  license: LicenseTier;
  delivery: DeliveryMethod;
  version: string;
  lastUpdated: string;
  fileSize: string | null;
  highlights: LocalizedList;
  included: LocalizedList;
  rating: Product['rating'];
  badges: ProductBadgeKind[];
  thumbnail: Product['thumbnail'];
}

function trimList(list: LocalizedList, size: number): LocalizedList {
  return { ru: list.ru.slice(0, size), en: list.en.slice(0, size) };
}

export function toProductSummary(product: Product, categories: Category[], now?: Date): ProductSummary {
  const category = categories.find((c) => c.id === product.categoryId);
  const root = rootCategoryOf(categories, product.categoryId);
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle,
    shortDescription: product.shortDescription,
    productType: product.productType,
    categoryId: product.categoryId,
    goals: product.goals,
    categoryName: category?.name ?? { ru: '', en: '' },
    tone: root?.tone ?? category?.tone ?? 'business',
    formats: product.formats,
    software: product.software,
    price: product.price,
    compareAtAmount: product.compareAtAmount,
    license: product.license,
    delivery: product.delivery,
    version: product.version,
    lastUpdated: product.lastUpdated,
    fileSize: product.fileSize,
    highlights: trimList(product.features, 4),
    included: trimList(product.includedItems, 5),
    rating: product.rating,
    badges: productBadges(product, now),
    thumbnail: product.thumbnail,
  };
}
