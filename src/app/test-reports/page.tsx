/**
 * Página de reportes de pruebas
 * Dashboard para visualizar resultados de tests automatizados
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Download,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
} from '@/lib/optimized-imports'

// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic'

interface TestStep {
  step: string
  status: 'success' | 'error' | 'pending'
  timestamp: string
  duration?: number
  details?: string
  response?: {
    status: number
    data?: any
  }
  category?: 'navigation' | 'api' | 'interaction' | 'validation'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  screenshot?: string
}

interface ApiTest {
  endpoint: string
  method: string
  status: 'success' | 'error'
  responseTime: number
  statusCode: number
  timestamp: string
  payloadSize?: number
  responseSize?: number
  retryCount?: number
}

interface PerformanceMetrics {
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p95ResponseTime: number
  throughput: number
  errorRate: number
  availability: number
}

interface QualityMetrics {
  testCoverage: number
  reliability: number
  maintainabilityIndex: number
  codeQuality: number
}

interface ErrorAnalysis {
  totalErrors: number
  errorsByCategory: Record<string, number>
  criticalErrors: number
  errorTrends: {
    increasing: boolean
    percentage: number
  }
}

interface DetailedObservation {
  id: string
  type: 'performance' | 'error' | 'quality' | 'security' | 'usability'
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  description: string
  context: string
  recommendation: string
  impact: 'low' | 'medium' | 'high'
  timestamp: string
}

interface TestReport {
  timestamp: string
  totalSteps: number
  completedSteps: number
  failedSteps: number
  totalApis: number
  successfulApis: number
  failedApis: number
  steps: TestStep[]
  apiTests: ApiTest[]
  errors: string[]
  summary: {
    status: 'success' | 'partial' | 'failed'
    message: string
    duration: string
    environment: string
  }
  performanceMetrics: PerformanceMetrics
  qualityMetrics: QualityMetrics
  errorAnalysis: ErrorAnalysis
  observations: DetailedObservation[]
  metadata: {
    testSuite: string
    version: string
    browser: string
    viewport: string
    userAgent: string
  }
}

export default function TestReportsPage() {
  // Bloquear indexación para SEO
  useEffect(() => {
    const metaRobots = document.querySelector('meta[name="robots"]')
    if (!metaRobots) {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      meta.content = 'noindex, nofollow'
      document.head.appendChild(meta)
    } else {
      metaRobots.setAttribute('content', 'noindex, nofollow')
    }
  }, [])

  const [reports, setReports] = useState<string[]>([])
  const [selectedReport, setSelectedReport] = useState<TestReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAvailableReports()
  }, [])

  const loadAvailableReports = async () => {
    try {
      const response = await fetch('/api/test-reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
        if (data.reports && data.reports.length > 0) {
          loadReport(data.reports[0])
        }
      } else {
        setError('No se pudieron cargar los reportes')
      }
    } catch (err) {
      setError('Error al cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  const loadReport = async (reportName: string) => {
    try {
      const response = await fetch(`/test-reports/${reportName}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedReport(data)
      } else {
        setError(`No se pudo cargar el reporte: ${reportName}`)
      }
    } catch (err) {
      setError(`Error al cargar el reporte: ${reportName}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'error':
        return <XCircle className='h-4 w-4 text-red-500' />
      case 'pending':
        return <Clock className='h-4 w-4 text-yellow-500' />
      default:
        return <AlertTriangle className='h-4 w-4 text-gray-500' />
    }
  }

  const getStatusBadge = (status: string | undefined) => {
    if (!status) {
      return null
    }

    const variants = {
      success: 'default',
      error: 'destructive',
      pending: 'secondary',
      partial: 'outline',
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </Badge>
    )
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`
    }
    return `${(ms / 1000).toFixed(2)}s`
  }

  const calculatePerformanceMetrics = (apiTests: ApiTest[]): PerformanceMetrics => {
    if (!apiTests || apiTests.length === 0) {
      return {
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        availability: 0,
      }
    }

    const responseTimes = apiTests.map(api => api.responseTime).sort((a, b) => a - b)
    const successfulApis = apiTests.filter(api => api.status === 'success').length
    const totalApis = apiTests.length

    return {
      averageResponseTime: Math.round(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      ),
      minResponseTime: responseTimes[0] || 0,
      maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
      p95ResponseTime: Math.round(responseTimes[Math.floor(responseTimes.length * 0.95)] || 0),
      throughput: Math.round(
        (successfulApis / (Date.now() - new Date(apiTests[0]?.timestamp || Date.now()).getTime())) *
          1000 *
          60
      ), // requests per minute
      errorRate: Math.round(((totalApis - successfulApis) / totalApis) * 100),
      availability: Math.round((successfulApis / totalApis) * 100),
    }
  }

  const analyzeErrors = (steps: TestStep[], errors: string[]): ErrorAnalysis => {
    const errorsByCategory: Record<string, number> = {
      navigation: 0,
      api: 0,
      interaction: 0,
      validation: 0,
      other: 0,
    }

    const failedSteps = steps.filter(step => step.status === 'error')
    failedSteps.forEach(step => {
      const category = step.category || 'other'
      errorsByCategory[category] = (errorsByCategory[category] || 0) + 1
    })

    const criticalErrors = failedSteps.filter(step => step.severity === 'critical').length

    return {
      totalErrors: errors.length + failedSteps.length,
      errorsByCategory,
      criticalErrors,
      errorTrends: {
        increasing: false, // This would need historical data
        percentage: 0,
      },
    }
  }

  const generateObservations = (report: TestReport): DetailedObservation[] => {
    const observations: DetailedObservation[] = []
    const metrics = calculatePerformanceMetrics(report.apiTests || [])

    // Performance observations
    if (metrics.averageResponseTime > 2000) {
      observations.push({
        id: `perf-${Date.now()}-1`,
        type: 'performance',
        severity: metrics.averageResponseTime > 5000 ? 'critical' : 'warning',
        title: 'Tiempo de respuesta elevado',
        description: `El tiempo promedio de respuesta es ${metrics.averageResponseTime}ms`,
        context: 'APIs del sistema',
        recommendation: 'Optimizar consultas de base de datos y implementar caché',
        impact: metrics.averageResponseTime > 5000 ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
      })
    }

    // Error rate observations
    if (metrics.errorRate > 5) {
      observations.push({
        id: `error-${Date.now()}-1`,
        type: 'error',
        severity: metrics.errorRate > 15 ? 'critical' : 'error',
        title: 'Tasa de errores elevada',
        description: `La tasa de errores es del ${metrics.errorRate}%`,
        context: 'Pruebas de APIs',
        recommendation: 'Revisar logs de errores y implementar manejo de excepciones',
        impact: 'high',
        timestamp: new Date().toISOString(),
      })
    }

    // Quality observations
    const completionRate = (report.completedSteps / report.totalSteps) * 100
    if (completionRate < 95) {
      observations.push({
        id: `quality-${Date.now()}-1`,
        type: 'quality',
        severity: completionRate < 80 ? 'critical' : 'warning',
        title: 'Baja tasa de completitud',
        description: `Solo se completó el ${completionRate.toFixed(1)}% de las pruebas`,
        context: 'Pipeline de pruebas',
        recommendation: 'Revisar y estabilizar las pruebas fallidas',
        impact: 'medium',
        timestamp: new Date().toISOString(),
      })
    }

    return observations
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'error':
        return 'text-red-500 bg-red-50 border-red-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getImpactBadge = (impact: string) => {
    const variants = {
      low: 'secondary',
      medium: 'outline',
      high: 'destructive',
    } as const

    return variants[impact as keyof typeof variants] || 'secondary'
  }

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex items-center justify-center h-64'>
          <RefreshCw className='h-8 w-8 animate-spin' />
          <span className='ml-2'>Cargando reportes...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='container mx-auto p-6'>
        <Card className='border-red-200'>
          <CardHeader>
            <CardTitle className='text-red-600'>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {typeof error === 'string'
                ? error
                : error?.endpoint
                  ? `${error.endpoint}: ${error.error || 'Error desconocido'}`
                  : JSON.stringify(error)}
            </p>
            <Button onClick={loadAvailableReports} className='mt-4'>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Reportes de Pruebas</h1>
          <p className='text-muted-foreground'>
            Visualización interactiva de los resultados de testing
          </p>
        </div>
        <Button onClick={loadAvailableReports} variant='outline'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Actualizar
        </Button>
      </div>

      {/* Selector de reportes */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Disponibles</CardTitle>
          <CardDescription>Selecciona un reporte para ver los detalles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {reports.map(report => (
              <Button
                key={report}
                variant={
                  selectedReport && report.includes(selectedReport.timestamp)
                    ? 'default'
                    : 'outline'
                }
                onClick={() => loadReport(report)}
                className='text-xs'
              >
                {report.replace('.json', '').replace('purchase-pipeline-', '')}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedReport && (
        <>
          {/* Resumen general */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium'>Estado General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center space-x-2'>
                  {getStatusIcon(selectedReport?.summary?.status || 'pending')}
                  {getStatusBadge(selectedReport?.summary?.status || 'pending')}
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {selectedReport?.summary?.duration || 'N/A'}
                </p>
                <p className='text-xs text-muted-foreground mt-1'>
                  Ejecutado:{' '}
                  {selectedReport?.timestamp
                    ? new Date(selectedReport.timestamp).toLocaleString()
                    : 'N/A'}
                </p>
                <p className='text-xs text-muted-foreground'>
                  Entorno: {selectedReport?.summary?.environment || 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium'>Pasos Completados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {selectedReport?.completedSteps || 0}/{selectedReport?.totalSteps || 0}
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${
                        selectedReport?.completedSteps && selectedReport?.totalSteps
                          ? (
                              (selectedReport.completedSteps / selectedReport.totalSteps) *
                              100
                            ).toFixed(1)
                          : '0'
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {selectedReport?.completedSteps && selectedReport?.totalSteps
                    ? ((selectedReport.completedSteps / selectedReport.totalSteps) * 100).toFixed(1)
                    : '0'}
                  % completado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium'>APIs Exitosas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {selectedReport?.successfulApis || 0}/{selectedReport?.totalApis || 0}
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
                  <div
                    className='bg-green-600 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${
                        selectedReport?.successfulApis && selectedReport?.totalApis
                          ? (
                              (selectedReport.successfulApis / selectedReport.totalApis) *
                              100
                            ).toFixed(1)
                          : '0'
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {selectedReport?.successfulApis && selectedReport?.totalApis
                    ? ((selectedReport.successfulApis / selectedReport.totalApis) * 100).toFixed(1)
                    : '0'}
                  % éxito
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium'>Errores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-red-600'>
                  {selectedReport?.errors?.length || 0}
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
                  <div
                    className='bg-red-600 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${selectedReport?.errors?.length ? Math.min((selectedReport.errors.length / Math.max(selectedReport?.totalSteps || 1, 1)) * 100, 100) : 0}%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {selectedReport?.failedSteps || 0} pasos fallidos
                </p>
                <p className='text-xs text-muted-foreground'>
                  {selectedReport?.errors?.length
                    ? `${Math.min(Math.round((selectedReport.errors.length / Math.max(selectedReport?.totalSteps || 1, 1)) * 100), 100)}% de impacto`
                    : 'Sin errores'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de rendimiento */}
          {(() => {
            const performanceMetrics = calculatePerformanceMetrics(selectedReport?.apiTests || [])
            return (
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Rendimiento</CardTitle>
                  <CardDescription>Análisis detallado del rendimiento de las APIs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='text-center p-3 bg-blue-50 rounded-lg'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {performanceMetrics.averageResponseTime}ms
                      </div>
                      <p className='text-xs text-muted-foreground'>Tiempo Promedio</p>
                    </div>
                    <div className='text-center p-3 bg-green-50 rounded-lg'>
                      <div className='text-2xl font-bold text-green-600'>
                        {performanceMetrics.p95ResponseTime}ms
                      </div>
                      <p className='text-xs text-muted-foreground'>P95 Latencia</p>
                    </div>
                    <div className='text-center p-3 bg-purple-50 rounded-lg'>
                      <div className='text-2xl font-bold text-purple-600'>
                        {performanceMetrics.availability}%
                      </div>
                      <p className='text-xs text-muted-foreground'>Disponibilidad</p>
                    </div>
                    <div className='text-center p-3 bg-orange-50 rounded-lg'>
                      <div className='text-2xl font-bold text-orange-600'>
                        {performanceMetrics.errorRate}%
                      </div>
                      <p className='text-xs text-muted-foreground'>Tasa de Error</p>
                    </div>
                  </div>
                  <div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                    <div>
                      <span className='font-medium'>Tiempo Mínimo:</span>{' '}
                      {performanceMetrics.minResponseTime}ms
                    </div>
                    <div>
                      <span className='font-medium'>Tiempo Máximo:</span>{' '}
                      {performanceMetrics.maxResponseTime}ms
                    </div>
                    <div>
                      <span className='font-medium'>Throughput:</span>{' '}
                      {performanceMetrics.throughput} req/min
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Métricas de calidad */}
          {(() => {
            const qualityMetrics: QualityMetrics = {
              testCoverage: Math.round(
                ((selectedReport?.completedSteps || 0) /
                  Math.max(selectedReport?.totalSteps || 1, 1)) *
                  100
              ),
              reliability: Math.round(
                ((selectedReport?.successfulApis || 0) /
                  Math.max(selectedReport?.totalApis || 1, 1)) *
                  100
              ),
              maintainabilityIndex:
                selectedReport?.errors?.length === 0
                  ? 95
                  : Math.max(60, 95 - (selectedReport?.errors?.length || 0) * 10),
              codeQuality: selectedReport?.steps?.some(s => s.severity === 'critical') ? 75 : 85,
            }

            return (
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Calidad</CardTitle>
                  <CardDescription>Evaluación integral de la calidad del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='text-center p-3 bg-green-50 rounded-lg'>
                      <div className='text-2xl font-bold text-green-600'>
                        {qualityMetrics.testCoverage}%
                      </div>
                      <p className='text-xs text-muted-foreground'>Cobertura de Pruebas</p>
                    </div>
                    <div className='text-center p-3 bg-blue-50 rounded-lg'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {qualityMetrics.reliability}%
                      </div>
                      <p className='text-xs text-muted-foreground'>Confiabilidad</p>
                    </div>
                    <div className='text-center p-3 bg-purple-50 rounded-lg'>
                      <div className='text-2xl font-bold text-purple-600'>
                        {qualityMetrics.maintainabilityIndex}%
                      </div>
                      <p className='text-xs text-muted-foreground'>Mantenibilidad</p>
                    </div>
                    <div className='text-center p-3 bg-yellow-50 rounded-lg'>
                      <div className='text-2xl font-bold text-yellow-600'>
                        {qualityMetrics.codeQuality}%
                      </div>
                      <p className='text-xs text-muted-foreground'>Calidad de Código</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Detalles de pasos */}
          <Card>
            <CardHeader>
              <CardTitle>Pasos de Ejecución</CardTitle>
              <CardDescription>Detalle de cada paso del pipeline de pruebas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {selectedReport?.steps?.map((step, index) => (
                  <div key={index} className='flex items-start space-x-3 p-3 rounded-lg border'>
                    <div className='flex-shrink-0 mt-1'>{getStatusIcon(step.status)}</div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-medium'>{step.step}</p>
                        <div className='flex items-center space-x-2'>
                          {step.duration && (
                            <span className='text-xs text-muted-foreground'>
                              {formatDuration(step.duration)}
                            </span>
                          )}
                          {step.response && (
                            <Badge variant='outline' className='text-xs'>
                              {step.response.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {step.details && (
                        <p className='text-xs text-muted-foreground mt-1'>
                          {typeof step.details === 'object'
                            ? JSON.stringify(step.details, null, 2)
                            : step.details}
                        </p>
                      )}
                      <p className='text-xs text-muted-foreground'>
                        {new Date(step.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* APIs probadas */}
          <Card>
            <CardHeader>
              <CardTitle>APIs Probadas</CardTitle>
              <CardDescription>Resultados de las pruebas de endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {selectedReport?.apiTests?.map((api, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 rounded-lg border'
                  >
                    <div className='flex items-center space-x-3'>
                      {getStatusIcon(api.status)}
                      <div>
                        <p className='text-sm font-medium'>
                          {api.method} {api.endpoint}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {new Date(api.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Badge variant='outline' className='text-xs'>
                        {api.statusCode}
                      </Badge>
                      <span className='text-xs text-muted-foreground'>{api.responseTime}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Análisis de errores */}
          {(() => {
            const errorAnalysis = analyzeErrors(
              selectedReport?.steps || [],
              selectedReport?.errors || []
            )
            return (
              errorAnalysis.totalErrors > 0 && (
                <Card className='border-red-200'>
                  <CardHeader>
                    <CardTitle className='text-red-600'>Análisis de Errores</CardTitle>
                    <CardDescription>
                      Categorización y análisis detallado de errores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-4'>
                      <div className='text-center p-3 bg-red-50 rounded-lg'>
                        <div className='text-2xl font-bold text-red-600'>
                          {errorAnalysis.totalErrors}
                        </div>
                        <p className='text-xs text-muted-foreground'>Total Errores</p>
                      </div>
                      <div className='text-center p-3 bg-orange-50 rounded-lg'>
                        <div className='text-2xl font-bold text-orange-600'>
                          {errorAnalysis.criticalErrors}
                        </div>
                        <p className='text-xs text-muted-foreground'>Críticos</p>
                      </div>
                      <div className='text-center p-3 bg-yellow-50 rounded-lg'>
                        <div className='text-2xl font-bold text-yellow-600'>
                          {errorAnalysis.errorsByCategory.api || 0}
                        </div>
                        <p className='text-xs text-muted-foreground'>API</p>
                      </div>
                      <div className='text-center p-3 bg-blue-50 rounded-lg'>
                        <div className='text-2xl font-bold text-blue-600'>
                          {errorAnalysis.errorsByCategory.navigation || 0}
                        </div>
                        <p className='text-xs text-muted-foreground'>Navegación</p>
                      </div>
                      <div className='text-center p-3 bg-purple-50 rounded-lg'>
                        <div className='text-2xl font-bold text-purple-600'>
                          {errorAnalysis.errorsByCategory.interaction || 0}
                        </div>
                        <p className='text-xs text-muted-foreground'>Interacción</p>
                      </div>
                    </div>

                    {selectedReport?.errors && selectedReport.errors.length > 0 && (
                      <div className='space-y-2'>
                        <h4 className='font-medium text-sm mb-2'>Detalles de Errores:</h4>
                        {selectedReport.errors.map((error, index) => (
                          <div
                            key={index}
                            className='p-3 bg-red-50 rounded-lg border border-red-200'
                          >
                            <p className='text-sm text-red-800'>
                              {typeof error === 'string'
                                ? error
                                : error?.endpoint
                                  ? `${error.endpoint}: ${error.error || 'Error desconocido'}`
                                  : JSON.stringify(error)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            )
          })()}

          {/* Observaciones detalladas */}
          {(() => {
            const observations = generateObservations(selectedReport || ({} as TestReport))
            return (
              observations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Observaciones y Recomendaciones</CardTitle>
                    <CardDescription>
                      Análisis automático y recomendaciones de mejora
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {observations.map(observation => (
                        <div
                          key={observation.id}
                          className={`p-4 rounded-lg border ${getSeverityColor(observation.severity)}`}
                        >
                          <div className='flex items-start justify-between mb-2'>
                            <div className='flex items-center space-x-2'>
                              <Badge variant={getImpactBadge(observation.impact)}>
                                {observation.impact.toUpperCase()}
                              </Badge>
                              <Badge variant='outline'>{observation.type.toUpperCase()}</Badge>
                            </div>
                            <span className='text-xs text-muted-foreground'>
                              {new Date(observation.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <h4 className='font-semibold text-sm mb-1'>{observation.title}</h4>
                          <p className='text-sm mb-2'>{observation.description}</p>
                          <div className='text-xs text-muted-foreground mb-2'>
                            <strong>Contexto:</strong> {observation.context}
                          </div>
                          <div className='text-xs bg-white bg-opacity-50 p-2 rounded border'>
                            <strong>Recomendación:</strong> {observation.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            )
          })()}

          {/* Análisis comparativo */}
          {reports.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Análisis Comparativo</CardTitle>
                <CardDescription>
                  Comparación con reportes anteriores para identificar tendencias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const currentIndex = reports.findIndex(r => r.id === selectedReport?.id)
                  const previousReport = currentIndex > 0 ? reports[currentIndex - 1] : null

                  if (!previousReport) {
                    return (
                      <p className='text-sm text-muted-foreground'>
                        No hay reportes anteriores para comparar
                      </p>
                    )
                  }

                  const currentMetrics = calculatePerformanceMetrics(
                    selectedReport?.steps || [],
                    selectedReport?.apiTests || []
                  )
                  const previousMetrics = calculatePerformanceMetrics(
                    previousReport?.steps || [],
                    previousReport?.apiTests || []
                  )

                  const comparisons = [
                    {
                      label: 'Tiempo Promedio',
                      current: currentMetrics.averageResponseTime,
                      previous: previousMetrics.averageResponseTime,
                      unit: 'ms',
                      better: 'lower',
                    },
                    {
                      label: 'Disponibilidad',
                      current: currentMetrics.availability,
                      previous: previousMetrics.availability,
                      unit: '%',
                      better: 'higher',
                    },
                    {
                      label: 'Tasa de Error',
                      current: currentMetrics.errorRate,
                      previous: previousMetrics.errorRate,
                      unit: '%',
                      better: 'lower',
                    },
                    {
                      label: 'Pasos Completados',
                      current: selectedReport?.completedSteps || 0,
                      previous: previousReport?.completedSteps || 0,
                      unit: '',
                      better: 'higher',
                    },
                  ]

                  return (
                    <div className='space-y-4'>
                      <div className='text-sm text-muted-foreground mb-4'>
                        Comparando con reporte anterior:{' '}
                        {new Date(previousReport.timestamp).toLocaleString()}
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {comparisons.map((comp, index) => {
                          const diff = comp.current - comp.previous
                          const percentChange =
                            comp.previous !== 0 ? (diff / comp.previous) * 100 : 0
                          const isImprovement = comp.better === 'higher' ? diff > 0 : diff < 0

                          return (
                            <div key={index} className='p-3 border rounded-lg'>
                              <div className='flex items-center justify-between mb-2'>
                                <span className='text-sm font-medium'>{comp.label}</span>
                                <div
                                  className={`flex items-center space-x-1 text-xs ${
                                    isImprovement
                                      ? 'text-green-600'
                                      : diff === 0
                                        ? 'text-gray-500'
                                        : 'text-red-600'
                                  }`}
                                >
                                  {isImprovement ? '↗' : diff === 0 ? '→' : '↘'}
                                  <span>{Math.abs(percentChange).toFixed(1)}%</span>
                                </div>
                              </div>
                              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                <span>
                                  Anterior: {comp.previous}
                                  {comp.unit}
                                </span>
                                <span>
                                  Actual: {comp.current}
                                  {comp.unit}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
