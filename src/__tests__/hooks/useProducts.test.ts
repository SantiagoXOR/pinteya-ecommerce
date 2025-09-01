// ===================================
// PINTEYA E-COMMERCE - TEST useProducts HOOK
// ===================================

import { renderHook, waitFor, act } from '@testing-library/react'
import { useProducts } from '@/hooks/useProducts'

// Mock data
const mockProductsResponse = {
  success: true,
  data: [
    {
      id: 1,
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'Test description',
      price: 1000,
      discounted_price: 900,
      stock: 10,
      category_id: 1,
      images: { previews: ['/test1.jpg'] },
      category: { id: 1, name: 'Test Category', slug: 'test-category' },
    },
    {
      id: 2,
      name: 'Test Product 2',
      slug: 'test-product-2',
      description: 'Test description 2',
      price: 2000,
      discounted_price: null,
      stock: 5,
      category_id: 2,
      images: { previews: ['/test2.jpg'] },
      category: { id: 2, name: 'Test Category 2', slug: 'test-category-2' },
    },
  ],
  pagination: {
    page: 1,
    limit: 12,
    total: 2,
    totalPages: 1,
  },
}

const mockCategoriesResponse = {
  success: true,
  data: [
    { id: 1, name: 'Test Category', slug: 'test-category' },
    { id: 2, name: 'Test Category 2', slug: 'test-category-2' },
  ],
}

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Helper function to create complete mock response
const createMockResponse = (data: any, options: { ok?: boolean; status?: number; statusText?: string } = {}) => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  statusText: options.statusText ?? 'OK',
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers(),
  url: 'http://localhost:3000/api/products',
  clone: jest.fn(),
})

describe('useProducts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue(createMockResponse(mockProductsResponse))
  })

  it('fetches products on mount', async () => {
    const { result } = renderHook(() => useProducts())

    // Initially loading should be true
    expect(result.current.loading).toBe(true)
    expect(result.current.products).toEqual([])

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should have fetched products - the hook may not include default parameters
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products'),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    )
    expect(result.current.products).toHaveLength(2)
    // Products are adapted, so we check the adapted structure
    expect(result.current.products[0]).toBeDefined()
  })

  it('fetches products successfully', async () => {
    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should have fetched products
    expect(mockFetch).toHaveBeenCalled()
    expect(result.current.products).toHaveLength(2)
    expect(result.current.hasError).toBe(false)
  })

  it('handles search functionality', async () => {
    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear previous calls
    mockFetch.mockClear()

    // Mock search response
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ...mockProductsResponse,
      data: [mockProductsResponse.data[0]], // Only first product
    }))

    // Perform search
    await act(async () => {
      await result.current.searchProducts('Test Product 1')
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products'),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  it('handles category filtering', async () => {
    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear previous calls
    mockFetch.mockClear()

    // Mock category filter response
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ...mockProductsResponse,
      data: [mockProductsResponse.data[0]], // Only first product
    }))

    // Filter by category
    await act(async () => {
      await result.current.filterByCategory('1')
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/products\?.*category=1/),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  it('handles pagination', async () => {
    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear previous calls
    mockFetch.mockClear()

    // Mock page 2 response
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ...mockProductsResponse,
      pagination: { ...mockProductsResponse.pagination, page: 2 },
    }))

    // Go to page 2
    await act(async () => {
      await result.current.fetchProducts({ page: 2 })
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/products\?.*page=2/),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    )
    expect(result.current.pagination.page).toBe(2)
  })

  it('handles price range filtering', async () => {
    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear previous calls
    mockFetch.mockClear()

    // Mock price filter response
    mockFetch.mockResolvedValueOnce(createMockResponse(mockProductsResponse))

    // Filter by price range
    await act(async () => {
      await result.current.fetchProducts({ priceMin: 500, priceMax: 1500 })
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/products\?.*priceMin=500.*priceMax=1500/),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  it('handles sorting', async () => {
    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear previous calls
    mockFetch.mockClear()

    // Mock sort response
    mockFetch.mockResolvedValueOnce(createMockResponse(mockProductsResponse))

    // Sort by price ascending
    await act(async () => {
      await result.current.fetchProducts({ sortBy: 'price', sortOrder: 'asc' })
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/products\?.*sortBy=price.*sortOrder=asc/),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // getProducts() captura el error y devuelve un objeto con success: false
    // El hook useProducts entonces establece el mensaje genérico
    expect(result.current.error).toBe('Error obteniendo productos')
    expect(result.current.products).toEqual([])
  })

  it('handles HTTP error responses', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(
      { error: 'Server Error' },
      { ok: false, status: 500, statusText: 'Internal Server Error' }
    ))

    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // getProducts() usa safeApiResponseJson() que detecta !response.ok
    // y devuelve un objeto con success: false y message con detalles del error
    // El hook useProducts entonces establece el mensaje genérico
    expect(result.current.error).toBe('Error obteniendo productos')
    expect(result.current.products).toEqual([])
  })

  it('clears filters correctly', async () => {
    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Apply some filters first
    await act(async () => {
      await result.current.searchProducts('test')
    })

    await act(async () => {
      await result.current.filterByCategory('1')
    })

    // Clear previous calls
    mockFetch.mockClear()

    // Mock reset response
    mockFetch.mockResolvedValueOnce(createMockResponse(mockProductsResponse))

    // Clear filters
    await act(async () => {
      await result.current.clearFilters()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/products\?.*page=1/),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  it('maintains loading state during requests', async () => {
    const { result } = renderHook(() => useProducts())

    // Initial loading
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Mock slow response
    let resolvePromise: (value: any) => void
    const slowPromise = new Promise(resolve => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(slowPromise)

    // Start new request
    act(() => {
      result.current.searchProducts('test')
    })

    // Should be loading again
    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => mockProductsResponse,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})
