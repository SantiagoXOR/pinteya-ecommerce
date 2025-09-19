'use client';

import { useMemo } from 'react';
import { ReadonlyURLSearchParams } from 'next/navigation';

/**
 * Interface para el resumen de filtros activos
 */
export interface FilterSummary {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  totalFilters: number;
}

/**
 * Hook para detectar filtros activos en los parámetros de URL
 * Determina si la página debe mostrar la vista filtrada o el homepage normal
 */
export function useFilterDetection(searchParams: ReadonlyURLSearchParams | null) {
  const filterSummary = useMemo<FilterSummary | null>(() => {
    if (!searchParams) {return null;}

    const filters: Partial<FilterSummary> = {};
    let totalFilters = 0;

    // Detectar parámetro de búsqueda (search o q)
    const searchQuery = searchParams.get('search') || searchParams.get('q');
    if (searchQuery && searchQuery.trim()) {
      filters.search = searchQuery.trim();
      totalFilters++;
    }

    // Detectar filtro de categoría
    const category = searchParams.get('category');
    if (category && category.trim()) {
      filters.category = category.trim();
      totalFilters++;
    }

    // Detectar filtro de marca
    const brand = searchParams.get('brand');
    if (brand && brand.trim()) {
      filters.brand = brand.trim();
      totalFilters++;
    }

    // Detectar filtros de precio
    const minPriceStr = searchParams.get('minPrice');
    const maxPriceStr = searchParams.get('maxPrice');
    
    if (minPriceStr) {
      const minPrice = parseFloat(minPriceStr);
      if (!isNaN(minPrice) && minPrice > 0) {
        filters.minPrice = minPrice;
        totalFilters++;
      }
    }

    if (maxPriceStr) {
      const maxPrice = parseFloat(maxPriceStr);
      if (!isNaN(maxPrice) && maxPrice > 0) {
        filters.maxPrice = maxPrice;
        totalFilters++;
      }
    }

    // Detectar paginación (no cuenta como filtro para la vista, pero se incluye)
    const pageStr = searchParams.get('page');
    if (pageStr) {
      const page = parseInt(pageStr, 10);
      if (!isNaN(page) && page > 0) {
        filters.page = page;
        // La paginación no cuenta como filtro activo para cambiar la vista
      }
    }

    // Detectar ordenamiento (no cuenta como filtro para la vista, pero se incluye)
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    
    if (sortBy && sortBy.trim()) {
      filters.sortBy = sortBy.trim();
      // El ordenamiento no cuenta como filtro activo para cambiar la vista
    }

    if (sortOrder && (sortOrder === 'asc' || sortOrder === 'desc')) {
      filters.sortOrder = sortOrder;
      // El ordenamiento no cuenta como filtro activo para cambiar la vista
    }

    // Solo retornar summary si hay filtros activos
    if (totalFilters === 0) {
      return null;
    }

    return {
      ...filters,
      totalFilters
    } as FilterSummary;
  }, [searchParams]);

  // Determinar si hay filtros activos (excluyendo page, sortBy, sortOrder)
  const hasActiveFilters = useMemo(() => {
    return filterSummary !== null && filterSummary.totalFilters > 0;
  }, [filterSummary]);

  return {
    hasActiveFilters,
    filterSummary
  };
}

/**
 * Hook simplificado para solo verificar si hay filtros activos
 */
export function useHasActiveFilters(searchParams: ReadonlyURLSearchParams | null): boolean {
  const { hasActiveFilters } = useFilterDetection(searchParams);
  return hasActiveFilters;
}

/**
 * Función utilitaria para generar un texto descriptivo de los filtros activos
 */
export function generateFilterDescription(filterSummary: FilterSummary | null): string {
  if (!filterSummary || filterSummary.totalFilters === 0) {
    return '';
  }

  const parts: string[] = [];

  if (filterSummary.search) {
    parts.push(`búsqueda: "${filterSummary.search}"`);
  }

  if (filterSummary.category) {
    parts.push(`categoría: ${filterSummary.category}`);
  }

  if (filterSummary.brand) {
    parts.push(`marca: ${filterSummary.brand}`);
  }

  if (filterSummary.minPrice || filterSummary.maxPrice) {
    if (filterSummary.minPrice && filterSummary.maxPrice) {
      parts.push(`precio: $${filterSummary.minPrice} - $${filterSummary.maxPrice}`);
    } else if (filterSummary.minPrice) {
      parts.push(`precio mínimo: $${filterSummary.minPrice}`);
    } else if (filterSummary.maxPrice) {
      parts.push(`precio máximo: $${filterSummary.maxPrice}`);
    }
  }

  return parts.join(', ');
}

export default useFilterDetection;









