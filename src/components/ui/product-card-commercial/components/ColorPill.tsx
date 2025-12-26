'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Check } from '@/lib/optimized-imports'
import { 
  darkenHex, 
  getTextColorForBackground, 
  isBlancoBrillante,
  isBlancoSatinado,
  isTransparentColor
} from '../utils/color-utils'
import { 
  getWoodTexture, 
  getGlossTexture, 
  getSatinTexture, 
  getTransparentTexture 
} from '../utils/texture-utils'
import type { ColorPillProps } from '../types'

/**
 * Componente individual de pill de color
 * Memoizado para evitar re-renders innecesarios
 */
export const ColorPill = React.memo(function ColorPill({
  colorData,
  isSelected,
  onSelect,
  isImpregnante
}: ColorPillProps) {
  // Calcular valores derivados con useMemo
  const darker = React.useMemo(() => darkenHex(colorData.hex, 0.35), [colorData.hex])
  
  const woodTexture = React.useMemo(() => {
    if (!isImpregnante) return {}
    return getWoodTexture(colorData.hex, darker)
  }, [isImpregnante, colorData.hex, darker])

  const isBlancoBrill = React.useMemo(() => isBlancoBrillante(colorData.name), [colorData.name])
  const isBlancoSat = React.useMemo(() => isBlancoSatinado(colorData.name), [colorData.name])
  const isTransparent = React.useMemo(() => isTransparentColor(colorData.name), [colorData.name])

  const glossTexture = React.useMemo(() => getGlossTexture(isBlancoBrill, false), [isBlancoBrill])
  const satinTexture = React.useMemo(() => getSatinTexture(isBlancoSat, false), [isBlancoSat])
  const transparentTexture = React.useMemo(() => isTransparent ? getTransparentTexture() : {}, [isTransparent])

  // Mantener siempre el color original del pill
  // Para INCOLORO, usar texto negro para mejor legibilidad
  const textColor = React.useMemo(() => {
    if (isTransparent) {
      return 'text-black'
    }
    return getTextColorForBackground(colorData.hex, false, colorData.name)
  }, [isTransparent, colorData.hex, colorData.name])

  // Usar siempre el color original, sin cambios por selección
  const backgroundColor = React.useMemo(() => {
    if (colorData.hex === '#FFFFFF' || colorData.hex === '#ffffff') {
      return '#F5F5F5'
    }
    return colorData.hex
  }, [colorData.hex])

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(colorData.hex)
  }, [onSelect, colorData.hex])

  // Estilos base sin animaciones no compuestas
  const baseStyle = React.useMemo(() => ({
    backgroundColor,
    borderWidth: isSelected ? '1.5px' : '1px',
    borderColor: isSelected ? '#EA5A17' : 'rgba(229, 231, 235, 1)',
    // ⚡ OPTIMIZACIÓN: Eliminado backdrop-filter completamente
    // El CSS global ya lo deshabilita
    ...(isTransparent ? transparentTexture : {}),
    ...woodTexture,
    ...glossTexture,
    ...satinTexture
  }), [backgroundColor, isSelected, isTransparent, transparentTexture, woodTexture, glossTexture, satinTexture])

  // Box-shadow estático (no animado) - solo cambia opacity del pseudo-elemento
  const shadowOpacity = isSelected ? 1 : 0.6

  return (
    <button
      type='button'
      onClick={handleClick}
      title={colorData.name}
      className={cn(
        'relative py-0.5 flex-shrink-0 rounded-full flex items-center gap-1 h-[18px]',
        'transform-gpu',
        isSelected 
          ? 'pl-1.5 pr-2' 
          : 'px-1.5',
        isTransparent && 'backdrop-blur-md',
        // Solo transiciones compuestas
        'transition-transform duration-200 ease-out'
      )}
      style={{
        ...baseStyle,
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        willChange: 'transform',
      }}
    >
      {/* Pseudo-elemento para box-shadow con opacity animada */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-200 ease-out"
        style={{
          boxShadow: isSelected 
            ? '0 2px 8px rgba(234, 90, 23, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          opacity: shadowOpacity,
        }}
      />
      <span className={cn(
        'relative z-10 font-bold leading-none whitespace-nowrap text-[8px] uppercase',
        textColor
      )}>
        {colorData.name.toUpperCase()}
      </span>
      
      {/* Checkmark de selección - alineado al centro del texto */}
      {isSelected && (
        <Check className={cn('relative z-10 w-2.5 h-2.5 flex-shrink-0', textColor)} strokeWidth={3} />
      )}
    </button>
  )
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.colorData.hex === nextProps.colorData.hex &&
    prevProps.colorData.name === nextProps.colorData.name &&
    prevProps.isImpregnante === nextProps.isImpregnante
  )
})

ColorPill.displayName = 'ColorPill'

