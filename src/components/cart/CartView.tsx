'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, ShoppingBag, Tag } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { plural } from '@/i18n/plural';
import { formatMoney } from '@/lib/format';
import { track } from '@/lib/client/analytics';
import type { ProductSummary } from '@/lib/catalog/summary';
import { useCart } from '@/components/providers/CommerceProvider';
import { useSession } from '@/components/providers/SessionProvider';
import { Button, buttonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notice } from '@/components/ui/Notice';
import { ProductCard } from '@/components/products/ProductCard';
import { CartLine } from './CartLine';
import { cartSubtotal } from './CartDrawer';

/** Rank suggestions by shared goals and categories with what is already in the cart. */
function crossSell(cart: ProductSummary[], candidates: ProductSummary[], limit = 3): ProductSummary[] {
  const inCart = new Set(cart.map((p) => p.id));
  const goals = new Set(cart.flatMap((p) => p.goals));
  const categories = new Set(cart.map((p) => p.categoryId));
  return candidates
    .filter((p) => !inCart.has(p.id))
    .map((p) => ({ p, score: p.goals.filter((g) => goals.has(g)).length + (categories.has(p.categoryId) ? 2 : 0) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

export function CartView({ suggestions }: { suggestions: ProductSummary[] }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const cart = useCart();
  const { checkoutAvailable, user } = useSession();
  const [coupon, setCoupon] = useState('');
  const subtotal = cartSubtotal(cart.items);
  const related = useMemo(() => crossSell(cart.items, suggestions), [cart.items, suggestions]);
  const ownedInCart = cart.items.filter((item) => cart.owned(item.id));

  if (!cart.hydrated) {
    return (
      <div className="grid gap-4" aria-busy="true">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-5 w-5" />}
        title={t.cart.empty}
        body={t.cart.emptyBody}
        action={
          <Link href="/products" className={buttonClasses()}>
            {t.cart.browse}
          </Link>
        }
      />
    );
  }

  const goToCheckout = () => {
    track('begin_checkout', { props: { items: cart.count } });
    const code = coupon.trim();
    router.push(code ? `/checkout?coupon=${encodeURIComponent(code)}` : '/checkout');
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <p className="text-sm text-fg-muted">{plural(t.common.items, cart.count, locale)}</p>
          <button type="button" onClick={cart.clear} className="text-sm text-fg-subtle underline-offset-4 hover:text-fg hover:underline">
            {t.cart.clear}
          </button>
        </div>
        <ul className="divide-y divide-line">
          {cart.items.map((item) => (
            <CartLine key={item.id} product={item} onRemove={() => cart.remove(item.id)} />
          ))}
        </ul>
        {ownedInCart.length > 0 && (
          <div className="mt-4">
            <Notice tone="warning">{t.checkout.errors.alreadyOwned}</Notice>
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-14" aria-labelledby="cross-sell-title">
            <h2 id="cross-sell-title" className="t-h3 mb-6 text-fg">
              {t.cart.crossSell}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} t={t} />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-base font-semibold text-fg">{t.checkout.summary}</h2>
          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-fg-muted">{t.common.subtotal}</dt>
              <dd className="tabular-nums text-fg">{formatMoney(subtotal.amount, subtotal.currency, locale)}</dd>
            </div>
          </dl>
          <form
            className="mt-5 border-t border-line pt-5"
            onSubmit={(event) => {
              event.preventDefault();
              goToCheckout();
            }}
          >
            <label htmlFor="cart-coupon" className="flex items-center gap-2 text-sm text-fg">
              <Tag className="h-4 w-4 text-fg-subtle" aria-hidden />
              {t.cart.promo}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="cart-coupon"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32))}
                placeholder={t.cart.promoPlaceholder}
                autoComplete="off"
                className="h-10 min-w-0 flex-1 rounded-full border border-line-strong bg-surface-2 px-4 text-sm uppercase text-fg outline-none placeholder:normal-case placeholder:text-fg-subtle focus:border-accent"
              />
            </div>
            <p className="mt-2 text-xs text-fg-subtle">{t.cart.promoNote}</p>
          </form>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="text-sm text-fg-muted">{t.common.total}</span>
            <span className="text-2xl font-semibold tabular-nums text-fg">{formatMoney(subtotal.amount, subtotal.currency, locale)}</span>
          </div>
          <p className="mt-1 text-xs text-fg-subtle">{t.cart.estimated}</p>
          <Button size="lg" className="mt-6 w-full" onClick={goToCheckout}>
            {user ? t.cart.checkout : t.checkout.signIn}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          {!checkoutAvailable && <p className="mt-3 text-xs leading-relaxed text-fg-subtle">{t.config.paymentsUnavailableBody}</p>}
          <p className="mt-4 flex items-center gap-2 text-xs text-fg-subtle">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            {t.checkout.securityNote}
          </p>
        </div>
      </aside>
    </div>
  );
}
