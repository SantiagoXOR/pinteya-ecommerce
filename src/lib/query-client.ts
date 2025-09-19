// ===================================
// CONFIGURACIÓN: TanStack Query Client
// ===================================

import { QueryClient } from '@tanstack/react-query';

// Función para detectar errores de red que deben ser reintentados
function shouldRetryError(error: any): boolean {
  // Errores de red comunes que deben ser reintentados
  const networkErrors = [
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_RESET',
    'ERR_CONNECTION_TIMED_OUT',
    'ERR_ABORTED', // Incluir ERR_ABORTED para reintentos
    'NETWORK_ERROR',
    'TIMEOUT_ERROR'
  ];

  // Verificar si es un error de red
  if (error?.code && networkErrors.includes(error.code)) {
    return true;
  }

  // Verificar por mensaje de error
  if (error?.message) {
    const message = error.message.toLowerCase();
    if (message.includes('network') ||
        message.includes('fetch') ||
        message.includes('aborted') ||
        message.includes('timeout') ||
        message.includes('connection')) {
      return true;
    }
  }

  // Errores HTTP 5xx (servidor) deben ser reintentados
  if (error?.status >= 500) {
    return true;
  }

  return false;
}

// Configuración optimizada para e-commerce con manejo robusto de errores de red
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache por 5 minutos para datos de productos
      staleTime: 5 * 60 * 1000,
      // Mantener en cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry logic inteligente con manejo de errores de red
      retry: (failureCount: number, error: any) => {
        // No retry para errores 4xx (cliente) excepto 408 (timeout)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 408) {
          return false;
        }

        // Retry para errores de red detectados
        if (shouldRetryError(error)) {
          return failureCount < 3; // Más reintentos para errores de red
        }

        // Máximo 2 reintentos para otros errores de servidor
        return failureCount < 2;
      },
      // Intervalo de retry con backoff exponencial más agresivo para errores de red
      retryDelay: (attemptIndex: number, error: any) => {
        // Delay más corto para errores de red
        if (shouldRetryError(error)) {
          return Math.min(500 * 2 ** attemptIndex, 5000);
        }
        // Delay normal para otros errores
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
      // Refetch en focus para datos críticos
      refetchOnWindowFocus: false,
      // Refetch en reconexión
      refetchOnReconnect: true,
      // No refetch en mount si los datos están frescos
      refetchOnMount: true,
      // Configuración de red más robusta
      networkMode: 'online',
    },
    mutations: {
      // Retry para mutaciones críticas con manejo de errores de red
      retry: (failureCount: number, error: any) => {
        // Retry para errores de red en mutaciones
        if (shouldRetryError(error)) {
          return failureCount < 2;
        }
        // Un solo retry para otros errores
        return failureCount < 1;
      },
      retryDelay: (attemptIndex: number, error: any) => {
        // Delay más corto para errores de red en mutaciones
        if (shouldRetryError(error)) {
          return Math.min(300 * 2 ** attemptIndex, 3000);
        }
        return 1000;
      },
      networkMode: 'online',
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









