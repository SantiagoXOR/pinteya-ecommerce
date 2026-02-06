/**
 * Componente selector de capacidad para ShopDetailModal
 */

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Package } from '@/lib/optimized-imports'

interface CapacitySelectorProps {
  capacities: string[]
  selectedCapacity: string
  onCapacityChange: (capacity: string) => void
  /** Etiqueta dinámica según unidad (Capacidad, Peso, Longitud, Tamaño) */
  label?: string
}

/**
 * Selector de capacidad memoizado
 */
export const CapacitySelector = React.memo<CapacitySelectorProps>(({
  capacities,
  selectedCapacity,
  onCapacityChange,
  label = 'Capacidad',
}) => {
  return (
    <div className='space-y-3'>
      <h4 className='text-sm font-medium text-gray-900 flex items-center gap-2'>
        <Package className='w-4 h-4 text-blaze-orange-600' />
        {label}
      </h4>
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
        {capacities.map(capacity => (
          <button
            key={capacity}
            onClick={() => onCapacityChange(capacity)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200',
              selectedCapacity === capacity
                ? 'border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            )}
          >
            {capacity}
          </button>
        ))}
      </div>
      {selectedCapacity && (
        <p className='text-sm text-gray-600'>
          <span className='font-medium'>{selectedCapacity}</span>
        </p>
      )}
    </div>
  )
})

CapacitySelector.displayName = 'CapacitySelector'

