// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN DE PLAYWRIGHT
// ===================================

import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Cargar variables de entorno específicas para testing
if (process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Test patterns for lazy loading tests */
  testMatch: ['**/*.spec.ts', '**/*.e2e.ts'],

  /* Run tests in files in parallel */
  fullyParallel: false, // Deshabilitado para pruebas enterprise secuenciales

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1, // Un worker para pruebas secuenciales
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'tests/playwright-report' }],
    ['json', { outputFile: 'tests/results.json' }],
    ['junit', { outputFile: 'tests/results.xml' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video recording for lazy loading tests */
    video: 'retain-on-failure',

    /* Timeout settings for lazy loading */
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 15000, // Aumentado para aplicaciones enterprise

    /* Global timeout for navigation */
    navigationTimeout: 45000, // Aumentado para carga de datos

    /* Headers para identificar tests de Playwright */
    extraHTTPHeaders: {
      'x-playwright-test': 'true',
      'x-test-auth': 'bypass',
      'User-Agent': 'Playwright-Test-Agent'
    },
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup de autenticación (se ejecuta primero)
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      teardown: 'cleanup',
      fullyParallel: false, // Ejecutar tests de setup secuencialmente
    },

    // Cleanup (se ejecuta al final)
    {
      name: 'cleanup',
      testMatch: '**/auth.cleanup.ts',
    },

    // API Admin tests - direct API testing (sin middleware problemático)
    {
      name: 'api-admin',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/api-admin.spec.ts']
    },

    // API Public tests - direct API testing
    {
      name: 'api-public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/api-public.spec.ts']
    },

    // UI Admin tests - require authentication (legacy)
    {
      name: 'ui-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: [
        '**/admin/**/*.spec.ts',
        '**/auth/**/*.spec.ts',
        '!**/api-*.spec.ts' // Excluir tests API
      ]
    },

    // UI Public tests - no authentication required
    {
      name: 'ui-public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        '**/*.spec.ts',
        '!**/admin/**/*.spec.ts',
        '!**/auth/**/*.spec.ts',
        '!**/api-*.spec.ts' // Excluir tests API
      ]
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: [
        '**/*.spec.ts',
        '!**/admin/**/*.spec.ts' // Excluir tests admin en Firefox por ahora
      ]
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: [
        '**/*.spec.ts',
        '!**/admin/**/*.spec.ts' // Excluir tests admin en Safari por ahora
      ]
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: [
        '**/*.spec.ts',
        '!**/admin/**/*.spec.ts' // Excluir tests admin en móvil
      ]
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: [
        '**/*.spec.ts',
        '!**/admin/**/*.spec.ts' // Excluir tests admin en móvil
      ]
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Siempre reutilizar servidor existente
    timeout: 120000,
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),

  /* Test timeout */
  timeout: 30000,

  /* Expect timeout */
  expect: {
    timeout: 5000,
  },

  /* Output directory */
  outputDir: 'test-results/',

  /* Ignore certain files */
  testIgnore: [
    '**/node_modules/**',
    '**/.next/**',
    '**/coverage/**',
  ],
})
