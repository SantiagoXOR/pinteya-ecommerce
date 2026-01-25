'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Check } from '@/lib/optimized-imports'
import { getTextColorForBackground } from '../utils/color-utils'
import { 
  resolveTextureType,
  getTextureStyle, 
  isTransparentColor,
} from '@/lib/textures'
import type { ColorPillProps } from '../types'
import { useTenantSafe } from '@/contexts/TenantContext'

/**
 * Componente individual de pill de color
 * Memoizado para evitar re-renders innecesarios
 * Usa sistema unificado de texturas (modular)
 */
export const ColorPill = React.memo(function ColorPill({
  colorData,
  isSelected,
  onSelect,
  isImpregnante,
  selectedFinish
}: ColorPillProps) {
  // ⚡ MULTITENANT: Color del tenant para pills seleccionados
  const tenant = useTenantSafe()
  const primaryColor = tenant?.primaryColor || '#f27a1d' // Naranja por defecto
  
  // Resolver textura usando función centralizada
  const textureType = React.useMemo(() => resolveTextureType({
    colorName: colorData.name,
    colorTextureType: colorData.textureType,
    colorFinish: colorData.finish,
    isWoodProduct: isImpregnante,
    selectedFinish,
  }), [colorData.name, colorData.textureType, colorData.finish, isImpregnante, selectedFinish])

  // Verificar si es transparente para efectos adicionales
  const isTransparent = React.useMemo(() => isTransparentColor(colorData.name), [colorData.name])

  // Obtener estilos del sistema unificado de texturas
  const textureStyle = React.useMemo(() => {
    return getTextureStyle(colorData.hex, textureType)
  }, [colorData.hex, textureType])

  // Mantener siempre el color original del pill
  // Para INCOLORO, usar texto negro para mejor legibilidad
  const textColor = React.useMemo(() => {
    if (isTransparent) {
      return 'text-black'
    }
    return getTextColorForBackground(colorData.hex, false, colorData.name)
  }, [isTransparent, colorData.hex, colorData.name])

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(colorData.hex)
  }, [onSelect, colorData.hex])

  // ⚡ MULTITENANT: Convertir primaryColor hex a rgba para box-shadow
  const primaryColorRgba = React.useMemo(() => {
    if (primaryColor.startsWith('#')) {
      const hex = primaryColor.slice(1)
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, 0.3)`
    }
    return primaryColor
  }, [primaryColor])

  // Estilos base combinando textura del sistema unificado con estilos de selección - ⚡ MULTITENANT: usar primaryColor
  const baseStyle = React.useMemo(() => ({
    ...textureStyle,
    // Sobrescribir backgroundColor si es blanco puro
    backgroundColor: colorData.hex === '#FFFFFF' || colorData.hex === '#ffffff' ? '#F5F5F5' : textureStyle.backgroundColor,
    borderWidth: isSelected ? '1.5px' : '1px',
    borderColor: isSelected ? primaryColor : 'rgba(229, 231, 235, 1)',
  }), [textureStyle, colorData.hex, isSelected, primaryColor])

  // Box-shadow estático (no animado) - solo cambia opacity del pseudo-elemento
  const shadowOpacity = isSelected ? 1 : 0.6

  return (
    <button
      type='button'
      onClick={handleClick}
      title={colorData.name}
      className={cn(
        'relative py-0.5 flex-shrink-0 rounded-full flex items-center gap-0.5 h-[16px] sm:h-[18px]',
        'transform-gpu',
        isSelected 
          ? 'pl-1 pr-2 sm:pl-1.5 sm:pr-2.5' 
          : 'px-1 sm:px-1.5',
        isTransparent && 'backdrop-blur-md',
        // Solo transiciones compuestas
        'transition-transform duration-500 ease-in-out'
      )}
      style={{
        ...baseStyle,
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        willChange: 'transform',
      }}
    >
      {/* Pseudo-elemento para box-shadow con opacity animada - ⚡ MULTITENANT: usar primaryColor */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-500 ease-in-out"
        style={{
          boxShadow: isSelected 
            ? `0 2px 8px ${primaryColorRgba}, 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
            : '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          opacity: shadowOpacity,
        }}
      />
      <span className={cn(
        'relative z-10 font-bold leading-none whitespace-nowrap text-[6px] sm:text-[8px] uppercase',
        textColor
      )}>
        {colorData.name.toUpperCase()}
      </span>
      
      {/* Checkmark de selección - alineado al centro del texto */}
      {isSelected && (
        <Check className={cn('relative z-10 w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0', textColor)} strokeWidth={3} />
      )}
    </button>
  )
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.colorData.hex === nextProps.colorData.hex &&
    prevProps.colorData.name === nextProps.colorData.name &&
  // ⚡ MULTITENANT: No comparar tenant aquí ya que el hook useTenantSafe maneja los cambios
    prevProps.colorData.textureType === nextProps.colorData.textureType &&
    prevProps.colorData.finish === nextProps.colorData.finish &&
    prevProps.isImpregnante === nextProps.isImpregnante &&
    prevProps.selectedFinish === nextProps.selectedFinish // ✅ Re-render cuando cambia el finish seleccionado
  )
})

ColorPill.displayName = 'ColorPill'

