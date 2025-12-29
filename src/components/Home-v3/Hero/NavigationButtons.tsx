/**
 * Componente optimizado para botones de navegación del carousel
 * Memoizado y optimizado para performance
 */

'use client'

import React, { memo } from 'react'
import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import type { NavigationButtonProps } from './types'

const NavigationButton: React.FC<NavigationButtonProps> = memo(
  ({ direction, onClick, ariaLabel }) => {
    const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
    const translateClass =
      direction === 'prev'
        ? 'group-hover:translate-x-[-2px]'
        : 'group-hover:translate-x-[2px]'

    return (
      <button
        onClick={onClick}
        className={`hidden md:flex absolute ${
          direction === 'prev' ? 'left-2 lg:left-4' : 'right-2 lg:right-4'
        } top-1/2 -translate-y-1/2 z-10 
                 bg-white/90 text-blaze-orange-600 
                 p-2 lg:p-3 rounded-full shadow-lg
                 transition-transform duration-500 hover:scale-110 active:scale-95
                 items-center justify-center group relative`}
        style={{
          opacity: 0.9,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
          const shadow = e.currentTarget.querySelector('.hover-shadow') as HTMLElement
          if (shadow) shadow.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.9'
          const shadow = e.currentTarget.querySelector('.hover-shadow') as HTMLElement
          if (shadow) shadow.style.opacity = '0'
        }}
        aria-label={ariaLabel}
      >
        <span className="absolute inset-0 rounded-full shadow-xl opacity-0 hover-shadow transition-opacity duration-500 pointer-events-none" />
        <Icon
          className={`w-5 h-5 lg:w-6 lg:h-6 ${translateClass} transition-transform duration-500 relative z-10`}
        />
      </button>
    )
  }
)

NavigationButton.displayName = 'NavigationButton'

export default NavigationButton

