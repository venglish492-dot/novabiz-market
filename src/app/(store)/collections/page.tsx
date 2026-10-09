import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { getCatalog } from '@/lib/catalog/repository';
import { toProductSummary } from '@/lib/catalog/summary';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';
import { CollectionCard } from '@/components/home/HomeSections';
import { EmptyState } from '@/components/ui/EmptyState';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.catalog.collectionsTitle, description: t.catalog.collectionsSubtitle, path: '/collections' });
}

export default async function CollectionsPage() {
  const { t, locale } = await getI18n();
  const { products, categories, collections } = await getCatalog();
  const summaries = new Map(products.map((p) => [p.id, toProductSummary(p, categories)]));

  return (
    <>
      <PageHeader
        eyebrow={t.catalog.collectionsEyebrow}
        title={t.catalog.collectionsTitle}
        description={t.catalog.collectionsSubtitle}
        crumbs={[
          { name: t.nav.home, href: '/' },
          { name: t.nav.collections, href: '/collections' },
        ]}
        crumbLabel={t.product.breadcrumb}
      />
      <div className="container-page py-12 lg:py-16">
        {collections.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} products={summaries} t={t} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState title={t.common.comingSoon} body={t.catalog.collectionsSubtitle} />
        )}
      </div>
    </>
  );
}
