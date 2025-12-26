// ===================================
// PINTEYA E-COMMERCE - HOOK PARA CATEGORÍAS
// ===================================

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
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
  
  // ⚡ OPTIMIZACIÓN: Memoizar initialFilters para evitar comparaciones innecesarias
  const memoizedInitialFilters = useMemo(() => initialFilters, [
    initialFilters?.search,
    // Agregar otras propiedades de initialFilters si es necesario
  ])

  // Mantener filtros en estado para poder actualizarlos
  const [filters, setFilters] = useState<CategoryFilters>(memoizedInitialFilters)
  
  // ⚡ OPTIMIZACIÓN: Usar ref para rastrear el último initialFilters sin causar re-renders
  const prevInitialFiltersRef = useRef(memoizedInitialFilters)

  // ⚡ OPTIMIZACIÓN CRÍTICA: Obtener datos del cache inmediatamente para evitar loading state
  const cachedData = queryClient.getQueryData<Category[]>(
    productQueryKeys.categoryListWithFilters(filters)
  )

  // Sincronizar filtros cuando initialFilters cambia
  useEffect(() => {
    // ⚡ OPTIMIZACIÓN: Comparación profunda usando ref para evitar loops
    const prevFilters = prevInitialFiltersRef.current
    const hasChanges = Object.keys(memoizedInitialFilters || {}).some(
      key => prevFilters[key as keyof CategoryFilters] !== memoizedInitialFilters[key as keyof CategoryFilters]
    ) || Object.keys(prevFilters || {}).some(
      key => !(key in (memoizedInitialFilters || {})) || prevFilters[key as keyof CategoryFilters] !== memoizedInitialFilters[key as keyof CategoryFilters]
    )

    if (hasChanges) {
      setFilters(prevFilters => {
        // Solo actualizar si realmente hay cambios
        const newFilters = { ...prevFilters, ...memoizedInitialFilters }
        // Verificar si realmente cambió algo comparando con prevFilters
        const actuallyChanged = Object.keys(newFilters).some(
          key => prevFilters[key as keyof CategoryFilters] !== newFilters[key as keyof CategoryFilters]
        ) || Object.keys(prevFilters).some(
          key => !(key in newFilters)
        )
        return actuallyChanged ? newFilters : prevFilters
      })
      prevInitialFiltersRef.current = memoizedInitialFilters
    }
  }, [memoizedInitialFilters])

  // ⚡ OPTIMIZACIÓN CRÍTICA: Usar initialData del cache para evitar loading state y re-renders
  const queryKey = productQueryKeys.categoryListWithFilters(filters)
  
  // Query principal usando TanStack Query
  // ⚡ OPTIMIZACIÓN CRÍTICA: Configuración para evitar re-renders durante carga inicial
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
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
    refetchOnReconnect: false, // ⚡ CRÍTICO: No refetch en reconnect para evitar re-renders
    enabled: autoFetch,
    // ⚡ OPTIMIZACIÓN CRÍTICA: No notificar cambios de estado durante carga inicial
    notifyOnChangeProps: ['data', 'error'], // Solo notificar cambios en data y error, NO en isLoading
    // ⚡ OPTIMIZACIÓN CRÍTICA: Usar initialData del cache para evitar loading state
    initialData: cachedData, // Usar datos del cache inmediatamente
    // ⚡ OPTIMIZACIÓN CRÍTICA: Usar placeholderData para mantener datos mientras carga
    placeholderData: (previousData) => previousData || cachedData, // Mantener datos anteriores o del cache
    // ⚡ OPTIMIZACIÓN CRÍTICA: No actualizar si los datos son los mismos
    structuralSharing: true, // Mantener referencias si los datos no cambian
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

  // ⚡ OPTIMIZACIÓN: Estabilizar el array de categorías comparando contenido, no solo referencia
  const prevCategoriesRef = useRef<Category[]>([])
  const stableCategories = useMemo(() => {
    const currentCategories = data || []
    
    // Comparar contenido del array
    if (
      currentCategories.length !== prevCategoriesRef.current.length ||
      currentCategories.some(
        (cat, idx) =>
          !prevCategoriesRef.current[idx] ||
          cat.id !== prevCategoriesRef.current[idx].id ||
          cat.slug !== prevCategoriesRef.current[idx].slug ||
          cat.name !== prevCategoriesRef.current[idx].name
      )
    ) {
      prevCategoriesRef.current = currentCategories
      return currentCategories
    }
    return prevCategoriesRef.current
  }, [data])

  // ⚡ OPTIMIZACIÓN: Memoizar el objeto de retorno para evitar cambios en cada render
  return useMemo(
    () => ({
      // Estado - mantener compatibilidad con interfaz anterior
      categories: stableCategories,
      loading: isLoading,
      error: error ? (error instanceof Error ? error.message : String(error)) : null,

      // Acciones
      fetchCategories,
      updateFilters,
      searchCategories,
      refreshCategories,
    }),
    [stableCategories, isLoading, error, fetchCategories, updateFilters, searchCategories, refreshCategories]
  )
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
