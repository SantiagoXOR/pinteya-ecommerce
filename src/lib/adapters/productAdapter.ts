// ===================================
// PINTEYA E-COMMERCE - ADAPTADOR DE PRODUCTOS
// ===================================

import { Product as DatabaseProduct } from '@/types/database'
import { Product as LegacyProduct } from '@/types/product'
import { ProductWithCategory } from '@/types/api'
import { shouldShowFreeShipping as dsShouldShowFreeShipping, defaultDesignSystemConfig } from '@/lib/design-system-config'

/**
 * Adapta un producto de la base de datos al formato legacy usado en componentes
 */
export function adaptDatabaseProductToLegacy(dbProduct: DatabaseProduct): LegacyProduct {
  return {
    id: dbProduct.id,
    title: dbProduct.name,
    price: dbProduct.price,
    discountedPrice: dbProduct.discounted_price || dbProduct.price,
    reviews: 0, // No disponible en BD actual
    imgs: dbProduct.images
      ? {
          thumbnails: dbProduct.images.thumbnails || [],
          previews: dbProduct.images.previews || [],
        }
      : undefined,
  }
}

/**
 * Adapta un producto con categoría de la API al formato legacy
 */
export function adaptApiProductToLegacy(apiProduct: ProductWithCategory): LegacyProduct & {
  // Campos adicionales disponibles desde la API
  stock?: number
  created_at?: string
  category?: {
    id: number
    name: string
    slug: string
  }
  // Campos calculados
  name?: string
  discounted_price?: number | null
  images?: any
  // Datos estructurados críticos para badges inteligentes
  variants?: any[]
  specifications?: Record<string, any>
  dimensions?: Record<string, any>
  color?: string
  medida?: string
} {
  // FIX TEMPORAL: Limpiar "Poxipol" del título si está presente
  let cleanTitle = apiProduct.name
  if (cleanTitle && cleanTitle.includes('Poximix') && cleanTitle.includes('Poxipol')) {
    cleanTitle = cleanTitle.replace(/\s*Poxipol\s*$/, '').trim()
  }

  return {
    // Campos legacy requeridos
    id: apiProduct.id,
    title: cleanTitle,
    price: apiProduct.price,
    discountedPrice: apiProduct.discounted_price ?? apiProduct.price,
    reviews: 0, // No disponible en BD actual
    imgs: apiProduct.images
      ? {
          thumbnails: apiProduct.images.thumbnails ||
            apiProduct.images.previews || [apiProduct.images.main],
          previews: apiProduct.images.previews || [apiProduct.images.main],
        }
      : {
          thumbnails: ['/images/products/placeholder.svg'],
          previews: ['/images/products/placeholder.svg'],
        },

    // Campos adicionales para nuevas funcionalidades
    stock: apiProduct.stock,
    created_at: apiProduct.created_at,
    category: apiProduct.category,
    name: cleanTitle, // También limpiar el campo name
    brand: apiProduct.brand, // Agregar brand
    discounted_price: apiProduct.discounted_price,
    images: apiProduct.images,
    // ✅ Datos estructurados para badges inteligentes y UI
    variants: (apiProduct as any).variants || [],
    specifications: (apiProduct as any).specifications || {},
    dimensions: (apiProduct as any).dimensions || undefined,
    color: (apiProduct as any).color || undefined,
    medida: (apiProduct as any).medida || undefined,
  }
}

/**
 * Adapta una lista de productos de la API al formato legacy extendido
 */
export function adaptApiProductsToLegacy(apiProducts: ProductWithCategory[]): Array<
  LegacyProduct & {
    stock?: number
    created_at?: string
    category?: { id: number; name: string; slug: string }
    name?: string
    discounted_price?: number | null
    images?: any
  }
> {
  return apiProducts.map(adaptApiProductToLegacy)
}

/**
 * Calcula propiedades derivadas para badges y funcionalidades
 */
export function calculateProductFeatures(
  product:
    | ProductWithCategory
    | (LegacyProduct & {
        stock?: number
        created_at?: string
        category?: { id: number; name: string; slug: string }
        name?: string
        discounted_price?: number | null
        images?: any
      })
) {
  // Precio actual (con descuento si existe)
  const currentPrice = product.discounted_price || product.price

  // Envío gratis según Design System (umbral global)
  const freeShipping = dsShouldShowFreeShipping(currentPrice, defaultDesignSystemConfig)

  // Envío rápido para ciertas categorías
  const categoryName = product.category?.name?.toLowerCase() || ''
  const fastShipping =
    categoryName.includes('pincel') ||
    categoryName.includes('rodillo') ||
    categoryName.includes('brocha') ||
    categoryName.includes('herramienta')

  // Producto nuevo (últimos 30 días)
  const isNew = product.created_at
    ? new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    : false

  // Calcular descuento
  const discount =
    product.discounted_price && product.price && product.discounted_price < product.price
      ? Math.round(((product.price - product.discounted_price) / product.price) * 100)
      : undefined

  // Badge principal
  const badge = discount ? `${discount}% OFF` : undefined

  // Stock disponible
  const stock = product.stock || 0

  return {
    currentPrice,
    freeShipping,
    fastShipping,
    isNew,
    discount,
    badge,
    stock,
  }
}

/**
 * Tipo extendido que combina legacy con campos de BD
 */
export type ExtendedProduct = LegacyProduct & {
  stock?: number
  created_at?: string
  category?: {
    id: number
    name: string
    slug: string
  }
  name?: string
  brand?: string | null
  description?: string
  discounted_price?: number | null
  images?: any
  // Campos adicionales para badges inteligentes y datos estructurados
  variants?: any[]
  specifications?: Record<string, any>
  dimensions?: Record<string, any>
  color?: string
  medida?: string
}

/**
 * Tipo para las características calculadas
 */
export type ProductFeatures = {
  currentPrice: number
  freeShipping: boolean
  fastShipping: boolean
  isNew: boolean
  discount?: number
  badge?: string
  stock: number
}
