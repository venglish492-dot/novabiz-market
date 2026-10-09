import { defineConfig, devices } from '@playwright/test';

/*
 * End-to-end tests run against a production build (`next build && next start`).
 *
 * - Default: catalog-only mode (no Supabase/Stripe env) — verifies the public
 *   storefront, honest unavailable states and that protected routes and APIs
 *   refuse anonymous access.
 * - E2E_BASE_URL: run against an already running server instead (for example a
 *   staging deployment or a local stack with Supabase configured).
 *
 * PLAYWRIGHT_CHROMIUM_EXECUTABLE lets CI/sandboxes point at a preinstalled browser.
 */
const port = Number(process.env.E2E_PORT || 3200);
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testIgnore: [/mobile\.spec/, /full\//] },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec/ },
    // Full purchase lifecycle; needs a configured backend (see tests/e2e/full/backend.ts).
    { name: 'full', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testMatch: /full\/.*\.spec/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.E2E_SKIP_BUILD ? `npx next start -p ${port}` : `npm run build && npx next start -p ${port}`,
        url: `${baseURL}/robots.txt`,
        timeout: 300_000,
        reuseExistingServer: !process.env.CI,
      },
});
