#!/usr/bin/env node

/**
 * Script para ejecutar tests de performance con Lighthouse
 * Pinteya E-commerce Design System
 */

const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs')
const path = require('path')

const STORYBOOK_URL = 'http://localhost:6006'
const REPORTS_DIR = 'lighthouse-reports'

// Configuración de Lighthouse optimizada para Storybook
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'mobile',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      disabled: false,
    },
    emulatedUserAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
  },
}

// URLs de stories importantes para testear
const CRITICAL_STORIES = [
  '/story/design-system-overview--default',
  '/story/components-button--all-variants',
  '/story/components-productcard--default',
  '/story/components-modal--default',
  '/story/ecommerce-examples--product-catalog',
  '/story/ecommerce-examples--checkout-flow',
]

async function runLighthouseTests() {
  console.log('🚀 Iniciando tests de performance con Lighthouse...\n')

  // Crear directorio de reportes
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true })
  }

  // Lanzar Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
  })

  const results = []

  try {
    for (const story of CRITICAL_STORIES) {
      const url = `${STORYBOOK_URL}${story}`
      console.log(`📊 Analizando: ${story}`)

      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        ...lighthouseConfig,
      })

      // Extraer métricas importantes
      const { lhr } = runnerResult
      const metrics = {
        story,
        url,
        performance: lhr.categories.performance.score * 100,
        accessibility: lhr.categories.accessibility.score * 100,
        bestPractices: lhr.categories['best-practices'].score * 100,
        seo: lhr.categories.seo.score * 100,
        fcp: lhr.audits['first-contentful-paint'].numericValue,
        lcp: lhr.audits['largest-contentful-paint'].numericValue,
        cls: lhr.audits['cumulative-layout-shift'].numericValue,
        fid: lhr.audits['max-potential-fid'] ? lhr.audits['max-potential-fid'].numericValue : 0,
        timestamp: new Date().toISOString(),
      }

      results.push(metrics)

      // Guardar reporte HTML individual
      const reportPath = path.join(REPORTS_DIR, `${story.replace(/[^a-zA-Z0-9]/g, '-')}.html`)
      fs.writeFileSync(reportPath, runnerResult.report)

      console.log(`  ✅ Performance: ${metrics.performance.toFixed(1)}/100`)
      console.log(`  ♿ Accessibility: ${metrics.accessibility.toFixed(1)}/100`)
      console.log(`  📈 FCP: ${(metrics.fcp / 1000).toFixed(2)}s`)
      console.log(`  📊 LCP: ${(metrics.lcp / 1000).toFixed(2)}s\n`)
    }

    // Generar reporte consolidado
    await generateConsolidatedReport(results)
  } catch (error) {
    console.error('❌ Error ejecutando Lighthouse:', error)
  } finally {
    await chrome.kill()
  }
}

async function generateConsolidatedReport(results) {
  console.log('📋 Generando reporte consolidado...\n')

  // Calcular promedios
  const averages = {
    performance: results.reduce((sum, r) => sum + r.performance, 0) / results.length,
    accessibility: results.reduce((sum, r) => sum + r.accessibility, 0) / results.length,
    bestPractices: results.reduce((sum, r) => sum + r.bestPractices, 0) / results.length,
    seo: results.reduce((sum, r) => sum + r.seo, 0) / results.length,
    fcp: results.reduce((sum, r) => sum + r.fcp, 0) / results.length,
    lcp: results.reduce((sum, r) => sum + r.lcp, 0) / results.length,
    cls: results.reduce((sum, r) => sum + r.cls, 0) / results.length,
  }

  // Generar reporte JSON
  const report = {
    summary: {
      totalStories: results.length,
      averages,
      timestamp: new Date().toISOString(),
      thresholds: {
        performance: { good: 90, needs_improvement: 50 },
        accessibility: { good: 95, needs_improvement: 80 },
        fcp: { good: 1800, needs_improvement: 3000 },
        lcp: { good: 2500, needs_improvement: 4000 },
        cls: { good: 0.1, needs_improvement: 0.25 },
      },
    },
    results,
  }

  // Guardar reporte JSON
  const jsonReportPath = path.join(REPORTS_DIR, 'lighthouse-summary.json')
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2))

  // Generar reporte Markdown
  const markdownReport = generateMarkdownReport(report)
  const mdReportPath = path.join(REPORTS_DIR, 'lighthouse-summary.md')
  fs.writeFileSync(mdReportPath, markdownReport)

  console.log('📊 Resumen de Performance:')
  console.log(`  🎯 Performance promedio: ${averages.performance.toFixed(1)}/100`)
  console.log(`  ♿ Accessibility promedio: ${averages.accessibility.toFixed(1)}/100`)
  console.log(`  ⚡ FCP promedio: ${(averages.fcp / 1000).toFixed(2)}s`)
  console.log(`  📊 LCP promedio: ${(averages.lcp / 1000).toFixed(2)}s`)
  console.log(`  📐 CLS promedio: ${averages.cls.toFixed(3)}`)
  console.log(`\n📁 Reportes guardados en: ${REPORTS_DIR}/`)
}

function generateMarkdownReport(report) {
  const { summary, results } = report

  return `# 📊 Lighthouse Performance Report
## Pinteya E-commerce Design System

**Fecha:** ${new Date(summary.timestamp).toLocaleString()}  
**Stories analizadas:** ${summary.totalStories}

## 🎯 Resumen General

| Métrica | Promedio | Estado |
|---------|----------|--------|
| Performance | ${summary.averages.performance.toFixed(1)}/100 | ${getStatus(summary.averages.performance, summary.thresholds.performance)} |
| Accessibility | ${summary.averages.accessibility.toFixed(1)}/100 | ${getStatus(summary.averages.accessibility, summary.thresholds.accessibility)} |
| Best Practices | ${summary.averages.bestPractices.toFixed(1)}/100 | - |
| SEO | ${summary.averages.seo.toFixed(1)}/100 | - |

## ⚡ Core Web Vitals

| Métrica | Valor | Estado |
|---------|-------|--------|
| First Contentful Paint (FCP) | ${(summary.averages.fcp / 1000).toFixed(2)}s | ${getStatus(summary.averages.fcp, summary.thresholds.fcp, true)} |
| Largest Contentful Paint (LCP) | ${(summary.averages.lcp / 1000).toFixed(2)}s | ${getStatus(summary.averages.lcp, summary.thresholds.lcp, true)} |
| Cumulative Layout Shift (CLS) | ${summary.averages.cls.toFixed(3)} | ${getStatus(summary.averages.cls, summary.thresholds.cls, true)} |

## 📋 Resultados Detallados

${results
  .map(
    result => `
### ${result.story}

- **Performance:** ${result.performance.toFixed(1)}/100
- **Accessibility:** ${result.accessibility.toFixed(1)}/100
- **FCP:** ${(result.fcp / 1000).toFixed(2)}s
- **LCP:** ${(result.lcp / 1000).toFixed(2)}s
- **CLS:** ${result.cls.toFixed(3)}
`
  )
  .join('\n')}

## 🎯 Recomendaciones

${generateRecommendations(summary)}
`
}

function getStatus(value, threshold, isLowerBetter = false) {
  if (isLowerBetter) {
    if (value <= threshold.good) return '🟢 Excelente'
    if (value <= threshold.needs_improvement) return '🟡 Necesita mejora'
    return '🔴 Pobre'
  } else {
    if (value >= threshold.good) return '🟢 Excelente'
    if (value >= threshold.needs_improvement) return '🟡 Necesita mejora'
    return '🔴 Pobre'
  }
}

function generateRecommendations(summary) {
  const recommendations = []

  if (summary.averages.performance < 90) {
    recommendations.push(
      '- 🎯 **Performance**: Optimizar imágenes, implementar lazy loading, reducir bundle size'
    )
  }

  if (summary.averages.accessibility < 95) {
    recommendations.push(
      '- ♿ **Accessibility**: Mejorar contraste de colores, agregar aria-labels, optimizar navegación por teclado'
    )
  }

  if (summary.averages.fcp > 1800) {
    recommendations.push(
      '- ⚡ **FCP**: Optimizar critical CSS, implementar preload de recursos importantes'
    )
  }

  if (summary.averages.lcp > 2500) {
    recommendations.push(
      '- 📊 **LCP**: Optimizar imágenes hero, implementar CDN, mejorar server response time'
    )
  }

  if (summary.averages.cls > 0.1) {
    recommendations.push(
      '- 📐 **CLS**: Definir dimensiones de imágenes, evitar inserción dinámica de contenido'
    )
  }

  return recommendations.length > 0
    ? recommendations.join('\n')
    : '🎉 ¡Todas las métricas están en excelente estado!'
}

// Verificar si Storybook está corriendo
async function checkStorybookRunning() {
  try {
    const response = await fetch(STORYBOOK_URL)
    return response.ok
  } catch (error) {
    return false
  }
}

// Ejecutar tests
async function main() {
  const isStorybookRunning = await checkStorybookRunning()

  if (!isStorybookRunning) {
    console.log('❌ Storybook no está corriendo en http://localhost:6006')
    console.log('🚀 Ejecuta: npm run storybook')
    process.exit(1)
  }

  await runLighthouseTests()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { runLighthouseTests }
