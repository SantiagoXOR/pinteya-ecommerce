/**
 * useCategoryData Hook
 * Manages category data fetching, caching, and state
 * Pinteya E-commerce - Enterprise-ready implementation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Category, UseCategoryDataReturn } from '@/types/categories';

/**
 * Configuration options for the category data hook
 */
interface UseCategoryDataOptions {
  /** Whether to fetch data immediately on mount */
  autoFetch?: boolean;
  /** Cache duration in milliseconds */
  cacheDuration?: number;
  /** Whether to enable background refresh */
  enableBackgroundRefresh?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Maximum number of categories to fetch */
  maxCategories?: number;
  /** Whether to enable analytics tracking */
  enableAnalytics?: boolean;
  /** Fallback categories if API fails */
  fallbackCategories?: Category[];
  /** API endpoint for categories */
  apiEndpoint?: string;
}

/**
 * Cache interface for storing category data
 */
interface CategoryCache {
  data: Category[];
  timestamp: number;
  expiresAt: number;
}

/**
 * In-memory cache for category data
 */
const categoryCache = new Map<string, CategoryCache>();

/**
 * Default categories data (fallback) - ELIMINADO
 * DATOS HARDCODEADOS ELIMINADOS - Ahora usa solo API real de Supabase
 * Las categorías se obtienen dinámicamente desde /api/categories
 */
const DEFAULT_CATEGORIES: Category[] = [];

/**
 * Custom hook for managing category data
 * 
 * Features:
 * - Data fetching with caching
 * - Background refresh
 * - Error handling and fallbacks
 * - Performance optimization
 * - Analytics tracking
 * 
 * @param options Configuration options
 * @returns Category data state and actions
 */
export const useCategoryData = (
  options: UseCategoryDataOptions = {}
): UseCategoryDataReturn => {
  const {
    autoFetch = true,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    enableBackgroundRefresh = true,
    refreshInterval = 30 * 60 * 1000, // 30 minutes
    maxCategories = 20,
    enableAnalytics = true,
    fallbackCategories = [], // Sin fallback - usar solo datos de API
    apiEndpoint = '/api/categories',
  } = options;

  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate cache key based on options
   */
  const cacheKey = useMemo(() => {
    return `categories_${maxCategories}_${apiEndpoint}`;
  }, [maxCategories, apiEndpoint]);

  /**
   * Check if cached data is valid
   */
  const isCacheValid = useCallback((cache: CategoryCache): boolean => {
    return Date.now() < cache.expiresAt;
  }, []);

  /**
   * Get data from cache if valid
   */
  const getCachedData = useCallback((): Category[] | null => {
    const cached = categoryCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      return cached.data;
    }
    return null;
  }, [cacheKey, isCacheValid]);

  /**
   * Store data in cache
   */
  const setCachedData = useCallback((data: Category[]) => {
    const now = Date.now();
    categoryCache.set(cacheKey, {
      data,
      timestamp: now,
      expiresAt: now + cacheDuration,
    });
  }, [cacheKey, cacheDuration]);

  /**
   * Track analytics event
   */
  const trackAnalytics = useCallback((event: string, data?: any) => {
    if (!enableAnalytics) {return;}

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'category_data', {
        event_category: 'data',
        event_label: event,
        custom_parameters: data,
      });
    }

    if (process.env.NODE_ENV === 'development') {
    }
  }, [enableAnalytics]);

  /**
   * Fetch categories from API
   */
  const fetchCategories = useCallback(async (): Promise<Category[]> => {
    try {
      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle different API response formats
      let categoriesData: Category[];
      if (Array.isArray(result)) {
        categoriesData = result;
      } else if (result.data && Array.isArray(result.data)) {
        categoriesData = result.data;
      } else if (result.categories && Array.isArray(result.categories)) {
        categoriesData = result.categories;
      } else {
        throw new Error('Invalid API response format');
      }

      // Validate and transform data
      const validCategories = categoriesData
        .filter((cat): cat is any =>
          typeof cat === 'object' &&
          cat !== null &&
          (typeof cat.id === 'string' || typeof cat.id === 'number') &&
          typeof cat.name === 'string'
        )
        .slice(0, maxCategories)
        .map(cat => ({
          id: cat.slug || cat.id.toString(), // Use slug as ID, fallback to string ID
          name: cat.name,
          icon: cat.image_url || (cat.icon ? cat.icon : "/images/categories/placeholder.png"), // Safe access to icon property
          description: cat.description || `Productos de ${cat.name.toLowerCase()}`, // Generate description if missing
          isAvailable: cat.isAvailable ?? true,
          // Keep additional API fields for compatibility
          products_count: cat.products_count || 0,
          slug: cat.slug,
          parent_id: cat.parent_id,
          image_url: cat.image_url,
          created_at: cat.created_at,
          updated_at: cat.updated_at
        }));

      trackAnalytics('fetch_success', { count: validCategories.length });
      return validCategories;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      trackAnalytics('fetch_error', { error: errorMessage });
      throw new Error(`Failed to fetch categories: ${errorMessage}`);
    }
  }, [apiEndpoint, maxCategories, trackAnalytics]);

  /**
   * Refresh categories data
   */
  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = getCachedData();
      if (cachedData && !enableBackgroundRefresh) {
        setCategories(cachedData);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const freshData = await fetchCategories();

      // Update state and cache
      setCategories(freshData);
      setCachedData(freshData);
      setError(null);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load categories';
      setError(errorMessage);

      // Use cached data as fallback if available
      const cachedData = getCachedData();
      if (cachedData) {
        setCategories(cachedData);
      } else {
        setCategories(fallbackCategories);
      }

      console.error('Category data error:', error);
    } finally {
      setLoading(false);
    }
  }, [
    getCachedData,
    enableBackgroundRefresh,
    fetchCategories,
    setCachedData,
    fallbackCategories,
  ]);

  /**
   * Get category by ID
   */
  const getCategoryById = useCallback((id: string): Category | undefined => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  /**
   * Initial data load
   */
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch]); // Removed refresh dependency to prevent infinite loop

  /**
   * Background refresh interval
   */
  useEffect(() => {
    if (!enableBackgroundRefresh || refreshInterval <= 0) {return;}

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableBackgroundRefresh, refreshInterval]); // Removed refresh dependency to prevent infinite loop

  /**
   * Memoized return object for performance
   */
  const returnValue = useMemo((): UseCategoryDataReturn => ({
    categories,
    loading,
    error,
    refresh,
    getCategoryById,
  }), [categories, loading, error, refresh, getCategoryById]);

  return returnValue;
};

/**
 * Utility to preload category images
 */
export const preloadCategoryImages = (categories: Category[]): void => {
  if (typeof window === 'undefined') {return;}

  categories.forEach(category => {
    if (category && category.icon) {
      const img = new Image();
      img.src = category.icon;
    }
  });
};

/**
 * Utility to clear category cache
 */
export const clearCategoryCache = (): void => {
  categoryCache.clear();
};

/**
 * Default export for convenience
 */
export default useCategoryData;









