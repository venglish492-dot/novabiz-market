import Link from 'next/link';
import { Plus } from 'lucide-react';
import { pick } from '@/i18n/config';
import { requireStaff } from '@/lib/auth/session';
import { adminProducts } from '@/lib/admin/queries';
import { bundleSavings } from '@/lib/catalog/queries';
import { formatMoney } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { AdminPage, EmptyRow, Table, Td, Th } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

/** Bundles are products of type "bundle" with included products; savings are computed, never typed in. */
export default async function AdminBundlesPage() {
  await requireStaff();
  const { a, locale } = await getAdminI18n();
  const products = await adminProducts();
  const bundles = products.filter((p) => p.productType === 'bundle');
  return (
    <AdminPage
      title={a.nav.bundles}
      actions={
        <ButtonLink href="/admin/products/new?type=bundle" size="sm">
          <Plus className="h-4 w-4" aria-hidden />
          {a.products.newBundle}
        </ButtonLink>
      }
    >
      <Table>
        <thead>
          <tr>
            <Th>{a.products.title}</Th>
            <Th>{a.products.fields.bundleItems}</Th>
            <Th className="text-right">{a.products.price}</Th>
            <Th className="text-right">Σ</Th>
            <Th>{a.common.status}</Th>
          </tr>
        </thead>
        <tbody>
          {bundles.length ? (
            bundles.map((bundle) => {
              const savings = bundleSavings(bundle, products);
              return (
                <tr key={bundle.id}>
                  <Td>
                    <Link href={`/admin/products/${bundle.id}`} className="font-medium text-fg hover:underline">
                      {pick(bundle.title, locale)}
                    </Link>
                  </Td>
                  <Td className="text-fg-muted">
                    {bundle.bundleProductIds.map((id) => pick(products.find((p) => p.id === id)?.title ?? { ru: id, en: id }, locale)).join(', ') || '—'}
                  </Td>
                  <Td className="text-right tabular-nums">{formatMoney(bundle.price.amount, bundle.price.currency, locale)}</Td>
                  <Td className="text-right tabular-nums text-fg-muted">{savings ? formatMoney(savings.separate, bundle.price.currency, locale) : '—'}</Td>
                  <Td>
                    <Badge tone={bundle.status === 'published' ? 'success' : 'warning'}>{a.products.statuses[bundle.status]}</Badge>
                  </Td>
                </tr>
              );
            })
          ) : (
            <EmptyRow colSpan={5} label={a.common.empty} />
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
