import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests run against the PRODUCTION build served locally
 * (the same way the Windows launcher serves it).
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4747',
    trace: 'retain-on-failure',
    launchOptions: {
      // Optional: point at an existing Chromium instead of `npx playwright install`.
      executablePath: process.env.PW_CHROMIUM_PATH || undefined,
      args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 900 } }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: {
    command: 'npm run build && npx vite preview',
    url: 'http://localhost:4747',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
