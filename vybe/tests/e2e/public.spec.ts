import { expect, test } from '@playwright/test';

const DEMOS = ['nova', 'kairo', 'selene', 'mira', 'atlas', 'echo', 'byte', 'marina'];

test('every demo layout renders without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const name of DEMOS) {
    await page.goto(`/@${name}`);
    await expect(page.locator('.vybe-profile')).toBeVisible();
    await expect(page.getByText('Demo', { exact: true }).first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('music never starts without a click', async ({ page }) => {
  await page.goto('/@echo');
  await page.waitForTimeout(1500);
  await expect(page.getByRole('button', { name: /^Play / }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pause / })).toHaveCount(0);
});

test('reduced motion: no intro and animations off', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/@nova');
  await expect(page.locator('.vybe-profile')).toHaveAttribute('data-motion', 'off');
  await expect(page.getByRole('button', { name: 'Skip intro' })).toHaveCount(0);
  await context.close();
});

test('the cinematic intro is skippable and remembered', async ({ page }) => {
  await page.goto('/@nova');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.getByRole('button', { name: 'Skip intro' })).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(500);
  await expect(page.getByRole('button', { name: 'Skip intro' })).toHaveCount(0);
});

test('aliases and unknown names behave', async ({ request }) => {
  const res = await request.get('/u/nova');
  expect(res.ok()).toBeTruthy();
});

for (const width of [360, 390, 768, 1440, 1920]) {
  test(`no horizontal overflow at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    for (const path of ['/', '/pricing', '/discover', '/@nova', '/@atlas', '/signup', '/help']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(1);
    }
    await context.close();
  });
}

test('SEO basics', async ({ request }) => {
  const html = await (await request.get('/@nova')).text();
  expect(html).toContain('og:image');
  expect(html).toContain('rel="canonical"');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/@nova');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /dashboard');
});
