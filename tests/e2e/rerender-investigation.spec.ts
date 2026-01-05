import { test, expect } from '@playwright/test'

/**
 * Test para investigar rerenders excesivos durante la carga de la aplicación
 * 
 * Este test:
 * 1. Captura todos los console.log relacionados con rerenders
 * 2. Monitorea cambios en el DOM
 * 3. Analiza qué componentes se están rerenderizando
 * 4. Identifica la causa raíz del problema
 */

// Función auxiliar para extraer el nombre del componente de un log
function extractComponentName(text: string): string {
  // Buscar patrones comunes en los logs
  const patterns = [
    /\[([^\]]+)\]/g, // [ComponentName]
    /🔄\s*([^\s]+)/g, // 🔄 ComponentName
    /re-render.*?([A-Z][a-zA-Z]+)/g, // re-render ComponentName
  ]

  for (const pattern of patterns) {
    const match = pattern.exec(text)
    if (match && match[1]) {
      return match[1]
    }
  }

  return 'Unknown'
}

test('Capturar y analizar rerenders durante la carga inicial', async ({ page }) => {
  // Array para almacenar todos los logs de rerenders
  const rerenderLogs: Array<{
    timestamp: number
    message: string
    component?: string
    props?: any
    stack?: string
  }> = []

  // Interceptar console.log para capturar rerenders
  page.on('console', msg => {
    const text = msg.text()
    const timestamp = Date.now()

    // Capturar logs relacionados con rerenders
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
        component: extractComponentName(text),
      })
    }
  })

  // Monitorear cambios en el DOM usando MutationObserver
  await page.addInitScript(() => {
    // Crear un observer para cambios en el DOM
    const observer = new MutationObserver(mutations => {
      const timestamp = Date.now()
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Solo registrar cambios significativos
          const addedElements = Array.from(mutation.addedNodes).filter(
            node => node.nodeType === 1
          ) as Element[]
          
          addedElements.forEach(element => {
            const componentName = element.getAttribute('data-component') ||
                                 element.className ||
                                 element.tagName
            
            window.__domChanges = window.__domChanges || []
            window.__domChanges.push({
              timestamp,
              type: 'added',
              selector: componentName,
              details: {
                tagName: element.tagName,
                className: element.className,
                id: element.id,
              },
            })
          })
        }
      })
    })

    // Observar cambios en el body
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    })

    // Inicializar array de cambios
    window.__domChanges = []
  })

  // Navegar a la página principal
  const startTime = Date.now()
  await page.goto('/', { waitUntil: 'networkidle' })
  const loadTime = Date.now() - startTime

  // Esperar a que la página se estabilice
  await page.waitForTimeout(3000)

  // Obtener cambios del DOM desde el navegador
  const domChangesFromBrowser = await page.evaluate(() => {
    return (window as any).__domChanges || []
  })

  // Analizar logs de rerenders
  console.log('\n📊 ANÁLISIS DE RERENDERS:')
  console.log(`Total de rerenders detectados: ${rerenderLogs.length}`)
  console.log(`Tiempo de carga: ${loadTime}ms`)
  console.log(`Cambios en DOM: ${domChangesFromBrowser.length}`)

  // Agrupar rerenders por componente
  const rerendersByComponent = rerenderLogs.reduce((acc, log) => {
    const component = log.component || 'Unknown'
    acc[component] = (acc[component] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\n📋 Rerenders por componente:')
  Object.entries(rerendersByComponent)
    .sort(([, a], [, b]) => b - a)
    .forEach(([component, count]) => {
      console.log(`  ${component}: ${count} rerenders`)
    })

  // Analizar frecuencia de rerenders
  if (rerenderLogs.length > 0) {
    const timeSpan = rerenderLogs[rerenderLogs.length - 1].timestamp - rerenderLogs[0].timestamp
    const rerendersPerSecond = (rerenderLogs.length / (timeSpan / 1000)).toFixed(2)
    console.log(`\n⚡ Frecuencia: ${rerendersPerSecond} rerenders/segundo`)
  }

  // Capturar métricas de performance
  const performanceMetrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('measure')
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
      firstPaint: performance.getEntriesByType('paint').find((entry: any) => entry.name === 'first-paint')?.startTime,
      firstContentfulPaint: performance.getEntriesByType('paint').find((entry: any) => entry.name === 'first-contentful-paint')?.startTime,
      measures: perfData.length,
    }
  })

  console.log('\n📈 Métricas de Performance:')
  console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded?.toFixed(2)}ms`)
  console.log(`  Load Complete: ${performanceMetrics.loadComplete?.toFixed(2)}ms`)
  console.log(`  First Paint: ${performanceMetrics.firstPaint?.toFixed(2)}ms`)
  console.log(`  First Contentful Paint: ${performanceMetrics.firstContentfulPaint?.toFixed(2)}ms`)

  // Detectar patrones problemáticos
  const problematicPatterns: string[] = []
  
  if (rerenderLogs.length > 20) {
    problematicPatterns.push(`Excesivos rerenders: ${rerenderLogs.length} detectados`)
  }
  
  if (rerendersByComponent['Header'] > 5) {
    problematicPatterns.push(`Header se rerenderiza ${rerendersByComponent['Header']} veces`)
  }
  
  if (rerendersByComponent['CategoryTogglePills'] > 5) {
    problematicPatterns.push(`CategoryTogglePills se rerenderiza ${rerendersByComponent['CategoryTogglePills']} veces`)
  }

  if (problematicPatterns.length > 0) {
    console.log('\n⚠️ PATRONES PROBLEMÁTICOS DETECTADOS:')
    problematicPatterns.forEach(pattern => console.log(`  - ${pattern}`))
  }

  // Mostrar primeros 10 logs como muestra
  if (rerenderLogs.length > 0) {
    console.log('\n📝 Primeros 10 logs de rerenders:')
    rerenderLogs.slice(0, 10).forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.component || 'Unknown'}] ${log.message.substring(0, 100)}`)
    })
  }

  // Assertions para detectar problemas críticos
  expect(rerenderLogs.length).toBeLessThan(50) // No debería haber más de 50 rerenders
  expect(rerendersByComponent['Header'] || 0).toBeLessThan(10) // Header no debería rerenderizarse más de 10 veces
})

test('Monitorear rerenders durante interacción del usuario', async ({ page }) => {
  const rerenderLogs: Array<{ timestamp: number; message: string }> = []

  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('re-render') || text.includes('rerender') || text.includes('🔄')) {
      rerenderLogs.push({
        timestamp: Date.now(),
        message: text,
      })
    }
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Contar rerenders antes de la interacción
  const rerendersBefore = rerenderLogs.length

  // Simular scroll
  await page.evaluate(() => window.scrollTo(0, 500))
  await page.waitForTimeout(1000)

  // Contar rerenders después del scroll
  const rerendersAfter = rerenderLogs.length
  const rerendersDuringScroll = rerendersAfter - rerendersBefore

  console.log(`\n📊 Rerenders durante scroll: ${rerendersDuringScroll}`)

  // Hacer click en un elemento (si existe)
  const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]').first()
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.click()
    await page.waitForTimeout(500)
    
    const rerendersAfterClick = rerenderLogs.length
    const rerendersDuringClick = rerendersAfterClick - rerendersAfter
    
    console.log(`📊 Rerenders durante click: ${rerendersDuringClick}`)
  }

  expect(rerendersDuringScroll).toBeLessThan(5) // No debería haber más de 5 rerenders durante scroll
})
