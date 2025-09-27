/**
 * Sistema Enterprise de Caché Inteligente
 * Extiende el cache manager existente con funcionalidades enterprise avanzadas
 */

import { cacheManager, CACHE_CONFIGS, type CacheConfig } from '@/lib/cache-manager'
import { redisCache } from '@/lib/integrations/redis'
import { enterpriseAuditSystem } from '@/lib/security/enterprise-audit-system'
import { metricsCollector } from '@/lib/rate-limiting/enterprise-rate-limiter'
import type { EnterpriseAuthContext } from '@/lib/auth/enterprise-auth-utils'

// =====================================================
// TIPOS Y INTERFACES ENTERPRISE
// =====================================================

export interface EnterpriseCacheConfig extends CacheConfig {
  // Configuraciones enterprise
  enableAuditLogging?: boolean
  enableMetrics?: boolean
  enableInvalidation?: boolean
  enableWarmup?: boolean

  // Configuraciones de invalidación
  invalidationPatterns?: string[]
  dependentKeys?: string[]

  // Configuraciones de warmup
  warmupStrategy?: 'eager' | 'lazy' | 'scheduled'
  warmupInterval?: number

  // Configuraciones de seguridad
  securityLevel?: 'basic' | 'standard' | 'high' | 'critical'
  encryptData?: boolean

  // Configuraciones de performance
  compressionLevel?: number
  maxMemoryUsage?: number
  evictionPolicy?: 'lru' | 'lfu' | 'ttl' | 'random'
}

export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  avgResponseTime: number
  memoryUsage: number
  evictions: number
  errors: number
  lastAccess: string
}

export interface CacheInvalidationEvent {
  pattern: string
  reason: 'manual' | 'ttl_expired' | 'dependency_changed' | 'memory_pressure'
  affectedKeys: string[]
  timestamp: string
  triggeredBy?: string
}

export interface CacheWarmupJob {
  id: string
  pattern: string
  strategy: 'eager' | 'lazy' | 'scheduled'
  interval?: number
  lastRun?: string
  nextRun?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

// =====================================================
// CONFIGURACIONES ENTERPRISE PREDEFINIDAS
// =====================================================

export const ENTERPRISE_CACHE_CONFIGS: Record<string, EnterpriseCacheConfig> = {
  // Cache crítico para datos de autenticación
  AUTH_CRITICAL: {
    ...CACHE_CONFIGS.SYSTEM_CONFIG,
    ttl: 300, // 5 minutos
    prefix: 'auth_critical',
    enableAuditLogging: true,
    enableMetrics: true,
    enableInvalidation: true,
    securityLevel: 'critical',
    encryptData: true,
    compressionLevel: 9,
    evictionPolicy: 'ttl',
  },

  // Cache para datos de productos con invalidación inteligente
  PRODUCTS_SMART: {
    ...CACHE_CONFIGS.PRODUCT_DATA,
    ttl: 1800, // 30 minutos
    prefix: 'products_smart',
    enableAuditLogging: false,
    enableMetrics: true,
    enableInvalidation: true,
    enableWarmup: true,
    invalidationPatterns: ['product:*', 'category:*', 'inventory:*'],
    dependentKeys: ['categories', 'brands', 'pricing'],
    warmupStrategy: 'scheduled',
    warmupInterval: 3600, // 1 hora
    securityLevel: 'standard',
    compressionLevel: 6,
    evictionPolicy: 'lru',
  },

  // Cache para APIs públicas con alta performance
  PUBLIC_PERFORMANCE: {
    ttl: 600, // 10 minutos
    prefix: 'public_perf',
    compress: true,
    serialize: true,
    enableAuditLogging: false,
    enableMetrics: true,
    enableInvalidation: true,
    enableWarmup: true,
    warmupStrategy: 'eager',
    securityLevel: 'basic',
    compressionLevel: 3,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    evictionPolicy: 'lfu',
  },

  // Cache para sesiones de usuario
  USER_SESSIONS: {
    ttl: 7200, // 2 horas
    prefix: 'user_sessions',
    compress: false,
    serialize: true,
    enableAuditLogging: true,
    enableMetrics: true,
    enableInvalidation: true,
    securityLevel: 'high',
    encryptData: true,
    evictionPolicy: 'ttl',
  },

  // Cache para métricas y analytics
  ANALYTICS_DATA: {
    ttl: 900, // 15 minutos
    prefix: 'analytics',
    compress: true,
    serialize: true,
    enableAuditLogging: false,
    enableMetrics: true,
    enableInvalidation: true,
    enableWarmup: true,
    warmupStrategy: 'lazy',
    securityLevel: 'standard',
    compressionLevel: 8,
    evictionPolicy: 'lru',
  },
}

// =====================================================
// SISTEMA ENTERPRISE DE CACHÉ
// =====================================================

export class EnterpriseCacheSystem {
  private static instance: EnterpriseCacheSystem
  private metrics: Map<string, CacheMetrics> = new Map()
  private invalidationJobs: Map<string, CacheInvalidationEvent> = new Map()
  private warmupJobs: Map<string, CacheWarmupJob> = new Map()
  private isInitialized = false

  private constructor() {}

  public static getInstance(): EnterpriseCacheSystem {
    if (!EnterpriseCacheSystem.instance) {
      EnterpriseCacheSystem.instance = new EnterpriseCacheSystem()
    }
    return EnterpriseCacheSystem.instance
  }

  /**
   * Inicializa el sistema enterprise de caché
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Inicializar jobs de warmup programados
      await this.initializeWarmupJobs()

      // Inicializar limpieza automática
      this.startCleanupScheduler()

      // Inicializar monitoreo de memoria
      this.startMemoryMonitoring()

      this.isInitialized = true
      console.log('[ENTERPRISE_CACHE] Sistema inicializado correctamente')
    } catch (error) {
      console.error('[ENTERPRISE_CACHE] Error inicializando sistema:', error)
      throw error
    }
  }

  /**
   * Obtiene datos del caché con funcionalidades enterprise
   */
  async get<T>(
    key: string,
    config: EnterpriseCacheConfig,
    context?: EnterpriseAuthContext
  ): Promise<T | null> {
    const startTime = Date.now()
    const fullKey = this.generateKey(config, key)

    try {
      // Verificar permisos de acceso si es necesario
      if (config.securityLevel === 'critical' && context) {
        await this.verifyAccess(fullKey, context)
      }

      // Intentar obtener del caché
      const result = await cacheManager.get<T>(key, config)
      const responseTime = Date.now() - startTime

      // Actualizar métricas
      if (config.enableMetrics) {
        this.updateMetrics(fullKey, result !== null, responseTime)
      }

      // Registrar acceso si está habilitado
      if (config.enableAuditLogging && context) {
        await this.logCacheAccess('GET', fullKey, result !== null, context)
      }

      return result
    } catch (error) {
      const responseTime = Date.now() - startTime

      // Actualizar métricas de error
      if (config.enableMetrics) {
        this.updateErrorMetrics(fullKey, responseTime)
      }

      console.error('[ENTERPRISE_CACHE] Error en get:', error)
      return null
    }
  }

  /**
   * Establece datos en el caché con funcionalidades enterprise
   */
  async set<T>(
    key: string,
    value: T,
    config: EnterpriseCacheConfig,
    context?: EnterpriseAuthContext
  ): Promise<boolean> {
    const startTime = Date.now()
    const fullKey = this.generateKey(config, key)

    try {
      // Verificar permisos de escritura si es necesario
      if (config.securityLevel === 'critical' && context) {
        await this.verifyWriteAccess(fullKey, context)
      }

      // Encriptar datos si está configurado
      let processedValue = value
      if (config.encryptData) {
        processedValue = (await this.encryptData(value)) as T
      }

      // Establecer en caché
      const success = await cacheManager.set(key, processedValue, config)
      const responseTime = Date.now() - startTime

      // Actualizar métricas
      if (config.enableMetrics) {
        this.updateSetMetrics(fullKey, success, responseTime)
      }

      // Registrar escritura si está habilitado
      if (config.enableAuditLogging && context) {
        await this.logCacheAccess('SET', fullKey, success, context)
      }

      // Programar invalidación de dependencias si es necesario
      if (config.enableInvalidation && config.dependentKeys) {
        await this.scheduleDependencyInvalidation(fullKey, config.dependentKeys)
      }

      return success
    } catch (error) {
      const responseTime = Date.now() - startTime

      // Actualizar métricas de error
      if (config.enableMetrics) {
        this.updateErrorMetrics(fullKey, responseTime)
      }

      console.error('[ENTERPRISE_CACHE] Error en set:', error)
      return false
    }
  }

  /**
   * Invalidación inteligente de caché
   */
  async invalidate(
    pattern: string,
    reason: CacheInvalidationEvent['reason'] = 'manual',
    context?: EnterpriseAuthContext
  ): Promise<string[]> {
    try {
      const affectedKeys = await this.findKeysByPattern(pattern)

      // Eliminar claves del caché
      const deletionPromises = affectedKeys.map(key => redisCache.del(key))
      await Promise.all(deletionPromises)

      // Registrar evento de invalidación
      const invalidationEvent: CacheInvalidationEvent = {
        pattern,
        reason,
        affectedKeys,
        timestamp: new Date().toISOString(),
        triggeredBy: context?.userId,
      }

      this.invalidationJobs.set(
        `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invalidationEvent
      )

      // Registrar en auditoría si hay contexto
      if (context) {
        await enterpriseAuditSystem.logEnterpriseEvent(
          {
            user_id: context.userId,
            event_type: 'CACHE_INVALIDATION' as any,
            event_category: 'system_operation',
            severity: 'medium' as any,
            description: `Cache invalidation: ${pattern}`,
            metadata: {
              pattern,
              reason,
              affected_keys_count: affectedKeys.length,
              affected_keys: affectedKeys.slice(0, 10), // Primeras 10 para no saturar
            },
            ip_address: context.ipAddress,
            user_agent: context.userAgent,
          },
          context
        )
      }

      console.log(
        `[ENTERPRISE_CACHE] Invalidated ${affectedKeys.length} keys for pattern: ${pattern}`
      )
      return affectedKeys
    } catch (error) {
      console.error('[ENTERPRISE_CACHE] Error en invalidación:', error)
      return []
    }
  }

  /**
   * Warmup inteligente de caché
   */
  async warmup(
    keys: string[],
    config: EnterpriseCacheConfig,
    dataFetcher: (key: string) => Promise<any>
  ): Promise<void> {
    const jobId = `warmup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const warmupJob: CacheWarmupJob = {
      id: jobId,
      pattern: keys.join(','),
      strategy: config.warmupStrategy || 'lazy',
      interval: config.warmupInterval,
      lastRun: new Date().toISOString(),
      status: 'running',
    }

    this.warmupJobs.set(jobId, warmupJob)

    try {
      const warmupPromises = keys.map(async key => {
        try {
          // Verificar si ya existe en caché
          const existing = await this.get(key, config)
          if (existing !== null) {
            return // Ya está en caché
          }

          // Obtener datos y cachear
          const data = await dataFetcher(key)
          await this.set(key, data, config)
        } catch (error) {
          console.warn(`[ENTERPRISE_CACHE] Error warming up key ${key}:`, error)
        }
      })

      await Promise.all(warmupPromises)

      // Actualizar estado del job
      warmupJob.status = 'completed'
      warmupJob.nextRun = config.warmupInterval
        ? new Date(Date.now() + config.warmupInterval * 1000).toISOString()
        : undefined

      console.log(`[ENTERPRISE_CACHE] Warmup completed for ${keys.length} keys`)
    } catch (error) {
      warmupJob.status = 'failed'
      console.error('[ENTERPRISE_CACHE] Error en warmup:', error)
    }
  }

  /**
   * Obtiene métricas del sistema de caché
   */
  getMetrics(): Record<string, CacheMetrics> {
    return Object.fromEntries(this.metrics)
  }

  /**
   * Obtiene estadísticas de invalidación
   */
  getInvalidationStats(): CacheInvalidationEvent[] {
    return Array.from(this.invalidationJobs.values())
  }

  /**
   * Obtiene estadísticas de warmup
   */
  getWarmupStats(): CacheWarmupJob[] {
    return Array.from(this.warmupJobs.values())
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  private generateKey(config: EnterpriseCacheConfig, key: string): string {
    return `${config.prefix}:${key}`
  }

  private async verifyAccess(key: string, context: EnterpriseAuthContext): Promise<void> {
    // Verificar permisos de acceso para datos críticos
    if (
      !context.permissions.includes('cache_access') &&
      !context.permissions.includes('admin_access')
    ) {
      throw new Error('Insufficient permissions for cache access')
    }
  }

  private async verifyWriteAccess(key: string, context: EnterpriseAuthContext): Promise<void> {
    // Verificar permisos de escritura para datos críticos
    if (
      !context.permissions.includes('cache_write') &&
      !context.permissions.includes('admin_access')
    ) {
      throw new Error('Insufficient permissions for cache write')
    }
  }

  private async encryptData(data: any): Promise<any> {
    // Implementación básica de encriptación
    // En producción, usar una librería de encriptación robusta
    try {
      const jsonString = JSON.stringify(data)
      const encoded = Buffer.from(jsonString).toString('base64')
      return { encrypted: true, data: encoded }
    } catch (error) {
      console.warn('[ENTERPRISE_CACHE] Error encriptando datos:', error)
      return data
    }
  }

  private updateMetrics(key: string, hit: boolean, responseTime: number): void {
    const existing = this.metrics.get(key) || {
      hits: 0,
      misses: 0,
      hitRate: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      evictions: 0,
      errors: 0,
      lastAccess: new Date().toISOString(),
    }

    if (hit) {
      existing.hits++
    } else {
      existing.misses++
    }

    const totalRequests = existing.hits + existing.misses
    existing.hitRate = totalRequests > 0 ? existing.hits / totalRequests : 0
    existing.avgResponseTime = (existing.avgResponseTime + responseTime) / 2
    existing.lastAccess = new Date().toISOString()

    this.metrics.set(key, existing)
  }

  private updateSetMetrics(key: string, success: boolean, responseTime: number): void {
    const existing = this.metrics.get(key) || {
      hits: 0,
      misses: 0,
      hitRate: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      evictions: 0,
      errors: 0,
      lastAccess: new Date().toISOString(),
    }

    existing.avgResponseTime = (existing.avgResponseTime + responseTime) / 2
    existing.lastAccess = new Date().toISOString()

    if (!success) {
      existing.errors++
    }

    this.metrics.set(key, existing)
  }

  private updateErrorMetrics(key: string, responseTime: number): void {
    const existing = this.metrics.get(key) || {
      hits: 0,
      misses: 0,
      hitRate: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      evictions: 0,
      errors: 0,
      lastAccess: new Date().toISOString(),
    }

    existing.errors++
    existing.avgResponseTime = (existing.avgResponseTime + responseTime) / 2
    existing.lastAccess = new Date().toISOString()

    this.metrics.set(key, existing)
  }

  private async logCacheAccess(
    operation: 'GET' | 'SET',
    key: string,
    success: boolean,
    context: EnterpriseAuthContext
  ): Promise<void> {
    try {
      await enterpriseAuditSystem.logEnterpriseEvent(
        {
          user_id: context.userId,
          event_type: 'CACHE_ACCESS' as any,
          event_category: 'system_operation',
          severity: 'low' as any,
          description: `Cache ${operation}: ${key}`,
          metadata: {
            operation,
            key,
            success,
            cache_system: 'enterprise',
          },
          ip_address: context.ipAddress,
          user_agent: context.userAgent,
        },
        context
      )
    } catch (error) {
      console.warn('[ENTERPRISE_CACHE] Error logging cache access:', error)
    }
  }

  private async findKeysByPattern(pattern: string): Promise<string[]> {
    try {
      // Usar Redis SCAN para encontrar claves por patrón
      const keys: string[] = []
      const client = redisCache['client'] // Acceder al cliente Redis interno

      if (client && typeof client.scanStream === 'function') {
        const stream = client.scanStream({
          match: pattern,
          count: 100,
        })

        return new Promise((resolve, reject) => {
          stream.on('data', (resultKeys: string[]) => {
            keys.push(...resultKeys)
          })

          stream.on('end', () => {
            resolve(keys)
          })

          stream.on('error', (error: Error) => {
            reject(error)
          })
        })
      }

      return keys
    } catch (error) {
      console.error('[ENTERPRISE_CACHE] Error finding keys by pattern:', error)
      return []
    }
  }

  private async scheduleDependencyInvalidation(
    key: string,
    dependentKeys: string[]
  ): Promise<void> {
    // Programar invalidación de claves dependientes
    // Esto se podría implementar con un job queue como Bull o Agenda
    setTimeout(async () => {
      for (const depKey of dependentKeys) {
        await this.invalidate(depKey, 'dependency_changed')
      }
    }, 1000) // 1 segundo de delay
  }

  private async initializeWarmupJobs(): Promise<void> {
    // Inicializar jobs de warmup programados
    // En una implementación real, esto se cargaría desde una base de datos
    console.log('[ENTERPRISE_CACHE] Warmup jobs initialized')
  }

  private startCleanupScheduler(): void {
    // Limpiar métricas antiguas cada hora
    setInterval(
      () => {
        const oneHourAgo = Date.now() - 60 * 60 * 1000

        for (const [key, metrics] of this.metrics.entries()) {
          const lastAccessTime = new Date(metrics.lastAccess).getTime()
          if (lastAccessTime < oneHourAgo) {
            this.metrics.delete(key)
          }
        }
      },
      60 * 60 * 1000
    ) // 1 hora
  }

  private startMemoryMonitoring(): void {
    // Monitorear uso de memoria cada 5 minutos
    setInterval(
      () => {
        const memoryUsage = process.memoryUsage()

        if (memoryUsage.heapUsed > 500 * 1024 * 1024) {
          // 500MB
          console.warn('[ENTERPRISE_CACHE] High memory usage detected:', memoryUsage)
          // Aquí se podría implementar limpieza automática
        }
      },
      5 * 60 * 1000
    ) // 5 minutos
  }
}

// =====================================================
// INSTANCIA SINGLETON Y UTILIDADES
// =====================================================

export const enterpriseCacheSystem = EnterpriseCacheSystem.getInstance()

/**
 * Funciones de utilidad para casos comunes
 */
export const EnterpriseCacheUtils = {
  /**
   * Cache para datos de autenticación críticos
   */
  async cacheAuthData<T>(
    key: string,
    fetcher: () => Promise<T>,
    context: EnterpriseAuthContext
  ): Promise<T> {
    const cached = await enterpriseCacheSystem.get<T>(
      key,
      ENTERPRISE_CACHE_CONFIGS.AUTH_CRITICAL,
      context
    )
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    await enterpriseCacheSystem.set(key, data, ENTERPRISE_CACHE_CONFIGS.AUTH_CRITICAL, context)
    return data
  },

  /**
   * Cache inteligente para productos
   */
  async cacheProductData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = await enterpriseCacheSystem.get<T>(key, ENTERPRISE_CACHE_CONFIGS.PRODUCTS_SMART)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    await enterpriseCacheSystem.set(key, data, ENTERPRISE_CACHE_CONFIGS.PRODUCTS_SMART)
    return data
  },

  /**
   * Cache de alta performance para APIs públicas
   */
  async cachePublicData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = await enterpriseCacheSystem.get<T>(
      key,
      ENTERPRISE_CACHE_CONFIGS.PUBLIC_PERFORMANCE
    )
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    await enterpriseCacheSystem.set(key, data, ENTERPRISE_CACHE_CONFIGS.PUBLIC_PERFORMANCE)
    return data
  },

  /**
   * Invalidación masiva por patrones
   */
  async invalidateByPatterns(patterns: string[], context?: EnterpriseAuthContext): Promise<void> {
    const invalidationPromises = patterns.map(pattern =>
      enterpriseCacheSystem.invalidate(pattern, 'manual', context)
    )
    await Promise.all(invalidationPromises)
  },
}
