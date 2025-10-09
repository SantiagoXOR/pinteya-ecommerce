// ===================================
// CONFIGURACIÓN TEMPORAL DE PLAYWRIGHT PARA DEBUG
// ===================================

import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*debug*.spec.ts'],
  
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  
  reporter: [['line']],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    extraHTTPHeaders: {
      'x-playwright-test': 'true',
      'x-test-auth': 'bypass',
    },
  },
  
  projects: [
    {
      name: 'debug-api',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/*debug*.spec.ts'],
    },
  ],
  
  // SIN global setup para evitar problemas de navegación
  timeout: 30000,
  
  expect: {
    timeout: 5000,
  },
  
  outputDir: 'test-results-debug/',
})