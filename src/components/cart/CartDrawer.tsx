'use client';

import Link from 'next/link';
import { ShoppingBag, X } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { plural } from '@/i18n/plural';
import { formatMoney } from '@/lib/format';
import { Dialog } from '@/components/ui/Dialog';
import { buttonClasses } from '@/components/ui/Button';
import { useCart } from '@/components/providers/CommerceProvider';
import { CartLine } from './CartLine';

export function cartSubtotal(items: { price: { amount: number; currency: string } }[]) {
  const currency = items[0]?.price.currency ?? 'RUB';
  const amount = items.reduce((sum, item) => sum + Math.round(item.price.amount * 100), 0) / 100;
  return { amount, currency };
}

export function CartDrawer() {
  const { t, locale } = useI18n();
  const cart = useCart();
  const subtotal = cartSubtotal(cart.items);

  return (
    <Dialog open={cart.isOpen} onClose={cart.close} labelledBy="cart-drawer-title" variant="sheet-right">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
        <h2 id="cart-drawer-title" className="flex items-baseline gap-2 text-base font-semibold text-fg">
          {t.cart.title}
          {cart.count > 0 && <span className="text-sm font-normal text-fg-subtle">{plural(t.common.items, cart.count, locale)}</span>}
        </h2>
        <button type="button" onClick={cart.close} className={buttonClasses({ variant: 'ghost', size: 'icon' })} aria-label={t.common.close}>
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {cart.items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-2 text-fg-muted">
            <ShoppingBag className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-base font-semibold text-fg">{t.cart.empty}</p>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t.cart.emptyBody}</p>
          <Link href="/products" onClick={cart.close} className={buttonClasses({ variant: 'primary', size: 'md', className: 'mt-6' })}>
            {t.cart.browse}
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
            {cart.items.map((item) => (
              <CartLine key={item.id} product={item} onRemove={() => cart.remove(item.id)} onNavigate={cart.close} />
            ))}
          </ul>
          <div className="shrink-0 border-t border-line bg-surface-2/60 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-fg-muted">{t.common.subtotal}</span>
              <span className="text-xl font-semibold tabular-nums text-fg">{formatMoney(subtotal.amount, subtotal.currency, locale)}</span>
            </div>
            <p className="mt-1 text-xs text-fg-subtle">{t.cart.estimated}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/cart" onClick={cart.close} className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
                {t.cart.viewCart}
              </Link>
              <Link href="/checkout" onClick={cart.close} className={buttonClasses({ variant: 'primary', size: 'lg' })}>
                {t.cart.checkout}
              </Link>
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}
