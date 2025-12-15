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
  const textColor = React.useMemo(
    () => getTextColorForBackground(colorData.hex, false, colorData.name),
    [colorData.hex, colorData.name]
  )

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

  return (
    <button
      type='button'
      onClick={handleClick}
      title={colorData.name}
      className={cn(
        'relative py-0.5 flex-shrink-0 rounded-full transition-all flex items-center gap-1 h-[18px]',
        isSelected 
          ? 'border-2 border-[#EA5A17] pl-1.5 pr-2' 
          : 'border border-gray-200 px-1.5',
        isTransparent && 'backdrop-blur-md'
      )}
      style={{
        backgroundColor,
        ...(isTransparent ? transparentTexture : {}),
        ...woodTexture,
        ...glossTexture,
        ...satinTexture
      }}
    >
      <span className={cn(
        'font-bold leading-none whitespace-nowrap text-[8px] uppercase',
        textColor
      )}>
        {colorData.name.toUpperCase()}
      </span>
      
      {/* Checkmark de selección - alineado al centro del texto */}
      {isSelected && (
        <Check className={cn('w-2.5 h-2.5 flex-shrink-0', textColor)} strokeWidth={3} />
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

