'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Check, Truck } from '@/lib/optimized-imports'

interface FreeShippingPillProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

/**
 * Componente de pill para toggle de envío gratis
 * Mobile-first
 */
export const FreeShippingPill: React.FC<FreeShippingPillProps> = ({ enabled, onChange }) => {
  const handleClick = React.useCallback(() => {
    onChange(!enabled)
  }, [enabled, onChange])

  return (
    <button
      type='button'
      onClick={handleClick}
      className={cn(
        'relative flex-shrink-0 rounded-full flex items-center gap-2',
        'min-h-[36px] sm:min-h-[32px] px-3 sm:px-2.5 py-1.5 sm:py-1',
        'transform-gpu transition-all duration-200',
        'border-2',
        enabled
          ? 'bg-[#EA5A17] border-[#EA5A17] text-white shadow-lg'
          : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40'
      )}
    >
      <Truck className={cn(
        'w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0',
        enabled ? 'text-white' : 'text-white/70'
      )} />
      <span className={cn(
        'relative z-10 font-medium leading-none whitespace-nowrap text-sm sm:text-xs',
      )}>
        Solo envío gratis
      </span>
      
      {enabled && (
        <Check className='relative z-10 w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-white' strokeWidth={3} />
      )}
    </button>
  )
}
