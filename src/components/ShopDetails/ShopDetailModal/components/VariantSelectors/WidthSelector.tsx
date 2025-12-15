/**
 * Componente selector de ancho (cintas) para ShopDetailModal
 */

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Maximize } from '@/lib/optimized-imports'

interface WidthSelectorProps {
  widthOptions: string[]
  selectedWidth: string
  onWidthChange: (width: string) => void
}

/**
 * Selector de ancho memoizado
 */
export const WidthSelector = React.memo<WidthSelectorProps>(({
  widthOptions,
  selectedWidth,
  onWidthChange,
}) => {
  // Mostrar solo el ancho sin "x 40m"
  const formatWidthOption = (width: string) => {
    // Si ya contiene " x ", extraer solo la parte del ancho
    if (width.includes(' x ')) {
      return width.split(' x ')[0]
    }
    return width
  }

  // Extraer solo el ancho de la opción seleccionada para mostrar en el texto
  const getWidthFromOption = (option: string) => {
    return option.split(' x ')[0] || option
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <Maximize className='w-5 h-5 text-blaze-orange-600' />
        <span className='text-base font-semibold text-gray-900'>Ancho</span>
      </div>
      <div className='grid grid-cols-2 gap-2'>
        {widthOptions.map(width => (
          <button
            key={width}
            onClick={() => onWidthChange(width)}
            className={cn(
              'px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md',
              selectedWidth === width
                ? 'border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blaze-orange-300 hover:bg-blaze-orange-25'
            )}
          >
            {formatWidthOption(width)}
          </button>
        ))}
      </div>
      {selectedWidth && (
        <p className='text-sm text-gray-600'>
          Ancho seleccionado: <span className='font-medium'>{getWidthFromOption(selectedWidth)}</span>
        </p>
      )}
    </div>
  )
})

WidthSelector.displayName = 'WidthSelector'

