'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Search, Plus } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface Brand {
  name: string
  products_count: number
}

interface BrandSelectorProps {
  value?: string
  onChange: (brand: string) => void
  error?: string
  placeholder?: string
  allowCreate?: boolean
  className?: string
}

// API function to fetch brands
async function fetchBrands(): Promise<Brand[]> {
  const response = await fetch('/api/brands')
  if (!response.ok) {
    throw new Error('Error fetching brands')
  }
  const data = await response.json()
  return data.data || []
}

export function BrandSelector({
  value,
  onChange,
  error,
  placeholder = 'Selecciona una marca',
  allowCreate = true,
  className,
}: BrandSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customBrand, setCustomBrand] = useState('')

  // Fetch brands
  const {
    data: brands = [],
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Filter brands based on search
  const filteredBrands = searchTerm
    ? brands.filter(brand =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : brands

  const handleSelect = (brandName: string) => {
    onChange(brandName)
    setIsOpen(false)
    setSearchTerm('')
    setCustomBrand('')
  }

  const handleCustomBrand = () => {
    if (customBrand.trim()) {
      handleSelect(customBrand.trim())
    }
  }

  const selectedBrand = brands.find(b => b.name === value) || (value ? { name: value, products_count: 0 } : null)

  if (fetchError) {
    return <div className='text-red-600 text-sm'>Error al cargar marcas</div>
  }

  return (
    <div className={cn('relative', className)}>
      {/* Selector Button */}
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-left',
          error ? 'border-red-300' : 'border-gray-300',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
        disabled={isLoading}
      >
        <span className={cn('text-sm text-gray-900', !selectedBrand && 'text-gray-500')}>
          {isLoading ? 'Cargando...' : selectedBrand?.name || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {/* Error Message */}
      {error && (
        <p className='text-red-600 text-sm mt-1'>{error}</p>
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
                placeholder='Buscar marcas...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-gray-900'
                autoFocus
              />
            </div>
          </div>

          {/* Brands List */}
          <div className='max-h-60 overflow-y-auto'>
            {filteredBrands.length === 0 && !allowCreate ? (
              <div className='p-4 text-center text-gray-500 text-sm'>
                No hay marcas disponibles
              </div>
            ) : (
              filteredBrands.map(brand => (
                <div
                  key={brand.name}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer',
                    value === brand.name && 'bg-blaze-orange-50 text-blaze-orange-700'
                  )}
                  onClick={() => handleSelect(brand.name)}
                >
                  <div className='flex items-center space-x-2 flex-1'>
                    <span className='text-sm font-medium text-gray-900'>{brand.name}</span>
                    <span className='text-xs text-gray-500'>({brand.products_count} productos)</span>
                  </div>
                  {value === brand.name && (
                    <div className='w-2 h-2 bg-blaze-orange-600 rounded-full'></div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Create New Brand */}
          {allowCreate && (
            <div className='border-t border-gray-200 p-3 space-y-2'>
              <div className='text-xs text-gray-500 mb-2'>O crear nueva marca:</div>
              <div className='flex items-center space-x-2'>
                <input
                  type='text'
                  placeholder='Nombre de la marca'
                  value={customBrand}
                  onChange={e => setCustomBrand(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customBrand.trim()) {
                      e.preventDefault()
                      handleCustomBrand()
                    }
                  }}
                  className='flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-gray-900'
                />
                <button
                  type='button'
                  onClick={handleCustomBrand}
                  disabled={!customBrand.trim()}
                  className='px-3 py-2 bg-blaze-orange-600 text-white rounded-lg hover:bg-blaze-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm'
                >
                  <Plus className='w-4 h-4' />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />}
    </div>
  )
}

