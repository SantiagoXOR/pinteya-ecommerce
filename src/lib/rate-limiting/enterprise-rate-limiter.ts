/**
 * Sistema Enterprise de Rate Limiting
 * Unifica todas las implementaciones de rate limiting con Redis y fallback en memoria
 */

import { NextRequest } from 'next/server'
import type { NextApiRequest } from 'next'
import { isRedisAvailable, enterpriseRateLimit } from '@/lib/integrations/redis'

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface EnterpriseRateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
  keyGenerator?: (request: NextRequest | NextApiRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  enableRedis?: boolean
  enableMemoryFallback?: boolean
  enableMetrics?: boolean
  enableLogging?: boolean
  customHeaders?: Record<string, string>
  onLimitReached?: (key: string, request: NextRequest | NextApiRequest) => void
}

export interface EnterpriseRateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
  error?: string
  code?: string
  source: 'redis' | 'memory' | 'error'
  metrics?: {
    responseTime: number
    cacheHit: boolean
    keyGenerated: string
  }
}

export interface RateLimitMetrics {
  totalRequests: number
  allowedRequests: number
  blockedRequests: number
  redisHits: number
  memoryFallbacks: number
  errors: number
  averageResponseTime: number
  topBlockedIPs: Array<{ ip: string; count: number }>
  topEndpoints: Array<{ endpoint: string; count: number }>
}

// =====================================================
// CONFIGURACIONES PREDEFINIDAS ENTERPRISE
// =====================================================

export const ENTERPRISE_RATE_LIMIT_CONFIGS: Record<string, EnterpriseRateLimitConfig> = {
  // Autenticación crítica
  CRITICAL_AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 3, // 3 intentos por 15 minutos
    message: 'Demasiados intentos de autenticación crítica. Intenta en 15 minutos.',
    enableRedis: true,
    enableMetrics: true,
    enableLogging: true,
  },

  // Admin APIs
  ADMIN_API: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 50, // 50 requests por 5 minutos
    message: 'Límite de requests administrativas excedido. Intenta en 5 minutos.',
    enableRedis: true,
    enableMetrics: true,
    enableLogging: true,
  },

  // APIs de pagos
  PAYMENT_API: {
    windowMs: 10 * 60 * 1000, // 10 minutos
    maxRequests: 15, // 15 requests por 10 minutos
    message: 'Límite de requests de pagos excedido. Intenta en 10 minutos.',
    enableRedis: true,
    enableMetrics: true,
    enableLogging: true,
    onLimitReached: (key, request) => {
      console.warn(`[PAYMENT_RATE_LIMIT] Límite excedido para ${key}`)
    },
  },

  // APIs públicas de productos
  PUBLIC_API: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 100, // 100 requests por minuto
    message: 'Límite de requests públicas excedido. Intenta en 1 minuto.',
    enableRedis: true,
    enableMetrics: true,
    enableLogging: false, // No loggear APIs públicas
  },

  // Webhooks
  WEBHOOK_API: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 200, // 200 webhooks por minuto
    message: 'Límite de webhooks excedido.',
    enableRedis: true,
    enableMetrics: true,
    enableLogging: true,
  },

  // Búsquedas y consultas
  SEARCH_API: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 60, // 60 búsquedas por minuto
    message: 'Límite de búsquedas excedido. Intenta en 1 minuto.',
    enableRedis: true,
    enableMetrics: true,
    enableLogging: false,
  },

  // Upload de archivos
  UPLOAD_API: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 10, // 10 uploads por 5 minutos
    message: 'Límite de uploads excedido. Intenta en 5 minutos.',
    enableRedis: true,
    enableMetrics: true,
    enableLogging: true,
  },

  // APIs de desarrollo/debug
  DEBUG_API: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 30, // 30 requests por minuto
    message: 'Límite de debug APIs excedido.',
    enableRedis: false, // Usar memoria para debug
    enableMetrics: true,
    enableLogging: true,
  },
}

// =====================================================
// GENERADORES DE CLAVES
// =====================================================

/**
 * Generador de clave por IP
 */
export function ipKeyGenerator(request: NextRequest | NextApiRequest): string {
  const ip = getClientIP(request)
  return `ip:${ip}`
}

/**
 * Generador de clave por usuario autenticado
 */
export function userKeyGenerator(request: NextRequest | NextApiRequest): string {
  // Intentar obtener user ID de diferentes fuentes
  const userId = getUserId(request)
  const ip = getClientIP(request)

  return userId ? `user:${userId}` : `ip:${ip}`
}

/**
 * Generador de clave por endpoint
 */
export function endpointKeyGenerator(request: NextRequest | NextApiRequest): string {
  const ip = getClientIP(request)
  const endpoint = getEndpoint(request)

  return `endpoint:${ip}:${endpoint}`
}

/**
 * Generador de clave híbrido (usuario + endpoint)
 */
export function hybridKeyGenerator(request: NextRequest | NextApiRequest): string {
  const userId = getUserId(request)
  const ip = getClientIP(request)
  const endpoint = getEndpoint(request)

  const userPart = userId ? `user:${userId}` : `ip:${ip}`
  return `${userPart}:${endpoint}`
}

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Obtiene la IP del cliente
 */
function getClientIP(request: NextRequest | NextApiRequest): string {
  // Intentar diferentes headers de IP
  const headers = ['x-forwarded-for', 'x-real-ip', 'x-client-ip', 'cf-connecting-ip']

  for (const header of headers) {
    let ip: string | null = null

    if ('headers' in request && typeof request.headers.get === 'function') {
      // NextRequest
      ip = (request as NextRequest).headers.get(header)
    } else if ('headers' in request) {
      // NextApiRequest
      const headerValue = (request as NextApiRequest).headers[header]
      ip = Array.isArray(headerValue) ? headerValue[0] : headerValue || null
    }

    if (ip) {
      // Tomar la primera IP si hay múltiples
      return ip.split(',')[0].trim()
    }
  }

  return 'unknown'
}

/**
 * Obtiene el ID del usuario autenticado
 */
function getUserId(request: NextRequest | NextApiRequest): string | null {
  // Intentar obtener de diferentes fuentes

  // 1. Headers de Clerk
  let userId: string | null = null

  if ('headers' in request && typeof request.headers.get === 'function') {
    // NextRequest
    userId = (request as NextRequest).headers.get('x-clerk-user-id')
  } else if ('headers' in request) {
    // NextApiRequest
    const headerValue = (request as NextApiRequest).headers['x-clerk-user-id']
    userId = Array.isArray(headerValue) ? headerValue[0] : headerValue || null
  }

  // 2. Contexto enterprise si está disponible
  if (!userId && (request as any).enterpriseAuth?.userId) {
    userId = (request as any).enterpriseAuth.userId
  }

  // 3. Contexto de autenticación si está disponible
  if (!userId && (request as any).auth?.userId) {
    userId = (request as any).auth.userId
  }

  return userId
}

/**
 * Obtiene el endpoint de la request
 */
function getEndpoint(request: NextRequest | NextApiRequest): string {
  if ('nextUrl' in request) {
    // NextRequest
    return (request as NextRequest).nextUrl.pathname
  } else if ('url' in request) {
    // NextApiRequest
    try {
      const url = new URL((request as NextApiRequest).url || '', 'http://localhost')
      return url.pathname
    } catch {
      return '/unknown'
    }
  }

  return '/unknown'
}

// =====================================================
// STORE EN MEMORIA (FALLBACK)
// =====================================================

interface MemoryRateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

class MemoryRateLimitStore {
  private store = new Map<string, MemoryRateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Limpiar entradas expiradas cada 5 minutos
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000
    )
  }

  get(key: string): MemoryRateLimitEntry | null {
    const entry = this.store.get(key)

    if (!entry) {
      return null
    }

    // Verificar si ha expirado
    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      return null
    }

    return entry
  }

  set(key: string, entry: MemoryRateLimitEntry): void {
    this.store.set(key, entry)
  }

  increment(key: string): number {
    const entry = this.get(key)
    if (entry) {
      entry.count++
      this.set(key, entry)
      return entry.count
    }
    return 0
  }

  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[MEMORY_RATE_LIMIT] Limpiadas ${cleaned} entradas expiradas`)
    }
  }

  getStats(): { entries: number; memoryUsage: number } {
    const entries = this.store.size
    const memoryUsage = JSON.stringify([...this.store.entries()]).length

    return { entries, memoryUsage }
  }

  clear(): void {
    this.store.clear()
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Instancia global del store en memoria
const memoryStore = new MemoryRateLimitStore()

// =====================================================
// MÉTRICAS GLOBALES
// =====================================================

class RateLimitMetricsCollector {
  private metrics: RateLimitMetrics = {
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    redisHits: 0,
    memoryFallbacks: 0,
    errors: 0,
    averageResponseTime: 0,
    topBlockedIPs: [],
    topEndpoints: [],
  }

  private responseTimes: number[] = []
  private blockedIPs = new Map<string, number>()
  private endpointCounts = new Map<string, number>()

  recordRequest(result: EnterpriseRateLimitResult, ip: string, endpoint: string): void {
    this.metrics.totalRequests++

    if (result.allowed) {
      this.metrics.allowedRequests++
    } else {
      this.metrics.blockedRequests++

      // Registrar IP bloqueada
      const currentCount = this.blockedIPs.get(ip) || 0
      this.blockedIPs.set(ip, currentCount + 1)
    }

    // Registrar fuente
    if (result.source === 'redis') {
      this.metrics.redisHits++
    } else if (result.source === 'memory') {
      this.metrics.memoryFallbacks++
    } else if (result.source === 'error') {
      this.metrics.errors++
    }

    // Registrar tiempo de respuesta
    if (result.metrics?.responseTime) {
      this.responseTimes.push(result.metrics.responseTime)

      // Mantener solo los últimos 1000 tiempos
      if (this.responseTimes.length > 1000) {
        this.responseTimes = this.responseTimes.slice(-1000)
      }

      // Calcular promedio
      this.metrics.averageResponseTime =
        this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
    }

    // Registrar endpoint
    const endpointCount = this.endpointCounts.get(endpoint) || 0
    this.endpointCounts.set(endpoint, endpointCount + 1)

    // Actualizar tops
    this.updateTopLists()
  }

  private updateTopLists(): void {
    // Top IPs bloqueadas
    this.metrics.topBlockedIPs = Array.from(this.blockedIPs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }))

    // Top endpoints
    this.metrics.topEndpoints = Array.from(this.endpointCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }))
  }

  getMetrics(): RateLimitMetrics {
    return { ...this.metrics }
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      redisHits: 0,
      memoryFallbacks: 0,
      errors: 0,
      averageResponseTime: 0,
      topBlockedIPs: [],
      topEndpoints: [],
    }
    this.responseTimes = []
    this.blockedIPs.clear()
    this.endpointCounts.clear()
  }
}

// Instancia global del collector de métricas
const metricsCollector = new RateLimitMetricsCollector()

// Exportar para uso externo
export { memoryStore, metricsCollector }

// =====================================================
// IMPLEMENTACIÓN REDIS
// =====================================================

// Función isRedisAvailable ahora se importa desde @/lib/redis

/**
 * Rate limiting con Redis
 */
async function rateLimitWithRedis(
  key: string,
  config: EnterpriseRateLimitConfig
): Promise<EnterpriseRateLimitResult> {
  const startTime = Date.now()

  try {
    // Usar la función importada de Redis
    const result = await enterpriseRateLimit(key, config)

    if (result) {
      return {
        allowed: result.allowed,
        limit: result.limit || config.maxRequests,
        remaining: result.remaining || 0,
        resetTime: result.resetTime || Date.now() + config.windowMs,
        retryAfter: result.allowed ? undefined : Math.ceil(config.windowMs / 1000),
        source: 'redis',
        metrics: {
          responseTime: Date.now() - startTime,
          cacheHit: true,
          keyGenerated: key,
        },
      }
    }

    // Si no hay resultado, usar implementación manual
    const { redis } = await import('@/lib/redis')
    const now = Date.now()
    const window = Math.floor(now / config.windowMs)
    const redisKey = `rate_limit:${key}:${window}`

    // Usar pipeline para operaciones atómicas
    const pipeline = redis.pipeline()
    pipeline.incr(redisKey)
    pipeline.expire(redisKey, Math.ceil(config.windowMs / 1000))

    const results = await pipeline.exec()
    const count = (results?.[0]?.[1] as number) || 1

    const remaining = Math.max(0, config.maxRequests - count)
    const resetTime = (window + 1) * config.windowMs
    const allowed = count <= config.maxRequests

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000),
      source: 'redis',
      metrics: {
        responseTime: Date.now() - startTime,
        cacheHit: true,
        keyGenerated: redisKey,
      },
    }
  } catch (error) {
    console.error('[RATE_LIMIT] Error en Redis:', error)

    // Fallback a memoria en caso de error
    return rateLimitWithMemory(key, config)
  }
}

/**
 * Rate limiting con memoria (fallback)
 */
function rateLimitWithMemory(
  key: string,
  config: EnterpriseRateLimitConfig
): EnterpriseRateLimitResult {
  const startTime = Date.now()
  const now = Date.now()

  let entry = memoryStore.get(key)

  if (!entry) {
    // Primera request en esta ventana
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now,
    }
    memoryStore.set(key, entry)

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
      source: 'memory',
      metrics: {
        responseTime: Date.now() - startTime,
        cacheHit: false,
        keyGenerated: key,
      },
    }
  }

  // Incrementar contador
  entry.count++
  memoryStore.set(key, entry)

  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
    retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000),
    source: 'memory',
    metrics: {
      responseTime: Date.now() - startTime,
      cacheHit: true,
      keyGenerated: key,
    },
  }
}

// =====================================================
// FUNCIÓN PRINCIPAL DE RATE LIMITING
// =====================================================

/**
 * Función principal de rate limiting enterprise
 */
export async function checkEnterpriseRateLimit(
  request: NextRequest | NextApiRequest,
  configName: keyof typeof ENTERPRISE_RATE_LIMIT_CONFIGS,
  customConfig?: Partial<EnterpriseRateLimitConfig>
): Promise<EnterpriseRateLimitResult> {
  const baseConfig = ENTERPRISE_RATE_LIMIT_CONFIGS[configName]

  if (!baseConfig) {
    return {
      allowed: true,
      limit: 1000,
      remaining: 999,
      resetTime: Date.now() + 60000,
      error: `Configuración '${configName}' no encontrada`,
      code: 'CONFIG_NOT_FOUND',
      source: 'error',
    }
  }

  const config = { ...baseConfig, ...customConfig }
  const keyGenerator = config.keyGenerator || hybridKeyGenerator
  const key = keyGenerator(request)

  let result: EnterpriseRateLimitResult

  try {
    // Intentar Redis primero si está habilitado
    if (config.enableRedis !== false && (await isRedisAvailable())) {
      result = await rateLimitWithRedis(key, config)
    } else {
      result = rateLimitWithMemory(key, config)
    }

    // Registrar métricas si está habilitado
    if (config.enableMetrics) {
      const ip = getClientIP(request)
      const endpoint = getEndpoint(request)
      metricsCollector.recordRequest(result, ip, endpoint)
    }

    // Logging si está habilitado
    if (config.enableLogging) {
      if (!result.allowed) {
        console.warn(
          `[RATE_LIMIT] Límite excedido para ${key}: ${result.remaining}/${result.limit}`
        )

        // Callback personalizado si está definido
        if (config.onLimitReached) {
          config.onLimitReached(key, request)
        }
      }
    }

    return result
  } catch (error) {
    console.error('[RATE_LIMIT] Error en checkEnterpriseRateLimit:', error)

    return {
      allowed: true, // Permitir en caso de error
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
      error: 'Error interno en rate limiting',
      code: 'INTERNAL_ERROR',
      source: 'error',
    }
  }
}
