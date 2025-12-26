import { test, expect, Page } from '@playwright/test'

// ===================================
// CONFIGURACIÓN DE DISPOSITIVOS MÓVILES
// ===================================

const MOBILE_DEVICE_PROFILES = [
  {
    name: 'low-end-mobile',
    viewport: { width: 375, height: 667 }, // iPhone SE
    cpuThrottling: 6, // 6x throttling (muy lento)
    description: 'Dispositivo móvil gama baja (iPhone SE)',
  },
  {
    name: 'mid-range-mobile',
    viewport: { width: 390, height: 844 }, // iPhone 12/13
    cpuThrottling: 4, // 4x throttling (medio)
    description: 'Dispositivo móvil gama media (iPhone 12/13)',
  },
  {
    name: 'high-end-mobile',
    viewport: { width: 428, height: 926 }, // iPhone 14 Pro Max
    cpuThrottling: 1, // Sin throttling
    description: 'Dispositivo móvil gama alta (iPhone 14 Pro Max)',
  },
]

// ===================================
// HELPERS PARA CDP Y THROTTLING
// ===================================

async function setCPUThrottling(page: Page, rate: number) {
  const client = await page.context().newCDPSession(page)
  await client.send('Emulation.setCPUThrottlingRate', { rate })
  await client.detach()
}

async function measureScrollPerformance(page: Page, scrollDistance: number = 2000) {
  // Iniciar medición de FPS usando Performance API
  const fpsMetrics = await page.evaluate(
    async (distance) => {
      const metrics: {
        frameCount: number
        droppedFrames: number
        jankyFrames: number
        totalTime: number
        averageFPS: number
        minFPS: number
        maxFPS: number
        frameTimes: number[]
      } = {
        frameCount: 0,
        droppedFrames: 0,
        jankyFrames: 0,
        totalTime: 0,
        averageFPS: 0,
        minFPS: Infinity,
        maxFPS: 0,
        frameTimes: [],
      }

      let lastFrameTime = performance.now()
      let frameCount = 0
      const frameTimes: number[] = []
      const JANK_THRESHOLD = 50 // ms - frames que toman más de 50ms son janky
      const TARGET_FPS = 60
      const TARGET_FRAME_TIME = 1000 / TARGET_FPS // ~16.67ms

      // Callback para medir frames
      const measureFrame = (currentTime: number) => {
        const frameTime = currentTime - lastFrameTime
        frameTimes.push(frameTime)
        frameCount++

        // Detectar frames janky (más lentos que el threshold)
        if (frameTime > JANK_THRESHOLD) {
          metrics.jankyFrames++
        }

        // Detectar frames caídos (más lentos que 2x el tiempo objetivo)
        if (frameTime > TARGET_FRAME_TIME * 2) {
          metrics.droppedFrames++
        }

        lastFrameTime = currentTime
      }

      // Usar requestAnimationFrame para medir frames
      const startTime = performance.now()
      let rafId: number

      const measure = (timestamp: number) => {
        measureFrame(timestamp)
        rafId = requestAnimationFrame(measure)
      }

      rafId = requestAnimationFrame(measure)

      // Scroll vertical
      const scrollStart = window.scrollY
      const scrollEnd = scrollStart + distance
      const scrollDuration = 1000 // 1 segundo
      const scrollStartTime = performance.now()

      const scroll = () => {
        const elapsed = performance.now() - scrollStartTime
        const progress = Math.min(elapsed / scrollDuration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3) // Easing function
        const currentScroll = scrollStart + (scrollEnd - scrollStart) * easeOut

        window.scrollTo(0, currentScroll)

        if (progress < 1) {
          requestAnimationFrame(scroll)
        } else {
          // Detener medición después de un breve delay
          setTimeout(() => {
            cancelAnimationFrame(rafId)
            const endTime = performance.now()
            const totalTime = endTime - startTime

            // Calcular FPS
            const fps = (frameCount / totalTime) * 1000
            const minFrameTime = Math.min(...frameTimes)
            const maxFrameTime = Math.max(...frameTimes)
            const minFPS = 1000 / maxFrameTime
            const maxFPS = 1000 / minFrameTime

            metrics.frameCount = frameCount
            metrics.totalTime = totalTime
            metrics.averageFPS = fps
            metrics.minFPS = minFPS
            metrics.maxFPS = maxFPS
            metrics.frameTimes = frameTimes
          }, 500)
        }
      }

      requestAnimationFrame(scroll)

      // Esperar a que termine el scroll y la medición
      await new Promise((resolve) => setTimeout(resolve, 2000))

      return metrics
    },
    scrollDistance
  )

  return fpsMetrics
}

async function getLayoutShiftScore(page: Page) {
  return await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let clsValue = 0
      let clsEntries: PerformanceEntry[] = []

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
            clsEntries.push(entry)
          }
        }
      })

      observer.observe({ entryTypes: ['layout-shift'] })

      // Esperar un momento para capturar CLS
      setTimeout(() => {
        observer.disconnect()
        resolve(clsValue)
      }, 2000)
    })
  })
}

async function getLongTasks(page: Page) {
  return await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let longTaskCount = 0

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            longTaskCount++
          }
        }
      })

      observer.observe({ entryTypes: ['longtask'] })

      setTimeout(() => {
        observer.disconnect()
        resolve(longTaskCount)
      }, 2000)
    })
  })
}

// ===================================
// TESTS
// ===================================

test.describe('Mobile Scroll Performance', () => {
  for (const device of MOBILE_DEVICE_PROFILES) {
    test(`Scroll vertical en ${device.name} - ${device.description}`, async ({ page }) => {
      console.log(`\n📱 Testing ${device.name}: ${device.description}`)
      console.log(`   Viewport: ${device.viewport.width}x${device.viewport.height}`)
      console.log(`   CPU Throttling: ${device.cpuThrottling}x`)

      // Configurar viewport
      await page.setViewportSize(device.viewport)

      // Configurar CPU throttling
      await setCPUThrottling(page, device.cpuThrottling)

      // Navegar a la página principal
      await page.goto('/', { waitUntil: 'domcontentloaded' })

      // Esperar a que la página cargue completamente
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Network idle timeout, continuando...')
      })

      // Esperar a que los componentes críticos estén listos
      await page.waitForSelector('[data-testid="category-pills-container"]', {
        timeout: 10000,
        state: 'attached',
      }).catch(() => {
        console.log('⚠️ Category pills no encontrados, continuando...')
      })

      // Esperar un momento adicional para que todo se estabilice
      await page.waitForTimeout(1000)

      // Medir performance antes del scroll
      const beforeMetrics = await page.evaluate(() => {
        const perfEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
        return perfEntries.length > 0
          ? {
              domContentLoaded: perfEntries[0].domContentLoadedEventEnd - perfEntries[0].domContentLoadedEventStart,
              loadComplete: perfEntries[0].loadEventEnd - perfEntries[0].loadEventStart,
            }
          : { domContentLoaded: 0, loadComplete: 0 }
      })

      console.log(`\n📊 Métricas antes del scroll:`)
      console.log(`   DOM Content Loaded: ${beforeMetrics.domContentLoaded.toFixed(2)}ms`)
      console.log(`   Load Complete: ${beforeMetrics.loadComplete.toFixed(2)}ms`)

      // Realizar scroll vertical y medir performance
      console.log(`\n🔄 Iniciando scroll vertical...`)
      const scrollMetrics = await measureScrollPerformance(page, 2000)

      // Medir CLS y Long Tasks
      const clsScore = await getLayoutShiftScore(page)
      const longTasks = await getLongTasks(page)

      // Calcular métricas adicionales
      const smoothnessScore = Math.max(
        0,
        100 - (scrollMetrics.jankyFrames / scrollMetrics.frameCount) * 100
      )
      const jankPercentage = (scrollMetrics.jankyFrames / scrollMetrics.frameCount) * 100
      const droppedFramesPercentage = (scrollMetrics.droppedFrames / scrollMetrics.frameCount) * 100

      // Mostrar resultados
      console.log(`\n📈 Resultados del scroll:`)
      console.log(`   FPS Promedio: ${scrollMetrics.averageFPS.toFixed(2)}`)
      console.log(`   FPS Mínimo: ${scrollMetrics.minFPS.toFixed(2)}`)
      console.log(`   FPS Máximo: ${scrollMetrics.maxFPS.toFixed(2)}`)
      console.log(`   Total de Frames: ${scrollMetrics.frameCount}`)
      console.log(`   Frames Janky: ${scrollMetrics.jankyFrames} (${jankPercentage.toFixed(2)}%)`)
      console.log(`   Frames Caídos: ${scrollMetrics.droppedFrames} (${droppedFramesPercentage.toFixed(2)}%)`)
      console.log(`   Smoothness Score: ${smoothnessScore.toFixed(2)}%`)
      console.log(`   CLS Score: ${clsScore.toFixed(4)}`)
      console.log(`   Long Tasks: ${longTasks}`)

      // Análisis de frame times
      const sortedFrameTimes = [...scrollMetrics.frameTimes].sort((a, b) => a - b)
      const p50 = sortedFrameTimes[Math.floor(sortedFrameTimes.length * 0.5)]
      const p75 = sortedFrameTimes[Math.floor(sortedFrameTimes.length * 0.75)]
      const p95 = sortedFrameTimes[Math.floor(sortedFrameTimes.length * 0.95)]
      const p99 = sortedFrameTimes[Math.floor(sortedFrameTimes.length * 0.99)]

      console.log(`\n📊 Análisis de Frame Times:`)
      console.log(`   P50: ${p50.toFixed(2)}ms`)
      console.log(`   P75: ${p75.toFixed(2)}ms`)
      console.log(`   P95: ${p95.toFixed(2)}ms`)
      console.log(`   P99: ${p99.toFixed(2)}ms`)

      // Assertions basados en el tipo de dispositivo
      if (device.name === 'low-end-mobile') {
        // Gama baja: más permisivo
        expect(scrollMetrics.averageFPS).toBeGreaterThan(25) // Mínimo 25 FPS
        expect(jankPercentage).toBeLessThan(40) // Máximo 40% de frames janky
        expect(smoothnessScore).toBeGreaterThan(50) // Mínimo 50% de smoothness
      } else if (device.name === 'mid-range-mobile') {
        // Gama media: estándar
        expect(scrollMetrics.averageFPS).toBeGreaterThan(40) // Mínimo 40 FPS
        expect(jankPercentage).toBeLessThan(25) // Máximo 25% de frames janky
        expect(smoothnessScore).toBeGreaterThan(70) // Mínimo 70% de smoothness
      } else {
        // Gama alta: estricto
        expect(scrollMetrics.averageFPS).toBeGreaterThan(55) // Mínimo 55 FPS
        expect(jankPercentage).toBeLessThan(10) // Máximo 10% de frames janky
        expect(smoothnessScore).toBeGreaterThan(85) // Mínimo 85% de smoothness
      }

      // CLS debe ser bajo en todos los casos
      expect(clsScore).toBeLessThan(0.1) // CLS debe ser menor a 0.1

      // Long tasks deben ser mínimos
      expect(longTasks).toBeLessThan(5) // Máximo 5 long tasks durante scroll
    })
  }

  test('Identificar componentes que causan lag durante scroll', async ({ page }) => {
    console.log(`\n🔍 Analizando componentes que causan lag...`)

    // Configurar como dispositivo gama media
    const device = MOBILE_DEVICE_PROFILES[1] // mid-range-mobile
    await page.setViewportSize(device.viewport)
    await setCPUThrottling(page, device.cpuThrottling)

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(1000)

    // Capturar logs de renderizado y re-renders
    const renderLogs: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('re-rendered') || text.includes('render')) {
        renderLogs.push(text)
      }
    })

    // Medir tiempo de renderizado de componentes durante scroll
    const componentMetrics = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        const metrics: {
          [key: string]: {
            renderCount: number
            totalRenderTime: number
            averageRenderTime: number
          }
        } = {}

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              const name = entry.name
              if (!metrics[name]) {
                metrics[name] = {
                  renderCount: 0,
                  totalRenderTime: 0,
                  averageRenderTime: 0,
                }
              }
              metrics[name].renderCount++
              metrics[name].totalRenderTime += entry.duration
              metrics[name].averageRenderTime =
                metrics[name].totalRenderTime / metrics[name].renderCount
            }
          }
        })

        observer.observe({ entryTypes: ['measure'] })

        // Realizar scroll
        const scrollStart = window.scrollY
        const scrollEnd = scrollStart + 2000
        const scrollDuration = 1000
        const scrollStartTime = performance.now()

        const scroll = () => {
          const elapsed = performance.now() - scrollStartTime
          const progress = Math.min(elapsed / scrollDuration, 1)
          const easeOut = 1 - Math.pow(1 - progress, 3)
          const currentScroll = scrollStart + (scrollEnd - scrollStart) * easeOut

          window.scrollTo(0, currentScroll)

          if (progress < 1) {
            requestAnimationFrame(scroll)
          } else {
            setTimeout(() => {
              observer.disconnect()
              resolve(metrics)
            }, 500)
          }
        }

        requestAnimationFrame(scroll)
      })
    })

    // Obtener información de elementos en viewport durante scroll
    const elementsInViewport = await page.evaluate(() => {
      const elements: Array<{
        tagName: string
        className: string
        dataTestId: string
        hasTransform: boolean
        hasBackdropFilter: boolean
        hasWillChange: boolean
        hasContentVisibility: boolean
      }> = []

      const allElements = document.querySelectorAll('*')
      allElements.forEach((el) => {
        const styles = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        const isInViewport =
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth

        if (isInViewport && rect.width > 0 && rect.height > 0) {
          elements.push({
            tagName: el.tagName,
            className: el.className || '',
            dataTestId: (el as HTMLElement).dataset.testid || '',
            hasTransform: styles.transform !== 'none',
            hasBackdropFilter: styles.backdropFilter !== 'none',
            hasWillChange: styles.willChange !== 'auto',
            hasContentVisibility: styles.contentVisibility !== 'visible',
          })
        }
      })

      return elements
    })

    console.log(`\n📊 Componentes en viewport durante scroll:`)
    console.log(`   Total de elementos: ${elementsInViewport.length}`)
    
    const elementsWithExpensiveProps = elementsInViewport.filter(
      (el) => el.hasBackdropFilter || el.hasTransform || el.hasWillChange
    )
    console.log(`   Elementos con propiedades costosas: ${elementsWithExpensiveProps.length}`)

    if (elementsWithExpensiveProps.length > 0) {
      console.log(`\n⚠️ Elementos con propiedades costosas detectados:`)
      elementsWithExpensiveProps.slice(0, 10).forEach((el, idx) => {
        const classNameStr = typeof el.className === 'string' ? el.className : (el.className?.toString() || '')
        const firstClass = classNameStr ? '.' + classNameStr.split(' ')[0] : ''
        console.log(`   ${idx + 1}. ${el.tagName}${firstClass}`)
        console.log(`      - backdrop-filter: ${el.hasBackdropFilter}`)
        console.log(`      - transform: ${el.hasTransform}`)
        console.log(`      - will-change: ${el.hasWillChange}`)
        if (el.dataTestId) {
          console.log(`      - data-testid: ${el.dataTestId}`)
        }
      })
    }

    // Logs de re-renders
    if (renderLogs.length > 0) {
      console.log(`\n⚠️ Re-renders detectados durante scroll: ${renderLogs.length}`)
      renderLogs.slice(0, 5).forEach((log, idx) => {
        console.log(`   ${idx + 1}. ${log.substring(0, 100)}...`)
      })
    }
  })
})

