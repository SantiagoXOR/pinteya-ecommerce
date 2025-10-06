// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE DE SEGURIDAD
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import {
  generateNonces,
  buildStrictCSP,
  buildDevelopmentCSP,
  createNonceHeaders,
} from '@/lib/security/csp-nonce'
import { productionOptimizer } from '@/lib/rate-limiting/production-optimizer'

// ===================================
// CONFIGURACIÓN DE RATE LIMITING
// ===================================

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

// Configuración de rate limits por entorno
const getEnvironmentLimits = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'

  if (isDevelopment) {
    // Límites relajados para desarrollo
    return {
      '/api/payments': { windowMs: 60000, maxRequests: 10 },
      '/api/user': { windowMs: 60000, maxRequests: 30 },
      '/api/orders': { windowMs: 60000, maxRequests: 20 },
      '/api/products': { windowMs: 60000, maxRequests: 200 }, // Alto para desarrollo
      '/api/analytics': { windowMs: 60000, maxRequests: 300 },
      '/api/analytics/events': { windowMs: 60000, maxRequests: 500 },
      default: { windowMs: 60000, maxRequests: 100 },
    }
  }

  if (isProduction) {
    // Límites estrictos para producción (optimizados para performance)
    return {
      '/api/payments': { windowMs: 60000, maxRequests: 5 }, // Muy restrictivo para pagos
      '/api/user': { windowMs: 60000, maxRequests: 15 }, // Reducido para proteger DB
      '/api/orders': { windowMs: 60000, maxRequests: 10 }, // Conservador para órdenes
      '/api/products': { windowMs: 60000, maxRequests: 60 }, // 60% menos que desarrollo
      '/api/analytics': { windowMs: 60000, maxRequests: 100 }, // 67% menos
      '/api/analytics/events': { windowMs: 60000, maxRequests: 150 }, // 70% menos
      '/api/search': { windowMs: 60000, maxRequests: 40 }, // Búsquedas limitadas
      '/api/cart': { windowMs: 60000, maxRequests: 30 }, // Carrito moderado
      default: { windowMs: 60000, maxRequests: 30 }, // Default muy conservador
    }
  }

  // Staging/testing - límites intermedios
  return {
    '/api/payments': { windowMs: 60000, maxRequests: 8 },
    '/api/user': { windowMs: 60000, maxRequests: 20 },
    '/api/orders': { windowMs: 60000, maxRequests: 15 },
    '/api/products': { windowMs: 60000, maxRequests: 100 },
    '/api/analytics': { windowMs: 60000, maxRequests: 150 },
    '/api/analytics/events': { windowMs: 60000, maxRequests: 250 },
    default: { windowMs: 60000, maxRequests: 50 },
  }
}

const RATE_LIMITS: Record<string, RateLimitConfig> = getEnvironmentLimits()

// Store para rate limiting (en producción usar Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

/**
 * Implementa rate limiting básico
 */
function checkRateLimit(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const pathname = request.nextUrl.pathname

  // Encontrar configuración de rate limit
  let config = RATE_LIMITS.default
  for (const [path, pathConfig] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      config = pathConfig
      break
    }
  }

  const key = `${ip}:${pathname}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  const current = requestCounts.get(key)

  if (!current || current.resetTime < windowStart) {
    // Nueva ventana o primera request
    requestCounts.set(key, { count: 1, resetTime: now })
    return true
  }

  if (current.count >= config.maxRequests) {
    return false // Rate limit excedido
  }

  // Incrementar contador
  current.count++
  return true
}

export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const startTime = Date.now()
  const pathname = request.nextUrl.pathname
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

  // Obtener configuración para el endpoint
  const config = RATE_LIMITS[pathname] || RATE_LIMITS.default
  const key = `${clientIP}:${pathname}`

  const now = Date.now()
  const windowStart = now - config.windowMs

  // Obtener o crear contador
  let requestData = requestCounts.get(key)
  if (!requestData || requestData.resetTime <= now) {
    requestData = { count: 0, resetTime: now + config.windowMs }
    requestCounts.set(key, requestData)
  }

  // Incrementar contador
  requestData.count++

  // Verificar límite
  if (requestData.count > config.maxRequests) {
    console.warn(
      `SECURITY:RATE_LIMIT_EXCEEDED - IP: ${clientIP}, Path: ${pathname}, Count: ${requestData.count}/${config.maxRequests}`
    )

    // Registrar métricas para producción
    if (process.env.NODE_ENV === 'production') {
      const responseTime = Date.now() - startTime
      productionOptimizer.recordMetrics(pathname, responseTime, true)
    }

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((requestData.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': requestData.resetTime.toString(),
        },
      }
    )
  }

  // Registrar métricas exitosas para producción
  if (process.env.NODE_ENV === 'production') {
    // Registraremos el tiempo de respuesta después de que se complete la request
    const originalResponse = NextResponse.next()
    originalResponse.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    originalResponse.headers.set(
      'X-RateLimit-Remaining',
      (config.maxRequests - requestData.count).toString()
    )
    originalResponse.headers.set('X-RateLimit-Reset', requestData.resetTime.toString())

    // Registrar métricas en background
    setTimeout(() => {
      const responseTime = Date.now() - startTime
      productionOptimizer.recordMetrics(pathname, responseTime, false)
    }, 0)

    return originalResponse
  }

  return null
}

// ===================================
// HEADERS DE SEGURIDAD
// ===================================

/**
 * Agrega headers de seguridad a la respuesta
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Generar nonces para CSP
  const nonces = generateNonces()

  // Content Security Policy con nonces
  const csp =
    process.env.NODE_ENV === 'production' ? buildStrictCSP(nonces) : buildDevelopmentCSP(nonces)

  response.headers.set('Content-Security-Policy', csp)

  // Agregar nonces a los headers para que estén disponibles en la aplicación
  const nonceHeaders = createNonceHeaders(nonces)
  Object.entries(nonceHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Otros headers de seguridad
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // HSTS (solo en HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

// ===================================
// VALIDACIÓN DE REQUESTS
// ===================================

/**
 * Valida que el request sea seguro
 */
function validateRequest(request: NextRequest): { isValid: boolean; error?: string } {
  const { pathname } = request.nextUrl

  // Validar User-Agent (básico)
  const userAgent = request.headers.get('user-agent')
  if (!userAgent || userAgent.length < 10) {
    return { isValid: false, error: 'Invalid User-Agent' }
  }

  // Validar Content-Type para requests con body (solo para APIs que requieren JSON)
  if (['POST', 'PUT', 'PATCH'].includes(request.method) && pathname.startsWith('/api/')) {
    const contentType = request.headers.get('content-type')
    const contentLength = request.headers.get('content-length')

    // Solo validar Content-Type si hay contenido en el body
    if (contentLength && parseInt(contentLength) > 0) {
      // Permitir tipos de contenido válidos
      const validContentTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain',
      ]

      if (!contentType || !validContentTypes.some(type => contentType.includes(type))) {
        return { isValid: false, error: 'Invalid Content-Type' }
      }
    }
  }

  // Validar tamaño del request (básico)
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    // 10MB max
    return { isValid: false, error: 'Request too large' }
  }

  return { isValid: true }
}

// ===================================
// LOGGING DE SEGURIDAD
// ===================================

/**
 * Log de eventos de seguridad
 */
function logSecurityEvent(
  event: 'RATE_LIMIT' | 'INVALID_REQUEST' | 'SUSPICIOUS_ACTIVITY',
  request: NextRequest,
  details?: string
) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  console.warn(`[SECURITY] ${event}`, {
    ip,
    pathname: request.nextUrl.pathname,
    method: request.method,
    userAgent,
    timestamp: new Date().toISOString(),
    details,
  })
}

// ===================================
// MIDDLEWARE PRINCIPAL
// ===================================

/**
 * Middleware de seguridad principal
 */
export function securityMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl

  // Skip para archivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return null // Continuar sin procesar
  }

  // Validar request
  const validation = validateRequest(request)
  if (!validation.isValid) {
    logSecurityEvent('INVALID_REQUEST', request, validation.error)
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Verificar rate limiting para APIs
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(request)) {
      logSecurityEvent('RATE_LIMIT', request)
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
        },
      })
    }
  }

  // Crear respuesta con headers de seguridad
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

// ===================================
// UTILIDADES ADICIONALES
// ===================================

/**
 * Limpia el store de rate limiting (llamar periódicamente)
 */
export function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, data] of Array.from(requestCounts.entries())) {
    if (now - data.resetTime > 300000) {
      // 5 minutos
      requestCounts.delete(key)
    }
  }
}

/**
 * Obtiene estadísticas de rate limiting
 */
export function getRateLimitStats() {
  return {
    totalKeys: requestCounts.size,
    entries: Array.from(requestCounts.entries()).map(([key, data]) => ({
      key,
      count: data.count,
      resetTime: new Date(data.resetTime).toISOString(),
    })),
  }
}
