// ===================================
// PINTEYA E-COMMERCE - HELPERS DE PERFORMANCE
// Funciones compartidas para testing de performance
// ===================================

import { Page } from '@playwright/test'

// ===================================
// INTERFACES Y TIPOS
// ===================================

export interface NetworkMetrics {
  totalRequests: number
  totalSize: number // bytes
  totalSizeMB: number
  requestsByType: Record<string, { count: number; size: number }>
  blockedRequests: number
  failedRequests: number
  slowRequests: number // requests > 1s
  averageRequestTime: number
  largestResources: Array<{ url: string; size: number; type: string }>
  renderBlockingResources: Array<{ url: string; size: number }>
}

export interface PerformanceMetrics {
  // Web Vitals
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
  inp: number // Interaction to Next Paint
  
  // Navigation Timing
  domContentLoaded: number
  loadComplete: number
  domInteractive: number
  
  // Resource Timing
  totalLoadTime: number
  
  // Memory
  memoryUsage?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

export interface RenderingMetrics {
  avgFPS: number
  minFPS: number
  maxFPS: number
  frameTimes: number[]
  jankCount: number
  jankPercentage: number
  longTasks: Array<{ duration: number; startTime: number }>
  scrollSmoothness: number
  totalFrames: number
  droppedFrames: number
  paintTimes: {
    firstPaint: number
    firstContentfulPaint: number
  }
}

export interface ComponentMetrics {
  renderTime: number
  networkRequests: number
  networkSize: number // bytes
  imagesLoaded: number
  imagesSize: number // bytes
  jsSize: number // bytes
  cssSize: number // bytes
  layoutShifts: number
  longTasks: number
  interactionDelay?: number
}

// ===================================
// NETWORK MONITORING
// ===================================

/**
 * Monitorea todas las requests de red durante la carga de la página
 */
export async function monitorNetworkRequests(page: Page): Promise<NetworkMetrics> {
  const requests: Array<{
    url: string
    method: string
    resourceType: string
    size: number
    responseTime: number
    status: number
    blocked: boolean
    failed: boolean
  }> = []

  // Interceptar todas las requests
  page.on('request', (request) => {
    const url = request.url()
    const resourceType = request.resourceType()
    requests.push({
      url,
      method: request.method(),
      resourceType,
      size: 0,
      responseTime: 0,
      status: 0,
      blocked: false,
      failed: false,
    })
  })

  // Interceptar responses
  page.on('response', async (response) => {
    const url = response.url()
    const request = requests.find((r) => r.url === url)
    if (request) {
      try {
        const headers = response.headers()
        const contentLength = headers['content-length'] || headers['Content-Length']
        request.size = contentLength ? parseInt(contentLength, 10) : 0
        request.status = response.status()
        request.responseTime = Date.now() - response.request().timestamp()
      } catch (e) {
        // Ignorar errores al obtener tamaño
      }
    }
  })

  // Detectar requests bloqueadas
  page.on('requestfailed', (request) => {
    const url = request.url()
    const requestEntry = requests.find((r) => r.url === url)
    if (requestEntry) {
      requestEntry.failed = true
    }
  })

  // Esperar a que la página cargue
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
    console.log('⚠️ Network idle timeout, continuando...')
  })

  // Obtener información adicional usando Performance API
  const networkInfo = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    return {
      resources: resources.map((r) => ({
        name: r.name,
        type: (r as any).initiatorType || 'other',
        size: (r as any).transferSize || 0,
        duration: r.duration,
        renderBlocking: (r as any).renderBlockingStatus === 'blocking',
      })),
      navigation: navigation ? {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      } : null,
    }
  })

  // Combinar datos
  const totalSize = requests.reduce((sum, r) => sum + (r.size || 0), 0)
  const totalSizeMB = totalSize / (1024 * 1024)

  // Agrupar por tipo
  const requestsByType: Record<string, { count: number; size: number }> = {}
  requests.forEach((r) => {
    const type = r.resourceType || 'other'
    if (!requestsByType[type]) {
      requestsByType[type] = { count: 0, size: 0 }
    }
    requestsByType[type].count++
    requestsByType[type].size += r.size || 0
  })

  // Calcular promedio de tiempo de respuesta
  const validResponseTimes = requests.filter((r) => r.responseTime > 0).map((r) => r.responseTime)
  const averageRequestTime = validResponseTimes.length > 0
    ? validResponseTimes.reduce((a, b) => a + b, 0) / validResponseTimes.length
    : 0

  // Identificar requests lentas (>1s)
  const slowRequests = requests.filter((r) => r.responseTime > 1000).length

  // Identificar recursos más grandes
  const largestResources = requests
    .map((r) => ({
      url: r.url,
      size: r.size || 0,
      type: r.resourceType,
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)

  // Identificar recursos que bloquean el renderizado
  const renderBlockingResources = networkInfo.resources
    .filter((r) => r.renderBlocking)
    .map((r) => ({
      url: r.name,
      size: r.size,
    }))
    .slice(0, 10)

  return {
    totalRequests: requests.length,
    totalSize,
    totalSizeMB,
    requestsByType,
    blockedRequests: requests.filter((r) => r.blocked).length,
    failedRequests: requests.filter((r) => r.failed).length,
    slowRequests,
    averageRequestTime,
    largestResources,
    renderBlockingResources,
  }
}

// ===================================
// PERFORMANCE METRICS
// ===================================

/**
 * Obtiene métricas de Web Vitals y Performance API
 */
export async function getPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
  return await page.evaluate(() => {
    return new Promise<PerformanceMetrics>((resolve) => {
      const metrics: PerformanceMetrics = {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0,
        inp: 0,
        domContentLoaded: 0,
        loadComplete: 0,
        domInteractive: 0,
        totalLoadTime: 0,
      }

      // Navigation Timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        metrics.ttfb = navigation.responseStart - navigation.requestStart
        metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
        metrics.loadComplete = navigation.loadEventEnd - navigation.loadEventStart
        metrics.domInteractive = navigation.domInteractive - navigation.navigationStart
        metrics.totalLoadTime = navigation.loadEventEnd - navigation.navigationStart
      }

      // Paint Timing
      const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[]
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime
        }
      })

      // LCP - Largest Contentful Paint
      let lcpValue = 0
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        if (lastEntry) {
          lcpValue = lastEntry.renderTime || lastEntry.loadTime || 0
          metrics.lcp = lcpValue
        }
      })
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.warn('LCP observer no disponible')
      }

      // Fallback: intentar obtener LCP de las entradas existentes
      try {
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as any[]
        if (lcpEntries.length > 0) {
          const lastLcp = lcpEntries[lcpEntries.length - 1]
          lcpValue = lastLcp.renderTime || lastLcp.loadTime || 0
          metrics.lcp = lcpValue
        }
      } catch (e) {
        // LCP API no disponible
      }

      // CLS - Cumulative Layout Shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        metrics.cls = clsValue
      })
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.warn('CLS observer no disponible')
      }

      // FID - First Input Delay (ahora INP - Interaction to Next Paint)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            metrics.fid = (entry as any).processingStart - entry.startTime
          } else if (entry.entryType === 'event') {
            // INP - Interaction to Next Paint
            const eventEntry = entry as any
            if (eventEntry.interactionId) {
              metrics.inp = eventEntry.processingStart - eventEntry.startTime
            }
          }
        }
      })
      try {
        fidObserver.observe({ entryTypes: ['first-input', 'event'] })
      } catch (e) {
        console.warn('FID/INP observer no disponible')
      }

      // Memory (si está disponible)
      if ((performance as any).memory) {
        metrics.memoryUsage = {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        }
      }

      // Esperar un momento para capturar todas las métricas
      // Aumentar tiempo para LCP que puede tardar más en detectarse
      setTimeout(() => {
        lcpObserver.disconnect()
        clsObserver.disconnect()
        fidObserver.disconnect()
        resolve(metrics)
      }, 5000) // Aumentado de 3s a 5s para mejor captura de LCP
    })
  })
}

// ===================================
// RENDERING METRICS
// ===================================

/**
 * Mide FPS, jank y smoothness durante scroll
 */
export async function measureRenderingPerformance(
  page: Page,
  scrollDuration: number = 3000
): Promise<RenderingMetrics> {
  return await page.evaluate(
    ({ scrollDuration }) => {
      return new Promise<RenderingMetrics>((resolve) => {
        const frameTimes: number[] = []
        const longTasks: Array<{ duration: number; startTime: number }> = []
        let lastFrameTime = performance.now()
        let frameCount = 0
        let jankCount = 0
        let droppedFrames = 0
        let animationFrameId: number
        let scrollInterval: NodeJS.Timeout

        // Detectar long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              longTasks.push({
                duration: entry.duration,
                startTime: entry.startTime,
              })
            }
          }
        })
        try {
          longTaskObserver.observe({ entryTypes: ['longtask'] })
        } catch (e) {
          console.warn('Long task API no disponible')
        }

        // Obtener paint times
        const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[]
        const paintTimes = {
          firstPaint: 0,
          firstContentfulPaint: 0,
        }
        paintEntries.forEach((entry) => {
          if (entry.name === 'first-paint') {
            paintTimes.firstPaint = entry.startTime
          } else if (entry.name === 'first-contentful-paint') {
            paintTimes.firstContentfulPaint = entry.startTime
          }
        })

        // Función para medir cada frame
        const measureFrame = (currentTime: number) => {
          const frameTime = currentTime - lastFrameTime
          frameTimes.push(frameTime)
          frameCount++

          // Detectar jank (frames > 50ms = < 20fps)
          if (frameTime > 50) {
            jankCount++
          }

          // Detectar dropped frames (frames > 100ms = < 10fps)
          if (frameTime > 100) {
            droppedFrames++
          }

          lastFrameTime = currentTime
        }

        // Iniciar scroll
        let scrollPosition = 0
        const startTime = performance.now()
        scrollInterval = setInterval(() => {
          scrollPosition += 15 // px por frame (~60fps)
          window.scrollTo({
            top: scrollPosition,
            behavior: 'auto',
          })
        }, 16)

        // Iniciar medición de frames
        const measure = (timestamp: number) => {
          measureFrame(timestamp)
          const elapsed = timestamp - startTime
          if (elapsed < scrollDuration) {
            animationFrameId = requestAnimationFrame(measure)
          } else {
            // Calcular métricas finales
            const totalFrames = frameTimes.length
            const totalTime = frameTimes.reduce((a, b) => a + b, 0)
            const avgFrameTime = totalTime / totalFrames
            const avgFPS = 1000 / avgFrameTime
            const minFPS = 1000 / Math.max(...frameTimes)
            const maxFPS = 1000 / Math.min(...frameTimes.filter((t) => t > 0))

            const jankPercentage = (jankCount / totalFrames) * 100

            // Calcular smoothness score (0-100)
            const smoothFrames = frameTimes.filter((t) => t <= 16.67).length
            const smoothPercentage = (smoothFrames / totalFrames) * 100
            const frameTimeVariance =
              frameTimes.reduce((acc, t) => acc + Math.pow(t - avgFrameTime, 2), 0) / totalFrames
            const variancePenalty = Math.min(frameTimeVariance / 100, 30)

            const scrollSmoothness = Math.max(
              0,
              smoothPercentage - (jankPercentage * 2) - (droppedFrames / totalFrames) * 50 - variancePenalty
            )

            longTaskObserver.disconnect()
            clearInterval(scrollInterval)
            cancelAnimationFrame(animationFrameId)

            resolve({
              avgFPS,
              minFPS,
              maxFPS,
              frameTimes,
              jankCount,
              jankPercentage,
              longTasks,
              scrollSmoothness,
              totalFrames,
              droppedFrames,
              paintTimes,
            })
          }
        }

        animationFrameId = requestAnimationFrame(measure)

        // Timeout de seguridad (aumentado para evitar timeouts)
        setTimeout(() => {
          longTaskObserver.disconnect()
          clearInterval(scrollInterval)
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId)
          }

          if (frameTimes.length === 0) {
            resolve({
              avgFPS: 0,
              minFPS: 0,
              maxFPS: 0,
              frameTimes: [],
              jankCount: 0,
              jankPercentage: 100,
              longTasks: [],
              scrollSmoothness: 0,
              totalFrames: 0,
              droppedFrames: 0,
              paintTimes,
            })
          } else {
            // Si hay frames pero no se resolvió, calcular métricas
            const totalFrames = frameTimes.length
            const totalTime = frameTimes.reduce((a, b) => a + b, 0)
            const avgFrameTime = totalTime / totalFrames
            const avgFPS = 1000 / avgFrameTime
            const minFPS = 1000 / Math.max(...frameTimes)
            const maxFPS = 1000 / Math.min(...frameTimes.filter((t) => t > 0))
            const jankCount = frameTimes.filter((t) => t > 50).length
            const jankPercentage = (jankCount / totalFrames) * 100
            const droppedFrames = frameTimes.filter((t) => t > 100).length
            const smoothFrames = frameTimes.filter((t) => t <= 16.67).length
            const smoothPercentage = (smoothFrames / totalFrames) * 100
            const frameTimeVariance =
              frameTimes.reduce((acc, t) => acc + Math.pow(t - avgFrameTime, 2), 0) / totalFrames
            const variancePenalty = Math.min(frameTimeVariance / 100, 30)
            const scrollSmoothness = Math.max(
              0,
              smoothPercentage - (jankPercentage * 2) - (droppedFrames / totalFrames) * 50 - variancePenalty
            )

            resolve({
              avgFPS,
              minFPS,
              maxFPS,
              frameTimes,
              jankCount,
              jankPercentage,
              longTasks,
              scrollSmoothness,
              totalFrames,
              droppedFrames,
              paintTimes,
            })
          }
        }, scrollDuration + 5000) // Aumentado de 2s a 5s
      })
    },
    { scrollDuration }
  )
}

// ===================================
// COMPONENT METRICS
// ===================================

/**
 * Mide métricas específicas de un componente
 */
export async function measureComponentMetrics(
  page: Page,
  componentSelector: string,
  waitForSelector: string,
  interactionSelector?: string
): Promise<ComponentMetrics> {
  const startTime = Date.now()
  const requests: Array<{ url: string; size: number; type: string }> = []

  // Interceptar requests
  page.on('response', async (response) => {
    const url = response.url()
    const resourceType = response.request().resourceType()
    try {
      const headers = response.headers()
      const contentLength = headers['content-length'] || headers['Content-Length']
      const size = contentLength ? parseInt(contentLength, 10) : 0
      requests.push({ url, size, type: resourceType })
    } catch (e) {
      // Ignorar errores
    }
  })

  // Esperar a que el componente esté visible
  // Usar locator para mejor manejo de múltiples elementos
  try {
    const locator = page.locator(waitForSelector).first()
    await locator.waitFor({ state: 'visible', timeout: 15000 })
  } catch (e) {
    // Si falla, intentar con waitForSelector tradicional
    await page.waitForSelector(waitForSelector, { state: 'visible', timeout: 15000 }).catch(() => {
      console.warn(`⚠️ No se pudo encontrar selector: ${waitForSelector}`)
    })
  }
  const renderTime = Date.now() - startTime

  // Obtener métricas del componente
  const metrics = await page.evaluate(
    ({ componentSelector, interactionSelector }) => {
      return new Promise<ComponentMetrics>((resolve) => {
        const component = document.querySelector(componentSelector)
        if (!component) {
          resolve({
            renderTime: 0,
            networkRequests: 0,
            networkSize: 0,
            imagesLoaded: 0,
            imagesSize: 0,
            jsSize: 0,
            cssSize: 0,
            layoutShifts: 0,
            longTasks: 0,
          })
          return
        }

        // Contar imágenes dentro del componente
        const images = component.querySelectorAll('img')
        let imagesSize = 0
        images.forEach((img) => {
          if ((img as any).complete && (img as any).naturalWidth > 0) {
            // Estimar tamaño basado en dimensiones
            const width = (img as any).naturalWidth || img.width
            const height = (img as any).naturalHeight || img.height
            imagesSize += width * height * 4 // RGBA, aproximación
          }
        })

        // Detectar layout shifts
        let layoutShifts = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              const rect = component.getBoundingClientRect()
              const entryRect = (entry as any).sources?.[0]?.previousRect
              if (entryRect) {
                const shiftX = Math.abs(entryRect.x - (entry as any).sources[0].currentRect.x)
                const shiftY = Math.abs(entryRect.y - (entry as any).sources[0].currentRect.y)
                if (shiftX > 0 || shiftY > 0) {
                  layoutShifts++
                }
              }
            }
          }
        })

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] })
        } catch (e) {
          // Layout shift API no disponible
        }

        // Detectar long tasks
        let longTasks = 0
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              longTasks++
            }
          }
        })

        try {
          longTaskObserver.observe({ entryTypes: ['longtask'] })
        } catch (e) {
          // Long task API no disponible
        }

        // Medir interacción si hay selector
        let interactionDelay = 0
        if (interactionSelector) {
          const interactionElement = component.querySelector(interactionSelector)
          if (interactionElement) {
            const startInteraction = performance.now()
            // Simular click
            ;(interactionElement as HTMLElement).click()
            const endInteraction = performance.now()
            interactionDelay = endInteraction - startInteraction
          }
        }

        setTimeout(() => {
          clsObserver.disconnect()
          longTaskObserver.disconnect()

          // Calcular tamaños de recursos
          const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
          let jsSize = 0
          let cssSize = 0

          resources.forEach((r) => {
            const name = r.name
            const size = (r as any).transferSize || 0
            if (name.includes(componentSelector) || name.includes(componentSelector.replace(/[#.]/g, ''))) {
              if (name.endsWith('.js') || name.includes('chunk')) {
                jsSize += size
              } else if (name.endsWith('.css')) {
                cssSize += size
              }
            }
          })

          resolve({
            renderTime: 0, // Se calcula fuera
            networkRequests: resources.length,
            networkSize: resources.reduce((sum, r) => sum + ((r as any).transferSize || 0), 0),
            imagesLoaded: images.length,
            imagesSize,
            jsSize,
            cssSize,
            layoutShifts,
            longTasks,
            interactionDelay: interactionDelay > 0 ? interactionDelay : undefined,
          })
        }, 2000)
      })
    },
    { componentSelector, interactionSelector }
  )

  // Filtrar requests relacionadas con el componente
  const componentRequests = requests.filter((r) => {
    const url = r.url.toLowerCase()
    return url.includes(componentSelector.toLowerCase().replace(/[#.]/g, '')) || 
           url.includes(waitForSelector.toLowerCase().replace(/[#.]/g, ''))
  })

  return {
    ...metrics,
    renderTime,
    networkRequests: componentRequests.length,
    networkSize: componentRequests.reduce((sum, r) => sum + r.size, 0),
  }
}

// ===================================
// THROTTLING
// ===================================

/**
 * Configura CPU throttling
 */
export async function setCPUThrottling(page: Page, rate: number) {
  try {
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate })
    await client.detach()
  } catch (e) {
    console.warn(`No se pudo configurar CPU throttling: ${e}`)
  }
}

/**
 * Configura network throttling
 */
export async function setNetworkThrottling(page: Page, download: number, upload: number, latency: number) {
  try {
    const client = await page.context().newCDPSession(page)
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: download,
      uploadThroughput: upload,
      latency,
    })
    await client.detach()
  } catch (e) {
    console.warn(`No se pudo configurar network throttling: ${e}`)
  }
}

// ===================================
// UTILITIES
// ===================================

/**
 * Scroll suave hasta un componente
 */
export async function scrollToComponent(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, selector)
  await page.waitForTimeout(500) // Esperar animación de scroll
}


