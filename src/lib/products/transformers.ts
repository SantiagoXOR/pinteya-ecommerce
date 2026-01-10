// ===================================
// TRANSFORMADORES Y UTILIDADES DE PRODUCTOS
// ===================================

import { Product } from '@/types/product'
import { BESTSELLER_PRODUCTS_SLUGS } from './constants'

/**
 * Ordena productos según un orden de prioridad específico
 * @param products - Array de productos a ordenar
 * @param priorityOrder - Array de slugs en orden de prioridad
 * @returns Array de productos ordenados según la prioridad
 */
export function orderProductsByPriority<T extends { slug?: string; id: string | number }>(
  products: T[],
  priorityOrder: readonly string[]
): T[] {
  const orderedProducts: T[] = []
  const usedIds = new Set<string | number>()
  
  // Agregar productos en el orden especificado
  priorityOrder.forEach(slug => {
    const product = products.find(p => p.slug === slug)
    if (product && !usedIds.has(product.id)) {
      orderedProducts.push(product)
      usedIds.add(product.id)
    }
  })
  
  return orderedProducts
}

/**
 * Separa productos en stock y sin stock
 * @param products - Array de productos a separar
 * @returns Objeto con productos en stock y sin stock
 */
export function separateByStock<T extends { stock?: number }>(products: T[]): {
  inStock: T[]
  outOfStock: T[]
} {
  const inStock: T[] = []
  const outOfStock: T[] = []
  
  products.forEach(product => {
    if ((product.stock ?? 0) > 0) {
      inStock.push(product)
    } else {
      outOfStock.push(product)
    }
  })
  
  return { inStock, outOfStock }
}

/**
 * Ordena productos por precio (descendente por defecto)
 * @param products - Array de productos a ordenar
 * @param order - Orden ascendente o descendente
 * @returns Array de productos ordenados por precio
 */
export function sortByPrice<T extends { price: number }>(
  products: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...products].sort((a, b) => {
    return order === 'desc' ? b.price - a.price : a.price - b.price
  })
}

/**
 * Filtra productos bestseller según la lista de slugs definida
 * @param products - Array de productos a filtrar
 * @returns Array de productos que son bestsellers
 */
export function filterBestsellerProducts<T extends { slug?: string }>(
  products: T[]
): T[] {
  return products.filter(p => 
    BESTSELLER_PRODUCTS_SLUGS.includes((p.slug || '') as any)
  )
}

/**
 * Limita la cantidad de productos según el rendimiento del dispositivo
 * @param products - Array de productos
 * @param isLowPerformance - Si el dispositivo tiene bajo rendimiento
 * @param lowPerformanceLimit - Límite para dispositivos de bajo rendimiento
 * @param standardLimit - Límite opcional para dispositivos estándar
 * @returns Array de productos limitado según el rendimiento
 */
export function limitByPerformance<T>(
  products: T[],
  isLowPerformance: boolean,
  lowPerformanceLimit: number,
  standardLimit?: number
): T[] {
  if (isLowPerformance) {
    return products.slice(0, lowPerformanceLimit)
  }
  
  if (standardLimit !== undefined) {
    return products.slice(0, standardLimit)
  }
  
  return products
}

/**
 * Prepara productos bestseller: filtra, ordena y separa por stock
 * @param products - Array de productos a preparar
 * @param isLowPerformance - Si el dispositivo tiene bajo rendimiento
 * @param limit - Límite opcional de productos a retornar
 * @returns Array de productos bestseller preparados
 */
export function prepareBestsellerProducts<T extends Product>(
  products: T[],
  isLowPerformance: boolean = false,
  limit?: number
): T[] {
  // 1. Filtrar productos bestseller
  const filtered = filterBestsellerProducts(products)
  
  // 2. Ordenar según prioridad
  const ordered = orderProductsByPriority(filtered, BESTSELLER_PRODUCTS_SLUGS)
  
  // 3. Ordenar por precio
  const sorted = sortByPrice(ordered)
  
  // 4. Separar por stock (con stock primero)
  const { inStock, outOfStock } = separateByStock(sorted)
  const combined = [...inStock, ...outOfStock]
  
  // 5. Limitar según rendimiento
  if (limit !== undefined) {
    return isLowPerformance ? combined.slice(0, limit) : combined.slice(0, limit)
  }
  
  return combined
}

/**
 * Calcula si se deben mostrar cards de ayuda basado en la cantidad de productos
 * @param productCount - Cantidad de productos
 * @param columnsDesktop - Número de columnas en desktop
 * @param columnsMobile - Número de columnas en mobile
 * @returns true si se deben mostrar cards de ayuda
 */
export function shouldShowHelpCards(
  productCount: number,
  columnsDesktop: number = 4,
  columnsMobile: number = 2
): boolean {
  return productCount > 0 && 
    (productCount % columnsDesktop !== 0 || productCount % columnsMobile !== 0)
}
