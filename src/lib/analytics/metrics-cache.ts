/**
 * Manager de cache para métricas de analytics
 * Usa Redis para cache distribuido con TTLs apropiados
 */

import { getRedisClient } from '@/lib/integrations/redis/index'
import { AnalyticsMetrics, MetricsQueryParams } from './types'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MetricsCache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map()
  private redis = getRedisClient()

  /**
   * Obtener métricas desde cache
   */
  async get(key: string): Promise<AnalyticsMetrics | null> {
    // Intentar Redis primero
    if (this.redis) {
      try {
        const cached = await this.redis.get(key)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.timestamp < parsed.ttl * 1000) {
            return parsed.data
          }
        }
      } catch (error) {
        console.warn('Error obteniendo de Redis cache:', error)
      }
    }

    // Fallback a cache en memoria
    const memoryCached = this.memoryCache.get(key)
    if (memoryCached) {
      if (Date.now() - memoryCached.timestamp < memoryCached.ttl * 1000) {
        return memoryCached.data
      } else {
        this.memoryCache.delete(key)
      }
    }

    return null
  }

  /**
   * Almacenar métricas en cache
   */
  async set(key: string, data: AnalyticsMetrics, ttl: number): Promise<void> {
    const entry: CacheEntry<AnalyticsMetrics> = {
      data,
      timestamp: Date.now(),
      ttl,
    }

    // Almacenar en Redis
    if (this.redis) {
      try {
        await this.redis.setex(
          key,
          ttl,
          JSON.stringify({
            data,
            timestamp: entry.timestamp,
            ttl,
          })
        )
      } catch (error) {
        console.warn('Error almacenando en Redis cache:', error)
      }
    }

    // Almacenar en memoria como fallback
    this.memoryCache.set(key, entry)

    // Limpiar cache en memoria periódicamente
    if (this.memoryCache.size > 100) {
      const now = Date.now()
      for (const [k, v] of this.memoryCache.entries()) {
        if (now - v.timestamp >= v.ttl * 1000) {
          this.memoryCache.delete(k)
        }
      }
    }
  }

  /**
   * Invalidar cache por clave
   */
  async invalidate(key: string): Promise<void> {
    // Invalidar en Redis
    if (this.redis) {
      try {
        await this.redis.del(key)
      } catch (error) {
        console.warn('Error invalidando Redis cache:', error)
      }
    }

    // Invalidar en memoria
    this.memoryCache.delete(key)
  }

  /**
   * Invalidar cache por patrón (para rangos de fechas)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // Invalidar en memoria primero (rápido y seguro)
    const regex = new RegExp(pattern.replace('*', '.*'))
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key)
      }
    }

    // Invalidar en Redis (no bloqueante con timeout)
    if (this.redis) {
      try {
        // Usar Promise.race para evitar que keys() bloquee indefinidamente
        const keysPromise = this.redis.keys(pattern)
        const timeoutPromise = new Promise<string[]>((_, reject) => {
          setTimeout(() => reject(new Error('Redis keys timeout')), 2000) // 2 segundos máximo
        })
        
        const keys = await Promise.race([keysPromise, timeoutPromise]) as string[]
        
        if (keys.length > 0) {
          // Usar pipeline para eliminar múltiples keys eficientemente
          if (keys.length === 1) {
            await Promise.race([
              this.redis.del(keys[0]),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Redis del timeout')), 1000))
            ]).catch(() => {}) // Ignorar errores de timeout
          } else {
            // Para múltiples keys, eliminar en batch con timeout
            const pipeline = this.redis.pipeline()
            for (const key of keys) {
              pipeline.del(key)
            }
            await Promise.race([
              pipeline.exec(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Redis pipeline timeout')), 2000))
            ]).catch(() => {}) // Ignorar errores de timeout
          }
        }
      } catch (error) {
        // Silenciar errores de Redis - no es crítico para la inserción de eventos
        // console.warn('Error invalidando Redis cache por patrón (no crítico):', error)
      }
    }
  }

  /**
   * Generar clave de cache para métricas
   */
  generateKey(params: MetricsQueryParams, type: 'realtime' | 'daily' | 'weekly' | 'monthly'): string {
    const { startDate, endDate, userId, sessionId } = params

    let key = `analytics:${type}:`

    if (type === 'realtime') {
      key += `${startDate}:${endDate}`
    } else if (type === 'daily') {
      const date = new Date(startDate).toISOString().split('T')[0]
      key += date
    } else if (type === 'weekly') {
      const week = this.getWeekNumber(new Date(startDate))
      key += week
    } else if (type === 'monthly') {
      const month = new Date(startDate).toISOString().substring(0, 7)
      key += month
    }

    if (userId) {
      key += `:user:${userId}`
    }

    if (sessionId) {
      key += `:session:${sessionId}`
    }

    return key
  }

  /**
   * Obtener número de semana
   */
  private getWeekNumber(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return `${d.getUTCFullYear()}-W${Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)}`
  }

  /**
   * Obtener TTL apropiado según tipo
   */
  getTTL(type: 'realtime' | 'daily' | 'weekly' | 'monthly'): number {
    switch (type) {
      case 'realtime':
        return 30 // 30 segundos
      case 'daily':
        return 3600 // 1 hora
      case 'weekly':
        return 21600 // 6 horas
      case 'monthly':
        return 86400 // 24 horas
      default:
        return 300 // 5 minutos por defecto
    }
  }

  /**
   * Limpiar todo el cache
   */
  async clear(): Promise<void> {
    // Limpiar Redis
    if (this.redis) {
      try {
        const keys = await this.redis.keys('analytics:*')
        if (keys.length > 0) {
          // Eliminar keys de forma segura
          for (const key of keys) {
            await this.redis.del(key)
          }
        }
      } catch (error) {
        console.warn('Error limpiando Redis cache:', error)
      }
    }

    // Limpiar memoria
    this.memoryCache.clear()
  }
}

export const metricsCache = new MetricsCache()
