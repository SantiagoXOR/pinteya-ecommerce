// ===================================
// HOOK: useTrendingSearches - Búsquedas populares/trending
// ===================================

import { useQuery } from '@tanstack/react-query';
import { searchQueryKeys } from '@/lib/query-client';
import { TrendingSearch, TrendingSearchesResponse } from '@/app/api/search/trending/route';
import { ApiResponse } from '@/types/api';

export interface UseTrendingSearchesOptions {
  /** Número máximo de búsquedas trending a obtener */
  limit?: number;
  /** Número de días hacia atrás para calcular trending */
  days?: number;
  /** Filtrar por categoría específica */
  category?: string;
  /** Habilitar/deshabilitar la query */
  enabled?: boolean;
  /** Intervalo de refetch en milisegundos */
  refetchInterval?: number;
}

export interface UseTrendingSearchesReturn {
  /** Búsquedas trending */
  trendingSearches: TrendingSearch[];
  /** Indica si está cargando */
  isLoading: boolean;
  /** Indica si hay un error */
  error: Error | null;
  /** Función para refrescar los datos */
  refetch: () => void;
  /** Indica si los datos están obsoletos */
  isStale: boolean;
  /** Timestamp de la última actualización */
  lastUpdated: string | null;
  /** Función para registrar una búsqueda */
  trackSearch: (query: string, category?: string) => Promise<void>;
}

/**
 * Hook para obtener búsquedas trending/populares
 * 
 * Obtiene las búsquedas más populares basadas en datos reales del sistema
 * de analytics, con fallback a datos por defecto.
 */
export function useTrendingSearches(options: UseTrendingSearchesOptions = {}): UseTrendingSearchesReturn {
  const {
    limit = 6,
    days = 7,
    category,
    enabled = true,
    refetchInterval = 5 * 60 * 1000, // 5 minutos
  } = options;

  // Query para obtener búsquedas trending
  const {
    data,
    isLoading,
    error,
    refetch,
    isStale,
  } = useQuery({
    queryKey: [...searchQueryKeys.trending(), 'params', { limit, days, category }],
    queryFn: async (): Promise<TrendingSearchesResponse> => {
      console.log('🔥 useTrendingSearches: Fetching trending searches', {
        limit,
        days,
        category
      });

      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('days', days.toString());
      
      if (category) {
        params.set('category', category);
      }

      const response = await fetch(`/api/search/trending?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching trending searches: ${response.status}`);
      }

      const result: ApiResponse<TrendingSearchesResponse> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Error obteniendo búsquedas trending');
      }

      console.log('✅ useTrendingSearches: Trending searches fetched', {
        count: result.data.trending.length,
        lastUpdated: result.data.lastUpdated
      });

      return result.data;
    },
    enabled,
    refetchInterval,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Función para registrar una búsqueda en analytics
  const trackSearch = async (query: string, searchCategory?: string): Promise<void> => {
    try {
      console.log('📊 useTrendingSearches: Tracking search', { query, category: searchCategory });

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
      });

      if (!response.ok) {
        console.warn('⚠️ Error tracking search:', response.status);
      } else {
        console.log('✅ Search tracked successfully');
      }
    } catch (error) {
      console.warn('⚠️ Error tracking search:', error);
      // No lanzar error para no interrumpir la experiencia del usuario
    }
  };

  return {
    trendingSearches: data?.trending || [],
    isLoading,
    error: error as Error | null,
    refetch,
    isStale,
    lastUpdated: data?.lastUpdated || null,
    trackSearch,
  };
}

/**
 * Hook simplificado para obtener solo las búsquedas trending
 */
export function useTrendingSearchesSimple(limit: number = 6): TrendingSearch[] {
  const { trendingSearches } = useTrendingSearches({ limit });
  return trendingSearches;
}

/**
 * Hook para obtener búsquedas trending por categoría
 */
export function useTrendingSearchesByCategory(category: string, limit: number = 4): TrendingSearch[] {
  const { trendingSearches } = useTrendingSearches({ 
    category, 
    limit,
    refetchInterval: 10 * 60 * 1000 // 10 minutos para categorías específicas
  });
  return trendingSearches;
}

export default useTrendingSearches;
