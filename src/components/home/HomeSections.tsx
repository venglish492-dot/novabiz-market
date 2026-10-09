import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, Plus } from 'lucide-react';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { pick, pickList, type Locale } from '@/i18n/config';
import { plural } from '@/i18n/plural';
import type { HomeContent } from '@/content/home';
import { FORMATS } from '@/data/formats';
import { GOALS } from '@/data/goals';
import { siteConfig } from '@/lib/config/site';
import { formatDate, formatMoney } from '@/lib/format';
import type { ProductSummary } from '@/lib/catalog/summary';
import type { Category, Collection, FormatId, GoalId, Product, Review } from '@/types';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FormatList } from '@/components/ui/FormatChip';
import { Price } from '@/components/ui/Price';
import { Reveal } from '@/components/ui/Reveal';
import { StarRating } from '@/components/ui/StarRating';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductPreview } from '@/components/products/ProductPreview';
import { AddToCartButton } from '@/components/products/ProductActions';

interface Base {
  t: Dictionary;
  locale: Locale;
  content: HomeContent;
}

const section = 'py-20 lg:py-28';

export function ValueStrip({ content }: Pick<Base, 'content'>) {
  return (
    <section aria-label={content.values.map((v) => v.title).join(', ')} className="border-y border-line bg-surface/40">
      <div className="container-page grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {content.values.map((value, index) => (
          <div key={value.title} className={`py-6 sm:py-8 lg:px-8 ${index === 0 ? 'lg:pl-0' : ''} ${index % 2 === 1 ? 'sm:pl-8 lg:pl-8' : ''}`}>
            <p className="t-mono text-[11px] text-fg-subtle">{String(index + 1).padStart(2, '0')}</p>
            <p className="mt-3 text-[15px] font-medium text-fg">{value.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{value.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeaturedProduct({ t, locale, content, product }: Base & { product: ProductSummary }) {
  const included = pickList(product.included, locale);
  return (
    <section className={section} aria-labelledby="featured-title">
      <div className="container-page">
        <Reveal>
          <div className="grid overflow-hidden rounded-[28px] border border-line bg-surface lg:grid-cols-[1.25fr_1fr]">
            <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden className="group relative block aspect-[4/3] border-b border-line lg:aspect-auto lg:min-h-[520px] lg:border-b-0 lg:border-r">
              <ProductPreview productType={product.productType} tone={product.tone} label={t.product.previewSchematic} size="hero" />
            </Link>
            <div className="flex flex-col p-7 sm:p-10">
              <p className="t-eyebrow">
                {content.featured.eyebrow} · {pick(product.categoryName, locale)}
              </p>
              <h2 id="featured-title" className="t-h2 mt-5 text-balance text-fg">
                {pick(product.title, locale)}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">{pick(product.shortDescription, locale)}</p>

              <p className="t-eyebrow mb-3 mt-8">{content.featured.includes}</p>
              <ul className="flex flex-col gap-2.5">
                {included.slice(0, 4).map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-fg-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <FormatList formats={product.formats} max={5} />
              </div>

              <div className="mt-auto flex flex-col gap-5 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between lg:mt-10">
                <Price price={product.price} compareAtAmount={product.compareAtAmount} locale={locale} size="lg" compareLabel={t.product.compareAt} />
                <div className="flex flex-wrap gap-2">
                  <AddToCartButton product={product} size="md" variant="secondary" />
                  <ButtonLink href={`/products/${product.slug}`} size="md">
                    {content.featured.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Fill the asymmetric grid exactly: the first tile is 2×2, the last tile stretches to close the final row. */
function categorySpan(index: number, total: number): string {
  if (index === 0) return 'sm:col-span-2 lg:row-span-2';
  if (index !== total - 1) return '';
  const classes: string[] = [];
  if ((total - 1) % 2 === 1) classes.push('sm:col-span-2');
  const lgRemainder = (total + 3) % 4;
  if (lgRemainder === 1) classes.push('lg:col-span-4');
  else if (lgRemainder === 2) classes.push('lg:col-span-3');
  else if (lgRemainder === 3) classes.push('lg:col-span-2');
  else classes.push('lg:col-span-1');
  return classes.join(' ');
}

export function CategoryShowcase({
  t,
  locale,
  content,
  categories,
  roadmap,
}: Base & { categories: Array<Category & { count: number }>; roadmap: Category[] }) {
  return (
    <section className={section} aria-labelledby="categories-title">
      <div className="container-page">
        <SectionHeading
          id="categories-title"
          eyebrow={content.categories.eyebrow}
          title={content.categories.title}
          description={content.categories.description}
          action={
            <ButtonLink href="/categories" variant="ghost" size="sm">
              {t.nav.allCategories}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          }
        />
        <div className="mt-12 grid auto-rows-[minmax(180px,auto)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Reveal key={category.id} delay={index * 60} className={categorySpan(index, categories.length)}>
              <Link
                href={`/categories/${category.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-colors duration-300 hover:border-line-strong"
                style={{ '--tone': `var(--tone-${category.tone})` } as React.CSSProperties}
              >
                <span
                  aria-hidden
                  className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-70 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(closest-side,color-mix(in_oklab,var(--tone)_22%,transparent),transparent)]"
                />
                <span className="flex items-center justify-between">
                  <span className="h-2 w-2 rounded-full bg-[var(--tone)]" aria-hidden />
                  <span className="t-mono text-[11px] text-fg-subtle">{plural(t.common.products, category.count, locale)}</span>
                </span>
                <span className={`mt-auto pt-10 font-semibold tracking-tight text-fg ${index === 0 ? 't-h2' : 'text-xl'}`}>
                  {pick(category.name, locale)}
                </span>
                <span className={`mt-2 pr-8 leading-relaxed text-fg-muted ${index === 0 ? 'max-w-md text-[15px]' : 'line-clamp-2 text-sm'}`}>
                  {pick(category.description, locale)}
                </span>
                <ArrowUpRight
                  className="absolute bottom-6 right-6 h-5 w-5 text-fg-subtle transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg"
                  aria-hidden
                />
              </Link>
            </Reveal>
          ))}
        </div>
        {roadmap.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-subtle">
            <span className="t-eyebrow">{t.catalog.roadmapTitle}</span>
            {roadmap.map((category) => (
              <span key={category.id} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full" style={{ background: `var(--tone-${category.tone})` }} aria-hidden />
                {pick(category.name, locale)}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function GoalExplorer({ t, locale, content, goalCounts }: Base & { goalCounts: Map<GoalId, number> }) {
  const goals = GOALS.filter((goal) => (goalCounts.get(goal.id) ?? 0) > 0);
  if (!goals.length) return null;
  return (
    <section className={`${section} border-t border-line`} aria-labelledby="goals-title">
      <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading id="goals-title" eyebrow={content.goals.eyebrow} title={content.goals.title} description={content.goals.description} />
        </div>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          {goals.map((goal, index) => (
            <li key={goal.id} className="bg-surface">
              <Link
                href={`/products?goal=${goal.id}`}
                className="group flex h-full flex-col p-6 transition-colors hover:bg-surface-2"
              >
                <span className="flex items-center justify-between">
                  <span className="t-mono text-[11px] text-fg-subtle">{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-xs text-fg-subtle">{plural(t.common.products, goalCounts.get(goal.id) ?? 0, locale)}</span>
                </span>
                <span className="mt-6 flex items-center justify-between gap-3 text-lg font-semibold tracking-tight text-fg">
                  {pick(goal.title, locale)}
                  <ArrowRight className="h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-300 group-hover:translate-x-1 group-hover:text-fg" aria-hidden />
                </span>
                <span className="mt-1.5 text-sm leading-relaxed text-fg-muted">{pick(goal.description, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ProductStrip({ t, locale, content, products }: Base & { products: ProductSummary[] }) {
  return (
    <section className={`${section} border-t border-line`} aria-labelledby="discovery-title">
      <div className="container-page">
        <SectionHeading
          id="discovery-title"
          eyebrow={content.discovery.eyebrow}
          title={content.discovery.title}
          action={
            <ButtonLink href="/products" variant="ghost" size="sm">
              {content.discovery.cta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          }
        />
      </div>
      <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:scroll-px-6 sm:px-6 lg:container-page lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible">
        {products.map((product) => (
          <div key={product.id} className="w-[82%] max-w-[340px] shrink-0 snap-start sm:w-[46%] lg:w-auto lg:max-w-none">
            <ProductCard product={product} locale={locale} t={t} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function FormatsShowcase({ content, formatCounts, t, locale }: Base & { formatCounts: Map<FormatId, number> }) {
  const formats = [...formatCounts.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <section className={`${section} border-t border-line`} aria-labelledby="formats-title">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <SectionHeading id="formats-title" eyebrow={content.formats.eyebrow} title={content.formats.title} description={content.formats.description} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {formats.map(([format, count]) => (
            <li key={format}>
              <Link
                href={`/products?format=${format}`}
                className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong"
              >
                <span className="t-mono text-2xl font-medium tracking-tight text-fg transition-colors group-hover:text-accent">{FORMATS[format].mark}</span>
                <span className="mt-6 text-sm text-fg">{FORMATS[format].label}</span>
                <span className="mt-0.5 text-xs text-fg-subtle">{plural(t.common.products, count, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function WhyVektor({ content }: Pick<Base, 'content'>) {
  return (
    <section className={`${section} border-t border-line`} aria-labelledby="why-title">
      <div className="container-page">
        <SectionHeading id="why-title" eyebrow={content.why.eyebrow} title={content.why.title} />
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {content.why.items.map((item, index) => (
            <Reveal key={item.title} delay={index * 50} className="bg-bg">
              <div className="h-full bg-surface/40 p-7">
                <span className="t-mono text-[11px] text-accent">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-fg">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks({ content }: Pick<Base, 'content'>) {
  return (
    <section className={`${section} border-t border-line`} aria-labelledby="how-title">
      <div className="container-page">
        <SectionHeading id="how-title" eyebrow={content.how.eyebrow} title={content.how.title} />
        <ol className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <span aria-hidden className="absolute left-0 right-0 top-[18px] hidden h-px bg-gradient-to-r from-line-strong via-line-strong to-transparent lg:block" />
          {content.how.steps.map((step, index) => (
            <li key={step.title} className="relative">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-bg t-mono text-xs text-fg">
                {index + 1}
              </span>
              <h3 className="mt-6 text-lg font-semibold tracking-tight text-fg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CollectionsShowcase({
  t,
  locale,
  content,
  collections,
  products,
}: Base & { collections: Collection[]; products: Map<string, ProductSummary> }) {
  if (!collections.length) return null;
  return (
    <section className={`${section} border-t border-line`} aria-labelledby="collections-title">
      <div className="container-page">
        <SectionHeading
          id="collections-title"
          eyebrow={content.collections.eyebrow}
          title={content.collections.title}
          action={
            <ButtonLink href="/collections" variant="ghost" size="sm">
              {content.collections.cta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          }
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} products={products} t={t} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CollectionCard({
  collection,
  products,
  t,
  locale,
}: {
  collection: Collection;
  products: Map<string, ProductSummary>;
  t: Dictionary;
  locale: Locale;
}) {
  const items = collection.productIds.map((id) => products.get(id)).filter((p): p is ProductSummary => Boolean(p));
  const currency = items[0]?.price.currency;
  const sameCurrency = items.every((item) => item.price.currency === currency);
  const total = items.reduce((sum, item) => sum + Math.round(item.price.amount * 100), 0) / 100;
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong"
    >
      <div className="grid h-44 grid-cols-4 gap-px border-b border-line bg-line">
        {items.slice(0, 4).map((item) => (
          <div key={item.id} className="relative bg-surface-2">
            <ProductPreview productType={item.productType} tone={item.tone} label="" />
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - items.length) }, (_, i) => (
          <div key={`empty-${i}`} className="bg-surface-2" />
        ))}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold tracking-tight text-fg">{pick(collection.title, locale)}</h3>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-fg-subtle transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{pick(collection.description, locale)}</p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-6 text-xs text-fg-subtle">
          <span>{plural(t.common.products, items.length, locale)}</span>
          {sameCurrency && currency && (
            <span>
              {t.catalog.collectionSeparately}: <span className="tabular-nums text-fg-muted">{formatMoney(total, currency, locale)}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Rendered only when approved, verified-purchase reviews exist. */
export function RecentReviews({
  t,
  locale,
  content,
  reviews,
  products,
}: Base & { reviews: Review[]; products: Map<string, Product> }) {
  if (!reviews.length) return null;
  return (
    <section className={`${section} border-t border-line`} aria-labelledby="reviews-title">
      <div className="container-page">
        <SectionHeading id="reviews-title" eyebrow={content.reviews.eyebrow} title={content.reviews.title} />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {reviews.slice(0, 3).map((review) => {
            const product = products.get(review.productId);
            return (
              <figure key={review.id} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
                <StarRating value={review.rating} label={`${review.rating} / 5`} />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-fg">{review.body}</blockquote>
                <figcaption className="mt-6 border-t border-line pt-4 text-xs text-fg-subtle">
                  <span className="text-fg-muted">{review.authorName}</span> · {t.reviews.verified}
                  {product && (
                    <>
                      {' · '}
                      <Link href={`/products/${product.slug}`} className="underline-offset-4 hover:underline">
                        {pick(product.title, locale)}
                      </Link>
                    </>
                  )}
                  <span className="block pt-1">{formatDate(review.createdAt, locale, 'short')}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomeFaq({ content }: Pick<Base, 'content'>) {
  return (
    <section className={`${section} border-t border-line`} aria-labelledby="faq-title">
      <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading id="faq-title" eyebrow={content.faq.eyebrow} title={content.faq.title} />
        <div className="divide-y divide-line border-y border-line">
          {content.faq.items.map((item) => (
            <details key={item.q} className="group py-1">
              <summary className="flex list-none items-center justify-between gap-6 py-5 text-left text-[16px] font-medium text-fg [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus className="h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-300 group-open:rotate-45" aria-hidden />
              </summary>
              <p className="pb-6 pr-10 text-sm leading-relaxed text-fg-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ content }: Pick<Base, 'content'>) {
  return (
    <section className="py-20 lg:py-28">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[28px] border border-line bg-surface px-6 py-16 text-center sm:px-12 lg:py-24">
          <div aria-hidden className="hairline-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(60%_70%_at_50%_100%,black,transparent)]" />
          <div aria-hidden className="absolute left-1/2 top-full h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--bg-glow),transparent)]" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="t-h1 text-balance text-fg">{content.final.title}</h2>
            <p className="t-lead mx-auto mt-5 max-w-lg">{content.final.body}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/products" size="lg">
                {content.final.primary}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/contact" size="lg" variant="secondary">
                {content.final.secondary}
              </ButtonLink>
            </div>
            <p className="mt-8 text-xs text-fg-subtle">
              <a href={`mailto:${siteConfig.email}`} className="hover:text-fg">
                {siteConfig.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
