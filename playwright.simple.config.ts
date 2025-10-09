// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN SIMPLIFICADA DE PLAYWRIGHT
// ===================================

import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

/**
 * Configuración simplificada sin global setup para tests individuales
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Test patterns for lazy loading tests */
  testMatch: ['**/*.spec.ts', '**/*.e2e.ts'],

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'tests/playwright-report' }],
    ['json', { outputFile: 'tests/results.json' }],
    ['list'],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot only on failures. */
    screenshot: 'only-on-failure',

    /* Retain video only on failures. */
    video: 'retain-on-failure',

    /* Configure timeouts */
    actionTimeout: 15000,
    navigationTimeout: 45000,

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'x-playwright-test': 'true',
      'x-test-auth': 'bypass',
      'User-Agent': 'Playwright-Test-Agent',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },

  /* Global timeout */
  timeout: 30000,

  /* Expect timeout */
  expect: {
    timeout: 5000,
  },

  /* Output directory */
  outputDir: 'test-results/',
})