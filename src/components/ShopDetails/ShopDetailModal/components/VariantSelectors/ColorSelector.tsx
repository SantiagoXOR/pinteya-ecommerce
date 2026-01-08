/**
 * Componente selector de color para ShopDetailModal
 * Reutiliza getColorHexFromName y COLOR_MAP de ProductCard
 */

import React from 'react'
import { cn } from '@/lib/core/utils'
import { getColorHexFromName, COLOR_MAP } from '../../utils/color-utils'
import { PAINT_COLORS } from '@/components/ui/advanced-color-picker'

interface ColorSelectorProps {
  colors: string[]
  selectedColor: string
  onColorChange: (color: string) => void
}

/**
 * Selector de color memoizado
 */
export const ColorSelector = React.memo<ColorSelectorProps>(({ colors, selectedColor, onColorChange }) => {
  return (
    <div className='space-y-3'>
      <h4 className='text-sm font-medium text-gray-900'>Color</h4>
      <div className='flex flex-wrap gap-2'>
        {colors.map(color => {
          // Reutilizar getColorHexFromName de ProductCard
          const colorHex = getColorHexFromName(color) || COLOR_MAP[color.toLowerCase()] || '#E5E7EB'
          
          return (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all duration-200',
                selectedColor === color
                  ? 'border-blaze-orange-500 ring-2 ring-blaze-orange-200'
                  : 'border-gray-300 hover:border-gray-400'
              )}
              style={{
                backgroundColor: colorHex,
              }}
              title={color}
              aria-label={`Seleccionar color ${color}`}
            />
          )
        })}
      </div>
      {selectedColor && (
        <p className='text-sm text-gray-600 capitalize'>
          Color seleccionado:{' '}
          <span className='font-medium'>
            {PAINT_COLORS.find(color => color.id === selectedColor)?.displayName}
          </span>
        </p>
      )}
    </div>
  )
})

ColorSelector.displayName = 'ColorSelector'

