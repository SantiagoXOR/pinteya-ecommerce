/**
 * Componente selector de tamaño (pinceles) para ShopDetailModal
 */

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Ruler } from '@/lib/optimized-imports'

interface SizeSelectorProps {
  sizeOptions: string[]
  selectedSize: string
  onSizeChange: (size: string) => void
}

/**
 * Selector de tamaño memoizado
 */
export const SizeSelector = React.memo<SizeSelectorProps>(({ sizeOptions, selectedSize, onSizeChange }) => {
  if (!sizeOptions || sizeOptions.length === 0) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <Ruler className='w-5 h-5 text-blaze-orange-600' />
          <span className='text-base font-semibold text-gray-900'>Tamaño</span>
        </div>
        <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
          No hay opciones de tamaño disponibles para este producto
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <Ruler className='w-5 h-5 text-blaze-orange-600' />
        <span className='text-base font-semibold text-gray-900'>Tamaño</span>
      </div>
      <div className='grid grid-cols-3 gap-2'>
        {sizeOptions.map(size => (
          <button
            key={size}
            onClick={() => onSizeChange(size)}
            className={cn(
              'px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md',
              selectedSize === size
                ? 'border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blaze-orange-300 hover:bg-blaze-orange-25'
            )}
          >
            {size}
          </button>
        ))}
      </div>
      {selectedSize && (
        <p className='text-sm text-gray-600'>
          Tamaño seleccionado: <span className='font-medium'>{selectedSize}</span>
        </p>
      )}
    </div>
  )
})

SizeSelector.displayName = 'SizeSelector'

