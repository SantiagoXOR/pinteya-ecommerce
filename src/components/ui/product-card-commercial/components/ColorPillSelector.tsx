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
  isImpregnante,
  selectedFinish
}: ColorPillSelectorProps) {
  if (colors.length === 0) return null

  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // ⚡ FASE 5: Optimizado - agrupar lecturas de geometría en requestAnimationFrame
    const checkScroll = () => {
      requestAnimationFrame(() => {
        if (!container) return
        // Agrupar todas las lecturas de geometría
        const scrollLeft = container.scrollLeft
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth
        
        // Actualizar estado en el siguiente frame
        requestAnimationFrame(() => {
          setCanScrollLeft(scrollLeft > 0)
          setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
        })
      })
    }

    checkScroll()
    container.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [colors])

  return (
    <div className='relative w-full overflow-visible'>
      {/* Gradiente izquierdo - indicador de scroll */}
      {canScrollLeft && (
        <div 
          className='absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none'
          style={{
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0.95), transparent)',
          }}
        />
      )}
      
      {/* Contenedor de scroll full width - Sin scrollbar visible */}
      <div 
        ref={scrollContainerRef}
        className='flex items-center overflow-x-auto overflow-y-visible scroll-smooth w-full scrollbar-hide' 
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
          className='absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none'
          style={{
            background: 'linear-gradient(to left, rgba(255, 255, 255, 0.95), transparent)',
          }}
        />
      )}
    </div>
  )
})

ColorPillSelector.displayName = 'ColorPillSelector'

