// ===================================
// PINTEYA E-COMMERCE - UTILIDADES DE PERFORMANCE SUPABASE
// ===================================

import { supabase, supabaseAdmin } from '@/lib/integrations/supabase'
import { API_TIMEOUTS } from '@/lib/config/api-timeouts'

// ===================================
// TIPOS Y INTERFACES
// ===================================

export interface QueryPerformanceMetrics {
  queryTime: number
  rowCount: number
  cacheHit: boolean
  optimized: boolean
}

export interface ConnectionPoolStats {
  activeConnections: number
  idleConnections: number
  totalConnections: number
  poolUtilization: number
}

export interface SupabasePerformanceConfig {
  enableQueryOptimization: boolean
  enableConnectionPooling: boolean
  enableCaching: boolean
  maxRetries: number
  retryDelay: number
}

// ===================================
// CONFIGURACIÓN DE PERFORMANCE
// ===================================

const PERFORMANCE_CONFIG: SupabasePerformanceConfig = {
  enableQueryOptimization: true,
  enableConnectionPooling: true,
  enableCaching: process.env.NODE_ENV === 'production',
  maxRetries: 3,
  retryDelay: 1000,
}

// Cache en memoria para consultas frecuentes
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// ===================================
// FUNCIONES DE OPTIMIZACIÓN DE CONSULTAS
// ===================================

/**
 * Ejecuta una consulta optimizada con retry logic y caching
 */
export async function executeOptimizedQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey?: string,
  cacheTTL: number = 300000 // 5 minutos por defecto
): Promise<{ data: T | null; error: any; metrics: QueryPerformanceMetrics }> {
  const startTime = Date.now()
  let cacheHit = false

  // Verificar cache si está habilitado
  if (PERFORMANCE_CONFIG.enableCaching && cacheKey) {
    const cached = queryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      cacheHit = true
      return {
        data: cached.data,
        error: null,
        metrics: {
          queryTime: Date.now() - startTime,
          rowCount: Array.isArray(cached.data) ? cached.data.length : 1,
          cacheHit: true,
          optimized: true,
        },
      }
    }
  }

  // Ejecutar consulta con retry logic
  let lastError: any = null
  for (let attempt = 1; attempt <= PERFORMANCE_CONFIG.maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        queryFn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), API_TIMEOUTS.database)
        ),
      ])

      // Guardar en cache si es exitoso
      if (PERFORMANCE_CONFIG.enableCaching && cacheKey && result.data && !result.error) {
        queryCache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
          ttl: cacheTTL,
        })
      }

      const queryTime = Date.now() - startTime
      return {
        ...result,
        metrics: {
          queryTime,
          rowCount: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0,
          cacheHit,
          optimized: true,
        },
      }
    } catch (error) {
      lastError = error
      if (attempt < PERFORMANCE_CONFIG.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, PERFORMANCE_CONFIG.retryDelay * attempt))
      }
    }
  }

  return {
    data: null,
    error: lastError,
    metrics: {
      queryTime: Date.now() - startTime,
      rowCount: 0,
      cacheHit,
      optimized: false,
    },
  }
}

/**
 * Optimiza consultas SELECT agregando límites y selecciones específicas
 */
export function optimizeSelectQuery(
  baseQuery: any,
  options: {
    limit?: number
    select?: string
    orderBy?: string
    filters?: Record<string, any>
  } = {}
) {
  let query = baseQuery

  // Aplicar selección específica para reducir payload
  if (options.select) {
    query = query.select(options.select)
  }

  // Aplicar filtros
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })
  }

  // Aplicar ordenamiento
  if (options.orderBy) {
    query = query.order(options.orderBy)
  }

  // Aplicar límite para evitar consultas masivas
  const limit = options.limit || 100
  query = query.limit(limit)

  return query
}

// ===================================
// FUNCIONES DE MONITOREO
// ===================================

/**
 * Obtiene métricas de performance de la conexión
 */
export async function getConnectionMetrics(): Promise<ConnectionPoolStats> {
  try {
    // Simulación de métricas (en producción se obtendría de Supabase)
    return {
      activeConnections: 5,
      idleConnections: 15,
      totalConnections: 20,
      poolUtilization: 0.25,
    }
  } catch (error) {
    console.error('Error obteniendo métricas de conexión:', error)
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      poolUtilization: 0,
    }
  }
}

/**
 * Limpia el cache de consultas
 */
export function clearQueryCache(pattern?: string): void {
  if (pattern) {
    // Limpiar entradas que coincidan con el patrón
    for (const [key] of queryCache) {
      if (key.includes(pattern)) {
        queryCache.delete(key)
      }
    }
  } else {
    // Limpiar todo el cache
    queryCache.clear()
  }
}

/**
 * Obtiene estadísticas del cache
 */
export function getCacheStats() {
  const entries = Array.from(queryCache.entries())
  const now = Date.now()

  return {
    totalEntries: entries.length,
    activeEntries: entries.filter(([_, value]) => now - value.timestamp < value.ttl).length,
    expiredEntries: entries.filter(([_, value]) => now - value.timestamp >= value.ttl).length,
    cacheSize: JSON.stringify(Object.fromEntries(queryCache)).length,
  }
}

// ===================================
// FUNCIONES DE HEALTH CHECK
// ===================================

/**
 * Verifica la salud de la conexión a Supabase
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const { data, error } = await executeOptimizedQuery(
      () =>
        supabase?.from('products').select('id').limit(1) ||
        Promise.resolve({ data: null, error: 'No client' }),
      'health-check',
      30000 // 30 segundos de cache para health check
    )

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        error: error.message,
      }
    }

    // Determinar estado basado en tiempo de respuesta
    const status = responseTime < 200 ? 'healthy' : responseTime < 1000 ? 'degraded' : 'unhealthy'

    return {
      status,
      responseTime,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ===================================
// EXPORTACIONES
// ===================================

export { PERFORMANCE_CONFIG, queryCache }
