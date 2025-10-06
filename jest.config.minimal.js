// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN MÍNIMA DE JEST PARA CI/CD
// ===================================

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Configuración mínima para CI/CD
const customJestConfig = {
  testEnvironment: 'jsdom',
  
  // Configuración optimizada para CI
  cache: false,
  maxWorkers: 2,
  testTimeout: 10000,
  
  // Setup básico
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Mapeos esenciales
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Ignorar archivos problemáticos
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/performance/',
    '<rootDir>/__tests__/e2e/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/src/__tests__/e2e/',
  ],
  
  // Configuración de cobertura básica
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  
  // Transformaciones
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Variables de entorno para tests
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
}

module.exports = createJestConfig(customJestConfig)