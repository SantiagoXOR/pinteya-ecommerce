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
import { useDesignSystemConfig } from '@/lib/design-system-config'

export interface UseProductVariantSelectionOptions {
  variants?: ProductVariant[]
  title?: string
  color?: string
  medida?: string
  productId?: number | string
  price?: number
  originalPrice?: number
  /** Si true (default en grid/búsqueda), pre-selecciona la variante de menor precio */
  preferLowestPrice?: boolean
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
function findLowestPriceVariant(variants: ProductVariant[]): ProductVariant | null {
  if (!variants || variants.length === 0) return null
  const withStock = variants.filter(v => (v.stock ?? 0) > 0)
  const pool = withStock.length > 0 ? withStock : variants
  let best = pool[0]!
  const priceOf = (v: ProductVariant) => (typeof v.price_sale === 'number' && v.price_sale > 0 ? v.price_sale : v.price_list) ?? Infinity
  for (const v of pool.slice(1)) {
    if (priceOf(v) < priceOf(best)) best = v
  }
  return best
}

export function useProductVariantSelection({
  variants,
  title,
  color,
  medida,
  productId,
  price,
  originalPrice,
  preferLowestPrice = true
}: UseProductVariantSelectionOptions): UseProductVariantSelectionResult {
  const config = useDesignSystemConfig()
  const freeShippingThreshold = config.ecommerce.shippingInfo.freeShippingThreshold

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

  // Extraer medidas únicas y ordenarlas: preferLowestPrice = por precio ascendente, sino envío gratis primero
  const uniqueMeasures = React.useMemo(() => {
    const measures = extractUniqueMeasuresWithStock(variants, medida)
    
    if (measures.length > 0 && variants && variants.length > 0) {
      const measurePrices = measures.map(measure => {
        const measureVariants = variants.filter(v => v.measure === measure && (v.stock ?? 0) > 0)
        if (measureVariants.length === 0) return { measure, price: Infinity, hasFreeShipping: false }
        const prices = measureVariants.map(v => v.price_sale || v.price_list || Infinity)
        const minPrice = Math.min(...prices.filter(p => p !== Infinity))
        return {
          measure,
          price: minPrice !== Infinity ? minPrice : Infinity,
          hasFreeShipping: minPrice !== Infinity && minPrice >= freeShippingThreshold
        }
      })
      if (preferLowestPrice) {
        return measurePrices.sort((a, b) => a.price - b.price).map(m => m.measure)
      }
      return measurePrices.sort((a, b) => (a.hasFreeShipping === b.hasFreeShipping ? 0 : a.hasFreeShipping ? -1 : 1)).map(m => m.measure)
    }
    return measures
  }, [variants, medida, preferLowestPrice, freeShippingThreshold])

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
    if (!selectedColor && uniqueColors.length > 0) {
      const defaultHex = preferLowestPrice && variants?.length
        ? (() => {
            const low = findLowestPriceVariant(variants)
            if (!low) return uniqueColors[0]!.hex
            const hex = low.color_hex || (low.color_name ? getColorHexFromName(low.color_name) : null)
            return hex && uniqueColors.some(c => c.hex === hex) ? hex : uniqueColors[0]!.hex
          })()
        : uniqueColors[0]!.hex
      setSelectedColor(defaultHex)
    }
  }, [selectedColor, uniqueColors, preferLowestPrice, variants])

  // Sincronizar finish cuando cambia el color
  React.useEffect(() => {
    if (availableFinishesForColor.length > 0) {
      if (!selectedFinish || !availableFinishesForColor.includes(selectedFinish)) {
        const defaultFinish = preferLowestPrice && variants?.length
          ? (() => {
              const low = findLowestPriceVariant(variants)
              const f = (low?.finish || '').toString().trim()
              return f && availableFinishesForColor.includes(f) ? f : availableFinishesForColor[0]
            })()
          : availableFinishesForColor[0]
        setSelectedFinish(defaultFinish)
      }
    } else {
      setSelectedFinish(null)
    }
  }, [availableFinishesForColor, selectedFinish, preferLowestPrice, variants])

  // Establecer medida por defecto - preferLowestPrice: menor precio; sino: primera con envío gratis
  React.useEffect(() => {
    if (uniqueMeasures.length > 0) {
      if (!selectedMeasure || !uniqueMeasures.includes(selectedMeasure)) {
        let defaultMeasure = uniqueMeasures[0]!
        if (preferLowestPrice && variants?.length) {
          const low = findLowestPriceVariant(variants)
          if (low?.measure && uniqueMeasures.includes(low.measure)) defaultMeasure = low.measure
        } else if (variants?.length) {
          for (const measure of uniqueMeasures) {
            const measureVariants = variants.filter(v => v.measure === measure && (v.stock ?? 0) > 0)
            if (measureVariants.length > 0) {
              const prices = measureVariants.map(v => v.price_sale || v.price_list || Infinity)
              const minPrice = Math.min(...prices.filter(p => p !== Infinity))
              if (minPrice !== Infinity && minPrice >= freeShippingThreshold) {
                defaultMeasure = measure
                break
              }
            }
          }
        }
        setSelectedMeasure(defaultMeasure)
      }
    } else if (selectedMeasure) {
      setSelectedMeasure(undefined)
    }
  }, [selectedMeasure, uniqueMeasures, variants, preferLowestPrice, freeShippingThreshold])

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
