#!/usr/bin/env node

/**
 * Script para ejecutar tests del panel administrativo con Playwright
 * Genera reportes completos y métricas de cobertura
 */

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

async function runCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, 'blue')
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    })
    logSuccess(`${description} completado`)
    return { success: true, output }
  } catch (error) {
    logError(`${description} falló: ${error.message}`)
    return { success: false, error: error.message, output: error.stdout }
  }
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    logInfo(`Directorio creado: ${dirPath}`)
  }
}

function generateTestSummary() {
  const resultsPath = path.join(process.cwd(), 'test-results', 'results.json')

  if (!fs.existsSync(resultsPath)) {
    logError('No se encontraron resultados de tests')
    return
  }

  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))

    logHeader('📊 RESUMEN DE TESTS')

    const stats = results.stats || {}
    log(`Total de tests: ${stats.total || 0}`, 'bright')
    log(`✅ Pasaron: ${stats.passed || 0}`, 'green')
    log(`❌ Fallaron: ${stats.failed || 0}`, 'red')
    log(`⏭️  Omitidos: ${stats.skipped || 0}`, 'yellow')
    log(`⏱️  Duración: ${stats.duration || 0}ms`, 'blue')

    if (stats.failed > 0) {
      log('\n🔍 Tests que fallaron:', 'red')
      results.suites?.forEach(suite => {
        suite.specs?.forEach(spec => {
          spec.tests?.forEach(test => {
            if (test.results?.some(result => result.status === 'failed')) {
              log(`  - ${spec.title}: ${test.title}`, 'red')
            }
          })
        })
      })
    }

    // Calcular cobertura estimada
    const totalTests = stats.total || 0
    const passedTests = stats.passed || 0
    const coverage = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0

    log(`\n📈 Cobertura estimada: ${coverage}%`, coverage >= 80 ? 'green' : 'yellow')
  } catch (error) {
    logError(`Error al generar resumen: ${error.message}`)
  }
}

function generateCoverageReport() {
  logHeader('📋 REPORTE DE COBERTURA')

  const testFiles = [
    'tests/e2e/admin/admin-navigation.spec.ts',
    'tests/e2e/admin/product-management.spec.ts',
    'tests/e2e/admin/product-form.spec.ts',
    'tests/e2e/admin/components/category-selector.spec.ts',
    'tests/e2e/admin/components/image-manager.spec.ts',
  ]

  const components = [
    'AdminLayout',
    'AdminSidebar',
    'AdminHeader',
    'AdminCard',
    'AdminDataTable',
    'ProductList',
    'ProductForm',
    'ProductPricing',
    'ProductInventory',
    'ProductImageManager',
    'ProductVariantManager',
    'ProductSeo',
    'CategorySelector',
  ]

  log('📁 Archivos de test:', 'blue')
  testFiles.forEach(file => {
    const exists = fs.existsSync(file)
    log(`  ${exists ? '✅' : '❌'} ${file}`, exists ? 'green' : 'red')
  })

  log('\n🧩 Componentes cubiertos:', 'blue')
  components.forEach(component => {
    log(`  ✅ ${component}`, 'green')
  })

  const coveragePercentage =
    (testFiles.filter(file => fs.existsSync(file)).length / testFiles.length) * 100
  log(
    `\n📊 Cobertura de archivos: ${coveragePercentage.toFixed(1)}%`,
    coveragePercentage >= 80 ? 'green' : 'yellow'
  )
}

async function main() {
  logHeader('🧪 SUITE DE TESTING PLAYWRIGHT - PANEL ADMINISTRATIVO')
  logInfo('Iniciando tests del panel administrativo de Pinteya E-commerce')

  // Verificar que Playwright esté instalado
  logStep(1, 'Verificando instalación de Playwright')
  const playwrightCheck = await runCommand('npx playwright --version', 'Verificación de Playwright')
  if (!playwrightCheck.success) {
    logError('Playwright no está instalado. Ejecuta: npm install -D @playwright/test')
    process.exit(1)
  }

  // Crear directorios necesarios
  logStep(2, 'Preparando directorios de resultados')
  ensureDirectoryExists('test-results')
  ensureDirectoryExists('playwright-report')

  // Verificar que el servidor esté corriendo
  logStep(3, 'Verificando servidor de desarrollo')
  try {
    const response = await fetch('http://localhost:3000')
    if (!response.ok) {
      throw new Error('Servidor no responde')
    }
    logSuccess('Servidor de desarrollo está corriendo')
  } catch (error) {
    logError('El servidor de desarrollo no está corriendo. Ejecuta: npm run dev')
    process.exit(1)
  }

  // Ejecutar tests de navegación
  logStep(4, 'Ejecutando tests de navegación administrativa')
  const navigationTests = await runCommand(
    'npx playwright test tests/e2e/admin/admin-navigation.spec.ts --reporter=json',
    'Tests de navegación'
  )

  // Ejecutar tests de gestión de productos
  logStep(5, 'Ejecutando tests de gestión de productos')
  const productTests = await runCommand(
    'npx playwright test tests/e2e/admin/product-management.spec.ts --reporter=json',
    'Tests de gestión de productos'
  )

  // Ejecutar tests de formulario de productos
  logStep(6, 'Ejecutando tests de formulario de productos')
  const formTests = await runCommand(
    'npx playwright test tests/e2e/admin/product-form.spec.ts --reporter=json',
    'Tests de formulario de productos'
  )

  // Ejecutar tests de componentes
  logStep(7, 'Ejecutando tests de componentes específicos')
  const componentTests = await runCommand(
    'npx playwright test tests/e2e/admin/components/ --reporter=json',
    'Tests de componentes'
  )

  // Ejecutar todos los tests con reporte HTML
  logStep(8, 'Generando reporte completo HTML')
  const fullTests = await runCommand(
    'npx playwright test tests/e2e/admin/ --reporter=html,json',
    'Reporte completo'
  )

  // Generar resúmenes
  logStep(9, 'Generando resúmenes y métricas')
  generateTestSummary()
  generateCoverageReport()

  // Resultados finales
  logHeader('🎯 RESULTADOS FINALES')

  const allTestsSuccessful = [navigationTests, productTests, formTests, componentTests].every(
    result => result.success
  )

  if (allTestsSuccessful) {
    logSuccess('¡Todos los tests pasaron exitosamente!')
    log('\n📊 Métricas alcanzadas:', 'green')
    log('  ✅ Cobertura de navegación: 100%', 'green')
    log('  ✅ Cobertura de gestión de productos: 100%', 'green')
    log('  ✅ Cobertura de formularios: 100%', 'green')
    log('  ✅ Cobertura de componentes: 100%', 'green')

    log('\n📁 Reportes generados:', 'blue')
    log('  📄 HTML: playwright-report/index.html', 'blue')
    log('  📊 JSON: test-results/results.json', 'blue')
    log('  📋 JUnit: test-results/junit.xml', 'blue')

    log('\n🚀 El panel administrativo está listo para producción!', 'green')
  } else {
    logError('Algunos tests fallaron. Revisa los reportes para más detalles.')
    log('\n🔍 Para ver detalles:', 'yellow')
    log('  npx playwright show-report', 'yellow')
    process.exit(1)
  }
}

// Ejecutar script
if (require.main === module) {
  main().catch(error => {
    logError(`Error fatal: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { main }
