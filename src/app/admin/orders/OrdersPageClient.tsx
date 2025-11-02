'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  BarChart3,
  TrendingUp,
  Plus,
  RefreshCw,
  Download,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  ShoppingCart,
} from 'lucide-react'
import { useOrdersEnterprise } from '@/hooks/admin/useOrdersEnterprise'
import { OrderBulkOperations } from '@/components/admin/orders/OrderBulkOperations'
import { OrderList } from '@/components/admin/orders/OrderList'
import { NewOrderModal } from '@/components/admin/orders/NewOrderModal'
import { ExportOrdersModal } from '@/components/admin/orders/ExportOrdersModal'
import { OrderDetailsModal } from '@/components/admin/orders/OrderDetailsModal'
import { EditOrderModal } from '@/components/admin/orders/EditOrderModal'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function OrdersPageClient() {
  const router = useRouter()

  // Estados de modales
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const {
    // Datos
    orders,
    stats,
    analytics,

    // Estados de carga
    isLoading,
    isLoadingOrders,
    isLoadingStats,

    // Errores
    error,

    // Filtros y paginación
    filters,
    updateFilters,
    resetFilters,
    pagination,

    // Operaciones
    refreshOrders,
    handleBulkOperation,
    handleOrderAction,
  } = useOrdersEnterprise()

  // Debug: Ver qué datos tenemos
  console.log('🔍 OrdersPageClient Debug:', {
    ordersCount: orders?.length,
    isLoading,
    isLoadingOrders,
    error: error instanceof Error ? error.message : error,
    filters,
    stats,
    pagination,
  })

  // Handlers de modales
  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsDetailsModalOpen(true)
  }

  const handleEditOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsEditModalOpen(true)
  }

  // Handler con feedback visual
  const handleOrderActionWithToast = async (action: string, orderId: string) => {
    // Mapear acciones a mensajes
    const actionMessages: Record<string, { loading: string; success: string }> = {
      process: {
        loading: 'Marcando orden como en proceso...',
        success: 'Orden marcada como en proceso',
      },
      deliver: {
        loading: 'Marcando orden como entregada...',
        success: 'Orden marcada como entregada',
      },
      ship: {
        loading: 'Marcando orden como enviada...',
        success: 'Orden marcada como enviada',
      },
      confirm: {
        loading: 'Confirmando orden...',
        success: 'Orden confirmada',
      },
      cancel: {
        loading: 'Cancelando orden...',
        success: 'Orden cancelada',
      },
    }

    const messages = actionMessages[action]

    if (messages) {
      const loadingToast = toast.loading(messages.loading)
      try {
        await handleOrderAction(action, orderId)
        toast.success(messages.success, { id: loadingToast })
      } catch (error) {
        toast.error('Error al actualizar la orden', { id: loadingToast })
        console.error('Error en acción de orden:', error)
      }
    } else {
      // Para acciones que no requieren actualización de estado
      handleOrderAction(action, orderId)
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Órdenes' },
  ]

  return (
    <AdminLayout title='Órdenes' breadcrumbs={breadcrumbs}>
      <AdminContentWrapper>
        <div className='space-y-6'>
          {/* Header con Gradiente - Responsive */}
          <div className='bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg p-4 sm:p-6 text-white'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0'>
          <div>
                <div className='flex items-center space-x-3 mb-2'>
                  <ShoppingCart className='w-6 h-6 sm:w-8 sm:h-8' />
                  <h1 className='text-2xl sm:text-3xl font-bold'>Gestión de Órdenes</h1>
                </div>
                <p className='text-indigo-100 text-sm sm:text-base'>
              Administra y procesa todas las órdenes de tu tienda
            </p>
          </div>
              <div className='flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto'>
            <Button
                  variant='secondary'
                  onClick={() => refreshOrders()}
                  disabled={isLoading}
                  className='flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 text-white border-white/30'
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className='hidden sm:inline'>Actualizar</span>
            </Button>
            <Button
              onClick={() => setIsNewOrderModalOpen(true)}
                  className='flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-white text-indigo-600 hover:bg-indigo-50'
            >
              <Plus className='w-4 h-4' />
                  <span>Nueva</span>
            </Button>
          </div>
        </div>
          </div>

          {/* Stats Cards - Mobile First */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
            {/* Total Órdenes */}
            <Card className='border-t-4 border-t-indigo-500 hover:shadow-lg transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>Total Órdenes</CardTitle>
                <div className='w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center'>
                  <Package className='h-5 w-5 text-indigo-600' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-gray-900' data-testid='stat-total-orders'>
                  {isLoadingStats ? (
                    <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                  ) : (
                    stats?.totalOrders || 0
                  )}
                </div>
                <p className='text-xs text-gray-500 mt-1'>En el sistema</p>
              </CardContent>
            </Card>

            {/* Órdenes Pendientes */}
            <Card className='border-t-4 border-t-yellow-500 hover:shadow-lg transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>Pendientes</CardTitle>
                <div className='w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center'>
                  <Clock className='h-5 w-5 text-yellow-600' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-gray-900' data-testid='stat-pending-orders'>
                  {isLoadingStats ? (
                    <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                  ) : (
                    stats?.pendingOrders || 0
                  )}
                </div>
                <p className='text-xs text-yellow-600 mt-1'>Requieren atención</p>
              </CardContent>
            </Card>

            {/* Órdenes Completadas */}
            <Card className='border-t-4 border-t-green-500 hover:shadow-lg transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>Completadas</CardTitle>
                <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-gray-900' data-testid='stat-completed-orders'>
                  {isLoadingStats ? (
                    <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                  ) : (
                    stats?.completedOrders || 0
                  )}
                </div>
                <p className='text-xs text-green-600 mt-1'>Entregadas exitosamente</p>
              </CardContent>
            </Card>

            {/* Ingresos Totales */}
            <Card className='border-t-4 border-t-purple-500 hover:shadow-lg transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>Ingresos Totales</CardTitle>
                <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center'>
                  <DollarSign className='h-5 w-5 text-purple-600' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-gray-900' data-testid='stat-total-revenue'>
                  {isLoadingStats ? (
                    <div className='h-9 w-32 bg-gray-200 animate-pulse rounded' />
                  ) : (
                    new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                      minimumFractionDigits: 0,
                    }).format(stats?.totalRevenue || 0)
              )}
            </div>
                        <p className='text-xs text-gray-500 mt-1'>
                          {stats?.averageOrderValue
                            ? `Promedio: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(stats.averageOrderValue)}`
                            : 'Promedio: $0'}
                        </p>
              </CardContent>
            </Card>
          </div>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <BarChart3 className='w-5 h-5' />
                <span>Acciones Rápidas</span>
              </CardTitle>
              <CardDescription>Herramientas para gestión de órdenes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Button
                  variant='outline'
                  className='flex items-center justify-center space-x-2 h-20'
                  onClick={() => setIsExportModalOpen(true)}
                  type="button"
                >
                  <Download className='w-5 h-5' />
                  <span>Exportar CSV</span>
                </Button>
                <Button
                  variant='outline'
                  className='flex items-center justify-center space-x-2 h-20'
                  onClick={() => {
                    console.log('TODO: Implementar generación de reportes')
                  }}
                  type="button"
                >
                  <FileText className='w-5 h-5' />
                  <span>Generar Reportes</span>
                </Button>
                <Button
                  variant='outline'
                  className='flex items-center justify-center space-x-2 h-20'
                  onClick={() => {
                    console.log('TODO: Implementar análisis de ventas')
                  }}
                  type="button"
                >
                  <TrendingUp className='w-5 h-5' />
                  <span>Análisis de Ventas</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Mejoradas */}
          <Tabs
            defaultValue='all'
            className='w-full'
            onValueChange={(value) => {
              // Actualizar filtro de estado y resetear página
              if (value === 'all') {
                // Limpiar el filtro de estado
                resetFilters()
              } else if (value === 'pending') {
                updateFilters({ status: 'pending' as any, page: 1 })
              } else if (value === 'processing') {
                updateFilters({ status: 'processing' as any, page: 1 })
              } else if (value === 'completed') {
                updateFilters({ status: 'delivered' as any, page: 1 })
              }
            }}
          >
            <div className='flex items-center justify-between mb-4'>
              <TabsList className='bg-gray-100 p-1 rounded-lg'>
                <TabsTrigger
                  value='all'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5'
                >
                  Todas las Órdenes
                  {!isLoading && stats && stats.totalOrders > 0 && (
                    <span className='ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium'>
                      {stats.totalOrders}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value='pending'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5'
                >
                  Pendientes
                  {!isLoading && stats && stats.pendingOrders > 0 && (
                    <span className='ml-2 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium'>
                      {stats.pendingOrders}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value='processing'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5'
                >
                  En Proceso
                  {!isLoading && stats && stats.processingOrders > 0 && (
                    <span className='ml-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium'>
                      {stats.processingOrders}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value='completed'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5'
                >
                  Completadas
                  {!isLoading && stats && stats.completedOrders > 0 && (
                    <span className='ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium'>
                      {stats.completedOrders}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Operaciones masivas si hay órdenes seleccionadas */}
              <OrderBulkOperations 
                selectedOrders={[]} 
                onBulkAction={(action: string, orderIds: string[]) => {
                  // Convertir la acción a un OrderStatus válido
                  const statusMap: Record<string, any> = {
                    confirm: 'confirmed',
                    process: 'processing',
                    ship: 'shipped',
                    deliver: 'delivered',
                    cancel: 'cancelled',
                  }
                  const status = statusMap[action] || 'pending'
                  handleBulkOperation(orderIds, status)
                }} 
              />
            </div>

            {/* Tab: Todas las Órdenes */}
            <TabsContent value='all' className='mt-0'>
              <Card className='border-t-4 border-t-indigo-500'>
                <CardContent className='p-0'>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSkeleton lines={5} variant="card" />}>
                      <OrderList
                        key={`orders-${filters.page}-${filters.limit}-${filters.status || 'all'}`}
                        orders={orders}
                        isLoading={isLoadingOrders}
                        error={error}
                        onOrderAction={(action, orderId) => {
                          if (action === 'view') {
                            handleViewOrder(orderId)
                          } else if (action === 'edit') {
                            handleEditOrder(orderId)
                          } else {
                            handleOrderActionWithToast(action, orderId)
                          }
                        }}
                        filters={filters}
                        updateFilters={updateFilters}
                        resetFilters={resetFilters}
                        pagination={pagination}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Pendientes */}
            <TabsContent value='pending' className='mt-0'>
              <Card className='border-t-4 border-t-yellow-500'>
                <CardContent className='p-0'>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSkeleton lines={5} variant="card" />}>
                      <OrderList
                        key={`orders-pending-${filters.page}-${filters.limit}`}
                        orders={orders}
                        isLoading={isLoadingOrders}
                        error={error}
                        onOrderAction={(action, orderId) => {
                          if (action === 'view') {
                            handleViewOrder(orderId)
                          } else if (action === 'edit') {
                            handleEditOrder(orderId)
                          } else {
                            handleOrderActionWithToast(action, orderId)
                          }
                        }}
                        filters={filters}
                        updateFilters={updateFilters}
                        resetFilters={resetFilters}
                        pagination={pagination}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: En Proceso */}
            <TabsContent value='processing' className='mt-0'>
              <Card className='border-t-4 border-t-orange-500'>
                <CardContent className='p-0'>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSkeleton lines={5} variant="card" />}>
                      <OrderList
                        key={`orders-processing-${filters.page}-${filters.limit}`}
                        orders={orders}
                        isLoading={isLoadingOrders}
                        error={error}
                        onOrderAction={(action, orderId) => {
                          if (action === 'view') {
                            handleViewOrder(orderId)
                          } else if (action === 'edit') {
                            handleEditOrder(orderId)
                          } else {
                            handleOrderActionWithToast(action, orderId)
                          }
                        }}
                        filters={filters}
                        updateFilters={updateFilters}
                        resetFilters={resetFilters}
                        pagination={pagination}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Completadas */}
            <TabsContent value='completed' className='mt-0'>
              <Card className='border-t-4 border-t-green-500'>
                <CardContent className='p-0'>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSkeleton lines={5} variant="card" />}>
                      <OrderList
                        key={`orders-completed-${filters.page}-${filters.limit}`}
                        orders={orders}
                        isLoading={isLoadingOrders}
                        error={error}
                        onOrderAction={(action, orderId) => {
                          if (action === 'view') {
                            handleViewOrder(orderId)
                          } else if (action === 'edit') {
                            handleEditOrder(orderId)
                          } else {
                            handleOrderActionWithToast(action, orderId)
                          }
                        }}
                        filters={filters}
                        updateFilters={updateFilters}
                        resetFilters={resetFilters}
                        pagination={pagination}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {error && (
            <Card className='border-red-200 bg-red-50'>
              <CardContent className='pt-6'>
                <div className='flex items-center space-x-2 text-red-700'>
                  <div className='text-sm'>
                    Error: {error instanceof Error ? error.message : 'Error desconocido'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modales */}
        <NewOrderModal
          isOpen={isNewOrderModalOpen}
          onClose={() => setIsNewOrderModalOpen(false)}
          onOrderCreated={() => {
            setIsNewOrderModalOpen(false)
            refreshOrders()
          }}
        />

        <ExportOrdersModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          totalOrders={stats?.totalOrders || 0}
        />

        {selectedOrderId && (
          <>
            <OrderDetailsModal
              orderId={Number(selectedOrderId)}
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false)
                setSelectedOrderId(null)
              }}
            />

            <EditOrderModal
              orderId={Number(selectedOrderId)}
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false)
                setSelectedOrderId(null)
              }}
              onOrderUpdated={() => {
                setIsEditModalOpen(false)
                setSelectedOrderId(null)
                refreshOrders()
              }}
            />
          </>
        )}
      </AdminContentWrapper>
    </AdminLayout>
  )
}
