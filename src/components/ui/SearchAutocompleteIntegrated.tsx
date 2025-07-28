// ===================================
// COMPONENTE: SearchAutocompleteIntegrated - Integración completa con useSearch
// ===================================

import React from 'react';
import { SearchAutocomplete, SearchAutocompleteProps } from './search-autocomplete';
import { useSearchOptimized } from '@/hooks/useSearchOptimized';

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
export const SearchAutocompleteIntegrated = React.forwardRef<HTMLInputElement, SearchAutocompleteIntegratedProps>(
  ({
    debounceMs = 100,
    maxSuggestions = 6,
    searchLimit = 12,
    saveRecentSearches = true,
    onSearchExecuted,
    onSuggestionSelected,
    onSearch,
    onSuggestionSelect,
    ...props
  }, ref) => {
    
    // Hook de búsqueda optimizado con TanStack Query
    const {
      query,
      results,
      suggestions,
      isLoading,
      error,
      searchWithDebounce,
      executeSearch,
      selectSuggestion,
      clearSearch,
    } = useSearchOptimized({
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

    // Debugging del estado del hook
    console.log('🔍 SearchAutocompleteIntegrated: Hook state:', {
      query,
      suggestions: suggestions?.length || 0,
      suggestionsDetailed: suggestions?.map(s => ({ type: s.type, title: s.title })) || [],
      isLoading,
      error,
      results: results?.length || 0
    });

    // Manejar envío de búsqueda
    const handleSearch = (query: string) => {
      executeSearch(query);
    };

    // Manejar selección de sugerencia
    const handleSuggestionSelect = (suggestion: any) => {
      selectSuggestion(suggestion);
    };

    // Manejar limpieza
    const handleClear = () => {
      clearSearch();
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
        // Callbacks integrados
        onSearch={handleSearch}
        onSuggestionSelect={handleSuggestionSelect}
        searchWithDebounce={searchWithDebounce}
        onClear={handleClear}
      />
    );
  }
);

SearchAutocompleteIntegrated.displayName = 'SearchAutocompleteIntegrated';

export default SearchAutocompleteIntegrated;
