// ===================================
// PINTEYA E-COMMERCE - RATE LIMITING MIDDLEWARE
// ===================================
// Sistema de rate limiting enterprise con configuración flexible
// y logging estructurado para APIs críticas

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// ===================================
// TIPOS Y INTERFACES
// ===================================

export interface RateLimitConfig {
  windowMs: number // Ventana de tiempo en milisegundos
  maxRequests: number // Máximo de requests por ventana
  keyGenerator?: (req: NextRequest) => string // Generador de clave personalizado
  skipSuccessfulRequests?: boolean // Omitir requests exitosos
  skipFailedRequests?: boolean // Omitir requests fallidos
  message?: string // Mensaje de error personalizado
  headers?: boolean // Incluir headers de rate limit
  standardHeaders?: boolean // Usar headers estándar RFC
  legacyHeaders?: boolean // Incluir headers legacy
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>
  set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void>
  increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }>
}

// ===================================
// CONFIGURACIONES PREDEFINIDAS
// ===================================

// Configuraciones base para producción
const PRODUCTION_CONFIGS = {
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 1000, // 1000 requests por ventana
    message: 'Demasiadas solicitudes. Intente nuevamente en 15 minutos.',
  },
  products: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 200, // 200 requests por ventana
    message: 'Límite de consultas de productos excedido. Intente en 5 minutos.',
  },
  search: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 150, // 150 requests por ventana
    message: 'Límite de búsquedas excedido. Intente en 5 minutos.',
  },
}

// Configuraciones relajadas para desarrollo
const DEVELOPMENT_CONFIGS = {
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 10000, // 10000 requests por ventana (muy generoso)
    message: 'Demasiadas solicitudes. Intente nuevamente en 15 minutos.',
  },
  products: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 1000, // 1000 requests por minuto (muy generoso)
    message: 'Límite de consultas de productos excedido. Intente en 1 minuto.',
  },
  search: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 500, // 500 requests por minuto (muy generoso)
    message: 'Límite de búsquedas excedido. Intente en 1 minuto.',
  },
}

// ===================================
// HELPER PARA VERIFICAR SI RATE LIMITING ESTÁ HABILITADO
// ===================================

function isRateLimitingEnabled(): boolean {
  // Permitir deshabilitar rate limiting en desarrollo con variable de entorno
  if (process.env.DISABLE_RATE_LIMITING === 'true') {
    return false
  }

  // En desarrollo, usar rate limiting relajado pero habilitado por defecto
  return true
}

// Seleccionar configuración según el entorno
const isDevelopment = process.env.NODE_ENV === 'development'
const baseConfigs = isDevelopment ? DEVELOPMENT_CONFIGS : PRODUCTION_CONFIGS

export const RATE_LIMIT_CONFIGS = {
  // APIs públicas - límites generosos
  public: baseConfigs.public,

  // APIs de productos - límites moderados
  products: baseConfigs.products,

  // APIs de búsqueda - límites moderados
  search: baseConfigs.search,

  // APIs de autenticación - límites estrictos
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: isDevelopment ? 100 : 10, // 100 en dev, 10 en prod
    message: 'Demasiados intentos de autenticación. Intente en 15 minutos.',
  },

  // APIs de admin - límites moderados pero monitoreados
  admin: {
    windowMs: 10 * 60 * 1000, // 10 minutos
    maxRequests: isDevelopment ? 1000 : 100, // 1000 en dev, 100 en prod
    message: 'Límite de operaciones administrativas excedido.',
  },

  // APIs de pagos - límites muy estrictos
  payment: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: isDevelopment ? 100 : 30, // 100 en dev, 30 en prod
    message: 'Límite de operaciones de pago excedido. Intente en 15 minutos.',
  },

  // APIs de creación - límites estrictos
  creation: {
    windowMs: 10 * 60 * 1000, // 10 minutos
    maxRequests: isDevelopment ? 200 : 20, // 200 en dev, 20 en prod
    message: 'Límite de creación de recursos excedido.',
  },

  // Webhooks - límites rápidos pero altos
  webhook: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: isDevelopment ? 1000 : 100, // 1000 en dev, 100 en prod
    message: 'Límite de webhooks excedido. Intente en 1 minuto.',
  },
} as const

// ===================================
// LOGGING DE CONFIGURACIÓN
// ===================================

// Log de configuración al cargar el módulo
if (process.env.NODE_ENV === 'development') {
  console.log('[RATE_LIMITER] Configuración cargada:', {
    environment: process.env.NODE_ENV,
    rateLimitingEnabled: isRateLimitingEnabled(),
    disableRateLimiting: process.env.DISABLE_RATE_LIMITING,
    productLimits: {
      windowMs: RATE_LIMIT_CONFIGS.products.windowMs / 1000 / 60 + ' minutos',
      maxRequests: RATE_LIMIT_CONFIGS.products.maxRequests,
    },
    searchLimits: {
      windowMs: RATE_LIMIT_CONFIGS.search.windowMs / 1000 / 60 + ' minutos',
      maxRequests: RATE_LIMIT_CONFIGS.search.maxRequests,
    },
  })
}

// ===================================
// STORE EN MEMORIA (PARA DESARROLLO)
// ===================================

class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const data = this.store.get(key)
    if (!data) {
      return null
    }

    // Limpiar datos expirados
    if (Date.now() > data.resetTime) {
      this.store.delete(key)
      return null
    }

    return data
  }

  async set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void> {
    this.store.set(key, value)

    // Limpiar automáticamente después del TTL
    setTimeout(() => {
      this.store.delete(key)
    }, ttl)
  }

  async increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const existing = await this.get(key)

    if (!existing) {
      const newData = { count: 1, resetTime: now + ttl }
      await this.set(key, newData, ttl)
      return newData
    }

    const updatedData = { ...existing, count: existing.count + 1 }
    await this.set(key, updatedData, existing.resetTime - now)
    return updatedData
  }
}

// ===================================
// INSTANCIA GLOBAL DEL STORE
// ===================================

const defaultStore = new MemoryStore()

// ===================================
// GENERADORES DE CLAVE
// ===================================

export const keyGenerators = {
  // Por IP
  ip: (req: NextRequest): string => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
    return `ip:${ip}`
  },

  // Por usuario autenticado (requiere implementación específica)
  user: (req: NextRequest): string => {
    // TODO: Implementar extracción de user ID desde token/session
    const userId = req.headers.get('x-user-id') || 'anonymous'
    return `user:${userId}`
  },

  // Por endpoint específico
  endpoint: (req: NextRequest): string => {
    const url = new URL(req.url)
    return `endpoint:${url.pathname}`
  },

  // Combinado IP + endpoint
  combined: (req: NextRequest): string => {
    const ip = keyGenerators.ip(req)
    const endpoint = keyGenerators.endpoint(req)
    return `${ip}:${endpoint}`
  },
}

// ===================================
// FACTORY PARA CREAR RATE LIMITERS
// ===================================

/**
 * Crea un rate limiter con configuración específica
 */
export function createRateLimiter(
  config: Partial<RateLimitConfig> = {},
  store: RateLimitStore = defaultStore
) {
  const finalConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos por defecto
    maxRequests: 100, // 100 requests por defecto
    message: 'Rate limit exceeded',
    headers: true,
    standardHeaders: true,
    legacyHeaders: true,
    ...config,
  }

  return async (req: NextRequest): Promise<RateLimitResult> => {
    return await checkRateLimit(req, finalConfig, store)
  }
}

// ===================================
// FUNCIÓN PRINCIPAL DE RATE LIMITING
// ===================================

export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  store: RateLimitStore = defaultStore
): Promise<RateLimitResult> {
  const keyGenerator = config.keyGenerator || keyGenerators.combined
  const key = keyGenerator(req)

  try {
    const data = await store.increment(key, config.windowMs)

    const result: RateLimitResult = {
      allowed: data.count <= config.maxRequests,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - data.count),
      resetTime: data.resetTime,
    }

    if (!result.allowed) {
      result.retryAfter = Math.ceil((data.resetTime - Date.now()) / 1000)
    }

    return result
  } catch (error) {
    console.error('[RATE_LIMITER] Error checking rate limit:', error)

    // En caso de error, permitir la request (fail-open)
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    }
  }
}

// ===================================
// MIDDLEWARE DE RATE LIMITING
// ===================================

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const result = await checkRateLimit(req, config)

    // Crear headers de rate limit
    const headers = new Headers()

    if (config.headers !== false) {
      if (config.standardHeaders !== false) {
        // Headers estándar RFC 6585
        headers.set('RateLimit-Limit', result.limit.toString())
        headers.set('RateLimit-Remaining', result.remaining.toString())
        headers.set('RateLimit-Reset', new Date(result.resetTime).toISOString())
      }

      if (config.legacyHeaders !== false) {
        // Headers legacy para compatibilidad
        headers.set('X-RateLimit-Limit', result.limit.toString())
        headers.set('X-RateLimit-Remaining', result.remaining.toString())
        headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
      }
    }

    if (!result.allowed) {
      if (result.retryAfter) {
        headers.set('Retry-After', result.retryAfter.toString())
      }

      // Log del rate limit excedido
      console.warn('[RATE_LIMITER] Rate limit exceeded:', {
        key: config.keyGenerator ? config.keyGenerator(req) : 'combined',
        limit: result.limit,
        resetTime: new Date(result.resetTime).toISOString(),
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      })

      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: config.message || 'Too many requests',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers,
        }
      )
    }

    // Request permitida, agregar headers informativos
    return NextResponse.next({
      headers,
    })
  }
}

// ===================================
// HELPER PARA APLICAR RATE LIMITING
// ===================================

export async function withRateLimit<T>(
  req: NextRequest,
  config: RateLimitConfig,
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  // Si rate limiting está deshabilitado, ejecutar directamente el handler
  if (!isRateLimitingEnabled()) {
    return await handler()
  }

  const result = await checkRateLimit(req, config)

  if (!result.allowed) {
    // Crear headers de rate limit
    const headers = new Headers()

    if (config.headers !== false) {
      if (config.standardHeaders !== false) {
        // Headers estándar RFC 6585
        headers.set('RateLimit-Limit', result.limit.toString())
        headers.set('RateLimit-Remaining', result.remaining.toString())
        headers.set('RateLimit-Reset', new Date(result.resetTime).toISOString())
      }

      if (config.legacyHeaders !== false) {
        // Headers legacy para compatibilidad
        headers.set('X-RateLimit-Limit', result.limit.toString())
        headers.set('X-RateLimit-Remaining', result.remaining.toString())
        headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
      }
    }

    if (result.retryAfter) {
      headers.set('Retry-After', result.retryAfter.toString())
    }

    // Log del rate limit excedido
    console.warn('[RATE_LIMITER] Rate limit exceeded:', {
      key: config.keyGenerator ? config.keyGenerator(req) : 'combined',
      limit: result.limit,
      resetTime: new Date(result.resetTime).toISOString(),
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    })

    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: config.message || 'Too many requests',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers,
      }
    )
  }

  return handler()
}
