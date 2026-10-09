import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { getCatalog } from '@/lib/catalog/repository';
import { sortProducts } from '@/lib/catalog/queries';
import { toProductSummary } from '@/lib/catalog/summary';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';
import { CartView } from '@/components/cart/CartView';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.cart.title, description: t.meta.description, path: '/cart', noIndex: true });
}

export default async function CartPage() {
  const { t } = await getI18n();
  const { products, categories } = await getCatalog();
  const suggestions = sortProducts(products, 'recommended')
    .slice(0, 24)
    .map((p) => toProductSummary(p, categories));

  return (
    <>
      <PageHeader title={t.cart.title} crumbs={[{ name: t.nav.home, href: '/' }, { name: t.cart.title, href: '/cart' }]} crumbLabel={t.product.breadcrumb} />
      <div className="container-page py-10 lg:py-14">
        <CartView suggestions={suggestions} />
      </div>
    </>
  );
}
