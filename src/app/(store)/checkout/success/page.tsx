import type { Metadata } from 'next';
import Link from 'next/link';
import { CircleCheck, CircleX, Clock, FlaskConical, RotateCcw } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { pick } from '@/i18n/config';
import { requireUser } from '@/lib/auth/session';
import { getOrder } from '@/lib/account/queries';
import { formatDate, formatMoney } from '@/lib/format';
import { pageMetadata } from '@/lib/seo/metadata';
import { uuidSchema } from '@/lib/validation/schemas';
import { LICENSES } from '@/data/licenses';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AutoRefresh, PaidEffects } from '@/components/checkout/OrderStatusEffects';

type Props = { searchParams: Promise<{ order?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.checkout.result.paidTitle, description: t.meta.description, path: '/checkout/success', noIndex: true });
}

/**
 * Order result. The status shown is the server's verified status — success is
 * displayed only after the provider's signed webhook marked the order paid.
 */
export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { t, locale } = await getI18n();
  const raw = (await searchParams).order;
  await requireUser(`/checkout/success${raw ? `?order=${encodeURIComponent(raw)}` : ''}`);
  const parsed = uuidSchema.safeParse(raw);
  const order = parsed.success ? await getOrder(parsed.data) : null;

  if (!order) {
    return (
      <div className="container-page max-w-2xl py-20">
        <EmptyState
          title={t.checkout.result.notFoundTitle}
          body={t.checkout.result.notFoundBody}
          action={<ButtonLink href="/account/purchases">{t.account.purchases}</ButtonLink>}
        />
      </div>
    );
  }

  const status = order.status;
  const paid = status === 'paid';
  const pending = status === 'pending' || status === 'payment_pending';
  const failed = status === 'failed' || status === 'cancelled';
  const title = paid
    ? t.checkout.result.paidTitle
    : pending
      ? t.checkout.result.pendingTitle
      : status === 'refunded'
        ? t.checkout.result.refundedTitle
        : status === 'cancelled'
          ? t.checkout.result.cancelledTitle
          : t.checkout.result.failedTitle;
  const body = paid
    ? t.checkout.result.paidBody
    : pending
      ? t.checkout.result.pendingBody
      : status === 'refunded'
        ? t.checkout.result.refundedBody
        : status === 'cancelled'
          ? t.checkout.result.cancelledBody
          : t.checkout.result.failedBody;

  return (
    <div className="container-page max-w-3xl py-14 lg:py-20">
      {pending && <AutoRefresh />}
      {paid && <PaidEffects productIds={order.items.map((item) => item.productId)} />}

      <div className="flex flex-col items-center text-center">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
            paid ? 'border-success/30 bg-success-soft text-success' : pending ? 'border-line-strong bg-surface-2 text-fg-muted' : 'border-danger/30 bg-danger-soft text-danger'
          }`}
        >
          {paid ? <CircleCheck className="h-6 w-6" aria-hidden /> : pending ? <Clock className="h-6 w-6 animate-pulse" aria-hidden /> : <CircleX className="h-6 w-6" aria-hidden />}
        </span>
        <h1 className="t-h1 mt-6 text-balance text-fg" role={pending ? 'status' : undefined}>
          {title}
        </h1>
        <p className="t-lead mt-4 max-w-xl">{body}</p>
        {order.isTest && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            {t.checkout.result.testOrder}
          </p>
        )}
      </div>

      <section className="mt-12 rounded-2xl border border-line bg-surface" aria-label={t.checkout.result.receipt}>
        <dl className="grid grid-cols-2 gap-4 border-b border-line p-6 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-fg-subtle">{t.checkout.result.orderNumber}</dt>
            <dd className="t-mono mt-1 text-fg">{order.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-fg-subtle">{t.checkout.result.date}</dt>
            <dd className="mt-1 text-fg">{formatDate(order.createdAt, locale, 'datetime')}</dd>
          </div>
          <div>
            <dt className="text-fg-subtle">{t.checkout.result.status}</dt>
            <dd className="mt-1 text-fg">{t.orderStatus[status]}</dd>
          </div>
        </dl>
        <ul className="divide-y divide-line px-6">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-start justify-between gap-4 py-4 text-sm">
              <div>
                <p className="text-fg">{pick(item.title, locale)}</p>
                <p className="mt-1 text-xs text-fg-subtle">
                  {t.product.license}: {pick(LICENSES[item.license]?.name ?? LICENSES.commercial.name, locale)} · {t.product.version} {item.version}
                </p>
              </div>
              <span className="tabular-nums text-fg">{formatMoney(item.unitAmount - item.discountAmount, order.currency, locale)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-line p-6 text-sm">
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-fg-muted">
                {t.common.discount}
                {order.couponCode ? ` (${order.couponCode})` : ''}
              </dt>
              <dd className="tabular-nums text-success">−{formatMoney(order.discount, order.currency, locale)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base">
            <dt className="font-medium text-fg">{t.common.total}</dt>
            <dd className="font-semibold tabular-nums text-fg">{formatMoney(order.total, order.currency, locale)}</dd>
          </div>
        </dl>
      </section>

      <p className="mt-4 text-center text-xs text-fg-subtle">{t.checkout.result.licenseNote}</p>

      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        {paid && <ButtonLink href="/library">{t.checkout.result.goToLibrary}</ButtonLink>}
        {pending && (
          <ButtonLink href={`/checkout/success?order=${order.id}`} variant="secondary">
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t.checkout.result.refresh}
          </ButtonLink>
        )}
        {failed && <ButtonLink href="/cart">{t.checkout.result.backToCart}</ButtonLink>}
        <Link href="/contact" className="inline-flex h-11 items-center justify-center px-5 text-sm text-fg-muted hover:text-fg">
          {t.common.contactSupport}
        </Link>
      </div>
    </div>
  );
}
