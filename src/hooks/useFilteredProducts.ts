'use client'

import { useQuery } from '@tanstack/react-query'
import { ProductWithCategory, PaginatedResponse } from '@/types/api'
import { safeApiResponseJson } from '@/lib/json-utils'
import { normalizeProductFilters } from '@/hooks/queries/productQueryKeys'

// ===================================
// TIPOS PARA FILTROS DE PRODUCTOS
// ===================================

export interface ProductFilters {
  // Filtros básicos
  category?: string
  brand?: string
  search?: string
  priceMin?: number
  priceMax?: number
  hasDiscount?: boolean

  // Filtros avanzados (múltiples valores)
  categories?: string[]
  brands?: string[]
  paintTypes?: string[]

  // Paginación y ordenamiento
  page?: number
  limit?: number
  sortBy?: 'price' | 'name' | 'created_at' | 'brand'
  sortOrder?: 'asc' | 'desc'
}

// ===================================
// HOOK PARA PRODUCTOS FILTRADOS
// ===================================

export const useFilteredProducts = (filters: ProductFilters = {}) => {
  // ⚡ OPTIMIZACIÓN: Normalizar filtros para compartir cache entre componentes
  const normalizedFilters = normalizeProductFilters(filters)
  
  return useQuery({
    queryKey: ['filtered-products', normalizedFilters],
    queryFn: async (): Promise<PaginatedResponse<ProductWithCategory>> => {
      // Construir URL con parámetros
      const searchParams = new URLSearchParams()

      // Filtros básicos
      if (filters.category) {
        searchParams.set('category', filters.category)
      }
      if (filters.brand) {
        searchParams.set('brand', filters.brand)
      }
      if (filters.search) {
        searchParams.set('search', filters.search)
      }
      if (filters.priceMin !== undefined) {
        searchParams.set('priceMin', filters.priceMin.toString())
      }
      if (filters.priceMax !== undefined) {
        searchParams.set('priceMax', filters.priceMax.toString())
      }

      // Filtros avanzados (arrays)
      if (filters.categories && filters.categories.length > 0) {
        searchParams.set('categories', filters.categories.join(','))
      }
      if (filters.brands && filters.brands.length > 0) {
        searchParams.set('brands', filters.brands.join(','))
      }
      if (filters.paintTypes && filters.paintTypes.length > 0) {
        searchParams.set('paintTypes', filters.paintTypes.join(','))
      }

      // Filtro de descuento
      if (filters.hasDiscount !== undefined) {
        searchParams.set('hasDiscount', filters.hasDiscount.toString())
      }

      // Paginación y ordenamiento
      if (filters.page) {
        searchParams.set('page', filters.page.toString())
      }
      if (filters.limit) {
        searchParams.set('limit', filters.limit.toString())
      }
      if (filters.sortBy) {
        searchParams.set('sortBy', filters.sortBy)
      }
      if (filters.sortOrder) {
        searchParams.set('sortOrder', filters.sortOrder)
      }

      const url = `/api/products?${searchParams.toString()}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await safeApiResponseJson<PaginatedResponse<ProductWithCategory>>(response)

      if (!result.success) {
        throw new Error(result.error || 'Error parsing response')
      }

      return result.data!
    },
    staleTime: 10 * 60 * 1000, // ⚡ OPTIMIZACIÓN: 10 minutos para reducir refetches
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: true, // Siempre habilitado, incluso sin filtros
    refetchOnMount: false,
    refetchOnReconnect: false, // ⚡ FIX: Cambiar a false para evitar refetches durante montaje inicial
    // ⚡ FIX: Agregar placeholderData para mantener datos anteriores mientras carga
    placeholderData: (previousData) => previousData, // ⚡ OPTIMIZACIÓN: React Query ya maneja el cache, no forzar refetch
    refetchOnWindowFocus: false,
  })
}

// ===================================
// HOOK PARA CONTEO DE PRODUCTOS
// ===================================

export const useProductCount = (filters: Omit<ProductFilters, 'page' | 'limit'> = {}) => {
  return useQuery({
    queryKey: ['product-count', filters],
    queryFn: async (): Promise<number> => {
      // Usar los mismos filtros pero con limit=1 para obtener solo el count
      const countFilters = { ...filters, page: 1, limit: 1 }
      const searchParams = new URLSearchParams()

      // Aplicar los mismos filtros que useFilteredProducts
      if (countFilters.category) {
        searchParams.set('category', countFilters.category)
      }
      if (countFilters.brand) {
        searchParams.set('brand', countFilters.brand)
      }
      if (countFilters.search) {
        searchParams.set('search', countFilters.search)
      }
      if (countFilters.priceMin !== undefined) {
        searchParams.set('priceMin', countFilters.priceMin.toString())
      }
      if (countFilters.priceMax !== undefined) {
        searchParams.set('priceMax', countFilters.priceMax.toString())
      }

      if (countFilters.categories && countFilters.categories.length > 0) {
        searchParams.set('categories', countFilters.categories.join(','))
      }
      if (countFilters.brands && countFilters.brands.length > 0) {
        searchParams.set('brands', countFilters.brands.join(','))
      }
      if (countFilters.paintTypes && countFilters.paintTypes.length > 0) {
        searchParams.set('paintTypes', countFilters.paintTypes.join(','))
      }

      // Filtro de descuento
      if (countFilters.hasDiscount !== undefined) {
        searchParams.set('hasDiscount', countFilters.hasDiscount.toString())
      }

      searchParams.set('page', '1')
      searchParams.set('limit', '1')

      const url = `/api/products?${searchParams.toString()}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await safeApiResponseJson<PaginatedResponse<ProductWithCategory>>(response)

      if (!result.success) {
        throw new Error(result.error || 'Error parsing response')
      }

      const count = result.data?.pagination?.total || 0

      return count
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    enabled: true,
  })
}

// ===================================
// HOOK PARA CONTEO DINÁMICO POR CATEGORÍA
// ===================================

export const useCategoryProductCounts = (
  categoryIds: string[],
  baseFilters: Omit<ProductFilters, 'categories' | 'category'> = {}
) => {
  return useQuery({
    queryKey: ['category-product-counts', categoryIds, baseFilters],
    queryFn: async (): Promise<Record<string, number>> => {
      const counts: Record<string, number> = {}

      // Obtener conteo para cada categoría individualmente
      const promises = categoryIds.map(async categoryId => {
        const filters = { ...baseFilters, categories: [categoryId] }
        const searchParams = new URLSearchParams()

        // IMPORTANTE: Aplicar filtro de categoría PRIMERO para evitar conflictos de parámetros
        searchParams.set('categories', categoryId)

        // Aplicar filtros base
        if (filters.brand) {
          searchParams.set('brand', filters.brand)
        }
        if (filters.search) {
          searchParams.set('search', filters.search)
        }
        if (filters.priceMin !== undefined) {
          searchParams.set('priceMin', filters.priceMin.toString())
        }
        if (filters.priceMax !== undefined) {
          searchParams.set('priceMax', filters.priceMax.toString())
        }
        if (filters.brands && filters.brands.length > 0) {
          searchParams.set('brands', filters.brands.join(','))
        }
        if (filters.paintTypes && filters.paintTypes.length > 0) {
          searchParams.set('paintTypes', filters.paintTypes.join(','))
        }

        // Filtro de descuento
        if (filters.hasDiscount !== undefined) {
          searchParams.set('hasDiscount', filters.hasDiscount.toString())
        }

        // Aplicar paginación al final
        searchParams.set('limit', '1')
        searchParams.set('page', '1')

        const url = `/api/products?${searchParams.toString()}`

        const response = await fetch(url)

        if (!response.ok) {
          return { categoryId, count: 0 }
        }

        const result = await safeApiResponseJson<PaginatedResponse<ProductWithCategory>>(response)

        if (!result.success) {
          return { categoryId, count: 0 }
        }

        const count = result.data?.pagination?.total || 0
        return { categoryId, count }
      })

      const results = await Promise.all(promises)

      results.forEach(({ categoryId, count }) => {
        counts[categoryId] = count
      })

      return counts
    },
    staleTime: 2 * 60 * 1000, // 2 minutos (más frecuente para conteos dinámicos)
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    enabled: categoryIds.length > 0,
  })
}

// ===================================
// UTILIDADES
// ===================================

export const getActiveFiltersCount = (filters: ProductFilters): number => {
  let count = 0

  if (filters.categories && filters.categories.length > 0) {
    count += filters.categories.length
  }
  if (filters.brands && filters.brands.length > 0) {
    count += filters.brands.length
  }
  if (filters.paintTypes && filters.paintTypes.length > 0) {
    count += filters.paintTypes.length
  }
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    count += 1
  }
  if (filters.search) {
    count += 1
  }

  return count
}

export const hasActiveFilters = (filters: ProductFilters): boolean => {
  return getActiveFiltersCount(filters) > 0
}
