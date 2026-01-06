/**
 * Utilidades para manejo de precios en ShopDetailModal
 */

import { ProductVariant } from '@/lib/api/product-variants'
import { RelatedProduct } from '@/lib/api/related-products'
import { getEffectivePrice } from '@/lib/api/product-variants'
import React from 'react'
import { formatCurrency } from '@/lib/utils/consolidated-utils'

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  brand: string
  stock: number
  description?: string
  colors?: any[]
  capacities?: string[]
  slug?: string
}

/**
 * Calcula el precio efectivo basado en variante, producto relacionado o producto base
 */
export const calculateEffectivePrice = (
  variant: ProductVariant | null,
  relatedProduct: RelatedProduct | null,
  product: Product | null,
  fullProductData?: any,
  selectedWidth?: string,
  widthToPriceMap?: Record<string, { price: string; discounted_price?: string }>,
  productType?: { hasWidthSelector: boolean },
  calculateDynamicPrice?: () => number
): number => {
  // Prioridad 1: Si hay una variante seleccionada, usar su precio
  if (variant) {
    return getEffectivePrice(variant)
  }

  // Prioridad 2: Para productos con selector de ancho, usar mapeo de precios
  if (selectedWidth && productType?.hasWidthSelector && widthToPriceMap) {
    const extractWidthFromMeasure = (measure: string) => {
      if (measure.includes(' x ')) {
        return measure.split(' x ')[0]
      }
      return measure
    }
    const widthKey = extractWidthFromMeasure(selectedWidth)
    if (widthToPriceMap[widthKey]) {
      const priceData = widthToPriceMap[widthKey]
      return parseFloat(priceData.discounted_price || priceData.price)
    }
  }

  // Prioridad 3: Producto relacionado seleccionado
  if (relatedProduct) {
    return parseFloat(relatedProduct.discounted_price || relatedProduct.price)
  }

  // Prioridad 4: Usar calculateDynamicPrice si está disponible
  if (calculateDynamicPrice) {
    return calculateDynamicPrice()
  }

  // Fallback: usar el precio de la card como fuente de verdad
  const candidate = product?.price ?? fullProductData?.discounted_price ?? fullProductData?.price
  const n = typeof candidate === 'number' ? candidate : parseFloat(String(candidate))
  return Number.isFinite(n) ? n : 0
}

/**
 * Calcula el precio original para mostrar descuentos
 */
export const calculateOriginalPrice = (
  variant: ProductVariant | null,
  relatedProduct: RelatedProduct | null,
  product: Product | null,
  selectedWidth?: string,
  widthToPriceMap?: Record<string, { price: string; discounted_price?: string }>,
  productType?: { hasWidthSelector: boolean }
): number | undefined => {
  if (variant) {
    // Precio de lista de la variante
    return variant.price_list
  }

  if (relatedProduct) {
    return parseFloat(relatedProduct.price)
  }

  if (selectedWidth && productType?.hasWidthSelector && widthToPriceMap) {
    const extractWidthFromMeasure = (measure: string) => {
      if (measure.includes(' x ')) {
        return measure.split(' x ')[0]
      }
      return measure
    }
    const widthKey = extractWidthFromMeasure(selectedWidth)
    if (widthToPriceMap[widthKey]) {
      return parseFloat(widthToPriceMap[widthKey].price)
    }
  }

  // Fallback: usar originalPrice de la card si existe
  return product?.originalPrice || product?.price
}

/**
 * Verifica si hay descuento
 */
export const hasDiscount = (
  originalPrice: number | undefined,
  currentPrice: number
): boolean => {
  if (!originalPrice) return false
  return originalPrice > currentPrice
}

/**
 * Formatea un precio con decimales en superíndice (formato ARS)
 * Usa la función centralizada formatCurrency para consistencia
 */
export const formatPrice = (value: number): React.ReactNode => {
  // Usar función centralizada y luego separar decimales para superíndice
  const formatted = formatCurrency(value)
  const commaIndex = formatted.lastIndexOf(',')
  if (commaIndex === -1) {
    // Si no hay decimales, devolver tal cual (ya incluye el símbolo $)
    return formatted
  }
  const integerWithSep = formatted.slice(0, commaIndex + 1)
  const decimals = formatted.slice(commaIndex + 1)
  return (
    <span>
      {integerWithSep}
      <span className='align-super text-xs'>{decimals}</span>
    </span>
  )
}

