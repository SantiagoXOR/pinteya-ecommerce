'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import CategoryTogglePills from './CategoryTogglePills'
import { useProductFilters } from '@/hooks/useProductFilters'

// ⚡ OPTIMIZACIÓN: Memoizar callback para evitar re-renders
const CategoryTogglePillsWithSearch = React.memo(() => {
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

  const [currentSearchTerm, setCurrentSearchTerm] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Solo acceder a searchParams después del montaje en el cliente
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const searchTerm = urlParams.get('q') || urlParams.get('search') || ''
      setCurrentSearchTerm(searchTerm)
    }
  }, [])

  // ⚡ OPTIMIZACIÓN: Memoizar selectedCategories comparando contenido del array, no solo referencia
  const selectedCategories = useMemo(() => {
    return filters.categories
  }, [JSON.stringify(filters.categories)]) // Comparar contenido del array

  // ⚡ OPTIMIZACIÓN: Memoizar onCategoryChange para evitar cambios en cada render
  const handleCategoryChange = useCallback(
    (categories: string[]) => {
      updateCategories(categories)
    },
    [updateCategories]
  )

  // No renderizar hasta que esté montado en el cliente
  if (!mounted) {
    return <div className='h-16 bg-gray-100 animate-pulse rounded-lg mx-4 my-2' />
  }

  return (
    <CategoryTogglePills
      selectedCategories={selectedCategories}
      onCategoryChange={handleCategoryChange}
      searchTerm={currentSearchTerm}
    />
  )
})

CategoryTogglePillsWithSearch.displayName = 'CategoryTogglePillsWithSearch'

export default CategoryTogglePillsWithSearch
