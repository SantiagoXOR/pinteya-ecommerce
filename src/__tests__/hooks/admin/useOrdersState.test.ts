// ===================================
// PINTEYA E-COMMERCE - USEORDERSSTATE TESTS
// Tests completos para el hook de estado de órdenes
// ===================================

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useOrdersState } from '@/hooks/admin/useOrdersState';

// ===================================
// DATOS DE PRUEBA
// ===================================

const mockInitialFilters = {
  page: 1,
  limit: 20,
  sort_by: 'created_at',
  sort_order: 'desc' as const
};

const mockOrdersData = {
  orders: [
    { id: '1', order_number: 'ORD-001', status: 'pending', total: 100 },
    { id: '2', order_number: 'ORD-002', status: 'confirmed', total: 200 },
  ],
  pagination: { page: 1, totalPages: 5, hasNextPage: true },
  analytics: { totalOrders: 2, totalRevenue: 300 }
};

const mockUpdatedFilters = {
  page: 2,
  limit: 10,
  status: 'confirmed',
  search: 'test'
};

// ===================================
// SETUP
// ===================================

beforeEach(() => {
  jest.clearAllMocks();
});

// ===================================
// TESTS PRINCIPALES
// ===================================

describe('useOrdersState', () => {
  it('debe inicializarse con estado por defecto', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    expect(result.current.orders).toEqual([]);
    expect(result.current.pagination).toBeNull();
    expect(result.current.analytics).toBeNull();
    expect(result.current.filters).toEqual(mockInitialFilters);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debe proporcionar todas las funciones necesarias', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    expect(result.current.updateFilters).toBeDefined();
    expect(result.current.setLoading).toBeDefined();
    expect(result.current.setError).toBeDefined();
    expect(result.current.setOrders).toBeDefined();
    expect(result.current.setPagination).toBeDefined();
    expect(result.current.setAnalytics).toBeDefined();
    expect(result.current.clearError).toBeDefined();
    expect(result.current.resetState).toBeDefined();
    expect(result.current.areFiltersEqual).toBeDefined();

    // Verificar que son funciones
    expect(typeof result.current.updateFilters).toBe('function');
    expect(typeof result.current.setLoading).toBe('function');
    expect(typeof result.current.setError).toBe('function');
    expect(typeof result.current.setOrders).toBe('function');
    expect(typeof result.current.setPagination).toBe('function');
    expect(typeof result.current.setAnalytics).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
    expect(typeof result.current.resetState).toBe('function');
    expect(typeof result.current.areFiltersEqual).toBe('function');
  });

  it('debe actualizar filtros correctamente', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    act(() => {
      result.current.updateFilters(mockUpdatedFilters);
    });

    expect(result.current.filters).toEqual({
      ...mockInitialFilters,
      ...mockUpdatedFilters
    });
  });

  it('debe mantener inmutabilidad al actualizar filtros', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    const originalFilters = result.current.filters;

    act(() => {
      result.current.updateFilters({ page: 2 });
    });

    // Los filtros originales no deben haber cambiado
    expect(originalFilters).toEqual(mockInitialFilters);
    // Los nuevos filtros deben ser diferentes
    expect(result.current.filters).not.toBe(originalFilters);
    expect(result.current.filters.page).toBe(2);
  });

  it('debe establecer estado de carga correctamente', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('debe establecer y limpiar errores correctamente', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    const testError = new Error('Test error');

    act(() => {
      result.current.setError(testError);
    });

    expect(result.current.error).toBe(testError);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('debe establecer órdenes correctamente', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    act(() => {
      result.current.setOrders(mockOrdersData.orders);
    });

    expect(result.current.orders).toEqual(mockOrdersData.orders);
  });

  it('debe establecer paginación correctamente', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    act(() => {
      result.current.setPagination(mockOrdersData.pagination);
    });

    expect(result.current.pagination).toEqual(mockOrdersData.pagination);
  });

  it('debe establecer analytics correctamente', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    act(() => {
      result.current.setAnalytics(mockOrdersData.analytics);
    });

    expect(result.current.analytics).toEqual(mockOrdersData.analytics);
  });

  it('debe resetear estado correctamente', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    // Establecer algún estado
    act(() => {
      result.current.setOrders(mockOrdersData.orders);
      result.current.setPagination(mockOrdersData.pagination);
      result.current.setAnalytics(mockOrdersData.analytics);
      result.current.setLoading(true);
      result.current.setError(new Error('Test error'));
    });

    // Verificar que el estado se estableció
    expect(result.current.orders).toEqual(mockOrdersData.orders);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeTruthy();

    // Resetear estado
    act(() => {
      result.current.resetState();
    });

    // Verificar que el estado se reseteó
    expect(result.current.orders).toEqual([]);
    expect(result.current.pagination).toBeNull();
    expect(result.current.analytics).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    // Los filtros deben mantenerse
    expect(result.current.filters).toEqual(mockInitialFilters);
  });

  it('debe comparar filtros correctamente', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    // Filtros idénticos
    const identicalFilters = { ...mockInitialFilters };
    expect(result.current.areFiltersEqual(mockInitialFilters, identicalFilters)).toBe(true);

    // Filtros diferentes
    const differentFilters = { ...mockInitialFilters, page: 2 };
    expect(result.current.areFiltersEqual(mockInitialFilters, differentFilters)).toBe(false);

    // Filtros con propiedades adicionales
    const filtersWithExtra = { ...mockInitialFilters, status: 'pending' };
    expect(result.current.areFiltersEqual(mockInitialFilters, filtersWithExtra)).toBe(false);

    // Filtros con valores undefined vs null
    const filtersWithUndefined = { ...mockInitialFilters, status: undefined };
    const filtersWithNull = { ...mockInitialFilters, status: null };
    expect(result.current.areFiltersEqual(filtersWithUndefined, filtersWithNull)).toBe(false);
  });

  it('debe manejar valores null y undefined en filtros', () => {
    const filtersWithNulls = {
      page: 1,
      limit: 20,
      status: null,
      search: undefined
    };

    const { result } = renderHook(() => useOrdersState(filtersWithNulls));

    expect(result.current.filters).toEqual(filtersWithNulls);

    act(() => {
      result.current.updateFilters({ status: 'pending' });
    });

    expect(result.current.filters.status).toBe('pending');
    expect(result.current.filters.search).toBeUndefined();
  });

  it('debe mantener referencia estable de funciones', () => {
    const { result, rerender } = renderHook(() => useOrdersState(mockInitialFilters));

    const initialFunctions = {
      updateFilters: result.current.updateFilters,
      setLoading: result.current.setLoading,
      setError: result.current.setError,
      setOrders: result.current.setOrders,
      setPagination: result.current.setPagination,
      setAnalytics: result.current.setAnalytics,
      clearError: result.current.clearError,
      resetState: result.current.resetState,
      areFiltersEqual: result.current.areFiltersEqual
    };

    // Re-renderizar
    rerender();

    // Las funciones deben mantener la misma referencia
    expect(result.current.updateFilters).toBe(initialFunctions.updateFilters);
    expect(result.current.setLoading).toBe(initialFunctions.setLoading);
    expect(result.current.setError).toBe(initialFunctions.setError);
    expect(result.current.setOrders).toBe(initialFunctions.setOrders);
    expect(result.current.setPagination).toBe(initialFunctions.setPagination);
    expect(result.current.setAnalytics).toBe(initialFunctions.setAnalytics);
    expect(result.current.clearError).toBe(initialFunctions.clearError);
    expect(result.current.resetState).toBe(initialFunctions.resetState);
    expect(result.current.areFiltersEqual).toBe(initialFunctions.areFiltersEqual);
  });

  it('debe manejar actualizaciones de estado múltiples correctamente', () => {
    const { result } = renderHook(() => useOrdersState(mockInitialFilters));

    act(() => {
      result.current.setLoading(true);
      result.current.setOrders(mockOrdersData.orders);
      result.current.setPagination(mockOrdersData.pagination);
      result.current.setAnalytics(mockOrdersData.analytics);
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.orders).toEqual(mockOrdersData.orders);
    expect(result.current.pagination).toEqual(mockOrdersData.pagination);
    expect(result.current.analytics).toEqual(mockOrdersData.analytics);
  });

  it('debe manejar filtros complejos con objetos anidados', () => {
    const complexFilters = {
      page: 1,
      limit: 20,
      dateRange: {
        start: '2025-01-01',
        end: '2025-01-31'
      },
      statusFilter: {
        include: ['pending', 'confirmed'],
        exclude: ['cancelled']
      }
    };

    const { result } = renderHook(() => useOrdersState(complexFilters));

    expect(result.current.filters).toEqual(complexFilters);

    act(() => {
      result.current.updateFilters({
        dateRange: {
          start: '2025-02-01',
          end: '2025-02-28'
        }
      });
    });

    expect(result.current.filters.dateRange).toEqual({
      start: '2025-02-01',
      end: '2025-02-28'
    });
    expect(result.current.filters.statusFilter).toEqual(complexFilters.statusFilter);
  });
});









