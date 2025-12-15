/**
 * Componente selector de acabado (finish) para ShopDetailModal
 */

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Layers } from '@/lib/optimized-imports'

interface FinishSelectorProps {
  finishes: string[]
  selectedFinish: string
  onFinishChange: (finish: string) => void
}

/**
 * Selector de acabado memoizado
 */
export const FinishSelector = React.memo<FinishSelectorProps>(({
  finishes,
  selectedFinish,
  onFinishChange,
}) => {
  if (!finishes || finishes.length === 0) return null
  
  return (
    <div className='space-y-3'>
      <h4 className='text-sm font-medium text-gray-900 flex items-center gap-2'>
        <Layers className='w-4 h-4 text-blaze-orange-600' />
        Acabado
      </h4>
      <div className='grid grid-cols-2 gap-2'>
        {finishes.map(finish => (
          <button
            key={finish}
            onClick={() => onFinishChange(finish)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200',
              selectedFinish === finish
                ? 'border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            )}
          >
            {finish}
          </button>
        ))}
      </div>
      {selectedFinish && (
        <p className='text-sm text-gray-600'>
          Acabado seleccionado: <span className='font-medium'>{selectedFinish}</span>
        </p>
      )}
    </div>
  )
})

FinishSelector.displayName = 'FinishSelector'

