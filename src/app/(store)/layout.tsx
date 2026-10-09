import { getI18n } from '@/i18n/server';
import { getCatalog } from '@/lib/catalog/repository';
import { categoryTree, countByCategory } from '@/lib/catalog/queries';
import { SiteHeader, type NavData } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CommandPalette } from '@/components/search/CommandPalette';
import { QuickView } from '@/components/products/QuickView';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();
  const { products, categories, collections } = await getCatalog();
  const counts = countByCategory(products, categories);

  const nav: NavData = {
    categories: categoryTree(categories)
      .filter((root) => (counts.get(root.id) ?? 0) > 0)
      .map((root) => ({
        slug: root.slug,
        name: root.name,
        description: root.description,
        count: counts.get(root.id) ?? 0,
        tone: root.tone,
      })),
    collections: collections.map((c) => ({ slug: c.slug, title: c.title })),
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[80] rounded-full bg-primary px-4 py-2 text-sm text-primary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        {t.nav.skipToContent}
      </a>
      <SiteHeader nav={nav} />
      <main id="main" className="relative z-[1]">
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
      <CommandPalette />
      <QuickView />
    </>
  );
}
