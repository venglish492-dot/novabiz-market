import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, DUMMY_HASH } from '../../src/lib/auth/password.ts';
import { safeNext } from '../../src/lib/auth/redirect.ts';

test('passwords hash with a unique salt and verify', async () => {
  const a = await hashPassword('correct horse battery');
  const b = await hashPassword('correct horse battery');
  assert.notEqual(a, b);
  assert.ok(a.startsWith('scrypt$'));
  assert.equal(await verifyPassword('correct horse battery', a), true);
  assert.equal(await verifyPassword('wrong', a), false);
  assert.equal(await verifyPassword('anything', DUMMY_HASH), false);
  assert.equal(await verifyPassword('anything', 'garbage'), false);
});

test('post-login redirects stay on this site', () => {
  assert.equal(safeNext('/dashboard/media'), '/dashboard/media');
  for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', 42]) assert.equal(safeNext(bad), '/dashboard');
});
