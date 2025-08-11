import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración específica de Playwright para flujos de usuario
 * Enfocada en verificar que los datos hardcodeados han sido eliminados
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Configuración de timeouts */
  timeout: 60000, // 1 minuto por test
  expect: {
    timeout: 10000 // 10 segundos para assertions
  },

  /* Configuración de ejecución */
  fullyParallel: false, // Ejecutar secuencialmente para mejor debugging
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1, // Un worker para evitar conflictos

  /* Configuración de reportes */
  reporter: [
    ['html', { outputFolder: 'playwright-report-user-flow' }],
    ['json', { outputFile: 'test-results/user-flow-results.json' }],
    ['list']
  ],

  /* Configuración global */
  use: {
    /* URL base */
    baseURL: 'https://pinteya.com',

    /* Configuración de browser */
    headless: true,
    viewport: { width: 1280, height: 720 },
    
    /* Screenshots y videos */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    /* Configuración de red */
    ignoreHTTPSErrors: true,
    
    /* Headers adicionales */
    extraHTTPHeaders: {
      'Accept': 'application/json, text/html, */*',
      'User-Agent': 'Playwright-UserFlow-Test'
    }
  },

  /* Configuración de proyectos/browsers */
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },

    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },
  ],

  /* Configuración de servidor local (si es necesario) */
  webServer: undefined, // Usamos producción directamente
});
