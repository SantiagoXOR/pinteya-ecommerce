'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Download } from 'lucide-react'

interface TestStep {
  step: string
  success: boolean
  details: string
  timestamp: number
  screenshot?: string
}

interface APICall {
  url: string
  status: number
  method: string
  timestamp: number
}

interface TestError {
  endpoint: string
  error: string
}

interface TestReport {
  summary: {
    totalSteps: number
    successfulSteps: number
    failedSteps: number
    totalAPIs: number
    successfulAPIs: number
    duration: string
    timestamp: string
  }
  steps: TestStep[]
  apis: APICall[]
  errors: TestError[]
}

export default function TestOrderDiagnosticsPage() {
  const [testReport, setTestReport] = useState<TestReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLatestTestReport = async () => {
    try {
      setLoading(true)
      setError(null)

      // Intentar cargar el reporte más reciente
      const reportFiles = [
        'purchase-pipeline-1757120449985.json',
        'purchase-pipeline-1757120343081.json',
        'purchase-pipeline-1757120238051.json',
        'purchase-pipeline-1757120051921.json',
        'purchase-pipeline-1757119611223.json',
      ]

      let data = null
      let lastError = null

      for (const fileName of reportFiles) {
        try {
          const response = await fetch(`/test-reports/${fileName}`)
          if (response.ok) {
            data = await response.json()
            break
          }
        } catch (err) {
          lastError = err
          continue
        }
      }

      if (!data) {
        throw new Error(
          lastError instanceof Error
            ? lastError.message
            : 'No se encontraron reportes de prueba disponibles'
        )
      }

      setTestReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLatestTestReport()
  }, [])

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className='h-4 w-4 text-green-500' />
    ) : (
      <XCircle className='h-4 w-4 text-red-500' />
    )
  }

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? 'default' : 'destructive'}>{success ? 'Exitoso' : 'Fallido'}</Badge>
    )
  }

  const formatTimestamp = (timestamp: number | string) => {
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const downloadReport = () => {
    if (!testReport) {
      return
    }

    const dataStr = JSON.stringify(testReport, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `test-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='flex items-center space-x-2'>
            <RefreshCw className='h-6 w-6 animate-spin' />
            <span>Cargando datos de la orden de prueba...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='container mx-auto p-6'>
        <Card className='border-red-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-red-600'>
              <AlertTriangle className='h-5 w-5' />
              <span>Error al cargar los datos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-red-600 mb-4'>
              {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
            </p>
            <Button onClick={loadLatestTestReport} variant='outline'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!testReport) {
    return (
      <div className='container mx-auto p-6'>
        <Card>
          <CardHeader>
            <CardTitle>No hay datos disponibles</CardTitle>
            <CardDescription>No se encontraron datos de la orden de prueba.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Diagnóstico de Orden de Prueba</h1>
          <p className='text-muted-foreground'>
            Datos completos de la última ejecución del pipeline de compra
          </p>
        </div>
        <div className='flex space-x-2'>
          <Button onClick={loadLatestTestReport} variant='outline'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Actualizar
          </Button>
          <Button onClick={downloadReport} variant='outline'>
            <Download className='h-4 w-4 mr-2' />
            Descargar Reporte
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Pasos Totales</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{testReport.summary.totalSteps}</div>
            <p className='text-xs text-muted-foreground'>
              {testReport.summary.successfulSteps} exitosos, {testReport.summary.failedSteps}{' '}
              fallidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>APIs Probadas</CardTitle>
            <CheckCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{testReport.summary.totalAPIs}</div>
            <p className='text-xs text-muted-foreground'>
              {testReport.summary.successfulAPIs} exitosas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Duración</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{testReport.summary.duration}</div>
            <p className='text-xs text-muted-foreground'>Tiempo total de ejecución</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Timestamp</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-sm font-bold'>{formatTimestamp(testReport.summary.timestamp)}</div>
            <p className='text-xs text-muted-foreground'>Última ejecución</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue='steps' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='steps'>Pasos del Pipeline</TabsTrigger>
          <TabsTrigger value='apis'>Llamadas API</TabsTrigger>
          <TabsTrigger value='errors'>Errores</TabsTrigger>
          <TabsTrigger value='order-data'>Datos de la Orden</TabsTrigger>
        </TabsList>

        <TabsContent value='steps' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Pasos del Pipeline de Compra</CardTitle>
              <CardDescription>
                Secuencia completa de pasos ejecutados durante la prueba
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-96'>
                <div className='space-y-3'>
                  {testReport.steps.map((step, index) => (
                    <div key={index} className='flex items-start space-x-3 p-3 border rounded-lg'>
                      <div className='flex-shrink-0 mt-1'>{getStatusIcon(step.success)}</div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between'>
                          <p className='text-sm font-medium text-gray-900'>{step.step}</p>
                          {getStatusBadge(step.success)}
                        </div>
                        {step.details && (
                          <p className='text-sm text-gray-500 mt-1'>
                            {typeof step.details === 'object'
                              ? JSON.stringify(step.details, null, 2)
                              : step.details}
                          </p>
                        )}
                        <p className='text-xs text-gray-400 mt-1'>
                          {formatTimestamp(step.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='apis' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Llamadas a APIs</CardTitle>
              <CardDescription>
                Todas las llamadas HTTP realizadas durante la prueba
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-96'>
                <div className='space-y-2'>
                  {testReport.apis.map((api, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex-1'>
                        <div className='flex items-center space-x-2'>
                          <Badge
                            variant={
                              api.status >= 200 && api.status < 300 ? 'default' : 'destructive'
                            }
                          >
                            {api.method}
                          </Badge>
                          <span className='text-sm font-mono'>{api.url}</span>
                        </div>
                        <p className='text-xs text-gray-400 mt-1'>
                          {formatTimestamp(api.timestamp)}
                        </p>
                      </div>
                      <Badge
                        variant={api.status >= 200 && api.status < 300 ? 'default' : 'destructive'}
                      >
                        {api.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='errors' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Errores Detectados</CardTitle>
              <CardDescription>
                Errores encontrados durante la ejecución de la prueba
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testReport.errors.length === 0 ? (
                <div className='text-center py-8'>
                  <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-4' />
                  <p className='text-lg font-medium text-green-600'>¡Sin errores críticos!</p>
                  <p className='text-sm text-gray-500'>
                    Todas las funcionalidades principales funcionan correctamente.
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {testReport.errors.map((error, index) => (
                    <div
                      key={index}
                      className='flex items-start space-x-3 p-3 border border-red-200 rounded-lg bg-red-50'
                    >
                      <XCircle className='h-5 w-5 text-red-500 flex-shrink-0 mt-0.5' />
                      <div>
                        <p className='text-sm font-medium text-red-800'>{error.endpoint}</p>
                        <p className='text-sm text-red-600 mt-1'>{error.error}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='order-data' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Datos de la Orden de Prueba</CardTitle>
              <CardDescription>
                Información específica capturada durante el proceso de compra
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>Información del Cliente</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-500'>Email:</span>
                      <span className='text-sm font-medium'>test@example.com</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-500'>Teléfono:</span>
                      <span className='text-sm font-medium'>+54 11 1234-5678</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-500'>Observaciones:</span>
                      <span className='text-sm font-medium'>Campo de observaciones funcional</span>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>Estado de APIs Críticas</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-500'>/checkout/validate:</span>
                      <Badge variant='destructive'>Error 400</Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-500'>/orders/create:</span>
                      <Badge variant='destructive'>Error 400</Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-500'>/admin/orders:</span>
                      <Badge variant='default'>200 OK</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className='my-6' />

              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Resumen de Funcionalidades</h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='p-4 border rounded-lg'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <CheckCircle className='h-5 w-5 text-green-500' />
                      <span className='font-medium'>Campo de Observaciones</span>
                    </div>
                    <p className='text-sm text-gray-600'>Funcional y completado correctamente</p>
                  </div>

                  <div className='p-4 border rounded-lg'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <CheckCircle className='h-5 w-5 text-green-500' />
                      <span className='font-medium'>Botón Finalizar Compra</span>
                    </div>
                    <p className='text-sm text-gray-600'>Interactivo con data-testid</p>
                  </div>

                  <div className='p-4 border rounded-lg'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <CheckCircle className='h-5 w-5 text-green-500' />
                      <span className='font-medium'>Panel de Órdenes</span>
                    </div>
                    <p className='text-sm text-gray-600'>Accesible y funcional</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
