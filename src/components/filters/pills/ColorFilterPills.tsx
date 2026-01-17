'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Check } from '@/lib/optimized-imports'
import { getTextColorForBackground } from '@/components/ui/product-card-commercial/utils/color-utils'
import { 
  resolveTextureType,
  getTextureStyle, 
  isTransparentColor,
} from '@/lib/textures'

interface ColorFilterPillProps {
  color: { name: string; hex: string; textureType?: string; finish?: string }
  isSelected: boolean
  onToggle: (colorName: string) => void
}

const ColorFilterPill: React.FC<ColorFilterPillProps> = React.memo(({ color, isSelected, onToggle }) => {
  const textureType = React.useMemo(() => {
    try {
      return resolveTextureType({
        colorName: color.name,
        colorTextureType: color.textureType,
        colorFinish: color.finish,
        isWoodProduct: false,
        selectedFinish: undefined,
      })
    } catch {
      return 'solid'
    }
  }, [color.name, color.textureType, color.finish])

  const isTransparent = React.useMemo(() => {
    try {
      return isTransparentColor(color.name)
    } catch {
      return false
    }
  }, [color.name])
  
  const textureStyle = React.useMemo(() => {
    try {
      return getTextureStyle(color.hex, textureType)
    } catch {
      return { backgroundColor: color.hex }
    }
  }, [color.hex, textureType])

  const textColor = React.useMemo(() => {
    if (isTransparent) {
      return 'text-black'
    }
    return getTextColorForBackground(color.hex, false, color.name)
  }, [isTransparent, color.hex, color.name])

  const handleClick = React.useCallback(() => {
    onToggle(color.name)
  }, [onToggle, color.name])

  const baseStyle = React.useMemo(() => ({
    ...textureStyle,
    backgroundColor: color.hex === '#FFFFFF' || color.hex === '#ffffff' ? '#F5F5F5' : textureStyle.backgroundColor,
    borderWidth: isSelected ? '2px' : '2px',
    borderColor: isSelected ? '#EA5A17' : 'rgba(255, 255, 255, 0.3)',
  }), [textureStyle, color.hex, isSelected])

  return (
    <button
      type='button'
      onClick={handleClick}
      title={color.name}
      className={cn(
        'relative flex-shrink-0 rounded-full flex items-center gap-2',
        'min-h-[36px] sm:min-h-[32px] px-3 sm:px-2.5 py-1.5 sm:py-1',
        'transform-gpu transition-all duration-200',
        isTransparent && 'backdrop-blur-md',
        isSelected
          ? 'bg-[#EA5A17] shadow-lg'
          : 'bg-white/10 hover:bg-white/20'
      )}
      style={isSelected ? undefined : baseStyle}
    >
      <span
        className={cn(
          'w-5 h-5 sm:w-4 sm:h-4 rounded-full border-2 flex-shrink-0',
          isSelected ? 'border-white' : 'border-white/50'
        )}
        style={isSelected ? undefined : { backgroundColor: color.hex === '#FFFFFF' || color.hex === '#ffffff' ? '#F5F5F5' : color.hex }}
      />
      <span className={cn(
        'relative z-10 font-medium leading-none whitespace-nowrap text-sm sm:text-xs',
        isSelected ? 'text-white' : textColor
      )}>
        {color.name}
      </span>
      
      {isSelected && (
        <Check className='relative z-10 w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-white' strokeWidth={3} />
      )}
    </button>
  )
})

ColorFilterPill.displayName = 'ColorFilterPill'

interface ColorFilterPillsProps {
  options: { name: string; hex: string; textureType?: string; finish?: string }[]
  selected: string[]
  onChange: (colors: string[]) => void
}

/**
 * Componente de pills para filtros de colores
 * Mobile-first con scroll horizontal
 */
export const ColorFilterPills: React.FC<ColorFilterPillsProps> = ({ 
  options, 
  selected, 
  onChange 
}) => {
  const handleToggle = React.useCallback((colorName: string) => {
    const isSelected = selected.includes(colorName)
    if (isSelected) {
      onChange(selected.filter(c => c !== colorName))
    } else {
      onChange([...selected, colorName])
    }
  }, [selected, onChange])

  return (
    <div className='overflow-x-auto -webkit-overflow-scrolling-touch scrollbar-hide'>
      <div className='flex gap-1.5 pb-1'>
        {options.map(color => (
          <ColorFilterPill
            key={color.name}
            color={color}
            isSelected={selected.includes(color.name)}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
