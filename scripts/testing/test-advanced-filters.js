#!/usr/bin/env node

/**
 * Script ejecutor para tests del Sistema de Filtros Avanzados
 * Ejecuta todos los tests de Playwright para verificar la funcionalidad
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

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
  log(`🧪 ${message}`, 'bright')
  log('='.repeat(60), 'cyan')
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'yellow')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    })

    child.on('close', code => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })

    child.on('error', error => {
      reject(error)
    })
  })
}

async function checkPrerequisites() {
  logStep(1, 'Verificando prerequisitos...')

  // Verificar que existe package.json
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json no encontrado. Ejecutar desde la raíz del proyecto.')
  }

  // Verificar que existen los archivos de test
  const testFiles = [
    'tests/e2e/advanced-filters.spec.ts',
    'tests/e2e/filter-transitions.spec.ts',
    'tests/e2e/filter-detection.spec.ts',
  ]

  for (const file of testFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Archivo de test no encontrado: ${file}`)
    }
  }

  // Verificar directorio de screenshots
  if (!fs.existsSync('tests/screenshots')) {
    fs.mkdirSync('tests/screenshots', { recursive: true })
    logInfo('Directorio tests/screenshots creado')
  }

  logSuccess('Prerequisitos verificados')
}

async function installPlaywright() {
  logStep(2, 'Instalando navegadores de Playwright...')

  try {
    await runCommand('npx', ['playwright', 'install'])
    logSuccess('Navegadores de Playwright instalados')
  } catch (error) {
    logError('Error instalando navegadores de Playwright')
    throw error
  }
}

async function runTests() {
  logStep(3, 'Ejecutando tests del Sistema de Filtros Avanzados...')

  const testCommands = [
    {
      name: 'Tests Principales - ConditionalContent y FilteredProductsSection',
      command: 'npx',
      args: ['playwright', 'test', 'tests/e2e/advanced-filters.spec.ts', '--reporter=list'],
    },
    {
      name: 'Tests de Transiciones entre Vistas',
      command: 'npx',
      args: ['playwright', 'test', 'tests/e2e/filter-transitions.spec.ts', '--reporter=list'],
    },
    {
      name: 'Tests de Detección de Filtros',
      command: 'npx',
      args: ['playwright', 'test', 'tests/e2e/filter-detection.spec.ts', '--reporter=list'],
    },
  ]

  let allTestsPassed = true

  for (const testCmd of testCommands) {
    log(`\n🔍 Ejecutando: ${testCmd.name}`, 'magenta')

    try {
      await runCommand(testCmd.command, testCmd.args)
      logSuccess(`${testCmd.name} - PASARON`)
    } catch (error) {
      logError(`${testCmd.name} - FALLARON`)
      allTestsPassed = false
      // Continuar con los otros tests
    }
  }

  return allTestsPassed
}

async function generateReport() {
  logStep(4, 'Generando reporte HTML...')

  try {
    await runCommand('npx', ['playwright', 'show-report'])
    logSuccess('Reporte HTML generado')
  } catch (error) {
    logError('Error generando reporte HTML')
    // No es crítico, continuar
  }
}

async function showResults() {
  logStep(5, 'Verificando resultados...')

  // Verificar screenshots generados
  const screenshotDir = 'tests/screenshots'
  if (fs.existsSync(screenshotDir)) {
    const screenshots = fs.readdirSync(screenshotDir).filter(file => file.endsWith('.png'))

    if (screenshots.length > 0) {
      logSuccess(`${screenshots.length} screenshots capturados:`)
      screenshots.forEach(screenshot => {
        logInfo(`  📸 ${screenshot}`)
      })
    } else {
      logInfo('No se generaron screenshots')
    }
  }

  // Mostrar ubicación de reportes
  logInfo('Reportes disponibles en:')
  logInfo('  📊 HTML: test-results/')
  logInfo('  📄 JSON: test-results/results.json')
  logInfo('  📸 Screenshots: tests/screenshots/')
}

async function main() {
  try {
    logHeader('TESTING SISTEMA DE FILTROS AVANZADOS - PINTEYA E-COMMERCE')

    await checkPrerequisites()
    await installPlaywright()
    const allTestsPassed = await runTests()
    await generateReport()
    await showResults()

    if (allTestsPassed) {
      logHeader('🎉 TODOS LOS TESTS PASARON EXITOSAMENTE')
      logSuccess('El Sistema de Filtros Avanzados está funcionando correctamente')
    } else {
      logHeader('⚠️  ALGUNOS TESTS FALLARON')
      logError('Revisar los reportes para más detalles')
      process.exit(1)
    }
  } catch (error) {
    logError(`Error ejecutando tests: ${error.message}`)
    process.exit(1)
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { main }
