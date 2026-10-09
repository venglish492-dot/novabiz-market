import 'server-only';
import { randomBytes } from 'node:crypto';
import type { CreateCheckoutInput, PaymentProvider } from './types';

/**
 * Development-only test provider. It is impossible to enable on the production
 * deployment (see serverConfig.sandbox), never charges money, and every order
 * it creates is flagged `is_test` and labelled "Test" in the UI.
 * The "payment page" is /checkout/sandbox, where a developer chooses success
 * or failure; the result is applied through the same fulfilment path as a
 * verified provider webhook.
 */
export const sandboxProvider: PaymentProvider = {
  id: 'sandbox',
  isTest: true,

  async createCheckoutSession(input: CreateCheckoutInput) {
    const sessionId = `sbx_${randomBytes(12).toString('hex')}`;
    const url = `/checkout/sandbox?order=${encodeURIComponent(input.orderId)}&session=${sessionId}`;
    return { sessionId, url };
  },
};
