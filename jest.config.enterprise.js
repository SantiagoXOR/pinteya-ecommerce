// 🧪 Enterprise Jest Configuration for Admin Products Testing

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
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.js'],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/**/*.{js,jsx,ts,tsx}',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/__tests__/e2e/',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/app/api/admin/products/**/*.{js,ts}',
    'src/components/admin/products/**/*.{js,jsx,ts,tsx}',
    'src/hooks/admin/**/*.{js,ts}',
    'src/lib/api/**/*.{js,ts}',
    'src/lib/auth/**/*.{js,ts}',
    'src/lib/validation/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  // Coverage thresholds (Enterprise standards)
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Specific thresholds for critical modules
    'src/app/api/admin/products/**/*.{js,ts}': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'src/lib/api/**/*.{js,ts}': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover',
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage/enterprise',
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/__tests__/setup/global-setup.js',
  globalTeardown: '<rootDir>/src/__tests__/setup/global-teardown.js',
  
  // Test results processor
  testResultsProcessor: '<rootDir>/src/__tests__/setup/test-results-processor.js',
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/enterprise/html-report',
        filename: 'report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Pinteya E-commerce - Enterprise Test Report',
        // logoImgPath: './public/logo-positivo.svg', // Disabled to avoid file not found errors
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage/enterprise/junit',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // Notify mode (disabled for CI compatibility)
  notify: false,
  
  // Max workers for parallel execution
  maxWorkers: '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
