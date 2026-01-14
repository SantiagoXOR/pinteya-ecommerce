'use client'

import React from 'react'
import { FinishPill } from './FinishPill'
import { useHorizontalScroll } from '../hooks/useHorizontalScroll'

interface FinishPillSelectorProps {
  finishes: string[]
  availableFinishes: string[]
  selectedFinish: string | null
  onFinishSelect: (finish: string) => void
}

/**
 * Selector de finishes (terminaciones) con scroll horizontal
 * Usa useHorizontalScroll para lógica de scroll compartida
 */
export const FinishPillSelector = React.memo(function FinishPillSelector({
  finishes,
  availableFinishes,
  selectedFinish,
  onFinishSelect,
}: FinishPillSelectorProps) {
  // Usar hook compartido de scroll horizontal
  const { scrollContainerRef, canScrollLeft, canScrollRight } = useHorizontalScroll({
    deps: [finishes]
  })

  if (!finishes || finishes.length === 0) return null

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
          className='absolute right-0 inset-y-0 w-8 z-10 pointer-events-none'
          style={{
            background: 'linear-gradient(to left, rgba(255, 255, 255, 0.95), transparent)',
          }}
        />
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación de arrays de finishes
  const prevFinishesLength = prevProps.finishes?.length || 0
  const nextFinishesLength = nextProps.finishes?.length || 0
  const prevAvailableLength = prevProps.availableFinishes?.length || 0
  const nextAvailableLength = nextProps.availableFinishes?.length || 0
  
  if (prevFinishesLength !== nextFinishesLength || prevAvailableLength !== nextAvailableLength) {
    return false
  }
  
  // Comparar strings de finishes
  const finishesEqual = prevProps.finishes.every((finish, idx) => 
    finish === nextProps.finishes?.[idx]
  )
  const availableEqual = prevProps.availableFinishes.every((finish, idx) => 
    finish === nextProps.availableFinishes?.[idx]
  )
  
  return (
    finishesEqual &&
    availableEqual &&
    prevProps.selectedFinish === nextProps.selectedFinish &&
    prevProps.onFinishSelect === nextProps.onFinishSelect
  )
})

FinishPillSelector.displayName = 'FinishPillSelector'
