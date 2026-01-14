// ===================================
// PINTEYA E-COMMERCE - ADAPTADOR DE PRODUCTOS
// ===================================

import { Product } from '@/types/product'
import { ProductWithCategory } from '@/types/api'
import { resolveProductImage } from '@/components/ui/product-card-commercial/utils/image-resolver'
import type { ProductVariant } from '@/components/ui/product-card-commercial/types'

/**
 * Convierte un producto de la API al formato esperado por los componentes
 * @param apiProduct - Producto desde la API
 * @returns Product - Producto en formato de componente
 */
export const adaptApiProductToComponent = (apiProduct: ProductWithCategory): Product => {
  // ⚡ OPTIMIZACIÓN: Solo loguear en desarrollo y cuando sea necesario
  const shouldLog = process.env.NODE_ENV === 'development' && process.env.DEBUG_PRODUCT_ADAPTER === 'true'
  
  if (shouldLog) {
    console.group(`🔄 [ProductAdapter] Adaptando producto: ${apiProduct.name}`);
    console.log('📦 API Product original:', apiProduct);
    console.log('🖼️ Imágenes originales:', apiProduct.images);
    console.log('🎨 Variantes:', apiProduct.variants);
  }
  
  // Resolver imagen usando image-resolver.ts unificado
  const imageSource = {
    image_url: (apiProduct as any)?.image_url || null,
    default_variant: (apiProduct as any)?.default_variant || null,
    variants: (apiProduct.variants || []) as ProductVariant[],
    images: apiProduct.images || null,
    imgs: apiProduct.imgs || null
  }
  
  const firstImage = resolveProductImage(imageSource, {
    logContext: `ProductAdapter-${apiProduct.id}`
  })
  
  // Normalizar imágenes para compatibilidad
  let normalizedImages: string[] = []
  if (firstImage && !firstImage.includes('placeholder')) {
    normalizedImages = [firstImage]
  } else if (Array.isArray(apiProduct.images)) {
    normalizedImages = apiProduct.images
      .map((img: any) => {
        if (typeof img === 'string') return img
        if (img && typeof img?.url === 'string') return img.url
        if (img && typeof img?.image_url === 'string') return img.image_url
        return null
      })
      .filter(Boolean) as string[]
  } else if (apiProduct.images?.previews && Array.isArray(apiProduct.images.previews)) {
    normalizedImages = apiProduct.images.previews
  } else if (apiProduct.images?.thumbnails && Array.isArray(apiProduct.images.thumbnails)) {
    normalizedImages = apiProduct.images.thumbnails
  } else if (apiProduct.images?.main) {
    normalizedImages = [apiProduct.images.main]
  } else if (apiProduct.images?.gallery && Array.isArray(apiProduct.images.gallery)) {
    normalizedImages = apiProduct.images.gallery
  } else {
    normalizedImages = [firstImage]
  }

  const adaptedProduct: Product = {
    id: apiProduct.id,
    title: apiProduct.name, // ✅ Mapear name a title para compatibilidad con tipo Product
    brand: apiProduct.brand || '',
    reviews: 0, // Valor por defecto
    price: apiProduct.price,
    discountedPrice: apiProduct.discounted_price || apiProduct.price,
    // Campos adicionales para compatibilidad extendida
    name: apiProduct.name,
    description: apiProduct.description || '',
    originalPrice: apiProduct.original_price || apiProduct.price,
    discount: apiProduct.discount || null,
    category: apiProduct.category?.name || 'Sin categoría',
    categoryId: apiProduct.category_id,
    stock: apiProduct.stock || 0,
    isNew: apiProduct.is_new || false,
    images: normalizedImages,
    image: firstImage,
    // ✅ CAMPOS CRÍTICOS PARA BADGES INTELIGENTES
    // 🎯 BADGES INTELIGENTES FIX - Octubre 2025
    // Campos críticos para generación de badges inteligentes
    color: apiProduct.color || undefined,        // ✅ CRÍTICO: Para badges de color
    medida: apiProduct.medida || undefined,      // ✅ CRÍTICO: Para badges de capacidad/tamaño
    slug: apiProduct.slug || undefined,          // ✅ CRÍTICO: Para extracción de finish desde slug
    variants: apiProduct.variants || [],
    specifications: apiProduct.specifications || {},
    // Campos de compatibilidad con versiones anteriores
    imgs: {
      previews: normalizedImages,
      thumbnails: normalizedImages // ✅ Incluir thumbnails también
    }
  };

  if (shouldLog) {
    console.log('✅ Producto adaptado:', adaptedProduct);
    console.log('🖼️ URL final de imagen:', adaptedProduct.image);
    console.groupEnd();
  }

  return adaptedProduct;
};

/**
 * Convierte una lista de productos de la API al formato de componentes
 * @param apiProducts - Lista de productos desde la API
 * @returns Product[] - Lista de productos en formato de componente
 */
export function adaptApiProductsToComponents(
  apiProducts: ProductWithCategory[]
): Product[] {
  return apiProducts.map(adaptApiProductToComponent)
}

/**
 * Convierte un producto de componente al formato de la API
 * @param componentProduct - Producto en formato de componente
 * @returns Partial<ProductWithCategory> - Producto en formato de API
 */
export function adaptComponentProductToApi(
  componentProduct: Product
): Partial<ProductWithCategory> {
  return {
    id: componentProduct.id,
    name: componentProduct.title,
    price: componentProduct.price,
    discounted_price:
      componentProduct.discountedPrice !== componentProduct.price
        ? componentProduct.discountedPrice
        : null,
    images: componentProduct.imgs,
    stock: 50, // Valor por defecto
  }
}

/**
 * Verifica si un producto tiene descuento
 * @param product - Producto
 * @returns boolean
 */
export function hasDiscount(product: Product | ProductWithCategory): boolean {
  if ('discountedPrice' in product) {
    return product.discountedPrice !== undefined && product.discountedPrice < product.price
  }
  if ('discounted_price' in product) {
    return product.discounted_price !== null && product.discounted_price < product.price
  }
  return false
}

/**
 * Calcula el porcentaje de descuento
 * @param product - Producto
 * @returns number - Porcentaje de descuento
 */
export function getDiscountPercentage(product: Product | ProductWithCategory): number {
  let originalPrice: number
  let discountedPrice: number

  if ('discountedPrice' in product) {
    originalPrice = product.price
    discountedPrice = product.discountedPrice
  } else {
    originalPrice = product.price
    discountedPrice = product.discounted_price || product.price
  }

  if (discountedPrice >= originalPrice) {
    return 0
  }

  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
}

/**
 * Obtiene el precio final del producto (con descuento si aplica)
 * @param product - Producto
 * @returns number - Precio final
 */
export function getFinalPrice(product: Product | ProductWithCategory): number {
  if ('discountedPrice' in product) {
    return product.discountedPrice
  }
  return product.discounted_price ?? product.price
}

/**
 * Obtiene la imagen principal del producto
 * Usa image-resolver.ts para resolución unificada
 * @param product - Producto
 * @returns string - URL de la imagen
 */
export function getMainImage(product: Product | ProductWithCategory): string {
  const imageSource = {
    image_url: (product as any)?.image_url || null,
    default_variant: (product as any)?.default_variant || null,
    variants: ((product as any).variants || []) as ProductVariant[],
    images: (product as any).images || null,
    imgs: (product as any).imgs || null
  }
  
  return resolveProductImage(imageSource, {
    logContext: `ProductAdapter.getMainImage`
  })
}

/**
 * Valida y obtiene una URL de imagen válida, manejando cadenas vacías y undefined
 * También detecta y corrige URLs de Supabase malformadas
 * @param imageUrl - URL de imagen a validar
 * @param fallback - URL de fallback (por defecto: placeholder)
 * @returns string - URL de imagen válida
 */
export function getValidImageUrl(
  imageUrl: string | undefined | null,
  fallback: string = '/images/products/placeholder.svg'
): string {
  // Verificar si la imagen existe y no es una cadena vacía o solo espacios
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
    const trimmedUrl = imageUrl.trim()
    
    // 🛡️ PROTECCIÓN: Detectar y corregir hostname incorrecto de Supabase
    // Este problema puede ocurrir por extensiones del navegador o errores de red
    const incorrectHostname = 'aaklgwkpb.supabase.co'
    const correctHostname = 'aakzspzfulgftqlgwkpb.supabase.co'
    
    if (trimmedUrl.includes(incorrectHostname)) {
      const correctedUrl = trimmedUrl.replace(incorrectHostname, correctHostname)
      
      // Log para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.warn('[getValidImageUrl] URL malformada detectada y corregida:', {
          original: trimmedUrl,
          corrected: correctedUrl,
          issue: 'hostname_truncado'
        })
      }
      
      return correctedUrl
    }
    
    return trimmedUrl
  }
  return fallback
}

/**
 * Obtiene la imagen thumbnail del producto con validación robusta
 * Usa image-resolver.ts para resolución unificada, priorizando thumbnails
 * @param product - Producto
 * @returns string - URL de la imagen thumbnail válida
 */
export function getThumbnailImage(product: Product | ProductWithCategory): string {
  // Intentar obtener thumbnail específico primero
  if ((product as any).images?.thumbnails?.[0]) {
    return getValidImageUrl((product as any).images.thumbnails[0])
  }
  if ((product as any).imgs?.thumbnails?.[0]) {
    return getValidImageUrl((product as any).imgs.thumbnails[0])
  }
  
  // Fallback a getMainImage usando image-resolver
  return getMainImage(product)
}

/**
 * Obtiene la imagen preview del producto con validación robusta
 * Usa image-resolver.ts para resolución unificada, priorizando previews
 * @param product - Producto
 * @returns string - URL de la imagen preview válida
 */
export function getPreviewImage(product: Product | ProductWithCategory): string {
  // Intentar obtener preview específico primero
  if ((product as any).images?.previews?.[0]) {
    return getValidImageUrl((product as any).images.previews[0])
  }
  if ((product as any).imgs?.previews?.[0]) {
    return getValidImageUrl((product as any).imgs.previews[0])
  }
  
  // Fallback a getMainImage usando image-resolver
  return getMainImage(product)
}

/**
 * Formatea el precio para mostrar en pesos argentinos
 * @param price - Precio
 * @returns string - Precio formateado
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Genera un slug a partir del nombre del producto
 * @param name - Nombre del producto
 * @returns string - Slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones múltiples
    .replace(/^-|-$/g, '') // Remover guiones al inicio y final
}
