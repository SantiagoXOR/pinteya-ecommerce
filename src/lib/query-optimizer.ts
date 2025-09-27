// ===================================
// PINTEYA E-COMMERCE - QUERY OPTIMIZER
// ===================================

import { supabaseAdmin } from './supabase'
import { cacheManager, CACHE_CONFIGS } from './cache-manager'
import { logger, LogLevel, LogCategory } from './enterprise/logger'

// Configuración de optimización
interface QueryConfig {
  cache?: boolean
  cacheTTL?: number
  batchSize?: number
  timeout?: number
  retries?: number
}

// Configuraciones predefinidas
export const QUERY_CONFIGS = {
  // Para consultas de productos (frecuentes)
  PRODUCTS: {
    cache: true,
    cacheTTL: 900, // 15 minutos
    batchSize: 50,
    timeout: 5000,
    retries: 2,
  },

  // Para consultas de órdenes (menos frecuentes)
  ORDERS: {
    cache: true,
    cacheTTL: 300, // 5 minutos
    batchSize: 20,
    timeout: 10000,
    retries: 3,
  },

  // Para consultas de usuarios (muy frecuentes)
  USERS: {
    cache: true,
    cacheTTL: 1800, // 30 minutos
    batchSize: 100,
    timeout: 3000,
    retries: 1,
  },

  // Para consultas analíticas (menos críticas)
  ANALYTICS: {
    cache: true,
    cacheTTL: 3600, // 1 hora
    batchSize: 10,
    timeout: 30000,
    retries: 1,
  },
} as const

/**
 * Clase principal para optimización de queries
 */
export class QueryOptimizer {
  private static instance: QueryOptimizer

  private constructor() {}

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer()
    }
    return QueryOptimizer.instance
  }

  /**
   * Ejecuta una query optimizada con cache
   */
  async executeQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    config: QueryConfig = {}
  ): Promise<T> {
    const startTime = Date.now()
    const finalConfig = { ...QUERY_CONFIGS.PRODUCTS, ...config }

    try {
      // Si cache está habilitado, intentar obtener del cache
      if (finalConfig.cache) {
        const cacheConfig = {
          ttl: finalConfig.cacheTTL || 900,
          prefix: 'query',
          serialize: true,
        }

        const cached = await cacheManager.get<T>(queryName, cacheConfig)
        if (cached !== null) {
          logger.info(LogCategory.API, 'Query cache hit')
          return cached
        }
      }

      // Ejecutar query con timeout
      const result = await this.executeWithTimeout(queryFn, finalConfig.timeout || 5000)

      // Guardar en cache si está habilitado
      if (finalConfig.cache) {
        const cacheConfig = {
          ttl: finalConfig.cacheTTL || 900,
          prefix: 'query',
          serialize: true,
        }

        cacheManager.set(queryName, result, cacheConfig).catch(error => {
          logger.warn(LogCategory.API, 'Failed to cache query result')
        })
      }

      const duration = Date.now() - startTime
      logger.info(LogCategory.API, 'Query executed successfully')

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(LogCategory.API, 'Query execution failed', error as Error)
      throw error
    }
  }

  /**
   * Ejecuta query con timeout
   */
  private async executeWithTimeout<T>(queryFn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      queryFn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ])
  }

  /**
   * Ejecuta múltiples queries en batch
   */
  async executeBatch<T>(
    queries: Array<{
      name: string
      fn: () => Promise<T>
      config?: QueryConfig
    }>
  ): Promise<Array<{ name: string; result?: T; error?: Error }>> {
    const results = await Promise.allSettled(
      queries.map(async ({ name, fn, config }) => ({
        name,
        result: await this.executeQuery(name, fn, config),
      }))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          name: queries[index].name,
          error: result.reason,
        }
      }
    })
  }

  /**
   * Invalida cache de queries por patrón
   */
  async invalidateQueryCache(pattern: string): Promise<void> {
    try {
      const cacheConfig = {
        ttl: 0,
        prefix: 'query',
        serialize: true,
      }

      await cacheManager.invalidatePattern(pattern, cacheConfig)

      logger.info(LogCategory.API, 'Query cache invalidated')
    } catch (error) {
      logger.error(LogCategory.API, 'Failed to invalidate query cache', error as Error)
    }
  }
}

// Instancia singleton
export const queryOptimizer = QueryOptimizer.getInstance()

/**
 * Funciones optimizadas para consultas comunes
 */
export const OptimizedQueries = {
  /**
   * Obtiene productos con cache optimizado
   */
  async getProducts(
    filters: {
      category?: string
      brand?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<any[]> {
    const cacheKey = `products:${JSON.stringify(filters)}`

    return queryOptimizer.executeQuery(
      cacheKey,
      async () => {
        if (!supabaseAdmin) {
          throw new Error('Supabase admin client not available')
        }

        let query = supabaseAdmin.from('products').select('*')

        if (filters.category) {
          query = query.eq('category_id', filters.category)
        }

        if (filters.brand) {
          query = query.eq('brand', filters.brand)
        }

        if (filters.limit) {
          query = query.limit(filters.limit)
        }

        if (filters.offset) {
          query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
        }

        const { data, error } = await query

        if (error) {
          throw new Error(`Products query failed: ${error.message}`)
        }

        return data || []
      },
      QUERY_CONFIGS.PRODUCTS
    )
  },

  /**
   * Obtiene órdenes de un usuario con cache
   */
  async getUserOrders(userId: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `user_orders:${userId}:${limit}`

    return queryOptimizer.executeQuery(
      cacheKey,
      async () => {
        if (!supabaseAdmin) {
          throw new Error('Supabase admin client not available')
        }

        const { data, error } = await supabaseAdmin
          .from('orders')
          .select(
            `
            *,
            order_items (
              *,
              products (
                id,
                name,
                price,
                image_url
              )
            )
          `
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) {
          throw new Error(`User orders query failed: ${error.message}`)
        }

        return data || []
      },
      QUERY_CONFIGS.ORDERS
    )
  },

  /**
   * Obtiene estadísticas de productos
   */
  async getProductStats(): Promise<{
    totalProducts: number
    productsByCategory: Array<{ category: string; count: number }>
    topProducts: Array<{ id: string; name: string; sales: number }>
  }> {
    const cacheKey = 'product_stats'

    return queryOptimizer.executeQuery(
      cacheKey,
      async () => {
        if (!supabaseAdmin) {
          throw new Error('Supabase admin client not available')
        }

        // Ejecutar múltiples queries en paralelo
        const [totalResult, categoryResult, topProductsResult] = await Promise.all([
          supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),

          supabaseAdmin
            .from('products')
            .select('category_id, categories(name)')
            .not('category_id', 'is', null),

          supabaseAdmin
            .from('order_items')
            .select(
              `
              product_id,
              quantity,
              products(id, name)
            `
            )
            .limit(10),
        ])

        if (totalResult.error) {
          throw new Error(`Total products query failed: ${totalResult.error.message}`)
        }

        if (categoryResult.error) {
          throw new Error(`Category stats query failed: ${categoryResult.error.message}`)
        }

        if (topProductsResult.error) {
          throw new Error(`Top products query failed: ${topProductsResult.error.message}`)
        }

        // Procesar resultados
        const totalProducts = totalResult.count || 0

        const productsByCategory =
          categoryResult.data?.reduce((acc: any[], item: any) => {
            const categoryName = item.categories?.name || 'Sin categoría'
            const existing = acc.find(c => c.category === categoryName)
            if (existing) {
              existing.count++
            } else {
              acc.push({ category: categoryName, count: 1 })
            }
            return acc
          }, []) || []

        const topProducts =
          topProductsResult.data
            ?.reduce((acc: any[], item: any) => {
              const productId = item.product_id
              const existing = acc.find(p => p.id === productId)
              if (existing) {
                existing.sales += item.quantity
              } else {
                acc.push({
                  id: productId,
                  name: item.products?.name || 'Producto desconocido',
                  sales: item.quantity,
                })
              }
              return acc
            }, [])
            ?.sort((a: any, b: any) => b.sales - a.sales)
            .slice(0, 5) || []

        return {
          totalProducts,
          productsByCategory,
          topProducts,
        }
      },
      QUERY_CONFIGS.ANALYTICS
    )
  },

  /**
   * Invalida cache de productos
   */
  async invalidateProductsCache(): Promise<void> {
    await queryOptimizer.invalidateQueryCache('products:*')
  },

  /**
   * Invalida cache de órdenes de un usuario
   */
  async invalidateUserOrdersCache(userId: string): Promise<void> {
    await queryOptimizer.invalidateQueryCache(`user_orders:${userId}:*`)
  },
}
