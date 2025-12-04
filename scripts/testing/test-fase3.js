#!/usr/bin/env node

// ===================================
// PINTEYA E-COMMERCE - FASE 3 TESTING SCRIPT
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan')
  log(`  ${message}`, 'bright')
  log('='.repeat(60), 'cyan')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// Configuración de tests
const testSuites = {
  unit: {
    name: 'Tests Unitarios Fase 3',
    patterns: [
      'src/__tests__/lib/circuit-breaker.test.ts',
      'src/__tests__/lib/audit-trail.test.ts',
      'src/__tests__/lib/enterprise-metrics.test.ts',
      'src/__tests__/lib/alert-system.test.ts',
      'src/__tests__/lib/health-checks.test.ts',
    ],
    command: 'npm run test:unit',
  },
  components: {
    name: 'Tests de Componentes React',
    patterns: [
      'src/__tests__/components/monitoring/RealTimeMonitoringDashboard.test.tsx',
      'src/__tests__/components/monitoring/MetricChart.test.tsx',
    ],
    command: 'npm run test:components',
  },
  api: {
    name: 'Tests de APIs',
    patterns: ['src/__tests__/api/monitoring-apis.test.ts'],
    command: 'npm run test:api',
  },
  integration: {
    name: 'Tests de Integración',
    patterns: ['src/__tests__/integration/monitoring-integration.test.ts'],
    command: 'npm run test:integration',
  },
  e2e: {
    name: 'Tests End-to-End',
    patterns: ['src/__tests__/e2e/monitoring-dashboard.e2e.test.ts'],
    command: 'npm run test:e2e',
  },
}

// Función para ejecutar comando
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options,
    })
    return { success: true, output: result }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || '',
    }
  }
}

// Función para verificar si existe un archivo
function fileExists(filePath) {
  try {
    return fs.existsSync(path.resolve(filePath))
  } catch {
    return false
  }
}

// Función para contar tests en un archivo
function countTestsInFile(filePath) {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8')
    const testMatches = content.match(/test\(|it\(/g)
    const describeMatches = content.match(/describe\(/g)
    return {
      tests: testMatches ? testMatches.length : 0,
      suites: describeMatches ? describeMatches.length : 0,
    }
  } catch {
    return { tests: 0, suites: 0 }
  }
}

// Función para verificar archivos de test
function verifyTestFiles() {
  logHeader('VERIFICACIÓN DE ARCHIVOS DE TEST')

  let totalTests = 0
  let totalSuites = 0
  let missingFiles = 0

  Object.entries(testSuites).forEach(([key, suite]) => {
    log(`\n📁 ${suite.name}:`, 'bright')

    suite.patterns.forEach(pattern => {
      if (fileExists(pattern)) {
        const counts = countTestsInFile(pattern)
        totalTests += counts.tests
        totalSuites += counts.suites
        logSuccess(`${pattern} (${counts.tests} tests, ${counts.suites} suites)`)
      } else {
        missingFiles++
        logError(`${pattern} - ARCHIVO NO ENCONTRADO`)
      }
    })
  })

  log(`\n📊 Resumen:`, 'bright')
  logInfo(
    `Total de archivos de test: ${Object.values(testSuites).reduce((acc, suite) => acc + suite.patterns.length, 0)}`
  )
  logInfo(
    `Archivos encontrados: ${Object.values(testSuites).reduce((acc, suite) => acc + suite.patterns.length, 0) - missingFiles}`
  )
  logInfo(`Total de tests: ${totalTests}`)
  logInfo(`Total de suites: ${totalSuites}`)

  if (missingFiles > 0) {
    logWarning(`Archivos faltantes: ${missingFiles}`)
  }

  return { totalTests, totalSuites, missingFiles }
}

// Función para ejecutar suite de tests
function runTestSuite(key, suite, options = {}) {
  logHeader(`EJECUTANDO: ${suite.name.toUpperCase()}`)

  // Verificar archivos antes de ejecutar
  const existingFiles = suite.patterns.filter(fileExists)
  if (existingFiles.length === 0) {
    logWarning('No se encontraron archivos de test para esta suite')
    return { success: false, skipped: true }
  }

  // Construir comando específico para los archivos existentes
  let command
  if (options.coverage) {
    command = `npx jest ${existingFiles.join(' ')} --coverage --coverageDirectory=coverage/fase3/${key}`
  } else {
    command = `npx jest ${existingFiles.join(' ')} --verbose`
  }

  logInfo(`Ejecutando: ${command}`)

  const result = runCommand(command)

  if (result.success) {
    logSuccess(`${suite.name} - COMPLETADO`)
  } else {
    logError(`${suite.name} - FALLÓ`)
    if (result.output) {
      log(result.output, 'red')
    }
  }

  return result
}

// Función para generar reporte de cobertura
function generateCoverageReport() {
  logHeader('GENERANDO REPORTE DE COBERTURA')

  const command =
    'npx jest --coverage --coverageDirectory=coverage/fase3/complete --testPathPattern="(circuit-breaker|audit-trail|enterprise-metrics|alert-system|health-checks|monitoring)"'

  logInfo('Ejecutando análisis de cobertura...')
  const result = runCommand(command)

  if (result.success) {
    logSuccess('Reporte de cobertura generado en coverage/fase3/complete/')
    logInfo('Abre coverage/fase3/complete/lcov-report/index.html para ver el reporte detallado')
  } else {
    logError('Error al generar reporte de cobertura')
  }

  return result
}

// Función para ejecutar linting
function runLinting() {
  logHeader('EJECUTANDO LINTING')

  const files = Object.values(testSuites)
    .flatMap(suite => suite.patterns)
    .filter(fileExists)

  if (files.length === 0) {
    logWarning('No se encontraron archivos para linting')
    return { success: false, skipped: true }
  }

  const command = `npx eslint ${files.join(' ')} --ext .ts,.tsx`

  logInfo(`Ejecutando: ${command}`)
  const result = runCommand(command)

  if (result.success) {
    logSuccess('Linting completado sin errores')
  } else {
    logWarning('Se encontraron issues de linting')
  }

  return result
}

// Función para verificar dependencias
function checkDependencies() {
  logHeader('VERIFICANDO DEPENDENCIAS')

  const requiredDeps = [
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@playwright/test',
    'jest',
    'eslint',
  ]

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  let missingDeps = 0

  requiredDeps.forEach(dep => {
    if (allDeps[dep]) {
      logSuccess(`${dep} - ${allDeps[dep]}`)
    } else {
      logError(`${dep} - NO INSTALADO`)
      missingDeps++
    }
  })

  if (missingDeps > 0) {
    logWarning(`Dependencias faltantes: ${missingDeps}`)
    logInfo('Ejecuta: npm install para instalar dependencias faltantes')
  }

  return missingDeps === 0
}

// Función principal
async function main() {
  const args = process.argv.slice(2)
  const options = {
    coverage: args.includes('--coverage'),
    lint: args.includes('--lint'),
    suite: args.find(arg => arg.startsWith('--suite='))?.split('=')[1],
    skipDeps: args.includes('--skip-deps'),
  }

  logHeader('PINTEYA E-COMMERCE - TESTING SUITE FASE 3')
  logInfo('Sistema de Monitoreo Enterprise - Tests Completos')

  // Verificar dependencias
  if (!options.skipDeps) {
    const depsOk = checkDependencies()
    if (!depsOk) {
      logError('Dependencias faltantes. Usa --skip-deps para omitir esta verificación.')
      process.exit(1)
    }
  }

  // Verificar archivos de test
  const verification = verifyTestFiles()

  // Ejecutar linting si se solicita
  if (options.lint) {
    runLinting()
  }

  // Ejecutar suite específica o todas
  const results = {}

  if (options.suite) {
    if (testSuites[options.suite]) {
      results[options.suite] = runTestSuite(options.suite, testSuites[options.suite], options)
    } else {
      logError(`Suite '${options.suite}' no encontrada`)
      logInfo(`Suites disponibles: ${Object.keys(testSuites).join(', ')}`)
      process.exit(1)
    }
  } else {
    // Ejecutar todas las suites
    for (const [key, suite] of Object.entries(testSuites)) {
      results[key] = runTestSuite(key, suite, options)
    }
  }

  // Generar reporte de cobertura si se solicita
  if (options.coverage) {
    generateCoverageReport()
  }

  // Resumen final
  logHeader('RESUMEN FINAL')

  const successful = Object.values(results).filter(r => r.success).length
  const failed = Object.values(results).filter(r => !r.success && !r.skipped).length
  const skipped = Object.values(results).filter(r => r.skipped).length

  logInfo(`Tests ejecutados: ${verification.totalTests}`)
  logInfo(`Suites ejecutadas: ${Object.keys(results).length}`)
  logSuccess(`Exitosas: ${successful}`)
  if (failed > 0) logError(`Fallidas: ${failed}`)
  if (skipped > 0) logWarning(`Omitidas: ${skipped}`)

  if (failed === 0) {
    logSuccess('\n🎉 TODOS LOS TESTS DE FASE 3 COMPLETADOS EXITOSAMENTE!')
    logInfo('El sistema de monitoreo enterprise está listo para producción.')
  } else {
    logError('\n💥 ALGUNOS TESTS FALLARON')
    logInfo('Revisa los errores arriba y corrige los problemas.')
    process.exit(1)
  }
}

// Manejo de errores
process.on('uncaughtException', error => {
  logError(`Error no capturado: ${error.message}`)
  process.exit(1)
})

process.on('unhandledRejection', reason => {
  logError(`Promesa rechazada: ${reason}`)
  process.exit(1)
})

// Ejecutar script
if (require.main === module) {
  main().catch(error => {
    logError(`Error en script principal: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { main, testSuites, runTestSuite }
