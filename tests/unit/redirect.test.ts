import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNextPath } from '../../src/lib/auth/redirect.ts';

test('keeps same-origin paths with query and hash', () => {
  assert.equal(safeNextPath('/library'), '/library');
  assert.equal(safeNextPath('/checkout?coupon=X#pay'), '/checkout?coupon=X#pay');
});

test('rejects open-redirect tricks', () => {
  const hostile = [
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example',
    '/\n/evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    'library',
    '/api/download?file=1',
    '',
    `/${'a'.repeat(600)}`,
  ];
  for (const value of hostile) assert.equal(safeNextPath(value, '/account'), '/account', JSON.stringify(value));
});

test('non-strings fall back', () => {
  assert.equal(safeNextPath(undefined), '/account');
  assert.equal(safeNextPath(['/library']), '/account');
  assert.equal(safeNextPath(null, '/library'), '/library');
});
