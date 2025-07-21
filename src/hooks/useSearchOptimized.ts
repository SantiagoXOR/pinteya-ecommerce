// ===================================
// HOOK: useSearchOptimized - Sistema de búsqueda con TanStack Query
// ===================================

import { useState, useCallback, useEffect, useRef } from 'react';
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
      if (value.trim()) {
        console.log('🔍 useSearchOptimized: Query debounced:', value);
        console.log('🔍 useSearchOptimized: New debouncedQuery value:', value);
        console.log('🔍 useSearchOptimized: Value type:', typeof value);
        console.log('🔍 useSearchOptimized: Value length:', value?.length);
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
      if (!searchQuery?.trim()) return [];
      
      console.log('🔍 useSearchOptimized: Executing search for:', searchQuery);

      // AbortController para cancelar requests (nota: searchProducts no soporta signal aún)
      const response = await searchProducts(searchQuery, maxSuggestions);
      console.log('🔍 useSearchOptimized: API response:', response);
      console.log('🔍 useSearchOptimized: Response data:', response.data);
      console.log('🔍 useSearchOptimized: Response success:', response.success);
      return response.data || [];
    },
    enabled: (() => {
      const isEnabled = !!debouncedQuery?.trim() && debouncedQuery.length >= 1;
      console.log('🔍 useSearchOptimized: Query enabled condition:', isEnabled, 'for query:', debouncedQuery);
      return isEnabled;
    })(),
    ...searchQueryConfig,
  });

  // ===================================
  // SUGGESTIONS GENERATION
  // ===================================

  const suggestions: SearchSuggestion[] = (() => {
    const allSuggestions: SearchSuggestion[] = [];
    const hasQuery = !!debouncedQuery?.trim();

    console.log('🔍 useSearchOptimized: === GENERATING SUGGESTIONS ===');
    console.log('🔍 useSearchOptimized: hasQuery:', hasQuery);
    console.log('🔍 useSearchOptimized: debouncedQuery:', `"${debouncedQuery}"`);
    console.log('🔍 useSearchOptimized: query (current):', `"${query}"`);
    console.log('🔍 useSearchOptimized: isLoading:', isLoading);
    console.log('🔍 useSearchOptimized: error:', error);
    console.log('🔍 useSearchOptimized: searchResults:', searchResults);
    console.log('🔍 useSearchOptimized: searchResults type:', typeof searchResults);
    console.log('🔍 useSearchOptimized: searchResults.data isArray:', Array.isArray(searchResults?.data));
    console.log('🔍 useSearchOptimized: searchResults.data length:', searchResults?.data?.length);

    if (hasQuery) {
      // CUANDO HAY TEXTO: Priorizar productos SIEMPRE
      console.log('🔍 useSearchOptimized: *** PROCESSING QUERY MODE ***');

      if (Array.isArray(searchResults?.data) && searchResults.data.length > 0) {
        console.log('🔍 useSearchOptimized: Processing', searchResults.data.length, 'products');
        const productSuggestions = searchResults.data.map((product) => {
          console.log('🔍 useSearchOptimized: Mapping product:', product.name);
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
        console.log('🔍 useSearchOptimized: ✅ Added', productSuggestions.length, 'product suggestions');
      } else {
        console.log('🔍 useSearchOptimized: ❌ No products found or invalid searchResults');
        console.log('🔍 useSearchOptimized: searchResults details:', {
          isArray: Array.isArray(searchResults?.data),
          length: searchResults?.data?.length,
          value: searchResults
        });
      }

      // Solo agregar recent/trending si hay muy pocos productos
      if (allSuggestions.length < 2) {
        console.log('🔍 useSearchOptimized: Adding recent searches as fallback');
        const recentSuggestions = getRecentSearches(2).map((search, index) => ({
          id: `recent-${index}`,
          type: 'recent' as const,
          title: search,
          href: `/shop?q=${encodeURIComponent(search)}`,
        }));
        allSuggestions.push(...recentSuggestions);
        console.log('🔍 useSearchOptimized: Added', recentSuggestions.length, 'recent suggestions as fallback');
      }
    } else {
      // CUANDO NO HAY TEXTO: Mostrar trending y recent
      console.log('🔍 useSearchOptimized: *** PROCESSING EMPTY MODE ***');

      // Agregar búsquedas recientes primero
      const recentSuggestions = getRecentSearches(3).map((search, index) => ({
        id: `recent-${index}`,
        type: 'recent' as const,
        title: search,
        href: `/shop?q=${encodeURIComponent(search)}`,
      }));
      allSuggestions.push(...recentSuggestions);
      console.log('🔍 useSearchOptimized: Added', recentSuggestions.length, 'recent suggestions');

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
        console.log('🔍 useSearchOptimized: Added', trendingSuggestions.length, 'trending suggestions');
      }
    }

    const finalSuggestions = allSuggestions.slice(0, maxSuggestions);
    console.log('🔍 useSearchOptimized: === FINAL RESULT ===');
    console.log('🔍 useSearchOptimized: Final suggestions count:', finalSuggestions.length);
    console.log('🔍 useSearchOptimized: Final suggestions types:', finalSuggestions.map(s => s.type));
    console.log('🔍 useSearchOptimized: Final suggestions titles:', finalSuggestions.map(s => s.title));
    console.log('🔍 useSearchOptimized: === END SUGGESTIONS ===');

    return finalSuggestions;
  })();

  console.log('🔍 useSearchOptimized: Generated suggestions:', suggestions.length, suggestions);

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
    if (!searchQuery.trim()) return;

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

      toastHandler.showSuccessToast(searchQuery, searchResults?.data?.length || 0);
      
    } catch (error) {
      console.error('❌ useSearchOptimized: Error en executeSearch:', error);
      errorHandler.handleError(error);
    }
  }, [saveRecentSearches, recentSearches, navigation, onSearch, searchResults, toastHandler, errorHandler]);

  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    console.log('✅ useSearchOptimized: Suggestion selected:', suggestion.title);

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
