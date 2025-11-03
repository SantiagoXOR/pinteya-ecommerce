// =====================================================
// HOOK: useOrdersEnterprise
// Descripción: Hook personalizado para gestión enterprise de órdenes
// Conecta con APIs reales del backend
// =====================================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface OrderItem {
  id: string
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  products?: {
    id: number
    name: string
    images: string[]
  }
}

export interface Order {
  id: string
  order_number: string
  status: OrderStatus
  payment_status: PaymentStatus
  total: number
  currency: string
  created_at: string
  updated_at: string
  shipping_address?: any
  notes?: string
  payer_info?: {
    name?: string
    surname?: string
    email?: string
    phone?: string
  }
  user_profiles?: {
    id: string
    name: string
    email: string
  }
  order_items: OrderItem[]
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface OrderFilters {
  page: number
  limit: number
  status?: OrderStatus
  payment_status?: PaymentStatus
  search?: string
  date_from?: string
  date_to?: string
  sort_by?: 'created_at' | 'total' | 'status'
  sort_order?: 'asc' | 'desc'
}

export interface OrderStats {
  total_orders: number
  pending_orders: number
  completed_orders: number
  cancelled_orders: number
  total_revenue: number
  average_order_value: number
  orders_today: number
  revenue_today: number
}

export interface OrderAnalytics {
  daily_orders: Array<{ date: string; count: number; revenue: number }>
  status_distribution: Array<{ status: string; count: number; percentage: number }>
  payment_methods: Array<{ method: string; count: number; revenue: number }>
  top_products: Array<{ product_name: string; quantity_sold: number; revenue: number }>
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useOrdersEnterprise(initialFilters?: Partial<OrderFilters>) {
  const queryClient = useQueryClient()

  // Hook inicializado correctamente

  // Estado local para filtros
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 25,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialFilters,
  })

  // Filtros configurados

  // =====================================================
  // QUERIES
  // =====================================================

  // Query para lista de órdenes
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      // Procesando filtros para la consulta

      Object.entries(filters).forEach(([key, value]) => {
        // Procesando parámetro de filtro
        // FILTRAR OBJETOS: Solo agregar valores primitivos (string, number, boolean)
        if (value !== undefined && value !== null && value !== '' && typeof value !== 'object') {
          params.append(key, value.toString())
          // Parámetro agregado
        } else {
          // Parámetro filtrado
        }
      })

      // Consulta preparada

      const response = await fetch(`/api/admin/orders?${params}`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      console.log('🔍 API Response:', {
        hasData: !!data,
        hasSuccess: data.success,
        hasOrders: !!data.data?.orders,
        ordersCount: data.data?.orders?.length,
        hasPagination: !!data.data?.pagination,
        structure: Object.keys(data),
        dataKeys: data.data ? Object.keys(data.data) : []
      })
      return data
    },
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: false,
  })

  // Query para estadísticas
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['admin-orders-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/orders/stats')
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      return response.json()
    },
    staleTime: 60000, // 1 minuto
    refetchOnWindowFocus: false,
  })

  // Query para analytics (opcional - no bloquea si falla)
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ['admin-orders-analytics'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/orders/analytics')
        if (!response.ok) {
          // Si es 401 o 404, retornar datos vacíos en lugar de fallar
          if (response.status === 401 || response.status === 404) {
            console.warn('Analytics endpoint not available or unauthorized')
            return { data: null }
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        return response.json()
      } catch (error) {
        console.warn('Analytics fetch failed:', error)
        return { data: null }
      }
    },
    staleTime: 300000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: false, // No reintentar si falla
  })

  // =====================================================
  // MUTATIONS
  // =====================================================

  // Mutation para actualizar estado de orden
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      notes,
    }: {
      orderId: string
      status: OrderStatus
      notes?: string
    }) => {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH', // Cambio de PUT a PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders-stats'] })
    },
  })

  // Mutation para operaciones masivas
  const bulkOperationMutation = useMutation({
    mutationFn: async ({
      orderIds,
      operation,
      data,
    }: {
      orderIds: string[]
      operation: 'update_status' | 'cancel' | 'refund'
      data?: any
    }) => {
      const response = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: orderIds, operation, data }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders-stats'] })
    },
  })

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const updateFilters = useCallback((newFilters: Partial<OrderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 25,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
  }, [])

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus, notes?: string) => {
      return updateOrderStatusMutation.mutateAsync({ 
        orderId, 
        status, 
        ...(notes !== undefined && { notes })
      })
    },
    [updateOrderStatusMutation]
  )

  const bulkUpdateStatus = useCallback(
    (orderIds: string[], status: OrderStatus) => {
      return bulkOperationMutation.mutateAsync({
        orderIds,
        operation: 'update_status',
        data: { status },
      })
    },
    [bulkOperationMutation]
  )

  // =====================================================
  // MÉTRICAS DERIVADAS
  // =====================================================

  const derivedMetrics = {
    totalPages: ordersData?.data?.pagination?.totalPages || 0,
    totalOrders: ordersData?.data?.pagination?.total || 0,
    currentPage: filters.page,
    hasNextPage: ordersData?.data?.pagination?.hasNextPage || false,
    hasPrevPage: ordersData?.data?.pagination?.hasPreviousPage || false,

    // Estadísticas calculadas
    completionRate: statsData?.data
      ? ((statsData.data.completed_orders / statsData.data.total_orders) * 100).toFixed(1)
      : '0',

    cancellationRate: statsData?.data
      ? ((statsData.data.cancelled_orders / statsData.data.total_orders) * 100).toFixed(1)
      : '0',

    revenueGrowth: analyticsData?.data?.daily_orders
      ? calculateGrowthRate(analyticsData.data.daily_orders)
      : 0,
  }

  // =====================================================
  // RETURN
  // =====================================================

  return {
    // Datos ya transformados por el API - Acceder correctamente a la estructura anidada
    orders: ordersData?.data?.orders || ordersData?.data || [],
    // Bug Fix: Acceder a statsData.data en lugar de statsData.stats (consistente con API)
    stats: statsData?.data ? {
      totalOrders: statsData.data.total_orders,
      pendingOrders: statsData.data.pending_orders,
      processingOrders: statsData.data.processing_orders || 0,
      completedOrders: statsData.data.completed_orders,
      cancelledOrders: statsData.data.cancelled_orders,
      totalRevenue: statsData.data.total_revenue,
      averageOrderValue: statsData.data.average_order_value,
      ordersToday: statsData.data.orders_today || 0,
    } : null,
    analytics: analyticsData?.data || null,

    // Estados de carga
    isLoading: ordersLoading || statsLoading,
    isLoadingOrders: ordersLoading,
    isLoadingStats: statsLoading,
    isLoadingAnalytics: analyticsLoading,

    // Errores
    error: ordersError || statsError || analyticsError,
    ordersError,
    statsError,
    analyticsError,

    // Filtros y paginación
    filters,
    updateFilters,
    resetFilters,

    // Acciones
    updateOrderStatus,
    bulkUpdateStatus,
    refetchOrders,

    // Estados de mutations
    isUpdatingStatus: updateOrderStatusMutation.isPending,
    isBulkOperating: bulkOperationMutation.isPending,

    // Métricas derivadas
    derivedMetrics,

    // Paginación helpers
    pagination: {
      currentPage: filters.page,
      totalPages: derivedMetrics.totalPages,
      totalItems: derivedMetrics.totalOrders,
      hasNext: derivedMetrics.hasNextPage,
      hasPrev: derivedMetrics.hasPrevPage,
      goToPage: (page: number) => updateFilters({ page }),
      nextPage: () => derivedMetrics.hasNextPage && updateFilters({ page: filters.page + 1 }),
      prevPage: () => derivedMetrics.hasPrevPage && updateFilters({ page: filters.page - 1 }),
    },
    
    // Función refresh simplificada
    refreshOrders: refetchOrders,
    
    // Handlers para componente
    handleBulkOperation: bulkUpdateStatus,
    handleOrderAction: async (action: string, orderId: string) => {
      console.log('Order action:', action, orderId)
      
      // Mapear acciones a estados
      const actionToStatusMap: Record<string, OrderStatus | null> = {
        'process': 'processing',
        'deliver': 'delivered',
        'ship': 'shipped',
        'confirm': 'confirmed',
        'cancel': 'cancelled',
      }
      
      const newStatus = actionToStatusMap[action]
      
      if (newStatus) {
        try {
          await updateOrderStatus(orderId, newStatus)
        } catch (error) {
          console.error('Error updating order status:', error)
          throw error
        }
      } else {
        // Para otras acciones que no sean cambio de estado
        console.log('Action not mapped to status change:', action)
      }
    },
  }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function calculateGrowthRate(dailyOrders: Array<{ date: string; revenue: number }>): number {
  if (dailyOrders.length < 2) {
    return 0
  }

  const recent = dailyOrders.slice(-7) // Últimos 7 días
  const previous = dailyOrders.slice(-14, -7) // 7 días anteriores

  const recentAvg = recent.reduce((sum, day) => sum + day.revenue, 0) / recent.length
  const previousAvg = previous.reduce((sum, day) => sum + day.revenue, 0) / previous.length

  if (previousAvg === 0) {
    return 0
  }

  return ((recentAvg - previousAvg) / previousAvg) * 100
}
