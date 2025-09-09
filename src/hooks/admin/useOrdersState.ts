// ===================================
// PINTEYA E-COMMERCE - ORDERS STATE HOOK
// Hook especializado para manejo de estado de órdenes
// ===================================

import { useState, useCallback, useRef } from 'react';
import { StrictOrderEnterprise, StrictPagination } from '@/types/api-strict';
import { StrictOrderFilters } from './useOrdersEnterpriseStrict';

// ===================================
// TIPOS DE ESTADO
// ===================================

export interface StrictOrdersState {
  readonly orders: StrictOrderEnterprise[];
  readonly pagination: StrictPagination | null;
  readonly analytics: {
    readonly total_orders: number;
    readonly total_revenue: number;
    readonly pending_orders: number;
    readonly completed_orders: number;
  } | null;
  readonly filters: StrictOrderFilters;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly lastUpdated: Date | null;
}

export interface StrictOrdersActions {
  readonly updateFilters: (newFilters: Partial<StrictOrderFilters>) => void;
  readonly setLoading: (loading: boolean) => void;
  readonly setError: (error: string | null) => void;
  readonly setOrders: (orders: StrictOrderEnterprise[]) => void;
  readonly setPagination: (pagination: StrictPagination | null) => void;
  readonly setAnalytics: (analytics: StrictOrdersState['analytics']) => void;
  readonly resetState: () => void;
  readonly updateOrder: (orderId: string, updates: Partial<StrictOrderEnterprise>) => void;
}

// ===================================
// ESTADO POR DEFECTO
// ===================================

const DEFAULT_FILTERS: StrictOrderFilters = {
  page: 1,
  limit: 20,
  sort_by: 'created_at',
  sort_order: 'desc',
  status: 'all',
  payment_status: 'all',
  fulfillment_status: 'all'
};

const DEFAULT_STATE: Omit<StrictOrdersState, 'filters'> = {
  orders: [],
  pagination: null,
  analytics: null,
  isLoading: false,
  error: null,
  lastUpdated: null
};

// ===================================
// HOOK DE ESTADO
// ===================================

export interface UseOrdersStateReturn extends StrictOrdersState, StrictOrdersActions {
  readonly getLastFilters: () => StrictOrderFilters;
  readonly hasFiltersChanged: (newFilters: StrictOrderFilters) => boolean;
}

export function useOrdersState(
  initialFilters: Partial<StrictOrderFilters> = {}
): UseOrdersStateReturn {
  
  // Estado principal
  const [state, setState] = useState<StrictOrdersState>({
    ...DEFAULT_STATE,
    filters: { ...DEFAULT_FILTERS, ...initialFilters }
  });
  
  // Referencias para comparaciones
  const lastFiltersRef = useRef<StrictOrderFilters>(state.filters);
  
  // ===================================
  // ACCIONES DE ESTADO
  // ===================================
  
  const updateFilters = useCallback((newFilters: Partial<StrictOrderFilters>): void => {
    setState(prev => {
      const updatedFilters = { ...prev.filters, ...newFilters };
      lastFiltersRef.current = updatedFilters;
      
      return {
        ...prev,
        filters: updatedFilters,
        // Reset pagination cuando cambian filtros (excepto page)
        ...(Object.keys(newFilters).some(key => key !== 'page') && {
          pagination: prev.pagination ? { ...prev.pagination, page: 1 } : null
        })
      };
    });
  }, []);
  
  const setLoading = useCallback((loading: boolean): void => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
      // Limpiar error cuando empieza nueva carga
      ...(loading && { error: null })
    }));
  }, []);
  
  const setError = useCallback((error: string | null): void => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));
  }, []);
  
  const setOrders = useCallback((orders: StrictOrderEnterprise[]): void => {
    setState(prev => ({
      ...prev,
      orders,
      lastUpdated: new Date(),
      isLoading: false,
      error: null
    }));
  }, []);
  
  const setPagination = useCallback((pagination: StrictPagination | null): void => {
    setState(prev => ({
      ...prev,
      pagination
    }));
  }, []);
  
  const setAnalytics = useCallback((analytics: StrictOrdersState['analytics']): void => {
    setState(prev => ({
      ...prev,
      analytics
    }));
  }, []);
  
  const resetState = useCallback((): void => {
    setState({
      ...DEFAULT_STATE,
      filters: { ...DEFAULT_FILTERS }
    });
    lastFiltersRef.current = { ...DEFAULT_FILTERS };
  }, []);
  
  const updateOrder = useCallback((orderId: string, updates: Partial<StrictOrderEnterprise>): void => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order => 
        order.id === orderId 
          ? { ...order, ...updates }
          : order
      ),
      lastUpdated: new Date()
    }));
  }, []);
  
  // ===================================
  // UTILIDADES
  // ===================================
  
  const getLastFilters = useCallback((): StrictOrderFilters => {
    return lastFiltersRef.current;
  }, []);
  
  const hasFiltersChanged = useCallback((newFilters: StrictOrderFilters): boolean => {
    const currentFiltersString = JSON.stringify(state.filters);
    const newFiltersString = JSON.stringify(newFilters);
    return currentFiltersString !== newFiltersString;
  }, [state.filters]);
  
  // ===================================
  // RETORNO DEL HOOK
  // ===================================
  
  return {
    // Estado
    orders: state.orders,
    pagination: state.pagination,
    analytics: state.analytics,
    filters: state.filters,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Acciones
    updateFilters,
    setLoading,
    setError,
    setOrders,
    setPagination,
    setAnalytics,
    resetState,
    updateOrder,
    
    // Utilidades
    getLastFilters,
    hasFiltersChanged
  };
}
