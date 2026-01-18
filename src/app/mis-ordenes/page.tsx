'use client'

// ⚡ FIX VERCEL: Client Components no deben exportar 'dynamic'
// Los Client Components se renderizan estáticamente en build time y se hidratan en el cliente
// El 'export const dynamic' es solo para Server Components
import React, { useEffect, useState } from 'react'
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  RotateCcw,
  Eye,
  Filter,
  Search,
  Download,
  RefreshCw,
} from '@/lib/optimized-imports'
import Link from 'next/link'
import { OrderTracker, OrderStatus } from '@/components/Orders/OrderTracker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface OrderItem {
  id: number
  quantity: number
  price: string
  product_id?: number
  product_name?: string
  image_url?: string | null
  product_snapshot?: {
    name?: string
    color?: string
    finish?: string
    medida?: string
    brand?: string
    image?: string
  }
  products?: {
    id: number
    name: string
    images: string[]
  }
}

interface Order {
  id: number
  external_reference: string
  total: string
  status: string
  payment_status: string
  created_at: string
  updated_at: string
  order_items: OrderItem[]
  order_number?: string
  tracking_number?: string
  carrier?: string
  estimated_delivery?: string
  fulfillment_status?: string
  notes?: string
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'yellow', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'blue', icon: CheckCircle },
  processing: { label: 'Procesando', color: 'orange', icon: Package },
  shipped: { label: 'Enviado', color: 'purple', icon: Truck },
  delivered: { label: 'Entregado', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'red', icon: XCircle },
  returned: { label: 'Devuelto', color: 'gray', icon: RotateCcw },
  refunded: { label: 'Reembolsado', color: 'gray', icon: RotateCcw },
}

const paymentStatusConfig = {
  pending: { label: 'Pendiente', color: 'yellow' },
  paid: { label: 'Pagado', color: 'green' },
  failed: { label: 'Fallido', color: 'red' },
  refunded: { label: 'Reembolsado', color: 'gray' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false)
  const [orderDetails, setOrderDetails] = useState<Order | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  // Filtrar órdenes cuando cambian los filtros
  useEffect(() => {
    let filtered = orders

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        order =>
          order.external_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.order_items.some(item =>
            (item.product_name || item.product_snapshot?.name || item.products?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/user/orders')
      const data = await response.json()

      if (response.ok && data.success) {
        setOrders(data.data)
        setFilteredOrders(data.data)
      } else {
        setError(data.error || 'Error al cargar órdenes')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Abrir tracking de orden
  const openOrderTracking = (order: Order) => {
    setSelectedOrder(order)
    setIsTrackingDialogOpen(true)
  }

  // Obtener detalles de orden
  const fetchOrderDetails = async (orderId: number, orderNumber?: string, externalReference?: string) => {
    setLoadingDetails(true)
    try {
      // Usar order_number o external_reference si están disponibles, sino usar orderId
      const orderIdentifier = orderNumber || externalReference || orderId.toString()
      const response = await fetch(`/api/orders/${orderIdentifier}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setOrderDetails(data.data)
        setIsDetailsDialogOpen(true)
      } else {
        console.error('Error al obtener detalles:', data.error)
        // Aquí podrías mostrar un toast o notificación de error
      }
    } catch (error) {
      console.error('Error de conexión:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Convertir Order a OrderStatus para el tracker
  const convertToOrderStatus = (order: Order): OrderStatus => ({
    id: order.id.toString(),
    status: order.status as any,
    payment_status: order.payment_status as any,
    fulfillment_status: order.fulfillment_status as any,
    order_number: order.order_number || order.external_reference,
    tracking_number: order.tracking_number,
    carrier: order.carrier,
    estimated_delivery: order.estimated_delivery,
    created_at: order.created_at,
    updated_at: order.updated_at,
  })

  // Obtener estadísticas de órdenes
  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
    }
    return stats
  }

  const stats = getOrderStats()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPaymentMethodBadge = (paymentMethod: string | undefined) => {
    if (!paymentMethod) return null

    // Traducir método de pago a español legible
    const methodLabels: Record<string, string> = {
      cash: 'Pago al recibir',
      mercadopago: 'MercadoPago',
      credit_card: 'Tarjeta de crédito',
      debit_card: 'Tarjeta de débito',
    }

    const label = methodLabels[paymentMethod.toLowerCase()] || paymentMethod

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {label}
      </span>
    )
  }

  const getStatusBadge = (status: string, type: 'order' | 'payment' = 'order') => {
    const config = type === 'order' ? statusConfig : paymentStatusConfig
    const statusInfo = config[status as keyof typeof config]

    if (!statusInfo) {
      return null
    }

    const colorClasses = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[statusInfo.color]}`}
      >
        {type === 'order' && statusInfo.icon && <statusInfo.icon className='w-3 h-3 mr-1' />}
        {statusInfo.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className='min-h-screen py-12'>
        <div className='max-w-4xl mx-auto px-8 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blaze-orange-600 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Cargando tus órdenes...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen py-12'>
        <div className='max-w-4xl mx-auto px-8 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
              {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
            </div>
            <button
              onClick={fetchOrders}
              className='mt-4 bg-blaze-orange-600 text-white px-6 py-2 rounded-lg hover:bg-blaze-orange-700 transition-colors'
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen py-12'>
      <div className='max-w-6xl mx-auto px-8 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>Mis Órdenes</h1>
              <p className='text-gray-600'>Historial completo de tus compras</p>
            </div>
            <Button onClick={fetchOrders} variant='outline' disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {/* Estadísticas */}
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mt-6'>
            <Card>
              <CardContent className='p-4'>
                <div className='text-2xl font-bold text-gray-900'>{stats.total}</div>
                <div className='text-sm text-gray-600'>Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <div className='text-2xl font-bold text-yellow-600'>{stats.pending}</div>
                <div className='text-sm text-gray-600'>Pendientes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <div className='text-2xl font-bold text-orange-600'>{stats.processing}</div>
                <div className='text-sm text-gray-600'>Procesando</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <div className='text-2xl font-bold text-purple-600'>{stats.shipped}</div>
                <div className='text-sm text-gray-600'>Enviados</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <div className='text-2xl font-bold text-green-600'>{stats.delivered}</div>
                <div className='text-sm text-gray-600'>Entregados</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <Card className='mb-6'>
          <CardContent className='p-6'>
            <div className='flex flex-col md:flex-row gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <Input
                    placeholder='Buscar por número de orden, tracking o producto...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
              <div className='w-full md:w-48'>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder='Filtrar por estado' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Todos los estados</SelectItem>
                    <SelectItem value='pending'>Pendientes</SelectItem>
                    <SelectItem value='confirmed'>Confirmados</SelectItem>
                    <SelectItem value='processing'>Procesando</SelectItem>
                    <SelectItem value='shipped'>Enviados</SelectItem>
                    <SelectItem value='delivered'>Entregados</SelectItem>
                    <SelectItem value='cancelled'>Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredOrders.length === 0 && orders.length > 0 ? (
          <Card>
            <CardContent className='p-12 text-center'>
              <Filter className='h-12 w-12 mx-auto text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>No se encontraron órdenes</h3>
              <p className='text-gray-600 mb-4'>Intenta ajustar los filtros de búsqueda</p>
              <Button
                variant='outline'
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}
              >
                Limpiar filtros
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <div className='text-center py-12'>
            <Package className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>No tienes órdenes aún</h3>
            <p className='text-gray-600 mb-6'>Cuando realices tu primera compra, aparecerá aquí</p>
            <Link
              href='/shop'
              className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blaze-orange-600 hover:bg-blaze-orange-700 transition-colors'
            >
              Comenzar a comprar
            </Link>
          </div>
        ) : (
          <div className='space-y-6'>
            {filteredOrders.map(order => (
              <div
                key={order.id}
                className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
              >
                {/* Header de la orden */}
                <div className='px-6 py-4 border-b border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='text-lg font-medium text-gray-900'>
                        Orden #{order.external_reference}
                      </h3>
                      <p className='text-sm text-gray-600'>{formatDate(order.created_at)}</p>
                    </div>
                    <div className='flex items-center space-x-3'>
                      {getPaymentMethodBadge(order.payment_method || order.payer_info?.payment_method)}
                      {order.payment_status !== order.status && getStatusBadge(order.payment_status, 'payment')}
                      {getStatusBadge(order.status, 'order')}
                    </div>
                  </div>
                </div>

                {/* Items de la orden */}
                <div className='px-6 py-4'>
                  <div className='space-y-3'>
                    {order.order_items.map(item => (
                      <div key={item.id} className='flex items-center space-x-4'>
                        <div className='flex-shrink-0'>
                          {item.products.images && item.products.images.length > 0 ? (
                            <img
                              src={item.products.images[0]}
                              alt={item.products.name}
                              className='h-16 w-16 object-cover rounded-lg'
                            />
                          ) : (
                            <div className='h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center'>
                              <Package className='h-8 w-8 text-gray-400' />
                            </div>
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-gray-900 truncate'>
                            {item.products.name}
                          </p>
                          <p className='text-sm text-gray-600'>Cantidad: {item.quantity}</p>
                        </div>
                        <div className='text-sm font-medium text-gray-900'>
                          ${parseFloat(item.price).toLocaleString('es-AR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer de la orden */}
                <div className='px-6 py-4 bg-gray-50 border-t border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-gray-600'>
                      Total:{' '}
                      <span className='font-semibold text-gray-900'>
                        ${parseFloat(order.total).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className='flex items-center space-x-3'>
                      <Button variant='outline' size='sm' onClick={() => openOrderTracking(order)}>
                        <Truck className='w-4 h-4 mr-1' />
                        Rastrear
                      </Button>
                      <Link href={`/mis-ordenes/${order.order_number || order.external_reference}`}>
                        <Button
                          variant='outline'
                          size='sm'
                        >
                          <Eye className='w-4 h-4 mr-1' />
                          Ver detalles
                        </Button>
                      </Link>
                      {order.status === 'delivered' && <Button size='sm'>Volver a comprar</Button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Diálogo de tracking */}
        <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Seguimiento de Orden</DialogTitle>
              <DialogDescription>Estado detallado y tracking de tu pedido</DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <OrderTracker order={convertToOrderStatus(selectedOrder)} showDetails={true} />
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de detalles de orden */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Detalles de la Orden</DialogTitle>
              <DialogDescription>Información completa de tu pedido</DialogDescription>
            </DialogHeader>
            {orderDetails && (
              <div className='space-y-6'>
                {/* Informaci├│n general */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-lg'>Información de la Orden</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div>
                        <span className='text-sm font-medium text-gray-600'>N├║mero de Orden:</span>
                        <p className='text-sm text-gray-900'>#{orderDetails.external_reference}</p>
                      </div>
                      <div>
                        <span className='text-sm font-medium text-gray-600'>
                          Fecha de Creación:
                        </span>
                        <p className='text-sm text-gray-900'>
                          {formatDate(orderDetails.created_at)}
                        </p>
                      </div>
                      <div>
                        <span className='text-sm font-medium text-gray-600'>
                          ├Ültima Actualizaci├│n:
                        </span>
                        <p className='text-sm text-gray-900'>
                          {formatDate(orderDetails.updated_at)}
                        </p>
                      </div>
                      <div>
                        <span className='text-sm font-medium text-gray-600'>
                          Estado de la Orden:
                        </span>
                        <div className='mt-1'>{getStatusBadge(orderDetails.status, 'order')}</div>
                      </div>
                      <div>
                        <span className='text-sm font-medium text-gray-600'>Estado del Pago:</span>
                        <div className='mt-1'>
                          {getStatusBadge(orderDetails.payment_status, 'payment')}
                        </div>
                      </div>
                      <div>
                        <span className='text-sm font-medium text-gray-600'>Total:</span>
                        <p className='text-lg font-semibold text-gray-900'>
                          ${parseFloat(orderDetails.total).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Información del comprador */}
                  {orderDetails.payer_info && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>Información del Comprador</CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        {orderDetails.payer_info.email && (
                          <div>
                            <span className='text-sm font-medium text-gray-600'>Email:</span>
                            <p className='text-sm text-gray-900'>{orderDetails.payer_info.email}</p>
                          </div>
                        )}
                        {(orderDetails.payer_info.name || orderDetails.payer_info.first_name) && (
                          <div>
                            <span className='text-sm font-medium text-gray-600'>Nombre:</span>
                            <p className='text-sm text-gray-900'>
                              {orderDetails.payer_info.name || orderDetails.payer_info.first_name}{' '}
                              {orderDetails.payer_info.surname ||
                                orderDetails.payer_info.last_name ||
                                ''}
                            </p>
                          </div>
                        )}
                        {orderDetails.payer_info.phone && (
                          <div>
                            <span className='text-sm font-medium text-gray-600'>Teléfono:</span>
                            <p className='text-sm text-gray-900'>
                              {typeof orderDetails.payer_info.phone === 'string'
                                ? orderDetails.payer_info.phone
                                : orderDetails.payer_info.phone.number}
                            </p>
                          </div>
                        )}
                        {orderDetails.payer_info.identification && (
                          <div>
                            <span className='text-sm font-medium text-gray-600'>
                              Identificaci├│n:
                            </span>
                            <p className='text-sm text-gray-900'>
                              {orderDetails.payer_info.identification.type}:{' '}
                              {orderDetails.payer_info.identification.number}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Dirección de envío */}
                {orderDetails.shipping_address ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-lg'>Direcci├│n de Env├¡o</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-sm text-gray-900'>
                        <p>
                          {orderDetails.shipping_address.street_name}{' '}
                          {orderDetails.shipping_address.street_number}
                        </p>
                        {orderDetails.shipping_address.floor && (
                          <p>Piso: {orderDetails.shipping_address.floor}</p>
                        )}
                        {orderDetails.shipping_address.apartment && (
                          <p>Departamento: {orderDetails.shipping_address.apartment}</p>
                        )}
                        <p>
                          {orderDetails.shipping_address.city_name},{' '}
                          {orderDetails.shipping_address.state_name}
                        </p>
                        <p>CP: {orderDetails.shipping_address.zip_code}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-lg'>Información de Entrega</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-sm text-gray-600 italic'>
                        <p>🏪 Retiro en tienda o información de envío no disponible</p>
                        <p className='mt-2'>Para consultas sobre el envío, contacta al vendedor.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Productos */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Productos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {orderDetails.order_items.map(item => (
                        <div
                          key={item.id}
                          className='flex items-center space-x-4 p-4 border border-gray-200 rounded-lg'
                        >
                          <div className='flex-shrink-0'>
                            {item.products.images && item.products.images.length > 0 ? (
                              <img
                                src={item.products.images[0]}
                                alt={item.products.name}
                                className='h-20 w-20 object-cover rounded-lg'
                              />
                            ) : (
                              <div className='h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center'>
                                <Package className='h-10 w-10 text-gray-400' />
                              </div>
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h4 className='text-base font-medium text-gray-900'>
                              {item.products.name}
                            </h4>
                            <p className='text-sm text-gray-600'>Cantidad: {item.quantity}</p>
                            <p className='text-sm text-gray-600'>
                              Precio unitario: ${parseFloat(item.price).toLocaleString('es-AR')}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='text-lg font-semibold text-gray-900'>
                              ${(parseFloat(item.price) * item.quantity).toLocaleString('es-AR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className='mt-6 pt-4 border-t border-gray-200'>
                      <div className='flex justify-between items-center'>
                        <span className='text-lg font-medium text-gray-900'>
                          Total de la Orden:
                        </span>
                        <span className='text-2xl font-bold text-gray-900'>
                          ${parseFloat(orderDetails.total).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
