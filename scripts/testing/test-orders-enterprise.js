#!/usr/bin/env node

// ===================================
// PINTEYA E-COMMERCE - ORDERS ENTERPRISE TESTING SCRIPT
// ===================================
// Script para ejecutar tests enterprise de órdenes siguiendo patrones Fase 1

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ===================================
// CONFIGURACIÓN
// ===================================

const CONFIG = {
  testPaths: {
    unit: [
      'src/__tests__/api/admin/orders.test.js',
      'src/__tests__/components/admin/orders/*.test.jsx',
      'src/__tests__/hooks/useOrdersEnterprise.test.js',
      'src/__tests__/lib/orders-enterprise.test.js',
    ],
    integration: ['src/__tests__/integration/orders/*.test.js'],
    e2e: ['tests/e2e/orders/'],
  },
  coverage: {
    threshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    collectCoverageFrom: [
      'src/app/api/admin/orders/**/*.ts',
      'src/components/admin/orders/**/*.tsx',
      'src/hooks/useOrdersEnterprise.ts',
      'src/lib/orders-enterprise.ts',
      '!**/*.d.ts',
      '!**/*.stories.tsx',
      '!**/node_modules/**',
    ],
  },
  jest: {
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/orders-mocks.js'],
    testEnvironment: 'jsdom',
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
  },
}

// ===================================
// UTILIDADES
// ===================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m', // Reset
  }

  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`)
}

function executeCommand(command, options = {}) {
  try {
    log(`Ejecutando: ${command}`, 'info')
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      ...options,
    })
    return { success: true, result }
  } catch (error) {
    log(`Error ejecutando comando: ${error.message}`, 'error')
    return { success: false, error }
  }
}

function createJestConfig(testType) {
  const baseConfig = {
    ...CONFIG.jest,
    testMatch: CONFIG.testPaths[testType].map(pattern =>
      pattern.includes('*') ? `<rootDir>/${pattern}` : `<rootDir>/${pattern}`
    ),
  }

  if (testType === 'unit') {
    baseConfig.collectCoverage = true
    baseConfig.coverageDirectory = 'coverage/orders'
    baseConfig.collectCoverageFrom = CONFIG.coverage.collectCoverageFrom
    baseConfig.coverageThreshold = CONFIG.coverage.threshold
  }

  return baseConfig
}

function generateTestReport(results) {
  const reportPath = path.join(process.cwd(), 'test-reports', 'orders-enterprise.json')
  const reportDir = path.dirname(reportPath)

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      successRate: `${Math.round((results.filter(r => r.success).length / results.length) * 100)}%`,
    },
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  log(`Reporte generado: ${reportPath}`, 'success')

  return report
}

// ===================================
// FUNCIONES DE TESTING
// ===================================

async function runUnitTests(options = {}) {
  log('🧪 Iniciando tests unitarios de órdenes enterprise...', 'info')

  const jestConfig = createJestConfig('unit')
  const configPath = path.join(process.cwd(), 'jest.config.orders.js')

  // Crear configuración temporal de Jest
  fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(jestConfig, null, 2)};`)

  try {
    let command = `npx jest --config=${configPath}`

    if (options.watch) {
      command += ' --watch'
    }

    if (options.coverage) {
      command += ' --coverage'
    }

    if (options.verbose) {
      command += ' --verbose'
    }

    if (options.bail) {
      command += ' --bail'
    }

    const result = executeCommand(command)

    // Limpiar configuración temporal
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }

    if (result.success) {
      log('✅ Tests unitarios completados exitosamente', 'success')
    } else {
      log('❌ Tests unitarios fallaron', 'error')
    }

    return result
  } catch (error) {
    // Limpiar configuración temporal en caso de error
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }
    throw error
  }
}

async function runIntegrationTests(options = {}) {
  log('🔗 Iniciando tests de integración de órdenes...', 'info')

  const jestConfig = createJestConfig('integration')
  const configPath = path.join(process.cwd(), 'jest.config.orders-integration.js')

  fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(jestConfig, null, 2)};`)

  try {
    let command = `npx jest --config=${configPath}`

    if (options.verbose) {
      command += ' --verbose'
    }

    if (options.bail) {
      command += ' --bail'
    }

    const result = executeCommand(command)

    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }

    if (result.success) {
      log('✅ Tests de integración completados exitosamente', 'success')
    } else {
      log('❌ Tests de integración fallaron', 'error')
    }

    return result
  } catch (error) {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }
    throw error
  }
}

async function runE2ETests(options = {}) {
  log('🎭 Iniciando tests E2E de órdenes...', 'info')

  let command = 'npx playwright test tests/e2e/orders/'

  if (options.headed) {
    command += ' --headed'
  }

  if (options.debug) {
    command += ' --debug'
  }

  if (options.ui) {
    command += ' --ui'
  }

  const result = executeCommand(command)

  if (result.success) {
    log('✅ Tests E2E completados exitosamente', 'success')
  } else {
    log('❌ Tests E2E fallaron', 'error')
  }

  return result
}

async function runAllTests(options = {}) {
  log('🚀 Iniciando suite completa de tests de órdenes enterprise...', 'info')

  const results = []

  try {
    // Tests unitarios
    const unitResult = await runUnitTests(options)
    results.push({ type: 'unit', ...unitResult })

    // Tests de integración
    const integrationResult = await runIntegrationTests(options)
    results.push({ type: 'integration', ...integrationResult })

    // Tests E2E
    const e2eResult = await runE2ETests(options)
    results.push({ type: 'e2e', ...e2eResult })

    // Generar reporte
    const report = generateTestReport(results)

    log(`📊 Resumen de tests:`, 'info')
    log(`   Total: ${report.summary.total}`, 'info')
    log(`   Exitosos: ${report.summary.passed}`, 'success')
    log(`   Fallidos: ${report.summary.failed}`, report.summary.failed > 0 ? 'error' : 'info')
    log(`   Tasa de éxito: ${report.summary.successRate}`, 'info')

    if (report.summary.failed === 0) {
      log('🎉 ¡Todos los tests de órdenes enterprise pasaron!', 'success')
      return { success: true, report }
    } else {
      log('⚠️  Algunos tests fallaron. Revisa el reporte para más detalles.', 'warning')
      return { success: false, report }
    }
  } catch (error) {
    log(`Error ejecutando suite de tests: ${error.message}`, 'error')
    return { success: false, error }
  }
}

// ===================================
// FUNCIÓN PRINCIPAL
// ===================================

async function main() {
  const args = process.argv.slice(2)
  const options = {
    watch: args.includes('--watch'),
    coverage: args.includes('--coverage'),
    verbose: args.includes('--verbose'),
    bail: args.includes('--bail'),
    headed: args.includes('--headed'),
    debug: args.includes('--debug'),
    ui: args.includes('--ui'),
  }

  log('🎯 Pinteya E-commerce - Orders Enterprise Testing Suite', 'info')
  log('================================================', 'info')

  try {
    if (args.includes('--unit')) {
      await runUnitTests(options)
    } else if (args.includes('--integration')) {
      await runIntegrationTests(options)
    } else if (args.includes('--e2e')) {
      await runE2ETests(options)
    } else {
      await runAllTests(options)
    }
  } catch (error) {
    log(`Error fatal: ${error.message}`, 'error')
    process.exit(1)
  }
}

// ===================================
// EJECUCIÓN
// ===================================

if (require.main === module) {
  main().catch(error => {
    console.error('Error ejecutando tests:', error)
    process.exit(1)
  })
}

module.exports = {
  runUnitTests,
  runIntegrationTests,
  runE2ETests,
  runAllTests,
}
