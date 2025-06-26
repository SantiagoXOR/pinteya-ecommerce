// ===================================
// PINTEYA E-COMMERCE - ADAPTADOR DE PRODUCTOS
// ===================================

import { Product } from '@/types/product';
import { ProductWithCategory } from '@/types/api';

/**
 * Convierte un producto de la API al formato esperado por los componentes
 * @param apiProduct - Producto desde la API
 * @returns Product - Producto en formato de componente
 */
export function adaptApiProductToComponent(apiProduct: ProductWithCategory): Product {
  // Mapear correctamente las imágenes desde la estructura de BD a la estructura de componentes
  const images = apiProduct.images || {};

  return {
    id: apiProduct.id,
    title: apiProduct.name,
    reviews: Math.floor(Math.random() * 50) + 1, // Temporal: generar reviews aleatorias
    price: apiProduct.price,
    discountedPrice: apiProduct.discounted_price || apiProduct.price,
    imgs: {
      // Mapear desde la estructura real de la BD: { main, gallery, thumbnail }
      thumbnails: images.thumbnail ? [images.thumbnail] : ['/images/products/placeholder-sm.jpg'],
      previews: images.main ? [images.main] : (images.gallery?.[0] ? [images.gallery[0]] : ['/images/products/placeholder-bg.jpg']),
    },
  };
}

/**
 * Convierte una lista de productos de la API al formato de componentes
 * @param apiProducts - Lista de productos desde la API
 * @returns Product[] - Lista de productos en formato de componente
 */
export function adaptApiProductsToComponents(apiProducts: ProductWithCategory[]): Product[] {
  return apiProducts.map(adaptApiProductToComponent);
}

/**
 * Convierte un producto de componente al formato de la API
 * @param componentProduct - Producto en formato de componente
 * @returns Partial<ProductWithCategory> - Producto en formato de API
 */
export function adaptComponentProductToApi(componentProduct: Product): Partial<ProductWithCategory> {
  return {
    id: componentProduct.id,
    name: componentProduct.title,
    price: componentProduct.price,
    discounted_price: componentProduct.discountedPrice !== componentProduct.price 
      ? componentProduct.discountedPrice 
      : null,
    images: componentProduct.imgs,
    stock: 50, // Valor por defecto
  };
}

/**
 * Verifica si un producto tiene descuento
 * @param product - Producto
 * @returns boolean
 */
export function hasDiscount(product: Product | ProductWithCategory): boolean {
  if ('discountedPrice' in product) {
    return product.discountedPrice < product.price;
  }
  if ('discounted_price' in product) {
    return product.discounted_price !== null && product.discounted_price < product.price;
  }
  return false;
}

/**
 * Calcula el porcentaje de descuento
 * @param product - Producto
 * @returns number - Porcentaje de descuento
 */
export function getDiscountPercentage(product: Product | ProductWithCategory): number {
  let originalPrice: number;
  let discountedPrice: number;

  if ('discountedPrice' in product) {
    originalPrice = product.price;
    discountedPrice = product.discountedPrice;
  } else {
    originalPrice = product.price;
    discountedPrice = product.discounted_price || product.price;
  }

  if (discountedPrice >= originalPrice) {
    return 0;
  }

  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Obtiene el precio final del producto (con descuento si aplica)
 * @param product - Producto
 * @returns number - Precio final
 */
export function getFinalPrice(product: Product | ProductWithCategory): number {
  if ('discountedPrice' in product) {
    return product.discountedPrice;
  }
  return product.discounted_price || product.price;
}

/**
 * Obtiene la imagen principal del producto
 * @param product - Producto
 * @returns string - URL de la imagen
 */
export function getMainImage(product: Product | ProductWithCategory): string {
  if ('imgs' in product && product.imgs?.previews?.[0]) {
    return product.imgs.previews[0];
  }
  if ('images' in product && product.images?.previews?.[0]) {
    return product.images.previews[0];
  }
  return '/images/products/placeholder-bg.jpg';
}

/**
 * Obtiene la imagen thumbnail del producto
 * @param product - Producto
 * @returns string - URL de la imagen thumbnail
 */
export function getThumbnailImage(product: Product | ProductWithCategory): string {
  if ('imgs' in product && product.imgs?.thumbnails?.[0]) {
    return product.imgs.thumbnails[0];
  }
  if ('images' in product && product.images?.thumbnails?.[0]) {
    return product.images.thumbnails[0];
  }
  return '/images/products/placeholder-sm.jpg';
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
  }).format(price);
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
    .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
}
