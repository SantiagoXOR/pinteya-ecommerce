// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN DE JEST
// ===================================

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment optimizado
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Module name mapping para absolute imports - Optimizado
  moduleNameMapper: {
    // Mapeo principal (suficiente para la mayoría de casos)
    '^@/(.*)$': '<rootDir>/src/$1',

    // Mapeos para assets estáticos
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Ignore E2E tests (Playwright) and utility files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/.next/',
    '/tests/',
    'test-utils.tsx',
    'queryClient.setup.ts',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/error.tsx',
    '!src/middleware.ts',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/public/',
    '/scripts/',
    '/docs/',
    '/__tests__/',
    '/e2e/',
  ],
  
  // Transform ignore patterns - Optimizado
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$|@tanstack|use-debounce))',
    '^.+\\.module\\.(css|sass|scss)$',
  ],

  // Test timeout optimizado para mejor performance
  testTimeout: 10000, // Reducido de 15s a 10s

  // Verbose output solo cuando sea necesario
  verbose: false,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Configuración de workers optimizada para mejor rendimiento
  maxWorkers: process.env.CI ? 2 : '75%', // Más workers en local, menos en CI

  // Cache para mejorar velocidad
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Configuración de módulos ES
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Configuración adicional para mejor rendimiento
  detectOpenHandles: false,
  forceExit: true,

  // Configuraciones adicionales de performance
  bail: false, // No parar en el primer error para ver todos los fallos
  passWithNoTests: true, // Permitir ejecución sin tests

  // Configuración de timers para tests más rápidos
  fakeTimers: {
    enableGlobally: false, // Solo habilitar cuando sea necesario
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
