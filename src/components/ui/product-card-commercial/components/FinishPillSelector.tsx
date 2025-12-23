'use client'

import React from 'react'
import { FinishPill } from './FinishPill'

interface FinishPillSelectorProps {
  finishes: string[]
  availableFinishes: string[]
  selectedFinish: string | null
  onFinishSelect: (finish: string) => void
}

/**
 * Selector de finishes (terminaciones) con scroll horizontal
 * Similar a ColorPillSelector y MeasurePillSelector
 */
export const FinishPillSelector = React.memo(function FinishPillSelector({
  finishes,
  availableFinishes,
  selectedFinish,
  onFinishSelect,
}: FinishPillSelectorProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const checkScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1)
    }

    checkScroll()
    container.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [finishes])

  if (!finishes || finishes.length === 0) return null

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
        {finishes.map((finish, index) => {
          const isAvailable = availableFinishes.includes(finish)
          return (
            <FinishPill
              key={`${finish}-${index}`}
              finish={finish}
              isSelected={selectedFinish === finish}
              isAvailable={isAvailable}
              onSelect={onFinishSelect}
            />
          )
        })}
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

FinishPillSelector.displayName = 'FinishPillSelector'
