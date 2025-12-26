// ===================================
// HOOK: useProductFilters - Optimizado para Performance
// ===================================

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductFilters } from '@/types/api'

// ===================================
// TIPOS
// ===================================

export interface ProductFilterState {
  categories: string[]
  brands: string[]
  priceMin?: number
  priceMax?: number
  search?: string
  sortBy: string
  page: number
  limit: number
}

export interface UseProductFiltersOptions {
  syncWithUrl?: boolean
  defaultSort?: string
  defaultLimit?: number
  debounceMs?: number
  onFiltersChange?: (filters: ProductFilterState) => void
}

export interface UseProductFiltersReturn {
  filters: ProductFilterState
  updateCategories: (categories: string[]) => void
  updateBrands: (brands: string[]) => void
  updatePriceRange: (min?: number, max?: number) => void
  updateSearch: (search: string) => void
  updateSort: (sort: string) => void
  updatePage: (page: number) => void
  updateLimit: (limit: number) => void
  clearFilters: () => void
  applyFilters: () => void
  hasActiveFilters: boolean
  totalActiveFilters: number
  isLoading: boolean
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
}

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
  } = options

  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  // ⚡ OPTIMIZACIÓN: Usar ref para rastrear filtros anteriores y evitar actualizaciones innecesarias
  const prevFiltersRef = useRef<ProductFilterState | null>(null)
  const isInitialMount = useRef(true)

  // ⚡ OPTIMIZACIÓN: Memoizar valores de URL para evitar comparaciones innecesarias
  const urlFiltersMemo = useMemo(() => {
    if (!syncWithUrl || !searchParams) {
      return null
    }

    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
    const brands = searchParams.get('brands')?.split(',').filter(Boolean) || []
    const priceMin = searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined
    const priceMax = searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || defaultSort
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || defaultLimit

    return {
      categories,
      brands,
      priceMin,
      priceMax,
      search,
      sortBy,
      page,
      limit,
    }
  }, [
    syncWithUrl,
    searchParams?.toString(), // ⚡ OPTIMIZACIÓN: Usar toString() para detectar cualquier cambio
    defaultSort,
    defaultLimit,
  ])

  // ⚡ OPTIMIZACIÓN: Inicializar filtros desde URL en el estado inicial para evitar re-render
  const [filters, setFilters] = useState<ProductFilterState>(() => {
    // Inicializar directamente desde URL si está disponible
    if (syncWithUrl && searchParams) {
      const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
      const brands = searchParams.get('brands')?.split(',').filter(Boolean) || []
      const priceMin = searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined
      const priceMax = searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined
      const search = searchParams.get('search') || ''
      const sortBy = searchParams.get('sortBy') || defaultSort
      const page = Number(searchParams.get('page')) || 1
      const limit = Number(searchParams.get('limit')) || defaultLimit

      const urlFilters = {
        categories,
        brands,
        priceMin,
        priceMax,
        search,
        sortBy,
        page,
        limit,
      }
      prevFiltersRef.current = urlFilters
      return urlFilters
    }
    return {
      ...DEFAULT_FILTERS,
      sortBy: defaultSort,
      limit: defaultLimit,
    }
  })

  // ⚡ OPTIMIZACIÓN CRÍTICA: NO sincronizar durante inicialización - ya está inicializado en useState
  // Solo sincronizar cambios posteriores en la URL (navegación del usuario)
  useEffect(() => {
    // Marcar que ya pasó el montaje inicial
    if (isInitialMount.current) {
      isInitialMount.current = false
      return // NO hacer nada durante el montaje inicial
    }

    // Solo sincronizar si hay cambios en la URL después del montaje inicial
    if (!urlFiltersMemo) {
      return
    }

    // ⚡ OPTIMIZACIÓN: Solo actualizar si realmente hay cambios
    const prevFilters = prevFiltersRef.current
    if (prevFilters) {
      const hasChanges =
        JSON.stringify(prevFilters.categories) !== JSON.stringify(urlFiltersMemo.categories) ||
        JSON.stringify(prevFilters.brands) !== JSON.stringify(urlFiltersMemo.brands) ||
        prevFilters.priceMin !== urlFiltersMemo.priceMin ||
        prevFilters.priceMax !== urlFiltersMemo.priceMax ||
        prevFilters.search !== urlFiltersMemo.search ||
        prevFilters.sortBy !== urlFiltersMemo.sortBy ||
        prevFilters.page !== urlFiltersMemo.page ||
        prevFilters.limit !== urlFiltersMemo.limit

      if (!hasChanges) {
        return // No hay cambios, no actualizar
      }
    }

    // Solo actualizar si es necesario (después del montaje inicial)
    setFilters(urlFiltersMemo)
    prevFiltersRef.current = urlFiltersMemo
  }, [urlFiltersMemo])

  // Función optimizada para actualizar URL
  const updateUrl = useCallback(
    (newFilters: ProductFilterState) => {
      if (!syncWithUrl) {
        return
      }

      const params = new URLSearchParams()

      // Solo agregar parámetros que tienen valores
      if (newFilters.categories.length > 0) {
        params.set('categories', newFilters.categories.join(','))
      }
      if (newFilters.brands.length > 0) {
        params.set('brands', newFilters.brands.join(','))
      }
      if (newFilters.priceMin !== undefined) {
        params.set('priceMin', newFilters.priceMin.toString())
      }
      if (newFilters.priceMax !== undefined) {
        params.set('priceMax', newFilters.priceMax.toString())
      }
      if (newFilters.search && newFilters.search.trim()) {
        params.set('search', newFilters.search.trim())
      }
      if (newFilters.sortBy !== defaultSort) {
        params.set('sortBy', newFilters.sortBy)
      }
      if (newFilters.page > 1) {
        params.set('page', newFilters.page.toString())
      }
      if (newFilters.limit !== defaultLimit) {
        params.set('limit', newFilters.limit.toString())
      }

      const newQuery = params.toString()
      const currentQuery = window.location.search.slice(1)

      if (newQuery !== currentQuery) {
        const newUrl = newQuery
          ? `${window.location.pathname}?${newQuery}`
          : window.location.pathname

        router.push(newUrl, { scroll: false })
      }
    },
    [syncWithUrl, router, defaultSort, defaultLimit]
  )

  // ⚡ OPTIMIZACIÓN: Usar ref para onFiltersChange para evitar cambios en cada render
  const onFiltersChangeRef = useRef(onFiltersChange)
  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange
  }, [onFiltersChange])

  // Función optimizada para actualizar filtros
  const updateFilters = useCallback(
    (updates: Partial<ProductFilterState>) => {
      setFilters(prev => {
        const newFilters = { ...prev, ...updates }

        // Reset page cuando cambian otros filtros (excepto page)
        if (!updates.hasOwnProperty('page') && Object.keys(updates).length > 0) {
          newFilters.page = 1
        }

        // Actualizar URL de forma asíncrona
        setTimeout(() => updateUrl(newFilters), 0)

        // Callback opcional usando ref para evitar dependencia
        onFiltersChangeRef.current?.(newFilters)

        return newFilters
      })
    },
    [updateUrl] // ⚡ OPTIMIZACIÓN: Remover onFiltersChange de dependencias
  )

  // Handlers memoizados para evitar re-renders
  const updateCategories = useCallback(
    (categories: string[]) => {
      updateFilters({ categories })
    },
    [updateFilters]
  )

  const updateBrands = useCallback(
    (brands: string[]) => {
      updateFilters({ brands })
    },
    [updateFilters]
  )

  const updatePriceRange = useCallback(
    (priceMin?: number, priceMax?: number) => {
      updateFilters({ priceMin, priceMax })
    },
    [updateFilters]
  )

  const updateSearch = useCallback(
    (search: string) => {
      updateFilters({ search })
    },
    [updateFilters]
  )

  const updateSort = useCallback(
    (sortBy: string) => {
      updateFilters({ sortBy })
    },
    [updateFilters]
  )

  const updatePage = useCallback(
    (page: number) => {
      updateFilters({ page })
    },
    [updateFilters]
  )

  const updateLimit = useCallback(
    (limit: number) => {
      updateFilters({ limit })
    },
    [updateFilters]
  )

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      ...DEFAULT_FILTERS,
      sortBy: defaultSort,
      limit: defaultLimit,
    }
    setFilters(clearedFilters)
    updateUrl(clearedFilters)
  }, [defaultSort, defaultLimit, updateUrl])

  const applyFilters = useCallback(() => {
    // Forzar actualización de URL
    updateUrl(filters)
    onFiltersChange?.(filters)
  }, [filters, updateUrl, onFiltersChange])

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
    )
  }, [filters, defaultSort])

  const totalActiveFilters = useMemo(() => {
    let count = 0
    count += filters.categories.length
    count += filters.brands.length
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      count += 1
    }
    if (filters.search && filters.search.trim() !== '') {
      count += 1
    }
    return count
  }, [filters])

  // ⚡ OPTIMIZACIÓN: Estabilizar filters comparando contenido, no solo referencia
  const stableFiltersRef = useRef<ProductFilterState>(filters)
  const stableFilters = useMemo(() => {
    const filtersStr = JSON.stringify(filters)
    const prevStr = JSON.stringify(stableFiltersRef.current)
    
    if (filtersStr !== prevStr) {
      stableFiltersRef.current = filters
      return filters
    }
    return stableFiltersRef.current
  }, [
    JSON.stringify(filters.categories),
    JSON.stringify(filters.brands),
    filters.priceMin,
    filters.priceMax,
    filters.search,
    filters.sortBy,
    filters.page,
    filters.limit,
  ])

  // ⚡ OPTIMIZACIÓN CRÍTICA: Estabilizar completamente el objeto de retorno usando refs
  const returnValueRef = useRef({
    filters: stableFilters,
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
  })

  // ⚡ OPTIMIZACIÓN CRÍTICA: Solo actualizar el ref si realmente cambió algo importante
  const prevFiltersStrRef = useRef(JSON.stringify(stableFilters))
  const currentFiltersStr = JSON.stringify(stableFilters)
  
  if (currentFiltersStr !== prevFiltersStrRef.current) {
    prevFiltersStrRef.current = currentFiltersStr
    returnValueRef.current = {
      filters: stableFilters,
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
    }
  } else {
    // Actualizar solo las funciones que pueden haber cambiado (aunque raramente)
    returnValueRef.current.updateCategories = updateCategories
    returnValueRef.current.updateBrands = updateBrands
    returnValueRef.current.updatePriceRange = updatePriceRange
    returnValueRef.current.updateSearch = updateSearch
    returnValueRef.current.updateSort = updateSort
    returnValueRef.current.updatePage = updatePage
    returnValueRef.current.updateLimit = updateLimit
    returnValueRef.current.clearFilters = clearFilters
    returnValueRef.current.applyFilters = applyFilters
    returnValueRef.current.hasActiveFilters = hasActiveFilters
    returnValueRef.current.totalActiveFilters = totalActiveFilters
    returnValueRef.current.isLoading = isLoading
  }

  // ⚡ OPTIMIZACIÓN CRÍTICA: Retornar siempre la misma referencia del objeto
  return returnValueRef.current
}
