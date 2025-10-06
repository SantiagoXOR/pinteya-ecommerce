// ===================================
// SUPABASE PERFORMANCE HOOKS
// ===================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSupabaseOptimization } from './index'
import { getSupabaseMonitoring } from './monitoring'

// ===================================
// INTERFACES
// ===================================

interface UseQueryOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  refetchInterval?: number
  cacheTime?: number
  staleTime?: number
  retry?: number
  retryDelay?: number
}

interface QueryState<T> {
  data: T | null
  isLoading: boolean
  isError: boolean
  error: any
  isSuccess: boolean
  isFetching: boolean
  refetch: () => Promise<void>
}

interface MutationState<T> {
  data: T | null
  isLoading: boolean
  isError: boolean
  error: any
  isSuccess: boolean
  mutate: (variables?: any) => Promise<T | null>
  reset: () => void
}

// ===================================
// CORE QUERY HOOK
// ===================================

export function useSupabaseQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: UseQueryOptions = {}
): QueryState<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 0,
    retry = 3,
    retryDelay = 1000,
  } = options

  const { cache, handleError } = useSupabaseOptimization()
  const monitoring = getSupabaseMonitoring()

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    isFetching: false,
    refetch: async () => {},
  })

  const cacheKey = queryKey.join(':')

  const executeQuery = useCallback(
    async (retryCount = 0): Promise<void> => {
      if (!enabled) return

      setState(prev => ({ ...prev, isFetching: true, isLoading: prev.data === null }))

      const startTime = Date.now()

      try {
        // Check cache first
        const cachedData = cache.get(cacheKey)
        if (cachedData && Date.now() - cachedData.timestamp < staleTime) {
          setState({
            data: cachedData.data,
            isLoading: false,
            isError: false,
            error: null,
            isSuccess: true,
            isFetching: false,
            refetch: executeQuery,
          })
          monitoring.trackRequest(true, Date.now() - startTime)
          return
        }

        // Execute query
        const result = await queryFn()

        // Cache the result
        cache.set(cacheKey, result, cacheTime)

        setState({
          data: result,
          isLoading: false,
          isError: false,
          error: null,
          isSuccess: true,
          isFetching: false,
          refetch: executeQuery,
        })

        monitoring.trackRequest(true, Date.now() - startTime)
      } catch (error) {
        const handledError = handleError(error)

        // Retry logic
        if (retryCount < retry) {
          setTimeout(
            () => {
              executeQuery(retryCount + 1)
            },
            retryDelay * Math.pow(2, retryCount)
          ) // Exponential backoff
          return
        }

        setState({
          data: null,
          isLoading: false,
          isError: true,
          error: handledError,
          isSuccess: false,
          isFetching: false,
          refetch: executeQuery,
        })

        monitoring.trackRequest(false, Date.now() - startTime)
      }
    },
    [
      queryFn,
      enabled,
      cacheKey,
      cache,
      handleError,
      monitoring,
      staleTime,
      cacheTime,
      retry,
      retryDelay,
    ]
  )

  // Initial fetch
  useEffect(() => {
    executeQuery()
  }, [executeQuery])

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return

    const interval = setInterval(() => {
      executeQuery()
    }, refetchInterval)

    return () => clearInterval(interval)
  }, [refetchInterval, enabled, executeQuery])

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return

    const handleFocus = () => executeQuery()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, enabled, executeQuery])

  return useMemo(
    () => ({
      ...state,
      refetch: executeQuery,
    }),
    [state, executeQuery]
  )
}

// ===================================
// MUTATION HOOK
// ===================================

export function useSupabaseMutation<T, V = any>(
  mutationFn: (variables: V) => Promise<T>,
  options: {
    onSuccess?: (data: T, variables: V) => void
    onError?: (error: any, variables: V) => void
    onSettled?: (data: T | null, error: any, variables: V) => void
  } = {}
): MutationState<T> {
  const { handleError } = useSupabaseOptimization()
  const monitoring = getSupabaseMonitoring()

  const [state, setState] = useState<MutationState<T>>({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    mutate: async () => null,
    reset: () => {},
  })

  const mutate = useCallback(
    async (variables?: V): Promise<T | null> => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
        isSuccess: false,
      }))

      const startTime = Date.now()

      try {
        const result = await mutationFn(variables as V)

        setState(prev => ({
          ...prev,
          data: result,
          isLoading: false,
          isSuccess: true,
        }))

        monitoring.trackRequest(true, Date.now() - startTime)
        options.onSuccess?.(result, variables as V)
        options.onSettled?.(result, null, variables as V)

        return result
      } catch (error) {
        const handledError = handleError(error)

        setState(prev => ({
          ...prev,
          isLoading: false,
          isError: true,
          error: handledError,
        }))

        monitoring.trackRequest(false, Date.now() - startTime)
        options.onError?.(handledError, variables as V)
        options.onSettled?.(null, handledError, variables as V)

        return null
      }
    },
    [mutationFn, handleError, monitoring, options]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
      mutate,
      reset: () => {},
    })
  }, [mutate])

  return useMemo(
    () => ({
      ...state,
      mutate,
      reset,
    }),
    [state, mutate, reset]
  )
}

// ===================================
// SPECIALIZED HOOKS
// ===================================

// Products hooks
export function useProducts(filters?: any, options?: UseQueryOptions) {
  const { optimizer } = useSupabaseOptimization()

  return useSupabaseQuery(
    ['products', JSON.stringify(filters)],
    () => optimizer.getProducts(filters),
    options
  )
}

export function useProduct(id: string, options?: UseQueryOptions) {
  const { optimizer } = useSupabaseOptimization()

  return useSupabaseQuery(['product', id], () => optimizer.getProductById(id), {
    ...options,
    enabled: !!id && (options?.enabled ?? true),
  })
}

export function useProductSearch(query: string, options?: UseQueryOptions) {
  const { optimizer } = useSupabaseOptimization()

  return useSupabaseQuery(['product-search', query], () => optimizer.searchProducts(query), {
    ...options,
    enabled: query.length >= 2 && (options?.enabled ?? true),
    staleTime: 30000, // 30 seconds
  })
}

// Categories hooks
export function useCategories(options?: UseQueryOptions) {
  const { optimizer } = useSupabaseOptimization()

  return useSupabaseQuery(
    ['categories'],
    () => optimizer.getCategories(),
    { ...options, staleTime: 5 * 60 * 1000 } // 5 minutes
  )
}

// Orders hooks
export function useUserOrders(userId: string, options?: UseQueryOptions) {
  const { optimizer } = useSupabaseOptimization()

  return useSupabaseQuery(['user-orders', userId], () => optimizer.getUserOrders(userId), {
    ...options,
    enabled: !!userId && (options?.enabled ?? true),
  })
}

export function useOrder(orderId: string, options?: UseQueryOptions) {
  const { optimizer } = useSupabaseOptimization()

  return useSupabaseQuery(['order', orderId], () => optimizer.getOrderById(orderId), {
    ...options,
    enabled: !!orderId && (options?.enabled ?? true),
  })
}

// Analytics hooks
export function useBestSellingProducts(limit = 10, options?: UseQueryOptions) {
  const { optimizer } = useSupabaseOptimization()

  return useSupabaseQuery(
    ['best-selling-products', limit.toString()],
    () => optimizer.getBestSellingProducts(limit),
    { ...options, staleTime: 10 * 60 * 1000 } // 10 minutes
  )
}

export function useSalesStats(period?: string, options?: UseQueryOptions) {
  const { optimizer } = useSupabaseOptimization()

  return useSupabaseQuery(
    ['sales-stats', period || 'all'],
    () => optimizer.getSalesStats(period),
    { ...options, staleTime: 5 * 60 * 1000 } // 5 minutes
  )
}

// ===================================
// MUTATION HOOKS
// ===================================

export function useCreateProduct() {
  const { optimizer } = useSupabaseOptimization()

  return useSupabaseMutation(
    async (productData: any) => {
      // Implementation would depend on your product creation logic
      const result = await optimizer.supabase.from('products').insert(productData).select().single()

      if (result.error) throw result.error

      // Invalidate related caches
      optimizer.invalidateProductsCache()
      optimizer.invalidateCategoriesCache()

      return result.data
    },
    {
      onSuccess: () => {
        console.log('Product created successfully')
      },
    }
  )
}

export function useUpdateProduct() {
  const { optimizer } = useSupabaseOptimization()

  return useSupabaseMutation(
    async ({ id, updates }: { id: string; updates: any }) => {
      const result = await optimizer.supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (result.error) throw result.error

      // Invalidate related caches
      optimizer.invalidateProductsCache()
      optimizer.cache.delete(`product:${id}`)

      return result.data
    },
    {
      onSuccess: data => {
        console.log('Product updated successfully:', data.id)
      },
    }
  )
}

export function useDeleteProduct() {
  const { optimizer } = useSupabaseOptimization()

  return useSupabaseMutation(
    async (id: string) => {
      const result = await optimizer.supabase.from('products').delete().eq('id', id)

      if (result.error) throw result.error

      // Invalidate related caches
      optimizer.invalidateProductsCache()
      optimizer.cache.delete(`product:${id}`)

      return { id }
    },
    {
      onSuccess: data => {
        console.log('Product deleted successfully:', data.id)
      },
    }
  )
}

// ===================================
// UTILITY HOOKS
// ===================================

export function useSupabaseHealth() {
  const monitoring = getSupabaseMonitoring()

  return useSupabaseQuery(['supabase-health'], () => monitoring.performHealthCheck(), {
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000, // 10 seconds
  })
}

export function useSupabaseStats() {
  const monitoring = getSupabaseMonitoring()

  return useMemo(
    () => ({
      stats: monitoring.getStats(),
      healthSummary: monitoring.getHealthSummary(),
      alerts: monitoring.checkForAlerts(),
    }),
    [monitoring]
  )
}

// ===================================
// CACHE MANAGEMENT HOOKS
// ===================================

export function useCacheInvalidation() {
  const { optimizer, cache } = useSupabaseOptimization()

  return useMemo(
    () => ({
      invalidateProducts: () => optimizer.invalidateProductsCache(),
      invalidateCategories: () => optimizer.invalidateCategoriesCache(),
      invalidateOrders: () => optimizer.invalidateOrdersCache(),
      invalidateAll: () => cache.clear(),
      invalidateByPattern: (pattern: string) => {
        const keys = Array.from(cache.keys()).filter(key => key.includes(pattern))
        keys.forEach(key => cache.delete(key))
      },
    }),
    [optimizer, cache]
  )
}
