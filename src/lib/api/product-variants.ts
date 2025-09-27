// ===================================
// PINTEYA E-COMMERCE - FUNCIONES DE API PARA VARIANTES DE PRODUCTOS
// ===================================

import { ApiResponse } from '@/types/api'
import { safeApiResponseJson } from '@/lib/json-utils'

// Tipo para variante de producto
export interface ProductVariant {
  id: number
  name: string
  price: string
  discounted_price: string | null
  capacity: string
  stock: number
  is_active: boolean
}

/**
 * Obtiene las variantes de un producto por ID
 * @param productId - ID del producto
 * @returns Promise<ApiResponse<ProductVariant[]>>
 */
export async function getProductVariants(
  productId: number
): Promise<ApiResponse<ProductVariant[]>> {
  try {
    const response = await fetch(`/api/products/${productId}/variants`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Usar parsing seguro de JSON
    const result = await safeApiResponseJson<ApiResponse<ProductVariant[]>>(response)

    if (!result || !result.success || !result.data) {
      throw new Error(result?.error || 'Error parsing API response')
    }

    return result.data
  } catch (error) {
    console.error(`Error obteniendo variantes del producto ${productId}:`, error)
    throw error
  }
}

/**
 * Encuentra la variante con el precio más bajo
 * @param variants - Array de variantes
 * @returns ProductVariant | null
 */
export function findCheapestVariant(variants: ProductVariant[]): ProductVariant | null {
  if (!variants || variants.length === 0) return null

  return variants.reduce((cheapest, current) => {
    const cheapestPrice = parseFloat(cheapest.discounted_price || cheapest.price)
    const currentPrice = parseFloat(current.discounted_price || current.price)

    return currentPrice < cheapestPrice ? current : cheapest
  })
}

/**
 * Encuentra la variante con el precio más alto
 * @param variants - Array de variantes
 * @returns ProductVariant | null
 */
export function findMostExpensiveVariant(variants: ProductVariant[]): ProductVariant | null {
  if (!variants || variants.length === 0) return null

  return variants.reduce((expensive, current) => {
    const expensivePrice = parseFloat(expensive.discounted_price || expensive.price)
    const currentPrice = parseFloat(current.discounted_price || current.price)

    return currentPrice > expensivePrice ? current : expensive
  })
}

/**
 * Busca una variante por capacidad específica
 * @param variants - Array de variantes
 * @param capacity - Capacidad a buscar (ej: "4L", "10L")
 * @returns ProductVariant | null
 */
export function findVariantByCapacity(
  variants: ProductVariant[],
  capacity: string
): ProductVariant | null {
  if (!variants || variants.length === 0) return null

  return variants.find(variant => variant.capacity.toLowerCase() === capacity.toLowerCase()) || null
}

/**
 * Obtiene todas las capacidades disponibles de las variantes
 * @param variants - Array de variantes
 * @returns string[]
 */
export function getAvailableCapacities(variants: ProductVariant[]): string[] {
  if (!variants || variants.length === 0) return []

  return variants
    .map(variant => variant.capacity)
    .filter((capacity, index, array) => array.indexOf(capacity) === index)
    .sort((a, b) => {
      // Ordenar por capacidad numérica
      const aNum = parseInt(a.replace(/[^\d]/g, '')) || 0
      const bNum = parseInt(b.replace(/[^\d]/g, '')) || 0
      return aNum - bNum
    })
}

/**
 * Calcula el precio efectivo de una variante (con descuento si existe)
 * @param variant - Variante del producto
 * @returns number
 */
export function getEffectivePrice(variant: ProductVariant): number {
  return parseFloat(variant.discounted_price || variant.price)
}

/**
 * Verifica si una variante tiene descuento
 * @param variant - Variante del producto
 * @returns boolean
 */
export function hasDiscount(variant: ProductVariant): boolean {
  return (
    variant.discounted_price !== null &&
    parseFloat(variant.discounted_price) < parseFloat(variant.price)
  )
}

/**
 * Calcula el porcentaje de descuento de una variante
 * @param variant - Variante del producto
 * @returns number (porcentaje de descuento)
 */
export function getDiscountPercentage(variant: ProductVariant): number {
  if (!hasDiscount(variant)) return 0

  const originalPrice = parseFloat(variant.price)
  const discountedPrice = parseFloat(variant.discounted_price!)

  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
}
