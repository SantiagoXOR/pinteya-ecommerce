/**
 * Hook unificado de selección de variantes
 * Unifica la lógica de selección de colores, medidas y finishes
 * Coordina la sincronización y calcula la variante activa
 */

'use client'

import React from 'react'
import { getColorHexFromName } from '../utils/color-utils'
import { parseMeasure, getCommonUnit } from '../utils/measure-utils'
import {
  extractUniqueColors,
  extractUniqueMeasuresWithStock,
  extractUniqueFinishes,
  filterFinishesForColor,
  shouldHaveColorSelector,
  isImpregnanteProduct,
  isSinteticoConverluxProduct
} from '../utils/attribute-extractors'
import type { ProductVariant, ColorData } from '../types'

export interface UseProductVariantSelectionOptions {
  variants?: ProductVariant[]
  title?: string
  color?: string
  medida?: string
  productId?: number | string
  price?: number
  originalPrice?: number
}

export interface UseProductVariantSelectionResult {
  // Colores
  uniqueColors: ColorData[]
  selectedColor: string | undefined
  setSelectedColor: React.Dispatch<React.SetStateAction<string | undefined>>
  
  // Medidas
  uniqueMeasures: string[]
  selectedMeasure: string | undefined
  setSelectedMeasure: React.Dispatch<React.SetStateAction<string | undefined>>
  commonUnit: string
  
  // Finishes
  uniqueFinishes: string[]
  selectedFinish: string | null
  setSelectedFinish: (finish: string | null) => void
  availableFinishesForColor: string[]
  
  // Variante activa
  currentVariant: ProductVariant | null
  displayPrice: number | undefined
  displayOriginalPrice: number | undefined
  
  // Utilidades
  parseMeasure: typeof parseMeasure
  isImpregnante: boolean
}

/**
 * Busca variante que coincida con las selecciones
 */
function findMatchingVariant(
  variants: ProductVariant[],
  selectedColor?: string,
  selectedMeasure?: string,
  selectedFinish?: string | null
): ProductVariant | null {
  if (!variants || variants.length === 0) return null

  let matchingVariant: ProductVariant | null = null

  // Estrategia 1: Coincidencia exacta (color + medida + finish)
  if (selectedMeasure && selectedColor) {
    matchingVariant = variants.find(v => {
      const colorMatch = v.color_hex === selectedColor ||
        (v.color_name && getColorHexFromName(v.color_name) === selectedColor)
      const measureMatch = v.measure === selectedMeasure
      let finishMatch = true

      if (selectedFinish) {
        const variantFinish = (v.finish || '').toString().trim().toLowerCase()
        const selectedFinishNormalized = selectedFinish.toString().trim().toLowerCase()
        finishMatch = variantFinish === selectedFinishNormalized
      }

      return colorMatch && measureMatch && finishMatch
    }) || null

    // Fallback: sin finish si no se encuentra
    if (!matchingVariant && !selectedFinish) {
      matchingVariant = variants.find(v => {
        const colorMatch = v.color_hex === selectedColor ||
          (v.color_name && getColorHexFromName(v.color_name) === selectedColor)
        const measureMatch = v.measure === selectedMeasure
        return colorMatch && measureMatch
      }) || null
    }
  }

  // Estrategia 2: Solo por medida + finish
  if (!matchingVariant && selectedMeasure && selectedFinish) {
    matchingVariant = variants.find(v => {
      const measureMatch = v.measure === selectedMeasure
      const variantFinish = (v.finish || '').toString().trim().toLowerCase()
      const selectedFinishNormalized = selectedFinish.toString().trim().toLowerCase()
      return measureMatch && variantFinish === selectedFinishNormalized
    }) || null
  }

  // Estrategia 3: Solo por medida
  if (!matchingVariant && selectedMeasure) {
    matchingVariant = variants.find(v => v.measure === selectedMeasure) || null
  }

  // Estrategia 4: Solo por color + finish
  if (!matchingVariant && selectedColor && selectedFinish) {
    matchingVariant = variants.find(v => {
      const colorMatch = v.color_hex === selectedColor ||
        (v.color_name && getColorHexFromName(v.color_name) === selectedColor)
      const variantFinish = (v.finish || '').toString().trim().toLowerCase()
      const selectedFinishNormalized = selectedFinish.toString().trim().toLowerCase()
      return colorMatch && variantFinish === selectedFinishNormalized
    }) || null
  }

  // Estrategia 5: Solo por color
  if (!matchingVariant && selectedColor && !selectedFinish) {
    matchingVariant = variants.find(v =>
      v.color_hex === selectedColor || (v.color_name && getColorHexFromName(v.color_name) === selectedColor)
    ) || null
  }

  // Estrategia 6: Fallback a primera variante
  if (!matchingVariant && variants.length > 0 && !selectedFinish) {
    matchingVariant = variants[0]
  }

  return matchingVariant
}

/**
 * Hook unificado de selección de variantes
 */
export function useProductVariantSelection({
  variants,
  title,
  color,
  medida,
  productId,
  price,
  originalPrice
}: UseProductVariantSelectionOptions): UseProductVariantSelectionResult {
  // Estados de selección
  const [selectedColor, setSelectedColor] = React.useState<string | undefined>(undefined)
  const [selectedMeasure, setSelectedMeasure] = React.useState<string | undefined>(undefined)
  const [selectedFinish, setSelectedFinish] = React.useState<string | null>(null)

  // Detectar tipo de producto
  const isImpregnante = React.useMemo(
    () => isImpregnanteProduct(title, productId),
    [title, productId]
  )

  const isSinteticoConverlux = React.useMemo(
    () => isSinteticoConverluxProduct(title, productId),
    [title, productId]
  )

  // Extraer colores únicos
  const uniqueColors = React.useMemo(() => {
    // Filtrar productos que no deberían tener selector de color
    if (!shouldHaveColorSelector(title)) {
      return []
    }

    return extractUniqueColors(variants, color, { title })
  }, [variants, color, title])

  // Extraer medidas únicas
  const uniqueMeasures = React.useMemo(() => {
    return extractUniqueMeasuresWithStock(variants, medida)
  }, [variants, medida])

  // Extraer finishes únicos
  const allUniqueFinishes = React.useMemo(() => {
    return extractUniqueFinishes(variants)
  }, [variants])

  // Filtrar finishes disponibles según color seleccionado
  const availableFinishesForColor = React.useMemo(() => {
    return filterFinishesForColor(variants, selectedColor, allUniqueFinishes, {
      isImpregnante,
      isSinteticoConverlux,
      productName: title
    })
  }, [variants, selectedColor, allUniqueFinishes, isImpregnante, isSinteticoConverlux, title])

  // Unidad común de medidas
  const commonUnit = React.useMemo(() => {
    return getCommonUnit(uniqueMeasures)
  }, [uniqueMeasures])

  // Establecer color por defecto
  React.useEffect(() => {
    if (!selectedColor && uniqueColors.length > 0 && uniqueColors[0]) {
      setSelectedColor(uniqueColors[0].hex)
    }
  }, [selectedColor, uniqueColors])

  // Sincronizar finish cuando cambia el color
  React.useEffect(() => {
    if (availableFinishesForColor.length > 0) {
      if (!selectedFinish || !availableFinishesForColor.includes(selectedFinish)) {
        setSelectedFinish(availableFinishesForColor[0])
      }
    } else {
      setSelectedFinish(null)
    }
  }, [availableFinishesForColor, selectedFinish])

  // Establecer medida por defecto
  React.useEffect(() => {
    if (uniqueMeasures.length > 0) {
      if (!selectedMeasure || !uniqueMeasures.includes(selectedMeasure)) {
        setSelectedMeasure(uniqueMeasures[0])
      }
    } else if (selectedMeasure) {
      setSelectedMeasure(undefined)
    }
  }, [selectedMeasure, uniqueMeasures])

  // Calcular variante activa
  const currentVariant = React.useMemo(() => {
    if (!variants || variants.length === 0) return null
    return findMatchingVariant(variants, selectedColor, selectedMeasure, selectedFinish)
  }, [variants, selectedColor, selectedMeasure, selectedFinish])

  // Precio dinámico basado en la variante seleccionada
  const displayPrice = React.useMemo(() => {
    if (currentVariant) {
      return currentVariant.price_sale || currentVariant.price_list || price
    }
    return price
  }, [currentVariant, price])

  // Precio original para mostrar tachado
  const displayOriginalPrice = React.useMemo(() => {
    if (currentVariant && currentVariant.price_sale && currentVariant.price_list) {
      return currentVariant.price_list
    }
    return originalPrice
  }, [currentVariant, originalPrice])

  return {
    // Colores
    uniqueColors,
    selectedColor,
    setSelectedColor,
    
    // Medidas
    uniqueMeasures,
    selectedMeasure,
    setSelectedMeasure,
    commonUnit,
    
    // Finishes
    uniqueFinishes: allUniqueFinishes,
    selectedFinish,
    setSelectedFinish,
    availableFinishesForColor,
    
    // Variante activa
    currentVariant,
    displayPrice,
    displayOriginalPrice,
    
    // Utilidades
    parseMeasure,
    isImpregnante
  }
}
