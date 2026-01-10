// ===================================
// ESTRATEGIA BASE PARA PRODUCTOS
// ===================================

import { Product } from '@/types/product'
import { ProductFilters } from '@/hooks/useFilteredProducts'

/**
 * Interfaz base para estrategias de productos
 * Define el contrato que todas las estrategias deben implementar
 */
export interface IProductStrategy {
  /**
   * Filtra productos según la estrategia
   */
  filter(products: Product[]): Product[]
  
  /**
   * Ordena productos según la estrategia
   */
  sort(products: Product[]): Product[]
  
  /**
   * Obtiene los filtros de API para esta estrategia
   */
  getApiFilters(): ProductFilters
  
  /**
   * Limita la cantidad de productos
   */
  limit(products: Product[]): Product[]
}

/**
 * Clase base abstracta para estrategias de productos
 * Proporciona implementación común y método execute() que combina todas las operaciones
 */
export abstract class BaseProductStrategy implements IProductStrategy {
  protected maxProducts: number
  
  constructor(maxProducts: number = 12) {
    this.maxProducts = maxProducts
  }
  
  /**
   * Métodos abstractos que deben ser implementados por estrategias concretas
   */
  abstract filter(products: Product[]): Product[]
  abstract sort(products: Product[]): Product[]
  abstract getApiFilters(): ProductFilters
  
  /**
   * Limita la cantidad de productos según maxProducts
   */
  limit(products: Product[]): Product[] {
    return products.slice(0, this.maxProducts)
  }
  
  /**
   * Ejecuta la estrategia completa: filtrar, ordenar y limitar
   * Este es el método principal que debe usarse para procesar productos
   */
  execute(products: Product[]): Product[] {
    const filtered = this.filter(products)
    const sorted = this.sort(filtered)
    return this.limit(sorted)
  }
}
