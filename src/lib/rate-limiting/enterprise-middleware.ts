/**
 * Middleware Enterprise de Rate Limiting
 * Integra rate limiting con utilidades enterprise y sistema de autenticación
 */

import { NextRequest, NextResponse } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  checkEnterpriseRateLimit,
  ENTERPRISE_RATE_LIMIT_CONFIGS,
  type EnterpriseRateLimitConfig,
  type EnterpriseRateLimitResult,
  metricsCollector
} from './enterprise-rate-limiter';
import type { EnterpriseAuthContext } from '@/lib/auth/enterprise-auth-utils';
import { enterpriseAuditSystem } from '@/lib/security/enterprise-audit-system';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface RateLimitMiddlewareOptions {
  configName: keyof typeof ENTERPRISE_RATE_LIMIT_CONFIGS;
  customConfig?: Partial<EnterpriseRateLimitConfig>;
  skipIf?: (request: NextRequest | NextApiRequest) => boolean;
  onLimitExceeded?: (result: EnterpriseRateLimitResult, request: NextRequest | NextApiRequest) => void;
  enableEnterpriseIntegration?: boolean;
  enableMetrics?: boolean;
  enableLogging?: boolean;
}

export interface RateLimitResponse {
  success: boolean;
  result?: EnterpriseRateLimitResult;
  response?: NextResponse;
  error?: string;
  code?: string;
}

// =====================================================
// MIDDLEWARE PARA NEXT.JS APP ROUTER
// =====================================================

/**
 * Middleware de rate limiting para Next.js App Router
 */
export function withEnterpriseRateLimit(options: RateLimitMiddlewareOptions) {
  return function <T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse> | NextResponse
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      try {
        // Verificar si debe saltarse el rate limiting
        if (options.skipIf && options.skipIf(request)) {
          return await handler(request, ...args);
        }

        // Verificar rate limit
        const rateLimitResult = await checkEnterpriseRateLimit(
          request,
          options.configName,
          options.customConfig
        );

        // Si el límite fue excedido
        if (!rateLimitResult.allowed) {
          // ENTERPRISE: Registrar evento de seguridad
          try {
            await enterpriseAuditSystem.logEnterpriseEvent({
              user_id: request.headers.get('x-clerk-user-id') || 'anonymous',
              event_type: 'SECURITY_VIOLATION',
              event_category: 'suspicious_behavior',
              severity: 'medium',
              description: `Rate limit excedido en ${request.nextUrl.pathname}`,
              metadata: {
                endpoint: request.nextUrl.pathname,
                method: request.method,
                config: options.configName,
                limit: rateLimitResult.limit,
                remaining: rateLimitResult.remaining,
                source: rateLimitResult.source
              },
              ip_address: request.headers.get('x-forwarded-for') || 'unknown',
              user_agent: request.headers.get('user-agent') || 'unknown'
            }, undefined, request);
          } catch (auditError) {
            console.error('[RATE_LIMIT_AUDIT] Error registrando evento:', auditError);
          }

          // Callback personalizado
          if (options.onLimitExceeded) {
            options.onLimitExceeded(rateLimitResult, request);
          }

          // Logging si está habilitado
          if (options.enableLogging !== false) {
            console.warn(`[RATE_LIMIT_MIDDLEWARE] Límite excedido para ${request.nextUrl.pathname}`, {
              ip: request.headers.get('x-forwarded-for') || 'unknown',
              userAgent: request.headers.get('user-agent'),
              limit: rateLimitResult.limit,
              remaining: rateLimitResult.remaining,
              resetTime: new Date(rateLimitResult.resetTime).toISOString()
            });
          }

          // Crear respuesta de error con headers de rate limiting
          const response = NextResponse.json(
            {
              error: ENTERPRISE_RATE_LIMIT_CONFIGS[options.configName].message || 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
              details: {
                limit: rateLimitResult.limit,
                remaining: rateLimitResult.remaining,
                resetTime: rateLimitResult.resetTime,
                retryAfter: rateLimitResult.retryAfter
              },
              enterprise: true,
              timestamp: new Date().toISOString()
            },
            { status: 429 }
          );

          // Añadir headers de rate limiting
          addRateLimitHeaders(response, rateLimitResult);

          return response;
        }

        // Ejecutar handler original
        const response = await handler(request, ...args);

        // Añadir headers de rate limiting a respuesta exitosa
        if (response) {
          addRateLimitHeaders(response, rateLimitResult);
        }

        return response;
      } catch (error) {
        console.error('[RATE_LIMIT_MIDDLEWARE] Error:', error);
        
        // En caso de error, ejecutar handler sin rate limiting
        return await handler(request, ...args);
      }
    };
  };
}

// =====================================================
// MIDDLEWARE PARA PAGES API
// =====================================================

/**
 * Middleware de rate limiting para Pages API
 */
export function withEnterpriseRateLimitAPI(options: RateLimitMiddlewareOptions) {
  return function (
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
  ) {
    return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
      try {
        // Verificar si debe saltarse el rate limiting
        if (options.skipIf && options.skipIf(req)) {
          return await handler(req, res);
        }

        // Verificar rate limit
        const rateLimitResult = await checkEnterpriseRateLimit(
          req,
          options.configName,
          options.customConfig
        );

        // Añadir headers de rate limiting
        addRateLimitHeadersAPI(res, rateLimitResult);

        // Si el límite fue excedido
        if (!rateLimitResult.allowed) {
          // Callback personalizado
          if (options.onLimitExceeded) {
            options.onLimitExceeded(rateLimitResult, req);
          }

          // Logging si está habilitado
          if (options.enableLogging !== false) {
            console.warn(`[RATE_LIMIT_API] Límite excedido para ${req.url}`, {
              ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
              userAgent: req.headers['user-agent'],
              limit: rateLimitResult.limit,
              remaining: rateLimitResult.remaining
            });
          }

          // Responder con error 429
          res.status(429).json({
            error: ENTERPRISE_RATE_LIMIT_CONFIGS[options.configName].message || 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            details: {
              limit: rateLimitResult.limit,
              remaining: rateLimitResult.remaining,
              resetTime: rateLimitResult.resetTime,
              retryAfter: rateLimitResult.retryAfter
            },
            enterprise: true,
            timestamp: new Date().toISOString()
          });

          return;
        }

        // Ejecutar handler original
        return await handler(req, res);
      } catch (error) {
        console.error('[RATE_LIMIT_API] Error:', error);
        
        // En caso de error, ejecutar handler sin rate limiting
        return await handler(req, res);
      }
    };
  };
}

// =====================================================
// INTEGRACIÓN CON ENTERPRISE AUTH
// =====================================================

/**
 * Rate limiting integrado con autenticación enterprise
 */
export async function checkRateLimitWithAuth(
  request: NextRequest | NextApiRequest,
  enterpriseContext?: EnterpriseAuthContext,
  configName?: keyof typeof ENTERPRISE_RATE_LIMIT_CONFIGS
): Promise<RateLimitResponse> {
  try {
    // Determinar configuración basada en contexto de autenticación
    let finalConfigName = configName;
    let customConfig: Partial<EnterpriseRateLimitConfig> = {};

    if (enterpriseContext && !finalConfigName) {
      // Seleccionar configuración basada en rol y permisos
      if (enterpriseContext.role === 'admin') {
        finalConfigName = 'ADMIN_API';
      } else if (enterpriseContext.permissions.includes('payment_access')) {
        finalConfigName = 'PAYMENT_API';
      } else {
        finalConfigName = 'PUBLIC_API';
      }

      // Ajustar límites basado en nivel de seguridad
      if (enterpriseContext.securityLevel === 'critical') {
        customConfig.maxRequests = Math.floor((ENTERPRISE_RATE_LIMIT_CONFIGS[finalConfigName].maxRequests || 50) * 0.5);
      } else if (enterpriseContext.securityLevel === 'high') {
        customConfig.maxRequests = Math.floor((ENTERPRISE_RATE_LIMIT_CONFIGS[finalConfigName].maxRequests || 50) * 0.75);
      }

      // Usar generador de clave por usuario si está autenticado
      customConfig.keyGenerator = (req) => `user:${enterpriseContext.userId}:${getEndpoint(req)}`;
    }

    if (!finalConfigName) {
      finalConfigName = 'PUBLIC_API';
    }

    // Verificar rate limit
    const result = await checkEnterpriseRateLimit(request, finalConfigName, customConfig);

    return {
      success: result.allowed,
      result,
      error: result.allowed ? undefined : 'Rate limit exceeded',
      code: result.allowed ? undefined : 'RATE_LIMIT_EXCEEDED'
    };
  } catch (error) {
    console.error('[RATE_LIMIT_AUTH] Error:', error);
    
    return {
      success: true, // Permitir en caso de error
      error: 'Error interno en rate limiting',
      code: 'INTERNAL_ERROR'
    };
  }
}

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Añade headers de rate limiting a NextResponse
 */
function addRateLimitHeaders(response: NextResponse, result: EnterpriseRateLimitResult): void {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }

  // Headers adicionales enterprise
  response.headers.set('X-RateLimit-Source', result.source);
  
  if (result.metrics) {
    response.headers.set('X-RateLimit-Response-Time', result.metrics.responseTime.toString());
  }
}

/**
 * Añade headers de rate limiting a NextApiResponse
 */
function addRateLimitHeadersAPI(res: NextApiResponse, result: EnterpriseRateLimitResult): void {
  res.setHeader('X-RateLimit-Limit', result.limit.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  
  if (result.retryAfter) {
    res.setHeader('Retry-After', result.retryAfter.toString());
  }

  // Headers adicionales enterprise
  res.setHeader('X-RateLimit-Source', result.source);
  
  if (result.metrics) {
    res.setHeader('X-RateLimit-Response-Time', result.metrics.responseTime.toString());
  }
}

/**
 * Obtiene el endpoint de la request
 */
function getEndpoint(request: NextRequest | NextApiRequest): string {
  if ('nextUrl' in request) {
    return (request as NextRequest).nextUrl.pathname;
  } else if ('url' in request) {
    try {
      const url = new URL((request as NextApiRequest).url || '', 'http://localhost');
      return url.pathname;
    } catch {
      return '/unknown';
    }
  }
  
  return '/unknown';
}

// =====================================================
// FUNCIONES DE CONVENIENCIA
// =====================================================

/**
 * Rate limiting para APIs críticas de autenticación
 */
export const withCriticalAuthRateLimit = () => 
  withEnterpriseRateLimit({ configName: 'CRITICAL_AUTH' });

/**
 * Rate limiting para APIs administrativas
 */
export const withAdminRateLimit = () => 
  withEnterpriseRateLimit({ configName: 'ADMIN_API' });

/**
 * Rate limiting para APIs de pagos
 */
export const withPaymentRateLimit = () => 
  withEnterpriseRateLimit({ configName: 'PAYMENT_API' });

/**
 * Rate limiting para APIs públicas
 */
export const withPublicRateLimit = () => 
  withEnterpriseRateLimit({ configName: 'PUBLIC_API' });

/**
 * Rate limiting para webhooks
 */
export const withWebhookRateLimit = () => 
  withEnterpriseRateLimit({ configName: 'WEBHOOK_API' });

/**
 * Obtener métricas de rate limiting
 */
export function getRateLimitMetrics() {
  return metricsCollector.getMetrics();
}

/**
 * Resetear métricas de rate limiting
 */
export function resetRateLimitMetrics() {
  metricsCollector.reset();
}
