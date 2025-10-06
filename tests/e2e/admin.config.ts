import { defineConfig, devices } from '@playwright/test'

/**
 * Configuración específica para tests del panel administrativo
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './admin',
  /* Run tests in files in parallel */
  fullyParallel: false, // Secuencial para tests administrativos
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report/admin' }],
    ['json', { outputFile: 'test-results/admin-results.json' }],
    ['junit', { outputFile: 'test-results/admin-junit.xml' }],
    ['list'],
  ],
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Global timeout for each action */
    actionTimeout: 10000,

    /* Global timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'firefox-admin',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },

    /* Test against mobile viewports for responsive admin */
    {
      name: 'mobile-admin',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],

  /* Test timeout */
  timeout: 60 * 1000, // 60 segundos para tests administrativos
  expect: {
    timeout: 15 * 1000, // 15 segundos para assertions
  },

  /* Output directories */
  outputDir: 'test-results/admin/',

  /* Global setup for admin tests */
  globalSetup: require.resolve('./admin-setup.ts'),
})
