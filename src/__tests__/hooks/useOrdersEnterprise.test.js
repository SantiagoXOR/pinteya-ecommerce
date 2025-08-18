// ===================================
// PINTEYA E-COMMERCE - USE ORDERS ENTERPRISE HOOK TESTS
// ===================================

import { renderHook, act, waitFor } from '@testing-library/react';
import { useOrdersEnterprise, useOrderDetail } from '@/hooks/useOrdersEnterprise';
import { 
  mockOrders, 
  createMockFetch, 
  resetAllMocks 
} from '../setup/orders-mocks';

// ===================================
// SETUP MOCKS
// ===================================

const mockFetch = createMockFetch();
global.fetch = mockFetch;

// ===================================
// TESTS BÁSICOS useOrdersEnterprise
// ===================================

describe('useOrdersEnterprise', () => {
  beforeEach(() => {
    resetAllMocks();
    mockFetch.mockClear();
  });

  test('should initialize with default state', async () => {
    // Arrange & Act
    const { result } = renderHook(() => useOrdersEnterprise());

    // Assert initial state
    expect(result.current.orders).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.filters).toEqual({
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'desc'
    });
  });

  test('should fetch orders on mount', async () => {
    // Arrange & Act
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/orders'),
      undefined
    );
    expect(result.current.orders).toEqual(mockOrders);
    expect(result.current.error).toBe(null);
  });

  test('should handle fetch errors', async () => {
    // Arrange
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      })
    );

    // Act
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert
    expect(result.current.error).toBe('Server error');
    expect(result.current.orders).toEqual([]);
  });

  test('should accept initial filters', async () => {
    // Arrange
    const initialFilters = {
      status: 'pending',
      page: 2,
      limit: 10
    };

    // Act
    const { result } = renderHook(() => useOrdersEnterprise(initialFilters));

    // Assert
    expect(result.current.filters).toEqual({
      page: 2,
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
      status: 'pending'
    });

    // Wait for fetch to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=pending'),
        undefined
      );
    });
  });
});

// ===================================
// TESTS DE FILTROS
// ===================================

describe('useOrdersEnterprise - Filters', () => {
  beforeEach(() => {
    resetAllMocks();
    mockFetch.mockClear();
  });

  test('should update search filter', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      result.current.setSearch('test search');
    });

    // Assert
    expect(result.current.filters.search).toBe('test search');
    expect(result.current.filters.page).toBe(1); // Should reset page
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('search=test%20search'),
      undefined
    );
  });

  test('should update status filter', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      result.current.setStatus('pending');
    });

    // Assert
    expect(result.current.filters.status).toBe('pending');
    expect(result.current.filters.page).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('status=pending'),
      undefined
    );
  });

  test('should update payment status filter', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      result.current.setPaymentStatus('paid');
    });

    // Assert
    expect(result.current.filters.payment_status).toBe('paid');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('payment_status=paid'),
      undefined
    );
  });

  test('should update sorting', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      result.current.setSorting('total_amount', 'asc');
    });

    // Assert
    expect(result.current.filters.sort_by).toBe('total_amount');
    expect(result.current.filters.sort_order).toBe('asc');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('sort_by=total_amount'),
      undefined
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('sort_order=asc'),
      undefined
    );
  });

  test('should update date range', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      result.current.setDateRange('2024-01-01', '2024-01-31');
    });

    // Assert
    expect(result.current.filters.date_from).toBe('2024-01-01');
    expect(result.current.filters.date_to).toBe('2024-01-31');
    expect(result.current.filters.page).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('date_from=2024-01-01'),
      undefined
    );
  });

  test('should clear all filters', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise({
      status: 'pending',
      search: 'test',
      page: 3
    }));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      result.current.clearFilters();
    });

    // Assert
    expect(result.current.filters).toEqual({
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'desc'
    });
  });
});

// ===================================
// TESTS DE PAGINACIÓN
// ===================================

describe('useOrdersEnterprise - Pagination', () => {
  beforeEach(() => {
    resetAllMocks();
    mockFetch.mockClear();
  });

  test('should handle page changes', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      result.current.setPage(2);
    });

    // Assert
    expect(result.current.filters.page).toBe(2);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
      undefined
    );
  });

  test('should provide pagination helpers', async () => {
    // Arrange
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: {
            orders: mockOrders,
            pagination: {
              page: 2,
              limit: 20,
              total: 50,
              totalPages: 3,
              hasNextPage: true,
              hasPreviousPage: true
            },
            filters: {}
          },
          success: true,
          error: null
        })
      })
    );

    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert pagination helpers
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(true);
    expect(result.current.totalOrders).toBe(50);
    expect(result.current.currentPage).toBe(2);
    expect(result.current.totalPages).toBe(3);
  });
});

// ===================================
// TESTS DE OPERACIONES CRUD
// ===================================

describe('useOrdersEnterprise - CRUD Operations', () => {
  beforeEach(() => {
    resetAllMocks();
    mockFetch.mockClear();
  });

  test('should create order', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const orderData = {
      user_id: 'test-user-id',
      items: [{ product_id: 1, quantity: 1, unit_price: 15000 }]
    };

    // Act
    let createdOrder;
    await act(async () => {
      createdOrder = await result.current.createOrder(orderData);
    });

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/orders',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })
    );
    expect(createdOrder).toBeDefined();
  });

  test('should update order', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updateData = { notes: 'Updated notes' };

    // Act
    let updatedOrder;
    await act(async () => {
      updatedOrder = await result.current.updateOrder('order-1', updateData);
    });

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/orders/order-1',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
    );
    expect(updatedOrder).toBeDefined();
  });

  test('should change order status', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      await result.current.changeOrderStatus('order-1', 'confirmed', 'Payment confirmed');
    });

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/orders/order-1/status',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          reason: 'Payment confirmed'
        })
      })
    );
  });

  test('should handle bulk status update', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const bulkData = {
      order_ids: ['order-1', 'order-2'],
      status: 'confirmed',
      reason: 'Bulk confirmation'
    };

    // Act
    let bulkResult;
    await act(async () => {
      bulkResult = await result.current.bulkUpdateStatus(bulkData);
    });

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/orders/bulk?operation=status_update',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkData)
      })
    );
    expect(bulkResult).toBeDefined();
  });

  test('should export orders', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    let exportResult;
    await act(async () => {
      exportResult = await result.current.exportOrders('csv');
    });

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/orders/bulk?operation=export',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'csv',
          filters: result.current.filters,
          include_items: true
        })
      })
    );
    expect(exportResult).toBeDefined();
  });
});

// ===================================
// TESTS DE UTILIDADES
// ===================================

describe('useOrdersEnterprise - Utilities', () => {
  beforeEach(() => {
    resetAllMocks();
    mockFetch.mockClear();
  });

  test('should get order by id', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    const order = result.current.getOrderById('order-1');

    // Assert
    expect(order).toEqual(mockOrders[0]);
  });

  test('should get orders by status', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    const pendingOrders = result.current.getOrdersByStatus('pending');

    // Assert
    expect(pendingOrders).toEqual(
      mockOrders.filter(order => order.status === 'pending')
    );
  });

  test('should calculate total revenue', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    const totalRevenue = result.current.getTotalRevenue();

    // Assert
    const expectedRevenue = mockOrders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total_amount, 0);
    expect(totalRevenue).toBe(expectedRevenue);
  });

  test('should calculate average order value', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    const avgOrderValue = result.current.getAverageOrderValue();

    // Assert
    const validOrders = mockOrders.filter(order => order.status !== 'cancelled');
    const expectedAvg = validOrders.reduce((sum, order) => sum + order.total_amount, 0) / validOrders.length;
    expect(avgOrderValue).toBe(expectedAvg);
  });

  test('should refresh data', async () => {
    // Arrange
    const { result } = renderHook(() => useOrdersEnterprise());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = mockFetch.mock.calls.length;

    // Act
    await act(async () => {
      result.current.refresh();
    });

    // Assert
    expect(mockFetch.mock.calls.length).toBe(initialCallCount + 1);
  });
});

// ===================================
// TESTS useOrderDetail
// ===================================

describe('useOrderDetail', () => {
  beforeEach(() => {
    resetAllMocks();
    mockFetch.mockClear();
  });

  test('should fetch order detail', async () => {
    // Arrange
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: {
            order: mockOrders[0],
            statusHistory: [],
            notes: []
          },
          success: true,
          error: null
        })
      })
    );

    // Act
    const { result } = renderHook(() => useOrderDetail('order-1'));

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/orders/order-1');
    expect(result.current.order).toEqual(mockOrders[0]);
    expect(result.current.error).toBe(null);
  });

  test('should handle fetch error', async () => {
    // Arrange
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Order not found' })
      })
    );

    // Act
    const { result } = renderHook(() => useOrderDetail('order-1'));

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert
    expect(result.current.error).toBe('Order not found');
    expect(result.current.order).toBe(null);
  });

  test('should not fetch if no orderId provided', async () => {
    // Arrange & Act
    const { result } = renderHook(() => useOrderDetail(''));

    // Wait a bit to ensure no fetch is made
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });

  test('should refresh order detail', async () => {
    // Arrange
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: {
            order: mockOrders[0],
            statusHistory: [],
            notes: []
          },
          success: true,
          error: null
        })
      })
    );

    const { result } = renderHook(() => useOrderDetail('order-1'));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = mockFetch.mock.calls.length;

    // Act
    await act(async () => {
      result.current.refresh();
    });

    // Assert
    expect(mockFetch.mock.calls.length).toBe(initialCallCount + 1);
  });
});
