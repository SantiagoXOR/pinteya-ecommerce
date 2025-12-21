'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Check } from '@/lib/optimized-imports'

interface FinishPillProps {
  finish: string
  isSelected: boolean
  onSelect: (finish: string) => void
}

/**
 * Pill individual para seleccionar un finish (terminación)
 */
export const FinishPill = React.memo(function FinishPill({
  finish,
  isSelected,
  onSelect,
}: FinishPillProps) {
  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onSelect(finish)
    },
    [finish, onSelect]
  )

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'relative flex items-center justify-center min-w-[60px] px-2.5 py-1.5 rounded-lg',
        'text-xs font-medium transition-all duration-200',
        'border-2',
        isSelected
          ? 'border-blaze-orange-500 bg-blaze-orange-500 text-white shadow-md'
          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50',
        'active:scale-95'
      )}
      aria-label={`Seleccionar acabado ${finish}`}
    >
      <span>{finish}</span>
      {isSelected && (
        <Check className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blaze-orange-600 text-white rounded-full p-0.5" />
      )}
    </button>
  )
})

FinishPill.displayName = 'FinishPill'
