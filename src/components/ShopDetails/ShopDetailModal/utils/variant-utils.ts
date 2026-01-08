/**
 * Utilidades para manejo de variantes en ShopDetailModal
 * Reutiliza normalizeMeasure de ProductCard para evitar duplicación
 */

import { normalizeMeasure } from './measure-utils'
import { ProductVariant } from '@/lib/api/product-variants'
import { findVariantByCapacity } from '@/lib/api/product-variants'

/**
 * Busca una variante que coincida con color, capacidad y finish
 */
export const findVariantBySelection = (
  variants: ProductVariant[],
  color: string,
  capacity: string,
  finish?: string
): ProductVariant | null => {
  if (!variants || variants.length === 0) return null
  if (!capacity || !capacity.trim()) return null

  // Convertir el color a slug para comparación
  const toSlug = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, '-')
      .trim()

  const selectedColorSlug = color ? toSlug(color) : ''
  const colorToUse = color

  // Estrategia 1: Buscar por color + capacidad + finish
  if (colorToUse && capacity) {
    const variant = variants.find((v, index) => {
      // Verificar que la medida coincida exactamente
      const capacityMatch = v.measure === capacity
      // Verificar que el color coincida exactamente (case insensitive)
      const colorMatch = (v.color_name || '').toLowerCase().trim() === colorToUse.toLowerCase().trim()
      // Verificar que el finish coincida (si hay finish seleccionado)
      const finishMatch = !finish || v.finish === finish

      return capacityMatch && colorMatch && finishMatch
    })

    if (variant) return variant
  }

  // Fallback 1: Si no se encuentra con color, buscar por measure + finish
  if (finish && capacity) {
    const variant = variants.find(
      v => v.measure === capacity && v.finish === finish
    )
    if (variant) return variant
  }

  // Fallback 2: Si no se encuentra, buscar solo por capacidad
  return findVariantByCapacity(variants, capacity)
}

/**
 * Busca una variante por medida
 */
export const findVariantByMeasure = (
  variants: ProductVariant[],
  measure: string
): ProductVariant | null => {
  return findVariantByCapacity(variants, measure)
}

/**
 * Re-exportar normalizeMeasure para uso en otros módulos
 */
export { normalizeMeasure } from './measure-utils'

