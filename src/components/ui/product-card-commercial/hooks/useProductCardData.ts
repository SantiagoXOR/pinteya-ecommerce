/**
 * Hook de preparación de datos para ProductCard
 * Centraliza toda la transformación y preparación de datos del producto
 */

'use client'

import React from 'react'
import { resolveProductImage, type ImageResolutionOptions } from '../utils/image-resolver'
import { logger } from '../utils/logger'
import type { ProductVariant, ProductWithImages } from '../types'

export interface UseProductCardDataOptions {
  // Datos del producto
  productId?: number | string
  title?: string
  image?: string
  price?: number
  originalPrice?: number
  discount?: string
  stock?: number
  
  // Variantes
  variants?: ProductVariant[]
  default_variant?: ProductVariant | null
  image_url?: string | null
  
  // Imágenes
  images?: string[] | Array<{ url?: string; image_url?: string }> | {
    main?: string
    previews?: string[]
    thumbnails?: string[]
    gallery?: string[]
  } | null
  imgs?: {
    previews?: string[]
    thumbnails?: string[]
  } | null
  
  // Selección de variante
  currentVariant?: ProductVariant | null
  selectedColor?: string | null
  selectedMeasure?: string | null
  selectedFinish?: string | null
}

export interface UseProductCardDataResult {
  // Imagen resuelta
  resolvedImage: string
  
  // Precios
  displayPrice: number | undefined
  displayOriginalPrice: number | undefined
  discountPercentage: number
  
  // Stock
  effectiveStock: number
  
  // Datos normalizados
  normalizedProductData: {
    id: number | string
    name: string
    price: number
    discounted_price?: number
    images: string[]
    stock: number
  }
}

/**
 * Calcula el porcentaje de descuento
 */
function calculateDiscountPercentage(
  originalPrice?: number,
  displayPrice?: number
): number {
  if (!originalPrice || !displayPrice || displayPrice >= originalPrice) {
    return 0
  }
  return Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
}

/**
 * Hook de preparación de datos para ProductCard
 */
export function useProductCardData({
  productId,
  title,
  image,
  price,
  originalPrice,
  discount,
  stock = 0,
  variants,
  default_variant,
  image_url,
  images,
  imgs,
  currentVariant,
  selectedColor,
  selectedMeasure,
  selectedFinish
}: UseProductCardDataOptions): UseProductCardDataResult {
  // Preparar fuente de producto para image-resolver
  const productSource: ProductWithImages = React.useMemo(() => ({
    image_url: image_url || null,
    default_variant: default_variant || null,
    variants: variants || null,
    images: images || null,
    imgs: imgs || null
  }), [image_url, default_variant, variants, images, imgs])

  // Opciones de resolución de imagen
  const imageResolutionOptions: ImageResolutionOptions = React.useMemo(() => ({
    selectedVariant: currentVariant || null,
    selectedColor: selectedColor || null,
    selectedMeasure: selectedMeasure || null,
    selectedFinish: selectedFinish || null,
    logContext: `ProductCard-${productId || title || 'unknown'}`
  }), [currentVariant, selectedColor, selectedMeasure, selectedFinish, productId, title])

  // Resolver imagen
  const resolvedImage = React.useMemo(() => {
    // Prioridad 1: Usar imagen resuelta desde productSource con variante seleccionada
    if (currentVariant?.image_url) {
      const variantImage = resolveProductImage(productSource, {
        ...imageResolutionOptions,
        selectedVariant: currentVariant
      })
      if (variantImage && !variantImage.includes('placeholder')) {
        return variantImage
      }
    }

    // Prioridad 2: Usar image-resolver con todas las opciones
    const resolved = resolveProductImage(productSource, imageResolutionOptions)
    if (resolved && !resolved.includes('placeholder')) {
      return resolved
    }

    // Prioridad 3: Fallback a imagen prop
    if (image && !image.includes('placeholder')) {
      return image
    }

    // Prioridad 4: Placeholder
    return '/images/products/placeholder.svg'
  }, [productSource, imageResolutionOptions, currentVariant, image])

  // Calcular precio efectivo
  const displayPrice = React.useMemo(() => {
    if (currentVariant) {
      return currentVariant.price_sale || currentVariant.price_list || price
    }
    return price
  }, [currentVariant, price])

  // Calcular precio original
  const displayOriginalPrice = React.useMemo(() => {
    if (currentVariant && currentVariant.price_sale && currentVariant.price_list) {
      return currentVariant.price_list
    }
    return originalPrice
  }, [currentVariant, originalPrice])

  // Calcular porcentaje de descuento
  const discountPercentage = React.useMemo(() => {
    return calculateDiscountPercentage(displayOriginalPrice, displayPrice)
  }, [displayOriginalPrice, displayPrice])

  // Calcular stock efectivo
  const effectiveStock = React.useMemo(() => {
    if (currentVariant?.stock !== undefined && currentVariant?.stock !== null) {
      return currentVariant.stock
    }
    return stock
  }, [currentVariant, stock])

  // Normalizar datos del producto
  const normalizedProductData = React.useMemo(() => {
    const productIdNum = typeof productId === 'string' ? parseInt(productId, 10) : (productId || 0)
    
    return {
      id: productIdNum,
      name: title || 'Producto',
      price: displayPrice || 0,
      discounted_price: currentVariant?.price_sale || (displayPrice !== displayOriginalPrice ? displayPrice : undefined),
      images: resolvedImage ? [resolvedImage] : [],
      stock: effectiveStock
    }
  }, [productId, title, displayPrice, displayOriginalPrice, currentVariant, resolvedImage, effectiveStock])

  return {
    resolvedImage,
    displayPrice,
    displayOriginalPrice,
    discountPercentage,
    effectiveStock,
    normalizedProductData
  }
}
