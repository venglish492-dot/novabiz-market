import { expect, test } from '@playwright/test';
import { PNG_1PX, signUp, uniqueName } from './helpers';

test('protected pages require sign-in', async ({ page }) => {
  await page.goto('/dashboard/appearance');
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
});

test('upload API rejects anonymous and cross-site requests', async ({ request, baseURL }) => {
  const anonymous = await request.post('/api/uploads', { multipart: { file: { name: 'a.png', mimeType: 'image/png', buffer: PNG_1PX } }, headers: { Origin: baseURL! } });
  expect(anonymous.status()).toBe(401);
  const crossSite = await request.post('/api/uploads', { multipart: { file: { name: 'a.png', mimeType: 'image/png', buffer: PNG_1PX } }, headers: { Origin: 'https://evil.example' } });
  expect(crossSite.status()).toBe(403);
});

test('regular users cannot open moderation', async ({ page }) => {
  await signUp(page, uniqueName('member'));
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('unknown files and profiles 404 without leaking details', async ({ request }) => {
  expect((await request.get('/api/files/00000000-0000-4000-8000-000000000000')).status()).toBe(404);
  expect((await request.get('/api/files/..%2F..%2Fetc%2Fpasswd')).status()).toBe(404);
  const res = await request.get('/@does-not-exist-anywhere');
  expect(res.status()).toBe(404);
});

test('served files carry safe headers', async ({ request }) => {
  const html = await (await request.get('/@nova')).text();
  const match = html.match(/\/api\/files\/([0-9a-f-]{36})/);
  expect(match).toBeTruthy();
  const res = await request.get(`/api/files/${match![1]}`);
  expect(res.status()).toBe(200);
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  expect(res.headers()['content-security-policy']).toContain('sandbox');
});

test('security headers are set on pages', async ({ request }) => {
  const res = await request.get('/');
  expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(res.headers()['x-frame-options']).toBe('DENY');
});

test('views count unique visitors, not the owner', async ({ page, browser }) => {
  const name = uniqueName('counter');
  await signUp(page, name);
  await page.getByRole('button', { name: /^Publish/ }).first().click();
  await expect(page.getByText(/Live at/)).toBeVisible();

  // The owner's own visit is not counted.
  await page.goto(`/@${name}`);
  await page.waitForTimeout(1500);

  // One visitor opening the page twice on the same day counts once.
  const visitor = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' });
  const v = await visitor.newPage();
  for (let i = 0; i < 2; i++) {
    await v.goto(`/@${name}`);
    await v.waitForTimeout(1500);
  }
  await visitor.close();

  await page.goto('/dashboard');
  const tile = page.locator('div.card', { hasText: 'All-time views' });
  await expect(tile.locator('p').nth(1)).toHaveText('1');
});
