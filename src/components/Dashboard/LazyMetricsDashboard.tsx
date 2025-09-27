// ===================================
// PINTEYA E-COMMERCE - LAZY METRICS DASHBOARD
// ===================================

'use client'

import React, { lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'

// Lazy loading del dashboard principal
const MetricsDashboard = lazy(() => import('./MetricsDashboard'))

// Componente de loading
function DashboardSkeleton() {
  return (
    <div className='space-y-6 animate-pulse'>
      {/* Header skeleton */}
      <div className='flex justify-between items-center'>
        <div>
          <div className='h-8 bg-gray-200 rounded w-64 mb-2'></div>
          <div className='h-4 bg-gray-200 rounded w-96'></div>
        </div>
        <div className='flex gap-4'>
          <div className='h-10 bg-gray-200 rounded w-32'></div>
          <div className='h-10 bg-gray-200 rounded w-32'></div>
          <div className='h-10 bg-gray-200 rounded w-24'></div>
        </div>
      </div>

      {/* Metrics cards skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='h-4 bg-gray-200 rounded w-24'></div>
              <div className='h-4 w-4 bg-gray-200 rounded'></div>
            </CardHeader>
            <CardContent>
              <div className='h-8 bg-gray-200 rounded w-16 mb-2'></div>
              <div className='h-3 bg-gray-200 rounded w-32'></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Endpoint cards skeleton */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className='h-6 bg-gray-200 rounded w-48'></div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j}>
                    <div className='h-3 bg-gray-200 rounded w-12 mb-1'></div>
                    <div className='h-4 bg-gray-200 rounded w-16'></div>
                  </div>
                ))}
              </div>
              <div className='border-t pt-4'>
                <div className='h-4 bg-gray-200 rounded w-32 mb-2'></div>
                <div className='grid grid-cols-2 gap-2'>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className='h-3 bg-gray-200 rounded w-20'></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Componente de error
function DashboardError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center h-64 space-y-4'>
      <div className='text-red-500 text-center'>
        <h3 className='text-lg font-semibold mb-2'>Error al cargar el dashboard</h3>
        <p className='text-sm text-gray-600'>{error.message}</p>
      </div>
      <button
        onClick={retry}
        className='flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
      >
        <RefreshCw className='w-4 h-4 mr-2' />
        Reintentar
      </button>
    </div>
  )
}

// Componente principal con lazy loading
export default function LazyMetricsDashboard() {
  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <Suspense fallback={<DashboardSkeleton />}>
        <ErrorBoundary>
          <MetricsDashboard />
        </ErrorBoundary>
      </Suspense>
    </div>
  )
}

// Error boundary para manejar errores de carga
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <DashboardError
          error={this.state.error || new Error('Unknown error')}
          retry={() => this.setState({ hasError: false, error: undefined })}
        />
      )
    }

    return this.props.children
  }
}

// Hook para precargar el dashboard
export function usePrefetchDashboard() {
  const prefetch = () => {
    // Precargar el componente
    import('./MetricsDashboard')

    // Precargar datos de métricas
    fetch('/api/metrics?hours=1').catch(() => {
      // Ignorar errores de precarga
    })
  }

  return { prefetch }
}

// Componente de precarga para usar en otras páginas
export function DashboardPrefetch() {
  const { prefetch } = usePrefetchDashboard()

  React.useEffect(() => {
    // Precargar después de un pequeño delay
    const timer = setTimeout(prefetch, 1000)
    return () => clearTimeout(timer)
  }, [prefetch])

  return null
}
