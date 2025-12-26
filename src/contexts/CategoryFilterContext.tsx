'use client'

// ===================================
// CONTEXT: CategoryFilterContext
// ===================================
// Contexto para compartir el estado de la categoría seleccionada
// entre CategoryTogglePills y DynamicProductCarousel

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { getCategoryConfig, CategoryConfig } from '@/constants/categories'

interface CategoryFilterContextType {
  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void
  categoryConfig: CategoryConfig
  toggleCategory: (category: string) => void
}

export const CategoryFilterContext = createContext<CategoryFilterContextType | undefined>(undefined)

export const useCategoryFilter = () => {
  const context = useContext(CategoryFilterContext)
  if (!context) {
    throw new Error('useCategoryFilter must be used within a CategoryFilterProvider')
  }
  return context
}

interface CategoryFilterProviderProps {
  children: ReactNode
  initialCategory?: string | null
}

export const CategoryFilterProvider: React.FC<CategoryFilterProviderProps> = ({
  children,
  initialCategory = null,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory)

  // Memoizar configuración de la categoría activa
  const categoryConfig = useMemo(() => getCategoryConfig(selectedCategory), [selectedCategory])

  // Toggle: si es la misma categoría, volver a default (null)
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategory(prev => {
      const newValue = prev === category ? null : category
      return newValue
    })
  }, [])

  // Memoizar el value del contexto para evitar re-renders innecesarios
  const value = useMemo(
    () => ({
      selectedCategory,
      setSelectedCategory,
      categoryConfig,
      toggleCategory,
    }),
    [selectedCategory, categoryConfig, toggleCategory]
  )

  return (
    <CategoryFilterContext.Provider value={value}>
      {children}
    </CategoryFilterContext.Provider>
  )
}

