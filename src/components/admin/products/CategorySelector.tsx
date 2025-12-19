'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Plus, Search, Folder, FolderOpen, X, Check } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface Category {
  id: number
  name: string
  description?: string
  parent_id?: number
  level: number
  children?: Category[]
}

interface CategorySelectorProps {
  value?: number | number[]
  onChange: (categoryId: number | number[]) => void
  error?: string
  placeholder?: string
  allowCreate?: boolean
  className?: string
  multiple?: boolean // Para habilitar selección múltiple
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

// Build category tree
function buildCategoryTree(categories: Category[]): Category[] {
  // ✅ CORREGIDO: Asegurar que categories siempre sea un array
  const safeCategories = Array.isArray(categories) ? categories : []
  
  const categoryMap = new Map<number, Category>()
  const rootCategories: Category[] = []

  // Create map of all categories
  safeCategories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  // Build tree structure
  safeCategories.forEach(category => {
    const categoryNode = categoryMap.get(category.id)!

    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id)
      if (parent) {
        parent.children!.push(categoryNode)
      }
    } else {
      rootCategories.push(categoryNode)
    }
  })

  return rootCategories
}

// Flatten categories for search
function flattenCategories(categories: Category[], level = 0): Category[] {
  const flattened: Category[] = []

  categories.forEach(category => {
    flattened.push({ ...category, level })
    if (category.children && category.children.length > 0) {
      flattened.push(...flattenCategories(category.children, level + 1))
    }
  })

  return flattened
}

export function CategorySelector({
  value,
  onChange,
  error,
  placeholder = 'Selecciona una categoría',
  allowCreate = false,
  className,
  multiple = false,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

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

  // ✅ CORREGIDO: Asegurar que categories siempre sea un array antes de procesarlo
  const safeCategories = Array.isArray(categories) ? categories : []
  const categoryTree = buildCategoryTree(safeCategories)
  const flatCategories = flattenCategories(categoryTree)

  // Handle value as array or single number
  const selectedIds = multiple 
    ? (Array.isArray(value) ? value : value ? [value] : [])
    : (Array.isArray(value) ? [value[0]] : value ? [value] : [])

  // Find selected categories
  const selectedCategories = flatCategories.filter(cat => selectedIds.includes(cat.id))
  const selectedCategory = !multiple ? selectedCategories[0] : undefined

  // Filter categories based on search
  // ✅ CORREGIDO: Asegurar que flatCategories y categoryTree siempre sean arrays
  const safeFlatCategories = Array.isArray(flatCategories) ? flatCategories : []
  const safeCategoryTree = Array.isArray(categoryTree) ? categoryTree : []
  const filteredCategories = searchTerm
    ? safeFlatCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : safeCategoryTree

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleSelect = (categoryId: number) => {
    if (multiple) {
      const currentIds = Array.isArray(value) ? value : value ? [value] : []
      const newIds = currentIds.includes(categoryId)
        ? currentIds.filter(id => id !== categoryId)
        : [...currentIds, categoryId]
      onChange(newIds)
      // No cerrar el dropdown en modo múltiple para permitir múltiples selecciones
    } else {
      onChange(categoryId)
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  const handleRemoveCategory = (categoryId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple && Array.isArray(value)) {
      const newIds = value.filter(id => id !== categoryId)
      onChange(newIds)
    }
  }

  const renderCategoryTree = (categories: Category[], level = 0) => {
    // ✅ CORREGIDO: Asegurar que categories siempre sea un array
    const safeCategories = Array.isArray(categories) ? categories : []
    if (safeCategories.length === 0) return []
    
    return safeCategories.map(category => {
      const isSelected = selectedIds.includes(category.id)
      return (
        <div key={category.id}>
          <div
            className={cn(
              'flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer',
              isSelected && 'bg-blaze-orange-50 text-blaze-orange-700'
            )}
            style={{ paddingLeft: `${12 + level * 20}px` }}
            onClick={() => handleSelect(category.id)}
          >
            <div className='flex items-center space-x-2 flex-1'>
              {multiple ? (
                <div className='w-5 h-5 flex items-center justify-center'>
                  <div
                    className={cn(
                      'w-4 h-4 border-2 rounded flex items-center justify-center',
                      isSelected
                        ? 'border-blaze-orange-600 bg-blaze-orange-600'
                        : 'border-gray-300'
                    )}
                  >
                    {isSelected && <Check className='w-3 h-3 text-white' />}
                  </div>
                </div>
              ) : category.children && Array.isArray(category.children) && category.children.length > 0 ? (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    toggleExpanded(category.id)
                  }}
                  className='p-1 hover:bg-gray-200 rounded'
                >
                  {expandedCategories.has(category.id) ? (
                    <FolderOpen className='w-4 h-4 text-gray-500' />
                  ) : (
                    <Folder className='w-4 h-4 text-gray-500' />
                  )}
                </button>
              ) : (
                <div className='w-6 h-6 flex items-center justify-center'>
                  <div className='w-2 h-2 bg-gray-300 rounded-full'></div>
                </div>
              )}

              <span className='text-sm font-medium text-gray-900'>{category.name}</span>
            </div>

            {!multiple && isSelected && (
              <div className='w-2 h-2 bg-blaze-orange-600 rounded-full'></div>
            )}
          </div>

          {category.children &&
            Array.isArray(category.children) &&
            category.children.length > 0 &&
            expandedCategories.has(category.id) && (
              <div>{renderCategoryTree(category.children, level + 1)}</div>
            )}
        </div>
      )
    }) : []
  }

  const renderFlatList = (categories: Category[]) => {
    // ✅ CORREGIDO: Asegurar que categories siempre sea un array
    const safeCategories = Array.isArray(categories) ? categories : []
    return safeCategories.map(category => {
      const isSelected = selectedIds.includes(category.id)
      return (
        <div
          key={category.id}
          className={cn(
            'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer',
            isSelected && 'bg-blaze-orange-50 text-blaze-orange-700'
          )}
          onClick={() => handleSelect(category.id)}
        >
          <div className='flex items-center space-x-2 flex-1'>
            {multiple && (
              <div className='w-5 h-5 flex items-center justify-center'>
                <div
                  className={cn(
                    'w-4 h-4 border-2 rounded flex items-center justify-center',
                    isSelected
                      ? 'border-blaze-orange-600 bg-blaze-orange-600'
                      : 'border-gray-300'
                  )}
                >
                  {isSelected && <Check className='w-3 h-3 text-white' />}
                </div>
              </div>
            )}
            <div style={{ marginLeft: `${category.level * 16}px` }}>
              <span className='text-sm text-gray-900'>
                {'—'.repeat(category.level)} {category.name}
              </span>
            </div>
          </div>

          {!multiple && isSelected && (
            <div className='w-2 h-2 bg-blaze-orange-600 rounded-full'></div>
          )}
        </div>
      )
    })
  }

  if (fetchError) {
    return <div className='text-red-600 text-sm'>Error al cargar categorías</div>
  }

  return (
    <div className={cn('relative', className)}>
      {/* Selected Categories as Chips (only in multiple mode) */}
      {multiple && selectedCategories.length > 0 && (
        <div className='mb-2 flex flex-wrap gap-2'>
          {selectedCategories.map(category => (
            <span
              key={category.id}
              className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blaze-orange-100 text-blaze-orange-800 border border-blaze-orange-200'
            >
              {category.name}
              <button
                type='button'
                onClick={e => handleRemoveCategory(category.id, e)}
                className='ml-2 hover:text-blaze-orange-900'
                aria-label={`Eliminar ${category.name}`}
              >
                <X className='w-3 h-3' />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Selector Button */}
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent',
          error ? 'border-red-300' : 'border-gray-300',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
        disabled={isLoading}
      >
        <span className={cn('text-sm', selectedCategory || selectedCategories.length > 0 ? 'text-gray-900' : 'text-gray-500')}>
          {isLoading
            ? 'Cargando...'
            : multiple
            ? selectedCategories.length > 0
              ? `${selectedCategories.length} categoría${selectedCategories.length > 1 ? 's' : ''} seleccionada${selectedCategories.length > 1 ? 's' : ''}`
              : placeholder
            : selectedCategory?.name || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {/* Error Message */}
      {error && (
        <p className='text-red-600 text-sm mt-1'>
          {error}
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
                className='w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-gray-900'
              />
            </div>
          </div>

          {/* Categories List */}
          <div className='max-h-60 overflow-y-auto'>
            {safeCategories.length === 0 ? (
              <div className='p-4 text-center text-gray-500 text-sm'>
                No hay categorías disponibles
              </div>
            ) : searchTerm ? (
              renderFlatList(Array.isArray(filteredCategories) ? filteredCategories : [])
            ) : (
              renderCategoryTree(safeCategoryTree)
            )}
          </div>

          {/* Create New Category */}
          {allowCreate && (
            <div className='border-t border-gray-200 p-3'>
              <button
                type='button'
                className='flex items-center space-x-2 text-sm text-blaze-orange-600 hover:text-blaze-orange-700'
                onClick={() => {
                  // TODO: Implement create category modal
                  console.log('Create new category')
                }}
              >
                <Plus className='w-4 h-4' />
                <span>Crear nueva categoría</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />}
    </div>
  )
}
