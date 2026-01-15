// ===================================
// PINTEYA E-COMMERCE - REDIS CONFIGURATION
// ===================================

import Redis from 'ioredis'
import { logger, LogLevel, LogCategory } from '../../enterprise/logger'

// Configuración de Redis
const getRedisConfig = () => {
  const host = process.env.REDIS_HOST || 'localhost'
  const isUpstash = host.includes('.upstash.io')
  const useTLS = process.env.REDIS_TLS === 'true' || isUpstash

  return {
    host,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    // Habilitar TLS para Upstash u otros proveedores que lo requieran
    ...(useTLS && {
      tls: {
        rejectUnauthorized: false, // Upstash usa certificados válidos, pero esto permite conexión
      },
    }),
  }
}

const REDIS_CONFIG = getRedisConfig()

// Mock Redis para desarrollo cuando Redis no está disponible
class MockRedis {
  private storage = new Map<string, any>()

  async get(key: string): Promise<string | null> {
    return this.storage.get(key) || null
  }

  async set(key: string, value: any, ...args: any[]): Promise<'OK'> {
    this.storage.set(key, value)
    return 'OK'
  }

  async del(key: string): Promise<number> {
    const existed = this.storage.has(key)
    this.storage.delete(key)
    return existed ? 1 : 0
  }

  async exists(key: string): Promise<number> {
    return this.storage.has(key) ? 1 : 0
  }

  async incr(key: string): Promise<number> {
    const current = parseInt(this.storage.get(key) || '0')
    const newValue = current + 1
    this.storage.set(key, newValue.toString())
    return newValue
  }

  async expire(key: string, seconds: number): Promise<number> {
    // Mock: no implementamos expiración real
    return 1
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    // Mock: setex es equivalente a set + expire
    this.storage.set(key, value)
    return 'OK'
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return Array.from(this.storage.keys()).filter(key => regex.test(key))
  }

  async flushall(): Promise<'OK'> {
    this.storage.clear()
    return 'OK'
  }

  // Métodos de listas para métricas
  async lpush(key: string, ...values: string[]): Promise<number> {
    const list = this.storage.get(key) || []
    list.unshift(...values)
    this.storage.set(key, list)
    return list.length
  }

  async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    const list = this.storage.get(key) || []
    const trimmed = list.slice(start, stop + 1)
    this.storage.set(key, trimmed)
    return 'OK'
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.storage.get(key) || []
    if (stop === -1) {
      return list.slice(start)
    }
    return list.slice(start, stop + 1)
  }

  async ttl(key: string): Promise<number> {
    // Mock: retornar -1 (sin expiración) o un valor fijo
    return this.storage.has(key) ? 3600 : -2
  }

  // Pipeline mock para operaciones batch
  pipeline(): MockPipeline {
    return new MockPipeline(this)
  }

  // Métodos de conexión mock
  async connect(): Promise<void> {
    console.log('[REDIS MOCK] Conectado (simulado)')
  }

  disconnect(): void {
    console.log('[REDIS MOCK] Desconectado (simulado)')
  }

  on(event: string, callback: Function): this {
    return this
  }

  async quit(): Promise<'OK'> {
    console.log('[REDIS MOCK] Desconectado (quit simulado)')
    return 'OK'
  }
}

// Mock Pipeline para operaciones batch
class MockPipeline {
  private commands: Array<{ method: string; args: any[] }> = []
  private redis: MockRedis

  constructor(redis: MockRedis) {
    this.redis = redis
  }

  get(key: string): this {
    this.commands.push({ method: 'get', args: [key] })
    return this
  }

  ttl(key: string): this {
    this.commands.push({ method: 'ttl', args: [key] })
    return this
  }

  incr(key: string): this {
    this.commands.push({ method: 'incr', args: [key] })
    return this
  }

  expire(key: string, seconds: number): this {
    this.commands.push({ method: 'expire', args: [key, seconds] })
    return this
  }

  async exec(): Promise<Array<[Error | null, any]>> {
    const results: Array<[Error | null, any]> = []

    for (const command of this.commands) {
      try {
        const result = await (this.redis as any)[command.method](...command.args)
        results.push([null, result])
      } catch (error) {
        results.push([error as Error, null])
      }
    }

    this.commands = [] // Limpiar comandos después de ejecutar
    return results
  }
}

// Cliente Redis singleton
let redisClient: Redis | MockRedis | null = null
let isUsingMock = false

/**
 * Obtiene o crea la instancia de Redis
 */
export function getRedisClient(): Redis | MockRedis {
  if (!redisClient) {
    // Verificar si Redis está deshabilitado
    if (process.env.DISABLE_REDIS === 'true') {
      console.log('[REDIS] Redis deshabilitado por configuración, usando mock')
      redisClient = new MockRedis()
      isUsingMock = true
      return redisClient
    }

    try {
      redisClient = new Redis(REDIS_CONFIG)

      // Event listeners para logging
      redisClient.on('connect', () => {
        console.log('[REDIS] ✅ Connected successfully')
        logger.info(LogCategory.API, 'Redis connected successfully')
        isUsingMock = false
      })

      redisClient.on('error', error => {
        console.error('[REDIS] ❌ Connection error:', error.message)
        logger.error(LogCategory.API, 'Redis connection error', error)
        // Si hay error de conexión, usar mock
        if (!isUsingMock) {
          console.log('[REDIS] ⚠️ Cambiando a modo mock debido a error de conexión')
          redisClient = new MockRedis()
          isUsingMock = true
        }
      })

      redisClient.on('close', () => {
        console.log('[REDIS] ⚠️ Connection closed')
        logger.warn(LogCategory.API, 'Redis connection closed')
      })

      redisClient.on('reconnecting', () => {
        console.log('[REDIS] 🔄 Reconnecting...')
        logger.info(LogCategory.API, 'Redis reconnecting...')
      })

      // Intentar conectar inmediatamente (forzar conexión con lazyConnect)
      // Esto asegura que Redis intente conectarse al menos una vez
      if (typeof window === 'undefined') {
        // Solo en el servidor
        redisClient
          .connect()
          .then(() => {
            console.log('[REDIS] ✅ Lazy connection successful')
          })
          .catch((error: Error) => {
            console.error('[REDIS] ❌ Lazy connection failed:', error.message)
            // Si falla la conexión lazy, usar mock
            if (!isUsingMock) {
              redisClient = new MockRedis()
              isUsingMock = true
            }
          })
      }
    } catch (error: any) {
      console.log('[REDIS] ❌ Error inicializando Redis, usando mock:', error.message)
      redisClient = new MockRedis()
      isUsingMock = true
    }
  }

  return redisClient
}

/**
 * Verifica si Redis está disponible
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    if (isUsingMock) {
      return false // Mock no es Redis real
    }
    const client = getRedisClient()
    if (client instanceof MockRedis) {
      return false
    }
    await (client as Redis).ping()
    return true
  } catch (error) {
    logger.error(LogCategory.API, 'Redis health check failed', error as Error)
    return false
  }
}

/**
 * Cierra la conexión de Redis
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    logger.info(LogCategory.API, 'Redis connection closed gracefully')
  }
}

/**
 * Operaciones de cache con manejo de errores
 */
export class RedisCache {
  private client: Redis

  constructor() {
    this.client = getRedisClient()
  }

  /**
   * Obtiene un valor del cache
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key)
      logger.info(LogCategory.API, 'Cache get operation')
      return value
    } catch (error) {
      logger.error(LogCategory.API, 'Cache get operation failed', error as Error)
      return null
    }
  }

  /**
   * Establece un valor en el cache
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value)
      } else {
        await this.client.set(key, value)
      }

      logger.info(LogCategory.API, 'Cache set operation')
      return true
    } catch (error) {
      logger.error(LogCategory.API, 'Cache set operation failed', error as Error)
      return false
    }
  }

  /**
   * Elimina un valor del cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key)
      logger.info(LogCategory.API, 'Cache delete operation')
      return result > 0
    } catch (error) {
      logger.error(LogCategory.API, 'Cache delete operation failed', error as Error)
      return false
    }
  }

  /**
   * Incrementa un contador atómicamente
   */
  async incr(key: string): Promise<number | null> {
    try {
      const result = await this.client.incr(key)
      logger.info(LogCategory.API, 'Cache increment operation')
      return result
    } catch (error) {
      logger.error(LogCategory.API, 'Cache increment operation failed', error as Error)
      return null
    }
  }

  /**
   * Establece TTL para una clave existente
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttlSeconds)
      logger.info(LogCategory.API, 'Cache expire operation')
      return result === 1
    } catch (error) {
      logger.error(LogCategory.API, 'Cache expire operation failed', error as Error)
      return false
    }
  }

  /**
   * Obtiene TTL restante de una clave
   */
  async ttl(key: string): Promise<number | null> {
    try {
      const result = await this.client.ttl(key)
      logger.info(LogCategory.API, 'Cache TTL check')
      return result
    } catch (error) {
      logger.error(LogCategory.API, 'Cache TTL check failed', error as Error)
      return null
    }
  }
}

// Instancia singleton del cache
export const redisCache = new RedisCache()

// Funciones de utilidad para rate limiting
export async function getRateLimitInfo(key: string): Promise<{
  count: number
  ttl: number
} | null> {
  try {
    const client = getRedisClient()
    const pipeline = client.pipeline()
    pipeline.get(key)
    pipeline.ttl(key)

    const results = await pipeline.exec()

    if (!results || results.length !== 2) {
      return null
    }

    const [countResult, ttlResult] = results
    const count = parseInt(countResult[1] as string) || 0
    const ttl = ttlResult[1] as number

    return { count, ttl }
  } catch (error) {
    logger.error(LogCategory.API, 'Rate limit info retrieval failed', error as Error)
    return null
  }
}

export async function incrementRateLimit(
  key: string,
  windowSeconds: number
): Promise<{
  count: number
  ttl: number
  isNewWindow: boolean
} | null> {
  try {
    const client = getRedisClient()
    const pipeline = client.pipeline()

    // Incrementar contador
    pipeline.incr(key)
    // Establecer TTL solo si es la primera vez
    pipeline.expire(key, windowSeconds)
    // Obtener TTL actual
    pipeline.ttl(key)

    const results = await pipeline.exec()

    if (!results || results.length !== 3) {
      return null
    }

    const count = results[0][1] as number
    const ttl = results[2][1] as number
    const isNewWindow = count === 1

    return { count, ttl, isNewWindow }
  } catch (error) {
    logger.error(LogCategory.API, 'Rate limit increment failed', error as Error)
    return null
  }
}

// =====================================================
// FUNCIONES ENTERPRISE PARA RATE LIMITING
// =====================================================

/**
 * Rate limiting enterprise con sliding window
 */
export async function enterpriseRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{
  allowed: boolean
  count: number
  remaining: number
  resetTime: number
  retryAfter?: number
} | null> {
  try {
    const client = getRedisClient()
    const now = Date.now()
    const window = Math.floor(now / windowMs)
    const redisKey = `rate_limit:${key}:${window}`

    // Usar pipeline para operaciones atómicas
    const pipeline = client.pipeline()
    pipeline.incr(redisKey)
    pipeline.expire(redisKey, Math.ceil(windowMs / 1000))

    const results = await pipeline.exec()

    if (!results || results.length !== 2) {
      return null
    }

    const count = results[0][1] as number
    const remaining = Math.max(0, maxRequests - count)
    const resetTime = (window + 1) * windowMs
    const allowed = count <= maxRequests

    const result = {
      allowed,
      count,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000),
    }

    logger.debug(LogCategory.API, 'Enterprise rate limit check', {
      key: redisKey,
      count,
      maxRequests,
      allowed,
      remaining,
    })

    return result
  } catch (error) {
    logger.error(LogCategory.API, 'Enterprise rate limit failed', error as Error)
    return null
  }
}

/**
 * Rate limiting con múltiples ventanas (más preciso)
 */
export async function slidingWindowRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
  precision: number = 10
): Promise<{
  allowed: boolean
  count: number
  remaining: number
  resetTime: number
} | null> {
  try {
    const client = getRedisClient()
    const now = Date.now()
    const windowSize = Math.floor(windowMs / precision)
    const currentWindow = Math.floor(now / windowSize)

    // Limpiar ventanas antiguas y contar requests en ventana actual
    const pipeline = client.pipeline()

    // Eliminar ventanas más antiguas que el período de rate limiting
    for (let i = 1; i <= precision; i++) {
      const oldWindow = currentWindow - precision - i
      pipeline.del(`${key}:${oldWindow}`)
    }

    // Incrementar contador para ventana actual
    const currentKey = `${key}:${currentWindow}`
    pipeline.incr(currentKey)
    pipeline.expire(currentKey, Math.ceil(windowMs / 1000))

    // Obtener contadores de todas las ventanas en el período
    for (let i = 0; i < precision; i++) {
      const windowKey = `${key}:${currentWindow - i}`
      pipeline.get(windowKey)
    }

    const results = await pipeline.exec()

    if (!results) {
      return null
    }

    // Calcular total de requests en la ventana deslizante
    let totalCount = 0
    const countResults = results.slice(precision + 2) // Saltar operaciones de limpieza e incremento

    for (const result of countResults) {
      if (result[1]) {
        totalCount += parseInt(result[1] as string)
      }
    }

    const remaining = Math.max(0, maxRequests - totalCount)
    const allowed = totalCount <= maxRequests
    const resetTime = (currentWindow + 1) * windowSize

    return {
      allowed,
      count: totalCount,
      remaining,
      resetTime,
    }
  } catch (error) {
    logger.error(LogCategory.API, 'Sliding window rate limit failed', error as Error)
    return null
  }
}

/**
 * Obtener estadísticas de rate limiting
 */
export async function getRateLimitStats(pattern: string = 'rate_limit:*'): Promise<{
  totalKeys: number
  activeWindows: number
  topKeys: Array<{ key: string; count: number; ttl: number }>
} | null> {
  try {
    const client = getRedisClient()
    const keys = await client.keys(pattern)

    if (keys.length === 0) {
      return {
        totalKeys: 0,
        activeWindows: 0,
        topKeys: [],
      }
    }

    // Obtener información de las claves más activas
    const pipeline = client.pipeline()
    keys.forEach(key => {
      pipeline.get(key)
      pipeline.ttl(key)
    })

    const results = await pipeline.exec()

    if (!results) {
      return null
    }

    const keyStats: Array<{ key: string; count: number; ttl: number }> = []

    for (let i = 0; i < keys.length; i++) {
      const countResult = results[i * 2]
      const ttlResult = results[i * 2 + 1]

      if (countResult[1] && ttlResult[1]) {
        keyStats.push({
          key: keys[i],
          count: parseInt(countResult[1] as string),
          ttl: ttlResult[1] as number,
        })
      }
    }

    // Ordenar por count descendente
    keyStats.sort((a, b) => b.count - a.count)

    return {
      totalKeys: keys.length,
      activeWindows: keyStats.filter(stat => stat.ttl > 0).length,
      topKeys: keyStats.slice(0, 10), // Top 10
    }
  } catch (error) {
    logger.error(LogCategory.API, 'Rate limit stats failed', error as Error)
    return null
  }
}

/**
 * Limpiar claves de rate limiting expiradas
 */
export async function cleanupRateLimitKeys(pattern: string = 'rate_limit:*'): Promise<number> {
  try {
    const client = getRedisClient()
    const keys = await client.keys(pattern)

    if (keys.length === 0) {
      return 0
    }

    // Verificar TTL de cada clave y eliminar las expiradas
    const pipeline = client.pipeline()
    keys.forEach(key => {
      pipeline.ttl(key)
    })

    const ttlResults = await pipeline.exec()

    if (!ttlResults) {
      return 0
    }

    const expiredKeys: string[] = []

    for (let i = 0; i < keys.length; i++) {
      const ttlResult = ttlResults[i]
      if (ttlResult[1] === -2) {
        // Clave expirada
        expiredKeys.push(keys[i])
      }
    }

    if (expiredKeys.length > 0) {
      await client.del(...expiredKeys)
      logger.info(LogCategory.API, `Cleaned up ${expiredKeys.length} expired rate limit keys`)
    }

    return expiredKeys.length
  } catch (error) {
    logger.error(LogCategory.API, 'Rate limit cleanup failed', error as Error)
    return 0
  }
}

// Exportar cliente Redis para uso directo
export const redis = getRedisClient()
