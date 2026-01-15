/**
 * Servicio centralizado para manejo de productos
 * 
 * Este servicio centraliza la lógica de:
 * - Obtención de productos con sus variantes
 * - Transformación de datos
 * - Validaciones de negocio
 * - Cálculos de stock, precios, etc.
 */

import {
  getProductAikonId,
  getProductAikonIdFormatted,
  getAllVariantAikonIds,
  getAllVariantAikonIdsFormatted,
  formatAikonId,
} from '@/lib/products/aikon-id-utils'
import { normalizeProductTitle } from '@/lib/core/utils'

/**
 * Tipo para producto base de la base de datos
 */
export interface DatabaseProduct {
  id: number
  name: string
  slug?: string | null
  description?: string | null
  price: number
  discounted_price?: number | null
  stock: number
  category_id?: number | null
  brand?: string | null
  aikon_id?: number | null
  color?: string | null
  medida?: string | null
  terminaciones?: string[] | null
  images?: any
  is_active?: boolean
  created_at?: string
  updated_at?: string
  category?: {
    id: number
    name: string
  } | null
}

/**
 * Tipo para variante de producto
 */
export interface ProductVariant {
  id: number
  product_id: number
  aikon_id: number
  variant_slug?: string | null
  color_name?: string | null
  color_hex?: string | null
  measure?: string | null
  finish?: string | null
  price_list: number
  price_sale?: number | null
  stock: number
  is_active?: boolean
  is_default?: boolean
  image_url?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Tipo para producto transformado con información completa
 */
export interface TransformedProduct {
  id: number
  name: string
  slug?: string | null
  description?: string | null
  price: number
  discounted_price?: number | null
  stock: number
  category_id?: number | null
  category_name?: string | null
  brand?: string | null
  aikon_id: number | null
  aikon_id_formatted: string | null
  variant_aikon_ids: number[]
  variant_aikon_ids_formatted: string[]
  has_variants: boolean
  variant_count: number
  color?: string | null
  colores?: string[]
  medida?: string | null
  medidas?: string[]
  terminaciones?: string[]
  image_url?: string | null
  status: 'active' | 'inactive' | 'draft'
  is_active: boolean
  created_at?: string
  updated_at?: string
  categories?: Array<{ id: number; name: string }>
}

/**
 * Opciones para transformar productos
 */
export interface TransformProductOptions {
  includeVariants?: boolean
  includeCategories?: boolean
  normalizeTitle?: boolean
}

/**
 * Transforma un producto de la base de datos a formato de aplicación
 * 
 * @param product - Producto de la base de datos
 * @param variants - Array de variantes del producto
 * @param options - Opciones de transformación
 * @returns Producto transformado
 */
export function transformProduct(
  product: DatabaseProduct,
  variants: ProductVariant[] = [],
  options: TransformProductOptions = {}
): TransformedProduct {
  const {
    includeVariants = true,
    includeCategories = true,
    normalizeTitle = true,
  } = options

  const hasVariants = variants.length > 0
  const variantCount = variants.length

  // Obtener aikon_id usando utilidades
  const aikonId = getProductAikonId(product, variants)
  const aikonIdFormatted = getProductAikonIdFormatted(product, variants)
  const variantAikonIds = getAllVariantAikonIds(variants)
  const variantAikonIdsFormatted = getAllVariantAikonIdsFormatted(variants)

  // Procesar medidas
  const parsedMedida: string[] = []
  if (product.medida) {
    if (typeof product.medida === 'string') {
      if (product.medida.trim().startsWith('[') && product.medida.trim().endsWith(']')) {
        try {
          const parsed = JSON.parse(product.medida)
          parsedMedida.push(...(Array.isArray(parsed) ? parsed : [parsed]))
        } catch {
          parsedMedida.push(product.medida)
        }
      } else {
        parsedMedida.push(product.medida)
      }
    } else if (Array.isArray(product.medida)) {
      parsedMedida.push(...product.medida)
    }
  }

  // Obtener medidas de variantes
  const variantMeasures = variants
    .map(v => v.measure)
    .filter((m): m is string => m !== null && m !== undefined && m !== '')
  const allMeasures = Array.from(new Set([...parsedMedida, ...variantMeasures]))

  // Procesar colores
  const productColor = product.color ? [product.color] : []
  const variantColors = variants
    .map(v => v.color_name)
    .filter((c): c is string => c !== null && c !== undefined && c !== '')
  const allColors = Array.from(new Set([...productColor, ...variantColors]))

  // Procesar terminaciones
  const terminaciones = (product.terminaciones && Array.isArray(product.terminaciones))
    ? product.terminaciones.filter((t: string) => t && t.trim() !== '')
    : []

  // Calcular stock efectivo
  const variantTotalStock = variants
    .filter(v => v.is_active !== false)
    .reduce((sum, v) => sum + (v.stock || 0), 0)
  
  const effectiveStock = variantTotalStock > 0
    ? variantTotalStock
    : (product.stock !== null && product.stock !== undefined ? Number(product.stock) || 0 : 0)

  // Obtener precio de variante predeterminada si existe
  const defaultVariant = variants.find(v => v.is_default) || variants[0]
  const effectivePrice = defaultVariant?.price_list || product.price
  const effectiveDiscountedPrice = defaultVariant?.price_sale || product.discounted_price

  // Transformar producto
  const transformed: TransformedProduct = {
    id: product.id,
    name: normalizeTitle ? normalizeProductTitle(product.name) : product.name,
    slug: product.slug || null,
    description: product.description || null,
    price: effectivePrice,
    discounted_price: effectiveDiscountedPrice,
    stock: effectiveStock,
    category_id: product.category_id || null,
    category_name: product.category?.name || null,
    brand: product.brand || null,
    aikon_id: aikonId,
    aikon_id_formatted: aikonIdFormatted,
    variant_aikon_ids: variantAikonIds,
    variant_aikon_ids_formatted: variantAikonIdsFormatted,
    has_variants: hasVariants,
    variant_count: variantCount,
    color: allColors.length > 0 ? allColors[0] : null,
    colores: allColors,
    medida: allMeasures.length > 0 ? allMeasures[0] : null,
    medidas: allMeasures,
    terminaciones,
    image_url: null, // Se debe establecer desde fuera usando extractImageUrl
    status: product.is_active ? 'active' : 'inactive',
    is_active: product.is_active ?? true,
    created_at: product.created_at,
    updated_at: product.updated_at,
  }

  if (includeCategories && product.category) {
    transformed.categories = [product.category]
  }

  return transformed
}

/**
 * Transforma múltiples productos
 * 
 * @param products - Array de productos de la base de datos
 * @param variantsByProductId - Mapa de product_id -> variantes
 * @param options - Opciones de transformación
 * @returns Array de productos transformados
 */
export function transformProducts(
  products: DatabaseProduct[],
  variantsByProductId: Record<number, ProductVariant[]> = {},
  options: TransformProductOptions = {}
): TransformedProduct[] {
  return products.map(product => {
    const variants = variantsByProductId[product.id] || []
    return transformProduct(product, variants, options)
  })
}

/**
 * Agrupa variantes por product_id
 * 
 * @param variants - Array de variantes
 * @returns Mapa de product_id -> variantes
 */
export function groupVariantsByProductId(
  variants: ProductVariant[]
): Record<number, ProductVariant[]> {
  return variants.reduce((acc, variant) => {
    if (!acc[variant.product_id]) {
      acc[variant.product_id] = []
    }
    acc[variant.product_id].push(variant)
    return acc
  }, {} as Record<number, ProductVariant[]>)
}

/**
 * Valida que un producto tenga aikon_id si no tiene variantes
 * 
 * @param product - Producto a validar
 * @param variants - Array de variantes del producto
 * @returns true si es válido, false en caso contrario
 */
export function validateProductAikonId(
  product: { aikon_id?: number | null },
  variants: ProductVariant[] = []
): boolean {
  if (variants.length > 0) {
    // Si tiene variantes, todas deben tener aikon_id
    return variants.every(v => v.aikon_id !== null && v.aikon_id !== undefined)
  }

  // Si no tiene variantes, el producto debe tener aikon_id
  return product.aikon_id !== null && product.aikon_id !== undefined
}

/**
 * Calcula el stock total de un producto considerando variantes
 * 
 * @param product - Producto base
 * @param variants - Array de variantes
 * @returns Stock total efectivo
 */
export function calculateEffectiveStock(
  product: { stock?: number | null },
  variants: ProductVariant[] = []
): number {
  if (variants.length > 0) {
    const variantTotalStock = variants
      .filter(v => v.is_active !== false)
      .reduce((sum, v) => sum + (v.stock || 0), 0)
    
    return variantTotalStock > 0 ? variantTotalStock : 0
  }

  return product.stock !== null && product.stock !== undefined 
    ? Number(product.stock) || 0 
    : 0
}
