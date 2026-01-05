'use client'

/**
 * DASHBOARD DE OPTIMIZACIÓN - PINTEYA E-COMMERCE
 * Monitoreo en tiempo real de las optimizaciones de base de datos
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Database,
  TrendingDown,
  TrendingUp,
  Zap,
  HardDrive,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
} from '@/lib/optimized-imports'

interface OptimizationMetrics {
  analytics: {
    sizeBefore: string
    sizeAfter: string
    reduction: number
    spaceSaved: string
    bytesPerRecordBefore: number
    bytesPerRecordAfter: number
  }
  products: {
    sizeBefore: string
    sizeAfter: string
    reduction: number
    spaceSaved: string
    bytesPerRecordBefore: number
    bytesPerRecordAfter: number
  }
  total: {
    sizeBefore: string
    sizeAfter: string
    reduction: number
    spaceSaved: string
  }
}

interface DatabaseStats {
  totalEvents: number
  tableSize: string
  avgEventsPerDay: number
  oldestEvent: string
  newestEvent: string
  compressionRatio: number
}

export const OptimizationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null)
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastCleanup, setLastCleanup] = useState<string | null>(null)

  // Datos estáticos basados en nuestras optimizaciones
  const optimizationData: OptimizationMetrics = {
    analytics: {
      sizeBefore: '1,512 KB',
      sizeAfter: '512 KB',
      reduction: 66,
      spaceSaved: '1,000 KB',
      bytesPerRecordBefore: 499.93,
      bytesPerRecordAfter: 169.29,
    },
    products: {
      sizeBefore: '368 KB',
      sizeAfter: '176 KB',
      reduction: 52,
      spaceSaved: '192 KB',
      bytesPerRecordBefore: 7110.04,
      bytesPerRecordAfter: 3400.45,
    },
    total: {
      sizeBefore: '1,880 KB',
      sizeAfter: '688 KB',
      reduction: 63,
      spaceSaved: '1,192 KB',
    },
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Cargar estadísticas de la base de datos
      const response = await fetch('/api/admin/analytics/cleanup')
      if (response.ok) {
        const data = await response.json()
        setDbStats(data.stats)
      }

      setMetrics(optimizationData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeCleanup = async () => {
    try {
      const response = await fetch('/api/admin/analytics/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const result = await response.json()
        setLastCleanup(new Date().toISOString())
        await loadDashboardData()

        alert(
          `Limpieza completada: ${result.deleted} eventos eliminados, ${result.sizeFreed} liberados`
        )
      }
    } catch (error) {
      console.error('Error executing cleanup:', error)
      alert('Error ejecutando limpieza')
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600'></div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Dashboard de Optimización</h1>
          <p className='text-gray-600'>Monitoreo de optimizaciones de base de datos</p>
        </div>
        <Button onClick={executeCleanup} className='bg-orange-600 hover:bg-orange-700'>
          <Database className='w-4 h-4 mr-2' />
          Ejecutar Limpieza
        </Button>
      </div>

      {/* Métricas principales */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Reducción Total</CardTitle>
            <TrendingDown className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>{metrics?.total.reduction}%</div>
            <p className='text-xs text-gray-600'>{metrics?.total.spaceSaved} ahorrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Analytics Optimizado</CardTitle>
            <Zap className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>{metrics?.analytics.reduction}%</div>
            <p className='text-xs text-gray-600'>{metrics?.analytics.spaceSaved} liberados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Productos Optimizado</CardTitle>
            <HardDrive className='h-4 w-4 text-purple-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple-600'>{metrics?.products.reduction}%</div>
            <p className='text-xs text-gray-600'>{metrics?.products.spaceSaved} liberados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Eventos Totales</CardTitle>
            <BarChart3 className='h-4 w-4 text-orange-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {dbStats?.totalEvents?.toLocaleString() || '0'}
            </div>
            <p className='text-xs text-gray-600'>{dbStats?.avgEventsPerDay || 0}/día promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con detalles */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Resumen</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
          <TabsTrigger value='products'>Productos</TabsTrigger>
          <TabsTrigger value='maintenance'>Mantenimiento</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Progreso de Optimización</CardTitle>
                <CardDescription>Estado actual de las optimizaciones implementadas</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Analytics Events</span>
                    <span>{metrics?.analytics.reduction}%</span>
                  </div>
                  <Progress value={metrics?.analytics.reduction} className='h-2' />
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Products Table</span>
                    <span>{metrics?.products.reduction}%</span>
                  </div>
                  <Progress value={metrics?.products.reduction} className='h-2' />
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Total Optimization</span>
                    <span>{metrics?.total.reduction}%</span>
                  </div>
                  <Progress value={metrics?.total.reduction} className='h-2' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
                <CardDescription>Indicadores de salud de la base de datos</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <span className='text-sm'>Optimizaciones aplicadas</span>
                  <Badge variant='secondary'>Activo</Badge>
                </div>

                <div className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <span className='text-sm'>Índices optimizados</span>
                  <Badge variant='secondary'>Activo</Badge>
                </div>

                <div className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <span className='text-sm'>Limpieza automática</span>
                  <Badge variant='secondary'>Configurado</Badge>
                </div>

                <div className='flex items-center space-x-2'>
                  <AlertTriangle className='h-4 w-4 text-yellow-600' />
                  <span className='text-sm'>Monitoreo continuo</span>
                  <Badge variant='outline'>Recomendado</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='analytics' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Optimización de Analytics</CardTitle>
              <CardDescription>Detalles de la optimización de eventos de analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-red-600'>
                    {metrics?.analytics.sizeBefore}
                  </div>
                  <div className='text-sm text-gray-600'>Tamaño Original</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {metrics?.analytics.sizeAfter}
                  </div>
                  <div className='text-sm text-gray-600'>Tamaño Optimizado</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {metrics?.analytics.bytesPerRecordBefore.toFixed(0)}
                  </div>
                  <div className='text-sm text-gray-600'>Bytes/Evento (Antes)</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {metrics?.analytics.bytesPerRecordAfter.toFixed(0)}
                  </div>
                  <div className='text-sm text-gray-600'>Bytes/Evento (Después)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='products' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Optimización de Productos</CardTitle>
              <CardDescription>
                Detalles de la optimización de la tabla de productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-red-600'>
                    {metrics?.products.sizeBefore}
                  </div>
                  <div className='text-sm text-gray-600'>Tamaño Original</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {metrics?.products.sizeAfter}
                  </div>
                  <div className='text-sm text-gray-600'>Tamaño Optimizado</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {(metrics?.products.bytesPerRecordBefore / 1000).toFixed(1)}K
                  </div>
                  <div className='text-sm text-gray-600'>Bytes/Producto (Antes)</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {(metrics?.products.bytesPerRecordAfter / 1000).toFixed(1)}K
                  </div>
                  <div className='text-sm text-gray-600'>Bytes/Producto (Después)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='maintenance' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Mantenimiento Automático</CardTitle>
              <CardDescription>Configuración y estado de la limpieza automática</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span>Última limpieza:</span>
                <span className='text-sm text-gray-600'>
                  {lastCleanup ? new Date(lastCleanup).toLocaleString() : 'No ejecutada'}
                </span>
              </div>

              <div className='flex items-center justify-between'>
                <span>Frecuencia recomendada:</span>
                <Badge variant='outline'>Semanal</Badge>
              </div>

              <div className='flex items-center justify-between'>
                <span>Retención de datos:</span>
                <Badge variant='outline'>30 días</Badge>
              </div>

              <Button onClick={executeCleanup} className='w-full bg-orange-600 hover:bg-orange-700'>
                <Clock className='w-4 h-4 mr-2' />
                Ejecutar Limpieza Manual
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
