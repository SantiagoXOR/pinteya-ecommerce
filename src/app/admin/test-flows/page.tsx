// ===================================
// ADMIN TEST FLOWS DASHBOARD
// Dashboard para gestión de flujos de testing automatizados
// ===================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  GitBranch,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  TrendingUp,
  Activity,
  Zap,
  AlertTriangle,
} from 'lucide-react'

interface TestFlow {
  id: string
  name: string
  description: string
  status: 'idle' | 'running' | 'success' | 'failed'
  lastRun?: Date
  duration?: number
  successRate: number
  totalExecutions: number
}

interface FlowExecution {
  id: string
  flowId: string
  status: 'running' | 'success' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration?: number
  trigger: string
  steps: any[]
}

const TestFlowsDashboard = () => {
  const [flows, setFlows] = useState<TestFlow[]>([])
  const [executions, setExecutions] = useState<FlowExecution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [runningFlows, setRunningFlows] = useState<Set<string>>(new Set())

  // Cargar datos iniciales
  useEffect(() => {
    loadFlows()
    loadExecutions()
  }, [])

  const loadFlows = async () => {
    try {
      const response = await fetch('/api/admin/test-flows?action=flows')
      if (response.ok) {
        const data = await response.json()
        setFlows(data.data || [])
      }
    } catch (error) {
      console.error('Error cargando flujos:', error)
    }
  }

  const loadExecutions = async () => {
    try {
      const response = await fetch('/api/admin/test-flows?action=executions')
      if (response.ok) {
        const data = await response.json()
        setExecutions(data.data || [])
      }
    } catch (error) {
      console.error('Error cargando ejecuciones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const executeFlow = async (flowId: string) => {
    setRunningFlows(prev => new Set(prev).add(flowId))

    try {
      const response = await fetch('/api/admin/test-flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'execute',
          flowId,
          trigger: 'manual',
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Flujo ejecutado:', result)

        // Actualizar datos después de un delay
        setTimeout(() => {
          loadFlows()
          loadExecutions()
        }, 2000)
      }
    } catch (error) {
      console.error('Error ejecutando flujo:', error)
    } finally {
      setTimeout(() => {
        setRunningFlows(prev => {
          const newSet = new Set(prev)
          newSet.delete(flowId)
          return newSet
        })
      }, 3000)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='w-4 h-4 text-green-600' />
      case 'failed':
        return <XCircle className='w-4 h-4 text-red-600' />
      case 'running':
        return <RefreshCw className='w-4 h-4 text-blue-600 animate-spin' />
      default:
        return <Clock className='w-4 h-4 text-gray-600' />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'running':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`
    }
    if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`
    }
    return `${(ms / 60000).toFixed(1)}m`
  }

  // Datos simulados para demostración
  const mockFlows: TestFlow[] = [
    {
      id: 'ci-cd-complete',
      name: 'CI/CD Completo',
      description: 'Flujo completo de integración continua y despliegue',
      status: 'idle',
      lastRun: new Date(Date.now() - 3600000),
      duration: 180000,
      successRate: 92.5,
      totalExecutions: 47,
    },
    {
      id: 'quick-test',
      name: 'Testing Rápido',
      description: 'Flujo rápido para desarrollo',
      status: 'success',
      lastRun: new Date(Date.now() - 1800000),
      duration: 45000,
      successRate: 98.2,
      totalExecutions: 156,
    },
    {
      id: 'performance-test',
      name: 'Testing de Performance',
      description: 'Flujo especializado en performance y Core Web Vitals',
      status: 'idle',
      lastRun: new Date(Date.now() - 86400000),
      duration: 240000,
      successRate: 87.3,
      totalExecutions: 23,
    },
  ]

  const displayFlows = flows.length > 0 ? flows : mockFlows

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Test Flows Dashboard</h1>
          <p className='text-gray-600 mt-1'>Gestión de flujos automatizados de CI/CD y testing</p>
        </div>
        <div className='flex items-center gap-4'>
          <Badge variant='outline'>{displayFlows.length} flujos configurados</Badge>
          <Button
            onClick={() => {
              loadFlows()
              loadExecutions()
            }}
            variant='outline'
            size='sm'
          >
            <RefreshCw className='w-4 h-4 mr-2' />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-gray-600'>Flujos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='text-2xl font-bold'>{displayFlows.length}</div>
              <GitBranch className='w-8 h-8 text-blue-500' />
            </div>
            <div className='text-xs text-gray-500 mt-1'>{runningFlows.size} ejecutándose</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-gray-600'>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='text-2xl font-bold text-green-600'>
                {displayFlows.length > 0
                  ? Math.round(
                      displayFlows.reduce((acc, f) => acc + f.successRate, 0) / displayFlows.length
                    )
                  : 0}
                %
              </div>
              <TrendingUp className='w-8 h-8 text-green-500' />
            </div>
            <div className='text-xs text-gray-500 mt-1'>Promedio general</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-gray-600'>Ejecuciones Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='text-2xl font-bold'>
                {displayFlows.reduce((acc, f) => acc + f.totalExecutions, 0)}
              </div>
              <Activity className='w-8 h-8 text-purple-500' />
            </div>
            <div className='text-xs text-gray-500 mt-1'>Todas las ejecuciones</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-gray-600'>Tiempo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='text-2xl font-bold'>
                {displayFlows.length > 0
                  ? formatDuration(
                      displayFlows.reduce((acc, f) => acc + (f.duration || 0), 0) /
                        displayFlows.length
                    )
                  : '0s'}
              </div>
              <Zap className='w-8 h-8 text-yellow-500' />
            </div>
            <div className='text-xs text-gray-500 mt-1'>Por ejecución</div>
          </CardContent>
        </Card>
      </div>

      {/* Flows List */}
      <Tabs defaultValue='flows' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='flows'>Flujos Disponibles</TabsTrigger>
          <TabsTrigger value='executions'>Ejecuciones Recientes</TabsTrigger>
          <TabsTrigger value='config'>Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value='flows' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {displayFlows.map(flow => (
              <Card key={flow.id}>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-2'>
                      <GitBranch className='w-5 h-5' />
                      {flow.name}
                    </CardTitle>
                    <Badge className={getStatusColor(flow.status)}>
                      {getStatusIcon(flow.status)}
                      <span className='ml-1 capitalize'>{flow.status}</span>
                    </Badge>
                  </div>
                  <CardDescription>{flow.description}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <div className='text-gray-500'>Success Rate</div>
                      <div className='font-medium text-green-600'>{flow.successRate}%</div>
                    </div>
                    <div>
                      <div className='text-gray-500'>Ejecuciones</div>
                      <div className='font-medium'>{flow.totalExecutions}</div>
                    </div>
                    <div>
                      <div className='text-gray-500'>Última Ejecución</div>
                      <div className='font-medium'>
                        {flow.lastRun ? flow.lastRun.toLocaleString() : 'Nunca'}
                      </div>
                    </div>
                    <div>
                      <div className='text-gray-500'>Duración</div>
                      <div className='font-medium'>
                        {flow.duration ? formatDuration(flow.duration) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Button
                      onClick={() => executeFlow(flow.id)}
                      disabled={runningFlows.has(flow.id)}
                      className='flex-1'
                    >
                      {runningFlows.has(flow.id) ? (
                        <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                      ) : (
                        <Play className='w-4 h-4 mr-2' />
                      )}
                      {runningFlows.has(flow.id) ? 'Ejecutando...' : 'Ejecutar'}
                    </Button>
                    <Button variant='outline' size='sm'>
                      <Settings className='w-4 h-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='executions' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Ejecuciones Recientes</CardTitle>
              <CardDescription>Historial de ejecuciones de flujos de testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center text-gray-500 py-8'>
                <Activity className='w-12 h-12 mx-auto mb-4 opacity-50' />
                <p>No hay ejecuciones recientes</p>
                <p className='text-sm'>Ejecuta un flujo para ver el historial aquí</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='config' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Flujos</CardTitle>
              <CardDescription>Configuración avanzada y programación de flujos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div>
                    <div className='font-medium'>Ejecución Automática</div>
                    <div className='text-sm text-gray-500'>
                      Ejecutar flujos automáticamente en eventos específicos
                    </div>
                  </div>
                  <Badge variant='secondary'>Próximamente</Badge>
                </div>

                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div>
                    <div className='font-medium'>Notificaciones</div>
                    <div className='text-sm text-gray-500'>
                      Configurar alertas por email y Slack
                    </div>
                  </div>
                  <Badge variant='secondary'>Próximamente</Badge>
                </div>

                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div>
                    <div className='font-medium'>Programación</div>
                    <div className='text-sm text-gray-500'>Programar ejecuciones con cron jobs</div>
                  </div>
                  <Badge variant='secondary'>Próximamente</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TestFlowsDashboard
