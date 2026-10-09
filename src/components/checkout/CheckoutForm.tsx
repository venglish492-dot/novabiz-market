'use client';

import { useActionState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, FlaskConical, Lock } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { interpolate } from '@/i18n/config';
import { placeOrderAction, type CheckoutFormState } from '@/lib/actions/checkout';
import { syncCartAction } from '@/lib/actions/commerce';
import { track } from '@/lib/client/analytics';
import { useCart } from '@/components/providers/CommerceProvider';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';

export function CheckoutForm({
  email,
  providers,
  couponCode,
  totalLabel,
  isFree,
}: {
  email: string;
  providers: Array<{ id: 'stripe' | 'sandbox'; isTest: boolean }>;
  couponCode: string;
  totalLabel: string;
  isFree: boolean;
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<CheckoutFormState, FormData>(placeOrderAction, {});

  const errorMessage = state.error
    ? state.error === 'terms'
      ? t.checkout.termsRequired
      : state.error === 'coupon' && state.couponReason
        ? t.checkout.couponRejected[state.couponReason]
        : state.error === 'rateLimited'
          ? t.checkout.errors.rateLimited
          : state.error === 'empty'
            ? t.checkout.emptyBody
            : state.error === 'alreadyOwned'
              ? t.checkout.errors.alreadyOwned
              : state.error === 'mixedCurrency'
                ? t.checkout.errors.mixedCurrency
                : state.error === 'unavailableItems'
                  ? t.checkout.errors.unavailableItems
                  : state.error === 'provider'
                    ? t.checkout.errors.provider
                    : t.checkout.errors.generic
    : null;

  const [termsBefore, rest1 = ''] = t.checkout.terms.split('{terms}');
  const [termsMiddle, rest2 = ''] = rest1.split('{licenses}');
  const [termsMiddle2, termsAfter = ''] = rest2.split('{refunds}');

  return (
    <form action={action} onSubmit={() => track('payment_start')} className="flex flex-col gap-8">
      <input type="hidden" name="coupon" value={couponCode} />

      <section aria-labelledby="checkout-contact">
        <h2 id="checkout-contact" className="text-base font-semibold text-fg">
          {t.checkout.contact}
        </h2>
        <div className="mt-4 rounded-xl border border-line bg-surface-2 px-4 py-3">
          <p className="text-xs text-fg-subtle">{t.auth.email}</p>
          <p className="mt-0.5 text-sm text-fg">{email}</p>
        </div>
        <p className="mt-2 text-xs text-fg-subtle">{t.checkout.emailNote}</p>
      </section>

      {!isFree && (
        <fieldset>
          <legend className="text-base font-semibold text-fg">{t.checkout.payment}</legend>
          <div className="mt-4 flex flex-col gap-2">
            {providers.map((provider, index) => (
              <label
                key={provider.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
              >
                <input type="radio" name="provider" value={provider.id} defaultChecked={index === 0} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium text-fg">
                    {provider.isTest ? <FlaskConical className="h-4 w-4 text-warning" aria-hidden /> : <CreditCard className="h-4 w-4" aria-hidden />}
                    {provider.id === 'stripe' ? t.checkout.providerStripe : t.checkout.providerSandbox}
                    {provider.isTest && (
                      <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
                        {t.common.test}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs text-fg-muted">
                    {provider.id === 'stripe' ? t.checkout.providerStripeNote : t.checkout.providerSandboxNote}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {isFree && <input type="hidden" name="provider" value={providers[0]?.id ?? 'stripe'} />}

      <label className="flex items-start gap-3 text-sm leading-relaxed text-fg-muted">
        <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]" />
        <span>
          {termsBefore}
          <Link href="/terms" target="_blank" className="text-fg underline underline-offset-4">
            {t.checkout.termsLink}
          </Link>
          {termsMiddle}
          <Link href="/licenses" target="_blank" className="text-fg underline underline-offset-4">
            {t.checkout.licensesLink}
          </Link>
          {termsMiddle2}
          <Link href="/refunds" target="_blank" className="text-fg underline underline-offset-4">
            {t.checkout.refundsLink}
          </Link>
          {termsAfter}
        </span>
      </label>

      {errorMessage && (
        <Notice tone="danger" role="alert">
          {errorMessage}
        </Notice>
      )}

      <div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          <Lock className="h-4 w-4" aria-hidden />
          {pending ? t.checkout.processing : isFree ? t.checkout.completeFree : interpolate(t.checkout.pay, { amount: totalLabel })}
        </Button>
        <p className="mt-3 text-center text-xs leading-relaxed text-fg-subtle">{t.checkout.securityNote}</p>
      </div>
    </form>
  );
}

/** Ensures the account cart contains everything in the local cart before pricing. */
export function CartSyncGuard({ serverIds }: { serverIds: string[] }) {
  const cart = useCart();
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !cart.hydrated) return;
    const server = new Set(serverIds);
    const missing = cart.items.filter((item) => !server.has(item.id));
    done.current = true;
    if (!missing.length) return;
    void syncCartAction(cart.items.map((item) => item.id)).then(() => router.refresh());
  }, [cart.hydrated, cart.items, serverIds, router]);

  return null;
}
