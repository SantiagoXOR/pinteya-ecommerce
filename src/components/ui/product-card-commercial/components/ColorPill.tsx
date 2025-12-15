'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { 
  darkenHex, 
  getTextColorForBackground, 
  getBackgroundColorForPill,
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
    if (!isImpregnante || isSelected) return {}
    return getWoodTexture(colorData.hex, darker)
  }, [isImpregnante, isSelected, colorData.hex, darker])

  const isBlancoBrill = React.useMemo(() => isBlancoBrillante(colorData.name), [colorData.name])
  const isBlancoSat = React.useMemo(() => isBlancoSatinado(colorData.name), [colorData.name])
  const isTransparent = React.useMemo(() => isTransparentColor(colorData.name), [colorData.name])

  const glossTexture = React.useMemo(() => getGlossTexture(isBlancoBrill, isSelected), [isBlancoBrill, isSelected])
  const satinTexture = React.useMemo(() => getSatinTexture(isBlancoSat, isSelected), [isBlancoSat, isSelected])
  const transparentTexture = React.useMemo(() => isTransparent ? getTransparentTexture() : {}, [isTransparent])

  const textColor = React.useMemo(
    () => getTextColorForBackground(colorData.hex, isSelected, colorData.name),
    [colorData.hex, isSelected, colorData.name]
  )

  const backgroundColor = React.useMemo(
    () => getBackgroundColorForPill(colorData.hex, isSelected),
    [colorData.hex, isSelected]
  )

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
        'px-1.5 py-0.5 flex-shrink-0 rounded-full transition-all hover:scale-105 flex items-center justify-center h-[18px]',
        isSelected 
          ? 'border border-[#EA5A17]' 
          : 'border border-gray-200',
        isTransparent && 'backdrop-blur-md'
      )}
      style={{
        backgroundColor,
        ...(isTransparent ? transparentTexture : {}),
        ...(isSelected ? {} : woodTexture),
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

