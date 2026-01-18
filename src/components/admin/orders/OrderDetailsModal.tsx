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
  Wallet,
  Banknote,
  Upload,
} from '@/lib/optimized-imports'
import { toast } from 'sonner'
import { PaymentProofModal } from './PaymentProofModal'
import { WhatsAppQuickActions } from './WhatsAppQuickActions'
import Image from 'next/image'

// ===================================
// TIPOS
// ===================================

interface OrderItem {
  id: number
  quantity: number
  unit_price: number
  total_price: number
  price?: number
  products?: {
    id: number
    name: string
    images?: string[] | string | null
  }
  product_snapshot?: {
    name?: string
    price?: number
    image?: string
    color?: string
    color_hex?: string
    finish?: string
    medida?: string
    brand?: string
  }
}

interface Order {
  id: string | number
  order_number?: string
  external_reference?: string
  status: string
  payment_status?: string
  payment_id?: string
  total: number
  created_at: string
  updated_at: string
  payer_info?: {
    name?: string
    surname?: string
    email?: string
    phone?: string
    identification?: {
      type?: string
      number?: string
    }
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
    apartment?: string
    observations?: string
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
  orderId: string | null
  onFilterByClient?: (phone: string) => void
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
// HELPER: RESOLVER IMAGEN
// ===================================

function resolveImageSource(images: any): string | null {
  if (!images) return null
  
  // Si es string directo
  if (typeof images === 'string') {
    // Podría ser JSON string
    try {
      const parsed = JSON.parse(images)
      return resolveImageSource(parsed)
    } catch {
      return images.startsWith('http') ? images : null
    }
  }
  
  // Si es array
  if (Array.isArray(images)) {
    if (images.length === 0) return null
    const first = images[0]
    if (typeof first === 'string') return first
    if (first?.url) return first.url
    if (first?.src) return first.src
    return null
  }
  
  // Si es objeto
  if (typeof images === 'object') {
    if (images.url) return images.url
    if (images.src) return images.src
    if (images.image) return images.image
    // Buscar en keys comunes
    const keys = ['primary', 'main', 'default', 'thumbnail']
    for (const key of keys) {
      if (images[key]) return resolveImageSource(images[key])
    }
  }
  
  return null
}

// ===================================
// HELPER: GENERAR URL GOOGLE MAPS
// ===================================

function generateGoogleMapsUrl(address: any): string {
  if (!address) return ''
  
  const parts: string[] = []
  
  const street = address.street || address.street_name
  if (street) {
    let streetFull = street
    if (address.street_number) {
      streetFull += ` ${address.street_number}`
    }
    parts.push(streetFull)
  }
  
  const city = address.city || address.city_name
  if (city) parts.push(city)
  
  const state = address.state || address.state_name
  if (state) parts.push(state)
  
  if (address.zip_code) parts.push(address.zip_code)
  
  parts.push('Argentina')
  
  const query = encodeURIComponent(parts.join(', '))
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

// ===================================
// COMPONENTE: PILL DE ATRIBUTO
// ===================================

function ProductAttributePill({ 
  label, 
  value, 
  colorHex 
}: { 
  label: string
  value: string
  colorHex?: string 
}) {
  return (
    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200'>
      {colorHex && (
        <span
          className='w-3 h-3 rounded-full mr-1.5 border border-white shadow-sm ring-1 ring-gray-200'
          style={{ backgroundColor: colorHex }}
          title={colorHex}
        />
      )}
      <span className='text-gray-500 mr-1'>{label}:</span>
      <span className='font-semibold'>{value}</span>
    </span>
  )
}

// ===================================
// COMPONENTE: BADGE DE PAGO UNIFICADO
// ===================================

function UnifiedPaymentBadge({ 
  method, 
  paymentStatus 
}: { 
  method?: string | null
  paymentStatus?: string 
}) {
  // Determinar el método de pago
  let paymentMethod: 'mercadopago' | 'cash' = 'mercadopago'
  
  if (method === 'cash' || paymentStatus === 'cash_on_delivery') {
    paymentMethod = 'cash'
  }

  // Determinar el estado del pago
  let statusLabel = 'Pendiente'
  
  if (paymentStatus === 'paid') {
    statusLabel = 'Pagado'
  } else if (paymentStatus === 'failed') {
    statusLabel = 'Fallido'
  } else if (paymentStatus === 'refunded') {
    statusLabel = 'Reembolsado'
  } else if (paymentStatus === 'cash_on_delivery') {
    statusLabel = 'Al Recibir'
  }

  // Configuración de métodos de pago con colores específicos
  const methodConfig = {
    mercadopago: {
      label: 'MercadoPago',
      icon: Wallet,
      className: 'bg-sky-100 text-sky-700 border-sky-200',
    },
    cash: {
      label: 'Efectivo',
      icon: Banknote,
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
  }

  // Colores del estado de pago
  const statusColors: Record<string, string> = {
    paid: 'text-green-600',
    pending: 'text-yellow-600',
    failed: 'text-red-600',
    refunded: 'text-gray-600',
    cash_on_delivery: 'text-amber-600',
  }

  const config = methodConfig[paymentMethod]
  const Icon = config.icon
  const statusColor = statusColors[paymentStatus || 'pending'] || 'text-gray-500'

  return (
    <div className='flex flex-col items-start gap-1'>
      <span
        className={`inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-full border ${config.className}`}
      >
        <Icon className='w-4 h-4' />
        <span>{config.label}</span>
      </span>
      <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
    </div>
  )
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onFilterByClient,
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
      setStatusHistory([])
      let orderData: any = null
      let responsePayload: any = null
      let historyApplied = false

      // Cargar detalles de la orden
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId!)}`)
      if (response.ok) {
        const data = await response.json()
        responsePayload = data
        orderData = data.data.order
      
        // Transformar shipping_address para compatibilidad
        if (orderData?.shipping_address) {
          const addr = orderData.shipping_address
          orderData.shipping_address = {
            street: addr.street || `${addr.street_name || ''} ${addr.street_number || ''}`.trim() || undefined,
            city: addr.city || addr.city_name || undefined,
            state: addr.state || addr.state_name || undefined,
            zip_code: addr.zip_code || undefined,
            country: addr.country || undefined,
            apartment: addr.apartment || undefined,
            observations: addr.observations || undefined,
          }
        }

        setOrder(orderData)

        if (
          Array.isArray(responsePayload?.data?.statusHistory) &&
          responsePayload.data.statusHistory.length > 0
        ) {
          setStatusHistory(responsePayload.data.statusHistory)
          historyApplied = true
        }
      } else {
        toast.error('Error al cargar detalles de la orden')
        return
      }

      if (!historyApplied && orderData) {
        try {
          const historyResponse = await fetch(
            `/api/admin/orders/${encodeURIComponent(orderId!)}/history`
          )
          if (historyResponse.ok) {
            const historyData = await historyResponse.json()
            if (historyData.success && historyData.data) {
              setStatusHistory(historyData.data)
              historyApplied = true
            }
          }
        } catch (historyError) {
          console.error('Error loading order history:', historyError)
        }
      }

      if (orderData && !historyApplied) {
        const fallbackHistory: StatusHistoryItem[] = [
          {
            id: '1',
            status: orderData.status || 'pending',
            timestamp: orderData.created_at || new Date().toISOString(),
            note: 'Orden creada',
            user: 'Sistema',
          },
        ]
        setStatusHistory(fallbackHistory)
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

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3'>
            <Package className='h-6 w-6' />
            <div className='flex items-center gap-3'>
              <span>Orden {order?.order_number || `#${order?.id || orderId}`}</span>
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
                        <span className='text-gray-600'>Nº de Orden:</span>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>#{order.order_number || order.id}</span>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => copyToClipboard(order.order_number || order.id.toString(), 'Número de orden')}
                          >
                            <Copy className='h-3 w-3' />
                          </Button>
                        </div>
                      </div>

                      {order.payment_id && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Referencia MP:</span>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium font-mono text-sm'>{order.payment_id}</span>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() =>
                                copyToClipboard(order.payment_id!, 'Referencia MercadoPago')
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
                        {order.order_items?.map(item => {
                          const productName = item.product_snapshot?.name || item.products?.name || 'Producto'
                          const productImage = item.product_snapshot?.image || resolveImageSource(item.products?.images)
                          const unitPrice = item.product_snapshot?.price || item.price || item.unit_price || 0
                          const hasAttributes = item.product_snapshot?.color || item.product_snapshot?.medida || item.product_snapshot?.finish
                          
                          return (
                            <div
                              key={item.id}
                              className='flex gap-3 p-3 bg-gray-50 rounded-lg'
                            >
                              {/* Imagen */}
                              <div className='relative w-14 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0'>
                                {productImage ? (
                                  <Image
                                    src={productImage}
                                    alt={productName}
                                    width={56}
                                    height={56}
                                    className='w-full h-full object-cover'
                                    unoptimized
                                  />
                                ) : (
                                  <div className='w-full h-full flex items-center justify-center'>
                                    <Package className='w-6 h-6 text-gray-400' />
                                  </div>
                                )}
                              </div>
                              
                              {/* Info */}
                              <div className='flex-1 min-w-0'>
                                <h4 className='font-medium text-sm truncate'>{productName}</h4>
                                
                                {/* Atributos como pills */}
                                {hasAttributes && (
                                  <div className='flex flex-wrap gap-1 mt-1'>
                                    {item.product_snapshot?.color && (
                                      <ProductAttributePill 
                                        label="Color" 
                                        value={item.product_snapshot.color} 
                                        colorHex={item.product_snapshot.color_hex}
                                      />
                                    )}
                                    {item.product_snapshot?.medida && (
                                      <ProductAttributePill label="Medida" value={item.product_snapshot.medida} />
                                    )}
                                    {item.product_snapshot?.finish && (
                                      <ProductAttributePill label="Terminación" value={item.product_snapshot.finish} />
                                    )}
                                  </div>
                                )}
                                
                                <p className='text-xs text-gray-600 mt-1'>
                                  {item.quantity}x {formatCurrency(unitPrice)}
                                </p>
                              </div>
                              
                              {/* Total */}
                              <div className='text-right flex-shrink-0'>
                                <p className='font-semibold text-gray-900'>
                                  {formatCurrency(item.total_price || item.quantity * unitPrice)}
                                </p>
                              </div>
                            </div>
                          )
                        }) || (
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
                          {order.shipping_address.apartment && (
                            <p className='text-gray-700'>
                              <span className='bg-gray-100 px-2 py-0.5 rounded text-xs'>
                                Piso/Depto: {order.shipping_address.apartment}
                              </span>
                            </p>
                          )}
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
                        
                        {/* Observaciones */}
                        {order.shipping_address.observations && (
                          <div className='mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg'>
                            <p className='text-xs font-medium text-yellow-800 mb-1'>Indicaciones:</p>
                            <p className='text-sm text-yellow-700'>{order.shipping_address.observations}</p>
                          </div>
                        )}
                        
                        {/* Botón Google Maps */}
                        <Button
                          variant='outline'
                          size='sm'
                          className='mt-3 w-full'
                          onClick={() => window.open(generateGoogleMapsUrl(order.shipping_address), '_blank')}
                        >
                          <MapPin className='h-4 w-4 mr-2 text-blue-600' />
                          Ver en Google Maps
                        </Button>
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
                          {/* Nombre completo */}
                          {(order.payer_info.name || order.payer_info.surname) && (
                            <div className='flex items-center gap-3'>
                              <User className='h-4 w-4 text-gray-400' />
                              <div>
                                <p className='text-sm text-gray-600'>Nombre Completo</p>
                                <p className='font-medium'>
                                  {`${order.payer_info.name || ''} ${order.payer_info.surname || ''}`.trim() || 'No especificado'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Teléfono con WhatsApp */}
                          {order.payer_info.phone && (
                            <div className='flex items-center gap-3'>
                              <Phone className='h-4 w-4 text-gray-400' />
                              <div className='flex-1'>
                                <p className='text-sm text-gray-600'>Teléfono</p>
                                <div className='flex items-center gap-2'>
                                  <p className='font-medium'>{order.payer_info.phone}</p>
                                  <WhatsAppQuickActions
                                    phone={order.payer_info.phone}
                                    orderNumber={order.order_number || order.id.toString()}
                                    clientName={`${order.payer_info.name || ''} ${order.payer_info.surname || ''}`.trim()}
                                    total={order.total}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Identificación */}
                          {order.payer_info.identification?.number && (
                            <div className='flex items-center gap-3'>
                              <FileText className='h-4 w-4 text-gray-400' />
                              <div>
                                <p className='text-sm text-gray-600'>Identificación</p>
                                <p className='font-medium'>
                                  {order.payer_info.identification.type}: {order.payer_info.identification.number}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className='space-y-3'>
                          <h4 className='font-medium'>Acciones del Cliente</h4>
                          <div className='space-y-2'>
                            {order.payer_info.phone && (
                              <Button 
                                variant='outline' 
                                size='sm' 
                                className='w-full justify-start'
                                onClick={() => {
                                  if (onFilterByClient && order.payer_info?.phone) {
                                    onFilterByClient(order.payer_info.phone)
                                    onClose()
                                    toast.success('Filtrando órdenes de este cliente')
                                  } else {
                                    toast.info('Funcionalidad en desarrollo')
                                  }
                                }}
                              >
                                <ExternalLink className='h-4 w-4 mr-2' />
                                Ver Historial de Órdenes
                              </Button>
                            )}
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
                      <div className='space-y-4'>
                        {/* Badge unificado de método y estado */}
                        <div>
                          <span className='text-sm text-gray-600 block mb-2'>Método de Pago:</span>
                          <UnifiedPaymentBadge 
                            method={order.payment_method} 
                            paymentStatus={order.payment_status} 
                          />
                        </div>

                        <Separator />

                        {/* Total con color condicional */}
                        <div className='flex justify-between text-lg'>
                          <span className='font-semibold'>
                            {order.payment_status === 'paid' ? 'Total Pagado:' : 'Total Adeudado:'}
                          </span>
                          <span className={`font-bold ${order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                            {formatCurrency(order.total)}
                          </span>
                        </div>

                        {/* Referencia de pago MP si existe */}
                        {order.payment_id && (
                          <div className='flex justify-between text-sm'>
                            <span className='text-gray-600'>ID Transacción:</span>
                            <span className='font-mono text-xs bg-gray-100 px-2 py-1 rounded'>{order.payment_id}</span>
                          </div>
                        )}
                      </div>

                      <div className='space-y-3'>
                        <h4 className='font-medium'>Acciones de Pago</h4>
                        <div className='space-y-2'>
                          {(order.payment_status === 'pending' || order.payment_status === 'cash_on_delivery') && (
                            <>
                              {order.payment_method === 'mercadopago' && (
                                <Button
                                  variant='default'
                                  size='sm'
                                  className='w-full justify-start'
                                  onClick={() => handleCreatePaymentLink()}
                                >
                                  <CreditCard className='h-4 w-4 mr-2' />
                                  Crear Link de Pago
                                </Button>
                              )}
                              <Button
                                variant='outline'
                                size='sm'
                                className='w-full justify-start bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                onClick={() => handleMarkAsPaid()}
                              >
                                <CheckCircle className='h-4 w-4 mr-2' />
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
                          {order.payment_id && (
                            <Button 
                              variant='outline' 
                              size='sm' 
                              className='w-full justify-start'
                              onClick={() => setIsPaymentProofModalOpen(true)}
                            >
                              <FileText className='h-4 w-4 mr-2' />
                              Ver Comprobante MP
                            </Button>
                          )}
                        </div>

                        {/* Zona de subida de comprobante */}
                        <div className='mt-4 pt-4 border-t'>
                          <h5 className='text-sm font-medium text-gray-700 mb-2'>Subir Comprobante</h5>
                          <div 
                            className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer'
                            onClick={() => toast.info('Funcionalidad de subida de comprobantes en desarrollo')}
                          >
                            <Upload className='h-6 w-6 mx-auto text-gray-400 mb-2' />
                            <p className='text-sm text-gray-500'>
                              Arrastra un archivo o haz clic para subir
                            </p>
                            <p className='text-xs text-gray-400 mt-1'>
                              PDF, PNG, JPG (máx. 5MB)
                            </p>
                          </div>
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
