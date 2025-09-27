// =====================================================
// COMPONENTE: ERROR BOUNDARY
// Descripción: Componente para manejo de errores con UI elegante
// Basado en: React Error Boundary patterns + shadcn/ui
// =====================================================

'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  title?: string
  description?: string
  showDetails?: boolean
  onRetry?: () => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className='min-h-[400px] flex items-center justify-center p-6'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <div className='mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4'>
                <AlertTriangle className='w-6 h-6 text-red-600' />
              </div>
              <CardTitle className='text-red-900'>{this.props.title || 'Algo salió mal'}</CardTitle>
              <CardDescription>
                {this.props.description ||
                  'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {this.props.showDetails && this.state.error && (
                <div className='bg-gray-50 p-3 rounded-md'>
                  <p className='text-sm font-medium text-gray-900 mb-1'>Error técnico:</p>
                  <p className='text-xs text-gray-600 font-mono'>{this.state.error.message}</p>
                </div>
              )}

              <div className='flex flex-col sm:flex-row gap-2'>
                <Button onClick={this.handleRetry} className='flex items-center gap-2 flex-1'>
                  <RefreshCw className='w-4 h-4' />
                  Reintentar
                </Button>
                <Button
                  variant='outline'
                  onClick={this.handleGoHome}
                  className='flex items-center gap-2 flex-1'
                >
                  <Home className='w-4 h-4' />
                  Ir al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version para componentes funcionales
export function useErrorBoundary() {
  return {
    captureError: (error: Error) => {
      throw error
    },
  }
}
