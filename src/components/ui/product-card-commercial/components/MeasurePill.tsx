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

  // Estilos base sin animaciones no compuestas
  const baseStyle = React.useMemo(() => ({
    backgroundColor: isSelected ? '#ffffff' : '#f9fafb',
    borderWidth: isSelected ? '1.5px' : '1px',
    borderColor: isSelected ? '#EA5A17' : 'rgba(229, 231, 235, 1)',
    borderStyle: 'solid',
    // ⚡ OPTIMIZACIÓN: Eliminado backdrop-filter completamente
    // El CSS global ya lo deshabilita
  }), [isSelected])

  // Box-shadow estático (no animado) - solo cambia opacity del pseudo-elemento
  const shadowOpacity = isSelected ? 1 : 0.6

  return (
    <button
      type='button'
      onClick={handleClick}
      className={cn(
        'relative py-0.5 flex-shrink-0 rounded-full flex items-center gap-0.5 h-[16px] sm:h-[18px]',
        'transform-gpu',
        isSelected 
          ? 'pl-1 pr-2 sm:pl-1.5 sm:pr-2.5' 
          : 'px-1 sm:px-1.5',
        // Solo transiciones compuestas
        'transition-transform duration-500 ease-in-out'
      )}
      style={{
        ...baseStyle,
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        willChange: 'transform',
      }}
    >
      {/* Pseudo-elemento para box-shadow con opacity animada */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-500 ease-in-out"
        style={{
          boxShadow: isSelected 
            ? '0 2px 8px rgba(234, 90, 23, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          opacity: shadowOpacity,
        }}
      />
      <span className={cn(
        'relative z-10 font-bold leading-none whitespace-nowrap text-[6px] sm:text-[8px]',
        textColor
      )}>
        {number}{displayUnit ? ` ${displayUnit}` : ''}
      </span>
      
      {/* Checkmark de selección - alineado al centro del texto */}
      {isSelected && (
        <Check className={cn('relative z-10 w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0', textColor)} strokeWidth={3} />
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

