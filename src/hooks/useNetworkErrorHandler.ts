// ===================================
// HOOK: Network Error Handler
// ===================================

import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { registerErrorHandler, unregisterErrorHandler, suppressionPatterns } from '@/lib/error-handling/centralized-error-handler'

interface NetworkErrorHandlerOptions {
  enableLogging?: boolean
  enableRetry?: boolean
  maxRetries?: number
  retryDelay?: number
}

interface NetworkError {
  type: 'network' | 'timeout' | 'abort' | 'server' | 'unknown'
  originalError: any
  timestamp: number
  url?: string
  method?: string
}

export function useNetworkErrorHandler(options: NetworkErrorHandlerOptions = {}) {
  const {
    enableLogging = true,
    enableRetry = true,
    maxRetries = 3,
    retryDelay = 1000
  } = options

  const queryClient = useQueryClient()

  const classifyError = useCallback((error: any): NetworkError => {
    const timestamp = Date.now()
    
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      return { type: 'abort', originalError: error, timestamp }
    }
    
    if (error?.message?.includes('timeout') || error?.code === 'TIMEOUT') {
      return { type: 'timeout', originalError: error, timestamp }
    }
    
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      return { type: 'network', originalError: error, timestamp }
    }
    
    if (error?.status >= 500) {
      return { type: 'server', originalError: error, timestamp }
    }
    
    return { type: 'unknown', originalError: error, timestamp }
  }, [])

  const handleNetworkError = useCallback((error: NetworkError) => {
    if (enableLogging && process.env.NODE_ENV === 'development') {
      console.debug(`🌐 Network Error [${error.type}]:`, error.originalError)
    }

    // Invalidar queries relacionadas si es necesario
    if (error.type === 'network' || error.type === 'timeout') {
      queryClient.invalidateQueries({ 
        predicate: (query) => query.state.status === 'error' 
      })
    }
  }, [enableLogging, queryClient])

  const setupGlobalErrorHandling = useCallback(() => {
    // Handler para el sistema centralizado
    const networkErrorHandler = (args: any[]): boolean => {
      const message = args.join(' ')
      
      // Verificar si es un AbortError que debemos suprimir
      if (suppressionPatterns.abortError(args)) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 [Network Suppressed AbortError]:', ...args)
        }
        return true // Indica que el error fue manejado
      }
      
      // Verificar otros errores de red que debemos suprimir
      if (suppressionPatterns.networkError(args)) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 [Network Suppressed NetworkError]:', ...args)
        }
        return true
      }
      
      // Para otros tipos de errores, permitir que continúen
      return false
    }

    // Registrar el handler con prioridad media (50)
    registerErrorHandler('network-error-handler', 50, networkErrorHandler)

    // Solo interceptar errores de unhandled promise rejections para AbortError
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.name === 'AbortError' ||
        event.reason?.message?.includes('aborted') ||
        event.reason?.message?.includes('The user aborted a request')
      ) {
        event.preventDefault()
        
        if (enableLogging && process.env.NODE_ENV === 'development') {
          console.debug('🔇 [Suppressed Unhandled AbortError]:', event.reason)
        }
        return
      }

      // Para otros errores, clasificar y manejar
      const networkError = classifyError(event.reason)
      handleNetworkError(networkError)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      unregisterErrorHandler('network-error-handler')
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 NetworkErrorHandler cleanup completed')
      }
    }
  }, [classifyError, handleNetworkError, enableLogging])

  useEffect(() => {
    const cleanup = setupGlobalErrorHandling()
    return cleanup
  }, [setupGlobalErrorHandling])

  // Función para crear un wrapper de fetch con manejo de errores
  const createFetchWrapper = useCallback(
    (baseUrl?: string) => {
      return async (url: string, options: RequestInit = {}) => {
        const fullUrl = baseUrl ? `${baseUrl}${url}` : url

        try {
          const response = await fetch(fullUrl, {
            ...options,
            // Agregar timeout por defecto
            signal: options.signal || AbortSignal.timeout(10000),
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          return response
        } catch (error) {
          const networkError = handleNetworkError(error, {
            type: 'wrapper',
            url: fullUrl,
            options,
          })

          // Re-throw el error para que pueda ser manejado por el código que llama
          throw networkError.originalError
        }
      }
    },
    [handleNetworkError]
  )

  return {
    handleNetworkError,
    classifyError,
    createFetchWrapper,
    setupGlobalErrorHandling,
  }
}

// Hook simplificado para uso básico
export function useNetworkErrorSuppression() {
  return useNetworkErrorHandler({
    enableLogging: false,
    enableRetry: false,
  })
}

// Hook para desarrollo con logging detallado
export function useNetworkErrorDebug() {
  return useNetworkErrorHandler({
    enableLogging: true,
    enableRetry: true,
    maxRetries: 5,
    retryDelay: 500,
  })
}
