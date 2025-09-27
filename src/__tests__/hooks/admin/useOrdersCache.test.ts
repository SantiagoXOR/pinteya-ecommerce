// ===================================
// PINTEYA E-COMMERCE - USEORDERSCACHE TESTS
// Tests completos para el hook de cache de órdenes
// ===================================

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { useOrdersCache } from '@/hooks/admin/useOrdersCache'

// ===================================
// MOCKS Y SETUP
// ===================================

// Mock de localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Mock de Date para tests determinísticos
const mockDate = new Date('2025-01-01T12:00:00.000Z')
jest.useFakeTimers()
jest.setSystemTime(mockDate)

// Datos de prueba
const mockOrdersData = {
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

const mockCacheOptions = {
  enableCache: true,
  cacheTimeout: 300000, // 5 minutos
  maxSize: 50,
  cleanupInterval: 600000, // 10 minutos
  minRequestInterval: 1000, // 1 segundo
}

// ===================================
// SETUP Y CLEANUP
// ===================================

beforeEach(() => {
  jest.clearAllMocks()
  mockLocalStorage.getItem.mockReturnValue(null)
})

afterEach(() => {
  jest.clearAllTimers()
})

// ===================================
// TESTS PRINCIPALES
// ===================================

describe('useOrdersCache', () => {
  it('debe inicializarse correctamente', () => {
    const { result } = renderHook(() => useOrdersCache(mockCacheOptions))

    expect(result.current.getCachedData).toBeDefined()
    expect(result.current.setCachedData).toBeDefined()
    expect(result.current.clearCache).toBeDefined()
    expect(result.current.isRequestTooRecent).toBeDefined()
    expect(result.current.getCacheStats).toBeDefined()
    expect(typeof result.current.getCachedData).toBe('function')
    expect(typeof result.current.setCachedData).toBe('function')
    expect(typeof result.current.clearCache).toBe('function')
    expect(typeof result.current.isRequestTooRecent).toBe('function')
    expect(typeof result.current.getCacheStats).toBe('function')
  })

  it('debe retornar null cuando no hay datos en cache', () => {
    const { result } = renderHook(() => useOrdersCache(mockCacheOptions))

    const cachedData = result.current.getCachedData(mockFilters)
    expect(cachedData).toBeNull()
  })

  it('debe guardar datos en cache correctamente', () => {
    const { result } = renderHook(() => useOrdersCache(mockCacheOptions))

    act(() => {
      result.current.setCachedData(mockFilters, mockOrdersData)
    })

    // Verificar que se guardó en el cache interno (no localStorage en esta implementación)
    const cachedData = result.current.getCachedData(mockFilters)
    expect(cachedData).toEqual(mockOrdersData)
  })

  it('debe recuperar datos del cache cuando están disponibles y son válidos', () => {
    const { result } = renderHook(() => useOrdersCache(mockCacheOptions))

    // Primero guardar datos
    act(() => {
      result.current.setCachedData(mockFilters, mockOrdersData)
    })

    // Luego recuperar
    const cachedData = result.current.getCachedData(mockFilters)
    expect(cachedData).toEqual(mockOrdersData)
  })

  it('debe retornar null cuando los datos del cache están expirados', () => {
    // Usar opciones con timeout muy corto para simular expiración
    const shortTimeoutOptions = { ...mockCacheOptions, cacheTimeout: 100 }
    const { result } = renderHook(() => useOrdersCache(shortTimeoutOptions))

    // Guardar datos
    act(() => {
      result.current.setCachedData(mockFilters, mockOrdersData)
    })

    // Simular paso del tiempo
    jest.advanceTimersByTime(200)

    // Los datos deben estar expirados
    const cachedData = result.current.getCachedData(mockFilters)
    expect(cachedData).toBeNull()
  })

  it('debe limpiar cache correctamente', () => {
    const { result } = renderHook(() => useOrdersCache(mockCacheOptions))

    // Guardar algunos datos
    act(() => {
      result.current.setCachedData(mockFilters, mockOrdersData)
    })

    // Verificar que están en cache
    expect(result.current.getCachedData(mockFilters)).toEqual(mockOrdersData)

    // Limpiar cache
    act(() => {
      result.current.clearCache()
    })

    // Verificar que se limpiaron
    expect(result.current.getCachedData(mockFilters)).toBeNull()
  })

  it('debe limpiar todo el cache cuando se llama clearCache', () => {
    const { result } = renderHook(() => useOrdersCache(mockCacheOptions))

    // Guardar múltiples entradas en cache
    const filters1 = { ...mockFilters, page: 1 }
    const filters2 = { ...mockFilters, page: 2 }

    act(() => {
      result.current.setCachedData(filters1, mockOrdersData)
      result.current.setCachedData(filters2, mockOrdersData)
    })

    // Verificar que están en cache
    expect(result.current.getCachedData(filters1)).toEqual(mockOrdersData)
    expect(result.current.getCachedData(filters2)).toEqual(mockOrdersData)

    // Limpiar todo el cache
    act(() => {
      result.current.clearCache()
    })

    // Verificar que se limpiaron todas las entradas
    expect(result.current.getCachedData(filters1)).toBeNull()
    expect(result.current.getCachedData(filters2)).toBeNull()
  })

  it('debe detectar requests demasiado recientes (anti-spam)', () => {
    const { result } = renderHook(() => useOrdersCache(mockCacheOptions))

    // Simular un request reciente guardando datos
    act(() => {
      result.current.setCachedData(mockFilters, mockOrdersData)
    })

    // Inmediatamente después, debe detectar que es demasiado reciente
    const isTooRecent = result.current.isRequestTooRecent(mockFilters)
    expect(isTooRecent).toBe(true)
  })

  it('debe permitir requests cuando ha pasado suficiente tiempo', () => {
    const { result } = renderHook(() => useOrdersCache(mockCacheOptions))

    // Simular un request y luego avanzar el tiempo
    act(() => {
      result.current.setCachedData(mockFilters, mockOrdersData)
    })

    // Avanzar tiempo más allá del intervalo mínimo
    jest.advanceTimersByTime(2000)

    const isTooRecent = result.current.isRequestTooRecent(mockFilters)
    expect(isTooRecent).toBe(false)
  })

  it('debe manejar cache stats correctamente', () => {
    const { result } = renderHook(() => useOrdersCache(mockCacheOptions))

    // Verificar stats iniciales
    const initialStats = result.current.getCacheStats()
    expect(initialStats.size).toBe(0)
    expect(initialStats.maxSize).toBeGreaterThan(0)

    // Agregar datos al cache
    act(() => {
      result.current.setCachedData(mockFilters, mockOrdersData)
    })

    // Verificar que las stats se actualizaron
    const updatedStats = result.current.getCacheStats()
    expect(updatedStats.size).toBe(1)
  })

  it('debe manejar filtros con valores undefined/null', () => {
    const filtersWithNulls = {
      page: 1,
      limit: 20,
      status: undefined,
      search: null,
    }

    const { result } = renderHook(() => useOrdersCache(mockCacheOptions))

    // Debe poder guardar y recuperar datos con filtros que tienen valores null/undefined
    act(() => {
      result.current.setCachedData(filtersWithNulls, mockOrdersData)
    })

    const cachedData = result.current.getCachedData(filtersWithNulls)
    expect(cachedData).toEqual(mockOrdersData)
  })

  it('debe manejar múltiples entradas en cache', () => {
    const { result } = renderHook(() => useOrdersCache())

    // Agregar múltiples entradas al cache
    const filters1 = { ...mockFilters, page: 1 }
    const filters2 = { ...mockFilters, page: 2 }
    const filters3 = { ...mockFilters, page: 3 }

    act(() => {
      result.current.setCachedData(filters1, mockOrdersData)
      result.current.setCachedData(filters2, mockOrdersData)
      result.current.setCachedData(filters3, mockOrdersData)
    })

    // Verificar que todas las entradas están en cache
    expect(result.current.getCachedData(filters1)).toEqual(mockOrdersData)
    expect(result.current.getCachedData(filters2)).toEqual(mockOrdersData)
    expect(result.current.getCachedData(filters3)).toEqual(mockOrdersData)

    // Verificar stats
    const stats = result.current.getCacheStats()
    expect(stats.size).toBe(3)
  })

  it('debe manejar cache deshabilitado', () => {
    const disabledCacheOptions = { ...mockCacheOptions, enableCache: false }
    const { result } = renderHook(() => useOrdersCache(disabledCacheOptions))

    // Intentar guardar datos
    act(() => {
      result.current.setCachedData(mockFilters, mockOrdersData)
    })

    // No debe retornar datos cuando el cache está deshabilitado
    const cachedData = result.current.getCachedData(mockFilters)
    expect(cachedData).toBeNull()

    // Las stats deben mostrar cache vacío
    const stats = result.current.getCacheStats()
    expect(stats.size).toBe(0)
  })
})
