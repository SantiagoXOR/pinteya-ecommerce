// ===================================
// SUPABASE CACHE MANAGER
// ===================================

import { CACHE_CONFIG } from '../config/api-timeouts'

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

interface CacheStats {
  hits: number
  misses: number
  entries: number
  hitRate: number
}

class SupabaseCacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private stats: CacheStats = { hits: 0, misses: 0, entries: 0, hitRate: 0 }
  private cleanupInterval: NodeJS.Timeout | null = null
  private config = CACHE_CONFIG.supabase

  constructor() {
    this.startCleanupProcess()
  }

  // ===================================
  // MÉTODOS PRINCIPALES DE CACHÉ
  // ===================================

  public set<T>(key: string, data: T, ttl?: number): void {
    const finalTtl = ttl || this.config.defaultTTL
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: finalTtl * 1000, // Convertir a milisegundos
      key,
    }

    this.cache.set(key, entry)
    this.updateStats()
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Verificar si la entrada ha expirado
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    this.stats.hits++
    this.updateHitRate()
    return entry.data as T
  }

  public has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  public delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    this.updateStats()
    return deleted
  }

  public clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, entries: 0, hitRate: 0 }
  }

  // ===================================
  // MÉTODOS ESPECÍFICOS PARA SUPABASE
  // ===================================

  // Productos
  public setProductList(filters: any, data: any): void {
    const key = this.generateProductListKey(filters)
    this.set(key, data, this.config.products.list)
  }

  public getProductList(filters: any): any | null {
    const key = this.generateProductListKey(filters)
    return this.get(key)
  }

  public setProductDetail(productId: string, data: any): void {
    const key = `product:detail:${productId}`
    this.set(key, data, this.config.products.detail)
  }

  public getProductDetail(productId: string): any | null {
    const key = `product:detail:${productId}`
    return this.get(key)
  }

  public setProductSearch(query: string, filters: any, data: any): void {
    const key = this.generateSearchKey(query, filters)
    this.set(key, data, this.config.products.search)
  }

  public getProductSearch(query: string, filters: any): any | null {
    const key = this.generateSearchKey(query, filters)
    return this.get(key)
  }

  // Categorías
  public setCategoryList(data: any): void {
    const key = 'categories:list'
    this.set(key, data, this.config.categories.list)
  }

  public getCategoryList(): any | null {
    const key = 'categories:list'
    return this.get(key)
  }

  public setCategoryTree(data: any): void {
    const key = 'categories:tree'
    this.set(key, data, this.config.categories.tree)
  }

  public getCategoryTree(): any | null {
    const key = 'categories:tree'
    return this.get(key)
  }

  // Órdenes
  public setOrderList(userId: string, filters: any, data: any): void {
    const key = this.generateOrderListKey(userId, filters)
    this.set(key, data, this.config.orders.list)
  }

  public getOrderList(userId: string, filters: any): any | null {
    const key = this.generateOrderListKey(userId, filters)
    return this.get(key)
  }

  public setOrderDetail(orderId: string, data: any): void {
    const key = `order:detail:${orderId}`
    this.set(key, data, this.config.orders.detail)
  }

  public getOrderDetail(orderId: string): any | null {
    const key = `order:detail:${orderId}`
    return this.get(key)
  }

  // Analytics
  public setAnalytics(type: 'realtime' | 'daily' | 'monthly', key: string, data: any): void {
    const cacheKey = `analytics:${type}:${key}`
    const ttl = this.config.analytics[type]
    this.set(cacheKey, data, ttl)
  }

  public getAnalytics(type: 'realtime' | 'daily' | 'monthly', key: string): any | null {
    const cacheKey = `analytics:${type}:${key}`
    return this.get(cacheKey)
  }

  // ===================================
  // INVALIDACIÓN DE CACHÉ
  // ===================================

  public invalidateProducts(): void {
    const keysToDelete: string[] = []

    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith('product:') || key.startsWith('search:')) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.delete(key))
  }

  public invalidateProduct(productId: string): void {
    // Invalidar producto específico
    this.delete(`product:detail:${productId}`)

    // Invalidar listas que podrían contener este producto
    this.invalidateProductLists()
  }

  public invalidateProductLists(): void {
    const keysToDelete: string[] = []

    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith('product:list:') || key.startsWith('search:')) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.delete(key))
  }

  public invalidateCategories(): void {
    this.delete('categories:list')
    this.delete('categories:tree')
  }

  public invalidateOrders(userId?: string): void {
    if (userId) {
      const keysToDelete: string[] = []

      for (const key of Array.from(this.cache.keys())) {
        if (key.startsWith(`order:list:${userId}:`)) {
          keysToDelete.push(key)
        }
      }

      keysToDelete.forEach(key => this.delete(key))
    } else {
      const keysToDelete: string[] = []

      for (const key of Array.from(this.cache.keys())) {
        if (key.startsWith('order:')) {
          keysToDelete.push(key)
        }
      }

      keysToDelete.forEach(key => this.delete(key))
    }
  }

  public invalidateOrder(orderId: string): void {
    this.delete(`order:detail:${orderId}`)

    // También invalidar listas de órdenes
    const keysToDelete: string[] = []

    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith('order:list:')) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.delete(key))
  }

  // ===================================
  // MÉTODOS UTILITARIOS
  // ===================================

  private generateProductListKey(filters: any): string {
    const filterString = JSON.stringify(filters || {})
    return `product:list:${Buffer.from(filterString).toString('base64')}`
  }

  private generateSearchKey(query: string, filters: any): string {
    const searchData = { query, filters: filters || {} }
    const searchString = JSON.stringify(searchData)
    return `search:${Buffer.from(searchString).toString('base64')}`
  }

  private generateOrderListKey(userId: string, filters: any): string {
    const filterString = JSON.stringify(filters || {})
    return `order:list:${userId}:${Buffer.from(filterString).toString('base64')}`
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private updateStats(): void {
    this.stats.entries = this.cache.size
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  private startCleanupProcess(): void {
    // Limpiar entradas expiradas cada 5 minutos
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000
    )
  }

  private cleanup(): void {
    const keysToDelete: string[] = []

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.updateStats()
  }

  public getStats(): CacheStats {
    return { ...this.stats }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

// Singleton instance
let cacheInstance: SupabaseCacheManager | null = null

export function getCacheManager(): SupabaseCacheManager {
  if (!cacheInstance) {
    cacheInstance = new SupabaseCacheManager()
  }
  return cacheInstance
}

export function destroyCacheManager(): void {
  if (cacheInstance) {
    cacheInstance.destroy()
    cacheInstance = null
  }
}

// Hook para usar el caché en componentes React
export function useSupabaseCache() {
  const cache = getCacheManager()

  return {
    // Productos
    setProductList: cache.setProductList.bind(cache),
    getProductList: cache.getProductList.bind(cache),
    setProductDetail: cache.setProductDetail.bind(cache),
    getProductDetail: cache.getProductDetail.bind(cache),
    setProductSearch: cache.setProductSearch.bind(cache),
    getProductSearch: cache.getProductSearch.bind(cache),

    // Categorías
    setCategoryList: cache.setCategoryList.bind(cache),
    getCategoryList: cache.getCategoryList.bind(cache),
    setCategoryTree: cache.setCategoryTree.bind(cache),
    getCategoryTree: cache.getCategoryTree.bind(cache),

    // Órdenes
    setOrderList: cache.setOrderList.bind(cache),
    getOrderList: cache.getOrderList.bind(cache),
    setOrderDetail: cache.setOrderDetail.bind(cache),
    getOrderDetail: cache.getOrderDetail.bind(cache),

    // Analytics
    setAnalytics: cache.setAnalytics.bind(cache),
    getAnalytics: cache.getAnalytics.bind(cache),

    // Invalidación
    invalidateProducts: cache.invalidateProducts.bind(cache),
    invalidateProduct: cache.invalidateProduct.bind(cache),
    invalidateCategories: cache.invalidateCategories.bind(cache),
    invalidateOrders: cache.invalidateOrders.bind(cache),
    invalidateOrder: cache.invalidateOrder.bind(cache),

    // Stats
    getStats: cache.getStats.bind(cache),
  }
}
