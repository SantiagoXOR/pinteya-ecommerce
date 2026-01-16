// ===================================
// PINTEYA E-COMMERCE - FUNCIONES DE API PARA VARIANTES DE PRODUCTOS
// ===================================

import { ApiResponse } from '@/types/api'
import { safeApiResponseJson } from '@/lib/json-utils'

// Tipo para variante de producto
export interface ProductVariant {
  id: number
  product_id: number
  aikon_id: number
  variant_slug: string
  color_name: string | null
  color_hex: string | null
  measure: string
  finish: string | null
  price_list: number
  price_sale: number
  stock: number
  is_active: boolean
  is_default: boolean
  image_url: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  // Propiedades calculadas para compatibilidad
  name?: string
  capacity?: string
  price?: string
  discounted_price?: string | null
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

    if (!result || !result.success) {
      // Si es un error 404 (producto no encontrado), devolver respuesta vacía en lugar de lanzar error
      if (response.status === 404) {
        console.warn(`Producto ${productId} no encontrado, devolviendo variantes vacías`)
        return {
          data: [],
          success: true,
          message: 'No se encontraron variantes para este producto'
        }
      }
      
      // Para otros errores, lanzar excepción
      throw new Error(result?.error || 'Error parsing API response')
    }

    if (!result.data) {
      // Si no hay datos pero la respuesta fue exitosa, devolver array vacío
      return {
        data: [],
        success: true,
        message: 'No se encontraron variantes para este producto'
      }
    }

    return result
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
  if (!variants || variants.length === 0) {
    return null
  }

  return variants.reduce((cheapest, current) => {
    const cheapestPrice = getEffectivePrice(cheapest)
    const currentPrice = getEffectivePrice(current)
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
    const expensivePrice = getEffectivePrice(expensive)
    const currentPrice = getEffectivePrice(current)

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

  const normalize = (value?: string | null): string => {
    if (!value) return ''
    // Quitar espacios, normalizar a mayúsculas y unificar sufijos (KG/L)
    const up = value.trim().toUpperCase()
    const noSpaces = up.replace(/\s+/g, '')
    // Eliminar puntuación común que suele venir en textos (ej: "4 LTS.", "5 KG.")
    const noPunct = noSpaces.replace(/[.\-_/]/g, '')
    const replacedKg = noPunct.replace(/(KGS|KILO|KILOS)$/i, 'KG')
    const replacedL = replacedKg.replace(/(LT|LTS|LITRO|LITROS)$/i, 'L')
    return replacedL
  }

  const target = normalize(capacity)

  // Intento 1: Coincidencia exacta normalizada en measure o capacity
  const exact = variants.find(v => normalize(v.measure) === target || normalize(v.capacity) === target)
  if (exact) return exact

  // Intento 2: Comparar solo número + unidad (p.ej. 5KG vs 5 KG)
  const numUnit = target.match(/^(\d+)([A-Z]+)?$/)
  if (numUnit) {
    const [_, num, unit] = numUnit
    const candidate = variants.find(v => {
      const vm = normalize(v.measure)
      const vc = normalize(v.capacity)
      const matchVm = vm.startsWith(num) && (!unit || vm.endsWith(unit))
      const matchVc = vc.startsWith(num) && (!unit || vc.endsWith(unit))
      return matchVm || matchVc
    })
    if (candidate) return candidate
  }

  return null
}

/**
 * Obtiene las capacidades disponibles de las variantes
 * @param variants - Array de variantes
 * @returns string[]
 */
export function getAvailableCapacities(variants: ProductVariant[]): string[] {
  if (!variants || variants.length === 0) {
    return []
  }

  // Usar measure como capacidad para productos como cintas
  const capacities = variants
    .filter(variant => variant.is_active)
    .map(variant => variant.measure || variant.capacity || '')
    .filter(capacity => capacity.length > 0)

  // Remover duplicados y ordenar
  return [...new Set(capacities)].sort()
}

/**
 * Calcula el precio efectivo de una variante (con descuento si existe)
 * @param variant - Variante del producto
 * @returns number
 */
export function getEffectivePrice(variant: ProductVariant): number {
  // Usar price_sale si existe, sino price_list
  return variant.price_sale || variant.price_list
}

/**
 * Verifica si una variante tiene descuento
 * @param variant - Variante del producto
 * @returns boolean
 */
export function hasDiscount(variant: ProductVariant): boolean {
  return (
    variant.price_sale !== null &&
    variant.price_sale > 0 &&
    variant.price_sale < variant.price_list
  )
}

/**
 * Calcula el porcentaje de descuento de una variante
 * @param variant - Variante del producto
 * @returns number (porcentaje de descuento)
 */
export function getDiscountPercentage(variant: ProductVariant): number {
  if (!hasDiscount(variant)) return 0

  const originalPrice = variant.price_list
  const discountedPrice = variant.price_sale!

  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
}
