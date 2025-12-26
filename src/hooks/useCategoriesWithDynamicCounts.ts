'use client'

import { useMemo, useRef, useEffect } from 'react'
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
  // ⚡ OPTIMIZACIÓN: Estabilizar baseFilters comparando contenido, no solo referencia
  const prevBaseFiltersRef = useRef<any>({})
  const stableBaseFilters = useMemo(() => {
    const filtersStr = JSON.stringify(baseFilters)
    const prevStr = JSON.stringify(prevBaseFiltersRef.current)
    
    if (filtersStr !== prevStr) {
      prevBaseFiltersRef.current = baseFilters
      return baseFilters
    }
    return prevBaseFiltersRef.current
  }, [JSON.stringify(baseFilters)])

  // Extraer filtros de búsqueda para pasarlos a useCategories
  const categoryFilters = useMemo(() => {
    const filters: any = {}
    if (stableBaseFilters.search) {
      filters.search = stableBaseFilters.search
    }
    return filters
  }, [stableBaseFilters.search])

  // Obtener categorías base con filtros de búsqueda si existen
  const {
    categories: baseCategories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories({
    initialFilters: categoryFilters,
    autoFetch: true,
  })

  // ⚡ DEBUG: Log cuando las categorías cambian (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 useCategoriesWithDynamicCounts - categories changed', {
        count: baseCategories.length,
        loading: categoriesLoading,
        timestamp: Date.now(),
      })
    }
  }, [baseCategories.length, categoriesLoading])

  // ⚡ OPTIMIZACIÓN: Estabilizar baseCategories comparando contenido, no solo referencia
  const prevCategoriesRef = useRef<Category[]>([])
  const stableCategories = useMemo(() => {
    // Comparar contenido de las categorías
    if (
      baseCategories.length !== prevCategoriesRef.current.length ||
      baseCategories.some(
        (cat, idx) =>
          !prevCategoriesRef.current[idx] ||
          cat.id !== prevCategoriesRef.current[idx].id ||
          cat.slug !== prevCategoriesRef.current[idx].slug ||
          cat.name !== prevCategoriesRef.current[idx].name
      )
    ) {
      prevCategoriesRef.current = baseCategories
      return baseCategories
    }
    return prevCategoriesRef.current
  }, [baseCategories])

  // Extraer slugs de categorías para obtener conteos
  const categoryIds = useMemo(() => {
    return stableCategories.map(cat => cat.slug).filter(Boolean)
  }, [stableCategories])

  // Obtener conteos dinámicos solo si está habilitado
  const {
    data: dynamicCounts,
    isLoading: countsLoading,
    error: countsError,
  } = useCategoryProductCounts(enableDynamicCounts ? categoryIds : [], stableBaseFilters)

  // Combinar categorías con conteos dinámicos
  const categoriesWithDynamicCounts = useMemo((): CategoryWithDynamicCount[] => {
    // Si no hay categorías base, retornar array vacío
    if (stableCategories.length === 0) {
      return []
    }

    return stableCategories.map(category => {
      const dynamicCount =
        enableDynamicCounts && dynamicCounts ? dynamicCounts[category.slug] : undefined

      return {
        ...category,
        products_count: dynamicCount !== undefined ? dynamicCount : category.products_count || 0,
        isLoading: enableDynamicCounts && countsLoading,
      }
    })
  }, [stableCategories, dynamicCounts, enableDynamicCounts, countsLoading])

  // ⚡ OPTIMIZACIÓN: Memoizar selectedCategories como Set para comparación más eficiente
  const selectedCategoriesSet = useMemo(() => {
    return new Set(selectedCategories)
  }, [JSON.stringify(selectedCategories)]) // Comparar contenido del array

  // Filtrar categorías seleccionadas si es necesario
  const availableCategories = useMemo(() => {
    if (selectedCategories.length === 0) {
      return categoriesWithDynamicCounts
    }

    // Mostrar todas las categorías, pero marcar las seleccionadas
    return categoriesWithDynamicCounts.map(category => ({
      ...category,
      isSelected: selectedCategoriesSet.has(category.slug),
    }))
  }, [categoriesWithDynamicCounts, selectedCategoriesSet])

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

  // ⚡ OPTIMIZACIÓN: Memoizar el objeto de retorno para evitar cambios en cada render
  return useMemo(
    () => ({
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
      baseFilters: stableBaseFilters,
      selectedCategories,
    }),
    [availableCategories, isLoading, error, stats, enableDynamicCounts, baseFilters, selectedCategories]
  )
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
