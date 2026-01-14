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
  // SIEMPRE filtrar medidas sin stock disponible, independientemente de selección de color/finish
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
      // Siempre mostrar todas las medidas con stock disponible, sin importar color/finish seleccionado
      const measuresWithStock = allMeasures.filter(measure => {
        // Buscar variantes que coincidan con esta medida
        const matchingVariants = variants.filter(v => v.measure === measure)
        
        if (matchingVariants.length === 0) return false
        
        // Verificar si alguna variante tiene stock (sin filtrar por color/finish)
        // Esto asegura que siempre se muestren todas las medidas disponibles con stock
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

