import type { Locale } from '@/i18n/config';

export type PaymentProviderId = 'stripe' | 'sandbox';

export interface CheckoutLine {
  name: string;
  /** Net amount for this line after discounts, in major units. */
  amount: number;
}

export interface CreateCheckoutInput {
  orderId: string;
  orderNumber: string;
  currency: string;
  totalAmount: number;
  lines: CheckoutLine[];
  customerEmail: string;
  locale: Locale;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

/** Normalized result of a verified provider event. */
export type PaymentEvent =
  | {
      kind: 'payment_succeeded';
      eventId: string;
      type: string;
      orderId: string;
      sessionId: string | null;
      paymentId: string | null;
      amountMinor: number | null;
      currency: string | null;
    }
  | { kind: 'payment_failed' | 'checkout_expired'; eventId: string; type: string; orderId: string; sessionId: string | null; reason?: string }
  | { kind: 'refunded'; eventId: string; type: string; orderId: string | null; paymentId: string | null }
  | { kind: 'ignored'; eventId: string; type: string };

export interface PaymentProvider {
  id: PaymentProviderId;
  /** Test providers never touch real money; their orders are flagged `is_test`. */
  isTest: boolean;
  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession>;
  /** Verify authenticity and normalize. Returns null when verification fails. */
  parseWebhook?(rawBody: string, headers: Headers): PaymentEvent | null;
  refund?(paymentId: string): Promise<void>;
}

export class PaymentProviderError extends Error {
  constructor(
    message: string,
    readonly providerId: PaymentProviderId,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'PaymentProviderError';
  }
}
