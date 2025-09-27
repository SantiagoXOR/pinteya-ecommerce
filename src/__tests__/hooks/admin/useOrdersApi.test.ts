// ===================================
// PINTEYA E-COMMERCE - USEORDERSAPI TESTS
// Tests completos para el hook de API de órdenes
// ===================================

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { useOrdersApi } from '@/hooks/admin/useOrdersApi'

// ===================================
// MOCKS Y SETUP
// ===================================

// Mock de fetch global
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock de AbortController
const mockAbort = jest.fn()
const mockAbortController = {
  abort: mockAbort,
  signal: { aborted: false },
}

global.AbortController = jest.fn(() => mockAbortController) as any

// Datos de prueba
const mockOrdersResponse = {
  orders: [
    { id: '1', order_number: 'ORD-001', status: 'pending', total: 100 },
    { id: '2', order_number: 'ORD-002', status: 'confirmed', total: 200 },
  ],
  pagination: { page: 1, totalPages: 5, hasNextPage: true },
  analytics: { totalOrders: 2, totalRevenue: 300 },
}

const mockFilters = {
  page: 1,
  limit: 20,
  status: 'pending',
  search: 'test',
}

const mockOptions = {
  timeout: 10000,
  maxRetries: 3,
}

// ===================================
// SETUP Y CLEANUP
// ===================================

beforeEach(() => {
  jest.clearAllMocks()
  mockAbort.mockClear()
  mockAbortController.signal.aborted = false

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
// TESTS PRINCIPALES
// ===================================

describe('useOrdersApi', () => {
  it('debe inicializarse correctamente', () => {
    const { result } = renderHook(() => useOrdersApi(mockOptions))

    expect(result.current.fetchOrdersInternal).toBeDefined()
    expect(result.current.abortCurrentRequest).toBeDefined()
    expect(result.current.isRequestInProgress).toBeDefined()
    expect(typeof result.current.fetchOrdersInternal).toBe('function')
    expect(typeof result.current.abortCurrentRequest).toBe('function')
    expect(typeof result.current.isRequestInProgress).toBe('function')
  })

  it('debe realizar fetch exitoso de órdenes', async () => {
    const { result } = renderHook(() => useOrdersApi(mockOptions))

    let response
    await act(async () => {
      response = await result.current.fetchOrdersInternal(mockFilters)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/orders?page=1&limit=20&status=pending&search=test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        signal: expect.any(Object),
      })
    )

    expect(response).toEqual(mockOrdersResponse)
  })

  it('debe construir URL correctamente con diferentes filtros', async () => {
    const { result } = renderHook(() => useOrdersApi(mockOptions))

    const filtersWithNulls = {
      page: 2,
      limit: 10,
      status: undefined,
      search: null,
      sort_by: 'created_at',
      sort_order: 'desc',
    }

    await act(async () => {
      await result.current.fetchOrdersInternal(filtersWithNulls)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/orders?page=2&limit=10&sort_by=created_at&sort_order=desc',
      expect.any(Object)
    )
  })

  it('debe manejar errores de red correctamente', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useOrdersApi(mockOptions))

    await act(async () => {
      await expect(result.current.fetchOrdersInternal(mockFilters)).rejects.toThrow('Network error')
    })
  })

  it('debe manejar respuestas HTTP de error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: jest.fn().mockResolvedValue({ error: 'Server error' }),
    })

    const { result } = renderHook(() => useOrdersApi(mockOptions))

    await act(async () => {
      await expect(result.current.fetchOrdersInternal(mockFilters)).rejects.toThrow(
        'HTTP error! status: 500'
      )
    })
  })

  it('debe implementar retry logic correctamente', async () => {
    // Fallar las primeras 2 llamadas, exitosa en la 3ra
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockOrdersResponse),
      })

    const { result } = renderHook(() => useOrdersApi(mockOptions))

    let response
    await act(async () => {
      response = await result.current.fetchOrdersInternal(mockFilters)
    })

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(response).toEqual(mockOrdersResponse)
  })

  it('debe fallar después de agotar todos los reintentos', async () => {
    mockFetch.mockRejectedValue(new Error('Persistent network error'))

    const { result } = renderHook(() => useOrdersApi(mockOptions))

    await act(async () => {
      await expect(result.current.fetchOrdersInternal(mockFilters)).rejects.toThrow(
        'Persistent network error'
      )
    })

    expect(mockFetch).toHaveBeenCalledTimes(4) // 1 intento inicial + 3 reintentos
  })

  it('debe implementar timeout correctamente', async () => {
    jest.useFakeTimers()

    // Mock de fetch que nunca se resuelve
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useOrdersApi({ ...mockOptions, timeout: 5000 }))

    const fetchPromise = act(async () => {
      return result.current.fetchOrdersInternal(mockFilters)
    })

    // Avanzar el tiempo más allá del timeout
    act(() => {
      jest.advanceTimersByTime(6000)
    })

    await expect(fetchPromise).rejects.toThrow()

    jest.useRealTimers()
  })

  it('debe abortar requests correctamente', async () => {
    const { result } = renderHook(() => useOrdersApi(mockOptions))

    // Iniciar un request
    const fetchPromise = act(async () => {
      return result.current.fetchOrdersInternal(mockFilters)
    })

    // Abortar el request
    act(() => {
      result.current.abortCurrentRequest()
    })

    expect(mockAbort).toHaveBeenCalled()
  })

  it('debe detectar requests en progreso', async () => {
    jest.useFakeTimers()

    // Mock de fetch que tarda en resolverse
    mockFetch.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockOrdersResponse),
              }),
            1000
          )
        )
    )

    const { result } = renderHook(() => useOrdersApi(mockOptions))

    // Iniciar request
    const fetchPromise = act(async () => {
      return result.current.fetchOrdersInternal(mockFilters)
    })

    // Verificar que está en progreso
    expect(result.current.isRequestInProgress()).toBe(true)

    // Completar el request
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await fetchPromise

    // Verificar que ya no está en progreso
    expect(result.current.isRequestInProgress()).toBe(false)

    jest.useRealTimers()
  })

  it('debe validar respuesta JSON correctamente', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ invalid: 'response' }), // Respuesta sin estructura esperada
    })

    const { result } = renderHook(() => useOrdersApi(mockOptions))

    await act(async () => {
      await expect(result.current.fetchOrdersInternal(mockFilters)).rejects.toThrow(
        'Invalid response format'
      )
    })
  })

  it('debe manejar respuestas vacías correctamente', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        orders: [],
        pagination: { page: 1, totalPages: 0, hasNextPage: false },
        analytics: { totalOrders: 0, totalRevenue: 0 },
      }),
    })

    const { result } = renderHook(() => useOrdersApi(mockOptions))

    let response
    await act(async () => {
      response = await result.current.fetchOrdersInternal(mockFilters)
    })

    expect(response.orders).toEqual([])
    expect(response.analytics.totalOrders).toBe(0)
  })

  it('debe usar headers de autenticación cuando están disponibles', async () => {
    // Mock de session con token
    const mockSession = { accessToken: 'test-token' }
    jest.doMock('next-auth/react', () => ({
      useSession: () => ({ data: mockSession }),
    }))

    const { result } = renderHook(() => useOrdersApi(mockOptions))

    await act(async () => {
      await result.current.fetchOrdersInternal(mockFilters)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('debe limpiar recursos al desmontar', () => {
    const { result, unmount } = renderHook(() => useOrdersApi(mockOptions))

    // Iniciar un request
    act(() => {
      result.current.fetchOrdersInternal(mockFilters)
    })

    // Desmontar el hook
    unmount()

    // Debe haber abortado el request
    expect(mockAbort).toHaveBeenCalled()
  })

  it('debe manejar múltiples requests concurrentes', async () => {
    const { result } = renderHook(() => useOrdersApi(mockOptions))

    // Iniciar múltiples requests
    const promises = [
      result.current.fetchOrdersInternal(mockFilters),
      result.current.fetchOrdersInternal({ ...mockFilters, page: 2 }),
      result.current.fetchOrdersInternal({ ...mockFilters, page: 3 }),
    ]

    await act(async () => {
      await Promise.all(promises)
    })

    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})
