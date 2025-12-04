#!/usr/bin/env node

// =====================================================
// SCRIPT: DIAGNÓSTICO COMPLETO PANEL ADMINISTRATIVO
// Descripción: Ejecuta suite completa de pruebas E2E para validar
// el estado de implementación del panel administrativo enterprise
// =====================================================

const { execSync, spawn } = require('child_process')
const fs = require('fs').promises
const path = require('path')

// =====================================================
// CONFIGURACIÓN
// =====================================================

const CONFIG = {
  testFile: 'tests/e2e/admin-panel-enterprise-complete.spec.ts',
  outputDir: 'test-results/diagnostic-reports',
  browsers: ['chromium'], // Usar solo chromium para diagnóstico rápido
  headless: process.env.HEADLESS !== 'false',
  baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  timeout: 120000, // 2 minutos por test
  retries: 1,
}

// =====================================================
// UTILIDADES
// =====================================================

function logStep(step, message) {
  console.log(`\n🔹 PASO ${step}: ${message}`)
  console.log('='.repeat(60))
}

function logSuccess(message) {
  console.log(`✅ ${message}`)
}

function logError(message) {
  console.log(`❌ ${message}`)
}

function logWarning(message) {
  console.log(`⚠️ ${message}`)
}

function logInfo(message) {
  console.log(`ℹ️ ${message}`)
}

async function checkPrerequisites() {
  logStep(1, 'Verificando prerrequisitos')

  try {
    // Verificar que Playwright esté instalado
    execSync('npx playwright --version', { stdio: 'pipe' })
    logSuccess('Playwright instalado correctamente')
  } catch (error) {
    logError('Playwright no está instalado')
    logInfo('Ejecuta: npm install @playwright/test')
    process.exit(1)
  }

  try {
    // Verificar que el archivo de test existe
    await fs.access(CONFIG.testFile)
    logSuccess('Archivo de test encontrado')
  } catch (error) {
    logError(`Archivo de test no encontrado: ${CONFIG.testFile}`)
    process.exit(1)
  }

  try {
    // Crear directorio de salida si no existe
    await fs.mkdir(CONFIG.outputDir, { recursive: true })
    logSuccess('Directorio de salida preparado')
  } catch (error) {
    logWarning('No se pudo crear directorio de salida')
  }

  // Verificar si el servidor está corriendo
  try {
    const response = await fetch(CONFIG.baseUrl)
    if (response.ok) {
      logSuccess(`Servidor accesible en ${CONFIG.baseUrl}`)
    } else {
      logWarning(`Servidor responde con status ${response.status}`)
    }
  } catch (error) {
    logWarning(`No se pudo conectar al servidor en ${CONFIG.baseUrl}`)
    logInfo('Asegúrate de que el servidor esté corriendo con: npm run dev')
  }
}

async function runDiagnosticTests() {
  logStep(2, 'Ejecutando suite de diagnóstico completa')

  const playwrightArgs = [
    'playwright',
    'test',
    CONFIG.testFile,
    '--config=playwright.config.ts',
    `--project=${CONFIG.browsers.join(',')}`,
    '--reporter=list,html,json',
    `--output-dir=${CONFIG.outputDir}`,
    `--timeout=${CONFIG.timeout}`,
    `--retries=${CONFIG.retries}`,
    '--workers=1', // Ejecutar secuencialmente para mejor diagnóstico
  ]

  if (CONFIG.headless) {
    playwrightArgs.push('--headed=false')
  } else {
    playwrightArgs.push('--headed=true')
  }

  // Configurar variables de entorno
  const env = {
    ...process.env,
    PLAYWRIGHT_BASE_URL: CONFIG.baseUrl,
    NODE_ENV: 'test',
  }

  console.log(`🚀 Ejecutando: npx ${playwrightArgs.join(' ')}`)
  console.log(`🌐 URL Base: ${CONFIG.baseUrl}`)
  console.log(`👁️ Modo: ${CONFIG.headless ? 'Headless' : 'Con interfaz'}`)

  return new Promise((resolve, reject) => {
    const childProcess = spawn('npx', playwrightArgs, {
      stdio: 'inherit',
      env,
      cwd: process.cwd(),
    })

    childProcess.on('close', code => {
      if (code === 0) {
        logSuccess('Suite de diagnóstico completada exitosamente')
        resolve(code)
      } else {
        logWarning(`Suite completada con código de salida: ${code}`)
        // No rechazar - el diagnóstico puede completarse con fallos
        resolve(code)
      }
    })

    childProcess.on('error', error => {
      logError(`Error ejecutando tests: ${error.message}`)
      reject(error)
    })
  })
}

async function generateSummaryReport() {
  logStep(3, 'Generando reporte de resumen')

  try {
    // Buscar el reporte JSON más reciente
    const files = await fs.readdir(CONFIG.outputDir)
    const jsonFiles = files.filter(f => f.endsWith('.json') && f.includes('admin-panel-diagnostic'))

    if (jsonFiles.length === 0) {
      logWarning('No se encontraron reportes de diagnóstico')
      return
    }

    // Obtener el archivo más reciente
    const latestFile = jsonFiles.sort().reverse()[0]
    const reportPath = path.join(CONFIG.outputDir, latestFile)

    const reportContent = await fs.readFile(reportPath, 'utf8')
    const report = JSON.parse(reportContent)

    // Generar resumen en consola
    console.log('\n📊 RESUMEN EJECUTIVO DEL DIAGNÓSTICO')
    console.log('=====================================')
    console.log(`🕐 Timestamp: ${new Date(report.timestamp).toLocaleString('es-ES')}`)
    console.log(`📈 Tests Totales: ${report.summary.totalTests}`)
    console.log(`✅ Tests Exitosos: ${report.summary.passedTests}`)
    console.log(`❌ Tests Fallidos: ${report.summary.failedTests}`)
    console.log(
      `📊 Tasa de Éxito: ${Math.round((report.summary.passedTests / report.summary.totalTests) * 100)}%`
    )
    console.log(`🎯 Estado: ${report.summary.implementationStatus}`)

    console.log('\n📦 ESTADO POR MÓDULO:')
    Object.entries(report.testResults).forEach(([key, module]) => {
      const statusIcon =
        {
          IMPLEMENTED: '🟢',
          PARTIAL: '🟡',
          PLACEHOLDER: '⚪',
          ERROR: '🔴',
        }[module.status] || '⚫'

      console.log(`${statusIcon} ${module.moduleName}: ${module.status} (${module.overallScore}%)`)
    })

    if (report.errors.length > 0) {
      console.log(`\n⚠️ ERRORES DETECTADOS: ${report.errors.length}`)
      report.errors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.severity}] ${error.type}: ${error.message}`)
      })
      if (report.errors.length > 5) {
        console.log(`   ... y ${report.errors.length - 5} errores más`)
      }
    }

    console.log(`\n📁 Reporte completo: ${reportPath}`)

    // Buscar reporte HTML
    const htmlFiles = files.filter(f => f.endsWith('.html') && f.includes('admin-panel-diagnostic'))
    if (htmlFiles.length > 0) {
      const latestHtmlFile = htmlFiles.sort().reverse()[0]
      const htmlPath = path.join(CONFIG.outputDir, latestHtmlFile)
      console.log(`🌐 Reporte HTML: ${htmlPath}`)
      console.log(`   Abre en navegador: file://${path.resolve(htmlPath)}`)
    }

    logSuccess('Reporte de resumen generado')
  } catch (error) {
    logError(`Error generando reporte de resumen: ${error.message}`)
  }
}

async function openReportInBrowser() {
  try {
    const files = await fs.readdir(CONFIG.outputDir)
    const htmlFiles = files.filter(f => f.endsWith('.html') && f.includes('admin-panel-diagnostic'))

    if (htmlFiles.length > 0) {
      const latestHtmlFile = htmlFiles.sort().reverse()[0]
      const htmlPath = path.resolve(path.join(CONFIG.outputDir, latestHtmlFile))

      // Intentar abrir en navegador (funciona en la mayoría de sistemas)
      const open = await import('open').catch(() => null)
      if (open) {
        await open.default(`file://${htmlPath}`)
        logSuccess('Reporte abierto en navegador')
      } else {
        logInfo(`Abre manualmente: file://${htmlPath}`)
      }
    }
  } catch (error) {
    logWarning('No se pudo abrir el reporte automáticamente')
  }
}

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function main() {
  console.log('🏢 DIAGNÓSTICO PANEL ADMINISTRATIVO ENTERPRISE')
  console.log('===============================================')
  console.log('Pinteya E-commerce - Suite completa de validación')
  console.log(`Iniciado: ${new Date().toLocaleString('es-ES')}\n`)

  try {
    await checkPrerequisites()
    await runDiagnosticTests()
    await generateSummaryReport()

    // Abrir reporte en navegador si no es headless
    if (!CONFIG.headless) {
      await openReportInBrowser()
    }

    console.log('\n🎉 DIAGNÓSTICO COMPLETADO EXITOSAMENTE')
    console.log('=====================================')
    console.log('El diagnóstico del panel administrativo ha sido completado.')
    console.log('Revisa los reportes generados para obtener detalles completos.')
  } catch (error) {
    logError(`Error durante el diagnóstico: ${error.message}`)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('Error fatal:', error)
    process.exit(1)
  })
}

module.exports = { main, CONFIG }
