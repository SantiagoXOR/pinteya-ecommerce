'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  FileText,
  AlertCircle,
  PlayCircle,
  RefreshCw,
} from 'lucide-react'

interface FlowStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'running' | 'success' | 'error'
  icon: React.ReactNode
  timestamp?: string
  data?: any
  error?: string
}

interface PurchaseFlowVisualizationProps {
  onRunSimulation?: () => Promise<void>
  simulationLogs?: any
}

const PurchaseFlowVisualization: React.FC<PurchaseFlowVisualizationProps> = ({
  onRunSimulation,
  simulationLogs,
}) => {
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [logs, setLogs] = useState<any>(null)

  const flowSteps: FlowStep[] = [
    {
      id: 'server-check',
      title: 'Verificación del Servidor',
      description: 'Verificando conectividad con la API',
      status: 'pending',
      icon: <AlertCircle className='w-5 h-5' />,
    },
    {
      id: 'product-load',
      title: 'Carga de Productos',
      description: 'Obteniendo catálogo de productos disponibles',
      status: 'pending',
      icon: <Package className='w-5 h-5' />,
    },
    {
      id: 'product-selection',
      title: 'Selección de Productos',
      description: 'Simulando selección y agregado al carrito',
      status: 'pending',
      icon: <ShoppingCart className='w-5 h-5' />,
    },
    {
      id: 'cart-validation',
      title: 'Validación de Carrito',
      description: 'Verificando stock y disponibilidad',
      status: 'pending',
      icon: <CheckCircle className='w-5 h-5' />,
    },
    {
      id: 'payment-preference',
      title: 'Creación de Preferencia',
      description: 'Generando preferencia de pago en MercadoPago',
      status: 'pending',
      icon: <CreditCard className='w-5 h-5' />,
    },
    {
      id: 'order-verification',
      title: 'Verificación en BD',
      description: 'Confirmando registro de orden en Supabase',
      status: 'pending',
      icon: <FileText className='w-5 h-5' />,
    },
    {
      id: 'payment-simulation',
      title: 'Simulación de Pago',
      description: 'Procesando pago con credenciales de prueba',
      status: 'pending',
      icon: <CreditCard className='w-5 h-5' />,
    },
    {
      id: 'webhook-processing',
      title: 'Procesamiento de Webhook',
      description: 'Actualizando estado de la orden',
      status: 'pending',
      icon: <RefreshCw className='w-5 h-5' />,
    },
    {
      id: 'order-confirmation',
      title: 'Confirmación de Orden',
      description: 'Generando confirmación final',
      status: 'pending',
      icon: <Truck className='w-5 h-5' />,
    },
    {
      id: 'flow-validation',
      title: 'Validación Completa',
      description: 'Verificando integridad del flujo',
      status: 'pending',
      icon: <CheckCircle className='w-5 h-5' />,
    },
  ]

  const [steps, setSteps] = useState<FlowStep[]>(flowSteps)

  useEffect(() => {
    if (simulationLogs) {
      setLogs(simulationLogs)
      updateStepsFromLogs(simulationLogs)
    }
  }, [simulationLogs])

  const updateStepsFromLogs = (logsData: any) => {
    if (!logsData || !logsData.logs) {
      return
    }

    const updatedSteps = [...flowSteps]
    const logsByStep = logsData.logs.reduce((acc: any, log: any) => {
      const stepNumber = log.step.split('.')[0]
      if (!acc[stepNumber]) {
        acc[stepNumber] = []
      }
      acc[stepNumber].push(log)
      return acc
    }, {})

    Object.keys(logsByStep).forEach((stepNumber, index) => {
      const stepLogs = logsByStep[stepNumber]
      const successLog = stepLogs.find((log: any) => log.status === 'SUCCESS')
      const errorLog = stepLogs.find((log: any) => log.status === 'ERROR')

      if (index < updatedSteps.length) {
        if (successLog) {
          updatedSteps[index].status = 'success'
          updatedSteps[index].timestamp = successLog.timestamp
          updatedSteps[index].data = successLog.data
        } else if (errorLog) {
          updatedSteps[index].status = 'error'
          updatedSteps[index].timestamp = errorLog.timestamp
          updatedSteps[index].error = errorLog.error
        }
      }
    })

    setSteps(updatedSteps)
  }

  const runSimulation = async () => {
    if (onRunSimulation) {
      setIsRunning(true)
      try {
        await onRunSimulation()
      } catch (error) {
        console.error('Error running simulation:', error)
      } finally {
        setIsRunning(false)
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='w-5 h-5 text-green-500' />
      case 'error':
        return <XCircle className='w-5 h-5 text-red-500' />
      case 'running':
        return <Clock className='w-5 h-5 text-blue-500 animate-spin' />
      default:
        return <Clock className='w-5 h-5 text-gray-400' />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: { variant: 'default', className: 'bg-green-100 text-green-800' },
      error: { variant: 'destructive', className: '' },
      running: { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      pending: { variant: 'secondary', className: '' },
    }

    const config = variants[status] || variants.pending

    return (
      <Badge variant={config.variant} className={config.className}>
        {status === 'success'
          ? 'Completado'
          : status === 'error'
            ? 'Error'
            : status === 'running'
              ? 'Ejecutando'
              : 'Pendiente'}
      </Badge>
    )
  }

  const successfulSteps = steps.filter(step => step.status === 'success').length
  const totalSteps = steps.length
  const progressPercentage = (successfulSteps / totalSteps) * 100

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-2xl font-bold text-gray-900'>
                🛒 Simulación de Flujo de Compra Completo
              </CardTitle>
              <p className='text-gray-600 mt-2'>
                Prueba automatizada del sistema de e-commerce con MercadoPago
              </p>
            </div>
            <Button
              onClick={runSimulation}
              disabled={isRunning}
              className='flex items-center gap-2'
            >
              {isRunning ? (
                <RefreshCw className='w-4 h-4 animate-spin' />
              ) : (
                <PlayCircle className='w-4 h-4' />
              )}
              {isRunning ? 'Ejecutando...' : 'Ejecutar Simulación'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center justify-between text-sm'>
              <span>Progreso del flujo</span>
              <span>
                {successfulSteps}/{totalSteps} pasos completados
              </span>
            </div>
            <Progress value={progressPercentage} className='w-full' />
          </div>
        </CardContent>
      </Card>

      {/* Flow Steps */}
      <div className='grid gap-4'>
        {steps.map((step, index) => (
          <Card
            key={step.id}
            className={`transition-all duration-300 ${
              step.status === 'success'
                ? 'border-green-200 bg-green-50'
                : step.status === 'error'
                  ? 'border-red-200 bg-red-50'
                  : step.status === 'running'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200'
            }`}
          >
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex-shrink-0'>{getStatusIcon(step.status)}</div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-semibold text-gray-900'>
                        {index + 1}. {step.title}
                      </h3>
                      {getStatusBadge(step.status)}
                    </div>
                    <p className='text-sm text-gray-600 mt-1'>{step.description}</p>
                    {step.timestamp && (
                      <p className='text-xs text-gray-500 mt-1'>
                        {new Date(step.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                {step.data && (
                  <div className='text-xs text-gray-500 max-w-xs'>
                    <pre className='whitespace-pre-wrap'>
                      {JSON.stringify(step.data, null, 2).substring(0, 100)}...
                    </pre>
                  </div>
                )}
              </div>
              {step.error && (
                <div className='mt-3 p-3 bg-red-100 border border-red-200 rounded-md'>
                  <p className='text-sm text-red-800'>
                    <strong>Error:</strong> {step.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      {logs && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Resumen de Ejecución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {logs.summary?.successfulSteps || 0}
                </div>
                <div className='text-sm text-gray-600'>Pasos Exitosos</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-600'>{logs.summary?.errors || 0}</div>
                <div className='text-sm text-gray-600'>Errores</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {logs.summary?.totalExecutionTime || 0}ms
                </div>
                <div className='text-sm text-gray-600'>Tiempo Total</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-600'>
                  {logs.summary?.successfulSteps && logs.summary?.totalSteps
                    ? Math.round((logs.summary.successfulSteps / logs.summary.totalSteps) * 100)
                    : 0}
                  %
                </div>
                <div className='text-sm text-gray-600'>Tasa de Éxito</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PurchaseFlowVisualization
