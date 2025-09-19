// ===================================
// HOOK: useSearchOptimized - Sistema de búsqueda con TanStack Query
// ===================================

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import { searchProducts } from '@/lib/api/products';
import { ProductWithCategory } from '@/types/api';
import { searchQueryKeys, searchQueryConfig } from '@/lib/query-client';
import { useSearchErrorHandler } from './useSearchErrorHandler';
import { useSearchToast } from './useSearchToast';
import { useSearchNavigation } from './useSearchNavigation';
import { useTrendingSearches } from './useTrendingSearches';
import { useRecentSearches } from './useRecentSearches';
import { SEARCH_CONSTANTS } from '@/constants/shop';

// ===================================
// TIPOS
// ===================================

export interface SearchSuggestion {
  id: string;
  type: 'product' | 'category' | 'recent' | 'trending';
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  href: string;
}

export interface UseSearchOptimizedOptions {
  /** Tiempo de debounce en milisegundos */
  debounceMs?: number;
  /** Número máximo de sugerencias */
  maxSuggestions?: number;
  /** Límite de resultados de búsqueda */
  searchLimit?: number;
  /** Guardar búsquedas recientes */
  saveRecentSearches?: boolean;
  /** Habilitar prefetch de sugerencias */
  enablePrefetch?: boolean;
  /** Callback cuando se realiza una búsqueda */
  onSearch?: (query: string, results: ProductWithCategory[]) => void;
  /** Callback cuando se selecciona una sugerencia */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
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
    onSearch,
    onSuggestionSelect,
  } = options;

  // Estados locales
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Hooks externos
  const queryClient = useQueryClient();
  const errorHandler = useSearchErrorHandler();
  const toastHandler = useSearchToast();
  const navigation = useSearchNavigation({
    scrollToTop: true,
    onBeforeNavigate: (url) => console.log('🔍 Navegando a:', url),
    onAfterNavigate: (url) => console.log('✅ Navegación completada:', url),
  });

  // Hooks para trending y recent searches
  const { trendingSearches, trackSearch } = useTrendingSearches({
    limit: 4,
    enabled: true
  });

  const {
    recentSearches: recentSearchesList,
    addSearch: addRecentSearch,
    getRecentSearches
  } = useRecentSearches({
    maxSearches: SEARCH_CONSTANTS.MAX_RECENT_SEARCHES,
    enablePersistence: saveRecentSearches,
    expirationDays: SEARCH_CONSTANTS.RECENT_SEARCHES_EXPIRATION_DAYS
  });

  // ===================================
  // DEBOUNCED QUERY UPDATE
  // ===================================

  const updateDebouncedQuery = useDebouncedCallback(
    (value: string) => {
      setDebouncedQuery(value);

      // Analytics tracking
      if (value.trim() && process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true') {
        console.log('🔍 useSearchOptimized: Query enabled condition will be:', !!value?.trim());
      }
    },
    debounceMs,
    {
      maxWait: 2000,
      leading: false,
      trailing: true,
    }
  );

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
    dataUpdatedAt 
  } = useQuery({
    queryKey: searchQueryKeys.search(debouncedQuery),
    queryFn: async ({ queryKey, signal }) => {
      const [, , searchQuery] = queryKey;
      if (!searchQuery?.trim()) {return [];}


      try {
        // Usar la API de búsqueda correcta
        const url = `/api/search?q=${encodeURIComponent(searchQuery)}&limit=${maxSuggestions}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal, // Usar AbortController
        });

        if (!response.ok) {
          console.error('🔍 useSearchOptimized: API response not ok:', response.status);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data.products || [];
      } catch (error) {
        console.error('🔍 useSearchOptimized: API call failed:', error);
        throw error;
      }
    },
    enabled: !!debouncedQuery?.trim() && debouncedQuery.length >= 2,
    ...searchQueryConfig,
  });

  // ===================================
  // SUGGESTIONS GENERATION
  // ===================================

  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true') {
    console.log('🔍 useSearchOptimized: Current state before suggestions:', {
      query,
      debouncedQuery,
      searchResults: searchResults?.length || 0,
      isLoading,
      error: !!error
    });
  }

  const suggestions: SearchSuggestion[] = useMemo(() => {
    const allSuggestions: SearchSuggestion[] = [];
    const hasQuery = !!debouncedQuery?.trim();

    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true') {
      console.log('🔍 useSearchOptimized: query (current):', `"${query}"`);
      console.log('🔍 useSearchOptimized: searchResults isArray:', Array.isArray(searchResults));
    }

    if (hasQuery) {
      // CUANDO HAY TEXTO: Priorizar productos SIEMPRE

      // Extraer productos de la respuesta de la API
      let products = [];

      // Si searchResults es un array directamente
      if (Array.isArray(searchResults)) {
        products = searchResults;
      }
      // Si searchResults es un objeto con propiedad data (respuesta de API)
      else if (searchResults && typeof searchResults === 'object' && Array.isArray(searchResults.data)) {
        products = searchResults.data;
      }
      // Si searchResults es un objeto con propiedad products
      else if (searchResults && typeof searchResults === 'object' && Array.isArray(searchResults.products)) {
        products = searchResults.products;
      }

      if (products.length > 0) {
        const productSuggestions = products.map((product: ProductWithCategory) => {
          return {
            id: product.id.toString(),
            type: 'product' as const,
            title: product.name,
            subtitle: product.category?.name,
            image: product.images?.previews?.[0] || product.images?.thumbnails?.[0],
            badge: product.stock > 0 ? 'En stock' : 'Sin stock',
            href: `/products/${product.id}`,
          };
        });
        allSuggestions.push(...productSuggestions);
      } else {
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true') {
          console.log('🔍 useSearchOptimized: searchResults structure:', {
            isArray: Array.isArray(searchResults),
            hasData: searchResults?.data ? 'yes' : 'no',
            hasProducts: searchResults?.products ? 'yes' : 'no',
            dataLength: searchResults?.data?.length,
            productsLength: searchResults?.products?.length,
            keys: searchResults ? Object.keys(searchResults) : 'null'
          });
        }
      }

      // Solo agregar recent/trending si hay muy pocos productos
      if (allSuggestions.length < 2) {
        const recentSuggestions = getRecentSearches(2).map((search, index) => ({
          id: `recent-${index}`,
          type: 'recent' as const,
          title: search,
          href: `/shop?q=${encodeURIComponent(search)}`,
        }));
        allSuggestions.push(...recentSuggestions);
      }
    } else {
      // CUANDO NO HAY TEXTO: Mostrar trending y recent

      // Agregar búsquedas recientes primero
      const recentSuggestions = getRecentSearches(3).map((search, index) => ({
        id: `recent-${index}`,
        type: 'recent' as const,
        title: search,
        href: `/shop?q=${encodeURIComponent(search)}`,
      }));
      allSuggestions.push(...recentSuggestions);

      // Agregar trending searches
      if (allSuggestions.length < maxSuggestions) {
        const remainingSlots = maxSuggestions - allSuggestions.length;
        const trendingSuggestions = trendingSearches.slice(0, remainingSlots).map(trending => ({
          id: trending.id,
          type: 'trending' as const,
          title: trending.query,
          href: trending.href,
          badge: trending.count ? `${trending.count}` : undefined
        }));
        allSuggestions.push(...trendingSuggestions);
      }
    }

    const finalSuggestions = allSuggestions.slice(0, maxSuggestions);
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true') {
      console.log('🔍 useSearchOptimized: Final suggestions types:', finalSuggestions.map(s => s.type));
      console.log('🔍 useSearchOptimized: Final suggestions titles:', finalSuggestions.map(s => s.title));
    }

    return finalSuggestions;
  }, [debouncedQuery, searchResults, isLoading, error, maxSuggestions, trendingSearches]);


  // ===================================
  // SEARCH FUNCTIONS
  // ===================================

  const searchWithDebounce = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    updateDebouncedQuery(searchQuery);

    // Prefetch si está habilitado y la query es válida
    if (enablePrefetch && searchQuery.trim().length >= 1) {
      // Prefetch de datos de búsqueda
      queryClient.prefetchQuery({
        queryKey: searchQueryKeys.search(searchQuery),
        queryFn: () => searchProducts(searchQuery, maxSuggestions),
        ...searchQueryConfig,
      });

      // Prefetch de página de resultados
      navigation.prefetchSearch(searchQuery.trim());
    }
  }, [updateDebouncedQuery, enablePrefetch, queryClient, maxSuggestions, navigation]);

  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {return;}

    try {
      setHasSearched(true);
      
      // Guardar en historial usando el hook
      if (saveRecentSearches) {
        addRecentSearch(searchQuery.trim());
      }

      // Registrar en trending searches
      trackSearch(searchQuery.trim()).catch(console.warn);

      // Navegar a página de resultados usando navegación optimizada
      navigation.navigateToSearch(searchQuery.trim());

      // Callback externo
      if (onSearch && searchResults) {
        onSearch(searchQuery, searchResults);
      }

      toastHandler.showSuccessToast(searchQuery, searchResults?.length || 0);
      
    } catch (error) {
      console.error('❌ useSearchOptimized: Error en executeSearch:', error);
      errorHandler.handleError(error);
    }
  }, [saveRecentSearches, recentSearches, navigation, onSearch, searchResults, toastHandler, errorHandler]);

  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {

    // Navegar según el tipo de sugerencia
    if (suggestion.type === 'product') {
      navigation.navigateToProduct(suggestion.id);
    } else {
      // Para búsquedas recientes o trending, navegar a búsqueda
      navigation.navigateToSearch(suggestion.title);
    }

    // Callback externo
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }

    toastHandler.showInfoToast(`${suggestion.type === 'product' ? 'Producto' : 'Búsqueda'} seleccionado`, suggestion.title);
  }, [navigation, onSuggestionSelect, toastHandler]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setHasSearched(false);
    
    // Limpiar cache de búsquedas si es necesario
    queryClient.removeQueries({ queryKey: searchQueryKeys.searches() });
  }, [queryClient]);

  // ===================================
  // LIFECYCLE
  // ===================================

  const initialize = useCallback(() => {
    // Cargar búsquedas recientes
    if (saveRecentSearches) {
      try {
        const saved = localStorage.getItem('pinteya-recent-searches');
        if (saved && saved.trim() !== '' && saved !== '""' && saved !== "''") {
          // Validar que no esté corrupto
          if (saved.includes('""') && saved.length < 5) {
            console.warn('Detected corrupted recent searches data, cleaning up');
            localStorage.removeItem('pinteya-recent-searches');
            return;
          }

          const parsed = JSON.parse(saved);
          // Verificar que sea un array válido
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed);
          } else {
            console.warn('Invalid recent searches format, resetting');
            localStorage.removeItem('pinteya-recent-searches');
          }
        }
      } catch (error) {
        console.warn('Error cargando búsquedas recientes:', error);
        // Limpiar datos corruptos
        localStorage.removeItem('pinteya-recent-searches');
      }
    }
  }, [saveRecentSearches]);

  const cleanup = useCallback(() => {
    // Limpiar debounce y cache si es necesario
    updateDebouncedQuery.cancel();
  }, [updateDebouncedQuery]);

  // Inicializar al montar
  useEffect(() => {
    initialize();
    return cleanup;
  }, [initialize, cleanup]);

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
        queryFn: () => searchProducts(searchQuery, maxSuggestions),
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
  };
}

export default useSearchOptimized;









