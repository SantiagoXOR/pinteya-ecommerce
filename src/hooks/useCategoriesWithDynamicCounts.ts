'use client'

import { useMemo } from 'react'
import { useCategories } from './useCategories'
import { CategoryFilters } from '@/types/api'
import { useCategoryProductCounts, ProductFilters } from './useFilteredProducts'
import { Category } from '@/types/database'

// ===================================
// TIPOS
// ===================================

export interface CategoryWithDynamicCount extends Category {
  products_count: number
  isLoading?: boolean
}

export interface UseCategoriesWithDynamicCountsOptions {
  baseFilters?: Omit<ProductFilters, 'categories' | 'category'>
  selectedCategories?: string[]
  enableDynamicCounts?: boolean
}

// ===================================
// HOOK PRINCIPAL
// ===================================

/**
 * Hook que combina categorías estáticas con conteos dinámicos de productos
 * basados en filtros actuales
 */
export const useCategoriesWithDynamicCounts = ({
  baseFilters = {},
  selectedCategories = [],
  enableDynamicCounts = true,
}: UseCategoriesWithDynamicCountsOptions = {}) => {
  // Extraer filtros de búsqueda para pasarlos a useCategories
  const categoryFilters = useMemo(() => {
    const filters: any = {}
    if (baseFilters.search) {
      filters.search = baseFilters.search
    }
    return filters
  }, [baseFilters.search])

  // Obtener categorías base con filtros de búsqueda si existen
  const {
    categories: baseCategories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories({
    initialFilters: categoryFilters,
    autoFetch: true,
  })

  // Extraer slugs de categorías para obtener conteos
  const categoryIds = useMemo(() => {
    return baseCategories.map(cat => cat.slug).filter(Boolean)
  }, [baseCategories])

  // Obtener conteos dinámicos solo si está habilitado
  const {
    data: dynamicCounts,
    isLoading: countsLoading,
    error: countsError,
  } = useCategoryProductCounts(enableDynamicCounts ? categoryIds : [], baseFilters)

  // Combinar categorías con conteos dinámicos
  const categoriesWithDynamicCounts = useMemo((): CategoryWithDynamicCount[] => {
    // Si no hay categorías base, retornar array vacío
    if (baseCategories.length === 0) {
      return []
    }

    return baseCategories.map(category => {
      const dynamicCount =
        enableDynamicCounts && dynamicCounts ? dynamicCounts[category.slug] : undefined

      return {
        ...category,
        products_count: dynamicCount !== undefined ? dynamicCount : category.products_count || 0,
        isLoading: enableDynamicCounts && countsLoading,
      }
    })
  }, [baseCategories, dynamicCounts, enableDynamicCounts, countsLoading])

  // Filtrar categorías seleccionadas si es necesario
  const availableCategories = useMemo(() => {
    if (selectedCategories.length === 0) {
      return categoriesWithDynamicCounts
    }

    // Mostrar todas las categorías, pero marcar las seleccionadas
    return categoriesWithDynamicCounts.map(category => ({
      ...category,
      isSelected: selectedCategories.includes(category.slug),
    }))
  }, [categoriesWithDynamicCounts, selectedCategories])

  // Estados combinados
  const isLoading = categoriesLoading || (enableDynamicCounts && countsLoading)
  // Convertir ambos errores a string para compatibilidad
  const error = categoriesError || (countsError ? (countsError instanceof Error ? countsError.message : String(countsError)) : null)

  // Estadísticas útiles
  const stats = useMemo(() => {
    const totalCategories = availableCategories.length
    const categoriesWithProducts = availableCategories.filter(cat => cat.products_count > 0).length
    const totalProducts = availableCategories.reduce((sum, cat) => sum + cat.products_count, 0)
    const selectedCount = selectedCategories.length

    return {
      totalCategories,
      categoriesWithProducts,
      totalProducts,
      selectedCount,
      hasSelection: selectedCount > 0,
    }
  }, [availableCategories, selectedCategories])

  return {
    categories: availableCategories,
    loading: isLoading,
    error,
    stats,
    // Funciones de utilidad
    getCategoryBySlug: (slug: string) => availableCategories.find(cat => cat.slug === slug),
    getCategoryCount: (slug: string) =>
      availableCategories.find(cat => cat.slug === slug)?.products_count || 0,
    // Configuración
    enableDynamicCounts,
    baseFilters,
    selectedCategories,
  }
}

// ===================================
// HOOK SIMPLIFICADO PARA CASOS COMUNES
// ===================================

/**
 * Hook simplificado para obtener categorías con conteos dinámicos
 * basados en filtros de búsqueda y otros filtros activos
 */
export const useCategoriesForFilters = (
  searchTerm?: string,
  selectedCategories: string[] = [],
  otherFilters: Omit<ProductFilters, 'categories' | 'category' | 'search'> = {}
) => {
  const baseFilters = useMemo(
    () => ({
      ...otherFilters,
      ...(searchTerm && { search: searchTerm }),
    }),
    [searchTerm, otherFilters]
  )

  return useCategoriesWithDynamicCounts({
    baseFilters,
    selectedCategories,
    enableDynamicCounts: true,
  })
}

// ===================================
// HOOK PARA CONTEOS ESTÁTICOS (FALLBACK)
// ===================================

/**
 * Hook que devuelve categorías con conteos estáticos
 * Útil cuando no se necesitan conteos dinámicos o como fallback
 */
export const useCategoriesWithStaticCounts = () => {
  return useCategoriesWithDynamicCounts({
    enableDynamicCounts: false,
  })
}
