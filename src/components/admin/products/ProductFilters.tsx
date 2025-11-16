'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X, Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/core/utils'
import { ProductFilters as ProductFiltersType } from '@/hooks/admin/useProductsEnterprise'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'

interface Category {
  id: number
  name: string
}

interface ProductFiltersProps {
  filters: ProductFiltersType
  onFiltersChange: (filters: Partial<ProductFiltersType>) => void
  onClearFilters: () => void
  categories?: Category[]
  className?: string
}

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'all', label: 'Todos' },
]

const stockStatusOptions = [
  { value: 'in_stock', label: 'En Stock' },
  { value: 'low_stock', label: 'Stock Bajo' },
  { value: 'out_of_stock', label: 'Sin Stock' },
  { value: 'all', label: 'Todos' },
]

const sortOptions = [
  { value: 'name', label: 'Nombre' },
  { value: 'price', label: 'Precio' },
  { value: 'stock', label: 'Stock' },
  { value: 'created_at', label: 'Fecha de creación' },
]

const sortOrderOptions = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
]

export function ProductFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  categories = [],
  className,
}: ProductFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const safeCategories = Array.isArray(categories) ? categories : []

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '')

  const handleInputChange = (key: keyof ProductFiltersType, value: string | number) => {
    onFiltersChange({ [key]: value === '' ? undefined : value })
  }

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    onFiltersChange({
      sort_by: sortBy as ProductFiltersType['sort_by'],
      sort_order: sortOrder as ProductFiltersType['sort_order'],
    })
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden', className)}
    >
      {/* Header Mejorado */}
      <div className='p-4 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors group'
          >
            <div className='p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors'>
              <SlidersHorizontal className='w-4 h-4 text-primary' />
            </div>
            <div className='flex items-center gap-2'>
              <span className='font-semibold'>Filtros</span>
              {hasActiveFilters && (
                <Badge variant="warning" size="sm" pulse>
                  {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== 'all').length}
                </Badge>
              )}
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className='w-4 h-4 text-gray-400' />
            </motion.div>
          </button>

          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onClearFilters}
              className='flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors'
            >
              <X className='w-4 h-4' />
              <span>Limpiar</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Search Bar - Always visible */}
      <div className='p-4'>
        <Input
          icon={Search}
          type='text'
          placeholder='Buscar productos por nombre, descripción, marca...'
          value={filters.search || ''}
          onChange={e => handleInputChange('search', e.target.value)}
        />
      </div>

      {/* Advanced Filters con animación */}
      <AnimatePresence>
        {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className='p-4 border-t border-gray-200 space-y-6'
        >
          {/* First Row - Basic Filters */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Category Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Categoría</label>
              <select
                value={filters.category_id || ''}
                onChange={e => handleInputChange('category_id', Number(e.target.value))}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
              >
                <option value=''>Todas las categorías</option>
                {safeCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Estado</label>
              <select
                value={filters.status || 'all'}
                onChange={e => handleInputChange('status', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Estado de Stock
              </label>
              <select
                value={filters.stock_status || 'all'}
                onChange={e => handleInputChange('stock_status', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
              >
                {stockStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Marca</label>
              <input
                type='text'
                placeholder='Filtrar por marca'
                value={filters.brand || ''}
                onChange={e => handleInputChange('brand', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
              />
            </div>
          </div>

          {/* Second Row - Price and Sort */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* Price Range */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Rango de Precio
              </label>
              <div className='flex space-x-2'>
                <input
                  type='number'
                  placeholder='Precio mín'
                  value={filters.price_min || ''}
                  onChange={e => handleInputChange('price_min', Number(e.target.value))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                />
                <input
                  type='number'
                  placeholder='Precio máx'
                  value={filters.price_max || ''}
                  onChange={e => handleInputChange('price_max', Number(e.target.value))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Ordenar por</label>
              <select
                value={filters.sort_by || 'created_at'}
                onChange={e => handleSortChange(e.target.value, filters.sort_order || 'desc')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Orden</label>
              <select
                value={filters.sort_order || 'desc'}
                onChange={e => handleSortChange(filters.sort_by || 'created_at', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
              >
                {sortOrderOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Summary Mejorado */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='pt-4 border-t border-gray-200'
            >
              <div className='flex flex-wrap gap-2'>
                {filters.search && (
                  <FilterTag
                    variant="info"
                    label="Búsqueda"
                    value={`"${filters.search}"`}
                    onRemove={() => handleInputChange('search', '')}
                  />
                )}

                {filters.category_id && (
                  <FilterTag
                    variant="success"
                    label="Categoría"
                    value={safeCategories.find(c => c.id === filters.category_id)?.name || String(filters.category_id)}
                    onRemove={() => handleInputChange('category_id', undefined)}
                  />
                )}

                {filters.status && filters.status !== 'all' && (
                  <FilterTag
                    variant="secondary"
                    label="Estado"
                    value={statusOptions.find(s => s.value === filters.status)?.label || filters.status}
                    onRemove={() => handleInputChange('status', 'all')}
                  />
                )}

                {filters.stock_status && filters.stock_status !== 'all' && (
                  <FilterTag
                    variant="warning"
                    label="Stock"
                    value={stockStatusOptions.find(s => s.value === filters.stock_status)?.label || filters.stock_status}
                    onRemove={() => handleInputChange('stock_status', 'all')}
                  />
                )}

                {filters.brand && (
                  <FilterTag
                    variant="soft"
                    label="Marca"
                    value={filters.brand}
                    onRemove={() => handleInputChange('brand', '')}
                  />
                )}

                {(filters.price_min || filters.price_max) && (
                  <FilterTag
                    variant="soft"
                    label="Precio"
                    value={`$${filters.price_min || 0} - $${filters.price_max || '∞'}`}
                    onRemove={() => {
                      handleInputChange('price_min', undefined)
                      handleInputChange('price_max', undefined)
                    }}
                  />
                )}

                {((filters.sort_by && filters.sort_by !== 'created_at') ||
                  (filters.sort_order && filters.sort_order !== 'desc')) && (
                  <FilterTag
                    variant="outline"
                    label="Orden"
                    value={`${sortOptions.find(s => s.value === filters.sort_by)?.label} (${sortOrderOptions.find(s => s.value === filters.sort_order)?.label})`}
                    onRemove={() => handleSortChange('created_at', 'desc')}
                  />
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Helper component para tags de filtros
function FilterTag({
  variant,
  label,
  value,
  onRemove
}: {
  variant: 'info' | 'success' | 'warning' | 'secondary' | 'soft' | 'outline'
  label: string
  value: string
  onRemove: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-gradient-to-r transition-all hover:shadow-sm'
      style={{
        ...getVariantStyles(variant)
      }}
    >
      <span className='opacity-70'>{label}:</span>
      <span className='font-semibold'>{value}</span>
      <button
        onClick={onRemove}
        className='ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors'
        type='button'
      >
        <X className='w-3 h-3' />
      </button>
    </motion.div>
  )
}

function getVariantStyles(variant: string) {
  const styles = {
    info: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      color: '#1e40af',
      borderColor: '#93c5fd'
    },
    success: {
      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      color: '#065f46',
      borderColor: '#6ee7b7'
    },
    warning: {
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      color: '#92400e',
      borderColor: '#fcd34d'
    },
    secondary: {
      background: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)',
      color: '#6b21a8',
      borderColor: '#c084fc'
    },
    soft: {
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      color: '#374151',
      borderColor: '#d1d5db'
    },
    outline: {
      background: '#ffffff',
      color: '#374151',
      borderColor: '#d1d5db'
    }
  }
  
  return styles[variant as keyof typeof styles] || styles.soft
}
