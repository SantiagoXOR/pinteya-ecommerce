// ===================================
// PINTEYA E-COMMERCE - ADVANCED RATE LIMITER
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { incrementRateLimit, isRedisAvailable } from '../../integrations/redis'
import { logger, LogLevel, LogCategory } from '../logger'
import { metricsCollector } from '../metrics'

// Configuración de rate limiting
export interface RateLimitConfig {
  windowMs: number // Ventana de tiempo en milisegundos
  maxRequests: number // Máximo número de requests por ventana
  keyGenerator?: (req: NextRequest) => string // Generador de clave personalizado
  skipSuccessfulRequests?: boolean // No contar requests exitosos
  skipFailedRequests?: boolean // No contar requests fallidos
  message?: string // Mensaje de error personalizado
  standardHeaders?: boolean // Incluir headers estándar
  legacyHeaders?: boolean // Incluir headers legacy
}

// Configuraciones predefinidas
export const RATE_LIMIT_CONFIGS = {
  // Para APIs de pagos críticas
  PAYMENT_API: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10, // 10 requests por minuto por IP
    message: 'Demasiadas solicitudes de pago. Intenta nuevamente en un minuto.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Para webhooks de MercadoPago
  WEBHOOK_API: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100, // 100 requests por minuto por IP
    message: 'Demasiadas notificaciones de webhook. Verifica la configuración.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Para usuarios autenticados
  AUTHENTICATED_USER: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30, // 30 requests por minuto por usuario
    message: 'Límite de requests excedido. Intenta nuevamente en un minuto.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Para IPs generales
  GENERAL_IP: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 50, // 50 requests por minuto por IP
    message: 'Demasiadas solicitudes desde esta IP. Intenta nuevamente en un minuto.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Para APIs de consulta (menos restrictivo)
  QUERY_API: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100, // 100 requests por minuto por IP
    message: 'Límite de consultas excedido. Intenta nuevamente en un minuto.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Para APIs administrativas
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 100, // 100 requests por ventana (aumentado para testing)
    message: 'Demasiadas requests administrativas. Intenta de nuevo en 5 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
  },
} as const

// Resultado del rate limiting
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

// Fallback en memoria para cuando Redis no esté disponible
const memoryStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Generador de clave por defecto (basado en IP)
 */
function defaultKeyGenerator(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  return `rate_limit:ip:${ip}`
}

/**
 * Generador de clave por usuario autenticado
 */
export function userKeyGenerator(userId: string): (req: NextRequest) => string {
  return () => `rate_limit:user:${userId}`
}

/**
 * Generador de clave por endpoint específico
 */
export function endpointKeyGenerator(endpoint: string): (req: NextRequest) => string {
  return (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    return `rate_limit:endpoint:${endpoint}:ip:${ip}`
  }
}

/**
 * Rate limiter principal con Redis
 */
async function rateLimitWithRedis(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const windowSeconds = Math.floor(config.windowMs / 1000)

  try {
    const result = await incrementRateLimit(key, windowSeconds)

    if (!result) {
      throw new Error('Redis operation failed')
    }

    const { count, ttl, isNewWindow } = result
    const remaining = Math.max(0, config.maxRequests - count)
    const resetTime = Date.now() + ttl * 1000

    // Log de la operación
    logger.info(LogCategory.SECURITY, 'Rate limit check')

    if (count > config.maxRequests) {
      // Límite excedido
      logger.warn(LogCategory.SECURITY, 'Rate limit exceeded', {
        key,
        count,
        limit: config.maxRequests,
        retryAfter: ttl,
      })

      // ✅ NUEVO: Registrar métricas de rate limiting
      const endpoint = key.includes('endpoint:') ? key.split(':')[2] : 'unknown'
      await metricsCollector.recordRateLimit(endpoint, true, 0, config.maxRequests)

      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter: ttl,
      }
    }

    // ✅ NUEVO: Registrar métricas de rate limiting exitoso
    const endpoint = key.includes('endpoint:') ? key.split(':')[2] : 'unknown'
    await metricsCollector.recordRateLimit(endpoint, false, remaining, config.maxRequests)

    return {
      success: true,
      limit: config.maxRequests,
      remaining,
      resetTime,
    }
  } catch (error) {
    logger.error(LogCategory.SECURITY, 'Redis rate limiting failed', error as Error)
    throw error
  }
}

/**
 * Rate limiter fallback en memoria
 */
function rateLimitWithMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs

  // Limpiar entradas expiradas
  for (const [k, v] of memoryStore.entries()) {
    if (v.resetTime < now) {
      memoryStore.delete(k)
    }
  }

  const entry = memoryStore.get(key)

  if (!entry || entry.resetTime < now) {
    // Nueva ventana
    const resetTime = now + config.windowMs
    memoryStore.set(key, { count: 1, resetTime })

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime,
    }
  }

  // Incrementar contador
  entry.count++

  const remaining = Math.max(0, config.maxRequests - entry.count)
  const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

  if (entry.count > config.maxRequests) {
    logger.warn(LogCategory.SECURITY, 'Rate limit exceeded (memory fallback)', {
      key,
      count: entry.count,
      limit: config.maxRequests,
      retryAfter,
    })

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    }
  }

  return {
    success: true,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
  }
}

/**
 * Función principal de rate limiting
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator
  const key = keyGenerator(req)

  try {
    // Intentar usar Redis primero
    if (await isRedisAvailable()) {
      return await rateLimitWithRedis(key, config)
    } else {
      // Fallback a memoria
      logger.warn(LogCategory.SECURITY, 'Using memory fallback for rate limiting', { key })
      return rateLimitWithMemory(key, config)
    }
  } catch (error) {
    // En caso de error, usar fallback en memoria
    logger.error(LogCategory.SECURITY, 'Rate limiting error, using memory fallback', error as Error)
    return rateLimitWithMemory(key, config)
  }
}

/**
 * Middleware de rate limiting para Next.js
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const result = await checkRateLimit(req, config)

    if (!result.success) {
      // Crear respuesta de error 429
      const response = NextResponse.json(
        {
          error: config.message || 'Too many requests',
          retryAfter: result.retryAfter,
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime,
        },
        { status: 429 }
      )

      // Agregar headers de rate limiting
      if (config.standardHeaders) {
        response.headers.set('RateLimit-Limit', result.limit.toString())
        response.headers.set('RateLimit-Remaining', result.remaining.toString())
        response.headers.set('RateLimit-Reset', new Date(result.resetTime).toISOString())
      }

      if (config.legacyHeaders) {
        response.headers.set('X-RateLimit-Limit', result.limit.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', Math.floor(result.resetTime / 1000).toString())
      }

      if (result.retryAfter) {
        response.headers.set('Retry-After', result.retryAfter.toString())
      }

      return response
    }

    return null // Continuar con el request
  }
}

/**
 * Función de utilidad para agregar headers de rate limit a respuestas exitosas
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  config: RateLimitConfig
): NextResponse {
  if (config.standardHeaders) {
    response.headers.set('RateLimit-Limit', result.limit.toString())
    response.headers.set('RateLimit-Remaining', result.remaining.toString())
    response.headers.set('RateLimit-Reset', new Date(result.resetTime).toISOString())
  }

  if (config.legacyHeaders) {
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.floor(result.resetTime / 1000).toString())
  }

  return response
}
