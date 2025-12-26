import { test, expect, Page } from '@playwright/test'

/**
 * 🎯 Test de Debug: Re-renders Excesivos en Carrusel de Categorías
 * 
 * Este test detecta y mide re-renders excesivos del componente CategoryTogglePills
 * durante la carga inicial y durante interacciones.
 * 
 * Objetivo: Solo 1 render inicial, máximo 2-3 durante la carga completa
 * 
 * Métricas medidas:
 * - Número de re-renders durante carga inicial
 * - Tiempo entre re-renders
 * - Props que cambian entre renders
 * - Console logs de re-renders
 * - Cambios en el DOM innecesarios
 */

interface RerenderInfo {
  timestamp: number
  props: {
    selectedCategories: string[]
    searchTerm?: string
    variant?: string
    useDynamicCarousel?: boolean
  }
  stackTrace?: string
}

interface RerenderMetrics {
  totalRerenders: number
  rerendersDuringLoad: number
  rerendersAfterLoad: number
  timeToFirstRender: number
  timeToStable: number
  averageTimeBetweenRerenders: number
  rerenderDetails: RerenderInfo[]
  propChanges: {
    selectedCategories: number
    searchTerm: number
    variant: number
    useDynamicCarousel: number
    onCategoryChange: number
  }
}

/**
 * Función para capturar y analizar re-renders del componente
 */
async function measureRerenders(page: Page): Promise<RerenderMetrics> {
  // Capturar logs de consola desde Playwright
  const rerenderLogs: RerenderInfo[] = []
  const startTime = Date.now()

  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('🔄 CategoryTogglePills re-rendered')) {
      try {
        // Intentar parsear el objeto de props del log
        const logParts = text.split('CategoryTogglePills re-rendered')
        if (logParts.length > 1) {
          const propsStr = logParts[1].trim()
          let props: any = {}
          try {
            props = JSON.parse(propsStr)
          } catch {
            // Si no se puede parsear, extraer valores manualmente
            const selectedCategoriesMatch = propsStr.match(/selectedCategories:\s*\[(.*?)\]/)
            const searchTermMatch = propsStr.match(/searchTerm:\s*"?(.*?)"?[,}]/)
            const variantMatch = propsStr.match(/variant:\s*"?(.*?)"?[,}]/)
            const useDynamicCarouselMatch = propsStr.match(/useDynamicCarousel:\s*(true|false)/)
            
            props = {
              selectedCategories: selectedCategoriesMatch
                ? selectedCategoriesMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, ''))
                : [],
              searchTerm: searchTermMatch ? searchTermMatch[1] : undefined,
              variant: variantMatch ? variantMatch[1] : undefined,
              useDynamicCarousel: useDynamicCarouselMatch ? useDynamicCarouselMatch[1] === 'true' : undefined,
            }
          }

          rerenderLogs.push({
            timestamp: Date.now() - startTime,
            props: {
              selectedCategories: props.selectedCategories || [],
              searchTerm: props.searchTerm,
              variant: props.variant,
              useDynamicCarousel: props.useDynamicCarousel,
            },
          })
        }
      } catch (error) {
        console.warn('Error parsing rerender log:', error)
      }
    }
  })

  // También usar evaluate para capturar desde el contexto de la página
  const metrics = await page.evaluate(() => {
    return new Promise<RerenderMetrics>((resolve) => {
      const rerenderLogs: RerenderInfo[] = []
      let startTime = performance.now()
      let firstRenderTime = 0
      let lastRenderTime = 0
      let loadComplete = false

      // Almacenar logs en window para acceso desde Playwright
      ;(window as any).__rerenderLogs = rerenderLogs

      // Interceptar console.log para capturar logs de re-renders
      const originalLog = console.log
      console.log = (...args: any[]) => {
        const message = args.join(' ')
        if (message.includes('🔄 CategoryTogglePills re-rendered')) {
          const timestamp = performance.now()
          let props: any = {}
          
          // Intentar extraer props del segundo argumento
          if (args.length > 1 && typeof args[1] === 'object') {
            props = args[1]
          } else {
            // Intentar parsear del mensaje
            try {
              const propsMatch = message.match(/\{.*\}/)
              if (propsMatch) {
                props = JSON.parse(propsMatch[0])
              }
            } catch {}
          }
          
          if (firstRenderTime === 0) {
            firstRenderTime = timestamp
          }
          
          rerenderLogs.push({
            timestamp: timestamp - startTime,
            props: {
              selectedCategories: props.selectedCategories || [],
              searchTerm: props.searchTerm,
              variant: props.variant,
              useDynamicCarousel: props.useDynamicCarousel,
            },
          })
          
          lastRenderTime = timestamp
        }
        originalLog.apply(console, args)
      }

      // Detectar cuando la página está completamente cargada
      const checkLoadComplete = () => {
        if (document.readyState === 'complete') {
          // Esperar un poco más para capturar todos los re-renders
          setTimeout(() => {
            loadComplete = true
            const loadTime = performance.now() - startTime
            
            // Calcular métricas
            const rerendersDuringLoad = rerenderLogs.filter(
              (log) => log.timestamp <= loadTime
            ).length
            
            const rerendersAfterLoad = rerenderLogs.length - rerendersDuringLoad
            
            // Calcular tiempos promedio entre re-renders
            let totalTimeBetweenRerenders = 0
            for (let i = 1; i < rerenderLogs.length; i++) {
              totalTimeBetweenRerenders +=
                rerenderLogs[i].timestamp - rerenderLogs[i - 1].timestamp
            }
            const averageTimeBetweenRerenders =
              rerenderLogs.length > 1
                ? totalTimeBetweenRerenders / (rerenderLogs.length - 1)
                : 0

            // Detectar cambios en props
            const propChanges = {
              selectedCategories: 0,
              searchTerm: 0,
              variant: 0,
              useDynamicCarousel: 0,
              onCategoryChange: 0,
            }

            for (let i = 1; i < rerenderLogs.length; i++) {
              const prev = rerenderLogs[i - 1].props
              const curr = rerenderLogs[i].props

              if (
                JSON.stringify(prev.selectedCategories) !==
                JSON.stringify(curr.selectedCategories)
              ) {
                propChanges.selectedCategories++
              }
              if (prev.searchTerm !== curr.searchTerm) {
                propChanges.searchTerm++
              }
              if (prev.variant !== curr.variant) {
                propChanges.variant++
              }
              if (prev.useDynamicCarousel !== curr.useDynamicCarousel) {
                propChanges.useDynamicCarousel++
              }
            }

            // Calcular tiempo hasta estabilización (último re-render)
            const timeToStable =
              rerenderLogs.length > 0
                ? rerenderLogs[rerenderLogs.length - 1].timestamp - startTime
                : 0

            resolve({
              totalRerenders: rerenderLogs.length,
              rerendersDuringLoad,
              rerendersAfterLoad,
              timeToFirstRender: firstRenderTime - startTime,
              timeToStable,
              averageTimeBetweenRerenders,
              rerenderDetails: rerenderLogs,
              propChanges,
            })
          }, 2000) // Esperar 2 segundos después de la carga
        } else {
          setTimeout(checkLoadComplete, 100)
        }
      }

      // Iniciar detección
      if (document.readyState === 'complete') {
        checkLoadComplete()
      } else {
        window.addEventListener('load', checkLoadComplete)
        checkLoadComplete()
      }
    })
  })

  // Combinar logs capturados desde ambos métodos
  const pageLogs = await page.evaluate(() => {
    return (window as any).__rerenderLogs || []
  })

  // Usar los logs de la página si están disponibles, sino usar los de Playwright
  const finalLogs = pageLogs.length > 0 ? pageLogs : rerenderLogs

  // Calcular métricas finales
  if (finalLogs.length > 0) {
    const firstRenderTime = finalLogs[0].timestamp
    const lastRenderTime = finalLogs[finalLogs.length - 1].timestamp
    const loadTime = 2000 // Tiempo estimado de carga

    const rerendersDuringLoad = finalLogs.filter(
      (log) => log.timestamp <= loadTime
    ).length

    const rerendersAfterLoad = finalLogs.length - rerendersDuringLoad

    let totalTimeBetweenRerenders = 0
    for (let i = 1; i < finalLogs.length; i++) {
      totalTimeBetweenRerenders += finalLogs[i].timestamp - finalLogs[i - 1].timestamp
    }
    const averageTimeBetweenRerenders =
      finalLogs.length > 1 ? totalTimeBetweenRerenders / (finalLogs.length - 1) : 0

    const propChanges = {
      selectedCategories: 0,
      searchTerm: 0,
      variant: 0,
      useDynamicCarousel: 0,
      onCategoryChange: 0,
    }

    for (let i = 1; i < finalLogs.length; i++) {
      const prev = finalLogs[i - 1].props
      const curr = finalLogs[i].props

      if (
        JSON.stringify(prev.selectedCategories) !==
        JSON.stringify(curr.selectedCategories)
      ) {
        propChanges.selectedCategories++
      }
      if (prev.searchTerm !== curr.searchTerm) {
        propChanges.searchTerm++
      }
      if (prev.variant !== curr.variant) {
        propChanges.variant++
      }
      if (prev.useDynamicCarousel !== curr.useDynamicCarousel) {
        propChanges.useDynamicCarousel++
      }
    }

    return {
      totalRerenders: finalLogs.length,
      rerendersDuringLoad,
      rerendersAfterLoad,
      timeToFirstRender: firstRenderTime,
      timeToStable: lastRenderTime,
      averageTimeBetweenRerenders,
      rerenderDetails: finalLogs,
      propChanges,
    }
  }

  return metrics
}

/**
 * Función para detectar cambios en el DOM del carrusel
 */
async function detectDOMChanges(page: Page): Promise<{
  domUpdates: number
  attributeChanges: number
  classChanges: number
}> {
  return await page.evaluate(() => {
    return new Promise<{
      domUpdates: number
      attributeChanges: number
      classChanges: number
    }>((resolve) => {
      let domUpdates = 0
      let attributeChanges = 0
      let classChanges = 0

      const carousel = document.querySelector('[data-testid="category-pills-container"]')
      if (!carousel) {
        resolve({ domUpdates: 0, attributeChanges: 0, classChanges: 0 })
        return
      }

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          domUpdates++
          if (mutation.type === 'attributes') {
            attributeChanges++
            if (mutation.attributeName === 'class') {
              classChanges++
            }
          }
        })
      })

      observer.observe(carousel, {
        attributes: true,
        attributeOldValue: true,
        childList: true,
        subtree: true,
      })

      // Detener observación después de 3 segundos
      setTimeout(() => {
        observer.disconnect()
        resolve({ domUpdates, attributeChanges, classChanges })
      }, 3000)
    })
  })
}

test.describe('Category Carousel Re-renders Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Habilitar console logs
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('🔄')) {
        console.log('Browser log:', msg.text())
      }
    })
  })

  test('debe tener máximo 1-2 re-renders durante carga inicial', async ({
    page,
  }) => {
    console.log('🔍 Iniciando test de re-renders...')

    // Capturar logs ANTES de navegar
    const rerenderLogs: Array<{ timestamp: number; props: any }> = []
    
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('🔄 CategoryTogglePills re-rendered')) {
        const timestamp = Date.now()
        try {
          // Extraer props del log
          const propsMatch = text.match(/\{.*\}/)
          if (propsMatch) {
            const propsStr = propsMatch[0]
            // Intentar parsear o extraer manualmente
            let props: any = {}
            try {
              props = JSON.parse(propsStr)
            } catch {
              // Extraer valores manualmente
              const selectedCategoriesMatch = propsStr.match(/selectedCategories:\s*\[(.*?)\]/)
              const searchTermMatch = propsStr.match(/searchTerm:\s*"?(.*?)"?[,}]/)
              const variantMatch = propsStr.match(/variant:\s*"?(.*?)"?[,}]/)
              const useDynamicCarouselMatch = propsStr.match(/useDynamicCarousel:\s*(true|false)/)
              
              props = {
                selectedCategories: selectedCategoriesMatch
                  ? selectedCategoriesMatch[1].split(',').map((s: string) => s.trim().replace(/['"]/g, '')).filter(Boolean)
                  : [],
                searchTerm: searchTermMatch ? searchTermMatch[1] : undefined,
                variant: variantMatch ? variantMatch[1] : undefined,
                useDynamicCarousel: useDynamicCarouselMatch ? useDynamicCarouselMatch[1] === 'true' : undefined,
              }
            }
            
            rerenderLogs.push({ timestamp, props })
            console.log(`📝 Re-render capturado #${rerenderLogs.length} en ${timestamp}ms`)
          }
        } catch (error) {
          console.warn('Error parsing rerender log:', error, text)
        }
      }
    })

    const startTime = Date.now()

    // Navegar a la página principal
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Esperar a que el carrusel esté presente
    await page.waitForSelector('[data-testid="category-pills-container"]', {
      timeout: 10000,
      state: 'attached',
    })

    // Esperar un poco para que se complete la carga y capturar todos los re-renders
    await page.waitForTimeout(3000)

    // Calcular métricas desde los logs capturados
    const loadTime = 3000
    const rerendersDuringLoad = rerenderLogs.filter(
      (log) => log.timestamp - startTime <= loadTime
    ).length

    const rerendersAfterLoad = rerenderLogs.length - rerendersDuringLoad

    let totalTimeBetweenRerenders = 0
    for (let i = 1; i < rerenderLogs.length; i++) {
      totalTimeBetweenRerenders += rerenderLogs[i].timestamp - rerenderLogs[i - 1].timestamp
    }
    const averageTimeBetweenRerenders =
      rerenderLogs.length > 1 ? totalTimeBetweenRerenders / (rerenderLogs.length - 1) : 0

    const propChanges = {
      selectedCategories: 0,
      searchTerm: 0,
      variant: 0,
      useDynamicCarousel: 0,
      onCategoryChange: 0,
    }

    for (let i = 1; i < rerenderLogs.length; i++) {
      const prev = rerenderLogs[i - 1].props
      const curr = rerenderLogs[i].props

      if (
        JSON.stringify(prev.selectedCategories || []) !==
        JSON.stringify(curr.selectedCategories || [])
      ) {
        propChanges.selectedCategories++
      }
      if (prev.searchTerm !== curr.searchTerm) {
        propChanges.searchTerm++
      }
      if (prev.variant !== curr.variant) {
        propChanges.variant++
      }
      if (prev.useDynamicCarousel !== curr.useDynamicCarousel) {
        propChanges.useDynamicCarousel++
      }
    }

    const metrics = {
      totalRerenders: rerenderLogs.length,
      rerendersDuringLoad,
      rerendersAfterLoad,
      timeToFirstRender: rerenderLogs.length > 0 ? rerenderLogs[0].timestamp - startTime : 0,
      timeToStable: rerenderLogs.length > 0 ? rerenderLogs[rerenderLogs.length - 1].timestamp - startTime : 0,
      averageTimeBetweenRerenders,
      rerenderDetails: rerenderLogs.map((log) => ({
        timestamp: log.timestamp - startTime,
        props: log.props,
      })),
      propChanges,
    }

    console.log('📊 Métricas de re-renders:', {
      totalRerenders: metrics.totalRerenders,
      rerendersDuringLoad: metrics.rerendersDuringLoad,
      timeToFirstRender: metrics.timeToFirstRender.toFixed(2) + 'ms',
      timeToStable: metrics.timeToStable.toFixed(2) + 'ms',
      averageTimeBetweenRerenders:
        metrics.averageTimeBetweenRerenders.toFixed(2) + 'ms',
      propChanges: metrics.propChanges,
    })

    // Detectar cambios en el DOM
    const domMetrics = await detectDOMChanges(page)
    console.log('📊 Cambios en DOM:', domMetrics)

    // ⚡ ASSERT: Debe haber máximo 2-3 re-renders durante la carga inicial
    // (1 inicial + 1-2 por actualización de estado/props)
    expect(metrics.rerendersDuringLoad).toBeLessThanOrEqual(3)

    // ⚡ ASSERT: El tiempo hasta el primer render debe ser razonable
    expect(metrics.timeToFirstRender).toBeLessThan(1000)

    // ⚡ ASSERT: El tiempo hasta estabilización debe ser razonable
    expect(metrics.timeToStable).toBeLessThan(3000)

    // Log detallado de cada re-render
    if (metrics.rerenderDetails.length > 0) {
      console.log('\n📋 Detalles de re-renders:')
      metrics.rerenderDetails.forEach((rerender, index) => {
        console.log(`  ${index + 1}. Tiempo: ${rerender.timestamp.toFixed(2)}ms`)
        console.log(`     Props:`, rerender.props)
      })
    }

    // Si hay más de 3 re-renders, mostrar advertencia
    if (metrics.totalRerenders > 3) {
      console.warn(
        `⚠️ ADVERTENCIA: Se detectaron ${metrics.totalRerenders} re-renders, objetivo máximo: 3`
      )
      console.warn('Cambios en props detectados:', metrics.propChanges)
    }
  })

  test('no debe re-renderizar al hacer scroll', async ({ page }) => {
    console.log('🔍 Test: Re-renders durante scroll...')

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-testid="category-pills-container"]', {
      timeout: 10000,
      state: 'attached',
    })

    // Esperar a que se estabilice
    await page.waitForTimeout(1000)

    // Capturar número inicial de re-renders
    const initialMetrics = await measureRerenders(page)
    const initialRerenders = initialMetrics.totalRerenders

    console.log(`📊 Re-renders iniciales: ${initialRerenders}`)

    // Hacer scroll en la página
    await page.evaluate(() => {
      window.scrollTo(0, 500)
    })
    await page.waitForTimeout(500)

    await page.evaluate(() => {
      window.scrollTo(0, 1000)
    })
    await page.waitForTimeout(500)

    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(1000)

    // Medir re-renders después del scroll
    const finalMetrics = await measureRerenders(page)
    const finalRerenders = finalMetrics.totalRerenders

    console.log(`📊 Re-renders después de scroll: ${finalRerenders}`)
    console.log(
      `📊 Re-renders adicionales por scroll: ${finalRerenders - initialRerenders}`
    )

    // ⚡ ASSERT: No debe haber re-renders adicionales por scroll
    expect(finalRerenders - initialRerenders).toBeLessThanOrEqual(1)
  })

  test('debe identificar qué props causan re-renders', async ({ page }) => {
    console.log('🔍 Test: Identificación de props que causan re-renders...')

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-testid="category-pills-container"]', {
      timeout: 10000,
      state: 'attached',
    })

    await page.waitForTimeout(2000)

    const metrics = await measureRerenders(page)

    console.log('\n📊 Análisis de props que causan re-renders:')
    console.log('  - selectedCategories:', metrics.propChanges.selectedCategories)
    console.log('  - searchTerm:', metrics.propChanges.searchTerm)
    console.log('  - variant:', metrics.propChanges.variant)
    console.log('  - useDynamicCarousel:', metrics.propChanges.useDynamicCarousel)

    // Analizar qué prop cambia más frecuentemente
    const maxChanges = Math.max(
      metrics.propChanges.selectedCategories,
      metrics.propChanges.searchTerm,
      metrics.propChanges.variant,
      metrics.propChanges.useDynamicCarousel
    )

    if (maxChanges > 0) {
      console.warn(
        `⚠️ Se detectaron cambios en props que causan re-renders innecesarios`
      )
    }

    // Mostrar detalles de cada cambio
    if (metrics.rerenderDetails.length > 1) {
      console.log('\n📋 Comparación entre re-renders:')
      for (let i = 1; i < metrics.rerenderDetails.length; i++) {
        const prev = metrics.rerenderDetails[i - 1]
        const curr = metrics.rerenderDetails[i]
        console.log(`\n  Re-render ${i + 1}:`)
        console.log(
          `    Tiempo desde anterior: ${(curr.timestamp - prev.timestamp).toFixed(2)}ms`
        )
        console.log('    Cambios detectados:')
        if (
          JSON.stringify(prev.props.selectedCategories) !==
          JSON.stringify(curr.props.selectedCategories)
        ) {
          console.log(
            `      - selectedCategories: ${JSON.stringify(prev.props.selectedCategories)} → ${JSON.stringify(curr.props.selectedCategories)}`
          )
        }
        if (prev.props.searchTerm !== curr.props.searchTerm) {
          console.log(
            `      - searchTerm: "${prev.props.searchTerm}" → "${curr.props.searchTerm}"`
          )
        }
        if (prev.props.variant !== curr.props.variant) {
          console.log(
            `      - variant: "${prev.props.variant}" → "${curr.props.variant}"`
          )
        }
        if (prev.props.useDynamicCarousel !== curr.props.useDynamicCarousel) {
          console.log(
            `      - useDynamicCarousel: ${prev.props.useDynamicCarousel} → ${curr.props.useDynamicCarousel}`
          )
        }
      }
    }
  })
})

