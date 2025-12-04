#!/usr/bin/env node

/**
 * Script para ejecutar tests completos del Header
 * Incluye tests unitarios, integración, E2E, accesibilidad y responsive
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

// Función para logging con colores
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Función para ejecutar comandos
const runCommand = (command, description) => {
  log(`\n🔄 ${description}...`, 'cyan')
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    })
    log(`✅ ${description} completado`, 'green')
    return { success: true, output }
  } catch (error) {
    log(`❌ ${description} falló`, 'red')
    log(error.message, 'red')
    return { success: false, error: error.message }
  }
}

// Función para crear directorio si no existe
const ensureDir = dirPath => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    log(`📁 Directorio creado: ${dirPath}`, 'blue')
  }
}

// Función principal
const runHeaderTests = async () => {
  log('🧪 INICIANDO TESTS COMPLETOS DEL HEADER PINTEYA', 'bright')
  log('================================================', 'bright')

  const startTime = Date.now()
  const results = {
    unit: null,
    integration: null,
    accessibility: null,
    responsive: null,
    e2e: null,
  }

  // Crear directorios de reportes
  ensureDir('coverage/header')
  ensureDir('test-results/header')

  // 1. Tests Unitarios
  log('\n📋 FASE 1: TESTS UNITARIOS', 'magenta')
  results.unit = runCommand(
    'npx jest --config=src/components/Header/__tests__/jest.config.js --testPathPattern="unit" --coverage --coverageDirectory=coverage/header/unit',
    'Tests Unitarios'
  )

  // 2. Tests de Integración
  log('\n🔗 FASE 2: TESTS DE INTEGRACIÓN', 'magenta')
  results.integration = runCommand(
    'npx jest --config=src/components/Header/__tests__/jest.config.js --testPathPattern="integration" --coverage --coverageDirectory=coverage/header/integration',
    'Tests de Integración'
  )

  // 3. Tests de Accesibilidad
  log('\n♿ FASE 3: TESTS DE ACCESIBILIDAD', 'magenta')
  results.accessibility = runCommand(
    'npx jest --config=src/components/Header/__tests__/jest.config.js --testPathPattern="accessibility" --coverage --coverageDirectory=coverage/header/accessibility',
    'Tests de Accesibilidad'
  )

  // 4. Tests Responsive
  log('\n📱 FASE 4: TESTS RESPONSIVE', 'magenta')
  results.responsive = runCommand(
    'npx jest --config=src/components/Header/__tests__/jest.config.js --testPathPattern="responsive" --coverage --coverageDirectory=coverage/header/responsive',
    'Tests Responsive'
  )

  // 5. Tests E2E (solo si Playwright está disponible)
  log('\n🌐 FASE 5: TESTS E2E', 'magenta')
  try {
    // Verificar si Playwright está instalado
    execSync('npx playwright --version', { stdio: 'pipe' })

    // Ejecutar tests E2E
    results.e2e = runCommand(
      'npx playwright test src/components/Header/__tests__/e2e/ --reporter=html --output-dir=test-results/header/e2e',
      'Tests E2E con Playwright'
    )
  } catch (error) {
    log('⚠️  Playwright no está disponible, saltando tests E2E', 'yellow')
    results.e2e = { success: false, error: 'Playwright not available' }
  }

  // Generar reporte consolidado
  log('\n📊 GENERANDO REPORTE CONSOLIDADO', 'magenta')
  generateConsolidatedReport(results, startTime)

  // Mostrar resumen final
  showFinalSummary(results, startTime)
}

// Función para generar reporte consolidado
const generateConsolidatedReport = (results, startTime) => {
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r && r.success).length,
      failed: Object.values(results).filter(r => r && !r.success).length,
      skipped: Object.values(results).filter(r => !r).length,
    },
    results: results,
    coverage: {
      unit: getCoverageInfo('coverage/header/unit'),
      integration: getCoverageInfo('coverage/header/integration'),
      accessibility: getCoverageInfo('coverage/header/accessibility'),
      responsive: getCoverageInfo('coverage/header/responsive'),
    },
    recommendations: generateRecommendations(results),
  }

  // Guardar reporte JSON
  const reportPath = 'test-results/header/consolidated-report.json'
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  log(`📄 Reporte JSON guardado: ${reportPath}`, 'blue')

  // Generar reporte HTML
  generateHTMLReport(report)
}

// Función para obtener información de cobertura
const getCoverageInfo = coverageDir => {
  const summaryPath = path.join(coverageDir, 'coverage-summary.json')
  if (fs.existsSync(summaryPath)) {
    try {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
      return {
        lines: summary.total.lines.pct,
        functions: summary.total.functions.pct,
        branches: summary.total.branches.pct,
        statements: summary.total.statements.pct,
      }
    } catch (error) {
      return null
    }
  }
  return null
}

// Función para generar recomendaciones
const generateRecommendations = results => {
  const recommendations = []

  if (!results.unit?.success) {
    recommendations.push(
      '🔧 Revisar tests unitarios - pueden indicar problemas en la lógica de componentes'
    )
  }

  if (!results.integration?.success) {
    recommendations.push(
      '🔗 Verificar integración entre componentes - posibles problemas de comunicación'
    )
  }

  if (!results.accessibility?.success) {
    recommendations.push('♿ Mejorar accesibilidad - crítico para cumplimiento WCAG 2.1 AA')
  }

  if (!results.responsive?.success) {
    recommendations.push('📱 Optimizar diseño responsive - problemas en diferentes dispositivos')
  }

  if (!results.e2e?.success && results.e2e?.error !== 'Playwright not available') {
    recommendations.push('🌐 Revisar flujos E2E - problemas en experiencia de usuario real')
  }

  if (recommendations.length === 0) {
    recommendations.push('🎉 ¡Excelente! Todos los tests están pasando correctamente')
  }

  return recommendations
}

// Función para generar reporte HTML
const generateHTMLReport = report => {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Tests - Header Pinteya</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #ea5a17; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #ea5a17; }
        .success { border-left-color: #28a745; }
        .error { border-left-color: #dc3545; }
        .warning { border-left-color: #ffc107; }
        .results { margin-bottom: 30px; }
        .result-item { margin-bottom: 15px; padding: 15px; border-radius: 8px; }
        .coverage { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .coverage-item { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .progress { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-bar { height: 100%; background: #28a745; transition: width 0.3s; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Reporte de Tests - Header Pinteya</h1>
            <p class="timestamp">Generado: ${report.timestamp} | Duración: ${report.duration}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="card success">
                    <h3>✅ Tests Exitosos</h3>
                    <div style="font-size: 2em; font-weight: bold;">${report.summary.passed}</div>
                </div>
                <div class="card error">
                    <h3>❌ Tests Fallidos</h3>
                    <div style="font-size: 2em; font-weight: bold;">${report.summary.failed}</div>
                </div>
                <div class="card warning">
                    <h3>⏭️ Tests Omitidos</h3>
                    <div style="font-size: 2em; font-weight: bold;">${report.summary.skipped}</div>
                </div>
                <div class="card">
                    <h3>📊 Total</h3>
                    <div style="font-size: 2em; font-weight: bold;">${report.summary.total}</div>
                </div>
            </div>

            <div class="results">
                <h2>📋 Resultados Detallados</h2>
                ${Object.entries(report.results)
                  .map(
                    ([type, result]) => `
                    <div class="result-item ${result?.success ? 'success' : 'error'}">
                        <h3>${getTestTypeIcon(type)} ${getTestTypeName(type)}</h3>
                        <p><strong>Estado:</strong> ${result?.success ? '✅ Exitoso' : '❌ Fallido'}</p>
                        ${result?.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
                    </div>
                `
                  )
                  .join('')}
            </div>

            <div class="coverage">
                <h2>📊 Cobertura de Código</h2>
                ${Object.entries(report.coverage)
                  .filter(([_, cov]) => cov)
                  .map(
                    ([type, cov]) => `
                    <div class="coverage-item">
                        <h4>${getTestTypeName(type)}</h4>
                        <div style="margin-bottom: 10px;">
                            <span>Líneas: ${cov.lines}%</span>
                            <div class="progress">
                                <div class="progress-bar" style="width: ${cov.lines}%"></div>
                            </div>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <span>Funciones: ${cov.functions}%</span>
                            <div class="progress">
                                <div class="progress-bar" style="width: ${cov.functions}%"></div>
                            </div>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <span>Ramas: ${cov.branches}%</span>
                            <div class="progress">
                                <div class="progress-bar" style="width: ${cov.branches}%"></div>
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join('')}
            </div>

            <div class="recommendations">
                <h2>💡 Recomendaciones</h2>
                <ul>
                    ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`

  const htmlPath = 'test-results/header/report.html'
  fs.writeFileSync(htmlPath, html)
  log(`📄 Reporte HTML guardado: ${htmlPath}`, 'blue')
}

// Funciones auxiliares
const getTestTypeIcon = type => {
  const icons = {
    unit: '🔧',
    integration: '🔗',
    accessibility: '♿',
    responsive: '📱',
    e2e: '🌐',
  }
  return icons[type] || '📋'
}

const getTestTypeName = type => {
  const names = {
    unit: 'Tests Unitarios',
    integration: 'Tests de Integración',
    accessibility: 'Tests de Accesibilidad',
    responsive: 'Tests Responsive',
    e2e: 'Tests E2E',
  }
  return names[type] || type
}

// Función para mostrar resumen final
const showFinalSummary = (results, startTime) => {
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  log('\n🎯 RESUMEN FINAL', 'bright')
  log('================', 'bright')

  Object.entries(results).forEach(([type, result]) => {
    const icon = result?.success ? '✅' : '❌'
    const status = result?.success ? 'EXITOSO' : 'FALLIDO'
    const color = result?.success ? 'green' : 'red'
    log(`${icon} ${getTestTypeName(type)}: ${status}`, color)
  })

  log(`\n⏱️  Tiempo total: ${duration}s`, 'cyan')
  log(`📊 Reportes generados en: test-results/header/`, 'blue')
  log(`📈 Cobertura disponible en: coverage/header/`, 'blue')

  const allPassed = Object.values(results).every(r => r?.success)
  if (allPassed) {
    log('\n🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!', 'green')
  } else {
    log('\n⚠️  ALGUNOS TESTS FALLARON - REVISAR REPORTES', 'yellow')
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runHeaderTests().catch(error => {
    log(`💥 Error fatal: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = { runHeaderTests }
