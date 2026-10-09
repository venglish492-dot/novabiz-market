import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { pick } from '@/i18n/config';
import { plural } from '@/i18n/plural';
import { getCatalog } from '@/lib/catalog/repository';
import { collectionProducts } from '@/lib/catalog/queries';
import { toProductSummary } from '@/lib/catalog/summary';
import { parseCatalogParams, type RawParams } from '@/lib/catalog/params';
import { browse } from '@/lib/catalog/browse';
import { formatMoney } from '@/lib/format';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';
import { CatalogView } from '@/components/catalog/CatalogView';
import { CollectionCard, FeaturedProduct } from '@/components/home/HomeSections';
import { getHomeContent } from '@/content/home';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getI18n();
  const { collections } = await getCatalog();
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) return {};
  return pageMetadata({
    title: pick(collection.title, locale),
    description: pick(collection.description, locale),
    path: `/collections/${collection.slug}`,
  });
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { t, locale } = await getI18n();
  const { products, categories, collections } = await getCatalog();
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) notFound();

  const items = collectionProducts(collection, products);
  const state = parseCatalogParams(await searchParams, categories);
  const result = browse(items, categories, state, state.sort === 'recommended' ? items : undefined);
  const featured = items.find((p) => p.id === collection.featuredProductId) ?? items[0];
  const currency = items[0]?.price.currency;
  const sameCurrency = items.every((p) => p.price.currency === currency);
  const separately = items.reduce((sum, p) => sum + Math.round(p.price.amount * 100), 0) / 100;
  const summaries = new Map(products.map((p) => [p.id, toProductSummary(p, categories)]));
  const others = collections.filter((c) => c.id !== collection.id).slice(0, 2);

  return (
    <>
      <PageHeader
        eyebrow={t.catalog.collectionsEyebrow}
        title={pick(collection.title, locale)}
        description={pick(collection.description, locale)}
        crumbs={[
          { name: t.nav.home, href: '/' },
          { name: t.nav.collections, href: '/collections' },
          { name: pick(collection.title, locale), href: `/collections/${collection.slug}` },
        ]}
        crumbLabel={t.product.breadcrumb}
        aside={
          sameCurrency && currency ? (
            <div className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm">
              <p className="text-fg-subtle">{t.catalog.collectionSeparately}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-fg">{formatMoney(separately, currency, locale)}</p>
              <p className="mt-1 text-xs text-fg-subtle">{plural(t.common.products, items.length, locale)}</p>
            </div>
          ) : undefined
        }
      />
      {featured && (
        <div className="-mb-10 lg:-mb-14">
          <FeaturedProduct t={t} locale={locale} content={{ ...getHomeContent(locale), featured: { ...getHomeContent(locale).featured, eyebrow: t.catalog.collectionFeatured } }} product={toProductSummary(featured, categories)} />
        </div>
      )}
      <section className="container-page py-10 lg:py-14" aria-label={t.catalog.collectionProducts}>
        <h2 className="t-h3 mb-8 text-fg">{t.catalog.collectionProducts}</h2>
        <CatalogView result={result} state={state} t={t} locale={locale} />
      </section>
      {others.length > 0 && (
        <section className="container-page border-t border-line py-14" aria-labelledby="other-collections">
          <h2 id="other-collections" className="t-h3 mb-8 text-fg">
            {t.catalog.otherCollections}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {others.map((c) => (
              <CollectionCard key={c.id} collection={c} products={summaries} t={t} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
