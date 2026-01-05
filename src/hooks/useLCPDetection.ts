/**
 * Hook para detectar LCP (Largest Contentful Paint) y cargar contenido después
 * Optimizado para mejorar métricas de performance
 */

import { useEffect, useState, useCallback } from 'react'

interface UseLCPDetectionOptions {
  /**
   * Tiempo de espera después de detectar LCP antes de cargar contenido (ms)
   * @default 2000
   */
  delayAfterLCP?: number
  
  /**
   * Tiempo máximo de espera si LCP no se detecta (ms)
   * @default 3000
   */
  maxWaitTime?: number
  
  /**
   * Callback cuando LCP es detectado
   */
  onLCPDetected?: (lcpTime: number) => void
  
  /**
   * Si debe usar requestIdleCallback para cargar contenido
   * @default true
   */
  useIdleCallback?: boolean
}

interface UseLCPDetectionReturn {
  /**
   * Si LCP ha sido detectado
   */
  lcpDetected: boolean
  
  /**
   * Tiempo del LCP en ms
   */
  lcpTime: number
  
  /**
   * Si el contenido debe cargarse
   */
  shouldLoad: boolean
  
  /**
   * Función para forzar la carga del contenido
   */
  forceLoad: () => void
}

/**
 * Hook para detectar LCP y cargar contenido después de forma optimizada
 */
export const useLCPDetection = (
  options: UseLCPDetectionOptions = {}
): UseLCPDetectionReturn => {
  const {
    delayAfterLCP = 2000,
    maxWaitTime = 3000,
    onLCPDetected,
    useIdleCallback = true,
  } = options

  const [lcpDetected, setLcpDetected] = useState(false)
  const [lcpTime, setLcpTime] = useState(0)
  const [shouldLoad, setShouldLoad] = useState(false)

  const forceLoad = useCallback(() => {
    setShouldLoad(true)
  }, [])

  const loadContent = useCallback(() => {
    if (useIdleCallback && 'requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          setShouldLoad(true)
        },
        { timeout: 500 }
      )
    } else {
      setTimeout(() => {
        setShouldLoad(true)
      }, 500)
    }
  }, [useIdleCallback])

  useEffect(() => {
    let lcpObserver: PerformanceObserver | null = null
    let fallbackTimeout: NodeJS.Timeout | null = null
    let loadTimeout: NodeJS.Timeout | null = null

    // Detectar LCP usando PerformanceObserver
    if ('PerformanceObserver' in window) {
      try {
        lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            renderTime?: number
            loadTime?: number
            startTime?: number
          }

          if (lastEntry && !lcpDetected) {
            const detectedTime =
              lastEntry.renderTime ||
              lastEntry.loadTime ||
              lastEntry.startTime ||
              0

            setLcpDetected(true)
            setLcpTime(detectedTime)

            if (onLCPDetected) {
              onLCPDetected(detectedTime)
            }

            // Cargar contenido después del delay
            loadTimeout = setTimeout(() => {
              loadContent()
            }, delayAfterLCP)
          }
        })

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // Fallback: Si LCP no se detecta en maxWaitTime, cargar de todas formas
        fallbackTimeout = setTimeout(() => {
          if (!lcpDetected) {
            loadTimeout = setTimeout(() => {
              loadContent()
            }, delayAfterLCP)
          }
        }, maxWaitTime)
      } catch (e) {
        // Si PerformanceObserver falla, usar delay fijo
        loadTimeout = setTimeout(() => {
          loadContent()
        }, delayAfterLCP)
      }
    } else {
      // Fallback para navegadores sin PerformanceObserver
      loadTimeout = setTimeout(() => {
        loadContent()
      }, delayAfterLCP)
    }

    return () => {
      if (lcpObserver) {
        lcpObserver.disconnect()
      }
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout)
      }
      if (loadTimeout) {
        clearTimeout(loadTimeout)
      }
    }
  }, [delayAfterLCP, maxWaitTime, lcpDetected, onLCPDetected, loadContent])

  return {
    lcpDetected,
    lcpTime,
    shouldLoad,
    forceLoad,
  }
}

