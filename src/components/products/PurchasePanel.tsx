'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Info, Link2, Zap } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { pick } from '@/i18n/config';
import { LICENSES } from '@/data/licenses';
import { formatMoney } from '@/lib/format';
import { track } from '@/lib/client/analytics';
import type { ProductSummary } from '@/lib/catalog/summary';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/providers/CommerceProvider';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { AddToCartButton, WishlistButton } from './ProductActions';

export function PurchasePanel({ product }: { product: ProductSummary }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const cart = useCart();
  const { checkoutAvailable } = useSession();
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelVisible, setPanelVisible] = useState(true);
  const owned = cart.owned(product.id);

  useEffect(() => {
    track('product_view', { productId: product.id });
  }, [product.id]);

  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setPanelVisible(entry.isIntersecting || entry.boundingClientRect.top > 0), {
      threshold: 0,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const buyNow = () => {
    if (!cart.has(product.id)) cart.add(product);
    track('begin_checkout', { productId: product.id });
    router.push('/checkout');
  };

  const deliveryText =
    product.delivery === 'download' ? t.product.deliveryDownload : product.delivery === 'external-link' ? t.product.deliveryLink : t.product.deliveryMixed;

  return (
    <>
      <div ref={panelRef} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="t-eyebrow mb-2">{t.product.priceLabel}</p>
            <Price price={product.price} compareAtAmount={product.compareAtAmount} locale={locale} size="lg" compareLabel={t.product.compareAt} />
          </div>
          <div className="flex items-center gap-1.5">
            <ShareButton />
            <WishlistButton product={product} />
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <AddToCartButton product={product} size="lg" openDrawer variant={owned ? 'secondary' : 'primary'} />
          {!owned && (
            <Button variant="secondary" size="lg" onClick={buyNow}>
              <Zap className="h-4 w-4" aria-hidden />
              {t.product.buyNow}
            </Button>
          )}
        </div>

        {!checkoutAvailable && !owned && (
          <p className="mt-3 flex gap-2 rounded-xl bg-warning-soft px-3 py-2.5 text-xs leading-relaxed text-fg-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
            {t.config.paymentsUnavailableBody}
          </p>
        )}

        <ul className="mt-5 flex flex-col gap-2.5 border-t border-line pt-5 text-[13px] text-fg-muted">
          <li className="flex gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            {deliveryText}
          </li>
          <li className="flex gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            <span>
              {t.product.license}: <span className="text-fg">{pick(LICENSES[product.license].name, locale)}</span> —{' '}
              {pick(LICENSES[product.license].summary, locale)}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            {t.product.oneLicense}
          </li>
        </ul>
      </div>

      {/* Mobile sticky purchase bar, shown once the main panel scrolls away. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line glass px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 transition-transform duration-300 lg:hidden ${
          panelVisible ? 'translate-y-full' : 'translate-y-0'
        }`}
        aria-hidden={panelVisible}
        inert={panelVisible}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-fg-subtle">{pick(product.title, locale)}</p>
            <p className="text-base font-semibold tabular-nums text-fg">{formatMoney(product.price.amount, product.price.currency, locale)}</p>
          </div>
          <AddToCartButton product={product} size="md" openDrawer />
        </div>
      </div>
    </>
  );
}

function ShareButton() {
  const { t } = useI18n();
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast({ message: t.common.linkCopied, tone: 'info' });
        } catch {
          toast({ message: window.location.href, tone: 'info' });
        }
      }}
      aria-label={t.common.copyLink}
      title={t.common.copyLink}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      <Link2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
