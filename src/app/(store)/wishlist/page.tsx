import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';
import { WishlistView } from '@/components/cart/WishlistView';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.wishlist.title, description: t.wishlist.subtitle, path: '/wishlist', noIndex: true });
}

export default async function WishlistPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t.wishlist.title}
        description={t.wishlist.subtitle}
        crumbs={[{ name: t.nav.home, href: '/' }, { name: t.wishlist.title, href: '/wishlist' }]}
        crumbLabel={t.product.breadcrumb}
      />
      <div className="container-page py-10 lg:py-14">
        <WishlistView />
      </div>
    </>
  );
}
