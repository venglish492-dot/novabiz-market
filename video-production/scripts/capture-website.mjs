// Captures authentic VektorLab interface imagery from the production build.
// Usage: node video-production/scripts/capture-website.mjs [baseUrl]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:3400';
const OUT = new URL('../website-captures/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function ctx(viewport, scale) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: scale, locale: 'en-US', colorScheme: 'dark', reducedMotion: 'no-preference' });
  await context.addCookies([{ name: 'vl_locale', value: 'en', url: BASE }]);
  await context.addInitScript(() => { try { localStorage.setItem('vl-theme', 'dark'); } catch {} });
  return context;
}
async function settle(page, ms = 1200) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  // Reveal-on-scroll sections: mark revealed so captures show final state.
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.setAttribute('data-revealed', '')));
  await page.waitForTimeout(ms);
}

const desk = await ctx({ width: 1440, height: 900 }, 2);
let page = await desk.newPage();

await page.goto(`${BASE}/`); await settle(page, 3500);
await page.screenshot({ path: `${OUT}home_hero_desktop.png` });

await page.locator('#featured-title').scrollIntoViewIfNeeded(); await page.mouse.wheel(0, -120); await settle(page, 1200);
await page.screenshot({ path: `${OUT}home_featured_desktop.png` });

await page.goto(`${BASE}/products`); await settle(page);
await page.screenshot({ path: `${OUT}catalog_desktop.png` });
await page.evaluate(() => window.scrollTo(0, 420)); await settle(page, 600);
await page.screenshot({ path: `${OUT}catalog_grid_desktop.png` });
const cards = page.locator('[data-product-card]');
const n = await cards.count();
for (let i = 0; i < n; i++) {
  const card = cards.nth(i);
  await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(250);
  const href = await card.locator('a[href^="/products/"]').first().getAttribute('href');
  await card.screenshot({ path: `${OUT}card_${String(i + 1).padStart(2, '0')}_${href.split('/').pop()}.png` });
}

for (const slug of ['saas-unit-economics-financial-model', 'venture-pitch-deck-kit', 'startup-os-notion-workspace']) {
  await page.goto(`${BASE}/products/${slug}`); await settle(page);
  await page.screenshot({ path: `${OUT}pdp_${slug}_desktop.png` });
}

await page.goto(`${BASE}/categories`); await settle(page);
await page.screenshot({ path: `${OUT}categories_desktop.png` });

await page.goto(`${BASE}/`); await settle(page, 2500);
await page.keyboard.press('Control+k');
await page.getByRole('combobox').fill('pitch deck'); await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}search_palette_desktop.png` });

const mob = await ctx({ width: 390, height: 844 }, 3);
page = await mob.newPage();
await page.goto(`${BASE}/`); await settle(page, 3500);
await page.screenshot({ path: `${OUT}home_hero_mobile.png` });
await page.goto(`${BASE}/products/saas-unit-economics-financial-model`); await settle(page);
await page.screenshot({ path: `${OUT}pdp_saas_mobile.png` });
await page.goto(`${BASE}/products`); await settle(page);
await page.evaluate(() => window.scrollTo(0, 560)); await settle(page, 600);
await page.screenshot({ path: `${OUT}catalog_mobile.png` });

await browser.close();
console.log('captured', n, 'cards');
