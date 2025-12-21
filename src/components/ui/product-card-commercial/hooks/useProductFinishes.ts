'use client'

import React from 'react'
import { getColorHexFromName } from '../utils/color-utils'
import type { ProductVariant } from '../types'

interface UseProductFinishesOptions {
  variants?: ProductVariant[]
  selectedColor?: string
  productId?: number | string
  productName?: string
}

interface UseProductFinishesResult {
  uniqueFinishes: string[]
  selectedFinish: string | null
  setSelectedFinish: (finish: string | null) => void
  availableFinishesForColor: string[]
}

/**
 * Hook para manejar finishes (terminaciones) del producto
 * Filtra finishes disponibles según el color seleccionado
 * Para Sintético Converlux: solo BLANCO y NEGRO tienen múltiples finishes
 */
export const useProductFinishes = ({
  variants,
  selectedColor,
  productId,
  productName,
}: UseProductFinishesOptions): UseProductFinishesResult => {
  const [selectedFinish, setSelectedFinish] = React.useState<string | null>(null)

  // Detectar si es Sintético Converlux (ID 34 o nombre contiene "Sintético Converlux")
  const isSinteticoConverlux = React.useMemo(() => {
    if (productId === 34 || productId === '34') return true
    if (productName && productName.toLowerCase().includes('sintético converlux')) return true
    return false
  }, [productId, productName])

  // Obtener todos los finishes únicos de las variantes
  const allUniqueFinishes = React.useMemo(() => {
    if (!variants || variants.length === 0) return []
    
    const finishes = variants
      .map(v => v.finish)
      .filter((finish): finish is string => Boolean(finish))
    
    return Array.from(new Set(finishes))
  }, [variants])

  // Filtrar finishes disponibles según el color seleccionado
  // NOTA: Esto devuelve los finishes disponibles para el color, pero el selector mostrará TODOS los finishes
  // y deshabilitará los no disponibles
  const availableFinishesForColor = React.useMemo(() => {
    if (!variants || variants.length === 0) return []
    if (!selectedColor) return allUniqueFinishes

    // Para Sintético Converlux: solo BLANCO y NEGRO tienen múltiples finishes
    if (isSinteticoConverlux) {
      // Buscar el nombre del color seleccionado
      const selectedColorName = variants.find(v => {
        const variantColorHex = v.color_hex || getColorHexFromName(v.color_name || '')
        return variantColorHex === selectedColor
      })?.color_name

      // Si el color es BLANCO o NEGRO, mostrar todos sus finishes disponibles
      // Para otros colores, solo "Brillante" está disponible
      if (selectedColorName && (selectedColorName.toUpperCase() === 'BLANCO' || selectedColorName.toUpperCase() === 'NEGRO')) {
        // Filtrar finishes solo de variantes con ese color
        const finishesForColor = variants
          .filter(v => {
            const variantColorHex = v.color_hex || getColorHexFromName(v.color_name || '')
            return variantColorHex === selectedColor
          })
          .map(v => v.finish)
          .filter((finish): finish is string => Boolean(finish))
        
        return Array.from(new Set(finishesForColor))
      } else {
        // Para otros colores, solo "Brillante" está disponible
        return ['Brillante']
      }
    }

    // Para otros productos, filtrar finishes disponibles para el color seleccionado
    const finishesForColor = variants
      .filter(v => {
        const variantColorHex = v.color_hex || getColorHexFromName(v.color_name || '')
        return variantColorHex === selectedColor
      })
      .map(v => v.finish)
      .filter((finish): finish is string => Boolean(finish))

    return Array.from(new Set(finishesForColor))
  }, [variants, selectedColor, allUniqueFinishes, isSinteticoConverlux])

  // Seleccionar finish automáticamente cuando cambia el color
  React.useEffect(() => {
    if (availableFinishesForColor.length > 0) {
      // Si el finish seleccionado no está disponible para el nuevo color, seleccionar el primero disponible
      if (!selectedFinish || !availableFinishesForColor.includes(selectedFinish)) {
        setSelectedFinish(availableFinishesForColor[0])
      }
    } else {
      setSelectedFinish(null)
    }
  }, [availableFinishesForColor, selectedFinish])

  return {
    uniqueFinishes: allUniqueFinishes,
    selectedFinish,
    setSelectedFinish,
    availableFinishesForColor,
  }
}
