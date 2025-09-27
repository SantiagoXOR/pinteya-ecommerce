// ===================================
// PINTEYA E-COMMERCE - STRICT API TYPES
// Tipos TypeScript estrictos para prevenir errores de API
// ===================================

import { OrderEnterprise, OrderStatus, PaymentStatus, FulfillmentStatus } from './orders-enterprise'

// ===================================
// TIPOS BASE ESTRICTOS
// ===================================

/**
 * Tipo base para respuestas de API con validación estricta
 */
export interface StrictApiResponse<T> {
  readonly success: true
  readonly data: T
  readonly message?: string
  readonly timestamp: string
}

export interface StrictApiError {
  readonly success: false
  readonly error: string
  readonly code?: string
  readonly details?: Record<string, unknown>
  readonly timestamp: string
  readonly path: string
}

/**
 * Union type para respuestas de API que garantiza type safety
 */
export type ApiResult<T> = StrictApiResponse<T> | StrictApiError

// ===================================
// TIPOS DE PAGINACIÓN ESTRICTOS
// ===================================

/**
 * Paginación con validación estricta de tipos
 */
export interface StrictPagination {
  readonly page: number & { __brand: 'PositiveInteger' }
  readonly limit: number & { __brand: 'PositiveInteger' }
  readonly total: number & { __brand: 'NonNegativeInteger' }
  readonly totalPages: number & { __brand: 'NonNegativeInteger' }
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
}

/**
 * Respuesta paginada con tipos estrictos
 */
export interface StrictPaginatedResponse<T> {
  readonly success: true
  readonly data: {
    readonly items: readonly T[]
    readonly pagination: StrictPagination
    readonly filters?: Record<string, unknown>
  }
  readonly message?: string
  readonly timestamp: string
}

// ===================================
// TIPOS ESPECÍFICOS PARA ÓRDENES
// ===================================

/**
 * Orden con validación estricta de campos requeridos
 */
export interface StrictOrderEnterprise {
  readonly id: string | number // Flexible para string o number
  readonly order_number?: string & { __brand: 'OrderNumber' } // Opcional
  readonly user_id?: string | number // Opcional y flexible
  readonly status: OrderStatus
  readonly payment_status?: PaymentStatus // Opcional
  readonly fulfillment_status?: FulfillmentStatus // Opcional
  readonly total: number & { __brand: 'PositiveAmount' }
  readonly currency?: string & { __brand: 'CurrencyCode' } // Opcional
  readonly created_at: string & { __brand: 'ISODateString' }
  readonly updated_at?: string & { __brand: 'ISODateString' } // Opcional

  // Campos opcionales con tipos estrictos
  readonly shipping_address?: StrictAddress
  readonly billing_address?: StrictAddress
  readonly notes?: string & { __brand: 'NonEmptyString' }
  readonly admin_notes?: string & { __brand: 'NonEmptyString' }
  readonly tracking_number?: string & { __brand: 'TrackingNumber' }
  readonly carrier?: string & { __brand: 'CarrierName' }
  readonly estimated_delivery?: string & { __brand: 'ISODateString' }
  readonly metadata: Record<string, unknown>

  // Relaciones con tipos estrictos
  readonly user_profiles?: StrictUserProfile | null
  readonly order_items?: readonly StrictOrderItem[]
  readonly status_history?: readonly StrictOrderStatusHistory[]
  readonly order_notes?: readonly StrictOrderNote[]
}

/**
 * Perfil de usuario con validación estricta
 */
export interface StrictUserProfile {
  readonly id: string & { __brand: 'UserId' }
  readonly name: string & { __brand: 'NonEmptyString' }
  readonly email: string & { __brand: 'EmailAddress' }
  readonly phone?: string & { __brand: 'PhoneNumber' }
  readonly avatar_url?: string & { __brand: 'URL' }
}

/**
 * Item de orden con validación estricta
 */
export interface StrictOrderItem {
  readonly id: string & { __brand: 'OrderItemId' }
  readonly order_id: string & { __brand: 'OrderId' }
  readonly product_id: number & { __brand: 'ProductId' }
  readonly quantity: number & { __brand: 'PositiveInteger' }
  readonly unit_price: number & { __brand: 'PositiveAmount' }
  readonly total_price: number & { __brand: 'PositiveAmount' }
  readonly product_name: string & { __brand: 'NonEmptyString' }
  readonly product_sku?: string & { __brand: 'SKU' }
}

/**
 * Dirección con validación estricta
 */
export interface StrictAddress {
  readonly street: string & { __brand: 'NonEmptyString' }
  readonly city: string & { __brand: 'NonEmptyString' }
  readonly state: string & { __brand: 'NonEmptyString' }
  readonly postal_code: string & { __brand: 'PostalCode' }
  readonly country: string & { __brand: 'CountryCode' }
  readonly phone?: string & { __brand: 'PhoneNumber' }
}

/**
 * Historial de estado con validación estricta
 */
export interface StrictOrderStatusHistory {
  readonly id: string & { __brand: 'StatusHistoryId' }
  readonly order_id: string & { __brand: 'OrderId' }
  readonly from_status: OrderStatus | null
  readonly to_status: OrderStatus
  readonly reason?: string & { __brand: 'NonEmptyString' }
  readonly admin_id?: string & { __brand: 'AdminId' }
  readonly created_at: string & { __brand: 'ISODateString' }
}

/**
 * Nota de orden con validación estricta
 */
export interface StrictOrderNote {
  readonly id: string & { __brand: 'OrderNoteId' }
  readonly order_id: string & { __brand: 'OrderId' }
  readonly content: string & { __brand: 'NonEmptyString' }
  readonly is_admin_note: boolean
  readonly admin_id?: string & { __brand: 'AdminId' }
  readonly created_at: string & { __brand: 'ISODateString' }
}

// ===================================
// RESPUESTAS ESPECÍFICAS DE API
// ===================================

/**
 * Respuesta de lista de órdenes con tipos estrictos
 */
export interface StrictOrdersListResponse {
  readonly success: true
  readonly data: {
    readonly orders: readonly StrictOrderEnterprise[]
    readonly pagination: StrictPagination
    readonly filters: {
      readonly search?: string
      readonly status?: OrderStatus
      readonly payment_status?: PaymentStatus
      readonly fulfillment_status?: FulfillmentStatus
      readonly date_from?: string & { __brand: 'ISODateString' }
      readonly date_to?: string & { __brand: 'ISODateString' }
    }
    readonly analytics?: {
      readonly total_orders: number & { __brand: 'NonNegativeInteger' }
      readonly total_revenue: number & { __brand: 'NonNegativeAmount' }
      readonly pending_orders: number & { __brand: 'NonNegativeInteger' }
      readonly completed_orders: number & { __brand: 'NonNegativeInteger' }
      readonly today_revenue: number & { __brand: 'NonNegativeAmount' }
    }
  }
  readonly message?: string
  readonly timestamp: string
}

/**
 * Respuesta de orden individual con tipos estrictos
 */
export interface StrictOrderDetailResponse {
  readonly success: true
  readonly data: {
    readonly order: StrictOrderEnterprise
    readonly timeline?: readonly StrictOrderStatusHistory[]
    readonly related_orders?: readonly Pick<
      StrictOrderEnterprise,
      'id' | 'order_number' | 'status' | 'total'
    >[]
  }
  readonly message?: string
  readonly timestamp: string
}

// ===================================
// TIPOS GENÉRICOS PARA VALIDACIÓN
// ===================================

/**
 * Tipo genérico para objetos que pueden ser validados
 */
type ValidatableObject = Record<string, any> | null

/**
 * Tipo genérico para respuestas de API no tipadas
 */
type UntypedApiResponse = Record<string, any> | null

// ===================================
// VALIDADORES DE TIPOS
// ===================================

/**
 * Validador para verificar si un objeto es una respuesta de API válida
 */
export function isStrictApiResponse<T>(obj: ValidatableObject): obj is StrictApiResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    obj.success === true &&
    'data' in obj &&
    'timestamp' in obj &&
    typeof obj.timestamp === 'string'
  )
}

/**
 * Validador para verificar si un objeto es un error de API válido
 */
export function isStrictApiError(obj: ValidatableObject): obj is StrictApiError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    obj.success === false &&
    'error' in obj &&
    typeof obj.error === 'string' &&
    'timestamp' in obj &&
    typeof obj.timestamp === 'string'
  )
}

/**
 * Validador para verificar si una paginación es válida
 */
export function isValidPagination(obj: ValidatableObject): obj is StrictPagination {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  return (
    typeof obj.page === 'number' &&
    typeof obj.limit === 'number' &&
    typeof obj.total === 'number' &&
    typeof obj.totalPages === 'number' &&
    typeof obj.hasNextPage === 'boolean' &&
    typeof obj.hasPreviousPage === 'boolean' &&
    obj.page > 0 &&
    obj.limit > 0 &&
    obj.total >= 0 &&
    obj.totalPages >= 0
  )
}

/**
 * Validador para verificar si una orden es válida (versión más flexible)
 */
export function isValidStrictOrder(obj: ValidatableObject): obj is StrictOrderEnterprise {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  // Validaciones mínimas - solo campos absolutamente esenciales
  const hasId = obj.id && (typeof obj.id === 'string' || typeof obj.id === 'number')
  const hasTotal = typeof obj.total === 'number' && obj.total >= 0
  const hasCreatedAt = obj.created_at && typeof obj.created_at === 'string'
  const hasStatus = obj.status && typeof obj.status === 'string'

  // Solo requerir los campos absolutamente esenciales
  return hasId && hasTotal && hasCreatedAt && hasStatus
}

// ===================================
// UTILIDADES DE TRANSFORMACIÓN
// ===================================

/**
 * Transforma una respuesta de API no tipada a una respuesta estricta
 */
export function toStrictOrdersResponse(
  obj: UntypedApiResponse
): StrictOrdersListResponse | StrictApiError {
  try {
    if (!isStrictApiResponse(obj)) {
      return {
        success: false,
        error: 'Invalid API response format',
        code: 'INVALID_RESPONSE_FORMAT',
        timestamp: new Date().toISOString(),
        path: '/api/admin/orders',
      }
    }

    const response = obj as any

    // Validar estructura de datos
    if (!response.data || typeof response.data !== 'object') {
      return {
        success: false,
        error: 'Missing or invalid data field',
        code: 'INVALID_DATA_FIELD',
        timestamp: new Date().toISOString(),
        path: '/api/admin/orders',
      }
    }

    // Validar órdenes
    const orders = response.data.orders || []
    if (!Array.isArray(orders)) {
      return {
        success: false,
        error: 'Orders field must be an array',
        code: 'INVALID_ORDERS_FIELD',
        timestamp: new Date().toISOString(),
        path: '/api/admin/orders',
      }
    }

    // Validar paginación
    const pagination = response.data.pagination
    if (pagination && !isValidPagination(pagination)) {
      return {
        success: false,
        error: 'Invalid pagination format',
        code: 'INVALID_PAGINATION',
        timestamp: new Date().toISOString(),
        path: '/api/admin/orders',
      }
    }

    // Transformar órdenes para asegurar compatibilidad

    // Transformar órdenes para normalizar tipos
    const transformedOrders = orders.map((order: any) => ({
      ...order,
      id: String(order.id), // Convertir ID a string para compatibilidad frontend
      user_id: order.user_id ? String(order.user_id) : order.user_id,
      total: Number(order.total) || 0,
      created_at: order.created_at || new Date().toISOString(),
      status: order.status || 'pending',
      metadata: order.metadata || {},
    }))

    const validOrders = transformedOrders.filter(isValidStrictOrder)

    // Crear respuesta estricta con valores por defecto seguros
    return {
      success: true,
      data: {
        orders: validOrders,
        pagination: pagination || {
          page: 1 as any,
          limit: 20 as any,
          total: orders.length as any,
          totalPages: Math.ceil(orders.length / 20) as any,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        filters: response.data.filters || {},
        analytics: response.data.analytics,
      },
      message: response.message,
      timestamp: response.timestamp || new Date().toISOString(),
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse API response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      code: 'PARSE_ERROR',
      timestamp: new Date().toISOString(),
      path: '/api/admin/orders',
    }
  }
}

/**
 * Crea una respuesta de error estricta
 */
export function createStrictApiError(
  error: string,
  code?: string,
  details?: Record<string, unknown>,
  path?: string
): StrictApiError {
  return {
    success: false,
    error,
    code,
    details,
    timestamp: new Date().toISOString(),
    path: path || '/api/unknown',
  }
}

/**
 * Crea una respuesta exitosa estricta
 */
export function createStrictApiResponse<T>(data: T, message?: string): StrictApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }
}

// ===================================
// TIPOS DE UTILIDAD
// ===================================

/**
 * Extrae el tipo de datos de una respuesta de API
 */
export type ExtractApiData<T> = T extends StrictApiResponse<infer U> ? U : never

/**
 * Hace que todos los campos de un tipo sean de solo lectura recursivamente
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * Tipo para funciones que manejan respuestas de API
 */
export type ApiHandler<T, R = void> = (response: ApiResult<T>) => R | Promise<R>

/**
 * Tipo para opciones de configuración de API
 */
export interface StrictApiOptions {
  readonly timeout?: number
  readonly retries?: number
  readonly validateResponse?: boolean
  readonly throwOnError?: boolean
}
