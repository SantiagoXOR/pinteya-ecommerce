'use client'

import React from 'react'
import { parseMeasure, extractUniqueMeasures, getCommonUnit } from '../utils/measure-utils'
import { getColorHexFromName } from '../utils/color-utils'
import type { ProductVariant } from '../types'

interface UseProductMeasuresOptions {
  variants?: ProductVariant[]
  title?: string
  medida?: string // ✅ NUEVO: Medida del producto como fallback
  selectedColor?: string // Color seleccionado para filtrar medidas con stock
  selectedFinish?: string | null // Finish seleccionado para filtrar medidas con stock
}

interface UseProductMeasuresResult {
  uniqueMeasures: string[]
  selectedMeasure: string | undefined
  setSelectedMeasure: React.Dispatch<React.SetStateAction<string | undefined>>
  commonUnit: string
  parseMeasure: typeof parseMeasure
}

/**
 * Hook para manejar medidas del producto
 * Extrae medidas únicas de las variantes y maneja la selección
 * Filtra medidas sin stock disponible
 */
export const useProductMeasures = ({
  variants,
  title,
  medida,
  selectedColor,
  selectedFinish
}: UseProductMeasuresOptions): UseProductMeasuresResult => {
  const [selectedMeasure, setSelectedMeasure] = React.useState<string | undefined>(undefined)

  // Extraer medidas únicas del array de variantes o usar medida del producto como fallback
  // FILTRAR medidas que no tienen stock disponible
  const uniqueMeasures = React.useMemo(() => {
    // Si hay variantes, extraer medidas de ellas
    if (variants && variants.length > 0) {
      console.log(`📦 [${title}] Variantes recibidas:`, variants.map(v => ({
        measure: v.measure,
        color_name: v.color_name,
        stock: v.stock
      })))
      
      // Extraer todas las medidas únicas primero
      const allMeasures = extractUniqueMeasures(variants)
      
      // Filtrar medidas que tienen al menos una variante con stock > 0
      // Considerar color y finish seleccionados si están disponibles
      const measuresWithStock = allMeasures.filter(measure => {
        // Buscar variantes que coincidan con esta medida
        const matchingVariants = variants.filter(v => v.measure === measure)
        
        if (matchingVariants.length === 0) return false
        
        // Si hay color seleccionado, filtrar por color
        if (selectedColor) {
          const colorVariants = matchingVariants.filter(v => 
            v.color_hex === selectedColor || 
            getColorHexFromName(v.color_name || '') === selectedColor
          )
          
          if (colorVariants.length === 0) return false
          
          // Si hay finish seleccionado, filtrar también por finish
          if (selectedFinish) {
            const finishVariants = colorVariants.filter(v => {
              const variantFinish = (v.finish || '').toString().trim().toLowerCase()
              const selectedFinishNormalized = selectedFinish.toString().trim().toLowerCase()
              return variantFinish === selectedFinishNormalized
            })
            
            if (finishVariants.length === 0) return false
            
            // Verificar si alguna variante con color y finish tiene stock
            return finishVariants.some(v => (v.stock ?? 0) > 0)
          }
          
          // Verificar si alguna variante con color tiene stock
          return colorVariants.some(v => (v.stock ?? 0) > 0)
        }
        
        // Si hay finish seleccionado pero no color, filtrar por finish
        if (selectedFinish) {
          const finishVariants = matchingVariants.filter(v => {
            const variantFinish = (v.finish || '').toString().trim().toLowerCase()
            const selectedFinishNormalized = selectedFinish.toString().trim().toLowerCase()
            return variantFinish === selectedFinishNormalized
          })
          
          if (finishVariants.length === 0) return false
          
          // Verificar si alguna variante con finish tiene stock
          return finishVariants.some(v => (v.stock ?? 0) > 0)
        }
        
        // Sin filtros de color/finish: verificar si alguna variante tiene stock
        return matchingVariants.some(v => (v.stock ?? 0) > 0)
      })
      
      console.log(`✅ [${title}] Medidas únicas con stock disponible:`, measuresWithStock)
      return measuresWithStock
    }
    
    // ✅ NUEVO: Si no hay variantes, usar medida del producto como fallback
    // Solo si tiene stock (si hay variantes, ya se filtró arriba)
    if (medida && medida.trim()) {
      // Limpiar medida si viene como string de array
      let cleanMedida = medida.trim()
      if (cleanMedida.startsWith('[') && cleanMedida.endsWith(']')) {
        try {
          const parsed = JSON.parse(cleanMedida)
          cleanMedida = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : medida
        } catch {
          // Si falla el parse, usar la medida original
        }
      }
      
      console.log(`✅ [${title}] Usando medida del producto como fallback:`, cleanMedida)
      return [cleanMedida]
    }
    
    console.log(`⚠️ [${title}] Sin variantes ni medida del producto disponible`)
    return []
  }, [variants, title, medida, selectedColor, selectedFinish])

  // Extraer la unidad común de todas las medidas
  const commonUnit = React.useMemo(() => {
    return getCommonUnit(uniqueMeasures)
  }, [uniqueMeasures])

  // Establecer medida por defecto al cargar
  // Si la medida seleccionada ya no está disponible (sin stock), cambiar a la primera disponible
  React.useEffect(() => {
    if (uniqueMeasures.length > 0) {
      if (!selectedMeasure || !uniqueMeasures.includes(selectedMeasure)) {
        setSelectedMeasure(uniqueMeasures[0])
      }
    } else if (selectedMeasure) {
      // Si no hay medidas disponibles, limpiar la selección
      setSelectedMeasure(undefined)
    }
  }, [selectedMeasure, uniqueMeasures])

  return {
    uniqueMeasures,
    selectedMeasure,
    setSelectedMeasure,
    commonUnit,
    parseMeasure
  }
}

