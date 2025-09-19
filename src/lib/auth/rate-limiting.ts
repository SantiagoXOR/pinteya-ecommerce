/**
 * Sistema de Rate Limiting para APIs
 * Implementa límites de velocidad para prevenir ataques de fuerza bruta
 */

import { NextRequest } from 'next/server';
import type { NextApiRequest } from 'next';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  error?: string;
  code?: string;
}

export interface RateLimitConfig {
  windowMs: number;  // Ventana de tiempo en milisegundos
  maxRequests: number;  // Máximo número de requests por ventana
  keyGenerator?: (request: NextRequest | NextApiRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

// =====================================================
// CONFIGURACIONES DE RATE LIMITING
// =====================================================

export const RATE_LIMIT_CONFIGS = {
  // APIs de autenticación - muy restrictivo
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // 5 intentos por 15 minutos
    message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.'
  },
  
  // APIs admin - restrictivo (temporalmente aumentado para pruebas)
  admin: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 100, // 100 requests por minuto
    message: 'Demasiadas requests administrativas. Intenta de nuevo en 1 minuto.'
  },
  
  // APIs de productos - moderado
  products: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 60, // 60 requests por minuto
    message: 'Demasiadas requests de productos. Intenta de nuevo en 1 minuto.'
  },
  
  // APIs de pagos - muy restrictivo
  payments: {
    windowMs: 10 * 60 * 1000, // 10 minutos
    maxRequests: 10, // 10 requests por 10 minutos
    message: 'Demasiadas requests de pagos. Intenta de nuevo en 10 minutos.'
  },
  
  // APIs generales - permisivo
  general: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 100, // 100 requests por minuto
    message: 'Demasiadas requests. Intenta de nuevo en 1 minuto.'
  }
};

// =====================================================
// ALMACENAMIENTO EN MEMORIA (Compatible con Edge Runtime)
// =====================================================

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpiar entradas expiradas cada 5 minutos
// Solo en Node.js runtime, no en Edge Runtime
if (typeof setInterval !== 'undefined' && typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// =====================================================
// FUNCIONES DE RATE LIMITING
// =====================================================

/**
 * Genera una clave única para el rate limiting
 */
function generateRateLimitKey(
  request: NextRequest | NextApiRequest,
  prefix: string = 'default'
): string {
  // Obtener IP del cliente
  let clientIP = 'unknown';
  
  if ('ip' in request && request.ip) {
    clientIP = request.ip;
  } else if ('headers' in request) {
    // Intentar obtener IP de headers
    const forwarded = getHeader(request, 'x-forwarded-for');
    const realIP = getHeader(request, 'x-real-ip');
    const cfIP = getHeader(request, 'cf-connecting-ip');
    
    clientIP = forwarded?.split(',')[0] || realIP || cfIP || 'unknown';
  }

  // Obtener User-Agent para mayor especificidad
  const userAgent = getHeader(request, 'user-agent') || 'unknown';
  const userAgentHash = hashString(userAgent);

  return `${prefix}:${clientIP}:${userAgentHash}`;
}

/**
 * Obtiene un header de manera compatible
 */
function getHeader(
  request: NextRequest | NextApiRequest,
  headerName: string
): string | null {
  if ('headers' in request && typeof request.headers.get === 'function') {
    return (request as NextRequest).headers.get(headerName);
  } else if ('headers' in request) {
    const header = (request as NextApiRequest).headers[headerName];
    return Array.isArray(header) ? header[0] : header || null;
  }
  return null;
}

/**
 * Hash simple para User-Agent
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Verifica si una request está dentro de los límites
 */
export async function checkRateLimit(
  request: NextRequest | NextApiRequest,
  config: RateLimitConfig,
  keyPrefix: string = 'api'
): Promise<RateLimitResult> {
  // Bypass temporal para pruebas de desarrollo
  if (process.env.NODE_ENV === 'development' && keyPrefix === 'admin-orders') {
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs
    };
  }
  
  try {
    const now = Date.now();
    const key = config.keyGenerator 
      ? config.keyGenerator(request)
      : generateRateLimitKey(request, keyPrefix);

    // Obtener entrada actual o crear nueva
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      // Crear nueva entrada
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now
      };
      rateLimitStore.set(key, entry);
      
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: entry.resetTime
      };
    }

    // Incrementar contador
    entry.count++;
    rateLimitStore.set(key, entry);

    // Verificar si excede el límite
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter,
        error: config.message || 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED'
      };
    }

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };

  } catch (error) {
    console.error('[RATE_LIMIT] Error en verificación:', error);
    
    // En caso de error, permitir la request pero loggear
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
      error: 'Error interno en rate limiting'
    };
  }
}

/**
 * Middleware de rate limiting
 */
export function withRateLimit(
  configName: keyof typeof RATE_LIMIT_CONFIGS,
  customConfig?: Partial<RateLimitConfig>
) {
  const baseConfig = RATE_LIMIT_CONFIGS[configName];
  const config = { ...baseConfig, ...customConfig };

  return function (handler: Function) {
    return async (request: NextRequest | NextApiRequest, ...args: any[]) => {
      try {
        const rateLimitResult = await checkRateLimit(request, config, configName);
        
        // Añadir headers de rate limiting
        const headers = {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
        };

        if (rateLimitResult.retryAfter) {
          headers['Retry-After'] = rateLimitResult.retryAfter.toString();
        }

        if (!rateLimitResult.allowed) {
          const errorResponse = {
            success: false,
            error: rateLimitResult.error,
            code: rateLimitResult.code,
            rateLimit: {
              limit: rateLimitResult.limit,
              remaining: rateLimitResult.remaining,
              resetTime: rateLimitResult.resetTime,
              retryAfter: rateLimitResult.retryAfter
            }
          };

          if ('query' in request) {
            // Pages Router
            const res = args[0] as any;
            Object.entries(headers).forEach(([key, value]) => {
              res.setHeader(key, value);
            });
            return res.status(429).json(errorResponse);
          } else {
            // App Router
            return new Response(JSON.stringify(errorResponse), {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                ...headers
              }
            });
          }
        }

        // Añadir información de rate limiting al request
        (request as any).rateLimit = rateLimitResult;

        // Ejecutar handler original
        const response = await handler(request, ...args);

        // Añadir headers a la respuesta si es posible
        if (response && typeof response.headers?.set === 'function') {
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        }

        return response;

      } catch (error) {
        console.error('[RATE_LIMIT] Error en middleware:', error);
        return handler(request, ...args);
      }
    };
  };
}

/**
 * Rate limiting específico para APIs de autenticación
 */
export function withAuthRateLimit() {
  return withRateLimit('auth');
}

/**
 * Rate limiting específico para APIs admin
 */
export function withAdminRateLimit() {
  return withRateLimit('admin');
}

/**
 * Rate limiting específico para APIs de productos
 */
export function withProductRateLimit() {
  return withRateLimit('products');
}

/**
 * Rate limiting específico para APIs de pagos
 */
export function withPaymentRateLimit() {
  return withRateLimit('payments');
}

/**
 * Función para limpiar manualmente el rate limit de una clave
 */
export function clearRateLimit(key: string): boolean {
  return rateLimitStore.delete(key);
}

/**
 * Función para obtener estadísticas de rate limiting
 */
export function getRateLimitStats(): {
  totalKeys: number;
  activeEntries: number;
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.values());
  const activeEntries = entries.filter(entry => entry.resetTime > now);
  
  return {
    totalKeys: rateLimitStore.size,
    activeEntries: activeEntries.length,
    oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.firstRequest)) : null,
    newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.firstRequest)) : null
  };
}









