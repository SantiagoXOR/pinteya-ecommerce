'use client'

import React from 'react'
import { parseMeasure, extractUniqueMeasures, getCommonUnit } from '../utils/measure-utils'
import type { ProductVariant } from '../types'

interface UseProductMeasuresOptions {
  variants?: ProductVariant[]
  title?: string
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
  title
}: UseProductMeasuresOptions): UseProductMeasuresResult => {
  const [selectedMeasure, setSelectedMeasure] = React.useState<string | undefined>(undefined)

  // Extraer medidas únicas del array de variantes
  const uniqueMeasures = React.useMemo(() => {
    if (!variants || variants.length === 0) {
      console.log(`⚠️ [${title}] Sin variantes disponibles para extraer medidas`)
      return []
    }
    
    console.log(`📦 [${title}] Variantes recibidas:`, variants.map(v => ({
      measure: v.measure,
      color_name: v.color_name,
      stock: v.stock
    })))
    
    const result = extractUniqueMeasures(variants)
    
    console.log(`✅ [${title}] Medidas únicas finales:`, result)
    
    return result
  }, [variants, title])

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

