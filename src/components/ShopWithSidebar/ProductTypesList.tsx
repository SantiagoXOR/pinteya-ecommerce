// ===================================
// PINTURERÍADIGITAL - LISTA DE TIPOS DE PRODUCTOS
// ===================================
// ACTUALIZADO: Migrado de useCategoryData (deprecated) a useCategories

'use client'

import React from 'react'
import { useCategories } from '@/lib/categories/hooks'

interface ProductType {
  name: string
  slug: string
  description: string
  products: number
}

interface ProductTypesListProps {
  onCategorySelect: (slug: string) => void
  selectedCategory: string
}

const ProductTypesList: React.FC<ProductTypesListProps> = ({
  onCategorySelect,
  selectedCategory,
}) => {
  // Obtener categorías dinámicas desde la API (usando nuevo hook unificado)
  const { categories: apiCategories, isLoading: loading } = useCategories({
    autoFetch: true,
  })

  // Transformar categorías de la API al formato esperado
  const productTypes: ProductType[] = apiCategories.map(category => ({
    name: category.name,
    slug: category.slug || category.id,
    description: category.description || `Productos de ${category.name.toLowerCase()}`,
    products: category.count || 0,
  }))

  // Mostrar estado de carga si las categorías están cargando
  if (loading) {
    return (
      <div className='mb-7.5'>
        <h3 className='font-medium text-dark text-lg mb-4'>Tipos de Productos</h3>
        <div className='space-y-2'>
          {[...Array(4)].map((_, index) => (
            <div key={index} className='w-full p-2 rounded bg-gray-100 animate-pulse'>
              <div className='h-4 bg-gray-200 rounded w-3/4'></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='mb-7.5'>
      <h3 className='font-medium text-dark text-lg mb-4'>Tipos de Productos</h3>
      <ul className='space-y-2'>
        {productTypes.map(type => (
          <li key={type.slug}>
            <button
              onClick={() => onCategorySelect(type.slug)}
              className={`w-full text-left p-2 rounded transition-colors ${
                selectedCategory === type.slug ? 'bg-primary text-white' : 'hover:bg-gray-100'
              }`}
              title={type.description}
            >
              <span className='flex justify-between items-center'>
                <span className='font-medium'>{type.name}</span>
                {type.products > 0 && (
                  <span className='text-sm text-gray-500'>({type.products})</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProductTypesList
