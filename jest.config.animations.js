// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN JEST PARA TESTS DE ANIMACIONES
// ===================================

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Configuración personalizada para tests de animaciones
const customJestConfig = {
  // Configuración base
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  
  // Configuración específica para tests de animaciones
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  
  // Configuración de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
  },

  // Transformaciones para archivos estáticos
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Configuración de coverage específica para animaciones
  collectCoverageFrom: [
    'src/hooks/useCheckoutTransition.ts',
    'src/components/ui/checkout-transition-animation.tsx',
    'src/components/Common/CartSidebarModal/index.tsx',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/*.test.tsx',
    '!src/**/*.spec.tsx',
  ],
  
  // Umbrales de coverage para animaciones
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Umbrales específicos para componentes de animación
    'src/hooks/useCheckoutTransition.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'src/components/ui/checkout-transition-animation.tsx': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Configuración de timeouts para animaciones
  testTimeout: 10000, // 10 segundos para tests de animaciones

  // Variables de entorno para tests
  setupFiles: ['<rootDir>/jest.env.setup.js'],

  // Configuración de reporters
  reporters: ['default'],

  // Configuración de mocks globales para animaciones
  setupFilesAfterEnv: [
    '<rootDir>/jest.animation.setup.js',
  ],

  // Configuración de transformaciones
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Ignorar archivos específicos
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
  ],

  // Configuración de módulos a transformar
  transformIgnorePatterns: [
    'node_modules/(?!(framer-motion|@framer|@testing-library)/)',
  ],

  // Configuración de cache
  cacheDirectory: '<rootDir>/.jest-cache',
  clearMocks: true,
  restoreMocks: true,

  // Configuración específica para Framer Motion
  moduleNameMapper: {
    ...customJestConfig.moduleNameMapper,
    '^framer-motion$': '<rootDir>/__mocks__/framer-motion.js',
  },

  // Configuración de globals para performance testing
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
    // Variables globales para tests de performance
    ANIMATION_TEST_MODE: true,
    PERFORMANCE_TRACKING_ENABLED: true,
  },

  // Configuración de verbose para debugging
  verbose: true,
  
  // Configuración de bail para fallos rápidos
  bail: false,

  // Configuración de workers para paralelización
  maxWorkers: '50%',

  // Configuración de watch mode
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};

// Configuración específica para diferentes tipos de tests
const testConfigs = {
  // Tests unitarios de hooks
  unit: {
    ...customJestConfig,
    testMatch: ['**/__tests__/hooks/**/*.test.(ts|tsx)'],
    displayName: 'Unit Tests - Hooks',
  },
  
  // Tests de integración de componentes
  integration: {
    ...customJestConfig,
    testMatch: ['**/__tests__/components/**/*.test.(ts|tsx)'],
    displayName: 'Integration Tests - Components',
  },
  
  // Tests E2E
  e2e: {
    ...customJestConfig,
    testMatch: ['**/__tests__/e2e/**/*.test.(ts|tsx)'],
    displayName: 'E2E Tests - Full Flow',
    testTimeout: 15000, // Más tiempo para tests E2E
  },
};

// Exportar configuración basada en el tipo de test
const testType = process.env.TEST_TYPE || 'all';

if (testType === 'all') {
  module.exports = createJestConfig(customJestConfig);
} else if (testConfigs[testType]) {
  module.exports = createJestConfig(testConfigs[testType]);
} else {
  console.warn(`Unknown test type: ${testType}. Using default configuration.`);
  module.exports = createJestConfig(customJestConfig);
}
