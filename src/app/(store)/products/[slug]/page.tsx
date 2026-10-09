import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Check, CircleCheck, FileText, Minus, Plus } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { pick, pickList } from '@/i18n/config';
import { plural } from '@/i18n/plural';
import { getCatalog, getProductBySlug } from '@/lib/catalog/repository';
import { bundleSavings, categoryLineage, collectionsForProduct, relatedProducts, rootCategoryOf } from '@/lib/catalog/queries';
import { toProductSummary } from '@/lib/catalog/summary';
import { getApprovedReviews } from '@/lib/catalog/reviews';
import { getSessionUser } from '@/lib/auth/session';
import { getMyReview, getOwnedProductIdsForUser } from '@/lib/account/queries';
import { isCheckoutAvailable } from '@/lib/payments';
import { features, siteConfig } from '@/lib/config/site';
import { formatDate, formatMoney } from '@/lib/format';
import { JsonLd, productLd } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/metadata';
import { FORMATS } from '@/data/formats';
import { LICENSES } from '@/data/licenses';
import { Breadcrumbs } from '@/components/layout/PageHeader';
import { ProductGallery } from '@/components/products/ProductGallery';
import { PurchasePanel } from '@/components/products/PurchasePanel';
import { ProductCard } from '@/components/products/ProductCard';
import { CollectionCard } from '@/components/home/HomeSections';
import { FormatChip } from '@/components/ui/FormatChip';
import { StarRating } from '@/components/ui/StarRating';
import { ButtonLink } from '@/components/ui/Button';
import { ReviewForm } from '@/components/reviews/ReviewForm';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const { locale } = await getI18n();
  return pageMetadata({
    title: pick(product.seo.title ?? product.title, locale),
    description: pick(product.seo.description ?? product.shortDescription, locale),
    path: `/products/${product.slug}`,
    image: `/og/products/${product.slug}`,
  });
}

function Section({ id, title, children, className = '' }: { id: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-32 border-t border-line py-10 first:border-t-0 first:pt-0 ${className}`}>
      <h2 id={`${id}-title`} className="t-h3 mb-6 text-fg">
        {title}
      </h2>
      {children}
    </section>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-fg-muted">
          <Check className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { t, locale } = await getI18n();
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const { products, categories, collections } = await getCatalog();
  const summary = toProductSummary(product, categories);
  const lineage = categoryLineage(categories, product.categoryId);
  const root = rootCategoryOf(categories, product.categoryId);
  const related = relatedProducts(product, products, 4).map((p) => toProductSummary(p, categories));
  const inCollections = collectionsForProduct(collections, product.id);
  const summaries = new Map(products.map((p) => [p.id, toProductSummary(p, categories)]));
  const bundleItems = product.bundleProductIds.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const savings = bundleSavings(product, products);
  const containingBundles = products.filter((p) => p.productType === 'bundle' && p.bundleProductIds.includes(product.id));

  const [reviews, user] = await Promise.all([features.reviews ? getApprovedReviews(product.id) : Promise.resolve([]), getSessionUser()]);
  const owned = user ? (await getOwnedProductIdsForUser(user.id)).includes(product.id) : false;
  const myReview = user && owned ? await getMyReview(product.id, user.id) : null;
  const purchasable = isCheckoutAvailable();
  const license = LICENSES[product.license];
  const title = pick(product.title, locale);

  const faq = [
    ...product.faq.map((f) => ({ q: pick(f.question, locale), a: pick(f.answer, locale) })),
    { q: t.product.deliveryFaqQuestion, a: t.product.deliveryFaqAnswer },
    { q: t.product.licenseFaqQuestion, a: t.product.licenseFaqAnswer },
  ];

  const sectionNav = [
    { id: 'overview', label: t.product.overview },
    { id: 'included', label: t.product.included },
    { id: 'compatibility', label: t.product.compatibility },
    { id: 'license', label: t.product.license },
    { id: 'faq', label: t.product.faq },
    ...(features.reviews ? [{ id: 'reviews', label: t.product.reviews }] : []),
  ];

  const deliveryText =
    product.delivery === 'download' ? t.product.deliveryDownload : product.delivery === 'external-link' ? t.product.deliveryLink : t.product.deliveryMixed;

  return (
    <>
      <JsonLd data={productLd(product, locale, { purchasable, imageUrl: `${siteConfig.url}/og/products/${product.slug}` })} />

      <div className="container-page pt-8 lg:pt-10">
        <Breadcrumbs
          label={t.product.breadcrumb}
          items={[
            { name: t.nav.home, href: '/' },
            { name: t.nav.products, href: '/products' },
            ...lineage.map((c) => ({ name: pick(c.name, locale), href: `/categories/${c.slug}` })),
            { name: title, href: `/products/${product.slug}` },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <ProductGallery
            images={product.gallery.length ? product.gallery : product.thumbnail ? [product.thumbnail] : []}
            productType={product.productType}
            tone={root?.tone ?? 'business'}
            title={title}
          />

          <div className="flex flex-col">
            <p className="t-eyebrow">
              {lineage.length ? pick(lineage[lineage.length - 1].name, locale) : ''} · {t.product.types[product.productType]}
            </p>
            <h1 className="mt-4 text-balance text-[clamp(1.9rem,1.35rem+1.7vw,2.85rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-fg">{title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-fg-muted">{pick(product.subtitle, locale)}</p>
            {product.rating && (
              <a href="#reviews" className="mt-4 flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
                <StarRating value={product.rating.average} label={`${product.rating.average.toFixed(1)} / 5`} />
                <span>
                  {product.rating.average.toFixed(1)} · {plural(t.reviews.basedOn, product.rating.count, locale)}
                </span>
              </a>
            )}
            <div className="mt-6 flex flex-wrap gap-1.5">
              {product.formats.map((format) => (
                <FormatChip key={format} format={format} showLabel />
              ))}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-fg-subtle">{t.product.version}</dt>
                <dd className="mt-0.5 text-fg">{product.version}</dd>
              </div>
              <div>
                <dt className="text-fg-subtle">{t.product.lastUpdated}</dt>
                <dd className="mt-0.5 text-fg">{formatDate(product.lastUpdated, locale, 'month-year')}</dd>
              </div>
              {product.fileSize && (
                <div>
                  <dt className="text-fg-subtle">{t.product.fileSize}</dt>
                  <dd className="mt-0.5 text-fg">{product.fileSize}</dd>
                </div>
              )}
            </dl>

            <div className="mt-8">
              <PurchasePanel product={summary} />
            </div>
          </div>
        </div>
      </div>

      <nav aria-label={t.product.overview} className="sticky top-16 z-20 mt-14 border-y border-line glass">
        <div className="container-page no-scrollbar relative flex gap-1 overflow-x-auto py-2">
          {sectionNav.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="shrink-0 rounded-full px-3 py-1.5 text-[13px] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg">
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_320px] lg:gap-16">
        <div className="min-w-0">
          <Section id="overview" title={t.product.overview}>
            <p className="max-w-3xl text-[17px] leading-[1.75] text-fg-muted">{pick(product.description, locale)}</p>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="t-eyebrow mb-4">{t.product.audience}</h3>
                <ul className="flex flex-col gap-2.5">
                  {pickList(product.audience, locale).map((item) => (
                    <li key={item} className="flex gap-3 text-[15px] text-fg">
                      <span className="mt-2.5 h-1 w-3 shrink-0 rounded-full bg-accent" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="t-eyebrow mb-4">{t.product.useCases}</h3>
                <ul className="flex flex-col gap-2.5">
                  {pickList(product.useCases, locale).map((item) => (
                    <li key={item} className="flex gap-3 text-[15px] text-fg">
                      <span className="mt-2.5 h-1 w-3 shrink-0 rounded-full bg-accent-2" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-10">
              <h3 className="t-eyebrow mb-4">{t.product.features}</h3>
              <CheckList items={pickList(product.features, locale)} />
            </div>
          </Section>

          <Section id="included" title={t.product.included}>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {pickList(product.includedItems, locale).map((item) => (
                <li key={item} className="flex items-center gap-3 px-5 py-4 text-[15px] text-fg">
                  <FileText className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex gap-2 text-sm text-fg-muted">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              {deliveryText}
            </p>
            {bundleItems.length > 0 && (
              <div className="mt-8 rounded-2xl border border-line p-5">
                <h3 className="text-sm font-medium text-fg">{t.product.bundleIncludes}</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {bundleItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 text-sm">
                      <Link href={`/products/${item.slug}`} className="text-fg-muted hover:text-fg">
                        {pick(item.title, locale)}
                      </Link>
                      <span className="tabular-nums text-fg-subtle">{formatMoney(item.price.amount, item.price.currency, locale)}</span>
                    </li>
                  ))}
                </ul>
                {savings && savings.savings > 0 && (
                  <p className="mt-4 border-t border-line pt-4 text-sm text-fg-muted">
                    {t.product.bundleSeparately}: <span className="tabular-nums line-through">{formatMoney(savings.separate, product.price.currency, locale)}</span> ·{' '}
                    {t.product.bundleSavings}: <span className="tabular-nums text-success">{formatMoney(savings.savings, product.price.currency, locale)}</span>
                  </p>
                )}
              </div>
            )}
          </Section>

          <Section id="compatibility" title={t.product.compatibility}>
            <dl className="overflow-hidden rounded-2xl border border-line">
              {[
                { label: t.product.formats, value: product.formats.map((f) => FORMATS[f].label).join(', ') },
                { label: t.product.software, value: product.software.join(', ') },
                { label: t.product.type, value: t.product.types[product.productType] },
                { label: t.product.version, value: product.version },
                { label: t.product.lastUpdated, value: formatDate(product.lastUpdated, locale, 'month-year') },
                ...(product.fileSize ? [{ label: t.product.fileSize, value: product.fileSize }] : []),
                ...product.specs.map((spec) => ({ label: pick(spec.label, locale), value: pick(spec.value, locale) })),
                { label: t.product.creator, value: product.creator.name },
              ].map((row, index) => (
                <div key={`${row.label}-${index}`} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] gap-4 border-b border-line px-5 py-3.5 text-sm last:border-b-0 odd:bg-surface">
                  <dt className="text-fg-subtle">{row.label}</dt>
                  <dd className="text-fg">{row.value}</dd>
                </div>
              ))}
            </dl>
            {pickList(product.requirements, locale).length > 0 && (
              <div className="mt-8">
                <h3 className="t-eyebrow mb-4">{t.product.requirements}</h3>
                <CheckList items={pickList(product.requirements, locale)} />
              </div>
            )}
            <div className="mt-8">
              <h3 className="t-eyebrow mb-4">{t.product.changelog}</h3>
              {product.changelog.length ? (
                <ol className="flex flex-col gap-4 border-l border-line pl-5">
                  {product.changelog.map((entry) => (
                    <li key={entry.version}>
                      <p className="text-sm font-medium text-fg">
                        {entry.version} <span className="font-normal text-fg-subtle">· {formatDate(entry.date, locale, 'long')}</span>
                      </p>
                      <p className="mt-1 text-sm text-fg-muted">{pick(entry.notes, locale)}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-fg-muted">
                  {t.product.currentVersion}: <span className="text-fg">{product.version}</span> ({formatDate(product.lastUpdated, locale, 'month-year')}). {t.product.noChangelog}
                </p>
              )}
            </div>
          </Section>

          <Section id="license" title={t.product.license}>
            <div className="rounded-2xl border border-line bg-surface p-6">
              <p className="text-lg font-semibold text-fg">{pick(license.name, locale)}</p>
              <p className="mt-1 text-sm text-fg-muted">{pick(license.summary, locale)}</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="t-eyebrow mb-3">{t.product.allowed}</p>
                  <ul className="flex flex-col gap-2">
                    {pickList(license.allowed, locale).map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-fg-muted">
                        <Plus className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="t-eyebrow mb-3">{t.product.notAllowed}</p>
                  <ul className="flex flex-col gap-2">
                    {pickList(license.notAllowed, locale).map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-fg-muted">
                        <Minus className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-6 border-t border-line pt-4 text-sm text-fg-muted">{t.product.updatesNote}</p>
              <Link href="/licenses" className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
                {t.product.licenseDetails}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </Section>

          <Section id="faq" title={t.product.faq}>
            <div className="divide-y divide-line border-y border-line">
              {faq.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex list-none items-center justify-between gap-6 py-5 text-[15px] font-medium text-fg [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <Plus className="h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-300 group-open:rotate-45" aria-hidden />
                  </summary>
                  <p className="pb-5 pr-8 text-sm leading-relaxed text-fg-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </Section>

          {features.reviews && (
            <Section id="reviews" title={t.reviews.title}>
              {reviews.length ? (
                <ul className="flex flex-col gap-4">
                  {reviews.map((review) => (
                    <li key={review.id} className="rounded-2xl border border-line bg-surface p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <StarRating value={review.rating} label={`${review.rating} / 5`} />
                        <span className="text-xs text-fg-subtle">{formatDate(review.createdAt, locale, 'short')}</span>
                      </div>
                      {review.title && <p className="mt-3 font-medium text-fg">{review.title}</p>}
                      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{review.body}</p>
                      <p className="mt-4 text-xs text-fg-subtle">
                        {review.authorName} · <span className="text-success">{t.reviews.verified}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-line-strong p-6">
                  <p className="font-medium text-fg">{t.reviews.empty}</p>
                  <p className="mt-1 text-sm text-fg-muted">{t.reviews.emptyBody}</p>
                </div>
              )}
              <div className="mt-6">
                {owned && !myReview ? (
                  <ReviewForm productId={product.id} />
                ) : owned && myReview ? (
                  <p className="text-sm text-fg-muted">{myReview.status === 'pending' ? t.reviews.submitted : t.reviews.alreadyReviewed}</p>
                ) : (
                  <p className="text-sm text-fg-subtle">{t.reviews.onlyBuyers}</p>
                )}
              </div>
            </Section>
          )}
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm font-medium text-fg">{title}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-fg">{formatMoney(product.price.amount, product.price.currency, locale)}</p>
            <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-[13px] text-fg-muted">
              <li>
                {t.product.formats}: <span className="text-fg">{product.formats.map((f) => FORMATS[f].mark).join(' · ')}</span>
              </li>
              <li>
                {t.product.license}: <span className="text-fg">{pick(license.name, locale)}</span>
              </li>
              <li>
                {t.product.version}: <span className="text-fg">{product.version}</span>
              </li>
            </ul>
            {product.documentationUrl && (
              <a href={product.documentationUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline">
                {t.product.documentation}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
            {product.previewUrl && (
              <a href={product.previewUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-sm text-accent hover:underline">
                {t.product.livePreview}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </div>
          {inCollections.length > 0 && (
            <div className="mt-4 rounded-2xl border border-line p-5">
              <p className="t-eyebrow mb-3">{t.product.inCollections}</p>
              <ul className="flex flex-col gap-2">
                {inCollections.map((collection) => (
                  <li key={collection.id}>
                    <Link href={`/collections/${collection.slug}`} className="flex items-center justify-between gap-3 text-sm text-fg-muted hover:text-fg">
                      {pick(collection.title, locale)}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line py-16 lg:py-20" aria-labelledby="related-title">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4">
              <h2 id="related-title" className="t-h2 text-fg">
                {t.product.related}
              </h2>
              <ButtonLink href={root ? `/categories/${root.slug}` : '/products'} variant="ghost" size="sm">
                {t.common.viewAll}
              </ButtonLink>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} locale={locale} t={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {(inCollections.length > 0 || containingBundles.length > 0) && (
        <section className="border-t border-line py-16 lg:py-20" aria-labelledby="toolkit-title">
          <div className="container-page">
            <h2 id="toolkit-title" className="t-h2 text-fg">
              {t.product.completeToolkit}
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {containingBundles.map((bundle) => (
                <ProductCard key={bundle.id} product={toProductSummary(bundle, categories)} locale={locale} t={t} />
              ))}
              {inCollections.slice(0, 2).map((collection) => (
                <CollectionCard key={collection.id} collection={collection} products={summaries} t={t} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
