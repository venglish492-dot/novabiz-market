import fs from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/*
 * End-to-end tests against a production build (`next build && next start`)
 * with a fresh embedded database in .data-e2e. Set E2E_BASE_URL to test an
 * already running server instead.
 */
const port = Number(process.env.E2E_PORT || 3200);
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${port}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const env = `VYBE_DATA_DIR=.data-e2e VYBE_SECRET=e2e-secret NEXT_PUBLIC_SITE_URL=${baseURL}`;
const resetData = `node -e "require('fs').rmSync('.data-e2e',{recursive:true,force:true})"`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure', launchOptions: { executablePath } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.E2E_SKIP_BUILD ? `${resetData} && ${env} npx next start -p ${port}` : `${resetData} && npm run build && ${env} npx next start -p ${port}`,
        url: `${baseURL}/robots.txt`,
        timeout: 400_000,
        reuseExistingServer: false,
      },
});
