'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef, startTransition } from 'react'
import CategoryTogglePills from './CategoryTogglePills'
import { useProductFilters } from '@/hooks/useProductFilters'

// ⚡ OPTIMIZACIÓN: Componente base sin memo para poder usar hooks
const CategoryTogglePillsWithSearchBase = () => {
  // ⚡ DEBUG: Log detallado de re-renders del componente padre
  const prevStateRef = useRef<{
    filters: any
    currentSearchTerm: string
  } | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const prevState = prevStateRef.current
      const currentState = {
        filters,
        currentSearchTerm,
      }

      const changes: string[] = []
      if (!prevState) {
        changes.push('INITIAL_RENDER')
      } else {
        if (JSON.stringify(prevState.filters) !== JSON.stringify(filters)) {
          changes.push('filters')
        }
        if (prevState.currentSearchTerm !== currentSearchTerm) {
          changes.push('currentSearchTerm')
        }
        if (changes.length === 0) {
          changes.push('NO_STATE_CHANGED - INTERNAL_UPDATE')
        }
      }

      const stack = new Error().stack
      console.log('🔄 CategoryTogglePillsWithSearch re-rendered', {
        renderNumber: prevState ? 'SUBSEQUENT' : 'INITIAL',
        changes,
        state: currentState,
        timestamp: Date.now(),
        caller: stack?.split('\n')[2]?.trim() || 'unknown',
      })

      prevStateRef.current = currentState
    }
  })

  // ⚡ OPTIMIZACIÓN: Memoizar onFiltersChange para evitar cambios en cada render
  const onFiltersChangeRef = useRef<(filters: any) => void>((newFilters) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Filters changed:', newFilters)
    }
  })

  const { filters, updateCategories } = useProductFilters({
    syncWithUrl: true,
    onFiltersChange: onFiltersChangeRef.current,
  })

  // ⚡ OPTIMIZACIÓN: Guardar referencia estable a updateCategories
  const updateCategoriesRef = useRef(updateCategories)
  updateCategoriesRef.current = updateCategories

  // ⚡ OPTIMIZACIÓN CRÍTICA: Inicializar searchTerm directamente en useState para evitar re-render
  const [currentSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('q') || urlParams.get('search') || ''
    }
    return ''
  })

  // ⚡ OPTIMIZACIÓN CRÍTICA: Estabilizar filters.categories con useRef para evitar cambios innecesarios
  const prevCategoriesRef = useRef<string[]>([])
  const selectedCategories = useMemo(() => {
    const categoriesStr = JSON.stringify(filters.categories || [])
    const prevStr = JSON.stringify(prevCategoriesRef.current)
    
    if (categoriesStr !== prevStr) {
      prevCategoriesRef.current = filters.categories || []
      return filters.categories || []
    }
    return prevCategoriesRef.current
  }, [JSON.stringify(filters.categories)]) // Comparar contenido del array

  // ⚡ OPTIMIZACIÓN CRÍTICA: Memoizar onCategoryChange para evitar cambios en cada render
  const handleCategoryChange = useCallback(
    (categories: string[]) => {
      // ⚡ OPTIMIZACIÓN CRÍTICA: Usar startTransition para marcar como no urgente
      startTransition(() => {
        updateCategoriesRef.current(categories)
      })
    },
    [] // ⚡ Sin dependencias, usar ref
  )

  return (
    <CategoryTogglePills
      selectedCategories={selectedCategories}
      onCategoryChange={handleCategoryChange}
      searchTerm={currentSearchTerm}
      useDynamicCarousel={true}
    />
  )
}

// ⚡ OPTIMIZACIÓN CRÍTICA: Memoizar con comparación personalizada que siempre retorna true
// Esto evita que el componente se re-renderice cuando el hijo se renderiza
const CategoryTogglePillsWithSearch = React.memo(CategoryTogglePillsWithSearchBase, () => {
  // ⚡ CRÍTICO: Siempre retornar true para evitar re-renders
  // El componente solo se re-renderizará si su estado interno cambia explícitamente
  return true
})

CategoryTogglePillsWithSearch.displayName = 'CategoryTogglePillsWithSearch'

export default CategoryTogglePillsWithSearch
