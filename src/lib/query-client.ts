// ===================================
// CONFIGURACIÓN: TanStack Query Client
// ===================================

import { QueryClient } from '@tanstack/react-query';

// Configuración optimizada para e-commerce
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache por 5 minutos para datos de productos
      staleTime: 5 * 60 * 1000,
      // Mantener en cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry logic inteligente
      retry: (failureCount: number, error: any) => {
        // No retry para errores 4xx (cliente)
        if (error?.status >= 400 && error?.status < 500) return false;
        // Máximo 2 reintentos para errores de red/servidor
        return failureCount < 2;
      },
      // Intervalo de retry con backoff exponencial
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch en focus para datos críticos
      refetchOnWindowFocus: false,
      // Refetch en reconexión
      refetchOnReconnect: true,
      // No refetch en mount si los datos están frescos
      refetchOnMount: true,
    },
    mutations: {
      // Retry para mutaciones críticas (checkout, etc.)
      retry: 1,
      retryDelay: 1000,
    },
  },
};

// Función para crear QueryClient con configuración optimizada
export function createQueryClient() {
  return new QueryClient(queryClientConfig);
}

// Instancia singleton para uso en la aplicación
export const queryClient = createQueryClient();

// Configuración específica para búsquedas
export const searchQueryConfig = {
  // Cache más agresivo para búsquedas
  staleTime: 2 * 60 * 1000, // 2 minutos
  gcTime: 5 * 60 * 1000,    // 5 minutos
  // Retry más conservador para búsquedas
  retry: 1,
  retryDelay: 500,
  // No refetch automático para búsquedas
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
};

// Keys para queries de búsqueda
export const searchQueryKeys = {
  all: ['search'] as const,
  searches: () => [...searchQueryKeys.all, 'searches'] as const,
  search: (query: string) => [...searchQueryKeys.searches(), query] as const,
  suggestions: (query: string) => [...searchQueryKeys.all, 'suggestions', query] as const,
  recent: () => [...searchQueryKeys.all, 'recent'] as const,
  trending: () => [...searchQueryKeys.all, 'trending'] as const,
} as const;

// Utilidades para invalidación de cache
export const searchQueryUtils = {
  // Invalidar todas las búsquedas
  invalidateAll: () => queryClient.invalidateQueries({ queryKey: searchQueryKeys.all }),
  
  // Invalidar búsquedas específicas
  invalidateSearch: (query: string) => 
    queryClient.invalidateQueries({ queryKey: searchQueryKeys.search(query) }),
  
  // Limpiar cache de búsquedas
  clearSearchCache: () => queryClient.removeQueries({ queryKey: searchQueryKeys.all }),
  
  // Prefetch de búsqueda
  prefetchSearch: (query: string) => 
    queryClient.prefetchQuery({
      queryKey: searchQueryKeys.search(query),
      queryFn: () => import('@/lib/api/products').then(m => m.searchProducts(query, 6)),
      ...searchQueryConfig,
    }),
};
