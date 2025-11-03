'use client'

// ===================================
// CONTEXT: CategoryFilterContext
// ===================================
// Contexto para compartir el estado de la categoría seleccionada
// entre CategoryTogglePills y DynamicProductCarousel

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { getCategoryConfig, CategoryConfig } from '@/constants/categories'

interface CategoryFilterContextType {
  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void
  categoryConfig: CategoryConfig
  toggleCategory: (category: string) => void
}

const CategoryFilterContext = createContext<CategoryFilterContextType | undefined>(undefined)

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

  // Obtener configuración de la categoría activa
  const categoryConfig = getCategoryConfig(selectedCategory)

  // Toggle: si es la misma categoría, volver a default (null)
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategory(prev => (prev === category ? null : category))
  }, [])

  const value = {
    selectedCategory,
    setSelectedCategory,
    categoryConfig,
    toggleCategory,
  }

  return (
    <CategoryFilterContext.Provider value={value}>
      {children}
    </CategoryFilterContext.Provider>
  )
}

