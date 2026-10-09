import { expect, test } from '@playwright/test';
import { NOTION, SAAS, setLocale, watchConsole } from './helpers';

test.describe('storefront (catalog-only mode)', () => {
  test('language follows Accept-Language and falls back to Russian', async ({ browser }) => {
    for (const [browserLocale, expected] of [['uz-UZ', 'ru'], ['ru-RU', 'ru'], ['en-US', 'en']] as const) {
      const context = await browser.newContext({ locale: browserLocale });
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('lang', expected);
      await context.close();
    }
  });

  test('home renders in Russian with honest content and no console errors', async ({ page }) => {
    const console = watchConsole(page);
    await setLocale(page, 'ru');
    await page.goto('/');
    await expect(page).toHaveTitle(/Vektor Lab/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/NovaBiz|START2025|BIZVIP|FREEDEMO|24\/7|AES-256|PCI/i);
    expect(text).toContain('hello@vektorlab.uz');
    // Guests never see an admin entry point.
    await expect(page.getByRole('link', { name: /admin|админ/i })).toHaveCount(0);
    console.expectClean();
  });

  test('3D hero mounts a canvas (or a static fallback) and stays error-free', async ({ page }) => {
    const console = watchConsole(page);
    await page.goto('/');
    const hero = page.locator('[data-hero]');
    await expect(hero).toBeVisible();
    await expect(hero.locator('canvas, [data-scene-fallback]').first()).toBeAttached({ timeout: 15_000 });
    console.expectClean();
  });

  test('catalog lists products and filters persist in the URL', async ({ page }) => {
    await setLocale(page, 'en');
    await page.goto('/products');
    await expect(page.getByRole('heading', { level: 1, name: 'All products' })).toBeVisible();
    const cards = page.locator('[data-product-card]');
    await expect(cards).toHaveCount(8);

    await page.goto('/products?format=notion');
    await expect(cards.first()).toBeVisible();
    const filtered = await cards.count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(8);
    await expect(page.getByText(NOTION.en).first()).toBeVisible();

    await page.goto('/products?sort=price-asc');
    const prices = await cards.evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute('data-price'))));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    // Junk params are ignored rather than crashing the page.
    const response = await page.goto('/products?format=constructor&sort=;drop&min=-1&category=__proto__');
    expect(response?.status()).toBe(200);
    await expect(cards).toHaveCount(8);
  });

  test('product page shows real data, structured data without fake ratings, and adds to cart', async ({ page }) => {
    const console = watchConsole(page);
    await setLocale(page, 'en');
    await page.goto(`/products/${SAAS.slug}`);
    await expect(page.getByRole('heading', { level: 1, name: SAAS.en })).toBeVisible();

    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const product = ld.map((raw) => JSON.parse(raw)).find((data) => data['@type'] === 'Product');
    expect(product).toBeTruthy();
    expect(product.name).toBe(SAAS.en);
    expect(product.aggregateRating).toBeUndefined();
    expect(product.review).toBeUndefined();

    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(SAAS.en)).toBeVisible();
    await expect(page.getByRole('button', { name: /Cart: 1 item/ })).toBeAttached();
    console.expectClean();
  });

  test('cart persists across reloads and items can be removed', async ({ page }) => {
    await setLocale(page, 'en');
    await page.goto(`/products/${SAAS.slug}`);
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { level: 1, name: 'Cart' })).toBeVisible();
    await expect(page.getByText(SAAS.en).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText(SAAS.en).first()).toBeVisible();

    await page.getByRole('button', { name: `Remove “${SAAS.en}” from cart` }).click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('checkout without a payment provider shows an honest unavailable state', async ({ page }) => {
    await setLocale(page, 'en');
    await page.goto(`/products/${SAAS.slug}`);
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await page.goto('/checkout');
    await expect(page.getByText('Online payment is not available yet').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue to payment/ })).toHaveCount(0);
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/payment (was )?successful|order confirmed/i);
  });

  test('a success URL cannot be used to fake a paid order', async ({ page }) => {
    await setLocale(page, 'en');
    const response = await page.goto('/checkout/success?order=00000000-0000-4000-8000-000000000000');
    expect([200, 404]).toContain(response?.status());
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/payment (was )?(confirmed|successful)|your files are ready/i);
  });

  test('command palette opens with Ctrl+K and finds products despite typos', async ({ page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const input = page.getByRole('combobox', { name: 'Search the catalog' });
    await expect(input).toBeFocused();
    await input.fill('finacial model');
    const option = page.getByRole('option', { name: new RegExp(SAAS.en.slice(0, 20)) });
    await expect(option.first()).toBeVisible();
    await input.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/products/${SAAS.slug}`));
  });

  test('search page handles transliterated Russian queries', async ({ page }) => {
    await page.goto(`/search?q=${encodeURIComponent('ноушн')}`);
    await expect(page.getByText('Startup OS').first()).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });

  test('wishlist works for guests', async ({ page }) => {
    await setLocale(page, 'en');
    await page.goto(`/products/${SAAS.slug}`);
    await page.getByRole('button', { name: 'Add to wishlist' }).first().click();
    await expect(page.getByRole('button', { name: 'Remove from wishlist' }).first()).toBeVisible();
    await page.goto('/wishlist');
    await expect(page.getByText(SAAS.en).first()).toBeVisible();
  });

  test('theme and language preferences apply and persist', async ({ page }) => {
    await setLocale(page, 'ru');
    await page.goto('/');
    await page.getByRole('button', { name: /Язык|Language/ }).click();
    await page.getByRole('button', { name: 'Светлая' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('button', { name: /Язык|Language/ }).click();
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('link', { name: 'Products' }).first()).toBeVisible();
  });

  test('auth pages explain that accounts are not connected yet', async ({ page }) => {
    await setLocale(page, 'en');
    for (const path of ['/login', '/register', '/forgot-password']) {
      await page.goto(path);
      await expect(page.getByText('Accounts are coming soon').first()).toBeVisible();
    }
  });

  test('content and legal pages render', async ({ page }) => {
    for (const path of ['/about', '/contact', '/resources', '/blog', '/terms', '/privacy', '/refunds', '/licenses', '/categories', '/collections']) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('unknown pages return a branded 404', async ({ page }) => {
    for (const path of ['/does-not-exist', '/products/not-a-real-product', '/categories/nope', '/blog/nope']) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
    }
    await expect(page.getByRole('link', { name: /каталог|catalog|products|товары/i }).first()).toBeVisible();
  });

  test('keyboard users can skip to content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /Перейти к содержимому|Skip to content/ });
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page.locator('#main')).toBeAttached();
  });

  test('reduced motion keeps the page usable', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    const console = watchConsole(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.mouse.wheel(0, 2000);
    await expect(page.locator('.reveal').first()).toBeVisible();
    console.expectClean();
    await context.close();
  });
});
