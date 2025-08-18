// ===================================
// PINTEYA E-COMMERCE - JEST CONFIG FASE 3
// ===================================

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
  },

  // Test patterns específicos para Fase 3
  testMatch: [
    '<rootDir>/src/__tests__/lib/circuit-breaker.test.ts',
    '<rootDir>/src/__tests__/lib/audit-trail.test.ts',
    '<rootDir>/src/__tests__/lib/enterprise-metrics.test.ts',
    '<rootDir>/src/__tests__/lib/alert-system.test.ts',
    '<rootDir>/src/__tests__/lib/health-checks.test.ts',
    '<rootDir>/src/__tests__/components/monitoring/**/*.test.(ts|tsx)',
    '<rootDir>/src/__tests__/api/monitoring-apis.test.ts',
    '<rootDir>/src/__tests__/integration/monitoring-integration.test.ts'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],

  // Transform patterns
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Coverage configuration específica para Fase 3
  collectCoverageFrom: [
    'src/lib/monitoring/**/*.{ts,tsx}',
    'src/lib/mercadopago/circuit-breaker.ts',
    'src/components/admin/monitoring/**/*.{ts,tsx}',
    'src/app/api/admin/monitoring/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**'
  ],

  // Coverage thresholds para Fase 3
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/lib/monitoring/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    'src/lib/mercadopago/circuit-breaker.ts': {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95
    }
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],

  // Coverage directory
  coverageDirectory: 'coverage/fase3',

  // Globals
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 30000,

  // Max workers
  maxWorkers: '50%',

  // Error on deprecated
  errorOnDeprecated: true,

  // Notify mode
  notify: false,

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/fase3/html-report',
        filename: 'report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Pinteya E-commerce - Fase 3 Test Report',
        logoImgPath: undefined,
        inlineSource: false
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage/fase3/junit',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      }
    ]
  ],

  // Mock patterns
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/.next/'
  ],

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@babel|babel-preset))'
  ],

  // Extensiones de archivos a transformar
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Configuración específica para mocks
  setupFiles: ['<rootDir>/jest.setup.fase3.js'],

  // Configuración de entorno de test
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },

  // Configuración de cache
  cacheDirectory: '<rootDir>/.jest-cache/fase3',

  // Configuración de snapshot
  snapshotSerializers: [
    '@emotion/jest/serializer'
  ],

  // Configuración de timers
  fakeTimers: {
    enableGlobally: false,
    legacyFakeTimers: false
  },

  // Configuración de retry
  retry: 2,

  // Configuración de bail
  bail: false,

  // Configuración de force exit
  forceExit: false,

  // Configuración de detect open handles
  detectOpenHandles: true,

  // Configuración de detect leaks
  detectLeaks: false,

  // Configuración de log heap usage
  logHeapUsage: false,

  // Configuración de max concurrency
  maxConcurrency: 5,

  // Configuración de pass with no tests
  passWithNoTests: true,

  // Configuración de silent
  silent: false,

  // Configuración de update snapshot
  updateSnapshot: false,

  // Configuración de use stderr
  useStderr: false,

  // Configuración de watch
  watch: false,
  watchAll: false,

  // Configuración de watch path ignore patterns
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/'
  ]
};

// Create Jest config
module.exports = createJestConfig(customJestConfig);
