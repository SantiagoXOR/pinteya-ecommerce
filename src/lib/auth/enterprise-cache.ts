/**
 * Sistema de Cache Enterprise
 * Cache inteligente para utilidades de autenticación con invalidación automática
 */

import type { EnterpriseUser, EnterpriseAuthContext } from './enterprise-auth-utils'

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

interface CacheEntry<T> {
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
  memoryUsage: number
}

// =====================================================
// CONFIGURACIÓN DE CACHE
// =====================================================

const CACHE_CONFIG = {
  // TTL por tipo de dato (en milisegundos)
  ttl: {
    user: 5 * 60 * 1000, // 5 minutos para datos de usuario
    permissions: 10 * 60 * 1000, // 10 minutos para permisos
    session: 2 * 60 * 1000, // 2 minutos para datos de sesión
    auth: 1 * 60 * 1000, // 1 minuto para contexto de auth
    stats: 30 * 60 * 1000, // 30 minutos para estadísticas
  },

  // Límites de cache
  maxEntries: 1000,
  cleanupInterval: 5 * 60 * 1000, // Limpiar cada 5 minutos

  // Prefijos para diferentes tipos de datos
  prefixes: {
    user: 'user:',
    permissions: 'perms:',
    session: 'session:',
    auth: 'auth:',
    stats: 'stats:',
  },
}

// =====================================================
// IMPLEMENTACIÓN DE CACHE EN MEMORIA
// =====================================================

class EnterpriseCache {
  private cache = new Map<string, CacheEntry<any>>()
  private stats = {
    hits: 0,
    misses: 0,
  }
  private cleanupTimer?: NodeJS.Timeout

  constructor() {
    this.startCleanupTimer()
  }

  /**
   * Obtiene un valor del cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Verificar si ha expirado
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.data
  }

  /**
   * Almacena un valor en el cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Verificar límite de entradas
    if (this.cache.size >= CACHE_CONFIG.maxEntries) {
      this.evictOldest()
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || CACHE_CONFIG.ttl.user,
      key,
    }

    this.cache.set(key, entry)
  }

  /**
   * Elimina una entrada del cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Elimina entradas por patrón
   */
  deletePattern(pattern: string): number {
    let deleted = 0
    const regex = new RegExp(pattern.replace('*', '.*'))

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deleted++
      }
    }

    return deleted
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    this.cache.clear()
    this.stats.hits = 0
    this.stats.misses = 0
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0

    // Estimar uso de memoria (aproximado)
    const memoryUsage = JSON.stringify([...this.cache.entries()]).length

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage,
    }
  }

  /**
   * Elimina entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[ENTERPRISE_CACHE] Limpiadas ${cleaned} entradas expiradas`)
    }
  }

  /**
   * Elimina la entrada más antigua
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Inicia el timer de limpieza automática
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, CACHE_CONFIG.cleanupInterval)
  }

  /**
   * Detiene el timer de limpieza
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.clear()
  }
}

// Instancia global del cache
const enterpriseCache = new EnterpriseCache()

// =====================================================
// FUNCIONES DE CACHE ESPECÍFICAS
// =====================================================

/**
 * Cache para datos de usuario
 */
export function cacheUser(userId: string, user: EnterpriseUser): void {
  const key = CACHE_CONFIG.prefixes.user + userId
  enterpriseCache.set(key, user, CACHE_CONFIG.ttl.user)
}

export function getCachedUser(userId: string): EnterpriseUser | null {
  const key = CACHE_CONFIG.prefixes.user + userId
  return enterpriseCache.get<EnterpriseUser>(key)
}

export function invalidateUser(userId: string): void {
  const key = CACHE_CONFIG.prefixes.user + userId
  enterpriseCache.delete(key)
}

/**
 * Cache para permisos de usuario
 */
export function cacheUserPermissions(userId: string, permissions: string[]): void {
  const key = CACHE_CONFIG.prefixes.permissions + userId
  enterpriseCache.set(key, permissions, CACHE_CONFIG.ttl.permissions)
}

export function getCachedUserPermissions(userId: string): string[] | null {
  const key = CACHE_CONFIG.prefixes.permissions + userId
  return enterpriseCache.get<string[]>(key)
}

export function invalidateUserPermissions(userId: string): void {
  const key = CACHE_CONFIG.prefixes.permissions + userId
  enterpriseCache.delete(key)
}

/**
 * Cache para contexto de autenticación
 */
export function cacheAuthContext(userId: string, context: EnterpriseAuthContext): void {
  const key = CACHE_CONFIG.prefixes.auth + userId
  enterpriseCache.set(key, context, CACHE_CONFIG.ttl.auth)
}

export function getCachedAuthContext(userId: string): EnterpriseAuthContext | null {
  const key = CACHE_CONFIG.prefixes.auth + userId
  return enterpriseCache.get<EnterpriseAuthContext>(key)
}

export function invalidateAuthContext(userId: string): void {
  const key = CACHE_CONFIG.prefixes.auth + userId
  enterpriseCache.delete(key)
}

/**
 * Cache para estadísticas
 */
export function cacheStats(key: string, stats: any): void {
  const cacheKey = CACHE_CONFIG.prefixes.stats + key
  enterpriseCache.set(cacheKey, stats, CACHE_CONFIG.ttl.stats)
}

export function getCachedStats(key: string): any | null {
  const cacheKey = CACHE_CONFIG.prefixes.stats + key
  return enterpriseCache.get(cacheKey)
}

/**
 * Invalidación masiva por usuario
 */
export function invalidateUserCache(userId: string): void {
  invalidateUser(userId)
  invalidateUserPermissions(userId)
  invalidateAuthContext(userId)

  // Invalidar también datos de sesión
  const sessionKey = CACHE_CONFIG.prefixes.session + userId
  enterpriseCache.delete(sessionKey)
}

/**
 * Invalidación por patrón
 */
export function invalidateCachePattern(pattern: string): number {
  return enterpriseCache.deletePattern(pattern)
}

/**
 * Obtener estadísticas del cache
 */
export function getCacheStats(): CacheStats {
  return enterpriseCache.getStats()
}

/**
 * Limpiar todo el cache
 */
export function clearCache(): void {
  enterpriseCache.clear()
}

/**
 * Función de utilidad para cache con callback
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Intentar obtener del cache
  const cached = enterpriseCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Si no está en cache, ejecutar fetcher
  const data = await fetcher()

  // Almacenar en cache
  enterpriseCache.set(key, data, ttl)

  return data
}

/**
 * Middleware para cache automático de respuestas
 */
export function withResponseCache(ttl: number = CACHE_CONFIG.ttl.user) {
  return function (handler: Function) {
    return async (request: any, ...args: any[]) => {
      // Generar clave de cache basada en URL y parámetros
      const url = request.url || request.nextUrl?.pathname || 'unknown'
      const method = request.method || 'GET'
      const cacheKey = `response:${method}:${url}`

      // Solo cachear GET requests
      if (method === 'GET') {
        const cached = enterpriseCache.get(cacheKey)
        if (cached) {
          return cached
        }
      }

      // Ejecutar handler
      const response = await handler(request, ...args)

      // Cachear respuesta exitosa para GET requests
      if (method === 'GET' && response && response.status === 200) {
        enterpriseCache.set(cacheKey, response, ttl)
      }

      return response
    }
  }
}

// Exportar instancia del cache para uso avanzado
export { enterpriseCache }
