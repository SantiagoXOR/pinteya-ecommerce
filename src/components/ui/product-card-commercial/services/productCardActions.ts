/**
 * Servicio de acciones para ProductCard
 * Separa la lógica de analytics y carrito del componente
 */

import { trackAddToCart as trackGA4AddToCart } from '@/lib/google-analytics'
import { trackAddToCart as trackMetaAddToCart } from '@/lib/meta-pixel'
import type { ProductVariant } from '../types'

export interface ProductData {
  id: number | string
  name: string
  price: number
  discounted_price?: number
  images?: string[]
  variants?: ProductVariant[]
  quantity?: number
}

export interface VariantData {
  currentVariant?: ProductVariant | null
  displayPrice?: number
  displayOriginalPrice?: number
}

export interface Attributes {
  color?: string
  medida?: string
  finish?: string
}

export interface AddToCartOptions {
  productData: ProductData
  variantData: VariantData
  attributes: Attributes
  quantity?: number
  trackCartAction?: (action: string, productId: string, data: Record<string, any>) => void
  logger?: {
    debug: (message: string, ...args: any[]) => void
    warn: (message: string, ...args: any[]) => void
    error: (message: string, ...args: any[]) => void
  }
}

export interface TrackAddToCartOptions {
  productData: ProductData
  variantData: VariantData
  attributes: Attributes
  category?: string
  currency?: string
  trackCartAction?: (action: string, productId: string, data: Record<string, any>) => void
  logger?: {
    debug: (message: string, ...args: any[]) => void
    warn: (message: string, ...args: any[]) => void
  }
}

/**
 * Unifica la lógica de agregado al carrito
 * Esta función prepara los datos pero no ejecuta addProduct directamente
 * (el componente debe hacerlo para mantener la referencia del hook)
 */
export function prepareAddToCartData(options: AddToCartOptions): {
  productData: ProductData
  attributes: Attributes
  quantity: number
} {
  const { productData, variantData, attributes, quantity = 1 } = options

  // Preparar datos del producto con información de la variante
  const preparedProductData: ProductData = {
    ...productData,
    price: variantData.displayPrice || productData.price || 0,
    discounted_price: variantData.currentVariant?.price_sale || productData.discounted_price,
    quantity
  }

  return {
    productData: preparedProductData,
    attributes,
    quantity
  }
}

/**
 * Maneja el tracking de agregado al carrito para todos los sistemas de analytics
 */
export function trackAddToCart(options: TrackAddToCartOptions): void {
  const {
    productData,
    variantData,
    attributes,
    category = 'Producto',
    currency = 'ARS',
    trackCartAction,
    logger
  } = options

  try {
    const productPrice = variantData.displayPrice || productData.discounted_price || productData.price
    const productId = String(productData.id)
    const quantity = productData.quantity || 1

    // Google Analytics 4
    try {
      trackGA4AddToCart(
        productId,
        productData.name,
        category,
        productPrice,
        quantity,
        currency
      )
      logger?.debug('GA4 add to cart tracked', { productId, productName: productData.name })
    } catch (ga4Error) {
      logger?.warn('Error tracking GA4 add to cart', ga4Error)
    }

    // Meta Pixel
    try {
      const contentIdForMeta = variantData.currentVariant?.id
        ? String(variantData.currentVariant.id)
        : productId
      trackMetaAddToCart(
        productData.name,
        contentIdForMeta,
        category,
        productPrice,
        currency
      )
      logger?.debug('Meta add to cart tracked', { productId, contentIdForMeta })
    } catch (metaError) {
      logger?.warn('Error tracking Meta add to cart', metaError)
    }

    // Analytics interno (SimpleAnalytics)
    if (trackCartAction) {
      try {
        trackCartAction('add', productId, {
          productName: productData.name,
          category,
          price: productPrice,
          quantity,
          currency,
          attributes
        })
        logger?.debug('Internal analytics tracked', { productId })
      } catch (internalError) {
        logger?.warn('Error tracking internal analytics', internalError)
      }
    }
  } catch (error) {
    logger?.warn('Error in trackAddToCart', error)
  }
}

/**
 * Función unificada para agregar al carrito con analytics
 * Esta función prepara los datos y ejecuta el tracking, pero no ejecuta addProduct
 * El componente debe ejecutar addProduct directamente para mantener la referencia del hook
 */
export function handleAddToCart(
  options: AddToCartOptions & TrackAddToCartOptions
): {
  productData: ProductData
  attributes: Attributes
  quantity: number
} {
  const prepared = prepareAddToCartData(options)
  trackAddToCart(options)
  return prepared
}
