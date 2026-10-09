import Link from 'next/link';
import { pick } from '@/i18n/config';
import { requireStaff } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/roles';
import { adminOverview } from '@/lib/admin/queries';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { AdminPage, EmptyRow, StatCard, Table, Td, Th } from '@/components/admin/ui';
import { getAdminI18n } from './admin-i18n';

export default async function AdminOverviewPage() {
  const user = await requireStaff();
  const { a, t, locale } = await getAdminI18n();
  if (!isAdminRole(user.role)) {
    return (
      <AdminPage title={a.nav.overview} description={a.common.adminOnly}>
        <Link href="/admin/products" className="text-accent hover:underline">
          {a.nav.products}
        </Link>
      </AdminPage>
    );
  }
  const data = await adminOverview();
  const revenue = data.revenueByCurrency.length
    ? data.revenueByCurrency.map(([currency, amount]) => formatMoney(amount, currency, locale)).join(' · ')
    : formatMoney(0, 'RUB', locale);
  const aov =
    data.paidCount && data.revenueByCurrency.length === 1
      ? formatMoney(data.revenueByCurrency[0][1] / data.paidCount, data.revenueByCurrency[0][0], locale)
      : '—';
  const conversion = data.checkoutsStarted >= 20 ? `${((data.paymentsSucceeded / data.checkoutsStarted) * 100).toFixed(1)}%` : a.common.notEnoughData;

  return (
    <AdminPage title={a.nav.overview}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={a.overview.revenue} value={revenue} hint={a.overview.revenueHint} />
        <StatCard label={a.overview.paidOrders} value={formatNumber(data.paidCount, locale)} />
        <StatCard label={a.overview.aov} value={aov} />
        <StatCard label={a.overview.conversion} value={conversion} hint={a.overview.conversionHint} />
        <StatCard label={a.overview.downloads} value={formatNumber(data.downloadCount, locale)} />
        <StatCard label={a.overview.refunds} value={formatNumber(data.refundCount, locale)} />
        <StatCard label={a.overview.publishedProducts} value={formatNumber(data.publishedProducts, locale)} />
        <StatCard label={a.overview.pendingReviews} value={formatNumber(data.pendingReviews, locale)} />
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="mb-4 text-base font-semibold text-fg">{a.overview.recentOrders}</h2>
          <Table minWidth={560}>
            <thead>
              <tr>
                <Th>{a.orders.number}</Th>
                <Th>{a.orders.customer}</Th>
                <Th>{a.common.status}</Th>
                <Th className="text-right">{a.orders.total}</Th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.length ? (
                data.recentOrders.map((order) => (
                  <tr key={String(order.id)}>
                    <Td className="t-mono text-xs">
                      {String(order.order_number)}
                      {Boolean(order.is_test) && <Badge tone="warning" className="ml-2">{a.common.test}</Badge>}
                      <div className="mt-1 font-sans text-fg-subtle">{formatDate(String(order.created_at), locale, 'datetime')}</div>
                    </Td>
                    <Td className="text-fg-muted">{String(order.email)}</Td>
                    <Td>
                      <Badge tone={order.status === 'paid' ? 'success' : 'neutral'}>{t.orderStatus[order.status as keyof typeof t.orderStatus]}</Badge>
                    </Td>
                    <Td className="text-right tabular-nums">{formatMoney(Number(order.total_amount), String(order.currency).trim(), locale)}</Td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={4} label={a.common.empty} />
              )}
            </tbody>
          </Table>
        </section>
        <section>
          <h2 className="mb-4 text-base font-semibold text-fg">{a.overview.topProducts}</h2>
          {data.topProducts.length ? (
            <ol className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
              {data.topProducts.map(([id, product]) => (
                <li key={id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <span className="text-fg">{pick(product.title as never, locale)}</span>
                  <span className="tabular-nums text-fg-muted">{product.count}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-2xl border border-dashed border-line-strong p-6 text-sm text-fg-subtle">{a.common.notEnoughData}</p>
          )}
        </section>
      </div>
    </AdminPage>
  );
}
