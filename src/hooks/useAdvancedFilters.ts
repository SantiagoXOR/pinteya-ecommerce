// ===================================
// PINTEYA E-COMMERCE - HOOK ADVANCED FILTERS
// ===================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useFilterMetadata } from './useFilterMetadata';

// ===================================
// TIPOS
// ===================================

export interface AdvancedFilters {
  categories: string[];
  brands: string[];
  paintTypes: string[];
  finishes: string[];
  priceRange: [number, number];
  search?: string;
  sortBy?: 'price' | 'name' | 'created_at' | 'brand';
  sortOrder?: 'asc' | 'desc';
}

export interface UseAdvancedFiltersReturn {
  filters: AdvancedFilters;
  updateFilters: (newFilters: Partial<AdvancedFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  activeFiltersCount: number;
  isLoading: boolean;
}

// ===================================
// UTILIDADES
// ===================================

const parseArrayParam = (param: string | null): string[] => {
  if (!param) return [];
  return param.split(',').filter(Boolean);
};

const parseNumberArrayParam = (param: string | null, defaultValue: [number, number]): [number, number] => {
  if (!param) return defaultValue;
  const parts = param.split(',').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return defaultValue;
};

const serializeArrayParam = (array: string[]): string => {
  return array.length > 0 ? array.join(',') : '';
};

const serializeNumberArrayParam = (array: [number, number]): string => {
  return `${array[0]},${array[1]}`;
};

// ===================================
// HOOK PRINCIPAL
// ===================================

export const useAdvancedFilters = (): UseAdvancedFiltersReturn => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: metadata, isLoading: metadataLoading } = useFilterMetadata();

  // Estado inicial basado en URL params
  const getInitialFilters = useCallback((): AdvancedFilters => {
    const defaultPriceRange: [number, number] = metadata?.priceRange 
      ? [metadata.priceRange.min, metadata.priceRange.max]
      : [0, 100000];

    return {
      categories: parseArrayParam(searchParams.get('categories')),
      brands: parseArrayParam(searchParams.get('brands')),
      paintTypes: parseArrayParam(searchParams.get('paintTypes')),
      finishes: parseArrayParam(searchParams.get('finishes')),
      priceRange: parseNumberArrayParam(searchParams.get('priceRange'), defaultPriceRange),
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as AdvancedFilters['sortBy']) || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as AdvancedFilters['sortOrder']) || 'desc',
    };
  }, [searchParams, metadata]);

  const [filters, setFilters] = useState<AdvancedFilters>(getInitialFilters);

  // Actualizar filtros cuando cambien los searchParams o metadata
  useEffect(() => {
    setFilters(getInitialFilters());
  }, [getInitialFilters]);

  // Función para actualizar URL
  const updateURL = useCallback((newFilters: AdvancedFilters) => {
    const params = new URLSearchParams();

    // Solo agregar parámetros que no estén vacíos o en valores por defecto
    if (newFilters.categories.length > 0) {
      params.set('categories', serializeArrayParam(newFilters.categories));
    }
    
    if (newFilters.brands.length > 0) {
      params.set('brands', serializeArrayParam(newFilters.brands));
    }
    
    if (newFilters.paintTypes.length > 0) {
      params.set('paintTypes', serializeArrayParam(newFilters.paintTypes));
    }
    
    if (newFilters.finishes.length > 0) {
      params.set('finishes', serializeArrayParam(newFilters.finishes));
    }

    // Solo agregar rango de precios si no es el rango completo por defecto
    const defaultMin = metadata?.priceRange?.min || 0;
    const defaultMax = metadata?.priceRange?.max || 100000;
    if (newFilters.priceRange[0] !== defaultMin || newFilters.priceRange[1] !== defaultMax) {
      params.set('priceRange', serializeNumberArrayParam(newFilters.priceRange));
    }

    if (newFilters.search) {
      params.set('search', newFilters.search);
    }

    if (newFilters.sortBy && newFilters.sortBy !== 'created_at') {
      params.set('sortBy', newFilters.sortBy);
    }

    if (newFilters.sortOrder && newFilters.sortOrder !== 'desc') {
      params.set('sortOrder', newFilters.sortOrder);
    }

    const queryString = params.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(newURL, { scroll: false });
  }, [router, pathname, metadata]);

  // Función para actualizar filtros
  const updateFilters = useCallback((newFilters: Partial<AdvancedFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      return updated;
    });
  }, []);

  // Función para aplicar filtros (actualizar URL)
  const applyFilters = useCallback(() => {
    updateURL(filters);
  }, [filters, updateURL]);

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    const defaultPriceRange: [number, number] = metadata?.priceRange 
      ? [metadata.priceRange.min, metadata.priceRange.max]
      : [0, 100000];

    const clearedFilters: AdvancedFilters = {
      categories: [],
      brands: [],
      paintTypes: [],
      finishes: [],
      priceRange: defaultPriceRange,
      search: undefined,
      sortBy: 'created_at',
      sortOrder: 'desc',
    };

    setFilters(clearedFilters);
    updateURL(clearedFilters);
  }, [metadata, updateURL]);

  // Calcular cantidad de filtros activos
  const activeFiltersCount = 
    filters.categories.length +
    filters.brands.length +
    filters.paintTypes.length +
    filters.finishes.length +
    (filters.search ? 1 : 0) +
    (metadata?.priceRange && (
      filters.priceRange[0] !== metadata.priceRange.min ||
      filters.priceRange[1] !== metadata.priceRange.max
    ) ? 1 : 0);

  return {
    filters,
    updateFilters,
    clearFilters,
    applyFilters,
    activeFiltersCount,
    isLoading: metadataLoading,
  };
};

export default useAdvancedFilters;
