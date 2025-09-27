'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Plus, Search, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/core/utils'

interface Category {
  id: string
  name: string
  description?: string
  parent_id?: string
  level: number
  children?: Category[]
}

interface CategorySelectorProps {
  value?: string
  onChange: (categoryId: string) => void
  error?: string
  placeholder?: string
  allowCreate?: boolean
  className?: string
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
  const categoryMap = new Map<string, Category>()
  const rootCategories: Category[] = []

  // Create map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  // Build tree structure
  categories.forEach(category => {
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
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

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

  const categoryTree = buildCategoryTree(categories)
  const flatCategories = flattenCategories(categoryTree)

  // Find selected category
  const selectedCategory = flatCategories.find(cat => cat.id === value)

  // Filter categories based on search
  const filteredCategories = searchTerm
    ? flatCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : categoryTree

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleSelect = (categoryId: string) => {
    onChange(categoryId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map(category => (
      <div key={category.id}>
        <div
          className={cn(
            'flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer',
            value === category.id && 'bg-blaze-orange-50 text-blaze-orange-700'
          )}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => handleSelect(category.id)}
        >
          <div className='flex items-center space-x-2 flex-1'>
            {category.children && category.children.length > 0 ? (
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

            <span className='text-sm font-medium'>{category.name}</span>
          </div>

          {value === category.id && (
            <div className='w-2 h-2 bg-blaze-orange-600 rounded-full'></div>
          )}
        </div>

        {category.children &&
          category.children.length > 0 &&
          expandedCategories.has(category.id) && (
            <div>{renderCategoryTree(category.children, level + 1)}</div>
          )}
      </div>
    ))
  }

  const renderFlatList = (categories: Category[]) => {
    return categories.map(category => (
      <div
        key={category.id}
        className={cn(
          'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer',
          value === category.id && 'bg-blaze-orange-50 text-blaze-orange-700'
        )}
        onClick={() => handleSelect(category.id)}
      >
        <div className='flex items-center space-x-2 flex-1'>
          <div style={{ marginLeft: `${category.level * 16}px` }}>
            <span className='text-sm'>
              {'—'.repeat(category.level)} {category.name}
            </span>
          </div>
        </div>

        {value === category.id && <div className='w-2 h-2 bg-blaze-orange-600 rounded-full'></div>}
      </div>
    ))
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
          'w-full flex items-center justify-between px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent',
          error ? 'border-red-300' : 'border-gray-300',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
        disabled={isLoading}
      >
        <span className={cn('text-sm', selectedCategory ? 'text-gray-900' : 'text-gray-500')}>
          {isLoading ? 'Cargando...' : selectedCategory?.name || placeholder}
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
          {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
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
              />
            </div>
          </div>

          {/* Categories List */}
          <div className='max-h-60 overflow-y-auto'>
            {categories.length === 0 ? (
              <div className='p-4 text-center text-gray-500 text-sm'>
                No hay categorías disponibles
              </div>
            ) : searchTerm ? (
              renderFlatList(filteredCategories as Category[])
            ) : (
              renderCategoryTree(categoryTree)
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
