#!/usr/bin/env node

/**
 * Script de monitoreo continuo de performance
 * Analiza métricas de bundle size, build time y performance
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('📊 Iniciando monitoreo de performance...\n')

// ===================================
// CONFIGURACIÓN
// ===================================

const config = {
  thresholds: {
    bundleSize: 4 * 1024 * 1024, // 4MB
    firstLoadJS: 600 * 1024, // 600KB
    buildTime: 45000, // 45 segundos
    vendorChunk: 500 * 1024, // 500KB
  },
  outputDir: 'performance-reports',
  buildStatsFile: '.next/build-stats.json',
}

// ===================================
// MÉTRICAS DE PERFORMANCE
// ===================================

const metrics = {
  timestamp: new Date().toISOString(),
  bundleSize: 0,
  firstLoadJS: 0,
  buildTime: 0,
  vendorChunk: 0,
  pageCount: 0,
  warnings: [],
  alerts: [],
  score: 0,
}

/**
 * Ejecuta build y mide tiempo
 */
function measureBuildTime() {
  console.log('⏱️  Midiendo tiempo de build...')

  const startTime = Date.now()

  try {
    execSync('npm run build', {
      stdio: 'pipe',
      cwd: process.cwd(),
    })

    const endTime = Date.now()
    metrics.buildTime = endTime - startTime

    console.log(`✅ Build completado en ${metrics.buildTime}ms`)

    if (metrics.buildTime > config.thresholds.buildTime) {
      metrics.alerts.push({
        type: 'BUILD_TIME',
        message: `Build time excede threshold: ${metrics.buildTime}ms > ${config.thresholds.buildTime}ms`,
        severity: 'high',
      })
    }
  } catch (error) {
    metrics.alerts.push({
      type: 'BUILD_FAILED',
      message: `Build falló: ${error.message}`,
      severity: 'critical',
    })
    console.error('❌ Build falló:', error.message)
  }
}

/**
 * Analiza el bundle size
 */
function analyzeBundleSize() {
  console.log('📦 Analizando bundle size...')

  try {
    const buildDir = path.join(process.cwd(), '.next')

    if (!fs.existsSync(buildDir)) {
      throw new Error('Directorio .next no encontrado')
    }

    // Calcular tamaño total del bundle
    const totalSize = calculateDirectorySize(buildDir)
    metrics.bundleSize = totalSize

    console.log(`📊 Bundle size total: ${formatBytes(totalSize)}`)

    // Analizar chunks específicos
    analyzeChunks()

    // Verificar thresholds
    if (metrics.bundleSize > config.thresholds.bundleSize) {
      metrics.alerts.push({
        type: 'BUNDLE_SIZE',
        message: `Bundle size excede threshold: ${formatBytes(metrics.bundleSize)} > ${formatBytes(config.thresholds.bundleSize)}`,
        severity: 'medium',
      })
    }
  } catch (error) {
    metrics.warnings.push(`Error analizando bundle: ${error.message}`)
    console.warn('⚠️  Error analizando bundle:', error.message)
  }
}

/**
 * Analiza chunks específicos
 */
function analyzeChunks() {
  const chunksDir = path.join(process.cwd(), '.next/static/chunks')

  if (!fs.existsSync(chunksDir)) {
    return
  }

  const chunks = fs.readdirSync(chunksDir)
  let vendorSize = 0
  let firstLoadSize = 0

  chunks.forEach(chunk => {
    const chunkPath = path.join(chunksDir, chunk)
    const stat = fs.statSync(chunkPath)

    if (chunk.includes('vendor')) {
      vendorSize += stat.size
    }

    if (chunk.includes('common') || chunk.includes('vendor')) {
      firstLoadSize += stat.size
    }
  })

  metrics.vendorChunk = vendorSize
  metrics.firstLoadJS = firstLoadSize

  console.log(`📊 Vendor chunk: ${formatBytes(vendorSize)}`)
  console.log(`📊 First Load JS: ${formatBytes(firstLoadSize)}`)

  // Verificar thresholds
  if (metrics.firstLoadJS > config.thresholds.firstLoadJS) {
    metrics.alerts.push({
      type: 'FIRST_LOAD_JS',
      message: `First Load JS excede threshold: ${formatBytes(metrics.firstLoadJS)} > ${formatBytes(config.thresholds.firstLoadJS)}`,
      severity: 'medium',
    })
  }

  if (metrics.vendorChunk > config.thresholds.vendorChunk) {
    metrics.alerts.push({
      type: 'VENDOR_CHUNK',
      message: `Vendor chunk excede threshold: ${formatBytes(metrics.vendorChunk)} > ${formatBytes(config.thresholds.vendorChunk)}`,
      severity: 'low',
    })
  }
}

/**
 * Calcula el tamaño de un directorio
 */
function calculateDirectorySize(dirPath) {
  let totalSize = 0

  function scanDir(currentPath) {
    const items = fs.readdirSync(currentPath)

    items.forEach(item => {
      const itemPath = path.join(currentPath, item)
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory()) {
        scanDir(itemPath)
      } else {
        totalSize += stat.size
      }
    })
  }

  scanDir(dirPath)
  return totalSize
}

/**
 * Analiza páginas generadas
 */
function analyzePages() {
  console.log('📄 Analizando páginas generadas...')

  try {
    const pagesDir = path.join(process.cwd(), '.next/server/app')

    if (fs.existsSync(pagesDir)) {
      const pageCount = countPages(pagesDir)
      metrics.pageCount = pageCount
      console.log(`📊 Páginas generadas: ${pageCount}`)
    }
  } catch (error) {
    metrics.warnings.push(`Error analizando páginas: ${error.message}`)
  }
}

/**
 * Cuenta páginas recursivamente
 */
function countPages(dir) {
  let count = 0

  function scanDir(currentPath) {
    const items = fs.readdirSync(currentPath)

    items.forEach(item => {
      const itemPath = path.join(currentPath, item)
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory()) {
        scanDir(itemPath)
      } else if (item.endsWith('.js') || item.endsWith('.html')) {
        count++
      }
    })
  }

  scanDir(dir)
  return count
}

/**
 * Calcula score de performance
 */
function calculatePerformanceScore() {
  let score = 100

  // Penalizar por bundle size
  if (metrics.bundleSize > config.thresholds.bundleSize) {
    score -= 20
  } else if (metrics.bundleSize > config.thresholds.bundleSize * 0.8) {
    score -= 10
  }

  // Penalizar por build time
  if (metrics.buildTime > config.thresholds.buildTime) {
    score -= 15
  } else if (metrics.buildTime > config.thresholds.buildTime * 0.8) {
    score -= 8
  }

  // Penalizar por First Load JS
  if (metrics.firstLoadJS > config.thresholds.firstLoadJS) {
    score -= 15
  } else if (metrics.firstLoadJS > config.thresholds.firstLoadJS * 0.8) {
    score -= 8
  }

  // Penalizar por alertas
  metrics.alerts.forEach(alert => {
    switch (alert.severity) {
      case 'critical':
        score -= 25
        break
      case 'high':
        score -= 15
        break
      case 'medium':
        score -= 10
        break
      case 'low':
        score -= 5
        break
    }
  })

  metrics.score = Math.max(score, 0)

  console.log(`📈 Performance Score: ${metrics.score}/100`)
}

/**
 * Genera reporte de performance
 */
function generateReport() {
  console.log('\n📊 Generando reporte de performance...')

  // Crear directorio de reportes
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true })
  }

  // Generar reporte JSON
  const jsonReport = {
    ...metrics,
    thresholds: config.thresholds,
    recommendations: generateRecommendations(),
  }

  const jsonPath = path.join(config.outputDir, `performance-${Date.now()}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2))

  // Generar reporte Markdown
  const markdownReport = generateMarkdownReport(jsonReport)
  const mdPath = path.join(config.outputDir, 'latest-performance-report.md')
  fs.writeFileSync(mdPath, markdownReport)

  console.log(`📄 Reporte JSON: ${jsonPath}`)
  console.log(`📝 Reporte Markdown: ${mdPath}`)
}

/**
 * Genera recomendaciones basadas en métricas
 */
function generateRecommendations() {
  const recommendations = []

  if (metrics.bundleSize > config.thresholds.bundleSize * 0.8) {
    recommendations.push({
      type: 'bundle-optimization',
      priority: 'high',
      message: 'Considerar implementar lazy loading y code splitting adicional',
    })
  }

  if (metrics.buildTime > config.thresholds.buildTime * 0.8) {
    recommendations.push({
      type: 'build-optimization',
      priority: 'medium',
      message: 'Optimizar configuración de build y dependencias',
    })
  }

  if (metrics.alerts.length > 0) {
    recommendations.push({
      type: 'alerts-resolution',
      priority: 'high',
      message: `Resolver ${metrics.alerts.length} alertas de performance`,
    })
  }

  return recommendations
}

/**
 * Genera reporte en formato Markdown
 */
function generateMarkdownReport(data) {
  return `# 📊 Performance Report

**Fecha**: ${new Date(data.timestamp).toLocaleString()}
**Score**: ${data.score}/100

## 📋 Métricas

| Métrica | Valor | Threshold | Estado |
|---------|-------|-----------|--------|
| Bundle Size | ${formatBytes(data.bundleSize)} | ${formatBytes(data.thresholds.bundleSize)} | ${data.bundleSize <= data.thresholds.bundleSize ? '✅' : '❌'} |
| First Load JS | ${formatBytes(data.firstLoadJS)} | ${formatBytes(data.thresholds.firstLoadJS)} | ${data.firstLoadJS <= data.thresholds.firstLoadJS ? '✅' : '❌'} |
| Build Time | ${data.buildTime}ms | ${data.thresholds.buildTime}ms | ${data.buildTime <= data.thresholds.buildTime ? '✅' : '❌'} |
| Vendor Chunk | ${formatBytes(data.vendorChunk)} | ${formatBytes(data.thresholds.vendorChunk)} | ${data.vendorChunk <= data.thresholds.vendorChunk ? '✅' : '❌'} |

## 🚨 Alertas

${data.alerts.length === 0 ? 'No hay alertas' : data.alerts.map(alert => `- **${alert.type}**: ${alert.message}`).join('\n')}

## 💡 Recomendaciones

${data.recommendations.map(rec => `- **${rec.type}** (${rec.priority}): ${rec.message}`).join('\n')}
`
}

/**
 * Formatea bytes a formato legible
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Función principal
 */
function main() {
  console.log('🚀 Iniciando análisis de performance...\n')

  // Ejecutar análisis
  measureBuildTime()
  analyzeBundleSize()
  analyzePages()
  calculatePerformanceScore()
  generateReport()

  // Mostrar resumen
  console.log('\n📊 RESUMEN DE PERFORMANCE')
  console.log('='.repeat(50))
  console.log(`📦 Bundle Size: ${formatBytes(metrics.bundleSize)}`)
  console.log(`⚡ First Load JS: ${formatBytes(metrics.firstLoadJS)}`)
  console.log(`⏱️  Build Time: ${metrics.buildTime}ms`)
  console.log(`📄 Páginas: ${metrics.pageCount}`)
  console.log(`🚨 Alertas: ${metrics.alerts.length}`)
  console.log(`📈 Score: ${metrics.score}/100`)

  if (metrics.score >= 90) {
    console.log('\n🎉 ¡Excelente performance!')
  } else if (metrics.score >= 70) {
    console.log('\n👍 Performance bueno, con margen de mejora.')
  } else {
    console.log('\n⚠️  Performance necesita optimización.')
  }

  console.log('\n✅ Análisis completado!')
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = {
  measureBuildTime,
  analyzeBundleSize,
  calculatePerformanceScore,
  generateReport,
}
