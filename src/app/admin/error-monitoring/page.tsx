'use client'

// ===================================
// ERROR MONITORING DASHBOARD
// ===================================
// Dashboard administrativo para monitoreo de errores del Error Boundary System

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  TrendingUp,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Clock,
  Users,
  Zap,
} from 'lucide-react'
import { useErrorMetrics } from '@/hooks/error-boundary/useErrorBoundary'

// ===================================
// INTERFACES
// ===================================

interface ErrorReport {
  error_id: string
  timestamp: string
  error_name: string
  error_message: string
  error_stack?: string
  component_stack?: string
  level: string
  component: string
  url: string
  user_agent: string
  user_id?: string
  recovery_strategy?: string
  retry_count: number
  recovery_successful: boolean
  time_to_error?: number
  memory_usage?: number
  created_at: string
}

interface ErrorStats {
  totalErrors: number
  errorsByLevel: Record<string, number>
  errorsByType: Record<string, number>
  errorsByComponent: Record<string, number>
}

interface ErrorData {
  errors: ErrorReport[]
  stats: ErrorStats
  pagination: {
    limit: number
    offset: number
    total: number
  }
  filters: {
    level?: string
    component?: string
    timeframe: string
  }
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export default function ErrorMonitoringPage() {
  const [errorData, setErrorData] = useState<ErrorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedComponent, setSelectedComponent] = useState<string>('')
  const [selectedError, setSelectedError] = useState<ErrorReport | null>(null)

  const { metrics, healthStatus, refresh } = useErrorMetrics()

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    fetchErrorData()
  }, [selectedTimeframe, selectedLevel, selectedComponent])

  useEffect(() => {
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      fetchErrorData()
      refresh()
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedTimeframe, selectedLevel, selectedComponent, refresh])

  // ===================================
  // FUNCIONES
  // ===================================

  const fetchErrorData = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        limit: '100',
      })

      if (selectedLevel) {
        params.append('level', selectedLevel)
      }
      if (selectedComponent) {
        params.append('component', selectedComponent)
      }

      const response = await fetch(`/api/monitoring/errors?${params}`)
      const result = await response.json()

      if (result.success) {
        setErrorData(result.data)
      } else {
        console.error('Error fetching error data:', result.error)
      }
    } catch (error) {
      console.error('Error fetching error data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchErrorData()
    refresh()
  }

  const handleExport = () => {
    if (!errorData) {
      return
    }

    const csvContent = [
      'Error ID,Timestamp,Type,Component,Level,Message,Recovery Strategy,Retry Count,Successful',
      ...errorData.errors.map(error =>
        [
          error.error_id,
          error.timestamp,
          error.error_name,
          error.component,
          error.level,
          `"${error.error_message.replace(/"/g, '""')}"`,
          error.recovery_strategy || '',
          error.retry_count,
          error.recovery_successful,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-report-${selectedTimeframe}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'page':
        return 'destructive'
      case 'section':
        return 'default'
      case 'component':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  // ===================================
  // RENDER
  // ===================================

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Error Monitoring</h1>
          <p className='text-gray-600'>Monitoreo en tiempo real del sistema de Error Boundaries</p>
        </div>
        <div className='flex gap-2'>
          <Button onClick={handleRefresh} variant='outline' size='sm'>
            <RefreshCw className='w-4 h-4 mr-2' />
            Actualizar
          </Button>
          <Button onClick={handleExport} variant='outline' size='sm'>
            <Download className='w-4 h-4 mr-2' />
            Exportar
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Alert
        className={
          healthStatus.status === 'critical'
            ? 'border-red-500'
            : healthStatus.status === 'degraded'
              ? 'border-yellow-500'
              : 'border-green-500'
        }
      >
        <Activity className='h-4 w-4' />
        <AlertTitle className={getHealthStatusColor(healthStatus.status)}>
          Estado del Sistema: {healthStatus.status.toUpperCase()}
        </AlertTitle>
        <AlertDescription>
          <div className='grid grid-cols-3 gap-4 mt-2'>
            <div>
              <span className='text-sm font-medium'>Tasa de Errores:</span>
              <span className='ml-2'>{healthStatus.errorRate}/min</span>
            </div>
            <div>
              <span className='text-sm font-medium'>Errores Críticos:</span>
              <span className='ml-2'>{healthStatus.criticalErrors}</span>
            </div>
            <div>
              <span className='text-sm font-medium'>Recomendaciones:</span>
              <span className='ml-2'>{healthStatus.recommendations.length}</span>
            </div>
          </div>
          {healthStatus.recommendations.length > 0 && (
            <div className='mt-2'>
              <ul className='text-sm list-disc list-inside'>
                {healthStatus.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='w-5 h-5' />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='text-sm font-medium mb-2 block'>Período de Tiempo</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1h'>Última hora</SelectItem>
                  <SelectItem value='6h'>Últimas 6 horas</SelectItem>
                  <SelectItem value='24h'>Últimas 24 horas</SelectItem>
                  <SelectItem value='7d'>Últimos 7 días</SelectItem>
                  <SelectItem value='30d'>Últimos 30 días</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='text-sm font-medium mb-2 block'>Nivel</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder='Todos los niveles' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>Todos los niveles</SelectItem>
                  <SelectItem value='page'>Página</SelectItem>
                  <SelectItem value='section'>Sección</SelectItem>
                  <SelectItem value='component'>Componente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='text-sm font-medium mb-2 block'>Componente</label>
              <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                <SelectTrigger>
                  <SelectValue placeholder='Todos los componentes' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>Todos los componentes</SelectItem>
                  {errorData?.stats.errorsByComponent &&
                    Object.keys(errorData.stats.errorsByComponent).map(component => (
                      <SelectItem key={component} value={component}>
                        {component} ({errorData.stats.errorsByComponent[component]})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      {errorData?.stats && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total de Errores</CardTitle>
              <AlertTriangle className='h-4 w-4 text-red-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{errorData.stats.totalErrors}</div>
              <p className='text-xs text-muted-foreground'>En {selectedTimeframe}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Errores Críticos</CardTitle>
              <Zap className='h-4 w-4 text-red-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{errorData.stats.errorsByLevel?.page || 0}</div>
              <p className='text-xs text-muted-foreground'>Nivel página</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Componentes Afectados</CardTitle>
              <Users className='h-4 w-4 text-blue-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {Object.keys(errorData.stats.errorsByComponent || {}).length}
              </div>
              <p className='text-xs text-muted-foreground'>Componentes únicos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Tipos de Error</CardTitle>
              <TrendingUp className='h-4 w-4 text-orange-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {Object.keys(errorData.stats.errorsByType || {}).length}
              </div>
              <p className='text-xs text-muted-foreground'>Tipos únicos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenido Principal */}
      <Tabs defaultValue='errors' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='errors'>Lista de Errores</TabsTrigger>
          <TabsTrigger value='patterns'>Patrones</TabsTrigger>
          <TabsTrigger value='analytics'>Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value='errors' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Errores Recientes</CardTitle>
              <CardDescription>
                {loading ? 'Cargando...' : `${errorData?.errors.length || 0} errores encontrados`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='flex justify-center py-8'>
                  <RefreshCw className='w-6 h-6 animate-spin' />
                </div>
              ) : (
                <div className='space-y-2'>
                  {errorData?.errors.map(error => (
                    <div
                      key={error.error_id}
                      className='border rounded-lg p-4 hover:bg-gray-50 cursor-pointer'
                      onClick={() => setSelectedError(error)}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <Badge variant={getSeverityColor(error.level)}>{error.level}</Badge>
                          <span className='font-medium'>{error.error_name}</span>
                          <span className='text-sm text-gray-500'>en {error.component}</span>
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-500'>
                          <Clock className='w-4 h-4' />
                          {new Date(error.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <p className='text-sm text-gray-600 mt-1 truncate'>{error.error_message}</p>
                      <div className='flex items-center gap-4 mt-2 text-xs text-gray-500'>
                        <span>Reintentos: {error.retry_count}</span>
                        <span>Recuperación: {error.recovery_successful ? '✅' : '❌'}</span>
                        {error.time_to_error && <span>Tiempo: {error.time_to_error}ms</span>}
                      </div>
                    </div>
                  ))}

                  {errorData?.errors.length === 0 && (
                    <div className='text-center py-8 text-gray-500'>
                      No se encontraron errores en el período seleccionado
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='patterns' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Patrones de Errores</CardTitle>
              <CardDescription>
                Análisis de patrones basado en métricas del Error Boundary Manager
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.patterns.length > 0 ? (
                <div className='space-y-4'>
                  {metrics.patterns.slice(0, 10).map((pattern, index) => (
                    <div key={pattern.pattern} className='border rounded-lg p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium'>{pattern.pattern}</h4>
                          <p className='text-sm text-gray-600'>
                            Componentes afectados: {pattern.affectedComponents.join(', ')}
                          </p>
                        </div>
                        <div className='text-right'>
                          <div className='text-lg font-bold'>{pattern.frequency}</div>
                          <div className='text-sm text-gray-500'>ocurrencias</div>
                        </div>
                      </div>
                      {pattern.suggestedFix && (
                        <div className='mt-2 p-2 bg-blue-50 rounded text-sm'>
                          <strong>Sugerencia:</strong> {pattern.suggestedFix}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  No se detectaron patrones de errores
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='analytics' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>Errores por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {errorData?.stats.errorsByType ? (
                  <div className='space-y-2'>
                    {Object.entries(errorData.stats.errorsByType)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <div key={type} className='flex justify-between items-center'>
                          <span className='text-sm'>{type}</span>
                          <Badge variant='outline'>{count}</Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className='text-center py-4 text-gray-500'>No hay datos disponibles</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Errores por Componente</CardTitle>
              </CardHeader>
              <CardContent>
                {errorData?.stats.errorsByComponent ? (
                  <div className='space-y-2'>
                    {Object.entries(errorData.stats.errorsByComponent)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([component, count]) => (
                        <div key={component} className='flex justify-between items-center'>
                          <span className='text-sm truncate'>{component}</span>
                          <Badge variant='outline'>{count}</Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className='text-center py-4 text-gray-500'>No hay datos disponibles</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalles del Error */}
      {selectedError && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <Card className='w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>Detalles del Error</CardTitle>
                <Button variant='outline' size='sm' onClick={() => setSelectedError(null)}>
                  Cerrar
                </Button>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium'>ID del Error</label>
                  <p className='text-sm font-mono'>{selectedError.error_id}</p>
                </div>
                <div>
                  <label className='text-sm font-medium'>Timestamp</label>
                  <p className='text-sm'>{new Date(selectedError.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className='text-sm font-medium'>Tipo</label>
                  <p className='text-sm'>{selectedError.error_name}</p>
                </div>
                <div>
                  <label className='text-sm font-medium'>Nivel</label>
                  <Badge variant={getSeverityColor(selectedError.level)}>
                    {selectedError.level}
                  </Badge>
                </div>
                <div>
                  <label className='text-sm font-medium'>Componente</label>
                  <p className='text-sm'>{selectedError.component}</p>
                </div>
                <div>
                  <label className='text-sm font-medium'>Estrategia de Recuperación</label>
                  <p className='text-sm'>{selectedError.recovery_strategy || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className='text-sm font-medium'>Mensaje</label>
                <p className='text-sm bg-gray-50 p-2 rounded'>{selectedError.error_message}</p>
              </div>

              <div>
                <label className='text-sm font-medium'>URL</label>
                <p className='text-sm font-mono break-all'>{selectedError.url}</p>
              </div>

              {selectedError.error_stack && (
                <div>
                  <label className='text-sm font-medium'>Stack Trace</label>
                  <pre className='text-xs bg-gray-50 p-2 rounded overflow-x-auto'>
                    {selectedError.error_stack}
                  </pre>
                </div>
              )}

              {selectedError.component_stack && (
                <div>
                  <label className='text-sm font-medium'>Component Stack</label>
                  <pre className='text-xs bg-gray-50 p-2 rounded overflow-x-auto'>
                    {selectedError.component_stack}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
