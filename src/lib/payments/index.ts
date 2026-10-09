import 'server-only';
import { serverConfig } from '@/lib/config/server';
import { sandboxProvider } from './sandbox';
import { stripeProvider } from './stripe';
import type { PaymentProvider, PaymentProviderId } from './types';

/** Providers that are actually configured. Empty means checkout is unavailable. */
export function getEnabledProviders(): PaymentProvider[] {
  const providers: PaymentProvider[] = [];
  if (serverConfig.stripe.configured) providers.push(stripeProvider);
  if (serverConfig.sandbox.enabled) providers.push(sandboxProvider);
  return providers;
}

export function getPaymentProvider(id: PaymentProviderId): PaymentProvider | null {
  return getEnabledProviders().find((p) => p.id === id) ?? null;
}

/** Checkout requires an order store (Supabase with server key) and a provider. */
export function isCheckoutAvailable(): boolean {
  return serverConfig.supabase.adminConfigured && getEnabledProviders().length > 0;
}

export type { PaymentProvider, PaymentProviderId } from './types';
