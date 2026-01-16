/**
 * Unified Categories Hook
 * Pinteya E-commerce - Main hook for fetching and managing categories
 * 
 * This hook replaces useCategories and useCategoryData with a unified implementation.
 * It uses TanStack Query for caching and the new CategoryService for data access.
 */

'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { fetchCategories } from '../api/client'
import type { Category, CategoryFilters } from '../types'

export interface UseCategoriesOptions {
  /** Initial filters to apply */
  initialFilters?: CategoryFilters
  /** Whether to automatically fetch on mount */
  autoFetch?: boolean
  /** Stale time in milliseconds (default: 10 minutes) */
  staleTime?: number
  /** Cache time in milliseconds (default: 30 minutes) */
  gcTime?: number
  /** Whether to refetch on window focus */
  refetchOnWindowFocus?: boolean
  /** Whether to refetch on mount */
  refetchOnMount?: boolean
}

export interface UseCategoriesReturn {
  /** Array of categories */
  categories: Category[]
  /** Whether data is currently loading */
  isLoading: boolean
  /** Whether data is being fetched */
  isFetching: boolean
  /** Error object if fetch failed */
  error: Error | null
  /** Whether there was an error */
  isError: boolean
  /** Manually refetch categories */
  refetch: () => Promise<void>
  /** Update filters and refetch */
  updateFilters: (newFilters: CategoryFilters) => void
  /** Current filters */
  filters: CategoryFilters
  /** Get category by ID */
  getCategoryById: (id: string | number) => Category | undefined
  /** Get category by slug */
  getCategoryBySlug: (slug: string) => Category | undefined
}

/**
 * Query key factory for categories
 */
export const categoryQueryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryQueryKeys.all, 'list'] as const,
  list: (filters?: CategoryFilters) => [...categoryQueryKeys.lists(), filters] as const,
  detail: (id: string | number) => [...categoryQueryKeys.all, 'detail', id] as const,
  slug: (slug: string) => [...categoryQueryKeys.all, 'slug', slug] as const,
}

/**
 * Main hook for fetching categories
 */
export function useCategories(
  options: UseCategoriesOptions = {}
): UseCategoriesReturn {
  const {
    initialFilters = {},
    autoFetch = true,
    staleTime = 10 * 60 * 1000, // 10 minutes
    gcTime = 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus = false,
    refetchOnMount = false,
  } = options

  const queryClient = useQueryClient()

  // Memoize initial filters
  const memoizedInitialFilters = useMemo(() => initialFilters, [
    JSON.stringify(initialFilters),
  ])

  // Maintain filters in state
  const [filters, setFilters] = useState<CategoryFilters>(memoizedInitialFilters)
  const prevInitialFiltersRef = useRef(memoizedInitialFilters)

  // Get cached data immediately to avoid loading state
  const queryKey = categoryQueryKeys.list(filters)
  const cachedData = queryClient.getQueryData<Category[]>(queryKey)

  // Sync filters when initialFilters changes
  useEffect(() => {
    const prevFilters = prevInitialFiltersRef.current
    const hasChanges =
      JSON.stringify(prevFilters) !== JSON.stringify(memoizedInitialFilters)

    if (hasChanges) {
      setFilters(memoizedInitialFilters)
      prevInitialFiltersRef.current = memoizedInitialFilters
    }
  }, [memoizedInitialFilters])

  // Query using TanStack Query
  const {
    data = [],
    isLoading,
    isFetching,
    error,
    isError,
    refetch: refetchQuery,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<Category[]> => {
      return fetchCategories(filters)
    },
    staleTime,
    gcTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus,
    // ✅ FIX: Refetch cuando no hay datos en cache después de navegar
    refetchOnMount: refetchOnMount || (!cachedData && autoFetch),
    refetchOnReconnect: false,
    enabled: autoFetch,
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
    initialData: cachedData,
    placeholderData: (previousData) => previousData || cachedData,
    structuralSharing: true,
  })

  /**
   * Update filters and refetch
   */
  const updateFilters = useCallback(
    (newFilters: CategoryFilters) => {
      setFilters(newFilters)
    },
    []
  )

  /**
   * Manually refetch categories
   */
  const refetch = useCallback(async () => {
    await refetchQuery()
  }, [refetchQuery])

  /**
   * Get category by ID
   */
  const getCategoryById = useCallback(
    (id: string | number): Category | undefined => {
      const idStr = String(id)
      return data.find(cat => cat.id === idStr)
    },
    [data]
  )

  /**
   * Get category by slug
   */
  const getCategoryBySlug = useCallback(
    (slug: string): Category | undefined => {
      return data.find(cat => cat.slug === slug)
    },
    [data]
  )

  return {
    categories: data,
    isLoading,
    isFetching,
    error: error as Error | null,
    isError,
    refetch,
    updateFilters,
    filters,
    getCategoryById,
    getCategoryBySlug,
  }
}
