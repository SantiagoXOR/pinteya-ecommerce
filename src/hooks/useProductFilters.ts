// ===================================
// HOOK: useProductFilters - Optimizado para Performance
// ===================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductFilters } from '@/types/api';

// ===================================
// TIPOS
// ===================================

export interface ProductFilterState {
  categories: string[];
  brands: string[];
  priceMin?: number;
  priceMax?: number;
  search?: string;
  sortBy: string;
  page: number;
  limit: number;
}

export interface UseProductFiltersOptions {
  syncWithUrl?: boolean;
  defaultSort?: string;
  defaultLimit?: number;
  debounceMs?: number;
  onFiltersChange?: (filters: ProductFilterState) => void;
}

export interface UseProductFiltersReturn {
  filters: ProductFilterState;
  updateCategories: (categories: string[]) => void;
  updateBrands: (brands: string[]) => void;
  updatePriceRange: (min?: number, max?: number) => void;
  updateSearch: (search: string) => void;
  updateSort: (sort: string) => void;
  updatePage: (page: number) => void;
  updateLimit: (limit: number) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  hasActiveFilters: boolean;
  totalActiveFilters: number;
  isLoading: boolean;
}

// ===================================
// CONSTANTES
// ===================================

const DEFAULT_FILTERS: ProductFilterState = {
  categories: [],
  brands: [],
  priceMin: undefined,
  priceMax: undefined,
  search: '',
  sortBy: 'created_at',
  page: 1,
  limit: 12,
};

// ===================================
// HOOK PRINCIPAL
// ===================================

export function useProductFilters(options: UseProductFiltersOptions = {}): UseProductFiltersReturn {
  const {
    syncWithUrl = true,
    defaultSort = 'created_at',
    defaultLimit = 12,
    debounceMs = 300,
    onFiltersChange,
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Estado de filtros optimizado
  const [filters, setFilters] = useState<ProductFilterState>(() => ({
    ...DEFAULT_FILTERS,
    sortBy: defaultSort,
    limit: defaultLimit,
  }));

  // Inicializar y sincronizar filtros desde URL
  useEffect(() => {
    if (!syncWithUrl || !searchParams) {return;}

    const urlFilters: ProductFilterState = {
      categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
      brands: searchParams.get('brands')?.split(',').filter(Boolean) || [],
      priceMin: searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined,
      priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
      search: searchParams.get('search') || '',
      sortBy: searchParams.get('sortBy') || defaultSort,
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || defaultLimit,
    };

    setFilters(urlFilters);
  }, [searchParams, syncWithUrl, defaultSort, defaultLimit]); // Actualizar cuando cambien los searchParams

  // Función optimizada para actualizar URL
  const updateUrl = useCallback((newFilters: ProductFilterState) => {
    if (!syncWithUrl) {return;}

    const params = new URLSearchParams();

    // Solo agregar parámetros que tienen valores
    if (newFilters.categories.length > 0) {
      params.set('categories', newFilters.categories.join(','));
    }
    if (newFilters.brands.length > 0) {
      params.set('brands', newFilters.brands.join(','));
    }
    if (newFilters.priceMin !== undefined) {
      params.set('priceMin', newFilters.priceMin.toString());
    }
    if (newFilters.priceMax !== undefined) {
      params.set('priceMax', newFilters.priceMax.toString());
    }
    if (newFilters.search && newFilters.search.trim()) {
      params.set('search', newFilters.search.trim());
    }
    if (newFilters.sortBy !== defaultSort) {
      params.set('sortBy', newFilters.sortBy);
    }
    if (newFilters.page > 1) {
      params.set('page', newFilters.page.toString());
    }
    if (newFilters.limit !== defaultLimit) {
      params.set('limit', newFilters.limit.toString());
    }

    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    router.push(newUrl, { scroll: false });
  }, [syncWithUrl, router, defaultSort, defaultLimit]);

  // Función optimizada para actualizar filtros
  const updateFilters = useCallback((updates: Partial<ProductFilterState>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      
      // Reset page cuando cambian otros filtros (excepto page)
      if (!updates.hasOwnProperty('page') && Object.keys(updates).length > 0) {
        newFilters.page = 1;
      }

      // Actualizar URL de forma asíncrona
      setTimeout(() => updateUrl(newFilters), 0);
      
      // Callback opcional
      onFiltersChange?.(newFilters);
      
      return newFilters;
    });
  }, [updateUrl, onFiltersChange]);

  // Handlers memoizados para evitar re-renders
  const updateCategories = useCallback((categories: string[]) => {
    updateFilters({ categories });
  }, [updateFilters]);

  const updateBrands = useCallback((brands: string[]) => {
    updateFilters({ brands });
  }, [updateFilters]);

  const updatePriceRange = useCallback((priceMin?: number, priceMax?: number) => {
    updateFilters({ priceMin, priceMax });
  }, [updateFilters]);

  const updateSearch = useCallback((search: string) => {
    updateFilters({ search });
  }, [updateFilters]);

  const updateSort = useCallback((sortBy: string) => {
    updateFilters({ sortBy });
  }, [updateFilters]);

  const updatePage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const updateLimit = useCallback((limit: number) => {
    updateFilters({ limit });
  }, [updateFilters]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      ...DEFAULT_FILTERS,
      sortBy: defaultSort,
      limit: defaultLimit,
    };
    setFilters(clearedFilters);
    updateUrl(clearedFilters);
  }, [defaultSort, defaultLimit, updateUrl]);

  const applyFilters = useCallback(() => {
    // Forzar actualización de URL
    updateUrl(filters);
    onFiltersChange?.(filters);
  }, [filters, updateUrl, onFiltersChange]);

  // Computed values memoizados
  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.brands.length > 0 ||
      filters.priceMin !== undefined ||
      filters.priceMax !== undefined ||
      (filters.search && filters.search.trim() !== '') ||
      filters.sortBy !== defaultSort ||
      filters.page > 1
    );
  }, [filters, defaultSort]);

  const totalActiveFilters = useMemo(() => {
    let count = 0;
    count += filters.categories.length;
    count += filters.brands.length;
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {count += 1;}
    if (filters.search && filters.search.trim() !== '') {count += 1;}
    return count;
  }, [filters]);

  return {
    filters,
    updateCategories,
    updateBrands,
    updatePriceRange,
    updateSearch,
    updateSort,
    updatePage,
    updateLimit,
    clearFilters,
    applyFilters,
    hasActiveFilters,
    totalActiveFilters,
    isLoading,
  };
}









