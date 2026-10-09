import Link from 'next/link';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { pick, type Locale } from '@/i18n/config';
import { formatDate, formatMoney } from '@/lib/format';
import type { OrderSummary } from '@/lib/account/queries';
import { Badge } from '@/components/ui/Badge';

export function OrdersTable({ orders, t, locale }: { orders: OrderSummary[]; t: Dictionary; locale: Locale }) {
  return (
    <div className="relative overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-surface text-xs text-fg-subtle">
          <tr>
            <th scope="col" className="px-5 py-3 font-medium">{t.account.order}</th>
            <th scope="col" className="px-5 py-3 font-medium">{t.account.orderDate}</th>
            <th scope="col" className="px-5 py-3 font-medium">{t.account.orderItems}</th>
            <th scope="col" className="px-5 py-3 font-medium">{t.account.orderStatus}</th>
            <th scope="col" className="px-5 py-3 text-right font-medium">{t.account.orderTotal}</th>
            <th scope="col" className="px-5 py-3"><span className="sr-only">{t.account.viewOrder}</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="t-mono px-5 py-4 text-xs text-fg">
                {order.orderNumber}
                {order.isTest && <Badge tone="warning" className="ml-2">{t.common.test}</Badge>}
              </td>
              <td className="px-5 py-4 text-fg-muted">{formatDate(order.createdAt, locale, 'short')}</td>
              <td className="max-w-[260px] truncate px-5 py-4 text-fg-muted">{order.items.map((item) => pick(item.title, locale)).join(', ')}</td>
              <td className="px-5 py-4">
                <Badge tone={order.status === 'paid' ? 'success' : order.status === 'failed' || order.status === 'cancelled' ? 'danger' : order.status === 'refunded' ? 'neutral' : 'warning'}>
                  {t.orderStatus[order.status]}
                </Badge>
              </td>
              <td className="px-5 py-4 text-right tabular-nums text-fg">{formatMoney(order.total, order.currency, locale)}</td>
              <td className="px-5 py-4 text-right">
                <Link href={`/checkout/success?order=${order.id}`} className="text-xs text-accent hover:underline">
                  {t.account.viewOrder}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
