'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, X, Search, Check } from 'lucide-react'
import { cn } from '@/lib/core/utils'

interface Category {
  id: number
  name: string
  slug: string
}

interface CategoryMultiSelectorProps {
  value?: number[] // Array de IDs de categorías seleccionadas
  onChange: (categoryIds: number[]) => void
  error?: string
  placeholder?: string
  className?: string
  maxSelections?: number
}

// API function to fetch categories
async function fetchCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories')
  if (!response.ok) {
    throw new Error('Error fetching categories')
  }
  const data = await response.json()
  return data.data || []
}

export function CategoryMultiSelector({
  value = [],
  onChange,
  error,
  placeholder = 'Selecciona categorías',
  className,
  maxSelections,
}: CategoryMultiSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch categories
  const {
    data: categories = [],
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Find selected categories
  const selectedCategories = categories.filter(cat => value.includes(cat.id))

  // Filter categories based on search
  const filteredCategories = searchTerm
    ? categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : categories

  const handleToggleCategory = (categoryId: number) => {
    const isSelected = value.includes(categoryId)
    
    if (isSelected) {
      // Remove category
      onChange(value.filter(id => id !== categoryId))
    } else {
      // Add category (check max selections)
      if (maxSelections && value.length >= maxSelections) {
        return
      }
      onChange([...value, categoryId])
    }
  }

  const handleRemoveCategory = (categoryId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange(value.filter(id => id !== categoryId))
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  if (fetchError) {
    return <div className='text-red-600 text-sm'>Error al cargar categorías</div>
  }

  return (
    <div className={cn('relative', className)}>
      {/* Selector Button */}
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-start justify-between px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent min-h-[42px]',
          error ? 'border-red-300' : 'border-gray-300',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
        disabled={isLoading}
      >
        <div className='flex-1 flex flex-wrap gap-1.5 items-center'>
          {selectedCategories.length === 0 ? (
            <span className='text-sm text-gray-500'>
              {isLoading ? 'Cargando...' : placeholder}
            </span>
          ) : (
            selectedCategories.map(category => (
              <span
                key={category.id}
                className='inline-flex items-center gap-1 px-2 py-0.5 bg-blaze-orange-100 text-blaze-orange-700 text-xs font-medium rounded-md'
              >
                {category.name}
                <button
                  type='button'
                  onClick={(e) => handleRemoveCategory(category.id, e)}
                  className='hover:bg-blaze-orange-200 rounded-full p-0.5 transition-colors'
                >
                  <X className='w-3 h-3' />
                </button>
              </span>
            ))
          )}
        </div>
        
        <div className='flex items-center gap-2 ml-2'>
          {selectedCategories.length > 0 && (
            <button
              type='button'
              onClick={handleClearAll}
              className='text-gray-400 hover:text-gray-600 transition-colors'
              title='Limpiar selección'
            >
              <X className='w-4 h-4' />
            </button>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <p className='text-red-600 text-sm mt-1'>
          {error}
        </p>
      )}

      {/* Badge Counter */}
      {selectedCategories.length > 0 && (
        <p className='text-xs text-gray-500 mt-1'>
          {selectedCategories.length} categoría{selectedCategories.length !== 1 ? 's' : ''} seleccionada{selectedCategories.length !== 1 ? 's' : ''}
          {maxSelections && ` (máximo ${maxSelections})`}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden'>
          {/* Search */}
          <div className='p-3 border-b border-gray-200'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Buscar categorías...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                autoFocus
              />
            </div>
          </div>

          {/* Categories List */}
          <div className='max-h-60 overflow-y-auto'>
            {filteredCategories.length === 0 ? (
              <div className='p-4 text-center text-gray-500 text-sm'>
                {searchTerm ? 'No se encontraron categorías' : 'No hay categorías disponibles'}
              </div>
            ) : (
              filteredCategories.map(category => {
                const isSelected = value.includes(category.id)
                const isDisabled = !isSelected && maxSelections && value.length >= maxSelections

                return (
                  <div
                    key={category.id}
                    className={cn(
                      'flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors',
                      isSelected 
                        ? 'bg-blaze-orange-50 text-blaze-orange-700' 
                        : isDisabled
                        ? 'opacity-50 cursor-not-allowed hover:bg-gray-50'
                        : 'hover:bg-gray-50'
                    )}
                    onClick={() => !isDisabled && handleToggleCategory(category.id)}
                  >
                    <div className='flex items-center space-x-3 flex-1'>
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          isSelected
                            ? 'bg-blaze-orange-600 border-blaze-orange-600'
                            : 'border-gray-300'
                        )}
                      >
                        {isSelected && <Check className='w-3 h-3 text-white' />}
                      </div>
                      <span className='text-sm font-medium'>{category.name}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />}
    </div>
  )
}

