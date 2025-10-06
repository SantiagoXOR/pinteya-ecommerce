// ===================================
// SUPABASE QUERY OPTIMIZER
// ===================================

import { SupabaseClient } from '@supabase/supabase-js'
import { getCacheManager } from './cache-manager'
import { getConnectionPool } from './connection-pool'
import { API_TIMEOUTS } from '../config/api-timeouts'

interface QueryOptions {
  useCache?: boolean
  cacheTTL?: number
  timeout?: number
  retries?: number
}

interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  brand?: string
  search?: string
}

// ===================================
// CLASE PRINCIPAL DEL OPTIMIZADOR
// ===================================

export class SupabaseQueryOptimizer {
  private cache = getCacheManager()
  private pool = getConnectionPool()

  // ===================================
  // CONSULTAS DE PRODUCTOS OPTIMIZADAS
  // ===================================

  async getProducts(
    filters: ProductFilters = {},
    pagination: PaginationOptions = {},
    options: QueryOptions = {}
  ) {
    const cacheKey = this.generateCacheKey('products', { filters, pagination })

    // Intentar obtener desde caché
    if (options.useCache !== false) {
      const cached = this.cache.getProductList({ filters, pagination })
      if (cached) return cached
    }

    // Ejecutar consulta optimizada
    const { client, release } = await this.pool.acquireConnection()

    try {
      let query = client.from('products').select(`
          id,
          name,
          description,
          price,
          original_price,
          stock,
          image_url,
          category_id,
          brand,
          created_at,
          categories!inner(
            id,
            name,
            slug
          )
        `)

      // Aplicar filtros
      if (filters.category) {
        query = query.eq('categories.slug', filters.category)
      }

      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice)
      }

      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice)
      }

      if (filters.inStock) {
        query = query.gt('stock', 0)
      }

      if (filters.brand) {
        query = query.ilike('brand', `%${filters.brand}%`)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Aplicar paginación
      const limit = pagination.limit || 20
      const offset = pagination.offset || (pagination.page ? (pagination.page - 1) * limit : 0)

      query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      const result = {
        data: data || [],
        count: count || 0,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          offset,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }

      // Guardar en caché
      if (options.useCache !== false) {
        this.cache.setProductList({ filters, pagination }, result)
      }

      return result
    } finally {
      release()
    }
  }

  async getProductById(id: string, options: QueryOptions = {}) {
    // Intentar obtener desde caché
    if (options.useCache !== false) {
      const cached = this.cache.getProductDetail(id)
      if (cached) return cached
    }

    const { client, release } = await this.pool.acquireConnection()

    try {
      const { data, error } = await client
        .from('products')
        .select(
          `
          *,
          categories!inner(
            id,
            name,
            slug,
            description
          )
        `
        )
        .eq('id', id)
        .single()

      if (error) throw error

      // Guardar en caché
      if (options.useCache !== false && data) {
        this.cache.setProductDetail(id, data)
      }

      return data
    } finally {
      release()
    }
  }

  // ===================================
  // CONSULTAS DE CATEGORÍAS OPTIMIZADAS
  // ===================================

  async getCategories(options: QueryOptions = {}) {
    // Intentar obtener desde caché
    if (options.useCache !== false) {
      const cached = this.cache.getCategoryList()
      if (cached) return cached
    }

    const { client, release } = await this.pool.acquireConnection()

    try {
      const { data, error } = await client
        .from('categories')
        .select(
          `
          id,
          name,
          slug,
          description,
          image_url,
          parent_id,
          created_at
        `
        )
        .order('name', { ascending: true })

      if (error) throw error

      // Guardar en caché
      if (options.useCache !== false && data) {
        this.cache.setCategoryList(data)
      }

      return data || []
    } finally {
      release()
    }
  }

  async getCategoriesWithProductCount(options: QueryOptions = {}) {
    const { client, release } = await this.pool.acquireConnection()

    try {
      const { data, error } = await client
        .from('categories')
        .select(
          `
          id,
          name,
          slug,
          description,
          image_url,
          parent_id,
          products(count)
        `
        )
        .order('name', { ascending: true })

      if (error) throw error

      const result =
        data?.map(category => ({
          ...category,
          product_count: category.products?.[0]?.count || 0,
        })) || []

      return result
    } finally {
      release()
    }
  }

  // ===================================
  // CONSULTAS DE ÓRDENES OPTIMIZADAS
  // ===================================

  async getUserOrders(
    userId: string,
    pagination: PaginationOptions = {},
    options: QueryOptions = {}
  ) {
    // Intentar obtener desde caché
    if (options.useCache !== false) {
      const cached = this.cache.getOrderList(userId, pagination)
      if (cached) return cached
    }

    const { client, release } = await this.pool.acquireConnection()

    try {
      const limit = pagination.limit || 10
      const offset = pagination.offset || (pagination.page ? (pagination.page - 1) * limit : 0)

      const { data, error, count } = await client
        .from('orders')
        .select(
          `
          id,
          total,
          status,
          created_at,
          updated_at,
          order_items(
            id,
            quantity,
            price,
            products(
              id,
              name,
              image_url
            )
          )
        `
        )
        .eq('user_id', userId)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (error) throw error

      const result = {
        data: data || [],
        count: count || 0,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          offset,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }

      // Guardar en caché
      if (options.useCache !== false) {
        this.cache.setOrderList(userId, pagination, result)
      }

      return result
    } finally {
      release()
    }
  }

  async getOrderById(orderId: string, options: QueryOptions = {}) {
    // Intentar obtener desde caché
    if (options.useCache !== false) {
      const cached = this.cache.getOrderDetail(orderId)
      if (cached) return cached
    }

    const { client, release } = await this.pool.acquireConnection()

    try {
      const { data, error } = await client
        .from('orders')
        .select(
          `
          *,
          order_items(
            id,
            quantity,
            price,
            products(
              id,
              name,
              description,
              image_url,
              brand
            )
          )
        `
        )
        .eq('id', orderId)
        .single()

      if (error) throw error

      // Guardar en caché
      if (options.useCache !== false && data) {
        this.cache.setOrderDetail(orderId, data)
      }

      return data
    } finally {
      release()
    }
  }

  async searchProducts(
    query: string,
    filters: ProductFilters = {},
    pagination: PaginationOptions = {},
    options: QueryOptions = {}
  ) {
    // Intentar obtener desde caché
    if (options.useCache !== false) {
      const cached = this.cache.getProductSearch(query, { filters, pagination })
      if (cached) return cached
    }

    const { client, release } = await this.pool.acquireConnection()

    try {
      let supabaseQuery = client
        .from('products')
        .select(
          `
          id,
          name,
          description,
          price,
          original_price,
          stock,
          image_url,
          category_id,
          brand,
          categories!inner(
            id,
            name,
            slug
          )
        `
        )
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)

      // Aplicar filtros adicionales
      if (filters.category) {
        supabaseQuery = supabaseQuery.eq('categories.slug', filters.category)
      }

      if (filters.inStock) {
        supabaseQuery = supabaseQuery.gt('stock', 0)
      }

      // Aplicar paginación
      const limit = pagination.limit || 20
      const offset = pagination.offset || (pagination.page ? (pagination.page - 1) * limit : 0)

      supabaseQuery = supabaseQuery
        .range(offset, offset + limit - 1)
        .order('name', { ascending: true })

      const { data, error, count } = await supabaseQuery

      if (error) throw error

      const result = {
        data: data || [],
        count: count || 0,
        query,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          offset,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }

      // Guardar en caché
      if (options.useCache !== false) {
        this.cache.setProductSearch(query, { filters, pagination }, result)
      }

      return result
    } finally {
      release()
    }
  }

  // ===================================
  // CONSULTAS DE ANALYTICS OPTIMIZADAS
  // ===================================

  async getBestSellingProducts(limit: number = 10, options: QueryOptions = {}) {
    const cacheKey = `best-selling-${limit}`

    // Intentar obtener desde caché
    if (options.useCache !== false) {
      const cached = this.cache.getAnalytics('daily', cacheKey)
      if (cached) return cached
    }

    const { client, release } = await this.pool.acquireConnection()

    try {
      const { data, error } = await client
        .from('order_items')
        .select(
          `
          product_id,
          products(
            id,
            name,
            image_url,
            price
          ),
          quantity
        `
        )
        .limit(limit * 5) // Obtener más datos para procesar

      if (error) throw error

      // Procesar datos para obtener los más vendidos
      const productSales = new Map()

      data?.forEach(item => {
        const productId = item.product_id
        const currentSales = productSales.get(productId) || {
          product: item.products,
          totalQuantity: 0,
        }
        currentSales.totalQuantity += item.quantity
        productSales.set(productId, currentSales)
      })

      const result = Array.from(productSales.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, limit)

      // Guardar en caché
      if (options.useCache !== false) {
        this.cache.setAnalytics('daily', cacheKey, result)
      }

      return result
    } finally {
      release()
    }
  }

  async getSalesStats(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    options: QueryOptions = {}
  ) {
    const cacheKey = `sales-stats-${period}`

    // Intentar obtener desde caché
    if (options.useCache !== false) {
      const cached = this.cache.getAnalytics(period === 'daily' ? 'daily' : 'monthly', cacheKey)
      if (cached) return cached
    }

    const { client, release } = await this.pool.acquireConnection()

    try {
      let dateFilter = ''
      const now = new Date()

      switch (period) {
        case 'daily':
          dateFilter = now.toISOString().split('T')[0]
          break
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          dateFilter = weekAgo.toISOString().split('T')[0]
          break
        case 'monthly':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          dateFilter = monthAgo.toISOString().split('T')[0]
          break
      }

      const { data, error } = await client
        .from('orders')
        .select('total, created_at, status')
        .gte('created_at', dateFilter)
        .eq('status', 'completed')

      if (error) throw error

      const result = {
        totalSales: data?.reduce((sum, order) => sum + order.total, 0) || 0,
        totalOrders: data?.length || 0,
        averageOrderValue: data?.length
          ? data.reduce((sum, order) => sum + order.total, 0) / data.length
          : 0,
        period,
      }

      // Guardar en caché
      if (options.useCache !== false) {
        const cacheType = period === 'daily' ? 'daily' : 'monthly'
        this.cache.setAnalytics(cacheType, cacheKey, result)
      }

      return result
    } finally {
      release()
    }
  }

  // ===================================
  // MÉTODOS UTILITARIOS
  // ===================================

  private generateCacheKey(prefix: string, data: any): string {
    const dataString = JSON.stringify(data)
    return `${prefix}:${Buffer.from(dataString).toString('base64')}`
  }

  // Invalidar caché relacionado
  invalidateProductCache(productId?: string) {
    if (productId) {
      this.cache.invalidateProduct(productId)
    } else {
      this.cache.invalidateProducts()
    }
  }

  invalidateCategoryCache() {
    this.cache.invalidateCategories()
  }

  invalidateOrderCache(userId?: string, orderId?: string) {
    if (orderId) {
      this.cache.invalidateOrder(orderId)
    } else if (userId) {
      this.cache.invalidateOrders(userId)
    } else {
      this.cache.invalidateOrders()
    }
  }

  // Obtener estadísticas del optimizador
  getOptimizerStats() {
    return {
      cache: this.cache.getStats(),
      pool: this.pool.getStats(),
    }
  }
}

// Singleton instance
let optimizerInstance: SupabaseQueryOptimizer | null = null

export function getQueryOptimizer(): SupabaseQueryOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new SupabaseQueryOptimizer()
  }
  return optimizerInstance
}

// Hook para usar el optimizador en componentes React
export function useSupabaseOptimizer() {
  const optimizer = getQueryOptimizer()

  return {
    // Productos
    getProducts: optimizer.getProducts.bind(optimizer),
    getProductById: optimizer.getProductById.bind(optimizer),
    searchProducts: optimizer.searchProducts.bind(optimizer),

    // Categorías
    getCategories: optimizer.getCategories.bind(optimizer),
    getCategoriesWithProductCount: optimizer.getCategoriesWithProductCount.bind(optimizer),

    // Órdenes
    getUserOrders: optimizer.getUserOrders.bind(optimizer),
    getOrderById: optimizer.getOrderById.bind(optimizer),

    // Analytics
    getBestSellingProducts: optimizer.getBestSellingProducts.bind(optimizer),
    getSalesStats: optimizer.getSalesStats.bind(optimizer),

    // Invalidación
    invalidateProductCache: optimizer.invalidateProductCache.bind(optimizer),
    invalidateCategoryCache: optimizer.invalidateCategoryCache.bind(optimizer),
    invalidateOrderCache: optimizer.invalidateOrderCache.bind(optimizer),

    // Stats
    getOptimizerStats: optimizer.getOptimizerStats.bind(optimizer),
  }
}
