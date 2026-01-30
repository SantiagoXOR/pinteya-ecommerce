'use client'

import Link from 'next/link'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminCard } from '@/components/admin/ui/AdminCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import {
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Database,
  CreditCard,
  Search,
  TrendingUp,
  AlertTriangle,
  Activity,
  Truck,
  Gauge,
  GitBranch,
  MessageCircle,
} from '@/lib/optimized-imports'
import { useAdminDashboardStats } from '@/hooks/admin/useAdminDashboardStats'
import { useMonitoringStats } from '@/providers/MonitoringProvider'

export function AdminPageClient() {
  const { stats, loading, error } = useAdminDashboardStats()
  const { stats: monitoringStats, loading: monitoringLoading } = useMonitoringStats()
  
  const adminSections = [
    {
      title: 'Productos',
      description: 'Gestionar catálogo de productos, precios y stock',
      href: '/admin/products',
      icon: Package,
      color: 'bg-blue-500',
      stats: loading ? 'Cargando...' : `${stats?.totalProducts || 0} productos`,
    },
    {
      title: 'Órdenes',
      description: 'Gestionar pedidos, estados y fulfillment',
      href: '/admin/orders',
      icon: ShoppingCart,
      color: 'bg-green-500',
      stats: loading ? 'Cargando...' : `${stats?.pendingOrders || 0} pendientes`,
    },
    {
      title: 'Clientes',
      description: 'Gestionar usuarios y perfiles de clientes',
      href: '/admin/customers',
      icon: Users,
      color: 'bg-purple-500',
      stats: loading ? 'Cargando...' : `${stats?.totalUsers || 0} usuarios`,
    },
    {
      title: 'Logística',
      description: 'Gestión completa de envíos y tracking en tiempo real',
      href: '/admin/logistics',
      icon: Truck,
      color: 'bg-orange-500',
      stats: 'Enterprise',
      badge: 'Enterprise',
    },
    {
      title: 'Analytics',
      description: 'Métricas avanzadas y reportes de rendimiento',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'bg-yellow-500',
      stats: 'Tiempo real',
    },
    {
      title: 'MercadoPago',
      description: 'Configuración y métricas de pagos',
      href: '/admin/mercadopago',
      icon: CreditCard,
      color: 'bg-indigo-500',
      stats: 'Enterprise',
    },
    {
      title: 'Monitoreo',
      description: 'Dashboard de monitoreo en tiempo real',
      href: '/admin/monitoring',
      icon: Activity,
      color: 'bg-emerald-500',
      stats: 'Tiempo real',
      badge: 'Enterprise',
    },
    {
      title: 'Performance',
      description: 'Métricas de performance y Core Web Vitals',
      href: '/admin/performance',
      icon: Gauge,
      color: 'bg-purple-500',
      stats: 'Optimizado',
      badge: 'New',
    },
    {
      title: 'Test Flows',
      description: 'Flujos automatizados de CI/CD y testing',
      href: '/admin/test-flows',
      icon: GitBranch,
      color: 'bg-cyan-500',
      stats: 'Automatizado',
      badge: 'New',
    },
    {
      title: 'Diagnósticos',
      description: 'Herramientas de debugging y verificación del sistema',
      href: '/admin/diagnostics',
      icon: Search,
      color: 'bg-red-500',
      stats: 'Sistema OK',
    },
    {
      title: 'AI Chat Debug',
      description: 'Debug, testing y logs del asistente de chat con IA (Gemini)',
      href: '/admin/ai-chat',
      icon: MessageCircle,
      color: 'bg-teal-500',
      stats: 'Logs',
    },
    {
      title: 'Configuración',
      description: 'Configurar parámetros del sistema',
      href: '/admin/settings',
      icon: Settings,
      color: 'bg-gray-500',
      stats: 'Disponible',
    },
    {
      title: 'Base de Datos',
      description: 'Herramientas de gestión de base de datos',
      href: '/admin/database',
      icon: Database,
      color: 'bg-orange-500',
      stats: 'Solo lectura',
    },
  ]

  // Quick stats data - usando datos reales
  const quickStats = [
    {
      title: 'Total Productos',
      value: loading ? 'Cargando...' : (stats?.totalProducts || 0).toString(),
      change: loading ? '...' : `${stats?.activeProducts || 0} activos`,
      changeType: 'positive' as const,
      icon: Package,
    },
    {
      title: 'Stock Bajo',
      value: loading ? 'Cargando...' : (stats?.lowStockProducts || 0).toString(),
      change: loading ? '...' : `${stats?.noStockProducts || 0} sin stock`,
      changeType:
        (stats?.lowStockProducts || 0) > 0 ? ('negative' as const) : ('positive' as const),
      icon: AlertTriangle,
    },
    {
      title: 'Órdenes Totales',
      value: loading ? 'Cargando...' : (stats?.totalOrders || 0).toString(),
      change: loading ? '...' : `${stats?.pendingOrders || 0} pendientes`,
      changeType: 'neutral' as const,
      icon: ShoppingCart,
    },
    {
      title: 'Usuarios Registrados',
      value: loading ? 'Cargando...' : (stats?.totalUsers || 0).toString(),
      change: loading ? '...' : `${stats?.activeUsers || 0} activos`,
      changeType: 'positive' as const,
      icon: Users,
    },
  ]

  return (
    <AdminLayout title='Dashboard'>
      <AdminContentWrapper>
        <div className='space-y-6'>
        {/* Welcome Section */}
        <div className='bg-gradient-to-r from-blaze-orange-500 to-blaze-orange-600 rounded-xl shadow-lg p-4 sm:p-6 text-white'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0'>
            <div>
              <div className='flex items-center space-x-3 mb-2'>
                <BarChart3 className='w-6 h-6 sm:w-8 sm:h-8' />
                <h1 className='text-2xl sm:text-3xl font-bold'>¡Bienvenido al Panel Administrativo!</h1>
              </div>
              <p className='text-blaze-orange-100 text-sm sm:text-base'>
                Gestiona y monitorea tu tienda de e-commerce desde aquí
              </p>
            </div>
            <div className='hidden md:block'>
              <div className='w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center'>
                <BarChart3 className='w-8 h-8' />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <AdminCard className='border-red-200 bg-red-50'>
            <div className='flex items-center space-x-2 text-red-700'>
              <AlertTriangle className='h-5 w-5' />
              <span>
                Error cargando estadísticas:{' '}
                {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
              </span>
            </div>
          </AdminCard>
        )}

        {/* Quick Stats */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
          {/* Total Productos */}
          <Card className='border-t-4 border-t-blue-500 hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>Total Productos</CardTitle>
              <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                <Package className='h-5 w-5 text-blue-600' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-gray-900'>
                {loading ? (
                  <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                ) : (
                  stats?.totalProducts || 0
                )}
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                {loading ? '...' : `${stats?.activeProducts || 0} activos`} desde ayer
              </p>
            </CardContent>
          </Card>

          {/* Stock Bajo */}
          <Card className='border-t-4 border-t-yellow-500 hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>Stock Bajo</CardTitle>
              <div className='w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center'>
                <AlertTriangle className='h-5 w-5 text-yellow-600' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-gray-900'>
                {loading ? (
                  <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                ) : (
                  stats?.lowStockProducts || 0
                )}
              </div>
              <p className='text-xs text-yellow-600 mt-1'>
                {loading ? '...' : `${stats?.noStockProducts || 0} sin stock`} desde ayer
              </p>
            </CardContent>
          </Card>

          {/* Órdenes Totales */}
          <Card className='border-t-4 border-t-indigo-500 hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>Órdenes Totales</CardTitle>
              <div className='w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center'>
                <ShoppingCart className='h-5 w-5 text-indigo-600' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-gray-900'>
                {loading ? (
                  <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                ) : (
                  stats?.totalOrders || 0
                )}
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                {loading ? '...' : `${stats?.pendingOrders || 0} pendientes`} desde ayer
              </p>
            </CardContent>
          </Card>

          {/* Usuarios Registrados */}
          <Card className='border-t-4 border-t-green-500 hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>Usuarios Registrados</CardTitle>
              <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                <Users className='h-5 w-5 text-green-600' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-gray-900'>
                {loading ? (
                  <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                ) : (
                  stats?.totalUsers || 0
                )}
              </div>
              <p className='text-xs text-green-600 mt-1'>
                {loading ? '...' : `${stats?.activeUsers || 0} activos`} desde ayer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections Grid */}
        <AdminCard
          title='Módulos Administrativos'
          description='Accede a las diferentes secciones del panel'
          padding='none'
        >
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {adminSections.map(section => {
                const IconComponent = section && section.icon ? section.icon : null

                return (
                  <div
                    key={section.title}
                    className={`bg-gray-50 rounded-lg border p-6 transition-all ${
                      section.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-md hover:bg-white cursor-pointer'
                    }`}
                  >
                    <div className='flex items-start justify-between mb-4'>
                      <div
                        className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center text-white`}
                      >
                        {IconComponent && <IconComponent className='w-6 h-6' />}
                      </div>
                      {section.disabled ? (
                        <span className='bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-medium'>
                          Próximamente
                        </span>
                      ) : section.badge ? (
                        <span className='bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium'>
                          {section.badge}
                        </span>
                      ) : (
                        <span className='bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium'>
                          {section.stats}
                        </span>
                      )}
                    </div>

                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>{section.title}</h3>
                    <p className='text-gray-600 text-sm mb-4'>{section.description}</p>

                    {section.disabled ? (
                      <div className='text-gray-400 text-sm'>Funcionalidad en desarrollo</div>
                    ) : (
                      <Link
                        href={section.href}
                        className='inline-flex items-center text-blaze-orange-600 hover:text-blaze-orange-800 text-sm font-medium'
                      >
                        {section.badge ? 'Ver Preview →' : 'Acceder →'}
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </AdminCard>

        {/* System Status */}
        <AdminCard
          title='Estado del Sistema'
          description='Monitoreo proactivo en tiempo real del estado de la aplicación'
        >
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <div className='text-center p-4 bg-green-50 rounded-lg'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <Activity className='w-6 h-6 text-green-600' />
              </div>
              <div className='text-sm font-medium text-green-800'>Monitoreo Activo</div>
              <div className='text-xs text-green-600 mt-1'>
                {monitoringLoading
                  ? 'Cargando...'
                  : monitoringStats
                    ? 'Sistema operativo'
                    : 'Inicializando...'}
              </div>
            </div>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <TrendingUp className='w-6 h-6 text-blue-600' />
              </div>
              <div className='text-sm font-medium text-blue-800'>Performance</div>
              <div className='text-xs text-blue-600 mt-1'>Optimizado</div>
            </div>
            <div className='text-center p-4 bg-purple-50 rounded-lg'>
              <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <Database className='w-6 h-6 text-purple-600' />
              </div>
              <div className='text-sm font-medium text-purple-800'>Base de Datos</div>
              <div className='text-xs text-purple-600 mt-1'>Conectada</div>
            </div>
            <div className='text-center p-4 bg-orange-50 rounded-lg'>
              <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <CreditCard className='w-6 h-6 text-orange-600' />
              </div>
              <div className='text-sm font-medium text-orange-800'>Pagos</div>
              <div className='text-xs text-orange-600 mt-1'>MercadoPago OK</div>
            </div>
          </div>
        </AdminCard>
        </div>
      </AdminContentWrapper>
    </AdminLayout>
  )
}
