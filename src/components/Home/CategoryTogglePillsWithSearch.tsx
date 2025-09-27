'use client'

import React, { useEffect, useState } from 'react'
import CategoryTogglePills from './CategoryTogglePills'
import { useProductFilters } from '@/hooks/useProductFilters'

const CategoryTogglePillsWithSearch = () => {
  const { filters, updateCategories } = useProductFilters({
    syncWithUrl: true,
    onFiltersChange: newFilters => {
      console.log('🔍 Filters changed:', newFilters)
    },
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

  // No renderizar hasta que esté montado en el cliente
  if (!mounted) {
    return <div className='h-16 bg-gray-100 animate-pulse rounded-lg mx-4 my-2' />
  }

  return (
    <CategoryTogglePills
      selectedCategories={filters.categories}
      onCategoryChange={updateCategories}
      searchTerm={currentSearchTerm}
    />
  )
}

export default CategoryTogglePillsWithSearch
