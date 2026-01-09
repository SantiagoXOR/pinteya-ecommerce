'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Search, Palette, Eye, Check } from '@/lib/optimized-imports'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/core/utils'
import { ProductType } from '@/utils/product-utils'
// Importar desde archivo compartido para uso en cliente y servidor
import { PAINT_COLORS, type ColorOption } from '@/lib/constants/paint-colors'
// Sistema unificado de texturas
import { getTextureStyle, isTransparentColor, inferTextureFromColorName, getTextureForFinish } from '@/lib/textures/texture-system'

// Re-exportar para compatibilidad con código existente
export type { ColorOption }
export { PAINT_COLORS }

interface AdvancedColorPickerProps {
  colors?: ColorOption[]
  selectedColor: string
  onColorChange: (colorId: string) => void
  showSearch?: boolean
  showCategories?: boolean
  showPreview?: boolean
  maxDisplayColors?: number
  className?: string
  productType?: ProductType // Nuevo prop para filtrar colores según el tipo de producto
}

// ===================================
// PALETA DE COLORES PARA PINTURAS
// ===================================
// NOTA: PAINT_COLORS ahora se importa desde @/lib/constants/paint-colors
// para uso compartido entre cliente y servidor

// ===================================
// FUNCIONES AUXILIARES
// ===================================

const getCategoryDisplayName = (category: string): string => {
  const categoryNames: Record<string, string> = {
    all: 'Todos',
    Madera: 'Madera',
    Sintético: 'Sintético',
    Neutros: 'Neutros',
    Cálidos: 'Cálidos',
    Fríos: 'Fríos',
    Tierras: 'Tierras',
  }

  return categoryNames[category] || category
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const AdvancedColorPicker: React.FC<AdvancedColorPickerProps> = ({
  colors = PAINT_COLORS,
  selectedColor,
  onColorChange,
  showSearch = true,
  showCategories = true,
  showPreview = true,
  maxDisplayColors = 24,
  className,
  productType,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAllColors, setShowAllColors] = useState(false)

  // Filtrar colores según el tipo de producto
  const availableColors = useMemo(() => {
    console.log('🎨 AdvancedColorPicker - Debug Info:', {
      productType,
      hasProductType: !!productType,
      allowedColorCategories: productType?.allowedColorCategories,
      totalColors: colors.length,
      colorsSource: colors.length < 50 ? 'smartColors (pre-filtrados)' : 'PAINT_COLORS (completos)',
    })

    // CRÍTICO: Si recibimos menos de 50 colores, son colores inteligentes ya filtrados
    // NO aplicar filtrado adicional para evitar perder colores de variantes
    if (colors.length < 50) {
      console.log('✅ Usando colores inteligentes pre-filtrados sin filtrado adicional:', colors.length)
      return colors
    }

    if (!productType || !productType.allowedColorCategories) {
      console.log('⚠️ No hay restricciones de color, mostrando todos los colores')
      return colors // Si no hay restricciones, mostrar todos los colores
    }

    let filtered = colors.filter(color =>
      productType.allowedColorCategories!.includes(color.category)
    )

    // Para productos de látex, excluir completamente los colores de madera
    const isLatexProduct = productType.id === 'pinturas-latex'
    if (isLatexProduct) {
      filtered = filtered.filter(color => color.category !== 'Madera')
      // Cambiar categoría de "Sintético" a "Látex" para productos de látex
      filtered = filtered.map(color => ({
        ...color,
        category: color.category === 'Sintético' ? 'Látex' : color.category,
        description: color.description?.includes('sintéticos') 
          ? color.description.replace('sintéticos', 'látex')
          : color.description
      }))
      console.log('🎨 Latex product detected - excluding wood colors and updating categories')
    }

    // Para Impregnantes de madera: excluir blancos y cremas del selector
    if (productType.id === 'impregnante-madera') {
      const blocked = new Set(['blanco-puro', 'crema', 'blanco', 'marfil'])
      filtered = filtered.filter(c => !blocked.has(c.id))
    }

    console.log('✅ Colores filtrados:', {
      allowedCategories: productType.allowedColorCategories,
      filteredCount: filtered.length,
      originalCount: colors.length,
      filteredColors: filtered.map(c => ({ name: c.displayName, category: c.category })),
    })

    return filtered
  }, [colors, productType])

  // Obtener categorías únicas basadas en los colores disponibles
  const categories = useMemo(() => {
    const cats = Array.from(new Set(availableColors.map(color => color.category)))

    // Ordenar categorías con prioridad específica
    const categoryOrder = ['Madera', 'Sintético', 'Neutros', 'Cálidos', 'Fríos', 'Tierras']
    const sortedCats = cats.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a)
      const indexB = categoryOrder.indexOf(b)
      if (indexA === -1 && indexB === -1) return a.localeCompare(b)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })

    // Para productos sintéticos, solo mostrar la categoría Sintético (sin "Todos")
    if (
      productType?.allowedColorCategories?.includes('Sintético') &&
      productType.allowedColorCategories.length === 1
    ) {
      return ['Sintético']
    }

    // Para productos de madera, solo mostrar la categoría Madera (sin "Todos")
    if (
      productType?.allowedColorCategories?.includes('Madera') &&
      productType.allowedColorCategories.length === 1
    ) {
      return ['Madera']
    }

    return ['all', ...sortedCats]
  }, [availableColors, productType])

  // Inicializar selectedCategory correctamente para productos sintéticos y de madera
  useEffect(() => {
    if (
      productType?.allowedColorCategories?.includes('Sintético') &&
      productType.allowedColorCategories.length === 1
    ) {
      setSelectedCategory('Sintético')
    } else if (
      productType?.allowedColorCategories?.includes('Madera') &&
      productType.allowedColorCategories.length === 1
    ) {
      setSelectedCategory('Madera')
    }
  }, [productType])

  // Filtrar colores
  const filteredColors = useMemo(() => {
    let filtered = availableColors

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(color => color.category === selectedCategory)
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        color =>
          color.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          color.family.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [availableColors, selectedCategory, searchTerm])

  // Colores a mostrar (con límite)
  const displayColors = useMemo(() => {
    if (showAllColors) return filteredColors
    return filteredColors.slice(0, maxDisplayColors)
  }, [filteredColors, showAllColors, maxDisplayColors])

  // Color seleccionado actual
  const currentColor = availableColors.find(color => color.id === selectedColor)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header con título y color seleccionado */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Palette className='w-5 h-5 text-blaze-orange-600' />
          <h4 className='text-sm font-medium text-gray-900'>Color</h4>
        </div>
        {currentColor && showPreview && (
          <div className='flex items-center gap-2'>
            <div
              className='w-6 h-6 rounded-full border-2 border-gray-300'
              style={{ backgroundColor: currentColor.hex }}
            />
            <span className='text-sm font-medium text-gray-700'>{currentColor.displayName}</span>
          </div>
        )}
      </div>

      {/* Filtros por categoría */}
      {showCategories && (
        <div className='flex flex-wrap gap-2'>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'text-xs',
                selectedCategory === category && 'bg-blaze-orange-600 hover:bg-blaze-orange-700'
              )}
            >
              {getCategoryDisplayName(category)}
            </Button>
          ))}
        </div>
      )}

      {/* Grid de colores cuando showCategories=false (modal) */}
      {!showCategories && (
        <div className='space-y-2'>
          <div className='grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2'>
            {availableColors.map(color => (
              <ColorSwatch
                key={`${color.id}-${color.category.toLowerCase()}`}
                color={color}
                isSelected={selectedColor === color.id}
                onClick={() => onColorChange(color.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Colores populares */}
      {showCategories && selectedCategory === 'all' && !searchTerm && (
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='text-xs'>
              Populares
            </Badge>
          </div>
          <div className='grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2'>
            {colors
              .filter(color => {
                // Para productos látex, excluir colores de Madera y Sintético de los populares
                if (
                  productType?.allowedColorCategories?.includes('Látex') &&
                  productType.allowedColorCategories.length === 1
                ) {
                  return (
                    color.isPopular && color.category !== 'Madera' && color.category !== 'Sintético'
                  )
                }
                return color.isPopular
              })
              .map(color => (
                <ColorSwatch
                  key={`${color.id}-${color.category.toLowerCase()}`}
                  color={color}
                  isSelected={selectedColor === color.id}
                  onClick={() => onColorChange(color.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Grid de colores filtrados por categoría */}
      {showCategories && selectedCategory !== 'all' && (
        <div className='space-y-2'>
          <div className='grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2'>
            {filteredColors.map(color => (
              <ColorSwatch
                key={`${color.id}-${color.category.toLowerCase()}`}
                color={color}
                isSelected={selectedColor === color.id}
                onClick={() => onColorChange(color.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Información del color seleccionado */}
      {currentColor && (
        <div className='bg-gray-50 p-4 rounded-lg space-y-2'>
          <div className='flex items-center gap-3'>
            <div
              className='w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm'
              style={{ backgroundColor: currentColor.hex }}
            />
            <div className='flex-1'>
              <h5 className='font-medium text-gray-900'>{currentColor.displayName}</h5>
              <p className='text-sm text-gray-600'>
                {currentColor.family} • {productType?.id === 'pinturas-latex' && currentColor.category === 'Sintético' ? 'Látex' : currentColor.category}
              </p>
            </div>
          </div>
          {currentColor.description && (
            <p className='text-sm text-gray-600 italic'>
              {productType?.id === 'pinturas-latex' && currentColor.description.includes('sintéticos') 
                ? currentColor.description.replace('sintéticos', 'látex')
                : currentColor.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ===================================
// COMPONENTE COLOR SWATCH
// ===================================

interface ColorSwatchProps {
  color: ColorOption
  isSelected: boolean
  onClick: () => void
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, isSelected, onClick }) => {
  // Determinar el tipo de textura (prioridad):
  // 1. textureType explícito del color
  // 2. finish del color (ej: "Brillante", "Metálico")
  // 3. Categoría "Madera" → 'wood'
  // 4. Inferir del nombre del color
  const textureType = useMemo(() => {
    if (color.textureType) return color.textureType
    if (color.finish) {
      const finishTexture = getTextureForFinish(color.finish)
      if (finishTexture !== 'solid') return finishTexture
    }
    // Fallback: inferir por categoría o nombre
    if (color.category === 'Madera') return 'wood'
    return inferTextureFromColorName(color.name)
  }, [color.textureType, color.finish, color.category, color.name])

  // Verificar si es transparente para efecto adicional
  const isTransparent = isTransparentColor(color.name) || color.family === 'Transparentes'

  // Obtener estilos del sistema unificado de texturas
  const textureStyle = useMemo(() => {
    return getTextureStyle(color.hex, textureType)
  }, [color.hex, textureType])

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-md group',
        isSelected
          ? 'border-blaze-orange-500 ring-2 ring-blaze-orange-200 shadow-md'
          : 'border-gray-300 hover:border-gray-400'
      )}
      style={textureStyle}
      title={color.displayName}
      aria-label={`Seleccionar color ${color.displayName}`}
    >
      {isSelected && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <Check
            className='w-4 h-4 text-white drop-shadow-md'
            style={{
              color: color.hex === '#FFFFFF' || color.hex === '#FFFFF0' ? '#000000' : '#FFFFFF',
            }}
          />
        </div>
      )}

      {/* Efecto de brillo adicional para colores transparentes */}
      {isTransparent && (
        <div 
          className='absolute inset-0 rounded-lg pointer-events-none'
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.4) 100%)',
            mixBlendMode: 'overlay',
            opacity: 0.6,
          }}
        />
      )}

      {/* Tooltip con nombre del color */}
      <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'>
        {color.displayName}
      </div>
    </button>
  )
}

export default AdvancedColorPicker
