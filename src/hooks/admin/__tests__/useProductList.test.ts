/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useProductList } from '../useProductList'

// Mock fetch globally
global.fetch = jest.fn()

describe('useProductList Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should initialize with correct default state', () => {
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          products: [],
          total: 0,
          pagination: {
            page: 1,
            limit: 25,
            offset: 0,
            totalPages: 0,
            hasMore: false,
            hasPrevious: false,
          },
        },
        meta: {
          timestamp: '2025-08-23T00:00:00Z',
          method: 'GET',
          user: 'test-user',
          role: 'admin',
        },
      }),
    })

    const { result } = renderHook(() => useProductList())

    // Initial state should have loading true
    expect(result.current.isLoading).toBe(true)
    expect(result.current.products).toEqual([])
    expect(result.current.error).toBe(null)
  })

  it('should fetch products successfully', async () => {
    const mockProducts = [
      {
        id: 1,
        name: 'Test Product 1',
        description: 'Test Description 1',
        price: 1000,
        stock: 50,
        category_id: 1,
        images: {
          main: '/test1.jpg',
          gallery: [],
          previews: [],
          thumbnails: [],
        },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        category_name: 'Test Category',
      },
      {
        id: 2,
        name: 'Test Product 2',
        description: 'Test Description 2',
        price: 2000,
        stock: 30,
        category_id: 2,
        images: {
          main: '/test2.jpg',
          gallery: [],
          previews: [],
          thumbnails: [],
        },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        category_name: 'Test Category 2',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          products: mockProducts,
          total: 2,
          pagination: {
            page: 1,
            limit: 25,
            offset: 0,
            totalPages: 1,
            hasMore: false,
            hasPrevious: false,
          },
        },
        meta: {
          timestamp: '2025-08-23T00:00:00Z',
          method: 'GET',
          user: 'test-user',
          role: 'admin',
        },
      }),
    })

    const { result } = renderHook(() => useProductList())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.products).toEqual(mockProducts)
    expect(result.current.error).toBe(null)
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/products-direct?limit=25')
  })

  it('should handle API errors correctly', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    const { result } = renderHook(() => useProductList())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.products).toEqual([])
    expect(result.current.error).toBe('Error 500: Internal Server Error')
  })

  it('should handle network errors correctly', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useProductList())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.products).toEqual([])
    expect(result.current.error).toBe('Network error')
  })

  it('should handle invalid API response structure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Invalid request',
      }),
    })

    const { result } = renderHook(() => useProductList())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.products).toEqual([])
    expect(result.current.error).toBe('Estructura de respuesta inválida')
  })

  it('should handle missing products array in response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          total: 0,
          pagination: {
            page: 1,
            limit: 25,
            offset: 0,
            totalPages: 0,
            hasMore: false,
            hasPrevious: false,
          },
        },
      }),
    })

    const { result } = renderHook(() => useProductList())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.products).toEqual([])
    expect(result.current.error).toBe('Estructura de respuesta inválida')
  })

  it('should call fetch with correct URL and parameters', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          products: [],
          total: 0,
          pagination: {
            page: 1,
            limit: 25,
            offset: 0,
            totalPages: 0,
            hasMore: false,
            hasPrevious: false,
          },
        },
      }),
    })

    renderHook(() => useProductList())

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/admin/products-direct?limit=25')
  })

  it('should export correct TypeScript types', () => {
    // This test ensures the types are properly exported
    const { result } = renderHook(() => useProductList())

    // TypeScript compilation will fail if types are incorrect
    expect(typeof result.current.products).toBe('object')
    expect(typeof result.current.isLoading).toBe('boolean')
    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true)
  })
})
