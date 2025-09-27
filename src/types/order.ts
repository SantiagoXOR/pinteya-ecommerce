// ===================================
// PINTEYA E-COMMERCE - ORDER TYPES
// ===================================

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  sku?: string
  category?: string
  stock?: number
}

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName?: string
}

export interface ShippingAddress {
  streetAddress: string
  apartment?: string
  city: string
  state: string
  zipCode: string
  country: string
  observations?: string
}

export interface OrderTotals {
  subtotal: number
  shipping: number
  discount: number
  tax?: number
  total: number
}

export type OrderStatus =
  | 'pending' // Pendiente de confirmación
  | 'confirmed' // Confirmada, esperando procesamiento
  | 'processing' // En procesamiento
  | 'shipped' // Enviada
  | 'delivered' // Entregada
  | 'cancelled' // Cancelada
  | 'refunded' // Reembolsada

export type PaymentStatus =
  | 'pending' // Pendiente de pago
  | 'paid' // Pagada
  | 'failed' // Falló el pago
  | 'refunded' // Reembolsada
  | 'awaiting_transfer' // Esperando transferencia
  | 'cash_on_delivery' // Pago contra entrega

export type PaymentMethod = 'mercadopago' | 'bank' | 'cash' | 'credit_card' | 'debit_card'

export type ShippingMethod =
  | 'free' // Envío gratis (estándar)
  | 'express' // Envío express
  | 'pickup' // Retiro en local

export interface Order {
  id: string
  status: OrderStatus
  createdAt: string
  updatedAt: string

  // Información del cliente
  customerInfo: CustomerInfo

  // Dirección de envío
  shippingAddress: ShippingAddress

  // Productos
  items: OrderItem[]

  // Métodos y pagos
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  shippingMethod: ShippingMethod

  // Totales
  totals: OrderTotals

  // Información adicional
  trackingNumber?: string
  estimatedDelivery?: string
  actualDelivery?: string
  orderNotes?: string

  // URLs de pago (para MercadoPago, etc.)
  paymentUrl?: string

  // Historial de cambios
  statusHistory?: OrderStatusChange[]
}

export interface OrderStatusChange {
  status: OrderStatus
  timestamp: string
  note?: string
  updatedBy?: string
}

// Datos para crear una nueva orden
export interface CreateOrderData {
  customerInfo: CustomerInfo
  shippingAddress: ShippingAddress
  items: OrderItem[]
  paymentMethod: PaymentMethod
  shippingMethod: ShippingMethod
  totals: OrderTotals
  orderNotes?: string
}

// Datos para actualizar una orden
export interface UpdateOrderData {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  trackingNumber?: string
  estimatedDelivery?: string
  actualDelivery?: string
  orderNotes?: string
}

// Filtros para consultar órdenes
export interface OrderFilters {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod
  shippingMethod?: ShippingMethod
  dateFrom?: string
  dateTo?: string
  search?: string
  customerId?: string
}

// Parámetros de paginación
export interface OrderPagination {
  page: number
  limit: number
  sortBy?: 'createdAt' | 'total' | 'status' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

// Respuesta de la API de órdenes
export interface OrdersResponse {
  success: boolean
  data: {
    orders: Order[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    stats: OrderStats
    filters: OrderFilters
  }
  message: string
}

// Estadísticas de órdenes
export interface OrderStats {
  total: number
  pending: number
  confirmed: number
  processing?: number
  shipped: number
  delivered: number
  cancelled: number
  refunded?: number
  totalRevenue: number
  averageOrderValue: number
}

// Respuesta de validación de checkout
export interface CheckoutValidationResponse {
  success: boolean
  data: {
    validation: {
      isValid: boolean
      errors: string[]
      warnings: string[]
      suggestions: string[]
    }
    estimatedDelivery: string
    recommendedActions: string[]
  }
  message: string
}

// Respuesta de creación de orden
export interface CreateOrderResponse {
  success: boolean
  data: {
    order: Order
  }
  message: string
}

// Datos para el tracking de la orden
export interface OrderTracking {
  orderId: string
  trackingNumber: string
  status: OrderStatus
  estimatedDelivery: string
  actualDelivery?: string
  trackingEvents: TrackingEvent[]
}

export interface TrackingEvent {
  timestamp: string
  status: string
  description: string
  location?: string
}

// Utilidades de tipo
export type OrderSummary = Pick<Order, 'id' | 'status' | 'createdAt' | 'totals' | 'customerInfo'>

export type OrderDetails = Order & {
  trackingInfo?: OrderTracking
}

// Constantes útiles
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  processing: 'Procesando',
  shipped: 'Enviada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  failed: 'Falló',
  refunded: 'Reembolsada',
  awaiting_transfer: 'Esperando transferencia',
  cash_on_delivery: 'Pago contra entrega',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mercadopago: 'MercadoPago',
  bank: 'Transferencia bancaria',
  cash: 'Efectivo',
  credit_card: 'Tarjeta de crédito',
  debit_card: 'Tarjeta de débito',
}

export const SHIPPING_METHOD_LABELS: Record<ShippingMethod, string> = {
  free: 'Envío estándar',
  express: 'Envío express',
  pickup: 'Retiro en local',
}

// Funciones de utilidad
export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    confirmed: 'text-blue-600 bg-blue-100',
    processing: 'text-purple-600 bg-purple-100',
    shipped: 'text-indigo-600 bg-indigo-100',
    delivered: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100',
    refunded: 'text-gray-600 bg-gray-100',
  }
  return colors[status] || 'text-gray-600 bg-gray-100'
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    paid: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
    refunded: 'text-gray-600 bg-gray-100',
    awaiting_transfer: 'text-blue-600 bg-blue-100',
    cash_on_delivery: 'text-orange-600 bg-orange-100',
  }
  return colors[status] || 'text-gray-600 bg-gray-100'
}

export function formatOrderId(orderId: string): string {
  return orderId.replace('ORD-', '#')
}

export function calculateOrderTotal(
  items: OrderItem[],
  shipping: number,
  discount: number = 0
): OrderTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + shipping - discount

  return {
    subtotal,
    shipping,
    discount,
    total,
  }
}
