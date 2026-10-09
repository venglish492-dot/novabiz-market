import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, ShoppingBag } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { interpolate, pick } from '@/i18n/config';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getEnabledProviders, isCheckoutAvailable } from '@/lib/payments';
import { quoteForUser } from '@/lib/orders/service';
import { normalizeCouponCode } from '@/lib/orders/pricing';
import { publicSupabase, siteConfig } from '@/lib/config/site';
import { formatMoney } from '@/lib/format';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notice } from '@/components/ui/Notice';
import { ButtonLink } from '@/components/ui/Button';
import { CartSyncGuard, CheckoutForm } from '@/components/checkout/CheckoutForm';

type Props = { searchParams: Promise<{ coupon?: string | string[] }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.checkout.title, description: t.meta.description, path: '/checkout', noIndex: true });
}

export default async function CheckoutPage({ searchParams }: Props) {
  const { t, locale } = await getI18n();
  const raw = (await searchParams).coupon;
  const couponCode = normalizeCouponCode(typeof raw === 'string' ? raw : '').slice(0, 32);
  const crumbs = [
    { name: t.nav.home, href: '/' },
    { name: t.cart.title, href: '/cart' },
    { name: t.checkout.title, href: '/checkout' },
  ];

  const header = <PageHeader eyebrow={t.checkout.eyebrow} title={t.checkout.title} crumbs={crumbs} crumbLabel={t.product.breadcrumb} />;

  // 1. Honest unavailable state: no fake payment when nothing is configured.
  if (!publicSupabase.configured || !isCheckoutAvailable()) {
    return (
      <>
        {header}
        <div className="container-page max-w-3xl py-12">
          <Notice tone="warning" title={t.checkout.unavailableTitle}>
            {t.checkout.unavailableBody}
          </Notice>
          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink href="/cart" variant="secondary">
              <ShoppingBag className="h-4 w-4" aria-hidden />
              {t.cart.viewCart}
            </ButtonLink>
            <a href={`mailto:${siteConfig.email}`} className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm text-fg-muted hover:text-fg">
              <Mail className="h-4 w-4" aria-hidden />
              {siteConfig.email}
            </a>
          </div>
        </div>
      </>
    );
  }

  // 2. Purchases are tied to accounts.
  const user = await getSessionUser();
  if (!user) {
    const next = encodeURIComponent(couponCode ? `/checkout?coupon=${couponCode}` : '/checkout');
    return (
      <>
        {header}
        <div className="container-page max-w-xl py-12">
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <h2 className="text-xl font-semibold text-fg">{t.checkout.signInTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t.checkout.signInBody}</p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <ButtonLink href={`/login?next=${next}`}>{t.checkout.signIn}</ButtonLink>
              <ButtonLink href={`/register?next=${next}`} variant="secondary">
                {t.checkout.createAccount}
              </ButtonLink>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 3. Server-authoritative quote from the account cart.
  const supabase = await createSupabaseServerClient();
  const { data: cartRows } = (await supabase?.from('cart_items').select('product_id').eq('user_id', user.id).order('added_at')) ?? { data: [] };
  const serverIds = (cartRows ?? []).map((row) => String(row.product_id));
  const priced = serverIds.length ? await quoteForUser({ userId: user.id, productIds: serverIds, couponCode }) : null;
  const quote = priced?.quote;
  const providers = getEnabledProviders().map((p) => ({ id: p.id, isTest: p.isTest }));

  if (!quote || !quote.lines.length) {
    return (
      <>
        {header}
        <CartSyncGuard serverIds={serverIds} />
        <div className="container-page py-12">
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" />}
            title={t.checkout.emptyTitle}
            body={t.checkout.emptyBody}
            action={<ButtonLink href="/products">{t.cart.browse}</ButtonLink>}
          />
        </div>
      </>
    );
  }

  const currency = quote.currency ?? 'RUB';
  const couponIssue = quote.issues.find((issue) => issue.kind === 'coupon');
  const unavailable = quote.issues.some((issue) => issue.kind === 'unavailable');

  return (
    <>
      {header}
      <CartSyncGuard serverIds={serverIds} />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_420px] lg:gap-16 lg:py-14">
        <div className="order-2 lg:order-1">
          <CheckoutForm
            email={user.email}
            providers={providers}
            couponCode={quote.coupon?.code ?? ''}
            totalLabel={formatMoney(quote.total, currency, locale)}
            isFree={quote.total === 0}
          />
        </div>

        <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-base font-semibold text-fg">{t.checkout.summary}</h2>
            <ul className="mt-5 flex flex-col gap-4">
              {quote.lines.map((line) => (
                <li key={line.productId} className="flex items-start justify-between gap-4 text-sm">
                  <Link href={`/products/${line.slug}`} className="text-fg hover:underline">
                    {pick(line.title, locale)}
                  </Link>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className={line.discountAmount ? 'block text-xs text-fg-subtle line-through' : 'text-fg'}>
                      {formatMoney(line.unitAmount, currency, locale)}
                    </span>
                    {line.discountAmount > 0 && <span className="text-fg">{formatMoney(line.unitAmount - line.discountAmount, currency, locale)}</span>}
                  </span>
                </li>
              ))}
            </ul>
            {unavailable && (
              <div className="mt-4">
                <Notice tone="warning">{t.checkout.errors.unavailableItems}</Notice>
              </div>
            )}

            <form action="/checkout" method="get" className="mt-6 border-t border-line pt-5">
              <label htmlFor="checkout-coupon" className="text-sm text-fg">
                {t.cart.promo}
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="checkout-coupon"
                  name="coupon"
                  defaultValue={couponCode}
                  maxLength={32}
                  autoComplete="off"
                  placeholder={t.cart.promoPlaceholder}
                  aria-invalid={Boolean(couponIssue)}
                  aria-describedby="checkout-coupon-message"
                  className="h-10 min-w-0 flex-1 rounded-full border border-line-strong bg-surface-2 px-4 text-sm uppercase text-fg outline-none placeholder:normal-case placeholder:text-fg-subtle focus:border-accent"
                />
                <button type="submit" className="h-10 rounded-full border border-line-strong px-4 text-sm text-fg hover:bg-surface-2">
                  {t.cart.applyPromo}
                </button>
              </div>
              <p id="checkout-coupon-message" className="mt-2 text-xs" role={couponIssue ? 'alert' : undefined}>
                {couponIssue && couponIssue.kind === 'coupon' ? (
                  <span className="text-danger">{t.checkout.couponRejected[couponIssue.reason]}</span>
                ) : quote.coupon ? (
                  <span className="text-success">
                    {interpolate(t.checkout.couponApplied, { code: quote.coupon.code })} ·{' '}
                    <Link href="/checkout" className="underline">
                      {t.cart.removePromo}
                    </Link>
                  </span>
                ) : (
                  <span className="text-fg-subtle">{t.cart.promoNote}</span>
                )}
              </p>
            </form>

            <dl className="mt-5 flex flex-col gap-2.5 border-t border-line pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-fg-muted">{t.common.subtotal}</dt>
                <dd className="tabular-nums text-fg">{formatMoney(quote.subtotal, currency, locale)}</dd>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-fg-muted">{t.common.discount}</dt>
                  <dd className="tabular-nums text-success">−{formatMoney(quote.discount, currency, locale)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-medium text-fg">{t.common.total}</dt>
                <dd className="text-2xl font-semibold tabular-nums text-fg">{formatMoney(quote.total, currency, locale)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}
