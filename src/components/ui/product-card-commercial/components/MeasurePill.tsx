'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Check } from '@/lib/optimized-imports'
import { parseMeasure } from '../utils/measure-utils'
import type { MeasurePillProps } from '../types'

/**
 * Componente individual de pill de medida
 * Memoizado para evitar re-renders innecesarios
 */
export const MeasurePill = React.memo(function MeasurePill({
  measure,
  isSelected,
  onSelect
}: MeasurePillProps) {
  const { number, unit } = React.useMemo(() => parseMeasure(measure), [measure])
  
  // Formatear la unidad - siempre en mayúsculas
  const displayUnit = React.useMemo(() => {
    if (unit === 'L' || unit === 'LT' || unit === 'LITRO' || unit === 'LITROS') {
      return number === '1' ? 'LITRO' : 'L'
    }
    // Convertir a mayúsculas cualquier otra unidad
    return unit.toUpperCase()
  }, [unit, number])

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(measure)
  }, [onSelect, measure])

  // Color del texto - siempre negro cuando está seleccionado
  const textColor = React.useMemo(() => {
    return 'text-gray-900'
  }, [])

  return (
    <button
      type='button'
      onClick={handleClick}
      className={cn(
        'relative py-0.5 flex-shrink-0 rounded-full transition-all flex items-center gap-1 h-[18px]',
        isSelected 
          ? 'bg-white pl-1.5 pr-2' 
          : 'bg-gray-50 border border-gray-200 px-1.5'
      )}
      style={isSelected ? { borderWidth: '1.5px', borderColor: '#EA5A17', borderStyle: 'solid' } : undefined}
    >
      <span className={cn(
        'font-bold leading-none whitespace-nowrap text-[8px]',
        textColor
      )}>
        {number}{displayUnit ? ` ${displayUnit}` : ''}
      </span>
      
      {/* Checkmark de selección - alineado al centro del texto */}
      {isSelected && (
        <Check className={cn('w-2.5 h-2.5 flex-shrink-0', textColor)} strokeWidth={3} />
      )}
    </button>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.measure === nextProps.measure
  )
})

MeasurePill.displayName = 'MeasurePill'

