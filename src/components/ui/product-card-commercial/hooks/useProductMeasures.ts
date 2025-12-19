'use client'

import React from 'react'
import { parseMeasure, extractUniqueMeasures, getCommonUnit } from '../utils/measure-utils'
import type { ProductVariant } from '../types'

interface UseProductMeasuresOptions {
  variants?: ProductVariant[]
  title?: string
  medida?: string // ✅ NUEVO: Medida del producto como fallback
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
 */
export const useProductMeasures = ({
  variants,
  title,
  medida
}: UseProductMeasuresOptions): UseProductMeasuresResult => {
  const [selectedMeasure, setSelectedMeasure] = React.useState<string | undefined>(undefined)

  // Extraer medidas únicas del array de variantes o usar medida del producto como fallback
  const uniqueMeasures = React.useMemo(() => {
    // Si hay variantes, extraer medidas de ellas
    if (variants && variants.length > 0) {
      console.log(`📦 [${title}] Variantes recibidas:`, variants.map(v => ({
        measure: v.measure,
        color_name: v.color_name,
        stock: v.stock
      })))
      
      const result = extractUniqueMeasures(variants)
      console.log(`✅ [${title}] Medidas únicas finales desde variantes:`, result)
      return result
    }
    
    // ✅ NUEVO: Si no hay variantes, usar medida del producto como fallback
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
  }, [variants, title, medida])

  // Extraer la unidad común de todas las medidas
  const commonUnit = React.useMemo(() => {
    return getCommonUnit(uniqueMeasures)
  }, [uniqueMeasures])

  // Establecer medida por defecto al cargar
  React.useEffect(() => {
    if (!selectedMeasure && uniqueMeasures.length > 0) {
      setSelectedMeasure(uniqueMeasures[0])
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

