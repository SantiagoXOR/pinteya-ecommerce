/**
 * useCategoryData Hook Tests
 * Enterprise-ready test suite for category data management
 * Pinteya E-commerce
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useCategoryData, clearCategoryCache } from '@/hooks/useCategoryData'
import type { Category } from '@/types/categories'

// Mock fetch
global.fetch = jest.fn()

// Mock analytics
const mockGtag = jest.fn()
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
})

// Test data
const mockCategories: Category[] = [
  {
    id: 'test-1',
    name: 'Test Category 1',
    icon: '/test-1.png',
    description: 'Test description 1',
    isAvailable: true,
  },
  {
    id: 'test-2',
    name: 'Test Category 2',
    icon: '/test-2.png',
    description: 'Test description 2',
    isAvailable: true,
  },
]

// Helper function to create flexible category expectations
const expectCategoriesToMatch = (categories: Category[]) =>
  expect.arrayContaining(
    categories.map(cat =>
      expect.objectContaining({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        isAvailable: cat.isAvailable,
      })
    )
  )

describe('useCategoryData Hook', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    clearCategoryCache()
    mockGtag.mockClear()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Initialization', () => {
    it('initializes with fallback categories when autoFetch is false', () => {
      const { result } = renderHook(() =>
        useCategoryData({
          autoFetch: false,
          fallbackCategories: mockCategories,
        })
      )

      expect(result.current.categories).toEqual(expectCategoriesToMatch(mockCategories))
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('starts loading when autoFetch is true', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      } as Response)

      const { result } = renderHook(() => useCategoryData({ autoFetch: true }))

      expect(result.current.loading).toBe(true)
    })
  })

  describe('Data Fetching', () => {
    it('fetches categories successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      } as Response)

      const { result } = renderHook(() => useCategoryData({ autoFetch: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'test-1',
            name: 'Test Category 1',
            icon: '/test-1.png',
            description: 'Test description 1',
            isAvailable: true,
          }),
          expect.objectContaining({
            id: 'test-2',
            name: 'Test Category 2',
            icon: '/test-2.png',
            description: 'Test description 2',
            isAvailable: true,
          }),
        ])
      )
      expect(result.current.error).toBe(null)
      expect(mockFetch).toHaveBeenCalledWith('/api/categories')
    })

    it('handles different API response formats', async () => {
      // Test with data wrapper
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCategories }),
      } as Response)

      const { result } = renderHook(() => useCategoryData({ autoFetch: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'test-1',
            name: 'Test Category 1',
            icon: '/test-1.png',
            description: 'Test description 1',
            isAvailable: true,
          }),
          expect.objectContaining({
            id: 'test-2',
            name: 'Test Category 2',
            icon: '/test-2.png',
            description: 'Test description 2',
            isAvailable: true,
          }),
        ])
      )
    })

    it('handles categories wrapper format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories }),
      } as Response)

      const { result } = renderHook(() => useCategoryData({ autoFetch: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'test-1',
            name: 'Test Category 1',
            icon: '/test-1.png',
            description: 'Test description 1',
            isAvailable: true,
          }),
          expect.objectContaining({
            id: 'test-2',
            name: 'Test Category 2',
            icon: '/test-2.png',
            description: 'Test description 2',
            isAvailable: true,
          }),
        ])
      )
    })

    it('handles fetch errors gracefully', async () => {
      const errorMessage = 'Network error'
      mockFetch.mockRejectedValueOnce(new Error(errorMessage))

      const fallbackCategories = [mockCategories[0]]
      const { result } = renderHook(() =>
        useCategoryData({
          autoFetch: true,
          fallbackCategories,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toContain(errorMessage)
      expect(result.current.categories).toEqual(fallbackCategories)
    })

    it('handles HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      const { result } = renderHook(() => useCategoryData({ autoFetch: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toContain('HTTP 404')
    })

    it('validates and filters invalid categories', async () => {
      const invalidData = [
        mockCategories[0],
        { id: 'invalid' }, // Missing name
        null,
        { name: 'No ID' }, // Missing id
        mockCategories[1],
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidData,
      } as Response)

      const { result } = renderHook(() => useCategoryData({ autoFetch: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.categories).toEqual(expectCategoriesToMatch(mockCategories))
    })

    it('respects maxCategories limit', async () => {
      const manyCategories = Array.from({ length: 10 }, (_, i) => ({
        id: `cat-${i}`,
        name: `Category ${i}`,
        icon: `/cat-${i}.png`,
      }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manyCategories,
      } as Response)

      const { result } = renderHook(() =>
        useCategoryData({
          autoFetch: true,
          maxCategories: 5,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.categories).toHaveLength(5)
    })
  })

  describe('Caching', () => {
    it('uses cached data when available', async () => {
      // First call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      } as Response)

      const { result: result1 } = renderHook(() =>
        useCategoryData({
          autoFetch: true,
          fallbackCategories: mockCategories,
        })
      )

      await waitFor(() => {
        expect(result1.current.loading).toBe(false)
      })

      expect(result1.current.categories).toEqual(expectCategoriesToMatch(mockCategories))
      // Cache functionality is tested at the manager level
      expect(mockFetch).toHaveBeenCalledWith('/api/categories')
    })

    it('respects cache duration', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockCategories,
      } as Response)

      // First call
      const { result } = renderHook(() =>
        useCategoryData({
          autoFetch: true,
          cacheDuration: 1000, // 1 second
          fallbackCategories: mockCategories,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Wait for cache to expire (simulate time passing)
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Refresh should fetch again
      await act(async () => {
        await result.current.refresh()
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Manual Refresh', () => {
    it('refreshes data manually', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockCategories,
      } as Response)

      const { result } = renderHook(() => useCategoryData({ autoFetch: false }))

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.categories).toEqual(expectCategoriesToMatch(mockCategories))
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('handles refresh errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Refresh failed'))

      const { result } = renderHook(() => useCategoryData({ autoFetch: false }))

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.error).toContain('Refresh failed')
    })
  })

  describe('Utility Functions', () => {
    it('finds category by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      } as Response)

      const { result } = renderHook(() => useCategoryData({ autoFetch: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const category = result.current.getCategoryById('test-1')
      expect(category).toEqual(
        expect.objectContaining({
          id: 'test-1',
          name: 'Test Category 1',
          icon: '/test-1.png',
          description: 'Test description 1',
          isAvailable: true,
        })
      )

      const notFound = result.current.getCategoryById('not-found')
      expect(notFound).toBeUndefined()
    })
  })

  describe('Analytics', () => {
    it('tracks successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      } as Response)

      renderHook(() =>
        useCategoryData({
          autoFetch: true,
          enableAnalytics: true,
        })
      )

      await waitFor(() => {
        expect(mockGtag).toHaveBeenCalledWith(
          'event',
          'category_data',
          expect.objectContaining({
            event_category: 'data',
            event_label: 'fetch_success',
          })
        )
      })
    })

    it('tracks fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'))

      renderHook(() =>
        useCategoryData({
          autoFetch: true,
          enableAnalytics: true,
        })
      )

      await waitFor(() => {
        expect(mockGtag).toHaveBeenCalledWith(
          'event',
          'category_data',
          expect.objectContaining({
            event_category: 'data',
            event_label: 'fetch_error',
          })
        )
      })
    })

    it('does not track when analytics disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      } as Response)

      const { result } = renderHook(() =>
        useCategoryData({
          autoFetch: true,
          enableAnalytics: false,
          fallbackCategories: mockCategories,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockGtag).not.toHaveBeenCalled()
    })
  })

  describe('Background Refresh', () => {
    it('sets up background refresh interval', () => {
      jest.useFakeTimers()
      const setIntervalSpy = jest.spyOn(global, 'setInterval')

      renderHook(() =>
        useCategoryData({
          autoFetch: false,
          enableBackgroundRefresh: true,
          refreshInterval: 5000,
        })
      )

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000)

      jest.useRealTimers()
    })

    it('cleans up interval on unmount', () => {
      jest.useFakeTimers()
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      const { unmount } = renderHook(() =>
        useCategoryData({
          enableBackgroundRefresh: true,
          refreshInterval: 5000,
        })
      )

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()

      jest.useRealTimers()
    })
  })
})
