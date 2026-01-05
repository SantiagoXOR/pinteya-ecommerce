// ===================================
// HOOK: usePerformanceTracking - Tracking automático de performance
// ===================================

import { useEffect, useCallback, useRef } from 'react'
import { productionMonitor, useProductionMonitoring } from '../config/production-monitoring'

interface PerformanceData {
  LCP?: number
  FID?: number
  CLS?: number
  FCP?: number
  TTI?: number
  renderTime?: number
  bundleSize?: number
}

interface TrackingOptions {
  enabled?: boolean
  endpoint?: string
  batchSize?: number
  flushInterval?: number
  includeUserAgent?: boolean
  includeConnection?: boolean
  enableProductionMonitoring?: boolean
  sampleRate?: number // ⚡ OPTIMIZACIÓN: Muestreo probabilístico
  enableDetailedTracking?: boolean // ⚡ OPTIMIZACIÓN: Habilitar observers no críticos
}

const defaultOptions: TrackingOptions = {
  enabled: true,
  endpoint: '/api/admin/performance/metrics',
  batchSize: 10,
  flushInterval: 60000, // ⚡ OPTIMIZACIÓN: 60 segundos (reducido de 30s)
  includeUserAgent: true,
  includeConnection: true,
  enableProductionMonitoring: process.env.NODE_ENV === 'production',
  sampleRate: 0.1, // ⚡ OPTIMIZACIÓN: 10% de muestreo por defecto
  enableDetailedTracking: process.env.ENABLE_DETAILED_PERFORMANCE_TRACKING === 'true', // ⚡ OPTIMIZACIÓN: Deshabilitado por defecto
}

/**
 * Hook para tracking automático de métricas de performance
 */
export const usePerformanceTracking = (options: TrackingOptions = {}) => {
  const config = { ...defaultOptions, ...options }
  const metricsQueue = useRef<PerformanceData[]>([])
  const observers = useRef<PerformanceObserver[]>([])
  const flushTimer = useRef<NodeJS.Timeout | null>(null)
  const { trackWebVital, trackPerformance } = useProductionMonitoring()

  // Función para enviar métricas al servidor
  const sendMetrics = useCallback(
    async (metrics: PerformanceData[]) => {
      if (!config.enabled || metrics.length === 0) {
        return
      }

      try {
        // Agregar validación de métricas
        const validMetrics = metrics.filter(
          metric => metric && typeof metric === 'object' && Object.keys(metric).length > 0
        )

        if (validMetrics.length === 0) {
          console.warn('No valid metrics to send')
          return
        }

        const payload = {
          metrics: validMetrics, // Enviar todas las métricas válidas
          url: window.location.pathname,
          userAgent: config.includeUserAgent ? navigator.userAgent : undefined,
          connection: config.includeConnection ? getConnectionInfo() : undefined,
          timestamp: Date.now(),
          batchSize: validMetrics.length,
        }

        const response = await fetch(config.endpoint!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.warn('Failed to send performance metrics:', error)
        // En caso de error, no reintentar automáticamente para evitar spam
      }
    },
    [config]
  )

  // Función para agregar métrica a la cola
  const queueMetric = useCallback(
    (metric: PerformanceData) => {
      // ⚡ OPTIMIZACIÓN: Aplicar muestreo probabilístico
      const sampleRate = config.sampleRate ?? 0.1
      if (Math.random() >= sampleRate) {
        return // No trackear esta métrica
      }

      metricsQueue.current.push(metric)

      // Send to production monitoring if enabled
      if (config.enableProductionMonitoring) {
        Object.entries(metric).forEach(([key, value]) => {
          if (value !== undefined) {
            trackWebVital(key, value, `${key}-${Date.now()}`)
          }
        })
      }

      // Flush si alcanzamos el tamaño del batch
      if (metricsQueue.current.length >= config.batchSize!) {
        flushMetrics()
      }
    },
    [config.batchSize, config.enableProductionMonitoring, config.sampleRate, trackWebVital]
  )

  // Función para enviar todas las métricas en cola
  const flushMetrics = useCallback(() => {
    if (metricsQueue.current.length > 0) {
      sendMetrics([...metricsQueue.current])
      metricsQueue.current = []
    }
  }, [sendMetrics])

  // Inicializar observers de performance
  useEffect(() => {
    if (!config.enabled || typeof window === 'undefined') {
      return
    }

    // Observer para LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) {
            queueMetric({ LCP: lastEntry.startTime })
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        observers.current.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer not supported')
      }

      // Observer para FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            queueMetric({ FID: entry.processingStart - entry.startTime })
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        observers.current.push(fidObserver)
      } catch (e) {
        console.warn('FID observer not supported')
      }

      // ⚡ OPTIMIZACIÓN: CLS y TTI solo si detailed tracking está habilitado
      if (config.enableDetailedTracking) {
        // Observer para CLS (Cumulative Layout Shift)
        try {
          let clsValue = 0
          const clsObserver = new PerformanceObserver(list => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
              }
            })
            queueMetric({ CLS: clsValue })
          })
          clsObserver.observe({ entryTypes: ['layout-shift'] })
          observers.current.push(clsObserver)
        } catch (e) {
          console.warn('CLS observer not supported')
        }

        // Observer para Navigation Timing (incluye TTI)
        try {
          const navObserver = new PerformanceObserver(list => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              queueMetric({
                FCP: entry.firstContentfulPaint,
                TTI: entry.domInteractive,
              })
            })
          })
          navObserver.observe({ entryTypes: ['navigation'] })
          observers.current.push(navObserver)
        } catch (e) {
          console.warn('Navigation observer not supported')
        }
      } else {
        // ⚡ OPTIMIZACIÓN: Solo trackear FCP (más crítico) sin TTI
        try {
          const navObserver = new PerformanceObserver(list => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              queueMetric({
                FCP: entry.firstContentfulPaint,
                // TTI deshabilitado para reducir overhead
              })
            })
          })
          navObserver.observe({ entryTypes: ['navigation'] })
          observers.current.push(navObserver)
        } catch (e) {
          console.warn('Navigation observer not supported')
        }
      }
    }

    // Configurar timer para flush automático
    flushTimer.current = setInterval(flushMetrics, config.flushInterval)

    // Cleanup al desmontar
    return () => {
      observers.current.forEach(observer => observer.disconnect())
      observers.current = []

      if (flushTimer.current) {
        clearInterval(flushTimer.current)
        flushTimer.current = null
      }

      // Flush final
      flushMetrics()
    }
  }, [config.enabled, config.flushInterval, config.enableDetailedTracking, queueMetric, flushMetrics])

  // Función manual para trackear render time
  const trackRenderTime = useCallback(
    (componentName: string, renderTime: number) => {
      // Send to production monitoring
      if (config.enableProductionMonitoring) {
        trackPerformance({
          name: 'renderTime',
          value: renderTime,
          category: 'component',
          metadata: { componentName },
        })
      }

      queueMetric({
        renderTime,
        // Agregar información del componente como metadata
      })
    },
    [queueMetric, config.enableProductionMonitoring, trackPerformance]
  )

  // Función para trackear bundle size
  const trackBundleSize = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    // Calcular tamaño aproximado del bundle basado en scripts cargados
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    let totalSize = 0

    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src
      if (src.includes('_next') || src.includes('chunk')) {
        // Estimación basada en el nombre del archivo
        totalSize += 100 // KB estimado por chunk
      }
    })

    queueMetric({ bundleSize: totalSize })
  }, [queueMetric])

  // Función para obtener métricas actuales
  const getCurrentMetrics = useCallback((): PerformanceData | null => {
    if (typeof window === 'undefined') {
      return null
    }

    const navigation = performance.getEntriesByType('navigation')[0] as any
    if (!navigation) {
      return null
    }

    return {
      FCP: navigation.firstContentfulPaint,
      TTI: navigation.domInteractive,
      renderTime: performance.now(),
    }
  }, [])

  return {
    trackRenderTime,
    trackBundleSize,
    getCurrentMetrics,
    flushMetrics,
    isEnabled: config.enabled,
    queueSize: metricsQueue.current.length,
  }
}

// Función helper para obtener información de conexión
function getConnectionInfo(): string {
  if (typeof navigator === 'undefined') {
    return 'unknown'
  }

  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection

  if (connection) {
    return `${connection.effectiveType || 'unknown'} (${connection.downlink || 'unknown'}Mbps)`
  }

  return 'unknown'
}

/**
 * Hook simplificado para componentes que quieren trackear su render time
 */
export const useComponentPerformance = (componentName: string) => {
  const { trackRenderTime } = usePerformanceTracking()
  const startTime = useRef<number>(0)

  useEffect(() => {
    startTime.current = performance.now()

    return () => {
      const renderTime = performance.now() - startTime.current
      trackRenderTime(componentName, renderTime)
    }
  }, [componentName, trackRenderTime])

  const measureOperation = useCallback(
    (operationName: string, operation: () => void) => {
      const start = performance.now()
      operation()
      const end = performance.now()
      trackRenderTime(`${componentName}.${operationName}`, end - start)
    },
    [componentName, trackRenderTime]
  )

  return { measureOperation }
}

export default usePerformanceTracking
