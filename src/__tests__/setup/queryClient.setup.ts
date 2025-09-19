// ===================================
// PINTEYA E-COMMERCE - SETUP QUERY CLIENT PARA TESTS
// ===================================

import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración global de QueryClient para tests
 * Se ejecuta antes de cada test que use TanStack Query
 */
export const setupQueryClientForTests = () => {
  // Configuración optimizada para tests
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

  return queryClient;
};

/**
 * Limpiar QueryClient después de cada test
 */
export const cleanupQueryClient = (queryClient: QueryClient) => {
  queryClient.clear();
  queryClient.getQueryCache().clear();
  queryClient.getMutationCache().clear();
};

/**
 * Mock de datos para tests de búsqueda
 */
export const mockSearchData = {
  products: [
    {
      id: 1,
      name: 'Pintura Test 1',
      brand: 'Test Brand',
      price: 100,
      image: '/test-image.jpg',
    },
    {
      id: 2,
      name: 'Pintura Test 2',
      brand: 'Test Brand 2',
      price: 200,
      image: '/test-image-2.jpg',
    },
  ],
  total: 2,
  page: 1,
  totalPages: 1,
};

/**
 * Mock de datos para trending searches
 */
export const mockTrendingSearches = [
  'pintura blanca',
  'esmalte sintético',
  'látex interior',
  'barniz marino',
  'imprimación',
];

/**
 * Mock de datos para recent searches
 */
export const mockRecentSearches = [
  'pintura roja',
  'esmalte negro',
  'látex azul',
];









