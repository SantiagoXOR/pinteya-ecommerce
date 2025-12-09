'use client'

import React, { useState, useEffect } from 'react'
import PurchaseFlowVisualization from '@/components/PurchaseFlowVisualization'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  Clock,
} from '@/lib/optimized-imports'

const PurchaseFlowTestPage: React.FC = () => {
  const [simulationLogs, setSimulationLogs] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRunTime, setLastRunTime] = useState<string | null>(null)

  useEffect(() => {
    checkSimulationStatus()
  }, [])

  const checkSimulationStatus = async () => {
    try {
      const response = await fetch('/api/admin/run-purchase-simulation')
      const data = await response.json()

      if (data.lastRun) {
        setLastRunTime(new Date(data.lastRun).toLocaleString())
        if (data.logsExist) {
          loadSimulationData()
        }
      }
    } catch (err) {
      console.error('Error checking simulation status:', err)
    }
  }

  const loadSimulationData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/run-purchase-simulation')
      const statusData = await response.json()

      if (statusData.logsExist && statusData.logs) {
        setSimulationLogs(statusData.logs)
      }
    } catch (err) {
      setError('Error cargando datos de simulación')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const runSimulation = async () => {
    setIsRunning(true)
    setError(null)

    try {
      // Ejecutar el script de simulación
      const response = await fetch('/api/admin/run-purchase-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setSimulationLogs(result.logs)
        setLastRunTime(new Date().toLocaleString())
      } else {
        throw new Error(result.error || 'Error desconocido en la simulación')
      }
    } catch (err) {
      console.error('Error running simulation:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsRunning(false)
    }
  }

  const downloadLogs = () => {
    if (!simulationLogs) {
      return
    }

    const dataStr = JSON.stringify(simulationLogs, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `purchase-flow-logs-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                🧪 Test de Flujo de Compra Completo
              </h1>
              <p className='text-gray-600 mt-2'>
                Simulación automatizada del proceso de compra con MercadoPago y Supabase
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <Button
                onClick={runSimulation}
                disabled={isRunning || isLoading}
                className='bg-green-600 hover:bg-green-700 flex items-center gap-2'
              >
                {isRunning ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Play className='w-4 h-4' />
                )}
                {isRunning ? 'Ejecutando...' : 'Ejecutar Simulación'}
              </Button>

              <Button
                onClick={loadSimulationData}
                disabled={isLoading || isRunning}
                variant='outline'
                className='flex items-center gap-2'
              >
                {isLoading ? (
                  <RefreshCw className='w-4 h-4 animate-spin' />
                ) : (
                  <RefreshCw className='w-4 h-4' />
                )}
                Recargar
              </Button>

              {simulationLogs && (
                <Button
                  variant='outline'
                  onClick={downloadLogs}
                  className='flex items-center gap-2'
                >
                  <Download className='w-4 h-4' />
                  Descargar Logs
                </Button>
              )}

              {lastRunTime && (
                <div className='flex items-center text-sm text-gray-600'>
                  <Clock className='w-4 h-4 mr-1' />
                  Última: {lastRunTime}
                </div>
              )}

              <Badge variant='secondary' className='px-3 py-1'>
                Modo Test
              </Badge>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <CheckCircle className='w-5 h-5 text-green-500' />
                Funcionalidades Probadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2 text-sm'>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  Selección de productos
                </li>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  Validación de stock
                </li>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  Creación de preferencia MP
                </li>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  Registro en Supabase
                </li>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  Procesamiento de webhooks
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Info className='w-5 h-5 text-blue-500' />
                Datos de Prueba
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div>
                  <strong>Email:</strong> test@pinteya.com
                </div>
                <div>
                  <strong>Tarjeta Aprobada:</strong> 4509 9535 6623 3704
                </div>
                <div>
                  <strong>Tarjeta Rechazada:</strong> 4013 5406 8274 6260
                </div>
                <div>
                  <strong>Tarjeta Pendiente:</strong> 4009 1753 3280 7176
                </div>
                <div className='text-xs text-gray-500 mt-2'>
                  * Credenciales de prueba de MercadoPago
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <AlertTriangle className='w-5 h-5 text-yellow-500' />
                Consideraciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2 text-sm'>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                  Modo sandbox activado
                </li>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                  No se procesan pagos reales
                </li>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                  Stock se restaura automáticamente
                </li>
                <li className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                  Logs se guardan localmente
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className='mb-6 border-red-200 bg-red-50'>
            <AlertTriangle className='h-4 w-4 text-red-600' />
            <AlertDescription className='text-red-800'>
              <strong>Error en la simulación:</strong>{' '}
              {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Visualization */}
        <PurchaseFlowVisualization
          onRunSimulation={runSimulation}
          simulationLogs={simulationLogs}
        />

        {/* Additional Information */}
        <div className='mt-8'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                Información Técnica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h4 className='font-semibold mb-3'>🔧 Tecnologías Utilizadas</h4>
                  <ul className='space-y-1 text-sm'>
                    <li>• Next.js 14 con App Router</li>
                    <li>• Supabase (Base de datos y autenticación)</li>
                    <li>• MercadoPago SDK</li>
                    <li>• TypeScript</li>
                    <li>• Tailwind CSS</li>
                    <li>• Shadcn/ui Components</li>
                  </ul>
                </div>
                <div>
                  <h4 className='font-semibold mb-3'>📋 Validaciones Incluidas</h4>
                  <ul className='space-y-1 text-sm'>
                    <li>• Verificación de conectividad API</li>
                    <li>• Validación de stock en tiempo real</li>
                    <li>• Integridad de datos de pago</li>
                    <li>• Procesamiento correcto de webhooks</li>
                    <li>• Registro completo en base de datos</li>
                    <li>• Generación de confirmaciones</li>
                  </ul>
                </div>
              </div>

              <Separator className='my-6' />

              <div className='flex items-center justify-between'>
                <div className='text-sm text-gray-600'>
                  Esta simulación prueba el flujo completo de compra sin afectar datos de
                  producción.
                </div>
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <a
                      href='https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/test-integration'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-1'
                    >
                      <ExternalLink className='w-3 h-3' />
                      Docs MercadoPago
                    </a>
                  </Button>
                  <Button variant='outline' size='sm' asChild>
                    <a
                      href='https://supabase.com/docs'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-1'
                    >
                      <ExternalLink className='w-3 h-3' />
                      Docs Supabase
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PurchaseFlowTestPage
