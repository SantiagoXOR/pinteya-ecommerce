// =====================================================
// PLAYWRIGHT CONFIG: DIAGNÓSTICO ESTRUCTURAL
// Descripción: Configuración para análisis de estructura sin servidor web
// =====================================================

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  /* Configuración específica para diagnóstico estructural */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0, // No reintentar para diagnóstico estructural
  workers: 1,
  
  /* Reportes */
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/structural-diagnostic-results.json' }]
  ],
  
  /* Configuración global */
  use: {
    /* Sin navegador para análisis estructural */
    headless: true,
    
    /* Timeouts mínimos */
    actionTimeout: 5000,
    navigationTimeout: 5000,
  },

  /* Proyecto único para análisis estructural */
  projects: [
    {
      name: 'structural-analysis',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/admin-panel-structure-diagnostic.spec.ts',
    },
  ],

  /* SIN webServer - análisis de archivos únicamente */
  // webServer: undefined,

  /* Timeouts */
  timeout: 30000, // 30 segundos suficientes para análisis de archivos
  expect: {
    timeout: 5000,
  },

  /* Directorio de salida */
  outputDir: 'test-results/structural-output/',
});
