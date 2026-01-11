// ===================================
// HOOK: useTrendingSearches - Búsquedas populares/trending
// ===================================

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { searchQueryKeys } from '@/lib/query-client'
import { TrendingSearch, TrendingSearchesResponse } from '@/app/api/search/trending/route'
import { ApiResponse } from '@/types/api'

export interface UseTrendingSearchesOptions {
  /** Número máximo de búsquedas trending a obtener */
  limit?: number
  /** Número de días hacia atrás para calcular trending */
  days?: number
  /** Filtrar por categoría específica */
  category?: string
  /** Habilitar/deshabilitar la query */
  enabled?: boolean
  /** Intervalo de refetch en milisegundos. false para deshabilitar refetch automático */
  refetchInterval?: number | false
}

export interface UseTrendingSearchesReturn {
  /** Búsquedas trending */
  trendingSearches: TrendingSearch[]
  /** Indica si está cargando */
  isLoading: boolean
  /** Indica si hay un error */
  error: Error | null
  /** Función para refrescar los datos */
  refetch: () => void
  /** Indica si los datos están obsoletos */
  isStale: boolean
  /** Timestamp de la última actualización */
  lastUpdated: string | null
  /** Función para registrar una búsqueda */
  trackSearch: (query: string, category?: string) => Promise<void>
}

/**
 * ⚡ FIX: Función fallback para usar cuando la API falla
 * Evita que errores de trending causen recargas automáticas
 */
function getFallbackTrendingSearches(limit: number = 6): TrendingSearch[] {
  const fallbackSearches = [
    { query: 'Pintura', category: 'pinturas' },
    { query: 'Esmalte', category: 'pinturas' },
    { query: 'Látex', category: 'pinturas' },
    { query: 'Barniz', category: 'pinturas' },
    { query: 'Imprimación', category: 'pinturas' },
    { query: 'Rodillos', category: 'herramientas' },
  ]

  return fallbackSearches.slice(0, limit).map((search, index) => ({
    id: `fallback-${index + 1}`,
    query: search.query,
    count: Math.floor(Math.random() * 20) + 5, // Rango mínimo 5-25
    category: search.category,
    href: `/search?q=${encodeURIComponent(search.query.toLowerCase())}`,
    type: 'trending' as const,
  }))
}

/**
 * Hook para obtener búsquedas trending/populares
 *
 * Obtiene las búsquedas más populares basadas en datos reales del sistema
 * de analytics, con fallback a datos por defecto.
 * 
 * ⚡ FIX: Manejo robusto de errores para evitar recargas automáticas
 */
export function useTrendingSearches(
  options: UseTrendingSearchesOptions = {}
): UseTrendingSearchesReturn {
  const {
    limit = 6,
    days = 7,
    category,
    enabled = true,
    refetchInterval = 5 * 60 * 1000, // 5 minutos
  } = options

  // ⚡ OPTIMIZACIÓN: Memoizar queryKey para evitar re-renders
  const queryKey = useMemo(
    () => [...searchQueryKeys.trending(), 'params', { limit, days, category }],
    [limit, days, category]
  )

  // Query para obtener búsquedas trending
  const { data, isLoading, error, refetch, isStale } = useQuery({
    queryKey,
    queryFn: async (): Promise<TrendingSearchesResponse> => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔥 useTrendingSearches: Iniciando fetch de trending searches', {
          limit,
          days,
          category,
          enabled,
        })
      }

      const params = new URLSearchParams()
      params.set('limit', limit.toString())
      params.set('days', days.toString())

      if (category) {
        params.set('category', category)
      }

      const url = `/api/search/trending?${params.toString()}`

      try {
        const response = await fetch(url)

        if (!response.ok) {
          // ⚡ FIX: Retornar fallback en lugar de lanzar error para evitar recargas
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ useTrendingSearches: API error, using fallback', response.status)
          }
          return {
            trending: getFallbackTrendingSearches(limit),
            lastUpdated: new Date().toISOString(),
          }
        }

        const result: ApiResponse<TrendingSearchesResponse> = await response.json()

        if (!result.success || !result.data) {
          // ⚡ FIX: Retornar fallback en lugar de lanzar error para evitar recargas
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ useTrendingSearches: Invalid response, using fallback', result.error)
          }
          return {
            trending: getFallbackTrendingSearches(limit),
            lastUpdated: new Date().toISOString(),
          }
        }

        return result.data
      } catch (fetchError) {
        // ⚡ FIX: Retornar fallback en lugar de lanzar error para evitar recargas
        if (process.env.NODE_ENV === 'development') {
          console.warn('🔥 useTrendingSearches: Fetch error, using fallback:', fetchError)
        }
        // Retornar fallback silenciosamente en lugar de lanzar error
        return {
          trending: getFallbackTrendingSearches(limit),
          lastUpdated: new Date().toISOString(),
        }
      }
    },
    enabled,
    // ⚡ OPTIMIZACIÓN: Permitir deshabilitar refetch explícitamente con false
    refetchInterval: refetchInterval === false ? false : (refetchInterval || false),
    staleTime: 10 * 60 * 1000, // ⚡ Aumentado a 10 minutos para evitar re-renders
    gcTime: 30 * 60 * 1000, // ⚡ Aumentado a 30 minutos
    retry: 0, // ⚡ REDUCIDO: Sin retry para evitar reintentos que puedan causar problemas
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    // ⚡ OPTIMIZACIÓN: Solo notificar cambios en data y error, no en isLoading
    notifyOnChangeProps: ['data', 'error'],
    // ⚡ OPTIMIZACIÓN: Mantener datos anteriores mientras carga
    placeholderData: (previousData) => previousData,
    // ⚡ FIX: Manejar errores silenciosamente sin causar recargas
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ useTrendingSearches: Query error (handled silently):', error)
      }
      // No hacer nada - usar fallback en su lugar
      // Esto previene que errores de React Query causen recargas automáticas
    },
  })

  // Función para registrar una búsqueda en analytics
  const trackSearch = async (query: string, searchCategory?: string): Promise<void> => {
    try {
      const response = await fetch('/api/search/trending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          category: searchCategory,
          userId: null, // Se puede obtener del contexto de auth si está disponible
          sessionId: `session-${Date.now()}`, // Generar session ID simple
        }),
      })

      if (!response.ok) {
        console.warn('⚠️ Error tracking search:', response.status)
      } else {
      }
    } catch (error) {
      console.warn('⚠️ Error tracking search:', error)
      // No lanzar error para no interrumpir la experiencia del usuario
    }
  }

  // ⚡ OPTIMIZACIÓN: Estabilizar trendingSearches array para evitar re-renders
  const trendingSearches = useMemo(() => {
    return data?.trending || []
  }, [data?.trending])

  // ⚡ OPTIMIZACIÓN: Memoizar resultado para evitar cambios en cada render
  const result = useMemo(() => ({
    trendingSearches,
    isLoading,
    error: error as Error | null,
    refetch,
    trackSearch,
    lastUpdated: data?.lastUpdated,
    isStale,
  }), [trendingSearches, isLoading, error, refetch, trackSearch, data?.lastUpdated, isStale])

  return result
}

/**
 * Hook simplificado para obtener solo las búsquedas trending
 */
export function useTrendingSearchesSimple(limit: number = 6): TrendingSearch[] {
  const { trendingSearches } = useTrendingSearches({ limit })
  return trendingSearches
}

/**
 * Hook para obtener búsquedas trending por categoría
 */
export function useTrendingSearchesByCategory(
  category: string,
  limit: number = 4
): TrendingSearch[] {
  const { trendingSearches } = useTrendingSearches({
    category,
    limit,
    refetchInterval: 10 * 60 * 1000, // 10 minutos para categorías específicas
  })
  return trendingSearches
}

export default useTrendingSearches
