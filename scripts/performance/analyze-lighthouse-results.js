/**
 * Script para analizar resultados de Lighthouse
 * Muestra métricas clave de rendimiento de forma resumida
 */

const fs = require('fs')
const path = require('path')

const reportPath = path.join(process.cwd(), 'lighthouse-report.json')

if (!fs.existsSync(reportPath)) {
  console.error('❌ No se encontró lighthouse-report.json')
  console.log('💡 Ejecuta: npm run lighthouse:json')
  process.exit(1)
}

try {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  const categories = report.categories || {}
  const audits = report.audits || {}
  
  console.log('\n📊 RESULTADOS DE LIGHTHOUSE\n')
  console.log('='.repeat(60))
  
  // Mostrar scores de categorías
  console.log('\n📈 SCORES POR CATEGORÍA:\n')
  Object.entries(categories).forEach(([key, category]) => {
    const score = Math.round((category.score || 0) * 100)
    const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴'
    console.log(`${emoji} ${category.title}: ${score}/100`)
  })
  
  // Mostrar Core Web Vitals
  console.log('\n⚡ CORE WEB VITALS:\n')
  const lcp = audits['largest-contentful-paint']
  const fcp = audits['first-contentful-paint']
  const cls = audits['cumulative-layout-shift']
  const tbt = audits['total-blocking-time']
  const si = audits['speed-index']
  
  if (lcp) {
    const value = lcp.numericValue
    const score = Math.round((lcp.score || 0) * 100)
    const emoji = value <= 2500 ? '🟢' : value <= 4000 ? '🟡' : '🔴'
    console.log(`${emoji} LCP: ${(value / 1000).toFixed(2)}s (Score: ${score}/100)`)
  }
  
  if (fcp) {
    const value = fcp.numericValue
    const score = Math.round((fcp.score || 0) * 100)
    const emoji = value <= 1800 ? '🟢' : value <= 3000 ? '🟡' : '🔴'
    console.log(`${emoji} FCP: ${(value / 1000).toFixed(2)}s (Score: ${score}/100)`)
  }
  
  if (cls) {
    const value = cls.numericValue
    const score = Math.round((cls.score || 0) * 100)
    const emoji = value <= 0.1 ? '🟢' : value <= 0.25 ? '🟡' : '🔴'
    console.log(`${emoji} CLS: ${value.toFixed(3)} (Score: ${score}/100)`)
  }
  
  if (tbt) {
    const value = tbt.numericValue
    const score = Math.round((tbt.score || 0) * 100)
    const emoji = value <= 200 ? '🟢' : value <= 600 ? '🟡' : '🔴'
    console.log(`${emoji} TBT: ${value}ms (Score: ${score}/100)`)
  }
  
  if (si) {
    const value = si.numericValue
    const score = Math.round((si.score || 0) * 100)
    const emoji = value <= 3400 ? '🟢' : value <= 5800 ? '🟡' : '🔴'
    console.log(`${emoji} SI: ${(value / 1000).toFixed(2)}s (Score: ${score}/100)`)
  }
  
  // Mostrar oportunidades principales
  console.log('\n🎯 OPORTUNIDADES PRINCIPALES:\n')
  const opportunities = Object.values(audits)
    .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.numericValue)
    .sort((a, b) => b.numericValue - a.numericValue)
    .slice(0, 5)
  
  opportunities.forEach((audit, index) => {
    const savings = audit.numericValue
    const savingsDisplay = savings >= 1000 
      ? `${(savings / 1000).toFixed(1)}s` 
      : `${Math.round(savings)}ms`
    console.log(`${index + 1}. ${audit.title}: ${savingsDisplay} de ahorro`)
  })
  
  // Mostrar problemas críticos
  console.log('\n🚨 PROBLEMAS CRÍTICOS:\n')
  const criticalIssues = Object.values(audits)
    .filter(audit => audit.score !== null && audit.score < 0.5 && audit.details)
    .slice(0, 5)
  
  if (criticalIssues.length === 0) {
    console.log('✅ No se encontraron problemas críticos')
  } else {
    criticalIssues.forEach((audit, index) => {
      const score = Math.round((audit.score || 0) * 100)
      console.log(`${index + 1}. ${audit.title} (Score: ${score}/100)`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n💡 Para ver el reporte completo, abre lighthouse-report.json\n')
  
} catch (error) {
  console.error('❌ Error al analizar el reporte:', error.message)
  process.exit(1)
}

