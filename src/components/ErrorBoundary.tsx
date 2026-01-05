'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { proactiveMonitoring } from '../lib/monitoring/proactive-monitoring'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { AlertTriangle, RefreshCw, Home, Bug } from '@/lib/optimized-imports'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  enableReporting?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Actualizar el estado para mostrar la UI de error
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Actualizar estado con información del error
    this.setState({ errorInfo })

    // Llamar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Reportar error al sistema de monitoreo si está habilitado
    if (this.props.enableReporting !== false) {
      try {
        await proactiveMonitoring.reportError(error, {
          errorBoundary: true,
          componentStack: errorInfo.componentStack,
          errorInfo: {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
          },
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          errorId: this.state.errorId,
        })
      } catch (reportingError) {
        logger.error(
          LogLevel.ERROR,
          'Failed to report error to monitoring system',
          {
            originalError: error.message,
            reportingError:
              reportingError instanceof Error ? reportingError.message : 'Unknown error',
          },
          LogCategory.SYSTEM
        )
      }
    }

    // Log del error
    logger.error(
      LogLevel.ERROR,
      'React Error Boundary caught an error',
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
      },
      LogCategory.UI
    )
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback
      }

      // UI de error por defecto
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
          <Card className='w-full max-w-2xl'>
            <CardHeader className='text-center'>
              <div className='mx-auto mb-4 h-12 w-12 text-red-500'>
                <AlertTriangle className='h-full w-full' />
              </div>
              <CardTitle className='text-2xl font-bold text-red-600'>
                ¡Oops! Algo salió mal
              </CardTitle>
              <CardDescription className='text-lg'>
                Se ha producido un error inesperado en la aplicación
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-6'>
              {/* Error ID para soporte */}
              {this.state.errorId && (
                <Alert>
                  <Bug className='h-4 w-4' />
                  <AlertDescription>
                    <strong>ID del Error:</strong> {this.state.errorId}
                    <br />
                    <span className='text-sm text-muted-foreground'>
                      Proporciona este ID al equipo de soporte para una asistencia más rápida
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Detalles del error (solo en desarrollo o si se habilita explícitamente) */}
              {this.props.showDetails && this.state.error && (
                <div className='space-y-4'>
                  <Alert variant='destructive'>
                    <AlertDescription>
                      <strong>Error:</strong> {this.state.error.message}
                    </AlertDescription>
                  </Alert>

                  {this.state.error.stack && (
                    <details className='text-sm'>
                      <summary className='cursor-pointer font-medium text-gray-700 hover:text-gray-900'>
                        Ver detalles técnicos
                      </summary>
                      <pre className='mt-2 whitespace-pre-wrap bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40'>
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <details className='text-sm'>
                      <summary className='cursor-pointer font-medium text-gray-700 hover:text-gray-900'>
                        Ver stack de componentes
                      </summary>
                      <pre className='mt-2 whitespace-pre-wrap bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40'>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <Button onClick={this.handleRetry} className='flex items-center'>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Intentar de nuevo
                </Button>

                <Button variant='outline' onClick={this.handleReload} className='flex items-center'>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Recargar página
                </Button>

                <Button variant='outline' onClick={this.handleGoHome} className='flex items-center'>
                  <Home className='h-4 w-4 mr-2' />
                  Ir al inicio
                </Button>
              </div>

              {/* Información adicional */}
              <div className='text-center text-sm text-muted-foreground'>
                <p>Si el problema persiste, por favor contacta al equipo de soporte.</p>
                {this.props.enableReporting !== false && (
                  <p className='mt-1'>
                    Este error ha sido reportado automáticamente para su revisión.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook para usar Error Boundary de forma funcional
 */
export function useErrorHandler() {
  const reportError = React.useCallback(async (error: Error, context?: Record<string, any>) => {
    try {
      await proactiveMonitoring.reportError(error, {
        ...context,
        source: 'useErrorHandler',
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      })
    } catch (reportingError) {
      logger.error(
        LogLevel.ERROR,
        'Failed to report error via useErrorHandler',
        {
          originalError: error.message,
          reportingError:
            reportingError instanceof Error ? reportingError.message : 'Unknown error',
        },
        LogCategory.SYSTEM
      )
    }
  }, [])

  return { reportError }
}

/**
 * Componente wrapper para facilitar el uso de Error Boundary
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  showDetails?: boolean
  enableReporting?: boolean
}

export function ErrorBoundaryWrapper({
  children,
  fallback,
  showDetails = process.env.NODE_ENV === 'development',
  enableReporting = true,
}: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary fallback={fallback} showDetails={showDetails} enableReporting={enableReporting}>
      {children}
    </ErrorBoundary>
  )
}

/**
 * Error Boundary específico para páginas
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      enableReporting={true}
      fallback={
        <div className='min-h-screen flex items-center justify-center'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <CardTitle>Error en la página</CardTitle>
              <CardDescription>No se pudo cargar esta página correctamente</CardDescription>
            </CardHeader>
            <CardContent className='text-center'>
              <Button onClick={() => window.location.reload()} className='mr-2'>
                <RefreshCw className='h-4 w-4 mr-2' />
                Recargar
              </Button>
              <Button variant='outline' onClick={() => (window.location.href = '/')}>
                <Home className='h-4 w-4 mr-2' />
                Inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
