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

  // Estilos base sin animaciones no compuestas
  const baseStyle = React.useMemo(() => {
    if (!isAvailable) {
      return {
        backgroundColor: '#f3f4f6',
        borderWidth: '1px',
        borderColor: 'rgba(229, 231, 235, 1)',
        borderStyle: 'solid',
        opacity: 0.5,
      }
    }
    return {
      backgroundColor: isSelected ? '#ffffff' : '#f9fafb',
      borderWidth: isSelected ? '1.5px' : '1px',
      borderColor: isSelected ? '#EA5A17' : 'rgba(229, 231, 235, 1)',
      borderStyle: 'solid',
    }
  }, [isSelected, isAvailable])

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isAvailable}
      className={cn(
        'relative py-0.5 flex-shrink-0 rounded-full flex items-center gap-0.5 h-[16px] sm:h-[18px]',
        'transform-gpu',
        isSelected && isAvailable
          ? 'pl-1 pr-2 sm:pl-1.5 sm:pr-2.5' 
          : isAvailable
          ? 'px-1 sm:px-1.5'
          : 'px-1 sm:px-1.5 cursor-not-allowed',
        // Solo transiciones compuestas
        isAvailable && 'transition-transform duration-500 ease-in-out active:scale-95'
      )}
      style={{
        ...baseStyle,
        transform: isSelected && isAvailable ? 'scale(1.05)' : 'scale(1)',
        willChange: isAvailable ? 'transform' : undefined,
      }}
      aria-label={`Seleccionar acabado ${finish}`}
      title={!isAvailable ? `Este acabado no está disponible para el color seleccionado` : undefined}
    >
      <span className={cn(
        'relative z-10 font-bold leading-none whitespace-nowrap text-[6px] sm:text-[8px] uppercase',
        isAvailable ? 'text-gray-900' : 'text-gray-400'
      )}>
        {finish}
      </span>
      
      {/* Checkmark de selección - alineado al centro del texto */}
      {isSelected && isAvailable && (
        <Check className="relative z-10 w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0 text-gray-900" strokeWidth={3} />
      )}
    </button>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.finish === nextProps.finish &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isAvailable === nextProps.isAvailable &&
    prevProps.onSelect === nextProps.onSelect
  )
})

FinishPill.displayName = 'FinishPill'
