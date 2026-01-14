// ===================================
// HOOK: useSearchOptimized - Sistema de búsqueda con TanStack Query
// ===================================

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncedCallback } from 'use-debounce'
import { searchProducts, getProducts } from '@/lib/api/products'
import { ProductWithCategory } from '@/types/api'
import { searchQueryKeys, searchQueryConfig } from '@/lib/query-client'
import { useSearchErrorHandler } from './useSearchErrorHandler'
import { useSearchToast } from './useSearchToast'
import { useSearchNavigation } from './useSearchNavigation'
import { useTrendingSearches } from './useTrendingSearches'
import { useRecentSearches } from './useRecentSearches'
import { SEARCH_CONSTANTS } from '@/constants/shop'
import { hasDiscount } from '@/lib/adapters/product-adapter'
import { resolveProductImage } from '@/components/ui/product-card-commercial/utils/image-resolver'
import { getColorHexFromName } from '@/components/ui/product-card-commercial/utils/color-utils'
import type { ProductVariant } from '@/components/ui/product-card-commercial/types'

// ===================================
// TIPOS
// ===================================

export interface SearchSuggestion {
  id: string
  type: 'product' | 'category' | 'recent' | 'trending'
  title: string
  subtitle?: string
  image?: string
  badge?: string
  badges?: string[]
  href: string
  // Información de variantes para productos
  variants?: any[]
  colors?: Array<{ hex: string; name: string; textureType?: string }>
  measures?: string[]
  finishes?: string[]
}

export interface UseSearchOptimizedOptions {
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
  /** Categoría actual para filtrar y navegar */
  categoryId?: string
  /** Callback cuando se realiza una búsqueda */
  onSearch?: (query: string, results: ProductWithCategory[]) => void
  /** Callback cuando se selecciona una sugerencia */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
}

// ===================================
// HOOK PRINCIPAL
// ===================================

export function useSearchOptimized(options: UseSearchOptimizedOptions = {}) {
  const {
    debounceMs = 150,
    maxSuggestions = 6,
    searchLimit = 12,
    saveRecentSearches = true,
    enablePrefetch = true,
    categoryId,
    onSearch,
    onSuggestionSelect,
  } = options

  // Estados locales
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // Hooks externos
  const queryClient = useQueryClient()
  const errorHandler = useSearchErrorHandler()
  const toastHandler = useSearchToast()
  const navigation = useSearchNavigation({
    scrollToTop: true,
    onBeforeNavigate: url => console.log('🔍 Navegando a:', url),
    onAfterNavigate: url => console.log('✅ Navegación completada:', url),
  })

  // Hooks para trending y recent searches
  const { trendingSearches, trackSearch } = useTrendingSearches({
    limit: 4,
    enabled: true,
  })

  // ⚡ FIX: Debug solo cuando cambia trendingSearches (no en cada render)
  const prevTrendingSearchesRef = useRef(trendingSearches)
  useEffect(() => {
    // ⚡ OPTIMIZACIÓN: Solo loguear si cambió el contenido real
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true') {
      const prevLength = prevTrendingSearchesRef.current?.length || 0
      const currentLength = trendingSearches?.length || 0
      const prevIds = prevTrendingSearchesRef.current?.map(t => t.id).sort().join(',') || ''
      const currentIds = trendingSearches?.map(t => t.id).sort().join(',') || ''
      
      // Solo loguear si cambió el contenido
      if (prevLength !== currentLength || prevIds !== currentIds) {
        console.log('🔥 useSearchOptimized: Trending searches state changed:', {
          trendingSearches: currentLength,
          trendingSearchesData: trendingSearches?.map(t => ({ id: t.id, query: t.query })) || [],
        })
      }
      
      prevTrendingSearchesRef.current = trendingSearches
    }
  }, [trendingSearches])

  const {
    recentSearches: recentSearchesList,
    addSearch: addRecentSearch,
    getRecentSearches,
  } = useRecentSearches({
    maxSearches: SEARCH_CONSTANTS.MAX_RECENT_SEARCHES,
    enablePersistence: saveRecentSearches,
    expirationDays: SEARCH_CONSTANTS.RECENT_SEARCHES_EXPIRATION_DAYS,
  })

  // ===================================
  // DEBOUNCED QUERY UPDATE
  // ===================================

  const updateDebouncedQuery = useDebouncedCallback(
    (value: string) => {
      setDebouncedQuery(value)

      // Analytics tracking
      if (
        value.trim() &&
        process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true'
      ) {
        console.log('🔍 useSearchOptimized: Query enabled condition will be:', !!value?.trim())
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
  // TANSTACK QUERY INTEGRATION
  // ===================================

  // Query principal para búsquedas
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

      try {
        // Usar el endpoint público existente de productos con filtros
        const data = await getProducts(
          { search: searchQuery, limit: searchLimit, page: 1 },
          signal as AbortSignal
        )

        // Devolver el objeto completo para que el mapeo maneje .data
        return data
      } catch (error) {
        console.error('🔍 useSearchOptimized: API call failed:', error)
        throw error
      }
    },
    enabled: !!debouncedQuery?.trim() && debouncedQuery.length >= 2,
    ...searchQueryConfig,
  })

  // ===================================
  // SUGGESTIONS GENERATION
  // ===================================

  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true') {
    console.log('🔍 useSearchOptimized: Current state before suggestions:', {
      query,
      debouncedQuery,
      searchResults: searchResults?.length || 0,
      isLoading,
      error: !!error,
    })
  }

  const suggestions: SearchSuggestion[] = useMemo(() => {
    const allSuggestions: SearchSuggestion[] = []
    const hasQuery = !!debouncedQuery?.trim()

    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true') {
      console.log('🔍 useSearchOptimized: query (current):', `"${query}"`)
      console.log('🔍 useSearchOptimized: searchResults isArray:', Array.isArray(searchResults))
    }

    if (hasQuery) {
      // CUANDO HAY TEXTO: Priorizar productos SIEMPRE

      // Extraer productos de la respuesta de la API
      let products = []

      // Si searchResults es un array directamente
      if (Array.isArray(searchResults)) {
        products = searchResults
      }
      // Si searchResults es un objeto con propiedad data (respuesta de API)
      else if (
        searchResults &&
        typeof searchResults === 'object' &&
        Array.isArray(searchResults.data)
      ) {
        products = searchResults.data
      }
      // Si searchResults es un objeto con propiedad products
      else if (
        searchResults &&
        typeof searchResults === 'object' &&
        Array.isArray(searchResults.products)
      ) {
        products = searchResults.products
      }

      if (products.length > 0) {
        const productSuggestions = products.map((product: ProductWithCategory) => {
          // Usar resolver unificado para extraer imagen (prioriza variantes)
          const imageUrl = resolveProductImage({
            image_url: (product as any)?.image_url || null,
            default_variant: (product as any)?.default_variant || null,
            variants: (product.variants || []) as ProductVariant[],
            images: (product as any)?.images || null,
            imgs: (product as any)?.imgs || null
          })

          // Extraer información de variantes
          const variants = (product.variants || []) as ProductVariant[]
          
          // Extraer colores únicos
          const colorsMap = new Map<string, { hex: string; name: string }>()
          variants.forEach(v => {
            if (v.color_name || v.color_hex) {
              const colorName = (v.color_name || '').toString().trim()
              const colorHex = v.color_hex || getColorHexFromName(colorName)
              if (colorName && !colorsMap.has(colorName.toLowerCase())) {
                colorsMap.set(colorName.toLowerCase(), {
                  hex: colorHex,
                  name: colorName
                })
              }
            }
          })
          const colors = Array.from(colorsMap.values())

          // Extraer medidas únicas
          const measuresSet = new Set<string>()
          variants.forEach(v => {
            if (v.measure && v.measure.toString().trim()) {
              measuresSet.add(v.measure.toString().trim())
            }
          })
          const measures = Array.from(measuresSet)

          // Extraer finishes únicos
          const finishesSet = new Set<string>()
          variants.forEach(v => {
            if (v.finish && v.finish.toString().trim()) {
              const finish = v.finish.toString().trim()
              // Capitalizar primera letra
              const capitalizedFinish = finish.charAt(0).toUpperCase() + finish.slice(1).toLowerCase()
              finishesSet.add(capitalizedFinish)
            }
          })
          const finishes = Array.from(finishesSet)

          return {
            id: product.id.toString(),
            type: 'product' as const,
            title: product.name,
            subtitle: product.category?.name,
            image: imageUrl,
            href: `/products/${product.id}`,
            variants: variants.length > 0 ? variants : undefined,
            colors: colors.length > 0 ? colors : undefined,
            measures: measures.length > 0 ? measures : undefined,
            finishes: finishes.length > 0 ? finishes : undefined,
          }
        })
        allSuggestions.push(...productSuggestions)
      } else {
        if (
          process.env.NODE_ENV === 'development' &&
          process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true'
        ) {
          console.log('🔍 useSearchOptimized: searchResults structure:', {
            isArray: Array.isArray(searchResults),
            hasData: searchResults?.data ? 'yes' : 'no',
            hasProducts: searchResults?.products ? 'yes' : 'no',
            dataLength: searchResults?.data?.length,
            productsLength: searchResults?.products?.length,
            keys: searchResults ? Object.keys(searchResults) : 'null',
          })
        }
      }

      // Solo agregar recent/trending si hay muy pocos productos
      if (allSuggestions.length < 2) {
        const recentSuggestions = getRecentSearches(2).map((search, index) => ({
          id: `recent-${index}`,
          type: 'recent' as const,
          title: search,
          href:
            `/search?search=${encodeURIComponent(search)}` +
            (categoryId && categoryId !== 'all' ? `&category=${encodeURIComponent(categoryId)}` : ''),
        }))
        allSuggestions.push(...recentSuggestions)
      }
    } else {
      // CUANDO NO HAY TEXTO: Mostrar trending y recent

      // Agregar búsquedas recientes primero
      const recentSuggestions = getRecentSearches(3).map((search, index) => ({
        id: `recent-${index}`,
        type: 'recent' as const,
        title: search,
        href:
          `/search?search=${encodeURIComponent(search)}` +
          (categoryId && categoryId !== 'all' ? `&category=${encodeURIComponent(categoryId)}` : ''),
      }))
      allSuggestions.push(...recentSuggestions)

      // Agregar trending searches
      if (allSuggestions.length < maxSuggestions) {
        const remainingSlots = maxSuggestions - allSuggestions.length
        const trendingSuggestions = trendingSearches.slice(0, remainingSlots).map(trending => ({
          id: trending.id,
          type: 'trending' as const,
          title: trending.query,
          href:
            `/search?search=${encodeURIComponent(trending.query)}` +
            (categoryId && categoryId !== 'all' ? `&category=${encodeURIComponent(categoryId)}` : ''),
        }))
        allSuggestions.push(...trendingSuggestions)
      }
    }

    const finalSuggestions = allSuggestions.slice(0, maxSuggestions)
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true') {
      console.log(
        '🔍 useSearchOptimized: Final suggestions types:',
        finalSuggestions.map(s => s.type)
      )
      console.log(
        '🔍 useSearchOptimized: Final suggestions titles:',
        finalSuggestions.map(s => s.title)
      )
    }

    return finalSuggestions
  }, [debouncedQuery, searchResults, isLoading, error, maxSuggestions, trendingSearches])

  // ===================================
  // SEARCH FUNCTIONS
  // ===================================

  const searchWithDebounce = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery)
      updateDebouncedQuery(searchQuery)

      // Prefetch si está habilitado y la query es válida
      if (enablePrefetch && searchQuery.trim().length >= 1) {
        // Prefetch de datos de búsqueda (deduplicado por cache)
        const key = searchQueryKeys.search(searchQuery)
        if (!queryClient.getQueryData(key)) {
          queryClient.prefetchQuery({
            queryKey: key,
            queryFn: () => searchProducts(searchQuery, searchLimit),
            ...searchQueryConfig,
          })
        }

        // Prefetch de página de resultados con categoría
        navigation.prefetchSearch(searchQuery.trim(), categoryId)
      }
    },
    [updateDebouncedQuery, enablePrefetch, queryClient, searchLimit, navigation, categoryId]
  )

  const executeSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        return
      }

      try {
        setHasSearched(true)

        // Guardar en historial usando el hook
        if (saveRecentSearches) {
          addRecentSearch(searchQuery.trim())
        }

        // Registrar en trending searches
        trackSearch(searchQuery.trim()).catch(console.warn)

        // Navegar a página de resultados usando navegación optimizada
        navigation.navigateToSearch(searchQuery.trim(), categoryId)

        // Callback externo: pasar siempre un array de productos
        if (onSearch && searchResults) {
          const resultsArray = Array.isArray(searchResults)
            ? (searchResults as ProductWithCategory[])
            : Array.isArray((searchResults as any)?.data)
              ? ((searchResults as any).data as ProductWithCategory[])
              : Array.isArray((searchResults as any)?.products)
                ? ((searchResults as any).products as ProductWithCategory[])
                : []

          onSearch(searchQuery, resultsArray)
        }

        // Mostrar toast con cantidad correcta
        const count = Array.isArray(searchResults)
          ? (searchResults as ProductWithCategory[]).length
          : Array.isArray((searchResults as any)?.data)
            ? ((searchResults as any).data as ProductWithCategory[]).length
            : Array.isArray((searchResults as any)?.products)
              ? ((searchResults as any).products as ProductWithCategory[]).length
              : 0

        toastHandler.showSuccessToast(searchQuery, count)
      } catch (error) {
        console.error('❌ useSearchOptimized: Error en executeSearch:', error)
        errorHandler.handleError(error)
      }
    },
    [
      saveRecentSearches,
      recentSearches,
      navigation,
      onSearch,
      searchResults,
      toastHandler,
      errorHandler,
    ]
  )

  const selectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      // Si hay un callback externo, dejarlo manejar la navegación
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion)
        toastHandler.showInfoToast(
          `${suggestion.type === 'product' ? 'Producto' : 'Búsqueda'} seleccionado`,
          suggestion.title
        )
        return
      }

      // Solo navegar automáticamente si NO hay callback externo
      if (suggestion.type === 'product') {
        navigation.navigateToProduct(suggestion.id)
      } else {
        // Para búsquedas recientes o trending, navegar a búsqueda (respetando categoría)
        navigation.navigateToSearch(suggestion.title, categoryId)
      }

      toastHandler.showInfoToast(
        `${suggestion.type === 'product' ? 'Producto' : 'Búsqueda'} seleccionado`,
        suggestion.title
      )
    },
    [navigation, onSuggestionSelect, toastHandler]
  )

  const clearSearch = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
    setHasSearched(false)

    // Limpiar cache de búsquedas si es necesario
    queryClient.removeQueries({ queryKey: searchQueryKeys.searches() })
  }, [queryClient])

  // ===================================
  // LIFECYCLE
  // ===================================

  const initialize = useCallback(() => {
    // Cargar búsquedas recientes
    if (saveRecentSearches) {
      try {
        const saved = localStorage.getItem('pinteya-recent-searches')
        if (saved && saved.trim() !== '' && saved !== '""' && saved !== "''") {
          // Validar que no esté corrupto
          if (saved.includes('""') && saved.length < 5) {
            console.warn('Detected corrupted recent searches data, cleaning up')
            localStorage.removeItem('pinteya-recent-searches')
            return
          }

          const parsed = JSON.parse(saved)
          // Verificar que sea un array válido
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed)
          } else {
            console.warn('Invalid recent searches format, resetting')
            localStorage.removeItem('pinteya-recent-searches')
          }
        }
      } catch (error) {
        console.warn('Error cargando búsquedas recientes:', error)
        // Limpiar datos corruptos
        localStorage.removeItem('pinteya-recent-searches')
      }
    }
  }, [saveRecentSearches])

  const cleanup = useCallback(() => {
    // Limpiar debounce y cache si es necesario
    updateDebouncedQuery.cancel()
  }, [updateDebouncedQuery])

  // Inicializar al montar
  useEffect(() => {
    initialize()
    return cleanup
  }, [initialize, cleanup])

  // ===================================
  // RETURN
  // ===================================

  return {
    // Estado de búsqueda
    query,
    results: searchResults || [],
    suggestions,
    isLoading,
    error: error?.message || null,
    hasSearched,
    recentSearches: recentSearchesList,
    trendingSearches,

    // Estados de TanStack Query
    isFetching,
    isStale,
    dataUpdatedAt,

    // Estado de errores y toasts
    searchError: errorHandler.currentError,
    isRetrying: errorHandler.isRetrying,
    retryCount: errorHandler.retryCount,
    toasts: toastHandler.toasts,

    // Funciones principales
    searchWithDebounce,
    executeSearch,
    selectSuggestion,
    clearSearch,
    initialize,
    cleanup,

    // Funciones de manejo de errores
    clearError: errorHandler.clearError,
    retryManually: errorHandler.retryManually,

    // Funciones de toast
    removeToast: toastHandler.removeToast,
    clearToasts: toastHandler.clearToasts,

    // Utilidades de cache
    invalidateSearch: (searchQuery: string) =>
      queryClient.invalidateQueries({ queryKey: searchQueryKeys.search(searchQuery) }),
    prefetchSearch: (searchQuery: string) =>
      queryClient.prefetchQuery({
        queryKey: searchQueryKeys.search(searchQuery),
        queryFn: () => searchProducts(searchQuery, searchLimit),
        ...searchQueryConfig,
      }),

    // Funciones de navegación optimizada
    navigateToSearch: navigation.navigateToSearch,
    navigateToProduct: navigation.navigateToProduct,
    navigateToCategory: navigation.navigateToCategory,
    prefetchSearchPage: navigation.prefetchSearch,
    prefetchProductPage: navigation.prefetchProduct,
    getCurrentSearchQuery: navigation.getCurrentSearchQuery,
    buildSearchUrl: navigation.buildSearchUrl,
  }
}

export default useSearchOptimized
