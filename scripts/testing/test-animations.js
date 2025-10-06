#!/usr/bin/env node

// ===================================
// PINTEYA E-COMMERCE - SCRIPT AUTOMATIZADO PARA TESTS DE ANIMACIONES
// ===================================

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

// Helper para logging con colores
const log = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: msg => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
}

// Configuración de tests
const testSuites = {
  unit: {
    name: 'Tests Unitarios - Hooks',
    pattern: '__tests__/hooks/**/*.test.ts',
    config: 'jest.config.animations.js',
    env: { TEST_TYPE: 'unit' },
  },
  integration: {
    name: 'Tests de Integración - Componentes',
    pattern: '__tests__/components/**/*.test.tsx',
    config: 'jest.config.animations.js',
    env: { TEST_TYPE: 'integration' },
  },
  e2e: {
    name: 'Tests E2E - Flujo Completo',
    pattern: '__tests__/e2e/**/*.test.tsx',
    config: 'jest.config.animations.js',
    env: { TEST_TYPE: 'e2e' },
  },
}

// Función para ejecutar comando con manejo de errores
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      ...options,
    })
    return { success: true, output: result }
  } catch (error) {
    return {
      success: false,
      output: error.stdout || error.message,
      error: error.stderr || error.message,
    }
  }
}

// Función para verificar dependencias
function checkDependencies() {
  log.header('🔍 Verificando Dependencias')

  const requiredDeps = [
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@testing-library/user-event',
    'framer-motion',
    'jest',
  ]

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  let missingDeps = []

  requiredDeps.forEach(dep => {
    if (!allDeps[dep]) {
      missingDeps.push(dep)
      log.error(`Dependencia faltante: ${dep}`)
    } else {
      log.success(`${dep} - ${allDeps[dep]}`)
    }
  })

  if (missingDeps.length > 0) {
    log.error('Instala las dependencias faltantes antes de ejecutar los tests')
    process.exit(1)
  }

  log.success('Todas las dependencias están instaladas')
}

// Función para verificar archivos de test
function checkTestFiles() {
  log.header('📁 Verificando Archivos de Test')

  const testFiles = [
    'src/__tests__/hooks/useCheckoutTransition.test.ts',
    'src/__tests__/components/CheckoutTransitionAnimation.test.tsx',
    'src/__tests__/e2e/checkout-transition-flow.test.tsx',
  ]

  let missingFiles = []

  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log.success(`${file}`)
    } else {
      missingFiles.push(file)
      log.error(`Archivo faltante: ${file}`)
    }
  })

  if (missingFiles.length > 0) {
    log.error('Algunos archivos de test no existen')
    return false
  }

  log.success('Todos los archivos de test están presentes')
  return true
}

// Función para ejecutar suite de tests
function runTestSuite(suiteKey, suite) {
  log.header(`🧪 Ejecutando: ${suite.name}`)

  const command = `npx jest --config=${suite.config} --testPathPattern="${suite.pattern}" --coverage --verbose`

  log.info(`Comando: ${command}`)

  const result = runCommand(command, {
    env: { ...process.env, ...suite.env },
  })

  if (result.success) {
    log.success(`${suite.name} - PASARON`)
    return true
  } else {
    log.error(`${suite.name} - FALLARON`)
    console.log(result.output)
    if (result.error) {
      console.log(result.error)
    }
    return false
  }
}

// Función para generar reporte de coverage
function generateCoverageReport() {
  log.header('📊 Generando Reporte de Coverage')

  const command =
    'npx jest --config=jest.config.animations.js --coverage --coverageReporters=html --coverageReporters=text --coverageReporters=lcov'

  const result = runCommand(command)

  if (result.success) {
    log.success('Reporte de coverage generado en ./coverage/')

    // Verificar umbrales de coverage
    const coveragePath = './coverage/coverage-summary.json'
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
      const total = coverage.total

      log.info(`Coverage Summary:`)
      log.info(`  Líneas: ${total.lines.pct}%`)
      log.info(`  Funciones: ${total.functions.pct}%`)
      log.info(`  Ramas: ${total.branches.pct}%`)
      log.info(`  Statements: ${total.statements.pct}%`)

      const minCoverage = 90
      if (
        total.lines.pct >= minCoverage &&
        total.functions.pct >= minCoverage &&
        total.branches.pct >= minCoverage &&
        total.statements.pct >= minCoverage
      ) {
        log.success(`Coverage cumple el umbral mínimo de ${minCoverage}%`)
        return true
      } else {
        log.warning(`Coverage por debajo del umbral mínimo de ${minCoverage}%`)
        return false
      }
    }
  } else {
    log.error('Error generando reporte de coverage')
    console.log(result.output)
    return false
  }
}

// Función para ejecutar tests de performance
function runPerformanceTests() {
  log.header('⚡ Ejecutando Tests de Performance')

  const command =
    'npx jest --config=jest.config.animations.js --testNamePattern="Performance|performance" --verbose'

  const result = runCommand(command)

  if (result.success) {
    log.success('Tests de performance completados')
    return true
  } else {
    log.error('Tests de performance fallaron')
    console.log(result.output)
    return false
  }
}

// Función para ejecutar tests de accesibilidad
function runAccessibilityTests() {
  log.header('♿ Ejecutando Tests de Accesibilidad')

  const command =
    'npx jest --config=jest.config.animations.js --testNamePattern="Accesibilidad|accessibility|a11y" --verbose'

  const result = runCommand(command)

  if (result.success) {
    log.success('Tests de accesibilidad completados')
    return true
  } else {
    log.error('Tests de accesibilidad fallaron')
    console.log(result.output)
    return false
  }
}

// Función principal
function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'all'

  log.header('🎬 Pinteya E-commerce - Test Runner para Animaciones')

  // Verificaciones iniciales
  checkDependencies()

  if (!checkTestFiles()) {
    process.exit(1)
  }

  let results = []

  switch (mode) {
    case 'unit':
      results.push(runTestSuite('unit', testSuites.unit))
      break

    case 'integration':
      results.push(runTestSuite('integration', testSuites.integration))
      break

    case 'e2e':
      results.push(runTestSuite('e2e', testSuites.e2e))
      break

    case 'performance':
      results.push(runPerformanceTests())
      break

    case 'accessibility':
      results.push(runAccessibilityTests())
      break

    case 'coverage':
      results.push(generateCoverageReport())
      break

    case 'all':
    default:
      // Ejecutar todas las suites
      Object.entries(testSuites).forEach(([key, suite]) => {
        results.push(runTestSuite(key, suite))
      })

      // Tests adicionales
      results.push(runPerformanceTests())
      results.push(runAccessibilityTests())

      // Generar coverage
      results.push(generateCoverageReport())
      break
  }

  // Resumen final
  log.header('📋 Resumen de Resultados')

  const passed = results.filter(r => r).length
  const total = results.length

  if (passed === total) {
    log.success(`Todos los tests pasaron (${passed}/${total})`)
    log.success('🎉 ¡Animaciones de checkout listas para producción!')
    process.exit(0)
  } else {
    log.error(`Algunos tests fallaron (${passed}/${total})`)
    log.error('❌ Revisa los errores antes de desplegar')
    process.exit(1)
  }
}

// Manejo de errores no capturados
process.on('uncaughtException', error => {
  log.error('Error no capturado:')
  console.error(error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  log.error('Promise rechazada no manejada:')
  console.error(reason)
  process.exit(1)
})

// Ejecutar script
if (require.main === module) {
  main()
}

module.exports = {
  runTestSuite,
  generateCoverageReport,
  runPerformanceTests,
  runAccessibilityTests,
}
