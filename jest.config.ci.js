// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN CI/CD JEST
// ===================================

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jsdom',
  
  // Configuración ultra-mínima para CI
  cache: false,
  maxWorkers: 1,
  testTimeout: 5000,
  
  // Tests incluidos
  testMatch: [
    '<rootDir>/src/__tests__/utils/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/lib/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/components/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/hooks/*.test.{js,jsx,ts,tsx}',
  ],
  
  // Mapeos básicos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Transformar módulos ES de node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@tabler/icons-react|@radix-ui|next)/)',
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Variables de entorno
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
}

module.exports = createJestConfig(customJestConfig)