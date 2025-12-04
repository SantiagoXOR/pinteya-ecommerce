// ===================================
// PINTEYA E-COMMERCE - HOOK PARA CATEGORÍAS
// ===================================

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import { Category } from '@/types/database'
import { CategoryFilters, ApiResponse } from '@/types/api'
import { getCategories, getMainCategories } from '@/lib/api/categories'
import { productQueryKeys } from './queries/productQueryKeys'

interface UseCategoriesOptions {
  initialFilters?: CategoryFilters
  autoFetch?: boolean
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { initialFilters = {}, autoFetch = true } = options
  const queryClient = useQueryClient()
  
  // Mantener filtros en estado para poder actualizarlos
  const [filters, setFilters] = useState<CategoryFilters>(initialFilters)

  // Sincronizar filtros cuando initialFilters cambia
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFilters(prevFilters => {
        // Solo actualizar si realmente hay cambios
        const hasChanges = Object.keys(initialFilters).some(
          key => prevFilters[key as keyof CategoryFilters] !== initialFilters[key as keyof CategoryFilters]
        )
        return hasChanges ? { ...prevFilters, ...initialFilters } : prevFilters
      })
    }
  }, [initialFilters])

  // Query principal usando TanStack Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: productQueryKeys.categoryListWithFilters(filters),
    queryFn: async (): Promise<Category[]> => {
      const response = await getCategories(filters)

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Error obteniendo categorías')
      }

      return response.data
    },
    // Configuración optimizada para categorías
    staleTime: 10 * 60 * 1000, // 10 minutos - las categorías cambian raramente
    gcTime: 30 * 60 * 1000, // 30 minutos - mantener en caché más tiempo
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Usar caché si está disponible
    refetchOnReconnect: true,
    enabled: autoFetch,
  })

  /**
   * Actualiza los filtros y refetch las categorías
   */
  const updateFilters = useCallback(
    (newFilters: Partial<CategoryFilters>) => {
      const updatedFilters = { ...filters, ...newFilters }
      setFilters(updatedFilters)
      // TanStack Query automáticamente refetch cuando cambia la query key
    },
    [filters]
  )

  /**
   * Busca categorías por término
   */
  const searchCategories = useCallback(
    (searchTerm: string) => {
      updateFilters({ search: searchTerm })
    },
    [updateFilters]
  )

  /**
   * Refresca las categorías manualmente
   */
  const refreshCategories = useCallback(() => {
    refetch()
  }, [refetch])

  /**
   * Fetch categorías manualmente (para compatibilidad)
   */
  const fetchCategories = useCallback(
    async (newFilters?: CategoryFilters) => {
      if (newFilters) {
        setFilters(newFilters)
      } else {
        refetch()
      }
    },
    [refetch]
  )

  return {
    // Estado - mantener compatibilidad con interfaz anterior
    categories: data || [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,

    // Acciones
    fetchCategories,
    updateFilters,
    searchCategories,
    refreshCategories,
  }
}

/**
 * Hook específico para obtener todas las categorías
 */
export function useMainCategories() {
  return useCategories()
}

/**
 * Hook para obtener categorías con conteo de productos para filtros
 */
export function useCategoriesForFilters() {
  const { categories, loading, error, refreshCategories } = useCategories()

  // Transformar categorías para el formato esperado por los filtros
  const categoriesForFilters = categories.map(category => ({
    name: category.name,
    products: category.products_count || 0,
    isRefined: false, // Se manejará en el componente
    slug: category.slug,
    id: category.id,
  }))

  return {
    categories: categoriesForFilters,
    loading,
    error,
    refreshCategories,
  }
}
