import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signStripePayload, verifyStripeSignature } from '../../src/lib/payments/stripe-signature.ts';

const secret = 'whsec_unit_test_secret';
const body = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });
const t = 1_790_000_000;
const now = t * 1000;

test('accepts a correctly signed payload', () => {
  assert.equal(verifyStripeSignature(body, signStripePayload(body, secret, t), secret, { now }), true);
});

test('rejects a tampered body', () => {
  const header = signStripePayload(body, secret, t);
  assert.equal(verifyStripeSignature(body.replace('evt_1', 'evt_2'), header, secret, { now }), false);
});

test('rejects the wrong secret', () => {
  assert.equal(verifyStripeSignature(body, signStripePayload(body, 'whsec_other', t), secret, { now }), false);
});

test('rejects stale and future timestamps (replay protection)', () => {
  const header = signStripePayload(body, secret, t);
  assert.equal(verifyStripeSignature(body, header, secret, { now: now + 301_000 }), false);
  assert.equal(verifyStripeSignature(body, header, secret, { now: now - 301_000 }), false);
  assert.equal(verifyStripeSignature(body, header, secret, { now: now + 299_000 }), true);
});

test('rejects missing or malformed headers', () => {
  assert.equal(verifyStripeSignature(body, null, secret, { now }), false);
  assert.equal(verifyStripeSignature(body, '', secret, { now }), false);
  assert.equal(verifyStripeSignature(body, `t=${t}`, secret, { now }), false);
  assert.equal(verifyStripeSignature(body, 'v1=abc', secret, { now }), false);
  assert.equal(verifyStripeSignature(body, `t=${t},v1=not-hex`, secret, { now }), false);
  assert.equal(verifyStripeSignature(body, `t=${t},v1=abcd`, secret, { now }), false);
});

test('rejects when no secret is configured', () => {
  assert.equal(verifyStripeSignature(body, signStripePayload(body, secret, t), '', { now }), false);
});

test('accepts any matching v1 signature (secret rotation)', () => {
  const valid = signStripePayload(body, secret, t).split('v1=')[1];
  const header = `t=${t},v1=${'0'.repeat(64)},v1=${valid}`;
  assert.equal(verifyStripeSignature(body, header, secret, { now }), true);
});
