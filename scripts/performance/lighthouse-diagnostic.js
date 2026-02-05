#!/usr/bin/env node

/**
 * Script de diagnóstico de performance con Lighthouse
 * Genera reportes completos y análisis detallado
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const REPORTS_DIR = 'lighthouse-reports'
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-')

// URLs a analizar
const URLS = {
  production: 'https://www.pintemas.com',
  local: 'http://localhost:3000',
}

// Configuración de Lighthouse
const LIGHTHOUSE_CONFIG = {
  mobile: {
    throttling: {
      cpuSlowdownMultiplier: 4,
      rttMs: 150,
      throughputKbps: 1600,
    },
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 915,
    },
  },
  desktop: {
    throttling: {
      cpuSlowdownMultiplier: 1,
      rttMs: 40,
      throughputKbps: 10240,
    },
  },
}

function buildLighthouseCommand(url, device = 'mobile', outputPath) {
  const config = LIGHTHOUSE_CONFIG[device]
  const baseCommand = `lighthouse "${url}" --output=json --output-path="${outputPath}" --throttling-method=simulate`
  
  let command = baseCommand
  
  if (device === 'mobile') {
    command += ` --throttling.cpuSlowdownMultiplier=${config.throttling.cpuSlowdownMultiplier}`
    command += ` --throttling.rttMs=${config.throttling.rttMs}`
    command += ` --throttling.throughputKbps=${config.throttling.throughputKbps}`
    command += ` --screenEmulation.mobile=true`
    command += ` --screenEmulation.width=${config.screenEmulation.width}`
    command += ` --screenEmulation.height=${config.screenEmulation.height}`
  } else {
    command += ` --throttling.cpuSlowdownMultiplier=${config.throttling.cpuSlowdownMultiplier}`
    command += ` --throttling.rttMs=${config.throttling.rttMs}`
    command += ` --throttling.throughputKbps=${config.throttling.throughputKbps}`
  }
  
  return command
}

function checkUrlAvailability(url) {
  try {
    const http = require('http')
    const https = require('https')
    const client = url.startsWith('https') ? https : http
    
    return new Promise((resolve) => {
      const req = client.get(url, (res) => {
        resolve(res.statusCode === 200)
      })
      req.on('error', () => resolve(false))
      req.setTimeout(5000, () => {
        req.destroy()
        resolve(false)
      })
    })
  } catch (error) {
    return false
  }
}

async function runLighthouseDiagnostic() {
  console.log('🚀 Iniciando diagnóstico de performance con Lighthouse...\n')
  
  // Crear directorio de reportes
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true })
  }
  
  // Determinar URL a usar
  let targetUrl = URLS.production
  let environment = 'production'
  
  console.log('🔍 Verificando disponibilidad de URLs...')
  const isLocalAvailable = await checkUrlAvailability(URLS.local)
  const isProductionAvailable = await checkUrlAvailability(URLS.production)
  
  if (isLocalAvailable) {
    console.log(`✅ Local disponible: ${URLS.local}`)
    const useLocal = process.argv.includes('--local') || process.argv.includes('-l')
    if (useLocal) {
      targetUrl = URLS.local
      environment = 'local'
      console.log('📌 Usando URL local (--local especificado)\n')
    }
  } else {
    console.log(`❌ Local no disponible: ${URLS.local}`)
  }
  
  if (isProductionAvailable) {
    console.log(`✅ Producción disponible: ${URLS.production}`)
  } else {
    console.log(`⚠️  Producción no disponible: ${URLS.production}`)
  }
  
  if (!isLocalAvailable && !isProductionAvailable) {
    console.error('❌ Ninguna URL está disponible. Asegúrate de que la aplicación esté corriendo.')
    process.exit(1)
  }
  
  if (!isLocalAvailable && process.argv.includes('--local')) {
    console.error('❌ URL local no disponible pero --local fue especificado.')
    process.exit(1)
  }
  
  if (!isProductionAvailable && !process.argv.includes('--local')) {
    console.log('⚠️  Producción no disponible, intentando con local...')
    if (isLocalAvailable) {
      targetUrl = URLS.local
      environment = 'local'
    } else {
      console.error('❌ Ninguna URL está disponible.')
      process.exit(1)
    }
  }
  
  console.log(`\n🎯 Analizando: ${targetUrl} (${environment})\n`)
  
  const results = {}
  
  // Ejecutar Lighthouse para móvil
  console.log('📱 Ejecutando Lighthouse (Móvil)...')
  const mobileOutputPath = path.join(REPORTS_DIR, `lighthouse-mobile-${TIMESTAMP}.json`)
  try {
    const mobileCommand = buildLighthouseCommand(targetUrl, 'mobile', mobileOutputPath)
    console.log(`   Comando: ${mobileCommand.substring(0, 100)}...`)
    execSync(mobileCommand, { stdio: 'inherit' })
    results.mobile = mobileOutputPath
    console.log('   ✅ Completado\n')
  } catch (error) {
    console.error('   ❌ Error:', error.message)
    results.mobile = null
  }
  
  // Ejecutar Lighthouse para desktop
  console.log('🖥️  Ejecutando Lighthouse (Desktop)...')
  const desktopOutputPath = path.join(REPORTS_DIR, `lighthouse-desktop-${TIMESTAMP}.json`)
  try {
    const desktopCommand = buildLighthouseCommand(targetUrl, 'desktop', desktopOutputPath)
    console.log(`   Comando: ${desktopCommand.substring(0, 100)}...`)
    execSync(desktopCommand, { stdio: 'inherit' })
    results.desktop = desktopOutputPath
    console.log('   ✅ Completado\n')
  } catch (error) {
    console.error('   ❌ Error:', error.message)
    results.desktop = null
  }
  
  // Analizar resultados
  console.log('📊 Analizando resultados...\n')
  const analysis = {}
  
  if (results.mobile && fs.existsSync(results.mobile)) {
    analysis.mobile = analyzeReport(results.mobile, 'Móvil')
  }
  
  if (results.desktop && fs.existsSync(results.desktop)) {
    analysis.desktop = analyzeReport(results.desktop, 'Desktop')
  }
  
  // Generar reporte consolidado
  generateConsolidatedReport(analysis, targetUrl, environment, TIMESTAMP)
  
  // Ejecutar script de análisis si existe
  if (fs.existsSync('scripts/performance/analyze-lighthouse-results.js')) {
    console.log('\n📋 Ejecutando análisis detallado...\n')
    try {
      // Copiar el último reporte móvil como lighthouse-report.json para el script de análisis
      if (results.mobile && fs.existsSync(results.mobile)) {
        fs.copyFileSync(results.mobile, 'lighthouse-report.json')
        execSync('node scripts/performance/analyze-lighthouse-results.js', { stdio: 'inherit' })
      }
    } catch (error) {
      console.error('⚠️  Error ejecutando análisis detallado:', error.message)
    }
  }
  
  console.log('\n✅ Diagnóstico completado!')
  console.log(`📁 Reportes guardados en: ${REPORTS_DIR}/`)
}

function analyzeReport(reportPath, deviceName) {
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
    const categories = report.categories || {}
    const audits = report.audits || {}
    
    const analysis = {
      device: deviceName,
      timestamp: report.fetchTime,
      url: report.finalUrl,
      categories: {},
      coreWebVitals: {},
      opportunities: [],
      issues: [],
    }
    
    // Categorías
    Object.entries(categories).forEach(([key, category]) => {
      analysis.categories[key] = {
        title: category.title,
        score: Math.round((category.score || 0) * 100),
        id: category.id,
      }
    })
    
    // Core Web Vitals
    const lcp = audits['largest-contentful-paint']
    const fcp = audits['first-contentful-paint']
    const cls = audits['cumulative-layout-shift']
    const tbt = audits['total-blocking-time']
    const si = audits['speed-index']
    const tti = audits['interactive']
    
    if (lcp) {
      analysis.coreWebVitals.lcp = {
        value: lcp.numericValue,
        displayValue: lcp.displayValue,
        score: Math.round((lcp.score || 0) * 100),
        status: getStatus(lcp.numericValue, 2500, true),
      }
    }
    
    if (fcp) {
      analysis.coreWebVitals.fcp = {
        value: fcp.numericValue,
        displayValue: fcp.displayValue,
        score: Math.round((fcp.score || 0) * 100),
        status: getStatus(fcp.numericValue, 1800, true),
      }
    }
    
    if (cls) {
      analysis.coreWebVitals.cls = {
        value: cls.numericValue,
        displayValue: cls.displayValue,
        score: Math.round((cls.score || 0) * 100),
        status: getStatus(cls.numericValue, 0.1, true),
      }
    }
    
    if (tbt) {
      analysis.coreWebVitals.tbt = {
        value: tbt.numericValue,
        displayValue: tbt.displayValue,
        score: Math.round((tbt.score || 0) * 100),
        status: getStatus(tbt.numericValue, 200, true),
      }
    }
    
    if (si) {
      analysis.coreWebVitals.si = {
        value: si.numericValue,
        displayValue: si.displayValue,
        score: Math.round((si.score || 0) * 100),
        status: getStatus(si.numericValue, 3400, true),
      }
    }
    
    if (tti) {
      analysis.coreWebVitals.tti = {
        value: tti.numericValue,
        displayValue: tti.displayValue,
        score: Math.round((tti.score || 0) * 100),
      }
    }
    
    // Oportunidades (top 10)
    analysis.opportunities = Object.values(audits)
      .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.numericValue)
      .sort((a, b) => b.numericValue - a.numericValue)
      .slice(0, 10)
      .map(audit => ({
        title: audit.title,
        description: audit.description,
        savings: audit.numericValue,
        savingsDisplay: audit.numericValue >= 1000 
          ? `${(audit.numericValue / 1000).toFixed(1)}s` 
          : `${Math.round(audit.numericValue)}ms`,
        score: audit.score ? Math.round(audit.score * 100) : null,
        id: audit.id,
      }))
    
    // Problemas críticos
    analysis.issues = Object.values(audits)
      .filter(audit => audit.score !== null && audit.score < 0.5 && audit.details)
      .slice(0, 10)
      .map(audit => ({
        title: audit.title,
        description: audit.description,
        score: Math.round((audit.score || 0) * 100),
        id: audit.id,
      }))
    
    return analysis
  } catch (error) {
    console.error(`Error analizando reporte ${reportPath}:`, error.message)
    return null
  }
}

function getStatus(value, threshold, isLowerBetter = false) {
  if (isLowerBetter) {
    if (value <= threshold) return 'good'
    if (value <= threshold * 1.6) return 'needs-improvement'
    return 'poor'
  } else {
    const percentage = (value / threshold) * 100
    if (percentage >= 90) return 'good'
    if (percentage >= 50) return 'needs-improvement'
    return 'poor'
  }
}

function generateConsolidatedReport(analysis, url, environment, timestamp) {
  const reportPath = path.join(REPORTS_DIR, `diagnostic-report-${timestamp}.md`)
  
  let markdown = `# 📊 Diagnóstico de Performance - Lighthouse\n\n`
  markdown += `**Fecha:** ${new Date().toLocaleString('es-ES')}\n`
  markdown += `**URL:** ${url}\n`
  markdown += `**Ambiente:** ${environment}\n\n`
  markdown += `---\n\n`
  
  Object.entries(analysis).forEach(([device, data]) => {
    if (!data) return
    
    markdown += `## ${data.device}\n\n`
    
    // Categorías
    markdown += `### 📈 Scores por Categoría\n\n`
    markdown += `| Categoría | Score | Estado |\n`
    markdown += `|-----------|-------|--------|\n`
    
    Object.entries(data.categories).forEach(([key, cat]) => {
      const emoji = cat.score >= 90 ? '🟢' : cat.score >= 50 ? '🟡' : '🔴'
      markdown += `| ${cat.title} | ${cat.score}/100 | ${emoji} |\n`
    })
    
    markdown += `\n### ⚡ Core Web Vitals\n\n`
    markdown += `| Métrica | Valor | Score | Estado |\n`
    markdown += `|---------|-------|-------|--------|\n`
    
    Object.entries(data.coreWebVitals).forEach(([key, metric]) => {
      const emoji = metric.status === 'good' ? '🟢' : metric.status === 'needs-improvement' ? '🟡' : '🔴'
      markdown += `| ${key.toUpperCase()} | ${metric.displayValue} | ${metric.score}/100 | ${emoji} ${metric.status} |\n`
    })
    
    // Oportunidades
    if (data.opportunities.length > 0) {
      markdown += `\n### 🎯 Oportunidades de Mejora (Top 10)\n\n`
      data.opportunities.forEach((opp, index) => {
        markdown += `${index + 1}. **${opp.title}** - Ahorro potencial: ${opp.savingsDisplay}\n`
        if (opp.description) {
          markdown += `   ${opp.description.substring(0, 150)}...\n\n`
        }
      })
    }
    
    // Problemas críticos
    if (data.issues.length > 0) {
      markdown += `\n### 🚨 Problemas Críticos\n\n`
      data.issues.forEach((issue, index) => {
        markdown += `${index + 1}. **${issue.title}** (Score: ${issue.score}/100)\n`
        if (issue.description) {
          markdown += `   ${issue.description.substring(0, 150)}...\n\n`
        }
      })
    } else {
      markdown += `\n### ✅ Sin Problemas Críticos\n\n`
    }
    
    markdown += `\n---\n\n`
  })
  
  // Resumen comparativo
  if (analysis.mobile && analysis.desktop) {
    markdown += `## 📊 Comparativa Móvil vs Desktop\n\n`
    markdown += `| Métrica | Móvil | Desktop |\n`
    markdown += `|---------|-------|---------|\n`
    
    const mobilePerf = analysis.mobile.categories.performance?.score || 0
    const desktopPerf = analysis.desktop.categories.performance?.score || 0
    markdown += `| Performance | ${mobilePerf}/100 | ${desktopPerf}/100 |\n`
    
    const mobileLCP = analysis.mobile.coreWebVitals.lcp?.displayValue || 'N/A'
    const desktopLCP = analysis.desktop.coreWebVitals.lcp?.displayValue || 'N/A'
    markdown += `| LCP | ${mobileLCP} | ${desktopLCP} |\n`
    
    const mobileFCP = analysis.mobile.coreWebVitals.fcp?.displayValue || 'N/A'
    const desktopFCP = analysis.desktop.coreWebVitals.fcp?.displayValue || 'N/A'
    markdown += `| FCP | ${mobileFCP} | ${desktopFCP} |\n`
  }
  
  // Recomendaciones
  markdown += `\n## 💡 Recomendaciones\n\n`
  
  const allIssues = []
  if (analysis.mobile) allIssues.push(...analysis.mobile.issues)
  if (analysis.desktop) allIssues.push(...analysis.desktop.issues)
  
  const allOpportunities = []
  if (analysis.mobile) allOpportunities.push(...analysis.mobile.opportunities)
  if (analysis.desktop) allOpportunities.push(...analysis.desktop.opportunities)
  
  if (allIssues.length > 0 || allOpportunities.length > 0) {
    markdown += `### Prioridad Alta\n\n`
    
    // Agrupar oportunidades por tipo
    const imageOpps = allOpportunities.filter(o => 
      o.id.includes('image') || o.title.toLowerCase().includes('image')
    )
    const jsOpps = allOpportunities.filter(o => 
      o.id.includes('javascript') || o.id.includes('unused') || o.title.toLowerCase().includes('javascript')
    )
    const cssOpps = allOpportunities.filter(o => 
      o.id.includes('css') || o.id.includes('render-blocking') || o.title.toLowerCase().includes('css')
    )
    
    if (imageOpps.length > 0) {
      markdown += `- **Optimización de Imágenes**: ${imageOpps.length} oportunidades identificadas\n`
    }
    if (jsOpps.length > 0) {
      markdown += `- **Optimización de JavaScript**: ${jsOpps.length} oportunidades identificadas\n`
    }
    if (cssOpps.length > 0) {
      markdown += `- **Optimización de CSS**: ${cssOpps.length} oportunidades identificadas\n`
    }
  } else {
    markdown += `✅ **Excelente rendimiento!** No se identificaron problemas críticos.\n\n`
  }
  
  markdown += `\n---\n\n`
  markdown += `**Generado automáticamente por Lighthouse Diagnostic Script**\n`
  
  fs.writeFileSync(reportPath, markdown)
  console.log(`📄 Reporte consolidado generado: ${reportPath}`)
}

// Ejecutar diagnóstico
if (require.main === module) {
  runLighthouseDiagnostic().catch((error) => {
    console.error('❌ Error ejecutando diagnóstico:', error)
    process.exit(1)
  })
}

module.exports = { runLighthouseDiagnostic }
