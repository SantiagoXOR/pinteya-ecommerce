// ===================================
// PINTEYA E-COMMERCE - HOOK PARA PRODUCTOS
// ===================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Product } from '@/types/product'
import { ProductFilters, PaginatedResponse, ProductWithCategory } from '@/types/api'
import { getProducts } from '@/lib/api/products'
import { adaptApiProductsToLegacy, ExtendedProduct } from '@/lib/adapters/productAdapter'

interface UseProductsState {
  products: ExtendedProduct[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UseProductsOptions {
  initialFilters?: ProductFilters
  autoFetch?: boolean
}

export function useProducts(options: UseProductsOptions = {}) {
  const { initialFilters = {}, autoFetch = true } = options

  // Referencias para evitar re-renders innecesarios
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastRequestRef = useRef<string>('')

  // DEBUG: Log básico para verificar que el hook se ejecuta (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
  }

  const [state, setState] = useState<UseProductsState>({
    products: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
    },
  })

  const [filters, setFilters] = useState<ProductFilters>(initialFilters)

  /**
   * Obtiene productos desde la API con optimizaciones de performance
   */
  const fetchProducts = useCallback(
    async (newFilters?: ProductFilters) => {
      const filtersToUse = newFilters || filters

      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        const MAX_API_LIMIT = 100
        const requestedLimit =
          typeof filtersToUse.limit === 'number' ? filtersToUse.limit : state.pagination.limit
        const perPage = Math.min(requestedLimit ?? 12, MAX_API_LIMIT)
        const shouldFetchAll = (requestedLimit ?? 12) > MAX_API_LIMIT

        const baseFilters: ProductFilters = {
          ...filtersToUse,
          limit: perPage,
          page: filtersToUse.page || 1,
        }

        if (shouldFetchAll) {
          // Fetch todas las páginas sin exceder el límite de la API
          const allProducts: ExtendedProduct[] = []
          let page = baseFilters.page as number
          let total = 0
          let totalPages = 0

          // Primera llamada para obtener totales
          const firstResponse = await getProducts(baseFilters)
          if (!firstResponse.success) {
            setState(prev => ({
              ...prev,
              loading: false,
              error: firstResponse.error || 'Error obteniendo productos',
            }))
            return
          }

          const firstProducts = adaptApiProductsToLegacy(firstResponse.data)
          allProducts.push(...firstProducts)
          total = firstResponse.pagination.total
          totalPages = firstResponse.pagination.totalPages

          // Continuar con las siguientes páginas
          for (page = (baseFilters.page as number) + 1; page <= totalPages; page++) {
            const resp = await getProducts({ ...baseFilters, page })
            if (!resp.success) {
              // Si falla alguna página, salimos con lo acumulado y mensaje de error
              setState(prev => ({
                ...prev,
                loading: false,
                error: resp.error || 'Error obteniendo productos',
              }))
              return
            }
            const adapted = adaptApiProductsToLegacy(resp.data)
            allProducts.push(...adapted)
            if (allProducts.length >= total) break
          }

          setState(prev => ({
            ...prev,
            products: allProducts,
            loading: false,
            // Al mostrar todos, representamos una sola página para ocultar paginación
            pagination: { page: 1, limit: allProducts.length, total, totalPages: 1 },
          }))
        } else {
          // Comportamiento estándar, con límite saneado
          const response = await getProducts(baseFilters)

          if (response.success) {
            const adaptedProducts = adaptApiProductsToLegacy(response.data)

            setState(prev => ({
              ...prev,
              products: adaptedProducts,
              loading: false,
              pagination: response.pagination,
            }))
          } else {
            setState(prev => ({
              ...prev,
              loading: false,
              error: response.error || 'Error obteniendo productos',
            }))
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error inesperado'
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
      }
    },
    [filters]
  )

  /**
   * Actualiza los filtros y obtiene productos
   */
  const updateFilters = useCallback(
    (newFilters: Partial<ProductFilters>) => {
      const updatedFilters = { ...filters, ...newFilters }
      setFilters(updatedFilters)
      fetchProducts(updatedFilters)
    },
    [filters, fetchProducts]
  )

  /**
   * Cambia la página
   */
  const changePage = useCallback(
    (page: number) => {
      updateFilters({ page })
    },
    [updateFilters]
  )

  /**
   * Cambia el límite de productos por página
   */
  const changeLimit = useCallback(
    (limit: number) => {
      updateFilters({ limit, page: 1 })
    },
    [updateFilters]
  )

  /**
   * Cambia el ordenamiento
   */
  const changeSorting = useCallback(
    (sortBy: 'price' | 'name' | 'created_at', sortOrder: 'asc' | 'desc') => {
      updateFilters({ sortBy, sortOrder, page: 1 })
    },
    [updateFilters]
  )

  /**
   * Busca productos por término
   */
  const searchProducts = useCallback(
    (searchTerm: string) => {
      updateFilters({ search: searchTerm, page: 1 })
    },
    [updateFilters]
  )

  /**
   * Filtra por categoría
   */
  const filterByCategory = useCallback(
    (category: string) => {
      updateFilters({ category, page: 1 })
    },
    [updateFilters]
  )

  /**
   * Filtra por múltiples categorías
   */
  const filterByCategories = useCallback(
    (categories: string[]) => {
      updateFilters({ categories, page: 1 })
    },
    [updateFilters]
  )

  /**
   * Filtra por múltiples marcas
   */
  const filterByBrands = useCallback(
    (brands: string[]) => {
      updateFilters({ brands, page: 1 })
    },
    [updateFilters]
  )

  /**
   * Filtra por rango de precios
   */
  const filterByPriceRange = useCallback(
    (priceMin?: number, priceMax?: number) => {
      updateFilters({ priceMin, priceMax, page: 1 })
    },
    [updateFilters]
  )

  /**
   * Limpia todos los filtros
   */
  const clearFilters = useCallback(() => {
    const clearedFilters: ProductFilters = {
      page: 1,
      limit: filters.limit || 12,
      sortBy: 'created_at',
      sortOrder: 'desc',
    }
    setFilters(clearedFilters)
    fetchProducts(clearedFilters)
  }, [filters.limit, fetchProducts])

  /**
   * Refresca los productos
   */
  const refresh = useCallback(() => {
    fetchProducts()
  }, [fetchProducts])

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchProducts()
    }
  }, [autoFetch]) // Removido fetchProducts de las dependencias para evitar bucles

  // Cleanup effect para cancelar requests pendientes
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Memoized helpers para optimizar renders
  const helpers = useMemo(
    () => ({
      hasProducts: state.products.length > 0,
      isEmpty: !state.loading && state.products.length === 0,
      hasError: !!state.error,
      hasNextPage: state.pagination.page < state.pagination.totalPages,
      hasPrevPage: state.pagination.page > 1,
    }),
    [
      state.products.length,
      state.loading,
      state.error,
      state.pagination.page,
      state.pagination.totalPages,
    ]
  )

  return {
    // Estado
    products: state.products,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    filters,

    // Acciones
    fetchProducts,
    updateFilters,
    changePage,
    changeLimit,
    changeSorting,
    searchProducts,
    filterByCategory,
    filterByCategories,
    filterByBrands,
    filterByPriceRange,
    clearFilters,
    refresh,

    // Helpers memoizados
    ...helpers,
  }
}
