/**
 * Componente selector de grano (lijas) para ShopDetailModal
 */

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Layers } from '@/lib/optimized-imports'

interface GrainSelectorProps {
  grainOptions: string[]
  selectedGrain: string
  onGrainChange: (grain: string) => void
}

/**
 * Selector de grano memoizado
 */
export const GrainSelector = React.memo<GrainSelectorProps>(({
  grainOptions,
  selectedGrain,
  onGrainChange,
}) => {
  if (!grainOptions || grainOptions.length === 0) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <Layers className='w-5 h-5 text-blaze-orange-600' />
          <span className='text-base font-semibold text-gray-900'>Grano</span>
        </div>
        <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
          No hay opciones de grano disponibles para este producto
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <Layers className='w-5 h-5 text-blaze-orange-600' />
        <span className='text-base font-semibold text-gray-900'>Grano</span>
      </div>
      <div className='grid grid-cols-4 gap-2'>
        {grainOptions.map(grain => (
          <button
            key={grain}
            onClick={() => onGrainChange(grain)}
            className={cn(
              'px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md',
              selectedGrain === grain
                ? 'border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blaze-orange-300 hover:bg-blaze-orange-25'
            )}
          >
            {grain}
          </button>
        ))}
      </div>
      {selectedGrain && (
        <p className='text-sm text-gray-600'>
          Grano seleccionado: <span className='font-medium'>{selectedGrain}</span>
        </p>
      )}
    </div>
  )
})

GrainSelector.displayName = 'GrainSelector'

