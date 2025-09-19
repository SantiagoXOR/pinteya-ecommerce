// ===================================
// HOOK: useFilterAnalytics - Sistema de Analytics para Filtros
// ===================================

import { useCallback, useEffect, useRef } from 'react';
import { ProductFilterState } from './useProductFilters';

// ===================================
// TIPOS
// ===================================

export interface FilterAnalyticsEvent {
  event: string;
  category: 'filter';
  action: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
  timestamp: number;
  session_id: string;
  user_id?: string;
  page_url: string;
  page_title: string;
}

export interface FilterMetrics {
  filter_applied: {
    filter_type: string;
    filter_value: string;
    results_count: number;
    time_to_apply: number;
  };
  filter_removed: {
    filter_type: string;
    filter_value: string;
    remaining_filters: number;
  };
  filter_cleared: {
    total_filters_cleared: number;
    filter_types: string[];
  };
  search_performed: {
    query: string;
    results_count: number;
    has_filters: boolean;
    filter_count: number;
  };
  pagination_used: {
    from_page: number;
    to_page: number;
    total_pages: number;
    results_per_page: number;
  };
  sort_changed: {
    from_sort: string;
    to_sort: string;
    results_count: number;
  };
}

export interface UseFilterAnalyticsOptions {
  enabled?: boolean;
  debug?: boolean;
  sessionId?: string;
  userId?: string;
}

// ===================================
// UTILIDADES
// ===================================

// Generar ID de sesión único
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Obtener o crear session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') {return generateSessionId();}
  
  let sessionId = sessionStorage.getItem('filter_analytics_session');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('filter_analytics_session', sessionId);
  }
  return sessionId;
};

// Enviar evento a Google Analytics 4
const sendToGA4 = (event: FilterAnalyticsEvent) => {
  if (typeof window === 'undefined' || !window.gtag) {return;}

  window.gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
    custom_map: event.custom_parameters,
    session_id: event.session_id,
    page_location: event.page_url,
    page_title: event.page_title,
  });
};

// Enviar evento a Supabase Analytics
const sendToSupabase = async (event: FilterAnalyticsEvent) => {
  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.warn('Failed to send analytics event to Supabase:', error);
  }
};

// ===================================
// HOOK PRINCIPAL
// ===================================

export function useFilterAnalytics(options: UseFilterAnalyticsOptions = {}) {
  const {
    enabled = true,
    debug = process.env.NODE_ENV === 'development',
    sessionId: providedSessionId,
    userId,
  } = options;

  const sessionId = useRef(providedSessionId || getSessionId());
  const startTime = useRef<number>(Date.now());

  // Función para crear evento base
  const createBaseEvent = useCallback((
    action: string,
    label?: string,
    value?: number,
    customParameters?: Record<string, any>
  ): FilterAnalyticsEvent => {
    return {
      event: `filter_${action}`,
      category: 'filter',
      action,
      label,
      value,
      custom_parameters: customParameters,
      timestamp: Date.now(),
      session_id: sessionId.current,
      user_id: userId,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      page_title: typeof window !== 'undefined' ? document.title : '',
    };
  }, [userId]);

  // Función para enviar evento
  const trackEvent = useCallback(async (event: FilterAnalyticsEvent) => {
    if (!enabled) {return;}

    if (debug) {
    }

    // Enviar a múltiples destinos
    try {
      // Google Analytics 4
      sendToGA4(event);
      
      // Supabase Analytics
      await sendToSupabase(event);
    } catch (error) {
      console.warn('Analytics tracking error:', error);
    }
  }, [enabled, debug]);

  // ===================================
  // MÉTODOS DE TRACKING ESPECÍFICOS
  // ===================================

  const trackFilterApplied = useCallback((
    filterType: string,
    filterValue: string,
    resultsCount: number
  ) => {
    const timeToApply = Date.now() - startTime.current;
    const event = createBaseEvent('applied', `${filterType}:${filterValue}`, resultsCount, {
      filter_type: filterType,
      filter_value: filterValue,
      results_count: resultsCount,
      time_to_apply: timeToApply,
    });
    trackEvent(event);
    startTime.current = Date.now(); // Reset para próxima medición
  }, [createBaseEvent, trackEvent]);

  const trackFilterRemoved = useCallback((
    filterType: string,
    filterValue: string,
    remainingFilters: number
  ) => {
    const event = createBaseEvent('removed', `${filterType}:${filterValue}`, remainingFilters, {
      filter_type: filterType,
      filter_value: filterValue,
      remaining_filters: remainingFilters,
    });
    trackEvent(event);
  }, [createBaseEvent, trackEvent]);

  const trackFiltersCleared = useCallback((
    totalFiltersCleared: number,
    filterTypes: string[]
  ) => {
    const event = createBaseEvent('cleared', 'all_filters', totalFiltersCleared, {
      total_filters_cleared: totalFiltersCleared,
      filter_types: filterTypes,
    });
    trackEvent(event);
  }, [createBaseEvent, trackEvent]);

  const trackSearchPerformed = useCallback((
    query: string,
    resultsCount: number,
    hasFilters: boolean,
    filterCount: number
  ) => {
    const event = createBaseEvent('search', query, resultsCount, {
      query,
      results_count: resultsCount,
      has_filters: hasFilters,
      filter_count: filterCount,
    });
    trackEvent(event);
  }, [createBaseEvent, trackEvent]);

  const trackPaginationUsed = useCallback((
    fromPage: number,
    toPage: number,
    totalPages: number,
    resultsPerPage: number
  ) => {
    const event = createBaseEvent('pagination', `${fromPage}_to_${toPage}`, toPage, {
      from_page: fromPage,
      to_page: toPage,
      total_pages: totalPages,
      results_per_page: resultsPerPage,
    });
    trackEvent(event);
  }, [createBaseEvent, trackEvent]);

  const trackSortChanged = useCallback((
    fromSort: string,
    toSort: string,
    resultsCount: number
  ) => {
    const event = createBaseEvent('sort_changed', `${fromSort}_to_${toSort}`, resultsCount, {
      from_sort: fromSort,
      to_sort: toSort,
      results_count: resultsCount,
    });
    trackEvent(event);
  }, [createBaseEvent, trackEvent]);

  // Tracking automático de cambios en filtros
  const trackFilterChanges = useCallback((
    previousFilters: ProductFilterState,
    currentFilters: ProductFilterState,
    resultsCount: number
  ) => {
    // Detectar filtros añadidos
    const addedCategories = currentFilters.categories.filter(
      cat => !previousFilters.categories.includes(cat)
    );
    const addedBrands = currentFilters.brands.filter(
      brand => !previousFilters.brands.includes(brand)
    );

    // Detectar filtros removidos
    const removedCategories = previousFilters.categories.filter(
      cat => !currentFilters.categories.includes(cat)
    );
    const removedBrands = previousFilters.brands.filter(
      brand => !currentFilters.brands.includes(brand)
    );

    // Track filtros añadidos
    addedCategories.forEach(category => {
      trackFilterApplied('category', category, resultsCount);
    });
    addedBrands.forEach(brand => {
      trackFilterApplied('brand', brand, resultsCount);
    });

    // Track filtros removidos
    const remainingFilters = currentFilters.categories.length + currentFilters.brands.length;
    removedCategories.forEach(category => {
      trackFilterRemoved('category', category, remainingFilters);
    });
    removedBrands.forEach(brand => {
      trackFilterRemoved('brand', brand, remainingFilters);
    });

    // Track cambios de precio
    if (previousFilters.priceMin !== currentFilters.priceMin || 
        previousFilters.priceMax !== currentFilters.priceMax) {
      const priceRange = `${currentFilters.priceMin || 0}-${currentFilters.priceMax || 'max'}`;
      trackFilterApplied('price_range', priceRange, resultsCount);
    }

    // Track cambios de búsqueda
    if (previousFilters.search !== currentFilters.search && currentFilters.search) {
      const hasFilters = currentFilters.categories.length > 0 || currentFilters.brands.length > 0;
      const filterCount = currentFilters.categories.length + currentFilters.brands.length;
      trackSearchPerformed(currentFilters.search, resultsCount, hasFilters, filterCount);
    }

    // Track cambios de ordenamiento
    if (previousFilters.sortBy !== currentFilters.sortBy) {
      trackSortChanged(previousFilters.sortBy, currentFilters.sortBy, resultsCount);
    }

    // Track cambios de página
    if (previousFilters.page !== currentFilters.page) {
      trackPaginationUsed(
        previousFilters.page,
        currentFilters.page,
        Math.ceil(resultsCount / currentFilters.limit),
        currentFilters.limit
      );
    }
  }, [
    trackFilterApplied,
    trackFilterRemoved,
    trackSearchPerformed,
    trackSortChanged,
    trackPaginationUsed,
  ]);

  // Tracking de sesión al montar
  useEffect(() => {
    if (!enabled) {return;}

    const event = createBaseEvent('session_started', 'filter_system', 1, {
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : '',
      screen_resolution: typeof window !== 'undefined' 
        ? `${window.screen.width}x${window.screen.height}` 
        : '',
      viewport_size: typeof window !== 'undefined'
        ? `${window.innerWidth}x${window.innerHeight}`
        : '',
    });

    trackEvent(event);

    // Cleanup al desmontar
    return () => {
      const endEvent = createBaseEvent('session_ended', 'filter_system', 1, {
        session_duration: Date.now() - startTime.current,
      });
      trackEvent(endEvent);
    };
  }, [enabled, createBaseEvent, trackEvent]);

  return {
    // Métodos de tracking específicos
    trackFilterApplied,
    trackFilterRemoved,
    trackFiltersCleared,
    trackSearchPerformed,
    trackPaginationUsed,
    trackSortChanged,
    trackFilterChanges,
    
    // Método genérico
    trackEvent,
    
    // Información de sesión
    sessionId: sessionId.current,
    userId,
    enabled,
  };
}









