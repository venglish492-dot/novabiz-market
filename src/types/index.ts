import type { LocalizedList, LocalizedText } from '../i18n/config.ts';

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

/** ISO 4217 code. Amounts are stored as major units (e.g. 3490.00 RUB). */
export type CurrencyCode = string;

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

export type ProductStatus = 'draft' | 'published' | 'archived';

export type ProductType =
  | 'spreadsheet'
  | 'notion-template'
  | 'presentation'
  | 'playbook'
  | 'ui-kit'
  | 'design-system'
  | 'code'
  | 'prompt-pack'
  | 'workflow'
  | '3d'
  | 'icons'
  | 'illustrations'
  | 'guide'
  | 'bundle';

export type FormatId =
  | 'excel'
  | 'google-sheets'
  | 'notion'
  | 'powerpoint'
  | 'keynote'
  | 'google-slides'
  | 'pdf'
  | 'word'
  | 'figma'
  | 'react'
  | 'nextjs'
  | 'tailwind'
  | 'html-css'
  | '3d'
  | 'zip';

export type LicenseTier = 'personal' | 'commercial' | 'team' | 'extended';

/** How a buyer receives the product after a verified payment. */
export type DeliveryMethod = 'download' | 'external-link' | 'download-and-link';

export type GoalId =
  | 'launch-startup'
  | 'prepare-investors'
  | 'analyze-unit-economics'
  | 'build-saas'
  | 'build-product'
  | 'run-agency'
  | 'improve-sales'
  | 'manage-team'
  | 'organize-operations'
  | 'sell-on-marketplaces'
  | 'design-app'
  | 'create-ai-workflows';

export type CategoryTone =
  | 'design'
  | 'development'
  | 'ai'
  | 'business'
  | 'marketing'
  | 'product'
  | 'notion'
  | 'data'
  | 'slides'
  | 'assets';

export interface Category {
  id: string;
  slug: string;
  parentId: string | null;
  name: LocalizedText;
  description: LocalizedText;
  tone: CategoryTone;
  sortOrder: number;
}

export interface ProductImage {
  url: string;
  alt: LocalizedText;
  width: number | null;
  height: number | null;
}

export interface ProductSpec {
  label: LocalizedText;
  value: LocalizedText;
}

export interface ProductFaq {
  question: LocalizedText;
  answer: LocalizedText;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  notes: LocalizedText;
}

export interface CreatorRef {
  id: string;
  slug: string;
  name: string;
}

export interface Product {
  id: string;
  slug: string;
  status: ProductStatus;
  productType: ProductType;

  title: LocalizedText;
  subtitle: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;

  categoryId: string;
  secondaryCategoryIds: string[];
  goals: GoalId[];
  tags: string[];
  formats: FormatId[];
  software: string[];
  technologies: string[];

  audience: LocalizedList;
  useCases: LocalizedList;
  features: LocalizedList;
  includedItems: LocalizedList;
  requirements: LocalizedList;
  specs: ProductSpec[];
  faq: ProductFaq[];
  changelog: ChangelogEntry[];

  price: Money;
  /** Shown only when explicitly configured as a genuine previous/regular price. */
  compareAtAmount: number | null;
  license: LicenseTier;
  delivery: DeliveryMethod;

  version: string;
  /** ISO date (YYYY-MM-DD) of the latest product update. */
  lastUpdated: string;
  fileSize: string | null;

  creator: CreatorRef;
  isFeatured: boolean;
  sortOrder: number;

  /** Aggregated from approved, verified-purchase reviews only. Null when none exist. */
  rating: { average: number; count: number } | null;

  thumbnail: ProductImage | null;
  gallery: ProductImage[];
  /** Public, owner-controlled preview (never the paid file). */
  previewUrl: string | null;
  documentationUrl: string | null;

  /** For bundles: products included. */
  bundleProductIds: string[];

  seo: { title: LocalizedText | null; description: LocalizedText | null };

  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface Collection {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  productIds: string[];
  featuredProductId: string | null;
  sortOrder: number;
}

export interface Goal {
  id: GoalId;
  title: LocalizedText;
  description: LocalizedText;
}

export interface Catalog {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  source: 'database' | 'static';
}

/** Compact record used by client-side search and the command palette. */
export interface SearchDocument {
  id: string;
  slug: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  categoryId: string;
  categoryName: LocalizedText;
  formats: FormatId[];
  tags: string[];
  software: string[];
  price: Money;
  keywords: string;
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Commerce                                                            */
/* ------------------------------------------------------------------ */

export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'created' | 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';

export type CouponType = 'percent' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  amount: number;
  currency: CurrencyCode | null;
  minOrderAmount: number | null;
  productIds: string[];
  collectionIds: string[];
  startsAt: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  perUserLimit: number | null;
  timesUsed: number;
  isActive: boolean;
}

export interface QuoteLine {
  productId: string;
  slug: string;
  title: LocalizedText;
  unitAmount: number;
  discountAmount: number;
  currency: CurrencyCode;
  license: LicenseTier;
  version: string;
}

export type QuoteIssue =
  | { kind: 'unavailable'; productId: string }
  | { kind: 'mixed-currency' }
  | { kind: 'coupon'; reason: CouponRejection };

export type CouponRejection =
  | 'not-found'
  | 'inactive'
  | 'not-started'
  | 'expired'
  | 'min-order'
  | 'usage-limit'
  | 'user-limit'
  | 'not-applicable'
  | 'currency';

export interface Quote {
  lines: QuoteLine[];
  currency: CurrencyCode | null;
  subtotal: number;
  discount: number;
  total: number;
  coupon: { code: string; type: CouponType; amount: number } | null;
  issues: QuoteIssue[];
}

export type UserRole = 'buyer' | 'creator' | 'editor' | 'admin' | 'super_admin';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}
