/**
 * Sistema unificado de resolución de imágenes para ProductCard
 * Centraliza toda la lógica de resolución con prioridad clara y consistente
 */

import { logger } from './logger'
import { getColorHexFromName } from './color-utils'
import type { ProductVariant } from '../types'

export interface ProductImageSource {
  image_url?: string | null
  default_variant?: ProductVariant | null
  variants?: ProductVariant[] | null
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
}

export interface ImageResolutionOptions {
  selectedVariant?: ProductVariant | null
  selectedColor?: string | null
  selectedMeasure?: string | null
  selectedFinish?: string | null
  logContext?: string
}

const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg'
const INCORRECT_HOSTNAME = 'aaklgwkpb.supabase.co'
const CORRECT_HOSTNAME = 'aakzspzfulgftqlgwkpb.supabase.co'

/**
 * Valida y sanitiza una URL de imagen
 * También detecta y corrige URLs de Supabase malformadas
 */
function sanitizeImageUrl(imageUrl: string | undefined | null): string | null {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return null
  }

  let trimmed = imageUrl.trim()

  // Detectar y corregir hostname incorrecto de Supabase
  if (trimmed.includes(INCORRECT_HOSTNAME)) {
    trimmed = trimmed.replace(INCORRECT_HOSTNAME, CORRECT_HOSTNAME)
    logger.warn('URL de imagen malformada detectada y corregida', {
      original: imageUrl.trim(),
      corrected: trimmed,
      issue: 'hostname_truncado'
    })
  }

  // Verificar que sea una URL válida
  try {
    new URL(trimmed)
    return trimmed
  } catch {
    return null
  }
}

/**
 * Extrae URL de imagen de una variante
 */
function getVariantImageUrl(variant: ProductVariant | null | undefined): string | null {
  if (!variant) return null
  return sanitizeImageUrl(variant.image_url)
}

/**
 * Resuelve imagen desde un array de imágenes
 */
function resolveFromArray(images: string[] | Array<{ url?: string; image_url?: string }>): string | null {
  if (!Array.isArray(images) || images.length === 0) return null

  const first = images[0]
  if (typeof first === 'string') {
    return sanitizeImageUrl(first)
  }

  if (first && typeof first === 'object') {
    const url = first.url || first.image_url
    return sanitizeImageUrl(url)
  }

  return null
}

/**
 * Resuelve imagen desde un objeto con estructura { main, previews, thumbnails, gallery }
 */
function resolveFromObject(
  images: {
    main?: string
    previews?: string[]
    thumbnails?: string[]
    gallery?: string[]
  }
): string | null {
  if (!images || typeof images !== 'object') return null

  const candidates = [
    images.main,
    images.previews?.[0],
    images.thumbnails?.[0],
    images.gallery?.[0]
  ]

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string') {
      const sanitized = sanitizeImageUrl(candidate)
      if (sanitized) return sanitized
    }
  }

  return null
}

/**
 * Resuelve imagen desde variantes según selección
 */
function resolveFromVariants(
  variants: ProductVariant[],
  options: ImageResolutionOptions
): string | null {
  if (!variants || variants.length === 0) return null

  const { selectedColor, selectedMeasure, selectedFinish } = options

  // Buscar variante que coincida con la selección
  let matchingVariant: ProductVariant | null = null

  // Estrategia 1: Coincidencia exacta (color + medida + finish)
  if (selectedColor && selectedMeasure) {
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

  if (matchingVariant) {
    return getVariantImageUrl(matchingVariant)
  }

  return null
}


/**
 * Resuelve la imagen principal de un producto con prioridad completa
 * 
 * Prioridad de resolución:
 * 1. Imagen de variante activa seleccionada (si se proporciona)
 * 2. image_url desde product_images table (campo del producto)
 * 3. Imagen de variante por defecto (default_variant.image_url o variants[0].image_url)
 * 4. Imágenes del producto padre (array u objeto con múltiples formatos)
 * 5. Placeholder
 */
export function resolveProductImage(
  product: ProductImageSource,
  options: ImageResolutionOptions = {}
): string {
  const { selectedVariant, selectedColor, selectedMeasure, selectedFinish, logContext } = options
  const context = logContext || 'ProductCard'

  // PRIORIDAD 1: Imagen de variante activa seleccionada
  if (selectedVariant) {
    const variantImage = getVariantImageUrl(selectedVariant)
    if (variantImage) {
      logger.debug(`[${context}] Imagen resuelta desde variante seleccionada`)
      return variantImage
    }
  }

  // PRIORIDAD 2: image_url desde product_images table
  if (product.image_url) {
    const imageUrl = sanitizeImageUrl(product.image_url)
    if (imageUrl && !imageUrl.includes('placeholder')) {
      logger.debug(`[${context}] Imagen resuelta desde product_images`)
      return imageUrl
    }
  }

  // PRIORIDAD 3: Imagen de variante por defecto
  const defaultVariant = product.default_variant || product.variants?.[0]
  if (defaultVariant) {
    const variantImage = getVariantImageUrl(defaultVariant)
    if (variantImage) {
      logger.debug(`[${context}] Imagen resuelta desde variante por defecto`)
      return variantImage
    }
  }

  // PRIORIDAD 4: Resolver desde variantes según selección (si hay selección específica)
  if (product.variants && product.variants.length > 0 && (selectedColor || selectedMeasure || selectedFinish)) {
    const variantImage = resolveFromVariants(product.variants, options)
    if (variantImage) {
      logger.debug(`[${context}] Imagen resuelta desde variantes según selección`)
      return variantImage
    }
  }

  // PRIORIDAD 5: Imágenes del producto padre
  if (product.images) {
    // Caso: Array de strings u objetos
    if (Array.isArray(product.images)) {
      const arrayImage = resolveFromArray(product.images)
      if (arrayImage) {
        logger.debug(`[${context}] Imagen resuelta desde array de imágenes`)
        return arrayImage
      }
    }

    // Caso: Objeto con estructura { main, previews, thumbnails, gallery }
    if (typeof product.images === 'object' && !Array.isArray(product.images)) {
      const objectImage = resolveFromObject(product.images as any)
      if (objectImage) {
        logger.debug(`[${context}] Imagen resuelta desde objeto de imágenes`)
        return objectImage
      }
    }
  }

  // PRIORIDAD 6: Compatibilidad con estructuras antiguas (imgs)
  if (product.imgs?.previews?.[0]) {
    const previewImage = sanitizeImageUrl(product.imgs.previews[0])
    if (previewImage) {
      logger.debug(`[${context}] Imagen resuelta desde imgs.previews`)
      return previewImage
    }
  }

  if (product.imgs?.thumbnails?.[0]) {
    const thumbnailImage = sanitizeImageUrl(product.imgs.thumbnails[0])
    if (thumbnailImage) {
      logger.debug(`[${context}] Imagen resuelta desde imgs.thumbnails`)
      return thumbnailImage
    }
  }

  // PRIORIDAD 7: Placeholder
  logger.debug(`[${context}] Usando placeholder - no se encontró imagen válida`)
  return PLACEHOLDER_IMAGE
}

/**
 * Resuelve imagen desde variantes según selección (función auxiliar)
 */
export function resolveImageFromVariants(
  variants: ProductVariant[],
  options: ImageResolutionOptions = {}
): string | null {
  if (!variants || variants.length === 0) return null
  return resolveFromVariants(variants, options) || PLACEHOLDER_IMAGE
}

/**
 * Obtiene la cadena completa de fallbacks para debugging
 */
export function getImageFallbackChain(product: ProductImageSource): string[] {
  const chain: string[] = []

  // 1. Variante seleccionada (no disponible sin contexto)
  chain.push('selectedVariant.image_url')

  // 2. product_images
  if (product.image_url) chain.push('product.image_url')

  // 3. Variante por defecto
  if (product.default_variant?.image_url) chain.push('default_variant.image_url')
  if (product.variants?.[0]?.image_url) chain.push('variants[0].image_url')

  // 4. Imágenes del producto
  if (product.images) {
    if (Array.isArray(product.images)) chain.push('images[0]')
    else chain.push('images.{main|previews|thumbnails|gallery}')
  }

  // 5. Estructuras antiguas
  if (product.imgs?.previews?.[0]) chain.push('imgs.previews[0]')
  if (product.imgs?.thumbnails?.[0]) chain.push('imgs.thumbnails[0]')

  // 6. Placeholder
  chain.push('placeholder')

  return chain
}
