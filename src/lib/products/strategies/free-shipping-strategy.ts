// ===================================
// ESTRATEGIA PARA PRODUCTOS CON ENVÍO GRATIS
// ===================================

import { Product } from '@/types/product'
import { ProductFilters } from '@/hooks/useFilteredProducts'
import { BaseProductStrategy } from './base-strategy'
import { sortByPrice } from '../transformers'
import { FREE_SHIPPING_THRESHOLD, PRODUCT_LIMITS } from '../constants'

/**
 * Estrategia específica para productos con envío gratis
 * Filtra productos con precio > FREE_SHIPPING_THRESHOLD y los ordena por precio
 */
export class FreeShippingStrategy extends BaseProductStrategy {
  constructor(maxProducts: number = PRODUCT_LIMITS.FREE_SHIPPING) {
    super(maxProducts)
  }
  
  /**
   * Filtra productos con precio > FREE_SHIPPING_THRESHOLD
   * ✅ FIX: Considera productos que tengan AL MENOS UNA variante con precio >= $50.000
   * Usa el precio con descuento si existe, sino el precio original
   */
  filter(products: Product[]): Product[] {
    return products.filter(p => {
      // Si el producto tiene variantes, verificar si alguna califica para envío gratis
      if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
        // Verificar si alguna variante tiene precio >= $50.000
        const hasFreeShippingVariant = p.variants.some((v: any) => {
          const variantPrice = Number(v.price_sale) || Number(v.price_list) || 0
          return variantPrice >= FREE_SHIPPING_THRESHOLD
        })
        return hasFreeShippingVariant
      }
      
      // Si no tiene variantes, verificar el precio del producto base
      const price = Number(p.price) || 0
      const discountedPrice = Number(p.discountedPrice) || price
      // Usar el precio más bajo (con descuento si existe) para filtrar
      const finalPrice = discountedPrice > 0 ? discountedPrice : price
      return finalPrice >= FREE_SHIPPING_THRESHOLD
    })
  }
  
  /**
   * Ordena productos por precio descendente (más caros primero)
   * Considera precio con descuento si existe
   */
  sort(products: Product[]): Product[] {
    return [...products].sort((a, b) => {
      const priceA = Number(b.discountedPrice) || Number(b.price) || 0
      const priceB = Number(a.discountedPrice) || Number(a.price) || 0
      return priceA - priceB
    })
  }
  
  /**
   * Obtiene los filtros de API para esta estrategia
   */
  getApiFilters(): ProductFilters {
    return {
      limit: PRODUCT_LIMITS.FREE_SHIPPING,
      sortBy: 'price',
      sortOrder: 'desc',
    }
  }
  
  /**
   * Ejecuta la estrategia con fallback: si no hay productos con precio > threshold,
   * retorna los productos más caros disponibles
   */
  execute(products: Product[]): Product[] {
    const filtered = this.filter(products)
    
    // Si no hay productos con precio > threshold, usar los más caros disponibles
    if (filtered.length === 0) {
      const sorted = this.sort(products)
      return this.limit(sorted)
    }
    
    const sorted = this.sort(filtered)
    return this.limit(sorted)
  }
}
