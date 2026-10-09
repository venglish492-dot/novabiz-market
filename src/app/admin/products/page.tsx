import Link from 'next/link';
import { Plus } from 'lucide-react';
import { pick } from '@/i18n/config';
import { requireStaff } from '@/lib/auth/session';
import { adminCategories, adminProducts } from '@/lib/admin/queries';
import { formatDate, formatMoney } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { AdminPage, EmptyRow, Table, Td, Th } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

export default async function AdminProductsPage() {
  await requireStaff();
  const { a, locale } = await getAdminI18n();
  const [products, categories] = await Promise.all([adminProducts(), adminCategories()]);
  const categoryName = (id: string) => {
    const category = categories.find((c) => c.id === id);
    return category ? pick(category.name, locale) : id;
  };

  return (
    <AdminPage
      title={a.nav.products}
      actions={
        <>
          <ButtonLink href="/admin/products/new?type=bundle" variant="secondary" size="sm">
            {a.products.newBundle}
          </ButtonLink>
          <ButtonLink href="/admin/products/new" size="sm">
            <Plus className="h-4 w-4" aria-hidden />
            {a.products.new}
          </ButtonLink>
        </>
      }
    >
      <Table>
        <thead>
          <tr>
            <Th>{a.products.title}</Th>
            <Th>{a.products.category}</Th>
            <Th>{a.common.status}</Th>
            <Th className="text-right">{a.products.price}</Th>
            <Th>{a.common.updated}</Th>
          </tr>
        </thead>
        <tbody>
          {products.length ? (
            products.map((product) => (
              <tr key={product.id}>
                <Td>
                  <Link href={`/admin/products/${product.id}`} className="font-medium text-fg hover:underline">
                    {pick(product.title, locale)}
                  </Link>
                  <div className="t-mono mt-0.5 text-xs text-fg-subtle">/{product.slug}</div>
                  {product.isFeatured && <Badge tone="accent" className="mt-1.5">{a.products.featured}</Badge>}
                </Td>
                <Td className="text-fg-muted">
                  {categoryName(product.categoryId)}
                  <div className="text-xs text-fg-subtle">{product.productType}</div>
                </Td>
                <Td>
                  <Badge tone={product.status === 'published' ? 'success' : product.status === 'draft' ? 'warning' : 'neutral'}>
                    {a.products.statuses[product.status]}
                  </Badge>
                </Td>
                <Td className="text-right tabular-nums">{formatMoney(product.price.amount, product.price.currency, locale)}</Td>
                <Td className="text-fg-muted">{product.updatedAt ? formatDate(product.updatedAt, locale, 'short') : '—'}</Td>
              </tr>
            ))
          ) : (
            <EmptyRow colSpan={5} label={a.common.empty} />
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
