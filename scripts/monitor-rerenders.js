/**
 * Script para monitorear rerenders en la aplicación
 * 
 * Este script puede ejecutarse mientras la aplicación está corriendo
 * para capturar y analizar rerenders en tiempo real.
 * 
 * Uso:
 * 1. Iniciar la aplicación: npm run dev
 * 2. En otra terminal: node scripts/monitor-rerenders.js
 * 3. Abrir http://localhost:3000 en el navegador
 * 4. Los logs de rerenders se mostrarán en la consola
 */

const puppeteer = require('puppeteer')

async function monitorRerenders() {
  console.log('🔍 Iniciando monitoreo de rerenders...\n')
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  })
  
  const page = await browser.newPage()
  
  const rerenderLogs = []
  const domChanges = []
  
  // Capturar console logs
  page.on('console', msg => {
    const text = msg.text()
    const timestamp = Date.now()
    
    if (
      text.includes('re-render') ||
      text.includes('rerender') ||
      text.includes('🔄') ||
      text.includes('RENDER') ||
      (text.includes('render') && !text.includes('rendering'))
    ) {
      rerenderLogs.push({
        timestamp,
        message: text,
      })
      console.log(`[RERENDER] ${text}`)
    }
  })
  
  // Monitorear cambios en el DOM
  await page.evaluateOnNewDocument(() => {
    const observer = new MutationObserver(mutations => {
      const timestamp = Date.now()
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const addedElements = Array.from(mutation.addedNodes).filter(
            node => node.nodeType === 1
          )
          
          if (addedElements.length > 0) {
            window.__domChanges = window.__domChanges || []
            window.__domChanges.push({
              timestamp,
              type: 'added',
              count: addedElements.length,
            })
          }
        }
      })
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    })
    
    window.__domChanges = []
  })
  
  // Navegar a la página
  console.log('📱 Navegando a http://localhost:3000...\n')
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  
  console.log('⏳ Esperando 5 segundos para capturar rerenders iniciales...\n')
  await page.waitForTimeout(5000)
  
  // Obtener cambios del DOM
  const domChangesFromBrowser = await page.evaluate(() => {
    return window.__domChanges || []
  })
  
  // Analizar resultados
  console.log('\n📊 ANÁLISIS DE RERENDERS:')
  console.log(`Total de rerenders detectados: ${rerenderLogs.length}`)
  console.log(`Cambios en DOM: ${domChangesFromBrowser.length}`)
  
  // Agrupar por componente
  const rerendersByComponent = {}
  rerenderLogs.forEach(log => {
    const component = extractComponentName(log.message) || 'Unknown'
    rerendersByComponent[component] = (rerendersByComponent[component] || 0) + 1
  })
  
  console.log('\n📋 Rerenders por componente:')
  Object.entries(rerendersByComponent)
    .sort(([, a], [, b]) => b - a)
    .forEach(([component, count]) => {
      console.log(`  ${component}: ${count} rerenders`)
    })
  
  // Analizar frecuencia
  if (rerenderLogs.length > 0) {
    const timeSpan = rerenderLogs[rerenderLogs.length - 1].timestamp - rerenderLogs[0].timestamp
    const rerendersPerSecond = (rerenderLogs.length / (timeSpan / 1000)).toFixed(2)
    console.log(`\n⚡ Frecuencia: ${rerendersPerSecond} rerenders/segundo`)
  }
  
  // Detectar patrones problemáticos
  const problematicPatterns = []
  
  if (rerenderLogs.length > 20) {
    problematicPatterns.push(`Excesivos rerenders: ${rerenderLogs.length} detectados`)
  }
  
  if (rerendersByComponent['Header'] > 5) {
    problematicPatterns.push(`Header se rerenderiza ${rerendersByComponent['Header']} veces`)
  }
  
  if (problematicPatterns.length > 0) {
    console.log('\n⚠️ PATRONES PROBLEMÁTICOS DETECTADOS:')
    problematicPatterns.forEach(pattern => console.log(`  - ${pattern}`))
  }
  
  console.log('\n✅ Monitoreo completado. Presiona Ctrl+C para salir.')
  console.log('💡 Tip: Abre React DevTools Profiler para análisis más detallado\n')
  
  // Mantener el navegador abierto
  // await browser.close()
}

function extractComponentName(text) {
  const patterns = [
    /\[([^\]]+)\]/,
    /🔄\s*([^\s]+)/,
    /re-render.*?([A-Z][a-zA-Z]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

// Ejecutar
monitorRerenders().catch(console.error)

