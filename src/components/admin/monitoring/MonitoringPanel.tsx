// ===================================
// PINTEYA E-COMMERCE - MONITORING PANEL
// Panel de monitoreo para visualizar problemas de API y renderizado
// ===================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useApiMonitoring } from '@/utils/api-monitoring'
import {
  AlertTriangle,
  Activity,
  TrendingDown,
  Download,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface MonitoringPanelProps {
  className?: string
}

export function MonitoringPanel({ className }: MonitoringPanelProps) {
  const { getStats, clearData, exportData } = useApiMonitoring()
  const [stats, setStats] = useState(getStats())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Actualizar estadísticas cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats())
    }, 5000)

    return () => clearInterval(interval)
  }, [getStats])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setStats(getStats())
      setIsRefreshing(false)
    }, 500)
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monitoring-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos de monitoreo?')) {
      clearData()
      setStats(getStats())
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getStatusColor = (discrepancy: number) => {
    if (discrepancy === 0) {
      return 'bg-green-500'
    }
    if (discrepancy <= 2) {
      return 'bg-yellow-500'
    }
    return 'bg-red-500'
  }

  const getIssueLevel = (expected: number, rendered: number) => {
    const diff = Math.abs(expected - rendered)
    if (diff === 0) {
      return { level: 'success', color: 'text-green-600' }
    }
    if (diff <= 2) {
      return { level: 'warning', color: 'text-yellow-600' }
    }
    return { level: 'error', color: 'text-red-600' }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con estadísticas generales */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Panel de Monitoreo</h2>
          <p className='text-muted-foreground'>Monitoreo en tiempo real de la API y renderizado</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant='outline' size='sm' onClick={handleExport}>
            <Download className='h-4 w-4 mr-2' />
            Exportar
          </Button>
          <Button variant='outline' size='sm' onClick={handleClear}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Eventos</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalEvents}</div>
            <p className='text-xs text-muted-foreground'>Llamadas a API monitoreadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Eventos Críticos</CardTitle>
            <AlertTriangle className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>{stats.criticalEvents}</div>
            <p className='text-xs text-muted-foreground'>Con pérdida de datos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Problemas de Renderizado</CardTitle>
            <Eye className='h-4 w-4 text-yellow-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>{stats.totalIssues}</div>
            <p className='text-xs text-muted-foreground'>Errores de visualización</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Discrepancia Promedio</CardTitle>
            <TrendingDown className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.averageDiscrepancy.toFixed(1)}</div>
            <p className='text-xs text-muted-foreground'>Elementos perdidos por llamada</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con detalles */}
      <Tabs defaultValue='events' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='events'>Eventos Recientes</TabsTrigger>
          <TabsTrigger value='issues'>Problemas de Renderizado</TabsTrigger>
        </TabsList>

        <TabsContent value='events' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Eventos de API Recientes</CardTitle>
              <CardDescription>
                Últimas {stats.recentEvents.length} llamadas a la API monitoreadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-[400px]'>
                <div className='space-y-3'>
                  {stats.recentEvents.length === 0 ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      <Activity className='h-8 w-8 mx-auto mb-2 opacity-50' />
                      <p>No hay eventos registrados</p>
                    </div>
                  ) : (
                    stats.recentEvents.map((event, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-3 border rounded-lg'
                      >
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <div
                              className={`w-2 h-2 rounded-full ${getStatusColor(event.discrepancy)}`}
                            />
                            <code className='text-sm bg-muted px-2 py-1 rounded'>
                              {event.endpoint.split('?')[0]}
                            </code>
                            <Badge variant='outline' className='text-xs'>
                              {formatTimestamp(event.timestamp)}
                            </Badge>
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Esperados: {event.expectedCount} | Obtenidos: {event.actualCount}
                            {event.discrepancy > 0 && (
                              <span className='text-red-600 ml-2'>
                                (Perdidos: {event.discrepancy})
                              </span>
                            )}
                          </div>
                        </div>
                        {event.discrepancy > 0 ? (
                          <AlertCircle className='h-5 w-5 text-red-500' />
                        ) : (
                          <CheckCircle2 className='h-5 w-5 text-green-500' />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='issues' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Problemas de Renderizado</CardTitle>
              <CardDescription>
                Últimos {stats.recentIssues.length} problemas detectados en componentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-[400px]'>
                <div className='space-y-3'>
                  {stats.recentIssues.length === 0 ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      <Eye className='h-8 w-8 mx-auto mb-2 opacity-50' />
                      <p>No hay problemas de renderizado registrados</p>
                    </div>
                  ) : (
                    stats.recentIssues.map((issue, index) => {
                      const { level, color } = getIssueLevel(
                        issue.expectedItems,
                        issue.renderedItems
                      )
                      return (
                        <div key={index} className='p-3 border rounded-lg space-y-2'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <Badge variant='outline'>{issue.component}</Badge>
                              <Badge variant='outline' className='text-xs'>
                                {formatTimestamp(issue.timestamp)}
                              </Badge>
                            </div>
                            <div className={`text-sm font-medium ${color}`}>
                              {level === 'success' && 'OK'}
                              {level === 'warning' && 'Advertencia'}
                              {level === 'error' && 'Error'}
                            </div>
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Esperados: {issue.expectedItems} | Renderizados: {issue.renderedItems}
                          </div>
                          {issue.errorDetails && (
                            <div className='text-sm text-red-600 bg-red-50 p-2 rounded'>
                              {issue.errorDetails}
                            </div>
                          )}
                          {issue.filterCriteria && (
                            <details className='text-xs'>
                              <summary className='cursor-pointer text-muted-foreground hover:text-foreground'>
                                Ver filtros aplicados
                              </summary>
                              <pre className='mt-2 bg-muted p-2 rounded text-xs overflow-x-auto'>
                                {JSON.stringify(issue.filterCriteria, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MonitoringPanel
