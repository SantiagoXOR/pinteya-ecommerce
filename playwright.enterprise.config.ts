import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración específica para pruebas enterprise
 * No inicia servidor automáticamente
 */
export default defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Secuencial para pruebas enterprise
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  
  /* Opt out of parallel tests on CI. */
  workers: 1, // Un worker para pruebas secuenciales
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'tests/playwright-report' }],
    ['json', { outputFile: 'tests/results.json' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Timeouts aumentados para aplicaciones enterprise */
    actionTimeout: 15000,
    navigationTimeout: 45000,
    
    /* Headers para autenticación si es necesario */
    extraHTTPHeaders: {
      'Accept': 'application/json, text/plain, */*',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'enterprise-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    {
      name: 'enterprise-mobile',
      use: { 
        ...devices['iPhone 12']
      },
    },

    {
      name: 'enterprise-tablet',
      use: { 
        ...devices['iPad Pro']
      },
    },
  ],

  /* NO webServer - asumimos que ya está corriendo */
  // webServer: undefined,

  /* Configuración global de timeouts */
  timeout: 60 * 1000, // 1 minuto por test
  expect: {
    timeout: 10 * 1000, // 10 segundos para assertions
  },

  /* Configuración de directorios */
  outputDir: 'tests/test-results',
});
