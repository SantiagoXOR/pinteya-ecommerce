// ===================================
// PINTEYA E-COMMERCE - ORDERS ENTERPRISE HOOK
// ===================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  OrderEnterprise, 
  OrderFilters, 
  OrderListResponse,
  UseOrdersState,
  BulkStatusUpdate,
  BulkStatusUpdateResult
} from '@/types/orders-enterprise';

// ===================================
// HOOK PRINCIPAL
// ===================================

export function useOrdersEnterprise(initialFilters?: OrderFilters) {
  // Hook legacy - usar /hooks/admin/useOrdersEnterprise.ts en su lugar

  const [state, setState] = useState<UseOrdersState>({
    orders: [],
    loading: true,
    error: null,
    filters: {
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'desc',
      ...initialFilters,
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });

  // ===================================
  // FUNCIONES DE API
  // ===================================

  const fetchOrders = useCallback(async (filters: OrderFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        // FILTRAR OBJETOS: Solo agregar valores primitivos (string, number, boolean)
        if (value !== undefined && value !== null && value !== '' && typeof value !== 'object') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/orders?${queryParams}`);
      const data: { data: OrderListResponse } = await response.json();

      if (!response.ok) {
        throw new Error(data.data?.toString() || 'Error al cargar órdenes');
      }

      setState(prev => ({
        ...prev,
        orders: data.data.orders,
        pagination: data.data.pagination,
        filters: data.data.filters,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      }));
    }
  }, []);

  const createOrder = useCallback(async (orderData: any): Promise<OrderEnterprise> => {
    const response = await fetch('/api/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al crear orden');
    }

    // Refrescar lista después de crear
    await fetchOrders(state.filters);

    return data.data;
  }, [state.filters, fetchOrders]);

  const updateOrder = useCallback(async (orderId: string, orderData: any): Promise<OrderEnterprise> => {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al actualizar orden');
    }

    // Actualizar orden en el estado local
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order => 
        order.id === orderId ? { ...order, ...data.data } : order
      ),
    }));

    return data.data;
  }, []);

  const changeOrderStatus = useCallback(async (
    orderId: string, 
    newStatus: string, 
    reason: string,
    additionalData?: any
  ): Promise<void> => {
    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: newStatus,
        reason,
        ...additionalData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al cambiar estado');
    }

    // Actualizar orden en el estado local
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ),
    }));
  }, []);

  const bulkUpdateStatus = useCallback(async (
    bulkData: BulkStatusUpdate
  ): Promise<BulkStatusUpdateResult> => {
    const response = await fetch('/api/admin/orders/bulk?operation=status_update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bulkData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en operación masiva');
    }

    // Refrescar lista después de operación masiva
    await fetchOrders(state.filters);

    return data.data;
  }, [state.filters, fetchOrders]);

  const exportOrders = useCallback(async (
    format: 'csv' | 'json' = 'csv',
    filters?: OrderFilters
  ): Promise<any> => {
    const response = await fetch('/api/admin/orders/bulk?operation=export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format,
        filters: filters || state.filters,
        include_items: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al exportar órdenes');
    }

    return data.data;
  }, [state.filters]);

  // ===================================
  // FUNCIONES DE FILTRADO Y PAGINACIÓN
  // ===================================

  const updateFilters = useCallback((newFilters: Partial<OrderFilters>) => {
    const updatedFilters = {
      ...state.filters,
      ...newFilters,
      page: newFilters.page || 1, // Reset page unless explicitly set
    };

    setState(prev => ({
      ...prev,
      filters: updatedFilters,
    }));

    fetchOrders(updatedFilters);
  }, [state.filters, fetchOrders]);

  const setPage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const setSearch = useCallback((search: string) => {
    updateFilters({ search, page: 1 });
  }, [updateFilters]);

  const setStatus = useCallback((status: string | undefined) => {
    updateFilters({ status, page: 1 });
  }, [updateFilters]);

  const setPaymentStatus = useCallback((payment_status: string | undefined) => {
    updateFilters({ payment_status, page: 1 });
  }, [updateFilters]);

  const setSorting = useCallback((sort_by: string, sort_order: 'asc' | 'desc') => {
    updateFilters({ sort_by, sort_order });
  }, [updateFilters]);

  const setDateRange = useCallback((date_from?: string, date_to?: string) => {
    updateFilters({ date_from, date_to, page: 1 });
  }, [updateFilters]);

  const clearFilters = useCallback(() => {
    const defaultFilters: OrderFilters = {
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'desc',
    };

    setState(prev => ({
      ...prev,
      filters: defaultFilters,
    }));

    fetchOrders(defaultFilters);
  }, [fetchOrders]);

  // ===================================
  // FUNCIONES DE UTILIDAD
  // ===================================

  const refresh = useCallback(() => {
    fetchOrders(state.filters);
  }, [state.filters, fetchOrders]);

  const getOrderById = useCallback((orderId: string): OrderEnterprise | undefined => {
    return state.orders.find(order => order.id === orderId);
  }, [state.orders]);

  const getOrdersByStatus = useCallback((status: string): OrderEnterprise[] => {
    return state.orders.filter(order => order.status === status);
  }, [state.orders]);

  // ===================================
  // FUNCIÓN DE VALIDACIÓN DE DATOS
  // ===================================

  const validateOrderTotal = useCallback((total: unknown): number => {
    if (typeof total === 'number' && !isNaN(total) && total >= 0) {
      return total;
    }
    console.warn('[useOrdersEnterprise] Invalid order total detected:', total);
    return 0;
  }, []);

  const getOrderTotal = useCallback((order: any): number => {
    // Manejar tanto 'total' como 'total_amount' para compatibilidad con mocks
    const total = order.total ?? order.total_amount;
    return validateOrderTotal(total);
  }, [validateOrderTotal]);

  const getTotalRevenue = useCallback((): number => {
    return state.orders.reduce((total, order) => {
      const orderTotal = getOrderTotal(order);
      return order.status !== 'cancelled' ? total + orderTotal : total;
    }, 0);
  }, [state.orders, getOrderTotal]);

  const getAverageOrderValue = useCallback((): number => {
    const validOrders = state.orders.filter(order => {
      const total = getOrderTotal(order);
      return order.status !== 'cancelled' && total > 0;
    });

    if (validOrders.length === 0) {return 0;}

    const total = validOrders.reduce((sum, order) =>
      sum + getOrderTotal(order), 0
    );
    return Math.round((total / validOrders.length) * 100) / 100;
  }, [state.orders, getOrderTotal]);

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    fetchOrders(state.filters);
  }, []); // Solo ejecutar una vez al montar

  // ===================================
  // RETURN DEL HOOK
  // ===================================

  return {
    // Estado
    orders: state.orders,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    pagination: state.pagination,

    // Operaciones CRUD
    createOrder,
    updateOrder,
    changeOrderStatus,
    bulkUpdateStatus,
    exportOrders,

    // Filtrado y paginación
    updateFilters,
    setPage,
    setSearch,
    setStatus,
    setPaymentStatus,
    setSorting,
    setDateRange,
    clearFilters,

    // Utilidades
    refresh,
    getOrderById,
    getOrdersByStatus,
    getTotalRevenue,
    getAverageOrderValue,

    // Funciones de conveniencia
    hasNextPage: state.pagination.hasNextPage,
    hasPreviousPage: state.pagination.hasPreviousPage,
    totalOrders: state.pagination.total,
    currentPage: state.pagination.page,
    totalPages: state.pagination.totalPages,
  };
}

// ===================================
// HOOK PARA ORDEN INDIVIDUAL
// ===================================

export function useOrderDetail(orderId: string) {
  const [order, setOrder] = useState<OrderEnterprise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {return;}

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar orden');
      }

      setOrder(data.data.order);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    loading,
    error,
    refresh: fetchOrder,
  };
}









