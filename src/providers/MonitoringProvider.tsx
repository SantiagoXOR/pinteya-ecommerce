'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { proactiveMonitoring, startMonitoring } from '../lib/monitoring/proactive-monitoring'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { ErrorBoundaryWrapper } from '../components/ErrorBoundary'

interface MonitoringContextType {
  isInitialized: boolean
  isMonitoring: boolean
  error: string | null
}

const MonitoringContext = createContext<MonitoringContextType>({
  isInitialized: false,
  isMonitoring: false,
  error: null,
})

export const useMonitoring = () => {
  const context = useContext(MonitoringContext)
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider')
  }
  return context
}

interface MonitoringProviderProps {
  children: ReactNode
  autoStart?: boolean
  enableErrorBoundary?: boolean
}

export function MonitoringProvider({
  children,
  autoStart = true,
  enableErrorBoundary = true,
}: MonitoringProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        logger.info(
          LogLevel.INFO,
          'Initializing proactive monitoring system',
          {},
          LogCategory.SYSTEM
        )

        // Configurar el sistema de monitoreo
        proactiveMonitoring.updateConfig({
          enabled: true,
          checkInterval: 30, // 30 segundos
          errorThreshold: 5, // 5% de errores
          responseTimeThreshold: 2000, // 2 segundos
          memoryThreshold: 80, // 80% de memoria
          cpuThreshold: 80, // 80% de CPU
          enableAutoRecovery: false, // Deshabilitado por seguridad
          notificationChannels: ['email', 'slack'],
        })

        // Iniciar monitoreo automáticamente si está habilitado
        if (autoStart) {
          startMonitoring()
          setIsMonitoring(true)
          logger.info(
            LogLevel.INFO,
            'Proactive monitoring started automatically',
            {},
            LogCategory.SYSTEM
          )
        }

        // Configurar listeners para errores no capturados
        if (typeof window !== 'undefined') {
          // Errores de JavaScript no capturados
          window.addEventListener('error', handleGlobalError)

          // Promesas rechazadas no capturadas
          window.addEventListener('unhandledrejection', handleUnhandledRejection)

          // Errores de recursos (imágenes, scripts, etc.)
          window.addEventListener('error', handleResourceError, true)
        }

        setIsInitialized(true)
        setError(null)

        logger.info(
          LogLevel.INFO,
          'Proactive monitoring system initialized successfully',
          {
            autoStart,
            enableErrorBoundary,
          },
          LogCategory.SYSTEM
        )
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize monitoring'
        setError(errorMessage)
        logger.error(
          LogLevel.ERROR,
          'Failed to initialize monitoring system',
          {
            error: errorMessage,
          },
          LogCategory.SYSTEM
        )
      }
    }

    initializeMonitoring()

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleGlobalError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        window.removeEventListener('error', handleResourceError, true)
      }
    }
  }, [autoStart])

  const handleGlobalError = async (event: ErrorEvent) => {
    try {
      await proactiveMonitoring.reportError(event.error || new Error(event.message), {
        source: 'global_error_handler',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    } catch (reportingError) {
      logger.error(
        LogLevel.ERROR,
        'Failed to report global error',
        {
          originalError: event.message,
          reportingError:
            reportingError instanceof Error ? reportingError.message : 'Unknown error',
        },
        LogCategory.SYSTEM
      )
    }
  }

  const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
    try {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      await proactiveMonitoring.reportError(error, {
        source: 'unhandled_promise_rejection',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        reason: String(event.reason),
      })
    } catch (reportingError) {
      logger.error(
        LogLevel.ERROR,
        'Failed to report unhandled promise rejection',
        {
          originalReason: String(event.reason),
          reportingError:
            reportingError instanceof Error ? reportingError.message : 'Unknown error',
        },
        LogCategory.SYSTEM
      )
    }
  }

  const handleResourceError = async (event: Event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement
      const tagName = target.tagName?.toLowerCase()
      const src = (target as any).src || (target as any).href

      if (src && ['img', 'script', 'link', 'iframe'].includes(tagName)) {
        // ⚡ FIX: No reportar errores de CSS no críticos como errores críticos
        // Los CSS diferidos (como hero-carousel.css, home-v2-animations.css) son opcionales
        const isOptionalCSS = 
          tagName === 'link' && 
          (src.includes('hero-carousel.css') || 
           src.includes('home-v2-animations.css') ||
           src.includes('checkout-transition.css') ||
           src.includes('mobile-modals.css') ||
           src.includes('collapsible.css'))

        if (isOptionalCSS) {
          // Solo loguear en desarrollo, no reportar como error crítico
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Optional CSS failed to load: ${src} - This is not critical`)
          }
          return // No reportar como error
        }

        // ✅ FIX: Filtrar errores de imágenes que ya tienen fallback
        // Next.js Image maneja errores internamente y muestra placeholders
        // No necesitamos reportar estos errores como críticos
        if (tagName === 'img') {
          // Verificar si es una imagen de producto (tiene fallback)
          const isProductImage = src.includes('supabase.co') || 
                                src.includes('_next/image') ||
                                src.includes('/images/products/')
          
          if (isProductImage) {
            // Solo loguear en desarrollo, no reportar como error crítico
            // Los componentes de imagen ya manejan estos errores con placeholders
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⚠️ Product image failed to load (has fallback): ${src}`)
            }
            return // No reportar como error crítico
          }
        }

        try {
          await proactiveMonitoring.reportError(
            new Error(`Resource loading failed: ${tagName} - ${src}`),
            {
              source: 'resource_error',
              resourceType: tagName,
              resourceUrl: src,
              timestamp: new Date().toISOString(),
              url: window.location.href,
            }
          )
        } catch (reportingError) {
          logger.error(
            LogLevel.ERROR,
            'Failed to report resource error',
            {
              resourceUrl: src,
              resourceType: tagName,
              reportingError:
                reportingError instanceof Error ? reportingError.message : 'Unknown error',
            },
            LogCategory.SYSTEM
          )
        }
      }
    }
  }

  const contextValue: MonitoringContextType = {
    isInitialized,
    isMonitoring,
    error,
  }

  const content = (
    <MonitoringContext.Provider value={contextValue}>{children}</MonitoringContext.Provider>
  )

  // Envolver con Error Boundary si está habilitado
  if (enableErrorBoundary) {
    return (
      <ErrorBoundaryWrapper
        showDetails={process.env.NODE_ENV === 'development'}
        enableReporting={true}
      >
        {content}
      </ErrorBoundaryWrapper>
    )
  }

  return content
}

/**
 * Hook para reportar errores manualmente desde componentes
 */
export function useErrorReporting() {
  const { isInitialized } = useMonitoring()

  const reportError = React.useCallback(
    async (error: Error | string, context?: Record<string, any>) => {
      if (!isInitialized) {
        logger.warn(
          LogLevel.WARN,
          'Monitoring not initialized, error not reported',
          {
            error: error instanceof Error ? error.message : error,
          },
          LogCategory.SYSTEM
        )
        return
      }

      try {
        await proactiveMonitoring.reportError(error, {
          ...context,
          source: 'manual_report',
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        })
      } catch (reportingError) {
        logger.error(
          LogLevel.ERROR,
          'Failed to report error manually',
          {
            originalError: error instanceof Error ? error.message : error,
            reportingError:
              reportingError instanceof Error ? reportingError.message : 'Unknown error',
          },
          LogCategory.SYSTEM
        )
      }
    },
    [isInitialized]
  )

  return { reportError, isInitialized }
}

/**
 * Hook para obtener estadísticas de monitoreo
 */
export function useMonitoringStats() {
  const { isInitialized } = useMonitoring()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const refreshStats = React.useCallback(async () => {
    if (!isInitialized) {
      return
    }

    try {
      setLoading(true)
      const newStats = await proactiveMonitoring.getMonitoringStats()
      setStats(newStats)
    } catch (error) {
      logger.error(
        LogLevel.ERROR,
        'Failed to fetch monitoring stats',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        LogCategory.SYSTEM
      )
    } finally {
      setLoading(false)
    }
  }, [isInitialized])

  React.useEffect(() => {
    if (isInitialized) {
      refreshStats()

      // Actualizar estadísticas cada 30 segundos
      const interval = setInterval(refreshStats, 30000)
      return () => clearInterval(interval)
    }
  }, [isInitialized, refreshStats])

  return { stats, loading, refreshStats }
}

/**
 * Componente de estado del monitoreo (para debugging)
 */
export function MonitoringStatus() {
  const { isInitialized, isMonitoring, error } = useMonitoring()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className='fixed bottom-4 right-4 z-50 bg-black text-white text-xs p-2 rounded shadow-lg'>
      <div>Monitoring: {isInitialized ? '✅' : '❌'}</div>
      <div>Active: {isMonitoring ? '✅' : '❌'}</div>
      {error && (
        <div className='text-red-300'>
          Error: {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
        </div>
      )}
    </div>
  )
}
