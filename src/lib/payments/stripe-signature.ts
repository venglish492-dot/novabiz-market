import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify a Stripe webhook signature (`Stripe-Signature` header).
 * Signed payload is `${timestamp}.${rawBody}`, HMAC-SHA256 with the endpoint
 * secret; any `v1` signature may match. Rejects stale timestamps to prevent
 * replay. Pure function — unit tested.
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  options: { toleranceSeconds?: number; now?: number } = {},
): boolean {
  if (!header || !secret) return false;
  const tolerance = options.toleranceSeconds ?? 300;
  const now = Math.floor((options.now ?? Date.now()) / 1000);

  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const [key, value] = part.split('=', 2).map((s) => s?.trim());
    if (key === 't' && value) timestamp = Number.parseInt(value, 10);
    if (key === 'v1' && value) signatures.push(value);
  }
  if (timestamp === null || !Number.isFinite(timestamp) || !signatures.length) return false;
  if (Math.abs(now - timestamp) > tolerance) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest();
  return signatures.some((signature) => {
    if (!/^[0-9a-f]+$/i.test(signature)) return false;
    const provided = Buffer.from(signature, 'hex');
    return provided.length === expected.length && timingSafeEqual(provided, expected);
  });
}

/** Build a valid header for tests and local tooling. */
export function signStripePayload(rawBody: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
  return `t=${timestamp},v1=${signature}`;
}
