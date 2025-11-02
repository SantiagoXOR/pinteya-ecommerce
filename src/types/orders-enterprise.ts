// ===================================
// PINTEYA E-COMMERCE - ORDERS ENTERPRISE TYPES
// ===================================

// ===================================
// ESTADOS DE ÓRDENES
// ===================================

export type OrderStatus =
  | 'pending' // Pendiente de confirmación
  | 'confirmed' // Confirmada, preparando
  | 'processing' // En proceso de preparación
  | 'shipped' // Enviada
  | 'delivered' // Entregada
  | 'cancelled' // Cancelada
  | 'refunded' // Reembolsada
  | 'returned' // Devuelta

export type PaymentStatus =
  | 'pending' // Pendiente de pago
  | 'paid' // Pagado
  | 'failed' // Falló el pago
  | 'refunded' // Reembolsado
  | 'awaiting_transfer' // Esperando transferencia
  | 'cash_on_delivery' // Pago al recibir

export type FulfillmentStatus =
  | 'unfulfilled' // Sin procesar
  | 'partial' // Parcialmente procesado
  | 'fulfilled' // Completamente procesado

// ===================================
// TRANSICIONES DE ESTADOS
// ===================================

export interface StateTransition {
  from: OrderStatus
  to: OrderStatus
  allowed: boolean
  requiresReason: boolean
  description: string
}

export const ORDER_STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  refunded: [],
  returned: ['refunded'],
}

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'Pendiente de confirmación',
  confirmed: 'Confirmada, preparando pedido',
  processing: 'En proceso de preparación',
  shipped: 'Enviada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
  returned: 'Devuelta',
}

// ===================================
// INTERFACES PRINCIPALES
// ===================================

export interface OrderEnterprise {
  id: string
  order_number: string
  user_id: string
  status: OrderStatus
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus
  total: number
  currency: string
  shipping_address?: ShippingAddress
  billing_address?: BillingAddress
  notes?: string
  admin_notes?: string
  tracking_number?: string
  carrier?: string
  estimated_delivery?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string

  // Relaciones
  user_profiles?: UserProfile
  order_items?: OrderItemEnterprise[]
  status_history?: OrderStatusHistory[]
  order_notes?: OrderNote[]
}

export interface OrderItemEnterprise {
  id: string
  order_id: string
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
  product_snapshot?: Record<string, any>
  created_at: string

  // Relaciones
  products?: ProductBasic
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  previous_status?: OrderStatus
  new_status: OrderStatus
  changed_by?: string
  reason?: string
  metadata: Record<string, any>
  created_at: string

  // Relaciones
  user_profiles?: UserProfile
}

export interface OrderNote {
  id: string
  order_id: string
  admin_id?: string
  note_type: 'internal' | 'customer' | 'system'
  content: string
  is_visible_to_customer: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string

  // Relaciones
  user_profiles?: UserProfile
}

export interface OrderMetrics {
  id: string
  date: string
  total_orders: number
  total_revenue: number
  avg_order_value: number
  orders_by_status: Record<OrderStatus, number>
  orders_by_payment_status: Record<PaymentStatus, number>
  top_products: ProductSalesMetric[]
  created_at: string
  updated_at: string
}

// ===================================
// INTERFACES DE SOPORTE
// ===================================

export interface ShippingAddress {
  street_name: string
  street_number: string
  zip_code: string
  city_name: string
  state_name: string
  country?: string
  additional_info?: string
}

export interface BillingAddress extends ShippingAddress {
  company_name?: string
  tax_id?: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  role?: string
}

export interface ProductBasic {
  id: number
  name: string
  images?: string[]
  sku?: string
  category?: string
}

export interface ProductSalesMetric {
  product_id: number
  product_name: string
  total_quantity: number
  total_revenue: number
  avg_price: number
}

// ===================================
// FILTROS Y CONSULTAS
// ===================================

export interface OrderFilters {
  page?: number
  limit?: number
  status?: OrderStatus
  payment_status?: PaymentStatus
  date_from?: string
  date_to?: string
  search?: string
  sort_by?: 'created_at' | 'total' | 'order_number'
  sort_order?: 'asc' | 'desc'
}

export interface OrderListResponse {
  orders: OrderEnterprise[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  filters: OrderFilters
}

// ===================================
// OPERACIONES MASIVAS
// ===================================

export interface BulkStatusUpdate {
  order_ids: string[]
  status: OrderStatus
  reason: string
  notify_customers?: boolean
}

export interface BulkStatusUpdateResult {
  updated_orders: OrderEnterprise[]
  invalid_orders: {
    id: string
    order_number: string
    current_status: OrderStatus
    reason: string
  }[]
  summary: {
    total_requested: number
    successfully_updated: number
    failed_updates: number
  }
}

export interface BulkExportOptions {
  format: 'csv' | 'json'
  filters?: OrderFilters
  include_items?: boolean
}

// ===================================
// ANALYTICS Y REPORTES
// ===================================

export interface OrderAnalytics {
  summary: {
    total_orders: number
    total_revenue: number
    average_order_value: number
    revenue_growth_percentage: number
    period: {
      start_date: string
      end_date: string
      period_type: string
    }
  }
  status_distribution: Record<OrderStatus, number>
  top_products: ProductSalesMetric[]
  daily_trends: DailyTrend[]
  filters: AnalyticsFilters
}

export interface AnalyticsFilters {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  date_from?: string
  date_to?: string
  group_by: 'day' | 'week' | 'month'
  include_details?: boolean
}

export interface DailyTrend {
  date: string
  total_orders: number
  total_revenue: number
  avg_order_value: number
}

// ===================================
// FORMULARIOS Y VALIDACIONES
// ===================================

export interface CreateOrderRequest {
  user_id: string
  items: {
    product_id: number
    quantity: number
    unit_price: number
  }[]
  shipping_address?: ShippingAddress
  notes?: string
}

export interface UpdateOrderRequest {
  status?: OrderStatus
  payment_status?: PaymentStatus
  notes?: string
  tracking_number?: string
  carrier?: string
  shipping_address?: ShippingAddress
}

export interface StatusUpdateRequest {
  status: OrderStatus
  reason: string
  notify_customer?: boolean
  tracking_number?: string
  carrier?: string
  estimated_delivery?: string
}

// ===================================
// NOTIFICACIONES
// ===================================

export interface OrderNotification {
  type: 'status_change' | 'payment_update' | 'shipping_update'
  order_id: string
  order_number: string
  customer_email: string
  previous_status?: OrderStatus
  new_status: OrderStatus
  message: string
  metadata?: Record<string, any>
}

// ===================================
// HOOKS Y ESTADO
// ===================================

export interface UseOrdersState {
  orders: OrderEnterprise[]
  loading: boolean
  error: string | null
  filters: OrderFilters
  pagination: OrderListResponse['pagination']
}

export interface UseOrderDetailState {
  order: OrderEnterprise | null
  statusHistory: OrderStatusHistory[]
  notes: OrderNote[]
  loading: boolean
  error: string | null
  updating: boolean
}

export interface UseOrderAnalyticsState {
  analytics: OrderAnalytics | null
  loading: boolean
  error: string | null
  refreshing: boolean
}

// ===================================
// VALIDACIONES
// ===================================

export interface ValidationResult {
  valid: boolean
  message?: string
  details?: string[]
}

export interface StateTransitionValidation extends ValidationResult {
  allowedTransitions?: OrderStatus[]
}

// ===================================
// CONFIGURACIÓN
// ===================================

export interface OrdersConfig {
  defaultPageSize: number
  maxBulkOperations: number
  autoSaveInterval: number
  statusTransitions: Record<OrderStatus, OrderStatus[]>
  notificationSettings: {
    enableCustomerNotifications: boolean
    enableAdminNotifications: boolean
    emailTemplates: Record<string, string>
  }
}
