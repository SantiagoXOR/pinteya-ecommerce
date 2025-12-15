'use client'

import React from 'react'
import { PAINT_COLORS } from '@/components/ui/advanced-color-picker'
import { getColorHexFromName } from '../utils/color-utils'
import type { ProductVariant, ColorData } from '../types'

interface UseProductColorsOptions {
  variants?: ProductVariant[]
  title?: string
}

interface UseProductColorsResult {
  uniqueColors: ColorData[]
  selectedColor: string | undefined
  setSelectedColor: React.Dispatch<React.SetStateAction<string | undefined>>
}

/**
 * Hook para manejar colores del producto
 * Extrae colores únicos de las variantes y maneja la selección
 */
export const useProductColors = ({
  variants,
  title
}: UseProductColorsOptions): UseProductColorsResult => {
  const [selectedColor, setSelectedColor] = React.useState<string | undefined>(undefined)

  // Extraer colores únicos del array de variantes para el selector
  const uniqueColors = React.useMemo(() => {
    const colorsMap = new Map<string, ColorData>()
    
    if (!variants || variants.length === 0) {
      console.log(`⚠️ [${title}] Sin variantes para extraer colores`)
      return []
    }
    
    // Agrupar variantes por color_name y priorizar color_hex cuando esté disponible
    const colorGroups = new Map<string, ColorData>()
    
    variants.forEach(v => {
      if (v.color_name && v.color_name.trim() !== '') {
        const colorName = v.color_name.trim()
        const colorKey = colorName.toLowerCase()
        
        // Si ya existe este color, verificar si podemos mejorar el hex
        if (!colorGroups.has(colorKey)) {
          let finalHex: string
          
          // Prioridad 1: usar color_hex de la variante si está disponible y es válido
          if (v.color_hex && v.color_hex.trim() !== '' && v.color_hex !== '#000000' && v.color_hex !== '#FFFFFF') {
            finalHex = v.color_hex.trim()
          } else {
            // Prioridad 2: buscar en PAINT_COLORS
            const existingColor = PAINT_COLORS.find(c => 
              c.name.toLowerCase() === colorName.toLowerCase() ||
              c.displayName.toLowerCase() === colorName.toLowerCase() ||
              c.id.toLowerCase() === colorName.toLowerCase()
            )
            
            if (existingColor) {
              finalHex = existingColor.hex
            } else {
              // Prioridad 3: usar el helper mejorado para convertir nombre a hex
              finalHex = getColorHexFromName(colorName)
            }
          }
          
          colorGroups.set(colorKey, { name: colorName, hex: finalHex })
        }
      }
    })
    
    // Convertir el Map a Array
    Array.from(colorGroups.values()).forEach(colorData => {
      colorsMap.set(colorData.hex, colorData)
    })
    
    const result = Array.from(colorsMap.values())
    console.log(`🎨 [${title}] Colores únicos extraídos:`, result)
    
    // NO agregar color por defecto para productos que no deberían tener color
    // (pinceles, lijas, cintas, masillas, rodillos, etc.)
    const productNameLower = (title || '').toLowerCase()
    const shouldNotHaveColor = 
      productNameLower.includes('pincel') ||
      productNameLower.includes('brocha') ||
      productNameLower.includes('rodillo') ||
      productNameLower.includes('lija') ||
      productNameLower.includes('cinta') ||
      productNameLower.includes('papel') ||
      productNameLower.includes('poximix') ||
      productNameLower.includes('masilla') ||
      productNameLower.includes('enduido')
    
    if (shouldNotHaveColor) {
      console.log(`🚫 [${title}] Producto sin selector de color`)
      return []
    }
    
    // Si no hay colores pero sí hay medidas, agregar "Incoloro" por defecto para otros productos
    if (result.length === 0 && variants.some(v => v.measure)) {
      console.log(`➕ [${title}] Agregando color "Incoloro" por defecto`)
      return [{ name: 'Incoloro', hex: 'rgba(245, 245, 245, 0.85)' }]
    }
    
    return result
  }, [variants, title])

  // Establecer color por defecto al cargar
  React.useEffect(() => {
    if (!selectedColor && uniqueColors.length > 0 && uniqueColors[0]) {
      setSelectedColor(uniqueColors[0].hex)
    }
  }, [selectedColor, uniqueColors])

  return {
    uniqueColors,
    selectedColor,
    setSelectedColor
  }
}

