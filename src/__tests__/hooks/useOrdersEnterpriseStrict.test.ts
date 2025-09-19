// ===================================
// PINTEYA E-COMMERCE - UNIT TESTS
// Pruebas unitarias para useOrdersEnterpriseStrict
// ===================================

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';
import { useOrdersEnterpriseStrict } from '@/hooks/admin/useOrdersEnterpriseStrict';
import { OrderEnterprise, OrderStatus } from '@/types/orders-enterprise';
import { ApiResponse } from '@/types/api-strict';

// ===================================
// MOCKS
// ===================================

// Mock del fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock de console para capturar logs
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

// Datos de prueba
const mockOrder: OrderEnterprise = {
  id: 'order-123',
  orderNumber: 'ORD-2024-001',
  status: 'pending',
  previousStatus: null,
  statusHistory: [{
    status: 'pending',
    timestamp: new Date().toISOString(),
    reason: 'Order created',
    userId: 'user-123'
  }],
  customerId: 'customer-123',
  customerEmail: 'test@example.com',
  customerPhone: '+1234567890',
  items: [{
    id: 'item-1',
    productId: 'product-1',
    productName: 'Test Product',
    quantity: 2,
    unitPrice: 29.99,
    totalPrice: 59.98,
    sku: 'TEST-SKU-001'
  }],
  subtotal: 59.98,
  taxAmount: 4.80,
  shippingAmount: 9.99,
  discountAmount: 0,
  totalAmount: 74.77,
  currency: 'USD',
  shippingAddress: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'US'
  },
  billingAddress: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'US'
  },
  paymentMethod: 'credit_card',
  paymentStatus: 'pending',
  shippingMethod: 'standard',
  estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  notes: 'Test order notes',
  tags: ['test', 'automated'],
  metadata: {
    source: 'web',
    campaign: 'test-campaign'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockApiResponse: ApiResponse<OrderEnterprise[]> = {
  success: true,
  data: [mockOrder],
  message: 'Orders retrieved successfully',
  timestamp: new Date().toISOString(),
  requestId: 'req-123',
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1
  }
};

// ===================================
// SETUP Y CLEANUP
// ===================================

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockClear();
});

afterEach(() => {
  jest.clearAllTimers();
});

// ===================================
// TESTS PRINCIPALES
// ===================================

describe('useOrdersEnterpriseStrict', () => {
  describe('Inicialización', () => {
    it('debe inicializar con estado por defecto', () => {
      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false
        })
      );

      expect(result.current.orders).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      });
    });

    it('debe aplicar filtros iniciales', () => {
      const initialFilters = {
        status: 'pending' as OrderStatus,
        customerId: 'customer-123'
      };

      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters,
          enableCache: false
        })
      );

      expect(result.current.filters).toEqual(initialFilters);
    });
  });

  describe('Carga de datos exitosa', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });
    });

    it('debe cargar órdenes correctamente', async () => {
      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false,
          autoFetch: true
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orders).toEqual([mockOrder]);
      expect(result.current.error).toBeNull();
      expect(result.current.pagination).toEqual(mockApiResponse.pagination);
    });

    it('debe manejar filtros correctamente', async () => {
      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false
        })
      );

      await act(async () => {
        result.current.setFilters({
          status: 'pending' as OrderStatus
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=pending'),
          expect.any(Object)
        );
      });
    });

    it('debe manejar paginación correctamente', async () => {
      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false
        })
      );

      await act(async () => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar errores de red', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false,
          autoFetch: true
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.orders).toEqual([]);
    });

    it('debe manejar respuestas HTTP de error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          message: 'Internal server error'
        })
      });

      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false,
          autoFetch: true
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.orders).toEqual([]);
    });

    it('debe manejar datos inválidos', async () => {
      const invalidResponse = {
        success: true,
        data: [{ id: 'invalid' }], // Datos incompletos
        message: 'Success'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => invalidResponse
      });

      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false,
          autoFetch: true,
          enableValidation: true
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockConsoleWarn).toHaveBeenCalled();
      expect(result.current.orders).toEqual([]);
    });
  });

  describe('Sistema de caché', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });
    });

    it('debe usar caché cuando está habilitado', async () => {
      const { result, rerender } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: true,
          cacheTime: 5000
        })
      );

      // Primera carga
      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstCallCount = mockFetch.mock.calls.length;

      // Segunda carga (debería usar caché)
      await act(async () => {
        result.current.refetch();
      });

      expect(mockFetch.mock.calls.length).toBe(firstCallCount);
    });

    it('debe invalidar caché después del tiempo especificado', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() =>
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: true,
          cacheTime: 1000 // 1 segundo
        })
      );

      // Primera carga
      await act(async () => {
        result.current.refetch();
      });

      const firstCallCount = mockFetch.mock.calls.length;

      // Avanzar tiempo más allá del cache time
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      // Segunda carga (debería hacer nueva petición)
      await act(async () => {
        result.current.refetch();
      });

      expect(mockFetch.mock.calls.length).toBeGreaterThan(firstCallCount);

      jest.useRealTimers();
    });
  });

  describe('Sistema de reintentos', () => {
    it('debe reintentar en caso de error', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockApiResponse
        });

      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false,
          retryAttempts: 3,
          retryDelay: 100
        })
      );

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 5000 });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.current.orders).toEqual([mockOrder]);
      expect(result.current.error).toBeNull();
    });

    it('debe fallar después de agotar reintentos', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false,
          retryAttempts: 2,
          retryDelay: 50
        })
      );

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 inicial + 2 reintentos
      expect(result.current.error).toBeTruthy();
      expect(result.current.orders).toEqual([]);
    });
  });

  describe('Transformación de datos', () => {
    it('debe aplicar transformaciones personalizadas', async () => {
      const transformedOrder = { ...mockOrder, customField: 'transformed' };
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });

      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false,
          transform: (orders) => orders.map(order => ({
            ...order,
            customField: 'transformed'
          }))
        })
      );

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orders[0]).toEqual(transformedOrder);
    });
  });

  describe('Callbacks', () => {
    it('debe ejecutar callback onSuccess', async () => {
      const onSuccess = jest.fn();

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });

      const { result } = renderHook(() =>
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false,
          onSuccess
        })
      );

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith([mockOrder]);
      });
    });

    it('debe ejecutar callback onError', async () => {
      const onError = jest.fn();
      const error = new Error('Test error');
      
      mockFetch.mockRejectedValue(error);

      const { result } = renderHook(() => 
        useOrdersEnterpriseStrict({
          initialFilters: {},
          enableCache: false,
          onError
        })
      );

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });
  });
});









