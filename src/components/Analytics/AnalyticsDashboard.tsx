/**
 * Dashboard de Analytics para Pinteya E-commerce
 * Visualización de métricas, conversiones y comportamiento de usuarios
 */

'use client'

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'
// ⚡ PERFORMANCE: Lazy load de Framer Motion para reducir bundle inicial
import { motion } from '@/lib/framer-motion-lazy'
import {
  TrendingUp,
  ShoppingCart,
  Eye,
  Users,
  DollarSign,
  BarChart3,
  Clock,
  Search,
  Target,
  Activity,
} from '@/lib/optimized-imports'
import { useUnifiedAnalytics } from '@/components/Analytics/UnifiedAnalyticsProvider'

// Lazy load de componentes pesados
const GoogleAnalyticsEmbed = lazy(() => import('./GoogleAnalyticsEmbed'))
const MetaMetrics = lazy(() => import('./MetaMetrics'))
const ProductAnalytics = lazy(() => import('./ProductAnalytics'))
const FunnelAnalysis = lazy(() => import('./FunnelAnalysis'))
const SearchAnalytics = lazy(() => import('./SearchAnalytics'))
const RouteVisualizer = lazy(() => import('./RouteVisualizer'))
const PageInteractions = lazy(() => import('./PageInteractions'))

interface MetricsData {
  ecommerce: {
    cartAdditions: number
    cartRemovals: number
    checkoutStarts: number
    checkoutCompletions: number
    productViews: number
    categoryViews: number
    searchQueries: number
    conversionRate: number
    cartAbandonmentRate: number
    productToCartRate: number
    averageOrderValue: number
    totalRevenue: number
  }
  engagement: {
    uniqueSessions: number
    uniqueUsers: number
    averageEventsPerSession: number
    averageSessionDuration: number
    topPages: Array<{ page: string; views: number }>
    topProducts: Array<{ productId: string; productName: string; views: number }>
  }
  trends: {
    dailyEvents: Array<{ date: string; count: number }>
    hourlyEvents: Array<{ hour: number; count: number }>
  }
  orders: {
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
  }
  devices?: {
    devices: Array<{ device: string; count: number; percentage: number }>
    browsers: Array<{ browser: string; count: number; percentage: number }>
  }
  categories?: {
    distribution: Array<{ category: string; count: number; percentage: number }>
    revenue: Array<{ category: string; revenue: number }>
  }
  behavior?: {
    topFlows: Array<{ flow: string; count: number }>
    averagePageTimes: Array<{ page: string; averageTime: number }>
    bounceRate: number
  }
  retention?: {
    returningUsers: number
    newUsers: number
    retentionRate: number
    averageSessionsPerUser: number
  }
  comparison?: {
    previousPeriod: any
    changes: {
      ecommerce?: {
        productViews?: number
        cartAdditions?: number
        checkoutStarts?: number
        checkoutCompletions?: number
        conversionRate?: number
        totalRevenue?: number
      }
      engagement?: {
        uniqueSessions?: number
        uniqueUsers?: number
        averageSessionDuration?: number
      }
    } | null
  }
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color: string
  format?: 'number' | 'currency' | 'percentage'
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  format = 'number',
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') {
      return val
    }

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
        }).format(val)
      case 'percentage':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow'
    >
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-600'>{title}</p>
          <p className='text-2xl font-bold text-gray-900 mt-1'>{formatValue(value)}</p>
          {change !== undefined && (
            <div
              className={`flex items-center mt-2 text-sm ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className={`w-4 h-4 mr-1 ${change < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
    </motion.div>
  )
}

// Componente memoizado para MetaMetrics para evitar re-renders innecesarios
const MetaMetricsMemoized: React.FC<{ timeRange: string }> = React.memo(({ timeRange }) => {
  const { startDate, endDate } = useMemo(() => {
    const end = new Date().toISOString()
    const start =
      timeRange === '1d'
        ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        : timeRange === '30d'
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    return { startDate: start, endDate: end }
  }, [timeRange])

  return <MetaMetrics startDate={startDate} endDate={endDate} />
})

MetaMetricsMemoized.displayName = 'MetaMetricsMemoized'

const AnalyticsDashboard: React.FC = () => {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    productViews: 0,
    cartAdditions: 0,
    checkoutStarts: 0,
    checkoutCompletions: 0,
  })

  useEffect(() => {
    fetchMetrics()
    fetchRealTimeMetrics()
    
    // Actualizar métricas en tiempo real cada 10 segundos
    const interval = setInterval(() => {
      fetchRealTimeMetrics()
    }, 10000)

    return () => clearInterval(interval)
  }, [timeRange])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const endDate = new Date().toISOString()
      const startDate = new Date(
        Date.now() - (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1) * 24 * 60 * 60 * 1000
      ).toISOString()

      // Incluir análisis avanzado para obtener todas las métricas
      const response = await fetch(
        `/api/analytics/metrics?startDate=${startDate}&endDate=${endDate}&advanced=true`
      )
      const data = await response.json()
      setMetricsData(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    const endDate = new Date().toISOString()
    const startDate = new Date(
      Date.now() - (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1) * 24 * 60 * 60 * 1000
    ).toISOString()
    return { startDate, endDate }
  }

  const fetchRealTimeMetrics = async () => {
    try {
      // Obtener métricas de las últimas 2 horas desde la DB
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

      const response = await fetch(
        `/api/analytics/metrics?startDate=${startDate}&endDate=${endDate}`
      )
      if (response.ok) {
        const data = await response.json()
        setRealTimeMetrics({
          productViews: data.ecommerce?.productViews || 0,
          cartAdditions: data.ecommerce?.cartAdditions || 0,
          checkoutStarts: data.ecommerce?.checkoutStarts || 0,
          checkoutCompletions: data.ecommerce?.checkoutCompletions || 0,
        })
      }
    } catch (error) {
      console.error('Error fetching real-time metrics:', error)
    }
  }

  if (loading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-1/4'></div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[...Array(8)].map((_, i) => (
              <div key={i} className='h-32 bg-gray-200 rounded-xl'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!metricsData && activeTab === 'overview') {
    return (
      <div className='p-6 text-center'>
        <p className='text-gray-500'>Error cargando métricas</p>
      </div>
    )
  }

  const { startDate, endDate } = getDateRange()

  return (
    <div className='space-y-6'>
      {/* Rango de fechas y Tabs */}
      <div className='flex items-center justify-between'>
        <div className='flex gap-2 flex-wrap'>
          {[
            { id: 'overview', label: 'Resumen' },
            { id: 'products', label: 'Productos' },
            { id: 'funnel', label: 'Embudo' },
            { id: 'search', label: 'Búsquedas' },
            { id: 'interactions', label: 'Interacciones' },
            { id: 'visualizer', label: 'Visualizador' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className='flex gap-2'>
          {['1d', '7d', '30d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === '1d' ? 'Hoy' : range === '7d' ? '7 días' : '30 días'}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'overview' && metricsData && (
        <>
          {/* Comparación con período anterior */}
          {metricsData.comparison?.changes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 shadow-sm border border-yellow-200 mb-6'
        >
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>Comparación con Período Anterior</h2>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
            {metricsData.comparison.changes.ecommerce && (
              <>
                <div className='text-center'>
                  <p className='text-sm text-gray-600'>Vistas de productos</p>
                  <p
                    className={`text-lg font-bold ${
                      (metricsData.comparison.changes.ecommerce.productViews || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {(metricsData.comparison.changes.ecommerce.productViews || 0).toFixed(1)}%
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-gray-600'>Agregados al carrito</p>
                  <p
                    className={`text-lg font-bold ${
                      (metricsData.comparison.changes.ecommerce.cartAdditions || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {(metricsData.comparison.changes.ecommerce.cartAdditions || 0).toFixed(1)}%
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-gray-600'>Checkouts iniciados</p>
                  <p
                    className={`text-lg font-bold ${
                      (metricsData.comparison.changes.ecommerce.checkoutStarts || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {(metricsData.comparison.changes.ecommerce.checkoutStarts || 0).toFixed(1)}%
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-gray-600'>Compras completadas</p>
                  <p
                    className={`text-lg font-bold ${
                      (metricsData.comparison.changes.ecommerce.checkoutCompletions || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {(metricsData.comparison.changes.ecommerce.checkoutCompletions || 0).toFixed(1)}%
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-gray-600'>Tasa de conversión</p>
                  <p
                    className={`text-lg font-bold ${
                      (metricsData.comparison.changes.ecommerce.conversionRate || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {(metricsData.comparison.changes.ecommerce.conversionRate || 0).toFixed(1)}%
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-gray-600'>Ingresos totales</p>
                  <p
                    className={`text-lg font-bold ${
                      (metricsData.comparison.changes.ecommerce.totalRevenue || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {(metricsData.comparison.changes.ecommerce.totalRevenue || 0).toFixed(1)}%
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Métricas principales */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <MetricCard
          title='Vistas de productos'
          value={metricsData.ecommerce.productViews}
          change={metricsData.comparison?.changes?.ecommerce?.productViews}
          icon={<Eye className='w-6 h-6 text-white' />}
          color='bg-blue-500'
        />

        <MetricCard
          title='Agregados al carrito'
          value={metricsData.ecommerce.cartAdditions}
          change={metricsData.comparison?.changes?.ecommerce?.cartAdditions}
          icon={<ShoppingCart className='w-6 h-6 text-white' />}
          color='bg-green-500'
        />

        <MetricCard
          title='Tasa de conversión'
          value={metricsData.ecommerce.conversionRate}
          change={metricsData.comparison?.changes?.ecommerce?.conversionRate}
          icon={<Target className='w-6 h-6 text-white' />}
          color='bg-purple-500'
          format='percentage'
        />

        <MetricCard
          title='Valor promedio de orden'
          value={metricsData.ecommerce.averageOrderValue}
          icon={<DollarSign className='w-6 h-6 text-white' />}
          color='bg-yellow-500'
          format='currency'
        />
      </div>

      {/* Métricas de engagement */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <MetricCard
          title='Sesiones únicas'
          value={metricsData.engagement.uniqueSessions}
          icon={<Users className='w-6 h-6 text-white' />}
          color='bg-indigo-500'
        />

        <MetricCard
          title='Usuarios únicos'
          value={metricsData.engagement.uniqueUsers}
          icon={<Activity className='w-6 h-6 text-white' />}
          color='bg-pink-500'
        />

        <MetricCard
          title='Duración promedio'
          value={`${Math.round(metricsData.engagement.averageSessionDuration / 60)}m`}
          icon={<Clock className='w-6 h-6 text-white' />}
          color='bg-orange-500'
        />

        <MetricCard
          title='Búsquedas'
          value={metricsData.ecommerce.searchQueries}
          icon={<Search className='w-6 h-6 text-white' />}
          color='bg-teal-500'
        />
      </div>

      {/* Métricas en tiempo real */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
      >
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Métricas en Tiempo Real</h2>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center'>
            <p className='text-2xl font-bold text-blue-600'>{realTimeMetrics.productViews}</p>
            <p className='text-sm text-gray-600'>Vistas de productos</p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-green-600'>{realTimeMetrics.cartAdditions}</p>
            <p className='text-sm text-gray-600'>Agregados al carrito</p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-purple-600'>{realTimeMetrics.checkoutStarts}</p>
            <p className='text-sm text-gray-600'>Checkouts iniciados</p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-yellow-600'>
              {realTimeMetrics.checkoutCompletions}
            </p>
            <p className='text-sm text-gray-600'>Compras completadas</p>
          </div>
        </div>
      </motion.div>

      {/* Top productos y páginas */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
        >
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Productos más vistos</h3>
          <div className='space-y-3'>
            {metricsData.engagement.topProducts.slice(0, 5).map((product, index) => (
              <div key={product.productId} className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-sm font-medium'>
                    {index + 1}
                  </span>
                  <span className='text-sm text-gray-900 truncate'>{product.productName}</span>
                </div>
                <span className='text-sm font-medium text-gray-600'>{product.views} vistas</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
        >
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Páginas más visitadas</h3>
          <div className='space-y-3'>
            {metricsData.engagement.topPages.slice(0, 5).map((page, index) => (
              <div key={page.page} className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium'>
                    {index + 1}
                  </span>
                  <span className='text-sm text-gray-900 truncate'>{page.page}</span>
                </div>
                <span className='text-sm font-medium text-gray-600'>{page.views} vistas</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Análisis avanzado */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Análisis de dispositivos */}
        {metricsData.devices && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
          >
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Análisis de Dispositivos</h3>
            <div className='space-y-4'>
              <div>
                <h4 className='text-sm font-medium text-gray-700 mb-2'>Dispositivos</h4>
                <div className='space-y-2'>
                  {metricsData.devices.devices.map((device, index) => (
                    <div key={index} className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>{device.device}</span>
                      <div className='flex items-center gap-2'>
                        <div className='w-32 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-blue-500 h-2 rounded-full'
                            style={{ width: `${device.percentage}%` }}
                          ></div>
                        </div>
                        <span className='text-sm font-medium text-gray-900 w-16 text-right'>
                          {device.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Análisis de retención */}
        {metricsData.retention && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
          >
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Análisis de Retención</h3>
            <div className='grid grid-cols-2 gap-4'>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <p className='text-2xl font-bold text-blue-600'>{metricsData.retention.returningUsers}</p>
                <p className='text-sm text-gray-600'>Usuarios recurrentes</p>
              </div>
              <div className='text-center p-4 bg-green-50 rounded-lg'>
                <p className='text-2xl font-bold text-green-600'>{metricsData.retention.newUsers}</p>
                <p className='text-sm text-gray-600'>Usuarios nuevos</p>
              </div>
              <div className='text-center p-4 bg-purple-50 rounded-lg'>
                <p className='text-2xl font-bold text-purple-600'>
                  {metricsData.retention.retentionRate.toFixed(1)}%
                </p>
                <p className='text-sm text-gray-600'>Tasa de retención</p>
              </div>
              <div className='text-center p-4 bg-orange-50 rounded-lg'>
                <p className='text-2xl font-bold text-orange-600'>
                  {metricsData.retention.averageSessionsPerUser.toFixed(1)}
                </p>
                <p className='text-sm text-gray-600'>Sesiones por usuario</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Análisis de comportamiento */}
      {metricsData.behavior && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
        >
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Análisis de Comportamiento</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 mb-3'>Flujos de usuario más comunes</h4>
              <div className='space-y-2'>
                {metricsData.behavior.topFlows.slice(0, 5).map((flow, index) => (
                  <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                    <span className='text-sm text-gray-700 truncate'>{flow.flow}</span>
                    <span className='text-sm font-medium text-gray-900'>{flow.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className='text-sm font-medium text-gray-700 mb-3'>Tiempo promedio en página</h4>
              <div className='space-y-2'>
                {metricsData.behavior.averagePageTimes
                  .sort((a, b) => b.averageTime - a.averageTime)
                  .slice(0, 5)
                  .map((page, index) => (
                    <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                      <span className='text-sm text-gray-700 truncate'>{page.page}</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {Math.round(page.averageTime)}s
                      </span>
                    </div>
                  ))}
              </div>
              <div className='mt-4 p-3 bg-yellow-50 rounded-lg'>
                <p className='text-sm text-gray-600'>Tasa de rebote</p>
                <p className='text-2xl font-bold text-yellow-600'>
                  {metricsData.behavior.bounceRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

          {/* Integración Google Analytics y Meta - Lazy loaded */}
          <Suspense fallback={<div className='h-64 bg-gray-100 rounded-xl animate-pulse' />}>
            <div className='space-y-6'>
              {/* Google Analytics Embed */}
              <GoogleAnalyticsEmbed />

              {/* Meta Pixel Metrics */}
              <MetaMetricsMemoized timeRange={timeRange} />
            </div>
          </Suspense>
        </>
      )}

      {activeTab === 'products' && (
        <Suspense fallback={<div className='h-64 bg-gray-100 rounded-xl animate-pulse' />}>
          <ProductAnalytics startDate={startDate} endDate={endDate} />
        </Suspense>
      )}

      {activeTab === 'funnel' && (
        <Suspense fallback={<div className='h-64 bg-gray-100 rounded-xl animate-pulse' />}>
          <FunnelAnalysis startDate={startDate} endDate={endDate} />
        </Suspense>
      )}

      {activeTab === 'search' && (
        <Suspense fallback={<div className='h-64 bg-gray-100 rounded-xl animate-pulse' />}>
          <SearchAnalytics startDate={startDate} endDate={endDate} />
        </Suspense>
      )}

      {activeTab === 'interactions' && (
        <Suspense fallback={<div className='h-64 bg-gray-100 rounded-xl animate-pulse' />}>
          <PageInteractions startDate={startDate} endDate={endDate} />
        </Suspense>
      )}

      {activeTab === 'visualizer' && (
        <Suspense fallback={<div className='h-64 bg-gray-100 rounded-xl animate-pulse' />}>
          <RouteVisualizer startDate={startDate} endDate={endDate} />
        </Suspense>
      )}
    </div>
  )
}

export default AnalyticsDashboard
