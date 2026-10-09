import 'server-only';
import { serverConfig } from '@/lib/config/server';
import { toMinorUnits } from '@/lib/format';
import { logger } from '@/lib/logger';
import { verifyStripeSignature } from './stripe-signature';
import { PaymentProviderError, type CreateCheckoutInput, type PaymentEvent, type PaymentProvider } from './types';

const STRIPE_API = 'https://api.stripe.com/v1';

/**
 * Stripe Checkout through the REST API (no SDK dependency).
 * Enabled only when STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set.
 * Card data is entered on Stripe's hosted page and never reaches this server.
 */
async function stripeRequest(path: string, params: URLSearchParams, idempotencyKey?: string) {
  let response: Response;
  try {
    response = await fetch(`${STRIPE_API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serverConfig.stripe.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: params,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    // Network failure or timeout: report it as a provider problem, not a generic error.
    logger.error('stripe.request_unreachable', { path, error });
    throw new PaymentProviderError('Stripe is unreachable', 'stripe');
  }
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const error = (body.error ?? {}) as Record<string, unknown>;
    logger.error('stripe.request_failed', { path, status: response.status, code: error.code, type: error.type });
    throw new PaymentProviderError(String(error.message ?? 'Stripe request failed'), 'stripe', response.status);
  }
  return body;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

export const stripeProvider: PaymentProvider = {
  id: 'stripe',
  isTest: false,

  async createCheckoutSession(input: CreateCheckoutInput) {
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', input.successUrl);
    params.set('cancel_url', input.cancelUrl);
    params.set('customer_email', input.customerEmail);
    params.set('client_reference_id', input.orderId);
    params.set('locale', input.locale);
    params.set('metadata[order_id]', input.orderId);
    params.set('metadata[order_number]', input.orderNumber);
    params.set('payment_intent_data[metadata][order_id]', input.orderId);
    input.lines.forEach((line, index) => {
      params.set(`line_items[${index}][quantity]`, '1');
      params.set(`line_items[${index}][price_data][currency]`, input.currency.toLowerCase());
      params.set(`line_items[${index}][price_data][unit_amount]`, String(toMinorUnits(line.amount, input.currency)));
      params.set(`line_items[${index}][price_data][product_data][name]`, line.name.slice(0, 250));
    });

    const session = await stripeRequest('/checkout/sessions', params, `checkout-${input.orderId}`);
    const id = str(session.id);
    const url = str(session.url);
    if (!id || !url) throw new PaymentProviderError('Stripe returned an incomplete session', 'stripe');
    return { sessionId: id, url };
  },

  parseWebhook(rawBody: string, headers: Headers): PaymentEvent | null {
    if (!verifyStripeSignature(rawBody, headers.get('stripe-signature'), serverConfig.stripe.webhookSecret)) {
      return null;
    }
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }
    const eventId = str(event.id);
    const type = str(event.type) ?? 'unknown';
    if (!eventId) return null;
    const object = ((event.data as Record<string, unknown> | undefined)?.object ?? {}) as Record<string, unknown>;
    const metadata = (object.metadata ?? {}) as Record<string, unknown>;
    const orderId = str(metadata.order_id) ?? str(object.client_reference_id);

    switch (type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        if (!orderId) return { kind: 'ignored', eventId, type };
        // Delayed payment methods complete later via async_payment_succeeded.
        if (type === 'checkout.session.completed' && object.payment_status !== 'paid') {
          return { kind: 'ignored', eventId, type };
        }
        return {
          kind: 'payment_succeeded',
          eventId,
          type,
          orderId,
          sessionId: str(object.id),
          paymentId: str(object.payment_intent),
          amountMinor: typeof object.amount_total === 'number' ? object.amount_total : null,
          currency: str(object.currency)?.toUpperCase() ?? null,
        };
      }
      case 'checkout.session.async_payment_failed':
        return orderId
          ? { kind: 'payment_failed', eventId, type, orderId, sessionId: str(object.id), reason: 'async_payment_failed' }
          : { kind: 'ignored', eventId, type };
      case 'checkout.session.expired':
        return orderId
          ? { kind: 'checkout_expired', eventId, type, orderId, sessionId: str(object.id) }
          : { kind: 'ignored', eventId, type };
      case 'charge.refunded': {
        const refundedFully = object.refunded === true;
        if (!refundedFully) return { kind: 'ignored', eventId, type };
        return { kind: 'refunded', eventId, type, orderId, paymentId: str(object.payment_intent) };
      }
      default:
        return { kind: 'ignored', eventId, type };
    }
  },

  async refund(paymentId: string) {
    const params = new URLSearchParams();
    params.set('payment_intent', paymentId);
    await stripeRequest('/refunds', params, `refund-${paymentId}`);
  },
};
