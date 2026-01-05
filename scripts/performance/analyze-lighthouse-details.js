/**
 * Script para analizar detalles específicos del reporte de Lighthouse
 */

const report = require('../../lighthouse-report.json')

console.log('\n📊 ANÁLISIS DETALLADO DE LIGHTHOUSE\n')
console.log('============================================================\n')

// 1. Unused JavaScript
console.log('🔴 UNUSED JAVASCRIPT (450ms de ahorro):\n')
const unusedJS = report.audits['unused-javascript']
if (unusedJS.details && unusedJS.details.items) {
  unusedJS.details.items.slice(0, 5).forEach((item, i) => {
    const wastedKB = Math.round(item.wastedBytes / 1024)
    const url = item.url.length > 80 ? item.url.substring(0, 80) + '...' : item.url
    console.log(`  ${i + 1}. ${url}`)
    console.log(`     - Desperdiciado: ${wastedKB}KB`)
  })
} else {
  console.log('  No hay detalles disponibles\n')
}

// 2. Render Blocking Resources
console.log('\n🔴 RENDER BLOCKING RESOURCES (289ms de ahorro):\n')
const renderBlocking = report.audits['render-blocking-resources']
if (renderBlocking.details && renderBlocking.details.items) {
  renderBlocking.details.items.slice(0, 5).forEach((item, i) => {
    const url = item.url.length > 80 ? item.url.substring(0, 80) + '...' : item.url
    console.log(`  ${i + 1}. ${url}`)
    console.log(`     - Tiempo bloqueado: ${Math.round(item.wastedMs)}ms`)
  })
} else {
  console.log('  No hay detalles disponibles\n')
}

// 3. Console Errors
console.log('\n🚨 CONSOLE ERRORS:\n')
const consoleErrors = report.audits['errors-in-console']
if (consoleErrors.details && consoleErrors.details.items) {
  consoleErrors.details.items.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.text}`)
  })
} else {
  console.log('  No hay errores en consola\n')
}

// 4. Deprecated APIs
console.log('\n🚨 DEPRECATED APIs:\n')
const deprecated = report.audits['deprecations']
if (deprecated.details && deprecated.details.items) {
  deprecated.details.items.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.text || item.id}`)
  })
} else {
  console.log('  No hay APIs deprecadas detectadas\n')
}

// 5. Main Thread Work
console.log('\n🔴 MAIN THREAD WORK:\n')
const mainThread = report.audits['mainthread-work-breakdown']
if (mainThread.details && mainThread.details.items) {
  mainThread.details.items.slice(0, 10).forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.category}: ${Math.round(item.duration)}ms`)
  })
} else {
  console.log('  No hay detalles disponibles\n')
}

// 6. JavaScript Execution Time
console.log('\n🔴 JAVASCRIPT EXECUTION TIME:\n')
const jsExecution = report.audits['bootup-time']
if (jsExecution.details && jsExecution.details.items) {
  jsExecution.details.items.slice(0, 5).forEach((item, i) => {
    const url = item.url ? (item.url.length > 80 ? item.url.substring(0, 80) + '...' : item.url) : 'N/A'
    console.log(`  ${i + 1}. ${url}`)
    console.log(`     - Tiempo de ejecución: ${Math.round(item.scripting)}ms`)
  })
} else {
  console.log('  No hay detalles disponibles\n')
}

// 7. Unused CSS
console.log('\n🔴 UNUSED CSS (150ms de ahorro):\n')
const unusedCSS = report.audits['unused-css-rules']
if (unusedCSS.details && unusedCSS.details.items) {
  unusedCSS.details.items.slice(0, 5).forEach((item, i) => {
    const wastedKB = Math.round(item.wastedBytes / 1024)
    const url = item.url.length > 80 ? item.url.substring(0, 80) + '...' : item.url
    console.log(`  ${i + 1}. ${url}`)
    console.log(`     - Desperdiciado: ${wastedKB}KB`)
  })
} else {
  console.log('  No hay detalles disponibles\n')
}

// 8. Legacy JavaScript
console.log('\n🔴 LEGACY JAVASCRIPT (150ms de ahorro):\n')
const legacyJS = report.audits['legacy-javascript']
if (legacyJS.details && legacyJS.details.items) {
  legacyJS.details.items.slice(0, 5).forEach((item, i) => {
    const wastedKB = Math.round(item.wastedBytes / 1024)
    const url = item.url.length > 80 ? item.url.substring(0, 80) + '...' : item.url
    console.log(`  ${i + 1}. ${url}`)
    console.log(`     - Desperdiciado: ${wastedKB}KB`)
  })
} else {
  console.log('  No hay detalles disponibles\n')
}

console.log('\n============================================================\n')

