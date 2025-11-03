// ===================================
// PINTEYA E-COMMERCE - PLAYWRIGHT CONFIG FOR ADMIN PRODUCTS
// Suite de testing E2E para panel administrativo de productos
// ===================================

import { defineConfig, devices } from '@playwright/test'
import path from 'path'

/**
 * Configuración específica para tests del panel administrativo de productos
 * 
 * Características:
 * - BYPASS_AUTH=true para saltar autenticación en desarrollo
 * - Timeout extendido (90s) para operaciones de BD
 * - Workers: 1 (tests secuenciales)
 * - Screenshots en cada paso crítico
 * - Proyectos: Desktop Chrome, Desktop Firefox, Mobile Chrome, Mobile Safari
 */
export default defineConfig({
  // Directorio donde están los tests
  testDir: './e2e/admin/products',

  /* Patrones de archivos test */
  testMatch: ['**/*.spec.ts'],

  /* Ejecutar tests secuencialmente (no paralelo) */
  fullyParallel: false,

  /* No permitir test.only en CI */
  forbidOnly: !!process.env.CI,

  /* Reintentos en CI */
  retries: process.env.CI ? 2 : 0,

  /* Worker único para tests secuenciales */
  workers: 1,

  /* Reportero */
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report-admin-products' }],
    ['json', { outputFile: 'test-results/results-admin-products.json' }],
    ['junit', { outputFile: 'test-results/admin-products-results.xml' }],
    ['list'],
  ],

  /* Configuración compartida para todos los proyectos */
  use: {
    /* Base URL */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Headers para identificar tests de Playwright */
    extraHTTPHeaders: {
      'x-playwright-test': 'true',
      'x-bypass-auth': 'true',
      'User-Agent': 'Playwright-Test-Agent-Admin',
    },

    /* Trace en caso de retry */
    trace: 'on-first-retry',

    /* Screenshot solo en fallo */
    screenshot: 'only-on-failure',

    /* Video solo en fallo */
    video: 'retain-on-failure',

    /* Timeout para acciones (15s) */
    actionTimeout: 15000,

    /* Timeout para navegación (45s) */
    navigationTimeout: 45000,

    /* Context options específicas para admin */
    storageState: undefined, // No usar storage state (bypass auth)
  },

  /* Configurar proyectos por navegador */
  projects: [
    // Setup (ejecuta primero si existe)
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },

    // Desktop Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Servidor local antes de ejecutar tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  /* Variables de entorno para tests */
  env: {
    BYPASS_AUTH: 'true',
    NODE_ENV: 'development',
    PLAYWRIGHT_TEST: 'true',
  },

  /* Timeout global por test */
  timeout: 90000, // 90 segundos

  /* Timeout para expect */
  expect: {
    timeout: 5000, // 5 segundos
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },

  /* Directorio de output */
  outputDir: 'test-results/',

  /* Global setup y teardown */
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
})

