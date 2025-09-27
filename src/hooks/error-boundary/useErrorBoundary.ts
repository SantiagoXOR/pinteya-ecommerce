'use client'

// ===================================
// USE ERROR BOUNDARY HOOK
// ===================================
// Hook para manejo programático de errores y integración con Error Boundaries

import { useCallback, useEffect, useState } from 'react'
import { errorBoundaryManager } from '@/lib/error-boundary/error-boundary-manager'
import type { ErrorMetrics } from '@/lib/error-boundary/error-boundary-manager'

// ===================================
// INTERFACES
// ===================================

interface UseErrorBoundaryOptions {
  onError?: (error: Error, errorInfo: any) => void
  enableRetry?: boolean
  maxRetries?: number
  retryDelay?: number
  component?: string
  level?: 'page' | 'section' | 'component'
}

interface UseErrorBoundaryReturn {
  // Estado
  hasError: boolean
  error: Error | null
  retryCount: number
  isRetrying: boolean

  // Acciones
  captureError: (error: Error, context?: any) => void
  retry: () => void
  reset: () => void

  // Métricas
  errorMetrics: ErrorMetrics[]
  healthStatus: ReturnType<typeof errorBoundaryManager.getHealthStatus>
}

// ===================================
// HOOK PRINCIPAL
// ===================================

export const useErrorBoundary = (options: UseErrorBoundaryOptions = {}): UseErrorBoundaryReturn => {
  const {
    onError,
    enableRetry = true,
    maxRetries = 3,
    retryDelay = 1000,
    component = 'unknown',
    level = 'component',
  } = options

  // Estado local
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [errorMetrics, setErrorMetrics] = useState<ErrorMetrics[]>([])
  const [healthStatus, setHealthStatus] = useState(errorBoundaryManager.getHealthStatus())

  // ===================================
  // CAPTURA DE ERRORES
  // ===================================

  const captureError = useCallback(
    (error: Error, context: any = {}) => {
      const errorId = `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Actualizar estado local
      setHasError(true)
      setError(error)

      // Reportar al manager
      errorBoundaryManager.reportError(error, context, {
        errorId,
        level,
        component,
        retryCount,
      })

      // Callback personalizado
      if (onError) {
        onError(error, { ...context, errorId, component, level })
      }

      console.error(`🚨 Error captured by useErrorBoundary (${component}):`, error)
    },
    [onError, level, component, retryCount]
  )

  // ===================================
  // MANEJO DE REINTENTOS
  // ===================================

  const retry = useCallback(async () => {
    if (!enableRetry || retryCount >= maxRetries) {
      console.warn('🔄 Retry not available or max retries reached')
      return
    }

    setIsRetrying(true)

    try {
      // Esperar delay con backoff exponencial
      const delay = retryDelay * Math.pow(2, retryCount)
      await new Promise(resolve => setTimeout(resolve, delay))

      // Incrementar contador
      setRetryCount(prev => prev + 1)

      // Reset error state
      setHasError(false)
      setError(null)

      console.log(`🔄 Retry attempt ${retryCount + 1} for component ${component}`)
    } catch (retryError) {
      console.error('❌ Error during retry:', retryError)
      captureError(retryError as Error, { context: 'retry_failed' })
    } finally {
      setIsRetrying(false)
    }
  }, [enableRetry, retryCount, maxRetries, retryDelay, component, captureError])

  // ===================================
  // RESET
  // ===================================

  const reset = useCallback(() => {
    setHasError(false)
    setError(null)
    setRetryCount(0)
    setIsRetrying(false)

    console.log(`🔄 Error boundary reset for component ${component}`)
  }, [component])

  // ===================================
  // EFECTOS
  // ===================================

  // Listener para métricas de errores
  useEffect(() => {
    const handleErrorUpdate = (errorMetric: ErrorMetrics) => {
      setErrorMetrics(prev => [errorMetric, ...prev.slice(0, 9)]) // Mantener últimos 10
      setHealthStatus(errorBoundaryManager.getHealthStatus())
    }

    errorBoundaryManager.addErrorListener(handleErrorUpdate)

    return () => {
      errorBoundaryManager.removeErrorListener(handleErrorUpdate)
    }
  }, [])

  // Auto-retry para ciertos tipos de errores
  useEffect(() => {
    if (hasError && error && enableRetry && retryCount < maxRetries) {
      const errorType = error.name.toLowerCase()

      // Auto-retry para errores de red
      if (errorType.includes('network') || errorType.includes('fetch')) {
        const autoRetryDelay = 2000 + retryCount * 1000
        const timeoutId = setTimeout(retry, autoRetryDelay)

        return () => clearTimeout(timeoutId)
      }
    }
  }, [hasError, error, enableRetry, retryCount, maxRetries, retry])

  // Cleanup de métricas antiguas
  useEffect(() => {
    const cleanup = () => {
      errorBoundaryManager.clearOldErrors()
    }

    const intervalId = setInterval(cleanup, 60000) // Cada minuto

    return () => clearInterval(intervalId)
  }, [])

  // ===================================
  // RETURN
  // ===================================

  return {
    // Estado
    hasError,
    error,
    retryCount,
    isRetrying,

    // Acciones
    captureError,
    retry,
    reset,

    // Métricas
    errorMetrics,
    healthStatus,
  }
}

// ===================================
// HOOK PARA ASYNC OPERATIONS
// ===================================

interface UseAsyncErrorBoundaryOptions extends UseErrorBoundaryOptions {
  onSuccess?: (data: any) => void
  onFinally?: () => void
}

export const useAsyncErrorBoundary = <T = any>(
  asyncFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAsyncErrorBoundaryOptions = {}
) => {
  const errorBoundary = useErrorBoundary(options)
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const execute = useCallback(async () => {
    setIsLoading(true)
    errorBoundary.reset()

    try {
      const result = await asyncFn()
      setData(result)

      if (options.onSuccess) {
        options.onSuccess(result)
      }

      return result
    } catch (error) {
      errorBoundary.captureError(error as Error, {
        context: 'async_operation',
        operation: asyncFn.name || 'anonymous',
      })
      throw error
    } finally {
      setIsLoading(false)

      if (options.onFinally) {
        options.onFinally()
      }
    }
  }, [asyncFn, errorBoundary, options])

  // Auto-execute en cambios de dependencias
  useEffect(() => {
    execute()
  }, dependencies)

  return {
    ...errorBoundary,
    data,
    isLoading,
    execute,
  }
}

// ===================================
// HOOK PARA COMPONENTES CRÍTICOS
// ===================================

export const useCriticalErrorBoundary = (component: string) => {
  return useErrorBoundary({
    component,
    level: 'page',
    enableRetry: true,
    maxRetries: 2,
    retryDelay: 2000,
    onError: (error, errorInfo) => {
      // Reportar errores críticos inmediatamente
      console.error(`🚨 CRITICAL ERROR in ${component}:`, error)

      // Enviar notificación urgente
      if (typeof window !== 'undefined') {
        fetch('/api/monitoring/critical-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            component,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
            errorInfo,
            timestamp: Date.now(),
            url: window.location.href,
          }),
        }).catch(console.error)
      }
    },
  })
}

// ===================================
// HOOK PARA MÉTRICAS GLOBALES
// ===================================

export const useErrorMetrics = () => {
  const [metrics, setMetrics] = useState(errorBoundaryManager.getErrorMetrics())
  const [healthStatus, setHealthStatus] = useState(errorBoundaryManager.getHealthStatus())

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(errorBoundaryManager.getErrorMetrics())
      setHealthStatus(errorBoundaryManager.getHealthStatus())
    }

    // Actualizar métricas cada 30 segundos
    const intervalId = setInterval(updateMetrics, 30000)

    // Listener para actualizaciones inmediatas
    const handleErrorUpdate = () => {
      updateMetrics()
    }

    errorBoundaryManager.addErrorListener(handleErrorUpdate)

    return () => {
      clearInterval(intervalId)
      errorBoundaryManager.removeErrorListener(handleErrorUpdate)
    }
  }, [])

  return {
    metrics,
    healthStatus,
    refresh: () => {
      setMetrics(errorBoundaryManager.getErrorMetrics())
      setHealthStatus(errorBoundaryManager.getHealthStatus())
    },
  }
}
