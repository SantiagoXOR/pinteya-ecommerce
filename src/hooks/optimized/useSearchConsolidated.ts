// ===================================
// HOOK CONSOLIDADO Y OPTIMIZADO: useSearchConsolidated
// ===================================
// Versión optimizada que consolida useSearch y useSearchOptimized
// eliminando duplicaciones y mejorando performance

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncedCallback } from 'use-debounce'
import { useRouter } from 'next/navigation'
import { ProductWithCategory } from '@/types/api'
import { searchQueryKeys, searchQueryConfig } from '@/lib/query-client'
import { SEARCH_CONSTANTS } from '@/constants/shop'

// ===================================
// TIPOS Y INTERFACES
// ===================================

export interface SearchSuggestion {
  id: string
  text: string
  type: 'product' | 'category' | 'brand' | 'recent' | 'trending'
  category?: string
  productId?: string
  count?: number
}

export interface UseSearchConsolidatedOptions {
  /** Tiempo de debounce en milisegundos */
  debounceMs?: number
  /** Número máximo de sugerencias */
  maxSuggestions?: number
  /** Límite de resultados de búsqueda */
  searchLimit?: number
  /** Guardar búsquedas recientes */
  saveRecentSearches?: boolean
  /** Habilitar prefetch de sugerencias */
  enablePrefetch?: boolean
  /** Habilitar analytics tracking */
  enableAnalytics?: boolean
  /** Callback cuando se realiza una búsqueda */
  onSearch?: (query: string, results: ProductWithCategory[]) => void
  /** Callback cuando se selecciona una sugerencia */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
}

export interface UseSearchConsolidatedReturn {
  // Estado de búsqueda
  query: string
  results: ProductWithCategory[]
  suggestions: SearchSuggestion[]
  isLoading: boolean
  error: string | null
  hasSearched: boolean

  // Estados de TanStack Query
  isFetching: boolean
  isStale: boolean
  dataUpdatedAt: number

  // Funciones principales
  searchWithDebounce: (query: string) => void
  executeSearch: (query: string, category?: string) => Promise<void>
  selectSuggestion: (suggestion: SearchSuggestion) => void
  clearSearch: () => void

  // Utilidades de cache
  invalidateSearch: (query: string) => void
  prefetchSearch: (query: string) => void

  // Funciones de navegación
  navigateToSearch: (query: string, category?: string) => void
  navigateToProduct: (productId: string, productSlug?: string) => void
}

// ===================================
// HOOK PRINCIPAL CONSOLIDADO
// ===================================

export function useSearchConsolidated(
  options: UseSearchConsolidatedOptions = {}
): UseSearchConsolidatedReturn {
  // Configuración con valores por defecto
  const {
    debounceMs = SEARCH_CONSTANTS.DEBOUNCE_MS,
    maxSuggestions = SEARCH_CONSTANTS.MAX_SUGGESTIONS,
    searchLimit = SEARCH_CONSTANTS.SEARCH_LIMIT,
    saveRecentSearches = true,
    enablePrefetch = true,
    enableAnalytics = true,
    onSearch,
    onSuggestionSelect,
  } = options

  // ===================================
  // ESTADO LOCAL OPTIMIZADO
  // ===================================

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Referencias para optimización
  const queryClient = useQueryClient()
  const router = useRouter()
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastQueryRef = useRef<string>('')

  // ===================================
  // DEBOUNCED QUERY UPDATE
  // ===================================

  const updateDebouncedQuery = useDebouncedCallback(
    (value: string) => {
      setDebouncedQuery(value)

      // Analytics tracking optimizado
      if (enableAnalytics && value.trim()) {
        // Solo track si es diferente a la última query
        if (value !== lastQueryRef.current) {
          lastQueryRef.current = value
          // Aquí se podría integrar con analytics
        }
      }
    },
    debounceMs,
    {
      maxWait: 2000,
      leading: false,
      trailing: true,
    }
  )

  // ===================================
  // TANSTACK QUERY OPTIMIZADA
  // ===================================

  const {
    data: searchResults,
    isLoading,
    error,
    isFetching,
    isStale,
    dataUpdatedAt,
  } = useQuery({
    queryKey: searchQueryKeys.search(debouncedQuery),
    queryFn: async ({ queryKey, signal }) => {
      const [, , searchQuery] = queryKey
      if (!searchQuery?.trim()) {
        return []
      }

      // Cancelar request anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      try {
        const url = `/api/search?q=${encodeURIComponent(searchQuery)}&limit=${maxSuggestions}`

        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: signal || abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Manejo inteligente de múltiples formatos de respuesta
        if (Array.isArray(data)) {
          return data
        } else if (data.products && Array.isArray(data.products)) {
          return data.products
        } else if (data.data && Array.isArray(data.data)) {
          return data.data
        }

        return []
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return []
        }
        throw error
      }
    },
    enabled: !!debouncedQuery?.trim() && debouncedQuery.length >= 2,
    ...searchQueryConfig,
  })

  // ===================================
  // SUGERENCIAS OPTIMIZADAS
  // ===================================

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const allSuggestions: SearchSuggestion[] = []

    // Sugerencias de productos
    if (searchResults && searchResults.length > 0) {
      const productSuggestions = searchResults.slice(0, maxSuggestions).map(product => ({
        id: `product-${product.id}`,
        text: product.name,
        type: 'product' as const,
        category: product.category?.name,
        productId: product.id.toString(),
      }))
      allSuggestions.push(...productSuggestions)
    }

    // Sugerencias de búsquedas recientes
    if (query.trim() && recentSearches.length > 0) {
      const recentSuggestions = recentSearches
        .filter(recent => recent.toLowerCase().includes(query.toLowerCase()) && recent !== query)
        .slice(0, 3)
        .map(recent => ({
          id: `recent-${recent}`,
          text: recent,
          type: 'recent' as const,
        }))
      allSuggestions.push(...recentSuggestions)
    }

    return allSuggestions.slice(0, maxSuggestions)
  }, [searchResults, query, recentSearches, maxSuggestions])

  // ===================================
  // FUNCIONES DE BÚSQUEDA OPTIMIZADAS
  // ===================================

  const searchWithDebounce = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery)
      updateDebouncedQuery(searchQuery)

      // Prefetch optimizado
      if (enablePrefetch && searchQuery.trim().length >= 1) {
        const prefetchUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`
        router.prefetch(prefetchUrl)
      }
    },
    [updateDebouncedQuery, enablePrefetch, router]
  )

  const executeSearch = useCallback(
    async (searchQuery: string, category?: string) => {
      if (!searchQuery.trim()) {
        return
      }

      try {
        setHasSearched(true)

        // Guardar en búsquedas recientes
        if (saveRecentSearches) {
          setRecentSearches(prev => {
            const newSearches = [searchQuery.trim(), ...prev.filter(s => s !== searchQuery.trim())]
            return newSearches.slice(0, SEARCH_CONSTANTS.MAX_RECENT_SEARCHES)
          })
        }

        // Construir URL de navegación
        const params = new URLSearchParams()
        params.set('q', searchQuery.trim())
        if (category && category !== 'all') {
          params.set('category', category)
        }

        const searchUrl = `/search?${params.toString()}`
        router.push(searchUrl)

        // Callback externo
        if (onSearch && searchResults) {
          onSearch(searchQuery, searchResults)
        }
      } catch (error) {
        console.error('Error en executeSearch:', error)
      }
    },
    [saveRecentSearches, router, onSearch, searchResults]
  )

  const selectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      if (suggestion.type === 'product' && suggestion.productId) {
        const productUrl = `/products/${suggestion.productId}`
        router.push(productUrl)
      } else {
        executeSearch(suggestion.text)
      }

      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion)
      }
    },
    [router, executeSearch, onSuggestionSelect]
  )

  const clearSearch = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
    setHasSearched(false)

    // Cancelar requests pendientes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // ===================================
  // UTILIDADES DE CACHE
  // ===================================

  const invalidateSearch = useCallback(
    (searchQuery: string) => {
      queryClient.invalidateQueries({
        queryKey: searchQueryKeys.search(searchQuery),
      })
    },
    [queryClient]
  )

  const prefetchSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        return
      }

      queryClient.prefetchQuery({
        queryKey: searchQueryKeys.search(searchQuery),
        queryFn: async () => {
          const url = `/api/search?q=${encodeURIComponent(searchQuery)}&limit=${maxSuggestions}`
          const response = await fetch(url)
          const data = await response.json()
          return data.products || data.data || data || []
        },
        ...searchQueryConfig,
      })
    },
    [queryClient, maxSuggestions]
  )

  // ===================================
  // FUNCIONES DE NAVEGACIÓN
  // ===================================

  const navigateToSearch = useCallback(
    (searchQuery: string, category?: string) => {
      executeSearch(searchQuery, category)
    },
    [executeSearch]
  )

  const navigateToProduct = useCallback(
    (productId: string, productSlug?: string) => {
      const productUrl = productSlug ? `/products/${productSlug}` : `/products/${productId}`
      router.push(productUrl)
    },
    [router]
  )

  // ===================================
  // CLEANUP
  // ===================================

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // ===================================
  // RETURN OPTIMIZADO
  // ===================================

  return {
    // Estado de búsqueda
    query,
    results: searchResults || [],
    suggestions,
    isLoading,
    error: error?.message || null,
    hasSearched,

    // Estados de TanStack Query
    isFetching,
    isStale,
    dataUpdatedAt: dataUpdatedAt || 0,

    // Funciones principales
    searchWithDebounce,
    executeSearch,
    selectSuggestion,
    clearSearch,

    // Utilidades de cache
    invalidateSearch,
    prefetchSearch,

    // Funciones de navegación
    navigateToSearch,
    navigateToProduct,
  }
}
