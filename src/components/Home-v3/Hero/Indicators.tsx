/**
 * Componente optimizado para indicadores (dots) del carousel
 * Memoizado para evitar re-renders innecesarios
 */

'use client'

import React, { memo } from 'react'
import type { IndicatorProps } from './types'

const Indicators: React.FC<IndicatorProps> = memo(
  ({ total, currentIndex, onIndicatorClick }) => {
    return (
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 sm:gap-3">
        {Array.from({ length: total }).map((_, index) => {
          const isActive = currentIndex === index

          return (
            <button
              key={index}
              onClick={() => onIndicatorClick(index)}
              className="relative rounded-full bg-white/60 h-2 sm:h-2.5 w-2 sm:w-2.5 transition-opacity duration-500"
              style={{
                opacity: isActive ? 1 : 0.6,
                transform: isActive
                  ? 'scaleX(4) translateZ(0)'
                  : 'scaleX(1) translateZ(0)',
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = '0.8'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = '0.6'
                }
              }}
              aria-label={`Ir al slide ${index + 1}`}
            />
          )
        })}
      </div>
    )
  }
)

Indicators.displayName = 'Indicators'

export default Indicators

