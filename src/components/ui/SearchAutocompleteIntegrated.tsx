// ===================================
// COMPONENTE: SearchAutocompleteIntegrated - Integración completa con useSearch
// ===================================

import React, { useCallback, useState, useEffect } from 'react';
import { SearchAutocomplete, SearchAutocompleteProps } from './search-autocomplete';
import { useSearchOptimized } from '@/hooks/useSearchOptimized';
import { useTrendingSearches } from '@/hooks/useTrendingSearches';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { SEARCH_CONSTANTS } from '@/constants/shop';

export interface SearchAutocompleteIntegratedProps 
  extends Omit<SearchAutocompleteProps, 'query' | 'suggestions' | 'isLoading' | 'error' | 'searchWithDebounce' | 'onClear'> {
  // Configuración del hook useSearch
  debounceMs?: number;
  maxSuggestions?: number;
  searchLimit?: number;
  saveRecentSearches?: boolean;
  
  // Callbacks adicionales
  onSearchExecuted?: (query: string, results: any[]) => void;
  onSuggestionSelected?: (suggestion: any) => void;
}

/**
 * SearchAutocompleteIntegrated - Componente que integra SearchAutocomplete con useSearch
 * 
 * Este componente proporciona una experiencia de búsqueda completa sin necesidad
 * de manejar manualmente el estado del hook useSearch.
 */
export const SearchAutocompleteIntegrated = React.memo(React.forwardRef<HTMLInputElement, SearchAutocompleteIntegratedProps>(
  ({
    debounceMs = 100,
    maxSuggestions = 6,
    searchLimit = 12,
    saveRecentSearches = true,
    showTrendingSearches = true,
    showRecentSearches = true,
    onSearchExecuted,
    onSuggestionSelected,
    onSearch,
    onSuggestionSelect,
    ...props
  }, ref) => {
    
    // Estado de hidratación del cliente y contexto
    const [isClient, setIsClient] = useState(false);
    const [isContextReady, setIsContextReady] = useState(false);
    
    // Hook de búsqueda optimizado con TanStack Query - SIEMPRE llamado
    const searchHookResult = useSearchOptimized({
      debounceMs,
      maxSuggestions,
      searchLimit,
      saveRecentSearches,
      onSearch: (query, results) => {
        onSearchExecuted?.(query, results);
        onSearch?.(query);
      },
      onSuggestionSelect: (suggestion) => {
        onSuggestionSelected?.(suggestion);
        onSuggestionSelect?.(suggestion);
      }
    });

    // Verificar que estamos en el cliente y el contexto está listo
    useEffect(() => {
      setIsClient(true);
      // Pequeño delay para asegurar que el contexto de React Query esté completamente inicializado
      const timer = setTimeout(() => {
        setIsContextReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }, []);

    // Hooks adicionales para trending y recent searches - SIEMPRE llamados
    const trendingHookResult = useTrendingSearches({
      limit: 4,
      enabled: showTrendingSearches && isClient && isContextReady
    });

    const recentHookResult = useRecentSearches({
      maxSearches: SEARCH_CONSTANTS.MAX_RECENT_SEARCHES,
      enablePersistence: showRecentSearches && isClient && isContextReady,
      expirationDays: SEARCH_CONSTANTS.RECENT_SEARCHES_EXPIRATION_DAYS
    });

    // Valores por defecto para SSR
    const defaultValues = {
      query: '',
      results: [],
      suggestions: [],
      isLoading: false,
      error: null,
      searchWithDebounce: () => {},
      executeSearch: () => {},
      selectSuggestion: () => {},
      clearSearch: () => {},
      trendingSearches: [],
      recentSearches: [],
      getRecentSearches: () => []
    };

    // Usar valores del hook solo si estamos en el cliente
    const {
      query,
      results,
      suggestions: searchSuggestions,
      isLoading,
      error,
      searchWithDebounce,
      executeSearch,
      selectSuggestion,
      clearSearch,
    } = isClient ? searchHookResult : defaultValues;

    const { trendingSearches } = isClient ? trendingHookResult : { trendingSearches: [] };

    const {
      recentSearches,
      getRecentSearches
    } = isClient ? recentHookResult : { recentSearches: [], getRecentSearches: () => [] };

    // Generar sugerencias combinadas
    const suggestions = React.useMemo(() => {
      if (!isClient) return [];
      
      console.log('🔍 SearchAutocompleteIntegrated - Generando sugerencias:', {
        query: query?.trim(),
        hasQuery: !!query?.trim(),
        searchSuggestions: (searchSuggestions && Array.isArray(searchSuggestions)) ? searchSuggestions.length : 0,
        trendingSearches: (trendingSearches && Array.isArray(trendingSearches)) ? trendingSearches.length : 0,
        recentSearches: (recentSearches && Array.isArray(recentSearches)) ? recentSearches.length : 0,
        showTrendingSearches,
        showRecentSearches
      });

      // Si hay query, usar las sugerencias del hook optimizado
      if (query?.trim()) {
        console.log('🔍 Usando searchSuggestions porque hay query:', searchSuggestions);
        return searchSuggestions || [];
      }

      // Si no hay query, mostrar trending y recent searches como el componente original
      const defaultSuggestions: any[] = [];

      console.log('🔍 Generando sugerencias por defecto (sin query)');

      // Agregar búsquedas recientes
      if (showRecentSearches && recentSearches && Array.isArray(recentSearches) && recentSearches.length > 0) {
        const recentSuggestions = getRecentSearches(3).map((search, index) => ({
          id: `recent-${index}`,
          type: 'recent' as const,
          title: search,
          href: `/search?q=${encodeURIComponent(search)}`,
        }));
        console.log('🔍 Agregando búsquedas recientes:', recentSuggestions);
        defaultSuggestions.push(...recentSuggestions);
      }

      // Agregar búsquedas trending reales
      if (showTrendingSearches && trendingSearches && Array.isArray(trendingSearches) && trendingSearches.length > 0) {
        const trendingSuggestions = trendingSearches.map(trending => ({
          id: trending.id,
          type: 'trending' as const,
          title: trending.query,
          href: trending.href,
          badge: trending.count ? `${trending.count}` : undefined
        }));
        console.log('🔍 Agregando búsquedas trending:', trendingSuggestions);
        defaultSuggestions.push(...trendingSuggestions.slice(0, 4));
      }

      const finalSuggestions = defaultSuggestions.slice(0, maxSuggestions);
      console.log('🔍 Sugerencias finales generadas:', finalSuggestions);
      
      return finalSuggestions;
    }, [isClient, query, searchSuggestions, showRecentSearches, showTrendingSearches, recentSearches, trendingSearches, getRecentSearches, maxSuggestions]);

    // Debugging del estado del hook
    if (isClient && process.env.NODE_ENV === 'development') {
      console.log('🔍 SearchAutocompleteIntegrated: Hook state:', {
        query,
        suggestions: suggestions?.length || 0,
        suggestionsDetailed: suggestions?.map(s => ({ type: s.type, title: s.title })) || [],
        isLoading,
        error,
        results: results?.length || 0,
        trendingSearches: trendingSearches?.length || 0,
        recentSearches: recentSearches?.length || 0
      });
    }

    // Manejar envío de búsqueda
    const handleSearch = (query: string) => {
      if (isClient) {
        executeSearch(query);
      }
    };

    // Manejar selección de sugerencia
    const handleSuggestionSelect = (suggestion: any) => {
      if (isClient) {
        selectSuggestion(suggestion);
      }
    };

    // Manejar limpieza
    const handleClear = () => {
      if (isClient) {
        clearSearch();
      }
    };

    return (
      <SearchAutocomplete
        ref={ref}
        {...props}
        // Estado del hook optimizado
        query={query}
        suggestions={suggestions}
        isLoading={isLoading}
        error={error}
        showTrendingSearches={showTrendingSearches}
        showRecentSearches={showRecentSearches}
        // Callbacks integrados
        onSearch={handleSearch}
        onSuggestionSelect={handleSuggestionSelect}
        searchWithDebounce={searchWithDebounce}
        onClear={handleClear}
      />
    );
  }
));

SearchAutocompleteIntegrated.displayName = 'SearchAutocompleteIntegrated';

export default SearchAutocompleteIntegrated;









