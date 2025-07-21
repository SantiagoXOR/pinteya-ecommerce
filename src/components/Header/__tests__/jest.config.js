/**
 * Configuración Jest específica para tests del Header
 */

const path = require('path');

module.exports = {
  // Entorno de testing
  testEnvironment: 'jsdom',
  
  // Archivos de setup
  setupFilesAfterEnv: [
    '<rootDir>/src/test-utils/setup.ts',
    '<rootDir>/src/components/Header/__tests__/setup.ts'
  ],
  
  // Patrones de archivos de test
  testMatch: [
    '<rootDir>/src/components/Header/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/components/Header/__tests__/**/*.spec.{ts,tsx}'
  ],
  
  // Mapeo de módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/redux/(.*)$': '<rootDir>/src/redux/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
  },
  
  // Transformaciones
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    }],
  },
  
  // Archivos a ignorar en transformaciones
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@clerk/nextjs|@tanstack/react-query))',
  ],
  
  // Extensiones de módulos
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Cobertura de código
  collectCoverageFrom: [
    'src/components/Header/**/*.{ts,tsx}',
    '!src/components/Header/**/*.stories.{ts,tsx}',
    '!src/components/Header/**/*.d.ts',
    '!src/components/Header/__tests__/**/*',
  ],
  
  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Umbrales específicos por archivo
    'src/components/Header/index.tsx': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'src/components/Header/AuthSection.tsx': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  
  // Reportes de cobertura
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary',
  ],
  
  // Directorio de reportes
  coverageDirectory: '<rootDir>/coverage/header',
  
  // Mocks de archivos estáticos
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/test-utils/fileMock.js',
  },
  
  // Variables de entorno para tests
  setupFiles: ['<rootDir>/src/test-utils/env.ts'],
  
  // Configuración de timeouts
  testTimeout: 10000,
  
  // Configuración de workers
  maxWorkers: '50%',
  
  // Configuración de cache
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest/header',
  
  // Configuración de watch
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/.next/',
  ],
  
  // Configuración de notificaciones
  notify: true,
  notifyMode: 'failure-change',
  
  // Configuración de verbose
  verbose: true,
  
  // Configuración de bail (detener en primer fallo)
  bail: false,
  
  // Configuración de clear mocks
  clearMocks: true,
  restoreMocks: true,
  
  // Configuración de globals
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
  
  // Configuración de test results processor
  testResultsProcessor: '<rootDir>/src/test-utils/testResultsProcessor.js',
  
  // Configuración de reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/coverage/header/html-report',
        filename: 'report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Header Component Test Report',
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/coverage/header',
        outputName: 'junit.xml',
        suiteName: 'Header Component Tests',
      },
    ],
  ],
  
  // Configuración de test sequences
  testSequencer: '<rootDir>/src/test-utils/testSequencer.js',
  
  // Configuración de error on deprecated
  errorOnDeprecated: true,
  
  // Configuración de detect open handles
  detectOpenHandles: true,
  
  // Configuración de force exit
  forceExit: false,
  
  // Configuración de log heap usage
  logHeapUsage: false,
  
  // Configuración de max concurrency
  maxConcurrency: 5,
  
  // Configuración de pass with no tests
  passWithNoTests: true,
  
  // Configuración de preset
  preset: 'ts-jest/presets/js-with-ts',
  
  // Configuración de project display name
  displayName: {
    name: 'Header Component Tests',
    color: 'blue',
  },
  
  // Configuración de runner
  runner: 'jest-runner',
  
  // Configuración de silent
  silent: false,
  
  // Configuración de update snapshot
  updateSnapshot: false,
  
  // Configuración de use stderr
  useStderr: false,
  
  // Configuración de watch
  watch: false,
  watchAll: false,
};
