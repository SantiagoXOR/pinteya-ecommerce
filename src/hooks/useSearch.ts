// ===================================
// HOOK: useSearch - Sistema de búsqueda centralizado
// ===================================

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { searchProducts } from '@/lib/api/products';
import { ProductWithCategory } from '@/types/api';
import { useSearchErrorHandler } from './useSearchErrorHandler';
import { useSearchToast } from './useSearchToast';

// ===================================
// TIPOS
// ===================================

export interface SearchState {
  query: string;
  results: ProductWithCategory[];
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

export interface SearchSuggestion {
  id: string;
  type: 'product' | 'category' | 'recent' | 'trending';
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  href: string;
}

export interface UseSearchOptions {
  /** Tiempo de debounce en milisegundos */
  debounceMs?: number;
  /** Número máximo de sugerencias */
  maxSuggestions?: number;
  /** Límite de resultados de búsqueda */
  searchLimit?: number;
  /** Guardar búsquedas recientes */
  saveRecentSearches?: boolean;
  /** Callback cuando se realiza una búsqueda */
  onSearch?: (query: string, results: ProductWithCategory[]) => void;
  /** Callback cuando se selecciona una sugerencia */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
}

// ===================================
// BÚSQUEDAS TRENDING POR DEFECTO
// ===================================

const defaultTrendingSearches: SearchSuggestion[] = [
  {
    id: "trending-1",
    type: "trending",
    title: "Pintura látex",
    href: "/search?q=pintura+latex",
  },
  {
    id: "trending-2",
    type: "trending",
    title: "Sherwin Williams",
    href: "/search?q=sherwin+williams",
  },
  {
    id: "trending-3",
    type: "trending",
    title: "Rodillos premium",
    href: "/search?q=rodillos+premium",
  },
  {
    id: "trending-4",
    type: "trending",
    title: "Pinceles",
    href: "/search?q=pinceles",
  },
];

// ===================================
// HOOK PRINCIPAL
// ===================================

export function useSearch(options: UseSearchOptions = {}) {
  const {
    debounceMs = 150,
    maxSuggestions = 8,
    searchLimit = 12,
    saveRecentSearches = true,
    onSearch,
    onSuggestionSelect
  } = options;

  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>();
  const safetyTimeoutRef = useRef<NodeJS.Timeout>(); // Timeout de seguridad para evitar loading permanente
  const optionsRef = useRef(options); // Ref para opciones estables
  const recentSearchesRef = useRef<string[]>([]); // Ref para búsquedas recientes

  // Hooks para manejo de errores y toast notifications
  const errorHandler = useSearchErrorHandler({
    onError: (error) => {
      console.error('Error de búsqueda:', error);
    },
    onRetrySuccess: () => {
      toastHandler.showRetrySuccessToast();
    },
    onRetryFailed: (error, attempts) => {
      toastHandler.showRetryFailedToast(attempts);
    },
  });

  const toastHandler = useSearchToast({
    defaultDuration: 4000,
    maxToasts: 2,
  });

  // Actualizar ref cuando cambien las opciones
  optionsRef.current = options;

  // Estado principal
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    suggestions: [],
    isLoading: false,
    error: null,
    hasSearched: false,
  });

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Sincronizar referencia con estado para evitar dependencias en useCallback
  React.useEffect(() => {
    recentSearchesRef.current = recentSearches;
  }, [recentSearches]);

  // ===================================
  // FUNCIONES AUXILIARES SIMPLIFICADAS
  // ===================================

  // ===================================
  // FUNCIONES PRINCIPALES CON USE-DEBOUNCE
  // ===================================

  /**
   * Función de búsqueda interna optimizada
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    console.log('🔍 useSearch: performSearch ejecutando para:', searchQuery);

    // Limpiar timeout de seguridad anterior
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
    }

    // Si la query está vacía, mostrar sugerencias por defecto
    if (!searchQuery.trim()) {
      console.log('🔍 useSearch: Query vacía, mostrando sugerencias por defecto');
      const defaultSuggestions = [
        ...defaultTrendingSearches.slice(0, 4),
        ...recentSearchesRef.current.slice(0, 3).map((search, index) => ({
          id: `recent-${index}`,
          type: 'recent' as const,
          title: search,
          href: `/search?q=${encodeURIComponent(search)}`,
        }))
      ].slice(0, maxSuggestions);

      setState(prev => ({
        ...prev,
        query: searchQuery,
        suggestions: defaultSuggestions,
        isLoading: false,
      }));
      return;
    }

    // Timeout de seguridad para evitar loading permanente (5 segundos)
    safetyTimeoutRef.current = setTimeout(() => {
      console.log('⚠️ useSearch: Timeout de seguridad activado - reseteando loading state');
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Tiempo de espera agotado. Intenta nuevamente.',
      }));
    }, 5000);

    // Ejecutar búsqueda directamente (el debounce se maneja en searchWithDebounce)
    try {
      console.log('🔍 useSearch: Iniciando búsqueda para:', searchQuery);

      const response = await searchProducts(searchQuery, maxSuggestions);
      console.log('📦 useSearch: Respuesta de búsqueda:', response);

      // Limpiar timeout de seguridad ya que la API respondió
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }

        if (response.success && response.data && Array.isArray(response.data)) {
          const productSuggestions = response.data.map(product => ({
            id: `product-${product.id}`,
            type: 'product' as const,
            title: product.name,
            subtitle: product.category?.name || 'Sin categoría',
            image: product.images?.previews?.[0] || '/images/products/placeholder.jpg',
            badge: product.stock > 0 ? 'En stock' : 'Sin stock',
            href: `/shop-details/${product.id}`,
          }));

          console.log('✅ useSearch: Sugerencias generadas:', productSuggestions.length);

          setState(prev => ({
            ...prev,
            query: searchQuery, // Actualizar query cuando hay resultados exitosos
            suggestions: productSuggestions,
            isLoading: false,
            error: null,
          }));
        } else {
          console.log('⚠️ useSearch: Sin resultados o respuesta no exitosa');
          setState(prev => ({
            ...prev,
            query: searchQuery, // Actualizar query incluso cuando no hay resultados
            suggestions: [],
            isLoading: false,
            error: response.error || 'No se encontraron resultados',
          }));
        }
      } catch (error) {
        console.error('❌ useSearch: Error en búsqueda:', error);

        // Limpiar timeout de seguridad
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
        }

        setState(prev => ({
          ...prev,
          query: searchQuery, // Actualizar query incluso en caso de error
          suggestions: [],
          isLoading: false,
          error: 'Error en la búsqueda. Intenta nuevamente.',
        }));
      }
  }, [maxSuggestions]); // Solo maxSuggestions es necesario como dependencia

  /**
   * Función de búsqueda con debounce optimizado usando use-debounce
   */
  const searchWithDebounce = useDebouncedCallback(
    (searchQuery: string) => {
      console.log('🔍 useSearch: searchWithDebounce (use-debounce) llamado con:', searchQuery);

      // Actualizar estado de loading inmediatamente
      setState(prev => ({
        ...prev,
        isLoading: !!searchQuery.trim(),
        error: null,
      }));

      // Ejecutar búsqueda
      performSearch(searchQuery);
    },
    debounceMs,
    {
      maxWait: 2000,
      leading: false,
      trailing: true,
    }
  );

  /**
   * Ejecuta una búsqueda completa y navega a resultados
   */
  const executeSearch = useCallback(async (searchQuery: string, category?: string) => {
    if (!searchQuery.trim()) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Guardar en historial
      if (saveRecentSearches && searchQuery.trim()) {
        const updated = [
          searchQuery.trim(),
          ...recentSearchesRef.current.filter(s => s !== searchQuery.trim())
        ].slice(0, 5);

        setRecentSearches(updated);
        try {
          localStorage.setItem('pinteya-recent-searches', JSON.stringify(updated));
        } catch (error) {
          console.warn('Error guardando búsqueda reciente:', error);
        }
      }

      // Realizar búsqueda con manejo robusto de errores
      const response = await errorHandler.executeWithRetry(
        () => searchProducts(searchQuery.trim(), searchLimit),
        `búsqueda de "${searchQuery.trim()}"`
      );

      if (response.success && response.data) {
        const resultCount = response.data.length;

        setState(prev => ({
          ...prev,
          results: response.data || [],
          isLoading: false,
          hasSearched: true,
          error: null,
        }));

        // Limpiar errores previos
        errorHandler.clearError();

        // Mostrar toast de éxito si hay resultados
        if (resultCount > 0) {
          toastHandler.showSuccessToast(searchQuery.trim(), resultCount);
        } else {
          toastHandler.showNoResultsToast(searchQuery.trim());
        }

        // Callback personalizado
        optionsRef.current.onSearch?.(searchQuery.trim(), response.data || []);

        // Navegar a resultados
        const searchParams = new URLSearchParams();
        searchParams.set('q', searchQuery.trim());
        if (category) {
          searchParams.set('category', category);
        }

        router.push(`/search?${searchParams.toString()}`);
      } else {
        const errorMessage = response.error || 'No se encontraron resultados';

        setState(prev => ({
          ...prev,
          results: [],
          isLoading: false,
          hasSearched: true,
          error: errorMessage,
        }));

        // Mostrar toast de advertencia para respuestas sin éxito
        toastHandler.showWarningToast('Búsqueda sin resultados', errorMessage);
      }
    } catch (error) {
      console.error('❌ Error ejecutando búsqueda:', error);

      // Manejar error con el error handler
      const searchError = errorHandler.handleError(error);

      setState(prev => ({
        ...prev,
        results: [],
        isLoading: false,
        hasSearched: true,
        error: searchError.message,
      }));

      // Mostrar toast de error
      toastHandler.showErrorToast(searchError, errorHandler.retryCount, () => {
        executeSearch(searchQuery.trim(), category);
      });
    }
  }, [searchLimit, saveRecentSearches, router, errorHandler, toastHandler]); // Remover recentSearches de dependencias para evitar bucle infinito

  /**
   * Maneja la selección de una sugerencia
   */
  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    // Guardar en historial si es producto o categoría
    if ((suggestion.type === 'product' || suggestion.type === 'category') && saveRecentSearches) {
      const updated = [
        suggestion.title,
        ...recentSearchesRef.current.filter(s => s !== suggestion.title)
      ].slice(0, 5);

      setRecentSearches(updated);
      try {
        localStorage.setItem('pinteya-recent-searches', JSON.stringify(updated));
      } catch (error) {
        console.warn('Error guardando búsqueda reciente:', error);
      }
    }

    // Actualizar estado
    setState(prev => ({
      ...prev,
      query: suggestion.title,
    }));

    // Callback personalizado
    optionsRef.current.onSuggestionSelect?.(suggestion);

    // Navegar
    router.push(suggestion.href);
  }, [saveRecentSearches, router]); // Remover recentSearches de dependencias para evitar bucle infinito

  /**
   * Limpia el estado de búsqueda
   */
  const clearSearch = useCallback(() => {
    console.log('🧹 useSearch: clearSearch llamado');

    // Limpiar todos los timeouts
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
    }

    // Resetear estado completamente (sin sugerencias por defecto para tests)
    setState({
      query: '',
      results: [],
      suggestions: [],
      isLoading: false,
      error: null,
      hasSearched: false,
    });
  }, []); // Remover dependencia circular

  /**
   * Inicializa el hook (cargar búsquedas recientes)
   */
  const initialize = useCallback(() => {
    if (saveRecentSearches) {
      try {
        const stored = localStorage.getItem('pinteya-recent-searches');
        if (stored && stored.trim() !== '' && stored !== '""' && stored !== "''") {
          // Validar que no esté corrupto
          if (stored.includes('""') && stored.length < 5) {
            console.warn('Detected corrupted recent searches data, cleaning up');
            localStorage.removeItem('pinteya-recent-searches');
            return;
          }

          const parsed = JSON.parse(stored);
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

  // ===================================
  // CLEANUP
  // ===================================

  const cleanup = useCallback(() => {
    // Cancelar debounce de use-debounce
    searchWithDebounce.cancel();

    // Limpiar timeouts manuales restantes
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
    }
  }, [searchWithDebounce]);

  // ===================================
  // RETURN
  // ===================================

  return {
    // Estado
    ...state,
    recentSearches,

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
  };
}

export default useSearch;
