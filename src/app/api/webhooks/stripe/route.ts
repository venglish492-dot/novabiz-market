import { serverConfig } from '@/lib/config/server';
import { stripeProvider } from '@/lib/payments/stripe';
import { handlePaymentEvent } from '@/lib/orders/service';
import { logger } from '@/lib/logger';

/**
 * Stripe webhook. Orders are marked paid only here (or by the dev sandbox),
 * after signature verification, amount/currency checks and idempotency
 * checks — never because the browser reports a successful payment.
 */
export async function POST(request: Request) {
  if (!serverConfig.stripe.configured) {
    return Response.json({ error: 'not_configured' }, { status: 404 });
  }

  const rawBody = await request.text();
  const event = stripeProvider.parseWebhook?.(rawBody, request.headers) ?? null;
  if (!event) {
    logger.warn('webhook.stripe.rejected');
    return Response.json({ error: 'invalid_signature' }, { status: 400 });
  }

  try {
    const outcome = await handlePaymentEvent('stripe', event);
    return Response.json({ received: true, outcome });
  } catch (error) {
    // A 5xx makes Stripe retry; processing is idempotent.
    logger.error('webhook.stripe.failed', { eventId: event.eventId, type: event.type, error });
    return Response.json({ error: 'processing_failed' }, { status: 500 });
  }
}
