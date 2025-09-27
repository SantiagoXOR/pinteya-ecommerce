// ===================================
// PINTEYA E-COMMERCE - USEORDERSENTERPRISE INTEGRATION TESTS
// Tests de integración para el hook principal de órdenes
// ===================================

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { useOrdersEnterpriseStrict } from '@/hooks/admin/useOrdersEnterpriseStrict'

// ===================================
// MOCKS GLOBALES
// ===================================

// Mock de fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock de localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock de AbortController
const mockAbort = jest.fn()
global.AbortController = jest.fn(() => ({
  abort: mockAbort,
  signal: { aborted: false },
})) as any

// ===================================
// DATOS DE PRUEBA
// ===================================

const mockOrdersResponse = {
  orders: [
    { id: '1', order_number: 'ORD-001', status: 'pending', total: 100 },
    { id: '2', order_number: 'ORD-002', status: 'confirmed', total: 200 },
  ],
  pagination: { page: 1, totalPages: 5, hasNextPage: true },
  analytics: { totalOrders: 2, totalRevenue: 300 },
}

const initialFilters = {
  page: 1,
  limit: 20,
  sort_by: 'created_at',
  sort_order: 'desc' as const,
}

const options = {
  autoFetch: true,
  maxRetries: 3,
  timeout: 10000,
  enableCache: true,
}

// ===================================
// SETUP Y CLEANUP
// ===================================

beforeEach(() => {
  jest.clearAllMocks()
  mockLocalStorage.getItem.mockReturnValue(null)

  // Mock de respuesta exitosa por defecto
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(mockOrdersResponse),
    headers: new Headers(),
    statusText: 'OK',
  })
})

afterEach(() => {
  jest.clearAllTimers()
})

// ===================================
// TESTS DE INTEGRACIÓN
// ===================================

describe('useOrdersEnterpriseStrict Integration', () => {
  it('debe inicializarse correctamente con todos los hooks', () => {
    const { result } = renderHook(() => useOrdersEnterpriseStrict(initialFilters, options))

    // Verificar estado inicial
    expect(result.current.orders).toEqual([])
    expect(result.current.pagination).toBeNull()
    expect(result.current.analytics).toBeNull()
    expect(result.current.filters).toEqual(initialFilters)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()

    // Verificar funciones disponibles
    expect(result.current.fetchOrders).toBeDefined()
    expect(result.current.updateFilters).toBeDefined()
    expect(result.current.refreshOrders).toBeDefined()
    expect(result.current.clearError).toBeDefined()
    expect(result.current.retryLastRequest).toBeDefined()
  })

  it('debe realizar fetch automático al inicializar cuando autoFetch está habilitado', async () => {
    renderHook(() => useOrdersEnterpriseStrict(initialFilters, { ...options, autoFetch: true }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/orders?page=1&limit=20&sort_by=created_at&sort_order=desc',
        expect.any(Object)
      )
    })
  })

  it('debe NO realizar fetch automático cuando autoFetch está deshabilitado', async () => {
    renderHook(() => useOrdersEnterpriseStrict(initialFilters, { ...options, autoFetch: false }))

    // Esperar un poco para asegurar que no se haga fetch
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('debe manejar el flujo completo de fetch exitoso', async () => {
    const { result } = renderHook(() => useOrdersEnterpriseStrict(initialFilters, options))

    await act(async () => {
      await result.current.fetchOrders()
    })

    await waitFor(() => {
      expect(result.current.orders).toEqual(mockOrdersResponse.orders)
      expect(result.current.pagination).toEqual(mockOrdersResponse.pagination)
      expect(result.current.analytics).toEqual(mockOrdersResponse.analytics)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  it('debe manejar errores de fetch correctamente', async () => {
    const errorMessage = 'Network error'
    mockFetch.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useOrdersEnterpriseStrict(initialFilters, options))

    await act(async () => {
      await result.current.fetchOrders()
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toBe(errorMessage)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.orders).toEqual([])
    })
  })

  it('debe usar cache cuando está disponible', async () => {
    // Configurar cache con datos válidos
    const cacheData = {
      data: mockOrdersResponse,
      timestamp: Date.now() - 30000, // 30 segundos atrás
      filters: initialFilters,
    }
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cacheData))

    const { result } = renderHook(() =>
      useOrdersEnterpriseStrict(initialFilters, { ...options, enableCache: true })
    )

    await act(async () => {
      await result.current.fetchOrders()
    })

    // Debe usar datos del cache sin hacer fetch
    expect(result.current.orders).toEqual(mockOrdersResponse.orders)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('debe actualizar filtros y refetch automáticamente', async () => {
    const { result } = renderHook(() => useOrdersEnterpriseStrict(initialFilters, options))

    const newFilters = { page: 2, status: 'confirmed' }

    await act(async () => {
      result.current.updateFilters(newFilters)
    })

    await waitFor(() => {
      expect(result.current.filters).toEqual({
        ...initialFilters,
        ...newFilters,
      })
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.any(Object))
    })
  })

  it('debe implementar retry logic en caso de fallo', async () => {
    // Fallar las primeras 2 llamadas, exitosa en la 3ra
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockOrdersResponse),
      })

    const { result } = renderHook(() =>
      useOrdersEnterpriseStrict(initialFilters, { ...options, maxRetries: 3 })
    )

    await act(async () => {
      await result.current.fetchOrders()
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result.current.orders).toEqual(mockOrdersResponse.orders)
      expect(result.current.error).toBeNull()
    })
  })

  it('debe manejar refresh correctamente', async () => {
    const { result } = renderHook(() => useOrdersEnterpriseStrict(initialFilters, options))

    // Fetch inicial
    await act(async () => {
      await result.current.fetchOrders()
    })

    // Limpiar mocks para el refresh
    jest.clearAllMocks()

    // Refresh
    await act(async () => {
      result.current.refreshOrders()
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  it('debe limpiar errores correctamente', async () => {
    mockFetch.mockRejectedValue(new Error('Test error'))

    const { result } = renderHook(() => useOrdersEnterpriseStrict(initialFilters, options))

    // Generar error
    await act(async () => {
      await result.current.fetchOrders()
    })

    expect(result.current.error).toBeTruthy()

    // Limpiar error
    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('debe implementar retry de último request', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useOrdersEnterpriseStrict(initialFilters, options))

    // Fetch que falla
    await act(async () => {
      await result.current.fetchOrders()
    })

    expect(result.current.error).toBeTruthy()

    // Configurar fetch exitoso para retry
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockOrdersResponse),
    })

    // Retry
    await act(async () => {
      await result.current.retryLastRequest()
    })

    await waitFor(() => {
      expect(result.current.orders).toEqual(mockOrdersResponse.orders)
      expect(result.current.error).toBeNull()
    })
  })

  it('debe abortar requests al desmontar', () => {
    const { unmount } = renderHook(() => useOrdersEnterpriseStrict(initialFilters, options))

    // Iniciar un request
    act(() => {
      // El fetch se inicia automáticamente con autoFetch
    })

    // Desmontar
    unmount()

    // Debe haber abortado el request
    expect(mockAbort).toHaveBeenCalled()
  })

  it('debe manejar múltiples actualizaciones de filtros sin race conditions', async () => {
    const { result } = renderHook(() => useOrdersEnterpriseStrict(initialFilters, options))

    // Múltiples actualizaciones rápidas
    await act(async () => {
      result.current.updateFilters({ page: 2 })
      result.current.updateFilters({ page: 3 })
      result.current.updateFilters({ page: 4 })
    })

    await waitFor(() => {
      expect(result.current.filters.page).toBe(4)
    })
  })

  it('debe mantener consistencia de estado durante operaciones asíncronas', async () => {
    const { result } = renderHook(() => useOrdersEnterpriseStrict(initialFilters, options))

    // Iniciar fetch
    act(() => {
      result.current.fetchOrders()
    })

    // Verificar estado de loading
    expect(result.current.isLoading).toBe(true)

    // Esperar a que termine
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verificar estado final
    expect(result.current.orders).toEqual(mockOrdersResponse.orders)
  })
})
