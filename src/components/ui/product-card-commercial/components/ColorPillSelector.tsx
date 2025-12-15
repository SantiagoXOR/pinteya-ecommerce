'use client'

import React from 'react'
import { ColorPill } from './ColorPill'
import type { ColorPillSelectorProps } from '../types'

/**
 * Selector de colores con scroll horizontal
 * Usa ColorPill internamente
 */
export const ColorPillSelector = React.memo(function ColorPillSelector({
  colors,
  selectedColor,
  onColorSelect,
  isImpregnante
}: ColorPillSelectorProps) {
  if (colors.length === 0) return null

  return (
    <div className='relative flex items-center justify-between gap-2'>
      <div className='relative flex-1 min-w-0 overflow-visible'>
        <div 
          className='flex items-center gap-1 overflow-x-auto scrollbar-hide scroll-smooth py-1 px-0 pr-16' 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {colors.map((colorData, index) => (
            <ColorPill
              key={`${colorData.hex}-${index}`}
              colorData={colorData}
              isSelected={selectedColor === colorData.hex}
              onSelect={onColorSelect}
              isImpregnante={isImpregnante}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

ColorPillSelector.displayName = 'ColorPillSelector'

