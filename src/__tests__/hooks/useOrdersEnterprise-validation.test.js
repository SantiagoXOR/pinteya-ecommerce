// ===================================
// PINTEYA E-COMMERCE - VALIDATION TESTS
// Pruebas específicas para validación de datos en useOrdersEnterprise
// ===================================

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';
import { useOrdersEnterprise } from '@/hooks/useOrdersEnterprise';

// ===================================
// MOCKS
// ===================================

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

// Datos de prueba con valores problemáticos
const mockOrdersWithInvalidData = [
  {
    id: 'order-1',
    order_number: 'ORD-001',
    status: 'pending',
    total: undefined, // Valor problemático
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'order-2', 
    order_number: 'ORD-002',
    status: 'confirmed',
    total: NaN, // Valor problemático
    created_at: '2024-01-02T10:00:00Z'
  },
  {
    id: 'order-3',
    order_number: 'ORD-003', 
    status: 'shipped',
    total: 'invalid', // Valor problemático
    created_at: '2024-01-03T10:00:00Z'
  },
  {
    id: 'order-4',
    order_number: 'ORD-004',
    status: 'delivered',
    total: 15000, // Valor válido
    created_at: '2024-01-04T10:00:00Z'
  },
  {
    id: 'order-5',
    order_number: 'ORD-005',
    status: 'cancelled',
    total: 25000, // Valor válido pero cancelado
    created_at: '2024-01-05T10:00:00Z'
  }
];

const mockApiResponse = {
  data: {
    orders: mockOrdersWithInvalidData,
    pagination: {
      page: 1,
      limit: 20,
      total: mockOrdersWithInvalidData.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    },
    filters: {}
  }
};

// ===================================
// SETUP Y CLEANUP
// ===================================

beforeEach(() => {
  jest.clearAllMocks();
  
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => mockApiResponse
  });
});

afterEach(() => {
  jest.clearAllTimers();
});

// ===================================
// TESTS DE VALIDACIÓN
// ===================================

describe('useOrdersEnterprise - Validación de Datos', () => {
  it('debe manejar valores undefined en total sin retornar NaN', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    const totalRevenue = result.current.getTotalRevenue();
    const avgOrderValue = result.current.getAverageOrderValue();

    // Assert
    expect(totalRevenue).not.toBeNaN();
    expect(avgOrderValue).not.toBeNaN();
    expect(typeof totalRevenue).toBe('number');
    expect(typeof avgOrderValue).toBe('number');
    
    // Solo debe contar la orden válida (order-4: 15000)
    expect(totalRevenue).toBe(15000);
    expect(avgOrderValue).toBe(15000);
    
    // Debe mostrar warnings para valores inválidos
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '[useOrdersEnterprise] Invalid order total detected:', 
      undefined
    );
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '[useOrdersEnterprise] Invalid order total detected:', 
      NaN
    );
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '[useOrdersEnterprise] Invalid order total detected:', 
      'invalid'
    );
  });

  it('debe excluir órdenes canceladas del cálculo', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    const totalRevenue = result.current.getTotalRevenue();
    const avgOrderValue = result.current.getAverageOrderValue();

    // Assert
    // No debe incluir la orden cancelada (order-5: 25000)
    expect(totalRevenue).toBe(15000); // Solo order-4
    expect(avgOrderValue).toBe(15000); // Solo order-4
  });

  it('debe retornar 0 cuando no hay órdenes válidas', async () => {
    // Arrange - Mock con solo órdenes inválidas
    const invalidOrdersOnly = mockOrdersWithInvalidData.filter(order => 
      order.status === 'cancelled' || order.total === undefined || isNaN(order.total) || typeof order.total === 'string'
    );
    
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          orders: invalidOrdersOnly,
          pagination: { page: 1, limit: 20, total: invalidOrdersOnly.length, totalPages: 1 },
          filters: {}
        }
      })
    });

    const { result } = renderHook(() => useOrdersEnterprise());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    const totalRevenue = result.current.getTotalRevenue();
    const avgOrderValue = result.current.getAverageOrderValue();

    // Assert
    expect(totalRevenue).toBe(0);
    expect(avgOrderValue).toBe(0);
    expect(totalRevenue).not.toBeNaN();
    expect(avgOrderValue).not.toBeNaN();
  });

  it('debe redondear correctamente el valor promedio', async () => {
    // Arrange - Mock con valores que requieren redondeo
    const ordersWithDecimals = [
      { id: 'order-1', status: 'delivered', total: 33.33, created_at: '2024-01-01T10:00:00Z' },
      { id: 'order-2', status: 'delivered', total: 33.33, created_at: '2024-01-02T10:00:00Z' },
      { id: 'order-3', status: 'delivered', total: 33.34, created_at: '2024-01-03T10:00:00Z' }
    ];
    
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          orders: ordersWithDecimals,
          pagination: { page: 1, limit: 20, total: ordersWithDecimals.length, totalPages: 1 },
          filters: {}
        }
      })
    });

    const { result } = renderHook(() => useOrdersEnterprise());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    const avgOrderValue = result.current.getAverageOrderValue();

    // Assert
    // (33.33 + 33.33 + 33.34) / 3 = 33.333... -> redondeado a 33.33
    expect(avgOrderValue).toBe(33.33);
    expect(avgOrderValue).not.toBeNaN();
  });
});




