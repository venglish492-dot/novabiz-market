import { pick } from '@/i18n/config';
import { requireAdmin } from '@/lib/auth/session';
import { adminAnalytics, adminOverview, adminProducts } from '@/lib/admin/queries';
import { features } from '@/lib/config/site';
import { formatMoney, formatNumber } from '@/lib/format';
import { Notice } from '@/components/ui/Notice';
import { AdminPage, Panel, StatCard } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

/** Real numbers only: event counts from analytics_events and sales from verified orders. */
export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const { a, locale } = await getAdminI18n();
  const [{ counts, views }, overview, products] = await Promise.all([adminAnalytics(), adminOverview(), adminProducts()]);
  const funnel = ['product_view', 'add_to_cart', 'begin_checkout', 'payment_success'];
  const productViews = counts.get('product_view') ?? 0;
  const topViewed = [...views.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8);

  return (
    <AdminPage title={a.nav.analytics}>
      {!features.analytics && (
        <div className="mb-6">
          <Notice tone="info">{a.analytics.disabled}</Notice>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={a.overview.revenue}
          value={overview.revenueByCurrency.length ? overview.revenueByCurrency.map(([c, v]) => formatMoney(v, c, locale)).join(' · ') : formatMoney(0, 'RUB', locale)}
          hint={a.overview.revenueHint}
        />
        <StatCard label={a.overview.paidOrders} value={formatNumber(overview.paidCount, locale)} />
        <StatCard label={a.overview.refunds} value={formatNumber(overview.refundCount, locale)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title={a.analytics.funnel}>
          {productViews >= 50 ? (
            <ol className="flex flex-col gap-3">
              {funnel.map((name) => {
                const value = counts.get(name) ?? 0;
                const share = productViews ? Math.round((value / productViews) * 1000) / 10 : 0;
                return (
                  <li key={name}>
                    <div className="flex justify-between text-sm">
                      <span className="t-mono text-fg-muted">{name}</span>
                      <span className="tabular-nums text-fg">
                        {formatNumber(value, locale)} <span className="text-fg-subtle">({share}%)</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, share)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-fg-subtle">
              {a.common.notEnoughData}. {a.analytics.minData}
            </p>
          )}
        </Panel>
        <Panel title={a.analytics.events}>
          {counts.size ? (
            <ul className="flex flex-col divide-y divide-line text-sm">
              {[...counts.entries()]
                .sort((x, y) => y[1] - x[1])
                .map(([name, value]) => (
                  <li key={name} className="flex justify-between py-2">
                    <span className="t-mono text-fg-muted">{name}</span>
                    <span className="tabular-nums text-fg">{formatNumber(value, locale)}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-subtle">{a.common.notEnoughData}</p>
          )}
        </Panel>
        <Panel title={a.analytics.topViewed}>
          {topViewed.length ? (
            <ul className="flex flex-col divide-y divide-line text-sm">
              {topViewed.map(([id, value]) => (
                <li key={id} className="flex justify-between py-2">
                  <span className="text-fg">{pick(products.find((p) => p.id === id)?.title ?? { ru: id, en: id }, locale)}</span>
                  <span className="tabular-nums text-fg-muted">{formatNumber(value, locale)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-subtle">{a.common.notEnoughData}</p>
          )}
        </Panel>
      </div>
    </AdminPage>
  );
}
