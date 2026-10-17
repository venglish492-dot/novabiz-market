import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateDocument, referencedAssetIds } from '../../src/features/profiles/document.ts';
import { validateUsername } from '../../src/features/profiles/username.ts';
import { checkUrl } from '../../src/lib/security/url.ts';
import { expandHandle } from '../../src/features/socials/platforms.ts';

const base = () => ({ profile: {}, theme: {}, seo: {}, links: [], tabs: [], widgets: [], badges: [], tracks: [] });
const link = (url: string, platform = 'github') => ({ id: randomUUID(), platform, url });

test('dangerous URL schemes are rejected', () => {
  for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>', 'vbscript:x', 'file:///etc/passwd', 'java\nscript:alert(1)', 'https://user:pass@example.com']) {
    assert.equal(checkUrl(url).ok, false, url);
  }
});

test('http(s) URLs are normalised; bare domains get https', () => {
  const result = checkUrl('example.com/me');
  assert.ok(result.ok && result.url === 'https://example.com/me');
  assert.equal(checkUrl('http://example.org').ok, true);
});

test('mailto is only allowed where permitted', () => {
  assert.equal(checkUrl('mailto:me@example.com').ok, false);
  assert.equal(checkUrl('mailto:me@example.com', { allowMailto: true }).ok, true);
  assert.equal(checkUrl('mailto:not-an-email', { allowMailto: true }).ok, false);
});

test('documents with unsafe links fail with a field path', () => {
  const result = validateDocument({ ...base(), links: [link('https://github.com/x'), link('javascript:alert(1)')] });
  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.issues.some((i) => i.path.startsWith('links.1')));
});

test('email links work for the email platform', () => {
  const result = validateDocument({ ...base(), links: [link('mailto:hi@example.com', 'email')] });
  assert.equal(result.ok, true);
});

test('widget configs are validated per type', () => {
  const bad = validateDocument({ ...base(), widgets: [{ id: randomUUID(), type: 'spotify', config: { url: 'https://evil.example/embed' } }] });
  assert.equal(bad.ok, false);
  const good = validateDocument({ ...base(), widgets: [{ id: randomUUID(), type: 'youtube', config: { url: 'https://youtu.be/dQw4w9WgXcQ' } }] });
  assert.equal(good.ok, true);
  const unknown = validateDocument({ ...base(), widgets: [{ id: randomUUID(), type: 'html', config: { html: '<script>' } }] });
  assert.equal(unknown.ok, false);
});

test('control characters are stripped and length limits enforced', () => {
  const ok = validateDocument({ ...base(), profile: { displayName: 'Hi\u0000there' } });
  assert.ok(ok.ok && ok.doc.profile.displayName === 'Hithere');
  const tooLong = validateDocument({ ...base(), profile: { description: 'x'.repeat(500) } });
  assert.equal(tooLong.ok, false);
});

test('widgets pointing at missing tabs fall back to the main area', () => {
  const result = validateDocument({ ...base(), widgets: [{ id: randomUUID(), type: 'text', tabId: randomUUID(), config: { body: 'x' } }] });
  assert.ok(result.ok && result.doc.widgets[0].tabId === null);
});

test('limits on list sizes', () => {
  const result = validateDocument({ ...base(), links: Array.from({ length: 41 }, () => link('https://example.com')) });
  assert.equal(result.ok, false);
});

test('referenced assets are collected from every location', () => {
  const ids = Array.from({ length: 4 }, () => randomUUID());
  const result = validateDocument({
    ...base(),
    profile: { avatarAssetId: ids[0] },
    theme: { background: { assetId: ids[1] } },
    widgets: [{ id: randomUUID(), type: 'gallery', config: { assetIds: [ids[2], ids[3]] } }],
  });
  assert.ok(result.ok);
  if (result.ok) assert.deepEqual(new Set(referencedAssetIds(result.doc)), new Set(ids));
});

test('usernames: format and reserved routes', () => {
  assert.equal(validateUsername('Nova').ok, true);
  assert.equal(validateUsername('@nova.lumen').ok, true);
  for (const bad of ['a', 'dashboard', 'admin', 'api', 'login', 'x'.repeat(30), '-nova', 'no va', 'nova..x', 'ñova', '_next']) {
    assert.equal(validateUsername(bad).ok, false, bad);
  }
});

test('handles expand into platform URLs', () => {
  assert.equal(expandHandle('instagram', '@someone'), 'https://instagram.com/someone');
  assert.equal(expandHandle('github', 'https://github.com/x'), 'https://github.com/x');
  assert.equal(expandHandle('email', 'me@example.com'), 'mailto:me@example.com');
});
