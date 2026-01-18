'use client'

import { Suspense, useMemo, useState } from 'react'
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
  ShieldAlert,
} from '@/lib/optimized-imports'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function OrdersPageClient() {
  // Estados de modales
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  
  // Estado para selección múltiple de órdenes
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

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

  const isBypassAuthEnabled =
    process.env.BYPASS_AUTH === 'true' || process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
  const bypassDescription = useMemo(() => {
    if (!isBypassAuthEnabled) {
      return null
    }
    return (
      <Alert className='border-amber-300 bg-amber-50 text-amber-900'>
        <ShieldAlert className='h-5 w-5 text-amber-600' />
        <AlertTitle>Bypass de autenticación activo</AlertTitle>
        <AlertDescription>
          Este entorno omite el login para pruebas locales. Recuerda deshabilitarlo antes de desplegar.
        </AlertDescription>
      </Alert>
    )
  }, [isBypassAuthEnabled])

  // Handlers de modales
  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsDetailsModalOpen(true)
  }

  const handleEditOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsEditModalOpen(true)
  }

  // Handler para ver historial de una orden
  const handleViewHistory = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/history`)
      if (!response.ok) {
        throw new Error('Error al obtener historial')
      }
      const data = await response.json()
      
      if (data.data && data.data.length > 0) {
        // Mostrar el historial en un toast con información
        const historyItems = data.data.slice(0, 5).map((item: any) => 
          `${item.previous_status} → ${item.new_status}`
        ).join('\n')
        toast.info(`Historial de cambios:\n${historyItems}`, {
          duration: 5000,
          description: `Última actualización: ${new Date(data.data[0].created_at).toLocaleDateString('es-AR')}`
        })
      } else {
        toast.info('Esta orden no tiene historial de cambios')
      }
    } catch (error) {
      toast.error('Error al cargar el historial')
      console.error('Error fetching history:', error)
    }
  }

  // Handler para imprimir orden
  const handlePrintOrder = async (orderId: string) => {
    try {
      // Obtener detalles de la orden
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) {
        throw new Error('Error al obtener datos de la orden')
      }
      const data = await response.json()
      const order = data.data

      if (!order) {
        toast.error('No se encontraron datos de la orden')
        return
      }

      // Crear ventana de impresión
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('El navegador bloqueó la ventana de impresión')
        return
      }

      const formatCurrency = (amount: number) => 
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)

      const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('es-AR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

      const clientName = order.payer_info?.name && order.payer_info?.surname
        ? `${order.payer_info.name} ${order.payer_info.surname}`
        : order.user_profiles?.first_name
        ? `${order.user_profiles.first_name} ${order.user_profiles.last_name || ''}`
        : 'Cliente'

      const clientPhone = order.payer_info?.phone || order.user_profiles?.phone || 'No especificado'

      const items = order.order_items?.map((item: any) => {
        const name = item.product_snapshot?.name || item.products?.name || 'Producto'
        const price = item.product_snapshot?.price || item.price || 0
        return `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(price)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(price * item.quantity)}</td>
          </tr>
        `
      }).join('') || ''

      const address = order.shipping_address
        ? `${order.shipping_address.street_name} ${order.shipping_address.street_number}, ${order.shipping_address.city_name}, ${order.shipping_address.state_name}`
        : 'No especificada'

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Orden ${order.order_number || order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .order-info { margin-bottom: 20px; }
            .order-info h2 { color: #333; margin-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-box { background: #f5f5f5; padding: 15px; border-radius: 8px; }
            .info-box h3 { margin: 0 0 10px 0; color: #555; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #4f46e5; color: white; padding: 10px; text-align: left; }
            th:last-child, th:nth-child(2), th:nth-child(3) { text-align: right; }
            th:nth-child(2) { text-align: center; }
            .total { text-align: right; font-size: 18px; font-weight: bold; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Orden de Compra</h1>
            <p style="color: #666;">Número: ${order.order_number || order.id}</p>
            <p style="color: #666;">Fecha: ${formatDate(order.created_at)}</p>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <h3>DATOS DEL CLIENTE</h3>
              <p><strong>Nombre:</strong> ${clientName}</p>
              <p><strong>Teléfono:</strong> ${clientPhone}</p>
            </div>
            <div class="info-box">
              <h3>DIRECCIÓN DE ENVÍO</h3>
              <p>${address}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items}
            </tbody>
          </table>

          <div class="total">
            <p>Total: ${formatCurrency(order.total)}</p>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)

      toast.success('Preparando impresión...')
    } catch (error) {
      toast.error('Error al preparar la impresión')
      console.error('Error printing order:', error)
    }
  }

  // Handler para descargar orden como JSON
  const handleDownloadOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) {
        throw new Error('Error al obtener datos de la orden')
      }
      const data = await response.json()
      const order = data.data

      if (!order) {
        toast.error('No se encontraron datos de la orden')
        return
      }

      // Crear archivo JSON para descarga
      const jsonContent = JSON.stringify(order, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `orden-${order.order_number || order.id}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Archivo descargado correctamente')
    } catch (error) {
      toast.error('Error al descargar la orden')
      console.error('Error downloading order:', error)
    }
  }

  // Handler con feedback visual
  const handleOrderActionWithToast = async (action: string, orderId: string) => {
    // Manejar acciones especiales primero
    if (action === 'history') {
      handleViewHistory(orderId)
      return
    }
    if (action === 'print') {
      handlePrintOrder(orderId)
      return
    }
    if (action === 'download') {
      handleDownloadOrder(orderId)
      return
    }

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
      refund: {
        loading: 'Procesando reembolso...',
        success: 'Reembolso procesado',
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
        <div className='space-y-5 sm:space-y-6'>
          {bypassDescription}
          {/* Header con Gradiente - Responsive */}
          <div className='bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl shadow-lg p-4 sm:p-6 text-white space-y-4'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
              <div className='space-y-2'>
                <div className='flex items-center gap-3'>
                  <ShoppingCart className='w-6 h-6 sm:w-8 sm:h-8' />
                  <h1 className='text-2xl sm:text-3xl font-bold'>Gestión de Órdenes</h1>
                </div>
                <p className='text-indigo-100 text-sm sm:text-base'>
                  Administra y procesa todas las órdenes de tu tienda
                </p>
              </div>
              <div className='flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3'>
                <Button
                  variant='secondary'
                  onClick={() => refreshOrders()}
                  disabled={isLoading}
                  className='flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30'
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </Button>
                <Button
                  onClick={() => setIsNewOrderModalOpen(true)}
                  className='flex-1 flex items-center justify-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50'
                >
                  <Plus className='w-4 h-4' />
                  <span>Nueva orden</span>
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
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='w-5 h-5' />
                <span>Acciones Rápidas</span>
              </CardTitle>
              <CardDescription>Herramientas para gestión de órdenes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'>
                <Button
                  variant='outline'
                  className='flex items-center justify-center gap-2 h-16'
                  onClick={() => setIsExportModalOpen(true)}
                  type='button'
                >
                  <Download className='w-5 h-5' />
                  <span>Exportar CSV</span>
                </Button>
                <Button
                  variant='outline'
                  className='flex items-center justify-center gap-2 h-16'
                  onClick={() => {
                    toast.info('Generación de reportes disponible próximamente')
                  }}
                  type='button'
                >
                  <FileText className='w-5 h-5' />
                  <span>Generar Reportes</span>
                </Button>
                <Button
                  variant='outline'
                  className='flex items-center justify-center gap-2 h-16'
                  onClick={() => {
                    toast.info('Análisis avanzado llegará en la próxima iteración')
                  }}
                  type='button'
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
            <div className='flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between mb-4'>
              <TabsList className='bg-gray-100 p-1 rounded-lg flex flex-wrap gap-2'>
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
                selectedOrders={selectedOrders}
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
                  // Limpiar selección después de la operación
                  setSelectedOrders([])
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
                        selectedOrders={selectedOrders}
                        setSelectedOrders={setSelectedOrders}
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
                        selectedOrders={selectedOrders}
                        setSelectedOrders={setSelectedOrders}
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
                        selectedOrders={selectedOrders}
                        setSelectedOrders={setSelectedOrders}
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
                        selectedOrders={selectedOrders}
                        setSelectedOrders={setSelectedOrders}
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
              orderId={selectedOrderId}
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false)
                setSelectedOrderId(null)
              }}
            />

            <EditOrderModal
              orderId={selectedOrderId}
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
