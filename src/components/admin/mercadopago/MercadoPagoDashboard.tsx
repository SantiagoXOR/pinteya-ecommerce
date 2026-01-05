// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO ADMIN DASHBOARD
// Dashboard completo para gestión y monitoreo de MercadoPago
// ===================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminCard } from '@/components/admin/ui/AdminCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMercadoPagoMetrics, type Alert as MercadoPagoAlert } from '@/hooks/useMercadoPagoMetrics'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  RefreshCw,
  Server,
  TrendingDown,
  TrendingUp,
  Zap,
} from '@/lib/optimized-imports'
import { useToast } from '@/hooks/use-toast'

// ===================================
// TIPOS
// ===================================

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: 'up' | 'down' | 'stable'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  icon?: React.ReactNode
  suffix?: string
}

interface AlertItemProps {
  alert: MercadoPagoAlert
}

// ===================================
// COMPONENTES AUXILIARES
// ===================================

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  trend,
  severity,
  icon,
  suffix = '',
}) => {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'high':
        return 'border-orange-200 bg-orange-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='h-4 w-4 text-green-500' />
      case 'down':
        return <TrendingDown className='h-4 w-4 text-red-500' />
      default:
        return <Activity className='h-4 w-4 text-gray-500' />
    }
  }

  return (
    <Card className={severity ? getSeverityColor(severity) : ''}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <div className='flex items-center space-x-1'>
          {icon}
          {trend && getTrendIcon(trend)}
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>
          {value}
          {suffix && <span className='text-lg text-muted-foreground ml-1'>{suffix}</span>}
        </div>
        {description && <p className='text-xs text-muted-foreground mt-1'>{description}</p>}
      </CardContent>
    </Card>
  )
}

const AlertItem: React.FC<AlertItemProps> = ({ alert }) => {
  const getSeverityVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'info':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className='h-4 w-4' />
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-orange-500' />
      case 'info':
        return <CheckCircle className='h-4 w-4 text-blue-500' />
      default:
        return <Activity className='h-4 w-4' />
    }
  }

  return (
    <Alert variant={getSeverityVariant(alert.type)} className='mb-3'>
      <div className='flex items-start space-x-2'>
        {getTypeIcon(alert.type)}
        <div className='flex-1'>
          <AlertTitle className='flex items-center space-x-2'>
            <span>{alert.endpoint || 'Sistema'}</span>
            <Badge variant={getSeverityVariant(alert.type)}>{alert.type}</Badge>
          </AlertTitle>
          <AlertDescription className='mt-1'>{alert.message}</AlertDescription>
          <div className='text-xs text-muted-foreground mt-2'>
            {new Date(alert.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    </Alert>
  )
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const MercadoPagoDashboard: React.FC = () => {
  const { toast } = useToast()
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Asegurar que el componente esté montado antes de mostrar toasts
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const { metrics, isLoading, error, lastUpdate, refresh, resetMetrics } = useMercadoPagoMetrics({
    refreshInterval: 30000, // 30 segundos
    autoRefresh: true,
    // No pasar onError aquí para evitar problemas durante el render
    // En su lugar, manejaremos errores con useEffect
  })

  // Manejar errores con useEffect después del montaje
  useEffect(() => {
    if (error && isMounted) {
      toast({
        title: 'Error al cargar métricas',
        description: error,
        variant: 'destructive',
      })
    }
  }, [error, isMounted, toast])

  // Handlers - usar useCallback para evitar recreaciones
  const handleRefresh = React.useCallback(async () => {
    await refresh()
    if (isMounted) {
      toast({
        title: 'Métricas actualizadas',
        description: 'Las métricas se han actualizado correctamente.',
      })
    }
  }, [refresh, toast, isMounted])

  const handleResetMetrics = React.useCallback(async () => {
    if (confirm('¿Está seguro de que desea reiniciar las métricas? Esta acción no se puede deshacer.')) {
      await resetMetrics()
      if (isMounted) {
        toast({
          title: 'Métricas reiniciadas',
          description: 'Las métricas se han reiniciado correctamente.',
        })
      }
    }
  }, [resetMetrics, toast, isMounted])

  const handleExportData = React.useCallback(() => {
    if (!metrics) {
      if (isMounted) {
        toast({
          title: 'No hay datos',
          description: 'No hay métricas disponibles para exportar.',
          variant: 'destructive',
        })
      }
      return
    }

    try {
      const data = JSON.stringify(metrics, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mercadopago-metrics-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      if (isMounted) {
        toast({
          title: 'Datos exportados',
          description: 'Las métricas se han descargado exitosamente.',
        })
      }
    } catch (error) {
      if (isMounted) {
        toast({
          title: 'Error al exportar',
          description: 'No se pudieron exportar los datos.',
          variant: 'destructive',
        })
      }
    }
  }, [metrics, toast, isMounted])

  // Calcular métricas derivadas
  const criticalAlerts = metrics?.alerts.filter(alert => alert.type === 'error') || []
  const warningAlerts = metrics?.alerts.filter(alert => alert.type === 'warning') || []
  const hasAlerts = (metrics?.alerts.length || 0) > 0

  // Formatear uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (isLoading && !metrics) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <RefreshCw className='h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500' />
          <p className='text-muted-foreground'>Cargando métricas de MercadoPago...</p>
        </div>
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <Alert variant='destructive'>
        <AlertTriangle className='h-4 w-4' />
        <AlertTitle>Error al cargar métricas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={handleRefresh} className='mt-4'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Reintentar
        </Button>
      </Alert>
    )
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className='h-4 w-4' />
        <AlertTitle>No hay datos disponibles</AlertTitle>
        <AlertDescription>
          No se pudieron cargar las métricas de MercadoPago. Por favor, intente más tarde.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header con Gradiente - Estilo Admin */}
      <div className='bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg p-4 sm:p-6 text-white'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0'>
          <div>
            <div className='flex items-center space-x-3 mb-2'>
              <CreditCard className='w-6 h-6 sm:w-8 sm:h-8' />
              <h1 className='text-2xl sm:text-3xl font-bold'>MercadoPago Admin</h1>
            </div>
            <p className='text-indigo-100 text-sm sm:text-base'>
              Panel de administración y monitoreo de pagos en tiempo real
            </p>
            {lastUpdate && (
              <p className='text-indigo-200 text-xs sm:text-sm mt-2'>
                Última actualización: {lastUpdate.toLocaleString()}
              </p>
            )}
          </div>
          <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
            <Button
              variant='secondary'
              onClick={() => setAutoRefresh(!autoRefresh)}
              className='flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 text-white border-white/30'
            >
              <Activity className='h-4 w-4' />
              <span className='hidden sm:inline'>{autoRefresh ? 'Pausar' : 'Reanudar'}</span>
            </Button>
            <Button
              variant='secondary'
              onClick={handleRefresh}
              disabled={isLoading}
              className='flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 text-white border-white/30'
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className='hidden sm:inline'>Actualizar</span>
            </Button>
            <Button
              variant='secondary'
              onClick={handleExportData}
              className='flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 text-white border-white/30'
            >
              <Download className='h-4 w-4' />
              <span className='hidden sm:inline'>Exportar</span>
            </Button>
            <Button
              variant='secondary'
              onClick={handleResetMetrics}
              className='flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-white text-indigo-600 hover:bg-indigo-50'
            >
              <RefreshCw className='h-4 w-4' />
              <span className='hidden sm:inline'>Reiniciar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Alertas Críticas */}
      {criticalAlerts.length > 0 && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>¡Alertas Críticas Activas!</AlertTitle>
          <AlertDescription>
            Hay {criticalAlerts.length} alerta(s) crítica(s) que requieren atención inmediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas en Tiempo Real */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <AdminCard className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Total de Solicitudes</p>
              <p className='text-3xl font-bold text-gray-900'>
                {metrics.realTimeMetrics.totalRequests.toLocaleString()}
              </p>
              <p className='text-xs text-gray-500 mt-1'>Solicitudes totales procesadas</p>
            </div>
            <div className='p-3 bg-blue-500 rounded-lg'>
              <Activity className='w-6 h-6 text-white' />
            </div>
          </div>
        </AdminCard>

        <AdminCard className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Tasa de Éxito</p>
              <p className='text-3xl font-bold text-gray-900'>
                {metrics.realTimeMetrics.successRate.toFixed(2)}%
              </p>
              <p className='text-xs text-gray-500 mt-1'>Porcentaje de solicitudes exitosas</p>
            </div>
            <div className='p-3 bg-green-500 rounded-lg'>
              <CheckCircle className='w-6 h-6 text-white' />
            </div>
          </div>
        </AdminCard>

        <AdminCard className='bg-gradient-to-br from-red-50 to-red-100 border-red-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Tasa de Error</p>
              <p className='text-3xl font-bold text-gray-900'>
                {metrics.realTimeMetrics.errorRate.toFixed(2)}%
              </p>
              <p className='text-xs text-gray-500 mt-1'>Porcentaje de solicitudes con error</p>
            </div>
            <div className='p-3 bg-red-500 rounded-lg'>
              <AlertTriangle className='w-6 h-6 text-white' />
            </div>
          </div>
        </AdminCard>

        <AdminCard className='bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Tiempo de Respuesta</p>
              <p className='text-3xl font-bold text-gray-900'>
                {metrics.realTimeMetrics.averageResponseTime}ms
              </p>
              <p className='text-xs text-gray-500 mt-1'>Tiempo promedio de respuesta</p>
            </div>
            <div className='p-3 bg-purple-500 rounded-lg'>
              <Clock className='w-6 h-6 text-white' />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Métricas Adicionales */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <AdminCard className='bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Rate Limit Hits</p>
              <p className='text-3xl font-bold text-gray-900'>
                {metrics.realTimeMetrics.rateLimitHits}
              </p>
              <p className='text-xs text-gray-500 mt-1'>Solicitudes bloqueadas por límite de tasa</p>
            </div>
            <div className='p-3 bg-orange-500 rounded-lg'>
              <Zap className='w-6 h-6 text-white' />
            </div>
          </div>
        </AdminCard>

        <AdminCard className='bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Reintentos</p>
              <p className='text-3xl font-bold text-gray-900'>
                {metrics.realTimeMetrics.retryAttempts}
              </p>
              <p className='text-xs text-gray-500 mt-1'>Intentos de reintento realizados</p>
            </div>
            <div className='p-3 bg-yellow-500 rounded-lg'>
              <RefreshCw className='w-6 h-6 text-white' />
            </div>
          </div>
        </AdminCard>

        <AdminCard
          className={`bg-gradient-to-br ${
            metrics.systemHealth.redisStatus === 'connected'
              ? 'from-green-50 to-green-100 border-green-200'
              : 'from-gray-50 to-gray-100 border-gray-200'
          }`}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Estado del Sistema</p>
              <p
                className={`text-lg font-semibold ${
                  metrics.systemHealth.redisStatus === 'connected' ? 'text-green-700' : 'text-gray-700'
                }`}
              >
                {metrics.systemHealth.redisStatus === 'connected' ? 'Conectado' : 'Desconectado'}
              </p>
              <p className='text-xs text-gray-500 mt-1'>Uptime: {formatUptime(metrics.systemHealth.uptime)}</p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                metrics.systemHealth.redisStatus === 'connected' ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              <Server className='w-6 h-6 text-white' />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Tabs */}
      <Tabs defaultValue='endpoints' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='endpoints'>Endpoints</TabsTrigger>
          <TabsTrigger value='alerts'>
            Alertas
            {hasAlerts && (
              <Badge variant='destructive' className='ml-2'>
                {metrics.alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='system'>Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value='endpoints' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Create Preference */}
            <AdminCard>
              <div className='flex items-center space-x-3 mb-4'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <CreditCard className='h-5 w-5 text-blue-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>Create Preference</h3>
                  <p className='text-sm text-gray-600'>Creación de preferencias de pago</p>
                </div>
              </div>
              <div className='space-y-4'>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Solicitudes</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {metrics.endpointMetrics.createPreference.requests.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium mb-2 text-gray-600'>Tasa de Éxito</p>
                  <div className='flex items-center space-x-2'>
                    <Progress value={metrics.endpointMetrics.createPreference.successRate} className='flex-1' />
                    <span className='text-sm font-medium text-gray-900'>
                      {metrics.endpointMetrics.createPreference.successRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Tiempo Promedio</p>
                  <p className='text-xl font-bold text-gray-900'>
                    {metrics.endpointMetrics.createPreference.averageResponseTime}ms
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Errores</p>
                  <p
                    className={`text-xl font-bold ${
                      metrics.endpointMetrics.createPreference.errorCount > 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {metrics.endpointMetrics.createPreference.errorCount}
                  </p>
                </div>
              </div>
            </AdminCard>

            {/* Webhook */}
            <AdminCard>
              <div className='flex items-center space-x-3 mb-4'>
                <div className='p-2 bg-purple-100 rounded-lg'>
                  <Zap className='h-5 w-5 text-purple-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>Webhook</h3>
                  <p className='text-sm text-gray-600'>Procesamiento de webhooks</p>
                </div>
              </div>
              <div className='space-y-4'>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Solicitudes</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {metrics.endpointMetrics.webhook.requests.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium mb-2 text-gray-600'>Tasa de Éxito</p>
                  <div className='flex items-center space-x-2'>
                    <Progress value={metrics.endpointMetrics.webhook.successRate} className='flex-1' />
                    <span className='text-sm font-medium text-gray-900'>
                      {metrics.endpointMetrics.webhook.successRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Tiempo Promedio</p>
                  <p className='text-xl font-bold text-gray-900'>
                    {metrics.endpointMetrics.webhook.averageResponseTime}ms
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Errores</p>
                  <p
                    className={`text-xl font-bold ${
                      metrics.endpointMetrics.webhook.errorCount > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {metrics.endpointMetrics.webhook.errorCount}
                  </p>
                </div>
              </div>
            </AdminCard>

            {/* Payment Query */}
            <AdminCard>
              <div className='flex items-center space-x-3 mb-4'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <Activity className='h-5 w-5 text-green-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>Payment Query</h3>
                  <p className='text-sm text-gray-600'>Consultas de estado de pago</p>
                </div>
              </div>
              <div className='space-y-4'>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Solicitudes</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {metrics.endpointMetrics.paymentQuery.requests.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium mb-2 text-gray-600'>Tasa de Éxito</p>
                  <div className='flex items-center space-x-2'>
                    <Progress value={metrics.endpointMetrics.paymentQuery.successRate} className='flex-1' />
                    <span className='text-sm font-medium text-gray-900'>
                      {metrics.endpointMetrics.paymentQuery.successRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Tiempo Promedio</p>
                  <p className='text-xl font-bold text-gray-900'>
                    {metrics.endpointMetrics.paymentQuery.averageResponseTime}ms
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Errores</p>
                  <p
                    className={`text-xl font-bold ${
                      metrics.endpointMetrics.paymentQuery.errorCount > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {metrics.endpointMetrics.paymentQuery.errorCount}
                  </p>
                </div>
              </div>
            </AdminCard>
          </div>
        </TabsContent>

        <TabsContent value='alerts'>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-semibold'>Alertas del Sistema</h3>
              <div className='flex space-x-2'>
                <Badge variant='destructive'>Críticas: {criticalAlerts.length}</Badge>
                <Badge variant='default'>Advertencias: {warningAlerts.length}</Badge>
                <Badge variant='secondary'>Info: {metrics.alerts.filter(a => a.type === 'info').length}</Badge>
              </div>
            </div>

            <ScrollArea className='h-96'>
              {metrics.alerts.length > 0 ? (
                metrics.alerts.map((alert, index) => (
                  <AlertItem key={index} alert={alert} />
                ))
              ) : (
                <div className='text-center py-8 text-muted-foreground'>
                  <CheckCircle className='h-12 w-12 mx-auto mb-4 opacity-50' />
                  <p>No hay alertas registradas</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value='system'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <AdminCard title='Estado del Sistema' description='Información sobre la salud del sistema'>
              <div className='space-y-4'>
                <div>
                  <p className='text-sm font-medium mb-2 text-gray-600'>Redis</p>
                  <Badge
                    variant={metrics.systemHealth.redisStatus === 'connected' ? 'default' : 'destructive'}
                    className='text-sm'
                  >
                    {metrics.systemHealth.redisStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Uptime</p>
                  <p className='text-xl font-bold text-gray-900'>{formatUptime(metrics.systemHealth.uptime)}</p>
                </div>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Última Actualización</p>
                  <p className='text-sm text-gray-500'>
                    {new Date(metrics.systemHealth.lastUpdate).toLocaleString()}
                  </p>
                </div>
              </div>
            </AdminCard>

            <AdminCard title='Resumen de Métricas' description='Vista general del rendimiento'>
              <div className='space-y-4'>
                <div>
                  <p className='text-sm font-medium mb-2 text-gray-600'>Tasa de Éxito General</p>
                  <Progress value={metrics.realTimeMetrics.successRate} className='h-3' />
                  <p className='text-sm text-gray-500 mt-1'>
                    {metrics.realTimeMetrics.successRate.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium mb-2 text-gray-600'>Tiempo de Respuesta Promedio</p>
                  <div className='flex items-center space-x-2'>
                    <Progress
                      value={Math.min((metrics.realTimeMetrics.averageResponseTime / 3000) * 100, 100)}
                      className='flex-1'
                    />
                    <span className='text-sm font-medium text-gray-900'>
                      {metrics.realTimeMetrics.averageResponseTime}ms
                    </span>
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium mb-1 text-gray-600'>Total de Solicitudes</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {metrics.realTimeMetrics.totalRequests.toLocaleString()}
                  </p>
                </div>
              </div>
            </AdminCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MercadoPagoDashboard

