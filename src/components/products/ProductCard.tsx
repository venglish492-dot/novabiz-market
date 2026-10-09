import Link from 'next/link';
import Image from 'next/image';
import { pick, type Locale } from '@/i18n/config';
import { plural } from '@/i18n/plural';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import type { ProductSummary } from '@/lib/catalog/summary';
import { FormatList } from '@/components/ui/FormatChip';
import { Price } from '@/components/ui/Price';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { ProductPreview } from './ProductPreview';
import { AddToCartButton, QuickViewButton, WishlistButton } from './ProductActions';

/**
 * Product card. Presentational (works in server and client trees); the
 * interactive parts are small client islands.
 */
export function ProductCard({
  product,
  locale,
  t,
  priority = false,
  headingLevel = 3,
}: {
  product: ProductSummary;
  locale: Locale;
  t: Dictionary;
  priority?: boolean;
  headingLevel?: 2 | 3;
}) {
  const title = pick(product.title, locale);
  const href = `/products/${product.slug}`;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const badgeLabels = { new: t.common.badgeNew, updated: t.common.badgeUpdated, featured: t.common.badgeFeatured } as const;

  return (
    <article
      data-product-card
      data-price={product.price.amount}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-[border-color,transform,box-shadow] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
    >
      <Link href={href} tabIndex={-1} aria-hidden className="relative block aspect-[4/3] overflow-hidden border-b border-line">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail.url}
            alt=""
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
          />
        ) : (
          <ProductPreview productType={product.productType} tone={product.tone} label={t.product.previewSchematic} />
        )}
      </Link>

      {product.badges.length > 0 && (
        <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
          {product.badges.map((badge) => (
            <Badge key={badge} tone={badge === 'featured' ? 'neutral' : 'accent'} className="border border-line bg-surface/85 backdrop-blur">
              {badgeLabels[badge]}
            </Badge>
          ))}
        </div>
      )}
      <WishlistButton product={product} className="absolute right-3 top-3 z-10" />

      <div className="flex flex-1 flex-col p-5">
        <p className="t-eyebrow truncate">
          {pick(product.categoryName, locale)} · {t.product.types[product.productType]}
        </p>
        <Heading className="mt-3 text-[16.5px] font-semibold leading-snug tracking-[-0.01em] text-fg">
          <Link href={href} className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline">
            {title}
          </Link>
        </Heading>
        <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-fg-muted">{pick(product.subtitle, locale)}</p>

        <div className="mt-4">
          <FormatList formats={product.formats} max={4} />
        </div>

        <div className="relative z-10 mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="flex flex-col gap-1">
            <Price price={product.price} compareAtAmount={product.compareAtAmount} locale={locale} compareLabel={t.product.compareAt} />
            {product.rating && (
              <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
                <StarRating value={product.rating.average} size={12} label={`${product.rating.average.toFixed(1)} / 5`} />
                {plural(t.reviews.basedOn, product.rating.count, locale)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <QuickViewButton product={product} />
            <AddToCartButton product={product} size="sm" fullLabel={false} className="!h-9 !w-9 !px-0" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 ${className}`}>{children}</div>;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface" aria-hidden>
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton mt-4 h-6 w-1/3" />
      </div>
    </div>
  );
}
