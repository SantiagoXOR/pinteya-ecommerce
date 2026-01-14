'use client'

import React from 'react'
import { ColorPill } from './ColorPill'
import { useHorizontalScroll } from '../hooks/useHorizontalScroll'
import type { ColorPillSelectorProps } from '../types'

/**
 * Selector de colores con scroll horizontal
 * Usa ColorPill internamente y useHorizontalScroll para lógica de scroll
 */
export const ColorPillSelector = React.memo(function ColorPillSelector({
  colors,
  selectedColor,
  onColorSelect,
  isImpregnante,
  selectedFinish
}: ColorPillSelectorProps) {
  if (colors.length === 0) {
    return null
  }

  // Usar hook compartido de scroll horizontal
  const { scrollContainerRef, canScrollLeft, canScrollRight } = useHorizontalScroll({
    deps: [colors]
  })

  return (
    <div className='relative w-full overflow-hidden'>
      {/* Gradiente izquierdo - indicador de scroll */}
      {canScrollLeft && (
        <div 
          className='absolute left-0 inset-y-0 w-8 z-10 pointer-events-none'
          style={{
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0.95), transparent)',
          }}
        />
      )}
      
      {/* Contenedor de scroll full width - Sin scrollbar visible */}
      <div 
        ref={scrollContainerRef}
        className='flex items-center overflow-x-auto overflow-y-hidden scroll-smooth w-full scrollbar-hide' 
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          gap: 'clamp(0.25rem, 1vw, 0.375rem)',
          paddingTop: 'clamp(0.125rem, 0.5vw, 0.25rem)',
          paddingBottom: 'clamp(0.125rem, 0.5vw, 0.25rem)',
          paddingLeft: 'clamp(0.75rem, 2vw, 1rem)',
          paddingRight: 'clamp(0.75rem, 2vw, 1rem)',
        }}
      >
        {colors.map((colorData, index) => (
          <ColorPill
            key={`${colorData.hex}-${index}`}
            colorData={colorData}
            isSelected={selectedColor === colorData.hex}
            onSelect={onColorSelect}
            isImpregnante={isImpregnante}
            selectedFinish={selectedFinish}
          />
        ))}
      </div>

      {/* Gradiente derecho - indicador de scroll */}
      {canScrollRight && (
        <div 
          className='absolute right-0 inset-y-0 w-8 z-10 pointer-events-none'
          style={{
            background: 'linear-gradient(to left, rgba(255, 255, 255, 0.95), transparent)',
          }}
        />
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación profunda de arrays de colores
  const prevColorsLength = prevProps.colors?.length || 0
  const nextColorsLength = nextProps.colors?.length || 0
  
  if (prevColorsLength !== nextColorsLength) return false
  
  // Comparar hex de cada color
  const colorsEqual = prevProps.colors.every((color, idx) => 
    color.hex === nextProps.colors?.[idx]?.hex &&
    color.name === nextProps.colors?.[idx]?.name
  )
  
  return (
    colorsEqual &&
    prevProps.selectedColor === nextProps.selectedColor &&
    prevProps.isImpregnante === nextProps.isImpregnante &&
    prevProps.selectedFinish === nextProps.selectedFinish &&
    prevProps.onColorSelect === nextProps.onColorSelect
  )
})

ColorPillSelector.displayName = 'ColorPillSelector'
