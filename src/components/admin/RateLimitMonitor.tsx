'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
} from '@/lib/optimized-imports'

interface MetricsSummary {
  totalEndpoints: number
  criticalEndpoints: number
  warningEndpoints: number
  excellentEndpoints: number
  avgResponseTime: number
  avgErrorRate: number
  timestamp: string
}

interface EndpointMetrics {
  totalRequests: number
  errorCount: number
  averageResponseTime: number
  errorRate: number
  status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL'
  lastUpdated: string
}

interface Recommendation {
  endpoint: string
  currentLimit: number
  recommendedLimit: number
  reason: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface RateLimitData {
  summary: MetricsSummary
  performanceReport: Record<string, EndpointMetrics>
  recommendations: Recommendation[]
  environment: string
}

export default function RateLimitMonitor() {
  const [data, setData] = useState<RateLimitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/rate-limit-metrics')

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        throw new Error(result.error || 'Error desconocido')
      }
    } catch (err) {
      console.error('Error fetching rate limit metrics:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchMetrics, 30000) // Refresh cada 30 segundos
    return () => clearInterval(interval)
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return 'bg-green-500'
      case 'GOOD':
        return 'bg-blue-500'
      case 'WARNING':
        return 'bg-yellow-500'
      case 'CRITICAL':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return <CheckCircle className='h-4 w-4' />
      case 'GOOD':
        return <Activity className='h-4 w-4' />
      case 'WARNING':
        return <AlertTriangle className='h-4 w-4' />
      case 'CRITICAL':
        return <AlertTriangle className='h-4 w-4' />
      default:
        return <Activity className='h-4 w-4' />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !data) {
    return (
      <div className='flex items-center justify-center p-8'>
        <RefreshCw className='h-6 w-6 animate-spin mr-2' />
        <span>Cargando métricas de rate limiting...</span>
      </div>
    )
  }

  if (error && !data) {
    return (
      <Alert className='m-4'>
        <AlertTriangle className='h-4 w-4' />
        <AlertDescription>
          Error al cargar métricas: {error}
          <Button variant='outline' size='sm' onClick={fetchMetrics} className='ml-2'>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  return (
    <div className='space-y-6'>
      {/* Header con controles */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold'>Monitor de Rate Limiting</h2>
          <p className='text-muted-foreground'>
            Entorno: <Badge variant='outline'>{data.environment}</Badge>
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? 'Pausar' : 'Reanudar'} Auto-refresh
          </Button>
          <Button variant='outline' size='sm' onClick={fetchMetrics} disabled={loading}>
            {loading ? (
              <RefreshCw className='h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='h-4 w-4' />
            )}
            Actualizar
          </Button>
        </div>
      </div>

      {/* Resumen general */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Endpoints</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{data.summary.totalEndpoints}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tiempo Respuesta Promedio</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{data.summary.avgResponseTime}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tasa de Error</CardTitle>
            <AlertTriangle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(data.summary.avgErrorRate * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Estado General</CardTitle>
            <Zap className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='flex gap-1'>
              <Badge className='bg-green-500 text-white'>{data.summary.excellentEndpoints}</Badge>
              <Badge className='bg-yellow-500 text-white'>{data.summary.warningEndpoints}</Badge>
              <Badge className='bg-red-500 text-white'>{data.summary.criticalEndpoints}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='endpoints' className='w-full'>
        <TabsList>
          <TabsTrigger value='endpoints'>Endpoints</TabsTrigger>
          <TabsTrigger value='recommendations'>
            Recomendaciones
            {data.recommendations.length > 0 && (
              <Badge variant='secondary' className='ml-1'>
                {data.recommendations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='endpoints' className='space-y-4'>
          <div className='grid gap-4'>
            {Object.entries(data.performanceReport).map(([endpoint, metrics]) => (
              <Card key={endpoint}>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg'>{endpoint}</CardTitle>
                    <Badge className={getStatusColor(metrics.status)}>
                      {getStatusIcon(metrics.status)}
                      {metrics.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div>
                      <p className='text-sm text-muted-foreground'>Requests Totales</p>
                      <p className='text-xl font-semibold'>{metrics.totalRequests}</p>
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>Tiempo Promedio</p>
                      <p className='text-xl font-semibold'>{metrics.averageResponseTime}ms</p>
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>Errores</p>
                      <p className='text-xl font-semibold'>{metrics.errorCount}</p>
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>Tasa de Error</p>
                      <p className='text-xl font-semibold'>
                        {(metrics.errorRate * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Barra de progreso para tasa de error */}
                  <div className='mt-4'>
                    <div className='flex justify-between text-sm mb-1'>
                      <span>Tasa de Error</span>
                      <span>{(metrics.errorRate * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.errorRate * 100} className='h-2' />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='recommendations' className='space-y-4'>
          {data.recommendations.length === 0 ? (
            <Card>
              <CardContent className='pt-6'>
                <div className='text-center text-muted-foreground'>
                  <CheckCircle className='h-12 w-12 mx-auto mb-4 text-green-500' />
                  <p>No hay recomendaciones en este momento.</p>
                  <p className='text-sm'>Todos los límites están optimizados.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              {data.recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg'>{rec.endpoint}</CardTitle>
                      <Badge className={getImpactColor(rec.impact)}>{rec.impact} IMPACT</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='flex items-center gap-4 mb-3'>
                      <div className='flex items-center gap-2'>
                        <TrendingDown className='h-4 w-4 text-red-500' />
                        <span className='font-medium'>Actual: {rec.currentLimit}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <TrendingUp className='h-4 w-4 text-green-500' />
                        <span className='font-medium'>Recomendado: {rec.recommendedLimit}</span>
                      </div>
                    </div>
                    <p className='text-sm text-muted-foreground'>{rec.reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer con timestamp */}
      <div className='text-center text-sm text-muted-foreground'>
        Última actualización: {new Date(data.summary.timestamp).toLocaleString()}
      </div>
    </div>
  )
}
