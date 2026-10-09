import { pick } from '@/i18n/config';
import { requireStaff } from '@/lib/auth/session';
import { adminCategories, adminCollections, adminProducts } from '@/lib/admin/queries';
import { AdminPage } from '@/components/admin/ui';
import { ProductEditor } from '@/components/admin/ProductEditor';
import { getAdminI18n } from '../../admin-i18n';

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireStaff();
  const { a, locale } = await getAdminI18n();
  const { type } = await searchParams;
  const [categories, collections, products] = await Promise.all([adminCategories(), adminCollections(), adminProducts()]);
  return (
    <AdminPage title={type === 'bundle' ? a.products.newBundle : a.products.new}>
      <ProductEditor
        product={null}
        defaultType={type === 'bundle' ? 'bundle' : undefined}
        categories={categories.map((c) => ({ id: c.id, label: `${c.parentId ? '— ' : ''}${pick(c.name, locale)}` }))}
        collections={collections.map((c) => ({ id: c.id, label: pick(c.title, locale) }))}
        products={products.map((p) => ({ id: p.id, label: pick(p.title, locale) }))}
        collectionIds={[]}
      />
    </AdminPage>
  );
}
