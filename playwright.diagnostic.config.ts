// =====================================================
// PLAYWRIGHT CONFIG: DIAGNÓSTICO PANEL ADMINISTRATIVO
// Descripción: Configuración específica para suite de diagnóstico enterprise
// Optimizada para: Captura completa, reportes detallados, múltiples formatos
// =====================================================

import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Configuración específica para diagnóstico */
  fullyParallel: false, // Ejecutar secuencialmente para mejor diagnóstico
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Un solo worker para diagnóstico detallado

  /* Reportes múltiples para diagnóstico completo */
  reporter: [
    [
      'html',
      {
        outputFolder: 'test-results/diagnostic-reports/playwright-html',
        open: 'never', // No abrir automáticamente
      },
    ],
    [
      'json',
      {
        outputFile: 'test-results/diagnostic-reports/playwright-results.json',
      },
    ],
    [
      'junit',
      {
        outputFile: 'test-results/diagnostic-reports/playwright-results.xml',
      },
    ],
    ['list'], // Para output en consola
    ['github'], // Para CI/CD si está disponible
  ],

  /* Configuración global optimizada para diagnóstico */
  use: {
    /* URL base */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Captura completa para diagnóstico */
    trace: 'on', // Siempre capturar trace para diagnóstico
    screenshot: 'on', // Capturar screenshots en todos los casos
    video: 'on', // Capturar video para análisis detallado

    /* Timeouts extendidos para diagnóstico completo */
    actionTimeout: 30000, // 30 segundos para acciones
    navigationTimeout: 60000, // 1 minuto para navegación

    /* Headers para identificar tests de diagnóstico */
    extraHTTPHeaders: {
      'X-Test-Type': 'Admin-Panel-Diagnostic',
      'X-Test-Suite': 'Enterprise-Validation',
    },

    /* Configuración de viewport por defecto */
    viewport: { width: 1280, height: 720 },

    /* Ignorar errores HTTPS en desarrollo */
    ignoreHTTPSErrors: true,
  },

  /* Proyectos específicos para diagnóstico */
  projects: [
    // Setup de autenticación (se ejecuta primero)
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      teardown: 'cleanup',
    },

    // Cleanup (se ejecuta al final)
    {
      name: 'cleanup',
      testMatch: '**/auth.cleanup.ts',
    },

    // Diagnóstico principal en Chrome Desktop
    {
      name: 'diagnostic-chrome-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
      testMatch: '**/admin-panel-enterprise-complete.spec.ts',
    },

    // Diagnóstico en Firefox para validación cruzada
    {
      name: 'diagnostic-firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
      testMatch: '**/admin-panel-enterprise-complete.spec.ts',
    },

    // Diagnóstico móvil para responsividad
    {
      name: 'diagnostic-mobile',
      use: {
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
      testMatch: '**/admin-panel-enterprise-complete.spec.ts',
    },

    // Diagnóstico tablet
    {
      name: 'diagnostic-tablet',
      use: {
        ...devices['iPad Pro'],
      },
      dependencies: ['setup'],
      testMatch: '**/admin-panel-enterprise-complete.spec.ts',
    },

    // Tests individuales de APIs (sin UI)
    {
      name: 'api-diagnostic',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
      testMatch: '**/api-admin.spec.ts',
    },
  ],

  /* Configuración de servidor local */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutos para iniciar servidor
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Timeouts globales para diagnóstico completo */
  timeout: 180000, // 3 minutos por test (diagnóstico completo)
  expect: {
    timeout: 15000, // 15 segundos para assertions
  },

  /* Directorio de salida */
  outputDir: 'test-results/diagnostic-output/',

  /* Configuración de red para diagnóstico */
  globalSetup: require.resolve('./tests/e2e/diagnostic-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/diagnostic-teardown.ts'),

  /* Metadatos para reportes */
  metadata: {
    testType: 'Admin Panel Enterprise Diagnostic',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    timestamp: new Date().toISOString(),
    purpose: 'Validación completa del estado de implementación del panel administrativo enterprise',
  },
})
