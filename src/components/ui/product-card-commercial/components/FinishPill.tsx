'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Check } from '@/lib/optimized-imports'

interface FinishPillProps {
  finish: string
  isSelected: boolean
  isAvailable?: boolean
  onSelect: (finish: string) => void
}

/**
 * Pill individual para seleccionar un finish (terminación)
 */
export const FinishPill = React.memo(function FinishPill({
  finish,
  isSelected,
  isAvailable = true,
  onSelect,
}: FinishPillProps) {
  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isAvailable) {
        onSelect(finish)
      }
    },
    [finish, onSelect, isAvailable]
  )

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isAvailable}
      className={cn(
        'relative py-0.5 flex-shrink-0 rounded-full transition-all flex items-center gap-1 h-[18px]',
        isSelected && isAvailable
          ? 'bg-white pl-1.5 pr-2' 
          : isAvailable
          ? 'bg-gray-50 border border-gray-200 px-1.5'
          : 'bg-gray-100 border border-gray-200 px-1.5 opacity-50 cursor-not-allowed',
        isAvailable && 'active:scale-95'
      )}
      style={isSelected && isAvailable ? { borderWidth: '1.5px', borderColor: '#EA5A17', borderStyle: 'solid' } : undefined}
      aria-label={`Seleccionar acabado ${finish}`}
      title={!isAvailable ? `Este acabado no está disponible para el color seleccionado` : undefined}
    >
      <span className={cn(
        'font-bold leading-none whitespace-nowrap text-[8px] uppercase',
        isAvailable ? 'text-gray-900' : 'text-gray-400'
      )}>
        {finish}
      </span>
      
      {/* Checkmark de selección - alineado al centro del texto */}
      {isSelected && isAvailable && (
        <Check className="w-2.5 h-2.5 flex-shrink-0 text-gray-900" strokeWidth={3} />
      )}
    </button>
  )
})

FinishPill.displayName = 'FinishPill'
