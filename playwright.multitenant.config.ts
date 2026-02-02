// ===================================
// PLAYWRIGHT CONFIG - E2E MULTITENANT
// Tests en src/__tests__/multitenant/e2e (tenant Pintemas, admin analytics, etc.)
// ===================================

import { defineConfig, devices } from '@playwright/test'

/**
 * Ejecutar con tenant Pintemas:
 *   NEXT_PUBLIC_DEV_TENANT_SLUG=pintemas BYPASS_AUTH=true npm run test:multitenant:e2e
 *
 * O con host: PLAYWRIGHT_BASE_URL=http://pintemas.localhost:3000 (requiere 127.0.0.1 pintemas.localhost en hosts)
 */
export default defineConfig({
  testDir: './src/__tests__/multitenant/e2e',
  testMatch: ['**/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report-multitenant' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      'x-playwright-test': 'true',
      'User-Agent': 'Playwright-Multitenant-E2E',
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  timeout: 60000,
  expect: { timeout: 10000 },
  outputDir: 'test-results/multitenant',
})
