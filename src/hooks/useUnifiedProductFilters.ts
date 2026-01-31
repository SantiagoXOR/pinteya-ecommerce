// ===================================
// Hook unificado para /search y /products
// ===================================

import { useProducts } from './useProducts'
import type { ProductFilters } from '@/types/api'

export type UnifiedFilterMode = 'search' | 'products'

export interface UseUnifiedProductFiltersOptions {
  mode: UnifiedFilterMode
  /** Término de búsqueda (para mode='search') */
  initialSearch?: string
  /** Categorías iniciales (para mode='products') */
  initialCategories?: string[]
  limit?: number
}

/**
 * Hook unificado que configura useProducts según el modo (search o products).
 * Permite reutilizar la misma lógica de filtros entre /search y /products.
 */
export function useUnifiedProductFilters(options: UseUnifiedProductFiltersOptions) {
  const {
    mode,
    initialSearch = '',
    initialCategories = [],
    limit = mode === 'search' ? 50 : 1000,
  } = options

  const initialFilters: ProductFilters = {
    page: 1,
    limit,
    sortBy: 'price',
    sortOrder: mode === 'search' ? 'asc' : 'desc',
    ...(mode === 'search' && initialSearch.trim()
      ? { search: initialSearch.trim() }
      : {}),
    ...(mode === 'products' && initialCategories.length > 0
      ? { categories: initialCategories }
      : {}),
  }

  return useProducts({
    initialFilters,
    autoFetch: true,
  })
}
