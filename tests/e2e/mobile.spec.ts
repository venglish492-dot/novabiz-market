import { expect, test } from '@playwright/test';
import { SAAS, expectNoHorizontalOverflow, setLocale, watchConsole } from './helpers';

const PAGES = [
  '/',
  '/products',
  `/products/${SAAS.slug}`,
  '/products/venture-pitch-deck-kit',
  '/categories',
  '/categories/notion',
  '/collections',
  '/collections/founder-toolkit',
  '/search?q=notion',
  '/cart',
  '/wishlist',
  '/checkout',
  '/about',
  '/contact',
  '/resources',
  '/blog',
  '/terms',
  '/login',
  '/register',
  '/does-not-exist',
];
const WIDTHS = [320, 375, 414, 768, 1024, 1280, 1440, 1920];

test.describe('responsive layout', () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path);
        await expectNoHorizontalOverflow(page, path);
      }
    });
  }

  test('mobile menu opens, navigates and closes', async ({ page }) => {
    await setLocale(page, 'en');
    const console = watchConsole(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await sheet.getByRole('link', { name: 'Products', exact: true }).click();
    await expect(page).toHaveURL(/\/products/);
    await expect(sheet).toBeHidden();
    console.expectClean();
  });

  test('mobile product page has a sticky purchase bar', async ({ page }) => {
    await setLocale(page, 'en');
    await page.goto(`/products/${SAAS.slug}`);
    const sticky = page.locator('[data-sticky-buy]');
    // Hidden (and inert) while the main purchase panel is on screen.
    await expect(sticky).toHaveAttribute('aria-hidden', 'true');
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(sticky).not.toHaveAttribute('aria-hidden', 'true');
    await expect(sticky).toBeInViewport();
    await sticky.getByRole('button', { name: /Add to cart/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('mobile hero renders without errors', async ({ page }) => {
    const console = watchConsole(page);
    await page.goto('/');
    await expect(page.locator('[data-hero]')).toBeVisible();
    await page.waitForTimeout(1500);
    console.expectClean();
  });
});
