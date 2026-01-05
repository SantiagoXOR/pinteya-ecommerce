'use client'

import React from 'react'
import { getColorHexFromName } from '../utils/color-utils'
import type { ProductVariant } from '../types'

interface UseProductVariantsOptions {
  variants?: ProductVariant[]
  selectedColor?: string
  selectedMeasure?: string
  selectedFinish?: string | null
  price?: number
  originalPrice?: number
}

interface UseProductVariantsResult {
  currentVariant: ProductVariant | null
  displayPrice: number | undefined
  displayOriginalPrice: number | undefined
}

/**
 * Hook para manejar la variante actual del producto
 * Sincroniza precio con la variante seleccionada
 */
export const useProductVariants = ({
  variants,
  selectedColor,
  selectedMeasure,
  selectedFinish,
  price,
  originalPrice
}: UseProductVariantsOptions): UseProductVariantsResult => {
  // Sincronizar precio con variante seleccionada
  const currentVariant = React.useMemo(() => {
    if (!variants || variants.length === 0) return null
    
    // LOG: Mostrar todas las variantes disponibles
    console.log('📦 Variantes disponibles:', variants.map(v => ({
      measure: v.measure,
      color_name: v.color_name,
      color_hex: v.color_hex,
      price_sale: v.price_sale,
      price_list: v.price_list
    })))
    
    console.log('🎯 Buscando variante para:', { selectedMeasure, selectedColor, selectedFinish })
    
    // Buscar variante que coincida con color y medida seleccionados
    // Estrategia de búsqueda flexible:
    
    let matchingVariant = null
    
    // Estrategia 1: Coincidencia exacta (color + medida + finish)
    if (selectedMeasure && selectedColor) {
      matchingVariant = variants.find(v => {
        const colorMatch = v.color_hex === selectedColor || getColorHexFromName(v.color_name || '') === selectedColor
        const measureMatch = v.measure === selectedMeasure
        // Comparación de finish normalizada (case-insensitive, trim)
        let finishMatch = true
        if (selectedFinish) {
          const variantFinish = (v.finish || '').toString().trim().toLowerCase()
          const selectedFinishNormalized = selectedFinish.toString().trim().toLowerCase()
          finishMatch = variantFinish === selectedFinishNormalized
        }
        return colorMatch && measureMatch && finishMatch
      })
      console.log('🔍 Estrategia 1 (exacta con finish):', matchingVariant ? 'Encontrada' : 'No encontrada', { 
        selectedFinish,
        matchingVariantFinish: matchingVariant?.finish,
        matchingVariantPrice: matchingVariant?.price_sale || matchingVariant?.price_list
      })
      
      // Si no se encuentra con finish, buscar sin finish (fallback solo si no hay finish seleccionado)
      if (!matchingVariant && selectedMeasure && selectedColor && !selectedFinish) {
        matchingVariant = variants.find(v => {
          const colorMatch = v.color_hex === selectedColor || getColorHexFromName(v.color_name || '') === selectedColor
          const measureMatch = v.measure === selectedMeasure
          return colorMatch && measureMatch
        })
        console.log('🔍 Estrategia 1 (fallback sin finish):', matchingVariant ? 'Encontrada' : 'No encontrada')
      }
    }
    
    // Estrategia 2: Solo por medida + finish (si hay finish seleccionado, no usar fallbacks que lo ignoren)
    if (!matchingVariant && selectedMeasure && selectedFinish) {
      matchingVariant = variants.find(v => {
        const measureMatch = v.measure === selectedMeasure
        const variantFinish = (v.finish || '').toString().trim().toLowerCase()
        const selectedFinishNormalized = selectedFinish.toString().trim().toLowerCase()
        const finishMatch = variantFinish === selectedFinishNormalized
        return measureMatch && finishMatch
      })
      console.log('🔍 Estrategia 2 (medida + finish):', matchingVariant ? 'Encontrada' : 'No encontrada', {
        selectedFinish,
        matchingVariantFinish: matchingVariant?.finish,
        matchingVariantColor: matchingVariant?.color_name
      })
    }
    
    // Estrategia 2b: Solo por medida (sin finish, solo si no hay finish seleccionado)
    if (!matchingVariant && selectedMeasure && !selectedFinish) {
      matchingVariant = variants.find(v => v.measure === selectedMeasure)
      console.log('🔍 Estrategia 2b (por medida sin finish):', matchingVariant ? 'Encontrada' : 'No encontrada')
    }
    
    // Estrategia 3: Solo por color + finish (si hay finish seleccionado)
    if (!matchingVariant && selectedColor && selectedFinish) {
      matchingVariant = variants.find(v => {
        const colorMatch = v.color_hex === selectedColor || getColorHexFromName(v.color_name || '') === selectedColor
        const variantFinish = (v.finish || '').toString().trim().toLowerCase()
        const selectedFinishNormalized = selectedFinish.toString().trim().toLowerCase()
        const finishMatch = variantFinish === selectedFinishNormalized
        return colorMatch && finishMatch
      })
      console.log('🔍 Estrategia 3 (color + finish):', matchingVariant ? 'Encontrada' : 'No encontrada', {
        selectedFinish,
        matchingVariantFinish: matchingVariant?.finish,
        matchingVariantColor: matchingVariant?.color_name
      })
    }
    
    // Estrategia 3b: Solo por color (sin finish, solo si no hay finish seleccionado)
    if (!matchingVariant && selectedColor && !selectedFinish) {
      matchingVariant = variants.find(v => 
        v.color_hex === selectedColor || getColorHexFromName(v.color_name || '') === selectedColor
      )
      console.log('🔍 Estrategia 3b (por color sin finish):', matchingVariant ? 'Encontrada' : 'No encontrada')
    }
    
    // Estrategia 4: Fallback a primera variante (solo si no hay finish seleccionado)
    if (!matchingVariant && variants.length > 0 && !selectedFinish) {
      matchingVariant = variants[0]
      console.log('🔍 Estrategia 4 (fallback a primera sin finish)')
    }
    
    console.log('✅ Variante seleccionada:', {
      measure: matchingVariant?.measure,
      color: matchingVariant?.color_name,
      price_sale: matchingVariant?.price_sale,
      price_list: matchingVariant?.price_list
    })
    
    return matchingVariant || null
  }, [variants, selectedColor, selectedMeasure, selectedFinish])

  // Precio dinámico basado en la variante seleccionada
  const displayPrice = React.useMemo(() => {
    console.log('💰 [displayPrice] Calculando precio:', {
      currentVariant,
      selectedColor,
      selectedMeasure,
      selectedFinish,
      variantFinish: currentVariant?.finish,
      variantPriceSale: currentVariant?.price_sale,
      variantPriceList: currentVariant?.price_list,
      variants: variants?.length,
      price
    })
    
    if (currentVariant) {
      // Priorizar price_sale sobre price_list
      const variantPrice = currentVariant.price_sale || currentVariant.price_list || price
      console.log('💰 Usando precio de variante:', variantPrice, 'para finish:', currentVariant.finish)
      return variantPrice
    }
    
    console.log('💰 Usando precio base:', price)
    return price
  }, [currentVariant, price, selectedColor, selectedMeasure, selectedFinish, variants])

  // Precio original para mostrar tachado (si hay descuento)
  const displayOriginalPrice = React.useMemo(() => {
    if (currentVariant && currentVariant.price_sale && currentVariant.price_list) {
      return currentVariant.price_list
    }
    return originalPrice
  }, [currentVariant, originalPrice])

  return {
    currentVariant,
    displayPrice,
    displayOriginalPrice
  }
}

