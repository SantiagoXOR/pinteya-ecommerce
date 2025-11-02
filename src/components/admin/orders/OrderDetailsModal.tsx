/**
 * Modal de Detalles de Orden - Panel Administrativo
 * Basado en mejores prácticas de e-commerce (Shopify, WooCommerce)
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  User,
  CreditCard,
  Truck,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { PaymentProofModal } from './PaymentProofModal'

// ===================================
// TIPOS
// ===================================

interface OrderItem {
  id: number
  quantity: number
  unit_price: number
  total_price: number
  products: {
    id: number
    name: string
    images?: string[]
  }
}

interface Order {
  id: number
  external_reference?: string
  status: string
  payment_status?: string
  payment_id?: string
  total: number
  created_at: string
  updated_at: string
  payer_info?: {
    name?: string
    email?: string
    phone?: string
  }
  shipping_address?: {
    street?: string
    street_name?: string
    street_number?: string
    city?: string
    city_name?: string
    state?: string
    state_name?: string
    zip_code?: string
    country?: string
  }
  order_items?: OrderItem[]
  notes?: string
  tracking_number?: string
  payment_method?: string
  shipping_method?: string
}

interface StatusHistoryItem {
  id: string
  status: string
  timestamp: string
  note?: string
  user?: string
}

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: number | null
}

// ===================================
// UTILIDADES
// ===================================

const getStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const getStatusIcon = (status: string) => {
  const icons = {
    pending: Clock,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle,
    cancelled: XCircle,
    refunded: AlertCircle,
  }
  return icons[status as keyof typeof icons] || Clock
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  orderId,
}) => {
  // Estados
  const [order, setOrder] = useState<Order | null>(null)
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isPaymentProofModalOpen, setIsPaymentProofModalOpen] = useState(false)

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails()
    }
  }, [isOpen, orderId])

  // ===================================
  // FUNCIONES
  // ===================================

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true)
      let orderData: any = null

      // Cargar detalles de la orden
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        orderData = data.data.order
        
        // Transformar shipping_address para compatibilidad
        if (orderData.shipping_address) {
          const addr = orderData.shipping_address
          orderData.shipping_address = {
            street: addr.street || `${addr.street_name || ''} ${addr.street_number || ''}`.trim() || undefined,
            city: addr.city || addr.city_name || undefined,
            state: addr.state || addr.state_name || undefined,
            zip_code: addr.zip_code || undefined,
            country: addr.country || undefined,
          }
        }
        
        setOrder(orderData)
      } else {
        toast.error('Error al cargar detalles de la orden')
        return
      }

      // Cargar historial de estados real desde el backend
      try {
        const historyResponse = await fetch(`/api/admin/orders/${orderId}/history`)
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          if (historyData.success && historyData.data?.statusHistory) {
            setStatusHistory(historyData.data.statusHistory)
          } else {
            // Fallback: crear historial básico basado en el estado actual de la orden
            const basicHistory: StatusHistoryItem[] = [
              {
                id: '1',
                status: orderData?.status || 'pending',
                timestamp: orderData?.created_at || new Date().toISOString(),
                note: 'Orden creada',
                user: 'Sistema',
              },
            ]
            setStatusHistory(basicHistory)
          }
        } else {
          // Fallback: crear historial básico
          const basicHistory: StatusHistoryItem[] = [
            {
              id: '1',
              status: orderData?.status || 'pending',
              timestamp: orderData?.created_at || new Date().toISOString(),
              note: 'Orden creada',
              user: 'Sistema',
            },
          ]
          setStatusHistory(basicHistory)
        }
      } catch (historyError) {
        console.error('Error loading order history:', historyError)
        // Fallback: crear historial básico
        const basicHistory: StatusHistoryItem[] = [
          {
            id: '1',
            status: orderData?.status || 'pending',
            timestamp: orderData?.created_at || new Date().toISOString(),
            note: 'Orden creada',
            user: 'Sistema',
          },
        ]
        setStatusHistory(basicHistory)
      }
    } catch (error) {
      console.error('Error loading order details:', error)
      toast.error('Error al cargar detalles de la orden')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado al portapapeles`)
  }

  // ===================================
  // FUNCIONES DE PAGO
  // ===================================

  const handleCreatePaymentLink = async () => {
    if (!order) {
      return
    }

    try {
      const loadingToast = toast.loading('Creando link de pago...')

      const response = await fetch(`/api/admin/orders/${order.id}/payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.payment_url) {
          // Copiar link al portapapeles y mostrar notificación
          await navigator.clipboard.writeText(data.data.payment_url)
          toast.success('Link de pago creado y copiado al portapapeles', { id: loadingToast })

          // Opcional: abrir en nueva ventana
          window.open(data.data.payment_url, '_blank')
        } else {
          toast.error('Error al crear link de pago', { id: loadingToast })
        }
      } else {
        toast.error('Error al crear link de pago', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error creating payment link:', error)
      toast.error('Error al crear link de pago')
    }
  }

  const handleMarkAsPaid = async () => {
    if (!order) {
      return
    }

    try {
      const loadingToast = toast.loading('Marcando orden como pagada...')

      const response = await fetch(`/api/admin/orders/${order.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: 'manual',
          notes: 'Marcado como pagado manualmente por administrador',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success('Orden marcada como pagada', { id: loadingToast })
          // Recargar datos de la orden
          loadOrderDetails()
        } else {
          toast.error('Error al marcar orden como pagada', { id: loadingToast })
        }
      } else {
        toast.error('Error al marcar orden como pagada', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
      toast.error('Error al marcar orden como pagada')
    }
  }

  const handleProcessRefund = async () => {
    if (!order) {
      return
    }

    try {
      const loadingToast = toast.loading('Procesando reembolso...')

      const response = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.total,
          reason: 'Reembolso solicitado por administrador',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success('Reembolso procesado exitosamente', { id: loadingToast })
          // Recargar datos de la orden
          loadOrderDetails()
        } else {
          toast.error('Error al procesar reembolso', { id: loadingToast })
        }
      } else {
        toast.error('Error al procesar reembolso', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      toast.error('Error al procesar reembolso')
    }
  }

  if (!order && !isLoading) {
    return null
  }

  const StatusIcon = order ? getStatusIcon(order.status) : Clock

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3'>
            <Package className='h-6 w-6' />
            <div className='flex items-center gap-3'>
              <span>Orden #{order?.id || orderId}</span>
              {order && (
                <Badge className={getStatusColor(order.status)}>
                  <StatusIcon className='h-3 w-3 mr-1' />
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center h-96'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-600'>Cargando detalles de la orden...</p>
            </div>
          </div>
        ) : order ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className='flex-1 overflow-hidden'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='overview'>Resumen</TabsTrigger>
              <TabsTrigger value='customer'>Cliente</TabsTrigger>
              <TabsTrigger value='payment'>Pago</TabsTrigger>
              <TabsTrigger value='history'>Historial</TabsTrigger>
            </TabsList>

            <ScrollArea className='h-[600px] mt-4'>
              {/* Tab: Resumen */}
              <TabsContent value='overview' className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Información General */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <FileText className='h-4 w-4' />
                        Información General
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>ID de Orden:</span>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>#{order.id}</span>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => copyToClipboard(order.id.toString(), 'ID de orden')}
                          >
                            <Copy className='h-3 w-3' />
                          </Button>
                        </div>
                      </div>

                      {order.external_reference && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Referencia:</span>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>{order.external_reference}</span>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() =>
                                copyToClipboard(order.external_reference!, 'Referencia')
                              }
                            >
                              <Copy className='h-3 w-3' />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Fecha de Creación:</span>
                        <span className='font-medium'>{formatDate(order.created_at)}</span>
                      </div>

                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Última Actualización:</span>
                        <span className='font-medium'>{formatDate(order.updated_at)}</span>
                      </div>

                      <Separator />

                      <div className='flex justify-between text-lg'>
                        <span className='font-semibold'>Total:</span>
                        <span className='font-bold text-green-600'>
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Productos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Package className='h-4 w-4' />
                        Productos ({order.order_items?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {order.order_items?.map(item => (
                          <div
                            key={item.id}
                            className='flex justify-between items-start p-3 bg-gray-50 rounded-lg'
                          >
                            <div className='flex-1'>
                              <h4 className='font-medium text-sm'>{item.products.name}</h4>
                              <p className='text-xs text-gray-600'>
                                Cantidad: {item.quantity} × {formatCurrency(item.unit_price)}
                              </p>
                            </div>
                            <div className='text-right'>
                              <p className='font-medium'>
                                {formatCurrency(item.total_price || item.quantity * item.unit_price)}
                              </p>
                            </div>
                          </div>
                        )) || (
                          <p className='text-gray-500 text-center py-4'>
                            No hay productos en esta orden
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Envío */}
                {order.shipping_address && (
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Truck className='h-4 w-4' />
                        Información de Envío
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <h4 className='font-medium mb-2'>Dirección de Envío</h4>
                        <div className='text-sm text-gray-600 space-y-1'>
                          {order.shipping_address.street && <p>{order.shipping_address.street}</p>}
                          {order.shipping_address.city && (
                            <p>
                              {order.shipping_address.city}
                              {order.shipping_address.state && `, ${order.shipping_address.state}`}
                            </p>
                          )}
                          {order.shipping_address.zip_code && (
                            <p>CP: {order.shipping_address.zip_code}</p>
                          )}
                          {order.shipping_address.country && (
                            <p>{order.shipping_address.country}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className='font-medium mb-2'>Detalles del Envío</h4>
                        <div className='text-sm space-y-2'>
                          {order.shipping_method && (
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>Método:</span>
                              <span>{order.shipping_method}</span>
                            </div>
                          )}
                          {order.tracking_number && (
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>Seguimiento:</span>
                              <div className='flex items-center gap-2'>
                                <span className='font-mono text-xs'>{order.tracking_number}</span>
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  onClick={() =>
                                    copyToClipboard(order.tracking_number!, 'Número de seguimiento')
                                  }
                                >
                                  <Copy className='h-3 w-3' />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab: Cliente */}
              <TabsContent value='customer' className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <User className='h-4 w-4' />
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {order.payer_info ? (
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-3'>
                          {order.payer_info.name && (
                            <div className='flex items-center gap-3'>
                              <User className='h-4 w-4 text-gray-400' />
                              <div>
                                <p className='text-sm text-gray-600'>Nombre</p>
                                <p className='font-medium'>{order.payer_info.name}</p>
                              </div>
                            </div>
                          )}

                          {order.payer_info.email && (
                            <div className='flex items-center gap-3'>
                              <Mail className='h-4 w-4 text-gray-400' />
                              <div>
                                <p className='text-sm text-gray-600'>Email</p>
                                <p className='font-medium'>{order.payer_info.email}</p>
                              </div>
                            </div>
                          )}

                          {order.payer_info.phone && (
                            <div className='flex items-center gap-3'>
                              <Phone className='h-4 w-4 text-gray-400' />
                              <div>
                                <p className='text-sm text-gray-600'>Teléfono</p>
                                <p className='font-medium'>{order.payer_info.phone}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className='space-y-3'>
                          <h4 className='font-medium'>Acciones del Cliente</h4>
                          <div className='space-y-2'>
                            <Button variant='outline' size='sm' className='w-full justify-start'>
                              <Mail className='h-4 w-4 mr-2' />
                              Enviar Email
                            </Button>
                            <Button variant='outline' size='sm' className='w-full justify-start'>
                              <ExternalLink className='h-4 w-4 mr-2' />
                              Ver Historial de Órdenes
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className='text-gray-500 text-center py-8'>
                        No hay información del cliente disponible
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Pago */}
              <TabsContent value='payment' className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <CreditCard className='h-4 w-4' />
                      Información de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-3'>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Estado de Pago:</span>
                          <Badge className={getStatusColor(order.payment_status || 'pending')}>
                            {order.payment_status || 'Pendiente'}
                          </Badge>
                        </div>

                        {order.payment_method && (
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Método de Pago:</span>
                            <span className='font-medium'>{order.payment_method}</span>
                          </div>
                        )}

                        <Separator />

                        <div className='flex justify-between text-lg'>
                          <span className='font-semibold'>Total Pagado:</span>
                          <span className='font-bold text-green-600'>
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                      </div>

                      <div className='space-y-3'>
                        <h4 className='font-medium'>Acciones de Pago</h4>
                        <div className='space-y-2'>
                          {order.payment_status === 'pending' && (
                            <>
                              <Button
                                variant='default'
                                size='sm'
                                className='w-full justify-start'
                                onClick={() => handleCreatePaymentLink()}
                              >
                                <CreditCard className='h-4 w-4 mr-2' />
                                Crear Link de Pago
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                className='w-full justify-start'
                                onClick={() => handleMarkAsPaid()}
                              >
                                <DollarSign className='h-4 w-4 mr-2' />
                                Marcar como Pagado
                              </Button>
                            </>
                          )}
                          {order.payment_status === 'paid' && (
                            <Button
                              variant='outline'
                              size='sm'
                              className='w-full justify-start'
                              onClick={() => handleProcessRefund()}
                            >
                              <DollarSign className='h-4 w-4 mr-2' />
                              Procesar Reembolso
                            </Button>
                          )}
                          <Button 
                            variant='outline' 
                            size='sm' 
                            className='w-full justify-start'
                            onClick={() => setIsPaymentProofModalOpen(true)}
                            disabled={!order.payment_id}
                          >
                            <FileText className='h-4 w-4 mr-2' />
                            Ver Comprobante
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Historial */}
              <TabsContent value='history' className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Clock className='h-4 w-4' />
                      Historial de Estados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {statusHistory.map((item, index) => {
                        const StatusIcon = getStatusIcon(item.status)
                        return (
                          <div key={item.id} className='flex items-start gap-4'>
                            <div className='flex flex-col items-center'>
                              <div className={`p-2 rounded-full ${getStatusColor(item.status)}`}>
                                <StatusIcon className='h-4 w-4' />
                              </div>
                              {index < statusHistory.length - 1 && (
                                <div className='w-0.5 h-8 bg-gray-200 mt-2' />
                              )}
                            </div>
                            <div className='flex-1 pb-4'>
                              <div className='flex items-center gap-2 mb-1'>
                                <span className='font-medium capitalize'>{item.status}</span>
                                <span className='text-sm text-gray-500'>
                                  {formatDate(item.timestamp)}
                                </span>
                              </div>
                              {item.note && <p className='text-sm text-gray-600'>{item.note}</p>}
                              {item.user && (
                                <p className='text-xs text-gray-500 mt-1'>Por: {item.user}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <div className='flex items-center justify-center h-96'>
            <div className='text-center'>
              <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <p className='text-gray-600'>No se pudo cargar la información de la orden</p>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Modal de Comprobante de Pago */}
      {order && (
        <PaymentProofModal
          isOpen={isPaymentProofModalOpen}
          onClose={() => setIsPaymentProofModalOpen(false)}
          orderId={order.id}
        />
      )}
    </Dialog>
  )
}
