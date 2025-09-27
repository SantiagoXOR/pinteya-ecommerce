// ===================================
// PINTEYA E-COMMERCE - PERFORMANCE OPTIMIZED HOOK
// Hook para optimización de performance con métricas en tiempo real
// ===================================

import { useEffect, useRef, useCallback, useMemo } from 'react'

// ===================================
// TIPOS Y INTERFACES
// ===================================

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  loadTime: number
  componentSize: number
}

interface PerformanceConfig {
  trackRender?: boolean
  trackMemory?: boolean
  componentName?: string
  threshold?: number
}

interface PerformanceHookReturn {
  metrics: PerformanceMetrics
  isOptimized: boolean
  optimizationScore: number
  recommendations: string[]
  startMeasurement: (name: string) => void
  endMeasurement: (name: string) => number
}

// ===================================
// PERFORMANCE OPTIMIZED HOOK
// ===================================

export function usePerformanceOptimized(config: PerformanceConfig = {}): PerformanceHookReturn {
  const {
    trackRender = true,
    trackMemory = true,
    componentName = 'Unknown',
    threshold = 16, // 60fps = 16ms per frame
  } = config

  const renderStartTime = useRef<number>(0)
  const measurements = useRef<Map<string, number>>(new Map())
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    loadTime: 0,
    componentSize: 0,
  })

  // ===================================
  // MEASUREMENT FUNCTIONS
  // ===================================

  const startMeasurement = useCallback((name: string) => {
    measurements.current.set(name, performance.now())
  }, [])

  const endMeasurement = useCallback(
    (name: string): number => {
      const startTime = measurements.current.get(name)
      if (!startTime) return 0

      const duration = performance.now() - startTime
      measurements.current.delete(name)

      // Log si excede el threshold
      if (duration > threshold) {
        console.warn(
          `[Performance] ${componentName}.${name}: ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`
        )
      }

      return duration
    },
    [componentName, threshold]
  )

  // ===================================
  // RENDER TRACKING
  // ===================================

  useEffect(() => {
    if (!trackRender) return

    renderStartTime.current = performance.now()

    return () => {
      const renderTime = performance.now() - renderStartTime.current
      metricsRef.current.renderTime = renderTime

      if (renderTime > threshold) {
        console.warn(`[Performance] ${componentName} render: ${renderTime.toFixed(2)}ms`)
      }
    }
  })

  // ===================================
  // MEMORY TRACKING
  // ===================================

  const memoryUsage = useMemo(() => {
    if (!trackMemory || typeof window === 'undefined') return 0

    // @ts-ignore - performance.memory es experimental
    const memory = (performance as any).memory
    if (!memory) return 0

    const usage = memory.usedJSHeapSize / 1024 / 1024 // MB
    metricsRef.current.memoryUsage = usage

    return usage
  }, [trackMemory])

  // ===================================
  // OPTIMIZATION ANALYSIS
  // ===================================

  const optimizationAnalysis = useMemo(() => {
    const metrics = metricsRef.current
    const recommendations: string[] = []
    let score = 100

    // Analizar render time
    if (metrics.renderTime > threshold) {
      score -= 20
      recommendations.push(
        `Render time (${metrics.renderTime.toFixed(2)}ms) excede threshold (${threshold}ms). Considera React.memo o useMemo.`
      )
    }

    // Analizar memory usage
    if (metrics.memoryUsage > 50) {
      // 50MB
      score -= 15
      recommendations.push(
        `Uso de memoria alto (${metrics.memoryUsage.toFixed(2)}MB). Revisa memory leaks.`
      )
    }

    // Recomendaciones generales
    if (score < 80) {
      recommendations.push('Considera implementar lazy loading para componentes pesados.')
      recommendations.push('Usa React.memo para componentes que no cambian frecuentemente.')
      recommendations.push('Implementa useMemo y useCallback para cálculos costosos.')
    }

    return {
      score: Math.max(0, score),
      recommendations,
      isOptimized: score >= 80,
    }
  }, [threshold])

  // ===================================
  // RETURN VALUE
  // ===================================

  return {
    metrics: {
      ...metricsRef.current,
      memoryUsage,
    },
    isOptimized: optimizationAnalysis.isOptimized,
    optimizationScore: optimizationAnalysis.score,
    recommendations: optimizationAnalysis.recommendations,
    startMeasurement,
    endMeasurement,
  }
}

// ===================================
// PERFORMANCE HOC
// ===================================

export function withPerformanceTracking<T extends object>(
  Component: React.ComponentType<T>,
  componentName?: string
) {
  return function PerformanceTrackedComponent(props: T) {
    const { startMeasurement, endMeasurement, isOptimized, optimizationScore } =
      usePerformanceOptimized({ componentName: componentName || Component.name })

    useEffect(() => {
      startMeasurement('mount')
      return () => {
        const mountTime = endMeasurement('mount')

        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${componentName || Component.name}:`, {
            mountTime: `${mountTime.toFixed(2)}ms`,
            isOptimized,
            score: `${optimizationScore}/100`,
          })
        }
      }
    }, [startMeasurement, endMeasurement, isOptimized, optimizationScore])

    return <Component {...props} />
  }
}

// ===================================
// PERFORMANCE UTILITIES
// ===================================

export const performanceUtils = {
  /**
   * Medir tiempo de ejecución de una función
   */
  measureFunction: <T extends (...args: any[]) => any>(fn: T, name: string): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now()
      const result = fn(...args)
      const duration = performance.now() - start

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
      }

      return result
    }) as T
  },

  /**
   * Debounce optimizado para performance
   */
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number): T => {
    let timeout: NodeJS.Timeout

    return ((...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }) as T
  },

  /**
   * Throttle optimizado para performance
   */
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle: boolean

    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }) as T
  },

  /**
   * Obtener métricas de performance del navegador
   */
  getBrowserMetrics: () => {
    if (typeof window === 'undefined') return null

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint:
        performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      // @ts-ignore
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
    }
  },
}

export default usePerformanceOptimized
