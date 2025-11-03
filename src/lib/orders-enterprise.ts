// ===================================
// PINTEYA E-COMMERCE - ORDERS ENTERPRISE UTILITIES
// ===================================

import {
  OrderStatus,
  PaymentStatus,
  ORDER_STATE_TRANSITIONS,
  ORDER_STATUS_DESCRIPTIONS,
  StateTransitionValidation,
  OrderEnterprise,
  OrderStatusHistory,
  OrderNote,
} from '@/types/orders-enterprise'

// ===================================
// VALIDACIONES DE ESTADO DE ORDEN
// ===================================

/**
 * Valida si una transición de estado es permitida
 */
export function validateStateTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): StateTransitionValidation {
  if (currentStatus === newStatus) {
    return {
      valid: false,
      message: 'El estado ya es el mismo',
      allowedTransitions: ORDER_STATE_TRANSITIONS[currentStatus] || [],
    }
  }

  const allowedTransitions = ORDER_STATE_TRANSITIONS[currentStatus]
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      message: `Transición no permitida: ${ORDER_STATUS_DESCRIPTIONS[currentStatus]} → ${ORDER_STATUS_DESCRIPTIONS[newStatus]}`,
      allowedTransitions: allowedTransitions || [],
    }
  }

  return {
    valid: true,
    allowedTransitions: allowedTransitions || [],
  }
}

/**
 * Obtiene las transiciones disponibles para un estado
 */
export function getAvailableTransitions(currentStatus: OrderStatus): {
  status: OrderStatus
  description: string
  requiresReason: boolean
}[] {
  const transitions = ORDER_STATE_TRANSITIONS[currentStatus] || []

  return transitions.map(status => ({
    status,
    description: ORDER_STATUS_DESCRIPTIONS[status],
    requiresReason: ['cancelled', 'refunded', 'returned'].includes(status),
  }))
}

/**
 * Verifica si un estado requiere información adicional
 */
export function statusRequiresAdditionalInfo(status: OrderStatus): {
  requiresTracking: boolean
  requiresCarrier: boolean
  requiresReason: boolean
  requiresEstimatedDelivery: boolean
} {
  return {
    requiresTracking: ['shipped'].includes(status),
    requiresCarrier: ['shipped'].includes(status),
    requiresReason: ['cancelled', 'refunded', 'returned'].includes(status),
    requiresEstimatedDelivery: ['shipped'].includes(status),
  }
}

// ===================================
// FORMATEO Y DISPLAY
// ===================================

/**
 * Formatea el estado de una orden para mostrar al usuario
 */
export function formatOrderStatus(status: OrderStatus): {
  label: string
  color: string
  description: string
  icon: string
} {
  const statusMap: Record<
    OrderStatus,
    { label: string; color: string; description: string; icon: string }
  > = {
    pending: {
      label: 'Pendiente',
      color: 'yellow',
      description: 'Esperando confirmación',
      icon: 'clock',
    },
    confirmed: {
      label: 'Confirmada',
      color: 'blue',
      description: 'Confirmada, preparando pedido',
      icon: 'check-circle',
    },
    processing: {
      label: 'Procesando',
      color: 'orange',
      description: 'En proceso de preparación',
      icon: 'cog',
    },
    shipped: {
      label: 'Enviada',
      color: 'purple',
      description: 'Producto en camino',
      icon: 'truck',
    },
    delivered: {
      label: 'Entregada',
      color: 'green',
      description: 'Producto entregado exitosamente',
      icon: 'check',
    },
    cancelled: {
      label: 'Cancelada',
      color: 'red',
      description: 'Orden cancelada',
      icon: 'x-circle',
    },
    refunded: {
      label: 'Reembolsada',
      color: 'gray',
      description: 'Dinero reembolsado',
      icon: 'arrow-left',
    },
    returned: {
      label: 'Devuelta',
      color: 'amber',
      description: 'Producto devuelto',
      icon: 'arrow-up',
    },
  }

  return statusMap[status] || statusMap.pending
}

/**
 * Formatea el estado de pago
 */
export function formatPaymentStatus(status: PaymentStatus): {
  label: string
  color: string
  description: string
} {
  const statusMap: Record<PaymentStatus, { label: string; color: string; description: string }> = {
    pending: {
      label: 'Pendiente',
      color: 'yellow',
      description: 'Esperando pago',
    },
    paid: {
      label: 'Pagado',
      color: 'green',
      description: 'Pago confirmado',
    },
    failed: {
      label: 'Falló',
      color: 'red',
      description: 'Error en el pago',
    },
    refunded: {
      label: 'Reembolsado',
      color: 'gray',
      description: 'Dinero devuelto',
    },
    awaiting_transfer: {
      label: 'Esperando Transferencia',
      color: 'blue',
      description: 'Esperando transferencia bancaria',
    },
    cash_on_delivery: {
      label: 'Pago al recibir',
      color: 'purple',
      description: 'Pago contra entrega',
    },
  }

  return statusMap[status] || statusMap.pending
}

// ===================================
// CÁLCULOS Y MÉTRICAS
// ===================================

/**
 * Calcula el tiempo promedio entre estados
 */
export function calculateAverageStateTime(
  statusHistory: OrderStatusHistory[]
): Record<string, number> {
  const stateTimes: Record<string, number[]> = {}

  for (let i = 0; i < statusHistory.length - 1; i++) {
    const current = statusHistory[i]
    const next = statusHistory[i + 1]

    // Validar que current y next existan antes de acceder a sus propiedades
    if (!current || !next) continue

    const timeInState = new Date(next.created_at).getTime() - new Date(current.created_at).getTime()
    const stateKey = `${current.new_status}_to_${next.new_status}`

    if (!stateTimes[stateKey]) {
      stateTimes[stateKey] = []
    }
    stateTimes[stateKey]!.push(timeInState)
  }

  const averages: Record<string, number> = {}
  for (const [key, times] of Object.entries(stateTimes)) {
    averages[key] = times.reduce((sum, time) => sum + time, 0) / times.length
  }

  return averages
}

/**
 * Calcula métricas de una orden
 */
export function calculateOrderMetrics(order: OrderEnterprise): {
  totalItems: number
  averageItemPrice: number
  processingTime?: number
  deliveryTime?: number
} {
  const totalItems = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  const averageItemPrice = totalItems > 0 ? order.total / totalItems : 0

  const result: {
    totalItems: number
    averageItemPrice: number
    processingTime?: number
    deliveryTime?: number
  } = {
    totalItems,
    averageItemPrice,
  }

  if (order.status_history && order.status_history.length > 0) {
    const confirmedTime = order.status_history.find(h => h.new_status === 'confirmed')?.created_at
    const shippedTime = order.status_history.find(h => h.new_status === 'shipped')?.created_at
    const deliveredTime = order.status_history.find(h => h.new_status === 'delivered')?.created_at

    if (confirmedTime && shippedTime) {
      result.processingTime = new Date(shippedTime).getTime() - new Date(confirmedTime).getTime()
    }

    if (shippedTime && deliveredTime) {
      result.deliveryTime = new Date(deliveredTime).getTime() - new Date(shippedTime).getTime()
    }
  }

  return result
}

// ===================================
// FILTROS Y BÚSQUEDA
// ===================================

/**
 * Filtra órdenes por criterios múltiples
 */
export function filterOrders(
  orders: OrderEnterprise[],
  filters: {
    status?: OrderStatus
    paymentStatus?: PaymentStatus
    dateFrom?: string
    dateTo?: string
    search?: string
    minAmount?: number
    maxAmount?: number
  }
): OrderEnterprise[] {
  return orders.filter(order => {
    // Filtro por estado
    if (filters.status && order.status !== filters.status) {
      return false
    }

    // Filtro por estado de pago
    if (filters.paymentStatus && order.payment_status !== filters.paymentStatus) {
      return false
    }

    // Filtro por fecha desde
    if (filters.dateFrom && new Date(order.created_at) < new Date(filters.dateFrom)) {
      return false
    }

    // Filtro por fecha hasta
    if (filters.dateTo && new Date(order.created_at) > new Date(filters.dateTo)) {
      return false
    }

    // Filtro por monto mínimo
    if (filters.minAmount && order.total < filters.minAmount) {
      return false
    }

    // Filtro por monto máximo
    if (filters.maxAmount && order.total > filters.maxAmount) {
      return false
    }

    // Filtro por búsqueda de texto
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchableText = [
        order.order_number,
        order.user_profiles?.name,
        order.user_profiles?.email,
        order.notes,
        order.admin_notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (!searchableText.includes(searchLower)) {
        return false
      }
    }

    return true
  })
}

/**
 * Ordena órdenes por criterio específico
 */
export function sortOrders(
  orders: OrderEnterprise[],
  sortBy: 'created_at' | 'total' | 'order_number' | 'status',
  sortOrder: 'asc' | 'desc' = 'desc'
): OrderEnterprise[] {
  return [...orders].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'total':
        comparison = a.total - b.total
        break
      case 'order_number':
        comparison = a.order_number.localeCompare(b.order_number)
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })
}

// ===================================
// UTILIDADES DE NOTIFICACIÓN
// ===================================

/**
 * Genera mensaje de notificación para cambio de estado
 */
export function generateStatusChangeMessage(
  orderNumber: string,
  previousStatus: OrderStatus,
  newStatus: OrderStatus,
  trackingNumber?: string
): string {
  const statusInfo = formatOrderStatus(newStatus)

  let message = `Tu orden ${orderNumber} ha cambiado a: ${statusInfo.label}`

  if (newStatus === 'shipped' && trackingNumber) {
    message += `. Número de seguimiento: ${trackingNumber}`
  }

  return message
}

/**
 * Determina si se debe enviar notificación al cliente
 */
export function shouldNotifyCustomer(previousStatus: OrderStatus, newStatus: OrderStatus): boolean {
  // Notificar en cambios importantes para el cliente
  const notifiableTransitions = ['confirmed', 'shipped', 'delivered', 'cancelled']

  return notifiableTransitions.includes(newStatus)
}

// ===================================
// VALIDACIONES DE DATOS
// ===================================

/**
 * Valida datos de orden antes de crear/actualizar
 */
export function validateOrderData(orderData: Partial<OrderEnterprise>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (orderData.total !== undefined && orderData.total <= 0) {
    errors.push('El monto total debe ser mayor a 0')
  }

  if (orderData.order_number && !/^ORD-\d+-[A-Z0-9]+$/.test(orderData.order_number)) {
    errors.push('Formato de número de orden inválido')
  }

  if (orderData.tracking_number && orderData.tracking_number.length < 3) {
    errors.push('Número de seguimiento muy corto')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ===================================
// EXPORTACIÓN DE DATOS
// ===================================

/**
 * Convierte órdenes a formato CSV
 */
export function ordersToCSV(orders: OrderEnterprise[]): string {
  const headers = [
    'Número de Orden',
    'Cliente',
    'Email',
    'Estado',
    'Estado de Pago',
    'Total',
    'Fecha de Creación',
    'Última Actualización',
  ]

  const rows = orders.map(order => [
    order.order_number,
    order.user_profiles?.name || '',
    order.user_profiles?.email || '',
    formatOrderStatus(order.status).label,
    formatPaymentStatus(order.payment_status).label,
    order.total.toString(),
    new Date(order.created_at).toLocaleDateString(),
    new Date(order.updated_at).toLocaleDateString(),
  ])

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
}
