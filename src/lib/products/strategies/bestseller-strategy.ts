// ===================================
// ESTRATEGIA PARA PRODUCTOS BESTSELLER
// ===================================

import { Product } from '@/types/product'
import { ProductFilters } from '@/hooks/useFilteredProducts'
import { BaseProductStrategy } from './base-strategy'
import { 
  filterBestsellerProducts, 
  orderProductsByPriority,
  sortByPrice,
  separateByStock 
} from '../transformers'
import { BESTSELLER_PRODUCTS_SLUGS, PRODUCT_LIMITS } from '../constants'

/**
 * Estrategia específica para productos bestseller
 * Maneja dos modos:
 * - Sin categoría: Filtra 17 productos (10 específicos + 7 adicionales populares)
 * - Con categoría: Todos los productos de la categoría
 */
export class BestsellerStrategy extends BaseProductStrategy {
  private categorySlug: string | null
  
  constructor(categorySlug: string | null = null, maxProducts: number = PRODUCT_LIMITS.BESTSELLER) {
    super(maxProducts)
    this.categorySlug = categorySlug
  }
  
  /**
   * Filtra productos según si hay categoría o no
   * Sin categoría: solo productos bestseller específicos
   * Con categoría: todos los productos
   */
  filter(products: Product[]): Product[] {
    // Si hay categoría, no filtrar por slugs específicos
    if (this.categorySlug) {
      return products
    }
    
    // Sin categoría: filtrar solo productos bestseller específicos
    return filterBestsellerProducts(products)
  }
  
  /**
   * Ordena productos según la estrategia
   * Sin categoría: ordenar por prioridad de slugs, luego por precio
   * Con categoría: ordenar por precio descendente
   * En ambos casos: productos con stock primero
   */
  sort(products: Product[]): Product[] {
    // Si hay categoría, ordenar por precio descendente
    if (this.categorySlug) {
      const sorted = sortByPrice(products, 'desc')
      const { inStock, outOfStock } = separateByStock(sorted)
      return [...inStock, ...outOfStock]
    }
    
    // Sin categoría: ordenar según prioridad y luego por precio
    const ordered = orderProductsByPriority(products, BESTSELLER_PRODUCTS_SLUGS)
    const sorted = sortByPrice(ordered, 'desc')
    const { inStock, outOfStock } = separateByStock(sorted)
    return [...inStock, ...outOfStock]
  }
  
  /**
   * Obtiene los filtros de API para esta estrategia
   */
  getApiFilters(): ProductFilters {
    return {
      limit: this.categorySlug ? PRODUCT_LIMITS.CATEGORY : PRODUCT_LIMITS.FREE_SHIPPING,
      sortBy: this.categorySlug ? 'created_at' : 'price',
      sortOrder: 'desc',
      ...(this.categorySlug ? { category: this.categorySlug } : {}),
    }
  }
}
