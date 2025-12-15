'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
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
  
  // Formatear la unidad
  const displayUnit = React.useMemo(() => {
    if (unit === 'L' || unit === 'LT' || unit === 'LITRO' || unit === 'LITROS') {
      return number === '1' ? 'Litro' : 'L'
    }
    return unit
  }, [unit, number])

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(measure)
  }, [onSelect, measure])

  return (
    <button
      type='button'
      onClick={handleClick}
      className={cn(
        'px-1.5 py-0.5 flex-shrink-0 rounded-full transition-all hover:scale-105 flex items-center justify-center h-[18px]',
        isSelected 
          ? 'bg-white border border-[#EA5A17]' 
          : 'bg-gray-50 border border-gray-200'
      )}
    >
      <span className={cn(
        'font-bold leading-none whitespace-nowrap',
        isSelected 
          ? 'text-[#EA5A17] text-[8px]' 
          : 'text-gray-700 text-[8px]'
      )}>
        {number}{displayUnit ? ` ${displayUnit}` : ''}
      </span>
    </button>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.measure === nextProps.measure
  )
})

MeasurePill.displayName = 'MeasurePill'

