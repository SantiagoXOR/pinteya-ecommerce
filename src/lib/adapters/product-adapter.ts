// ===================================
// PINTEYA E-COMMERCE - ADAPTADOR DE PRODUCTOS
// ===================================

import { Product } from '@/types/product'
import { ProductWithCategory } from '@/types/api'

/**
 * Convierte un producto de la API al formato esperado por los componentes
 * @param apiProduct - Producto desde la API
 * @returns Product - Producto en formato de componente
 */
export const adaptApiProductToComponent = (apiProduct: ProductWithCategory): Product => {
  console.group(`🔄 [ProductAdapter] Adaptando producto: ${apiProduct.name}`);
  console.log('📦 API Product original:', apiProduct);
  console.log('🖼️ Imágenes originales:', apiProduct.images);
  
  // Obtener la primera imagen válida o usar placeholder
  const firstImage = apiProduct.images && apiProduct.images.length > 0 
    ? apiProduct.images[0] 
    : '/images/products/placeholder.svg';
    
  console.log('🎯 Primera imagen seleccionada:', firstImage);

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
    images: apiProduct.images || ['/images/products/placeholder.svg'],
    image: firstImage,
    // ✅ CAMPOS CRÍTICOS PARA BADGES INTELIGENTES
    // 🎯 BADGES INTELIGENTES FIX - Octubre 2025
    // Campos críticos para generación de badges inteligentes
    color: apiProduct.color || undefined,        // ✅ CRÍTICO: Para badges de color
    medida: apiProduct.medida || undefined,      // ✅ CRÍTICO: Para badges de capacidad/tamaño
    variants: apiProduct.variants || [],
    specifications: apiProduct.specifications || {},
    // Campos de compatibilidad con versiones anteriores
    imgs: {
      previews: apiProduct.images || ['/images/products/placeholder.svg']
    }
  };

  console.log('✅ Producto adaptado:', adaptedProduct);
  console.log('🖼️ URL final de imagen:', adaptedProduct.image);
  console.groupEnd();

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
 * @param product - Producto
 * @returns string - URL de la imagen
 */
export function getMainImage(product: Product | ProductWithCategory): string {
  // Priorizar el nuevo formato de array simple
  if ('images' in product && Array.isArray(product.images) && product.images[0]) {
    return product.images[0]
  }
  if ('imgs' in product && product.imgs?.previews?.[0]) {
    return product.imgs.previews[0]
  }
  if ('images' in product && product.images?.previews?.[0]) {
    return product.images.previews[0]
  }
  return '/images/products/placeholder.svg'
}

/**
 * Valida y obtiene una URL de imagen válida, manejando cadenas vacías y undefined
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
    return imageUrl.trim()
  }
  return fallback
}

/**
 * Obtiene la imagen thumbnail del producto con validación robusta
 * @param product - Producto
 * @returns string - URL de la imagen thumbnail válida
 */
export function getThumbnailImage(product: Product | ProductWithCategory): string {
  let imageUrl: string | undefined

  // Priorizar el nuevo formato de array simple
  if ('images' in product && Array.isArray(product.images) && product.images[0]) {
    imageUrl = product.images[0]
  } else if ('imgs' in product && product.imgs?.thumbnails?.[0]) {
    imageUrl = product.imgs.thumbnails[0]
  } else if ('images' in product && product.images?.thumbnails?.[0]) {
    imageUrl = product.images.thumbnails[0]
  }

  return getValidImageUrl(imageUrl)
}

/**
 * Obtiene la imagen preview del producto con validación robusta
 * @param product - Producto
 * @returns string - URL de la imagen preview válida
 */
export function getPreviewImage(product: Product | ProductWithCategory): string {
  let imageUrl: string | undefined

  // Priorizar el nuevo formato de array simple
  if ('images' in product && Array.isArray(product.images) && product.images[0]) {
    imageUrl = product.images[0]
  } else if ('imgs' in product && product.imgs?.previews?.[0]) {
    imageUrl = product.imgs.previews[0]
  } else if ('images' in product && product.images?.previews?.[0]) {
    imageUrl = product.images.previews[0]
  }

  return getValidImageUrl(imageUrl)
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
