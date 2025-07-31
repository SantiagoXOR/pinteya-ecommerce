/**
 * Protección CSRF y Validación de Origen
 * Implementa validaciones para prevenir ataques Cross-Site Request Forgery
 */

import { NextRequest } from 'next/server';
import type { NextApiRequest } from 'next';
import crypto from 'crypto';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface CSRFValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  details?: {
    origin?: string;
    referer?: string;
    userAgent?: string;
    method?: string;
    expectedOrigins?: string[];
    csrfToken?: string;
  };
}

export interface OriginValidationConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  requireReferer: boolean;
  requireOrigin: boolean;
  strictMode: boolean;
  developmentMode: boolean;
}

// =====================================================
// CONFIGURACIÓN DE SEGURIDAD
// =====================================================

const CSRF_CONFIG: OriginValidationConfig = {
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://pinteya-ecommerce.vercel.app',
    'https://pinteya.com',
    'https://www.pinteya.com'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  requireReferer: true,
  requireOrigin: true,
  strictMode: process.env.NODE_ENV === 'production',
  developmentMode: process.env.NODE_ENV === 'development'
};

// =====================================================
// FUNCIONES DE VALIDACIÓN DE ORIGEN
// =====================================================

/**
 * Valida el origen de la request para prevenir CSRF
 */
export async function validateRequestOrigin(
  request: NextRequest | NextApiRequest
): Promise<CSRFValidationResult> {
  try {
    const method = request.method || 'GET';
    const origin = getHeader(request, 'origin');
    const referer = getHeader(request, 'referer');
    const userAgent = getHeader(request, 'user-agent');

    // En desarrollo, ser más permisivo
    if (CSRF_CONFIG.developmentMode && !CSRF_CONFIG.strictMode) {
      return {
        valid: true,
        details: {
          origin,
          referer,
          userAgent,
          method,
          expectedOrigins: CSRF_CONFIG.allowedOrigins
        }
      };
    }

    // Validar método HTTP
    if (!CSRF_CONFIG.allowedMethods.includes(method)) {
      return {
        valid: false,
        error: `Método HTTP no permitido: ${method}`,
        code: 'INVALID_HTTP_METHOD',
        severity: 'medium'
      };
    }

    // Para métodos seguros (GET), validación menos estricta
    if (method === 'GET') {
      return validateGetRequest(origin, referer, userAgent);
    }

    // Para métodos que modifican datos, validación estricta
    return validateMutatingRequest(origin, referer, userAgent, method);

  } catch (error) {
    console.error('[CSRF] Error en validación de origen:', error);
    return {
      valid: false,
      error: 'Error interno en validación de origen',
      code: 'ORIGIN_VALIDATION_ERROR',
      severity: 'critical'
    };
  }
}

/**
 * Valida requests GET (menos estricto)
 */
function validateGetRequest(
  origin: string | null,
  referer: string | null,
  userAgent: string | null
): CSRFValidationResult {
  // Para GET, solo verificar que no sea obviamente malicioso
  if (userAgent && isSuspiciousUserAgent(userAgent)) {
    return {
      valid: false,
      error: 'User-Agent sospechoso detectado',
      code: 'SUSPICIOUS_USER_AGENT',
      severity: 'medium'
    };
  }

  return {
    valid: true,
    details: {
      origin,
      referer,
      userAgent,
      method: 'GET'
    }
  };
}

/**
 * Valida requests que modifican datos (estricto)
 */
function validateMutatingRequest(
  origin: string | null,
  referer: string | null,
  userAgent: string | null,
  method: string
): CSRFValidationResult {
  // Verificar Origin header
  if (CSRF_CONFIG.requireOrigin && !origin) {
    return {
      valid: false,
      error: 'Header Origin requerido para operaciones que modifican datos',
      code: 'MISSING_ORIGIN_HEADER',
      severity: 'high'
    };
  }

  if (origin && !isAllowedOrigin(origin)) {
    return {
      valid: false,
      error: `Origen no permitido: ${origin}`,
      code: 'INVALID_ORIGIN',
      severity: 'critical',
      details: {
        origin,
        expectedOrigins: CSRF_CONFIG.allowedOrigins
      }
    };
  }

  // Verificar Referer header
  if (CSRF_CONFIG.requireReferer && !referer) {
    return {
      valid: false,
      error: 'Header Referer requerido para operaciones que modifican datos',
      code: 'MISSING_REFERER_HEADER',
      severity: 'high'
    };
  }

  if (referer && !isAllowedReferer(referer)) {
    return {
      valid: false,
      error: `Referer no permitido: ${referer}`,
      code: 'INVALID_REFERER',
      severity: 'high'
    };
  }

  // Verificar User-Agent
  if (userAgent && isSuspiciousUserAgent(userAgent)) {
    return {
      valid: false,
      error: 'User-Agent sospechoso detectado',
      code: 'SUSPICIOUS_USER_AGENT',
      severity: 'medium'
    };
  }

  return {
    valid: true,
    details: {
      origin,
      referer,
      userAgent,
      method,
      expectedOrigins: CSRF_CONFIG.allowedOrigins
    }
  };
}

/**
 * Verifica si un origen está permitido
 */
function isAllowedOrigin(origin: string): boolean {
  try {
    const originUrl = new URL(origin);
    
    return CSRF_CONFIG.allowedOrigins.some(allowedOrigin => {
      try {
        const allowedUrl = new URL(allowedOrigin);
        return originUrl.hostname === allowedUrl.hostname &&
               originUrl.protocol === allowedUrl.protocol;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Verifica si un referer está permitido
 */
function isAllowedReferer(referer: string): boolean {
  try {
    const refererUrl = new URL(referer);
    
    return CSRF_CONFIG.allowedOrigins.some(allowedOrigin => {
      try {
        const allowedUrl = new URL(allowedOrigin);
        return refererUrl.hostname === allowedUrl.hostname;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Detecta User-Agents sospechosos
 */
function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /postman/i,
    /insomnia/i,
    /^$/,  // User-Agent vacío
    /^.{0,10}$/,  // User-Agent muy corto
    /^.{500,}$/   // User-Agent muy largo
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Obtiene un header de manera compatible con ambos tipos de request
 */
function getHeader(
  request: NextRequest | NextApiRequest,
  headerName: string
): string | null {
  if ('headers' in request && typeof request.headers.get === 'function') {
    // NextRequest
    return (request as NextRequest).headers.get(headerName);
  } else if ('headers' in request) {
    // NextApiRequest
    const header = (request as NextApiRequest).headers[headerName];
    return Array.isArray(header) ? header[0] : header || null;
  }
  return null;
}

// =====================================================
// GENERACIÓN Y VALIDACIÓN DE TOKENS CSRF
// =====================================================

/**
 * Genera un token CSRF único
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Valida un token CSRF
 */
export function validateCSRFToken(
  providedToken: string,
  expectedToken: string
): boolean {
  if (!providedToken || !expectedToken) {
    return false;
  }

  // Comparación segura para prevenir timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(providedToken, 'hex'),
    Buffer.from(expectedToken, 'hex')
  );
}

// =====================================================
// MIDDLEWARE DE PROTECCIÓN CSRF
// =====================================================

/**
 * Middleware para protección automática contra CSRF
 */
export function withCSRFProtection(
  options: Partial<OriginValidationConfig> = {}
) {
  const config = { ...CSRF_CONFIG, ...options };

  return function (handler: Function) {
    return async (request: NextRequest | NextApiRequest, ...args: any[]) => {
      try {
        // Validar origen de la request
        const originValidation = await validateRequestOrigin(request);
        
        if (!originValidation.valid) {
          const errorResponse = {
            success: false,
            error: originValidation.error,
            code: originValidation.code,
            severity: originValidation.severity,
            csrfProtection: true
          };

          if ('query' in request) {
            // Pages Router
            const res = args[0] as any;
            return res.status(403).json(errorResponse);
          } else {
            // App Router
            return new Response(JSON.stringify(errorResponse), {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Añadir información de validación al request
        (request as any).csrfValidation = originValidation;

        return handler(request, ...args);

      } catch (error) {
        console.error('[CSRF] Error en middleware de protección:', error);
        
        const errorResponse = {
          success: false,
          error: 'Error interno en protección CSRF',
          code: 'CSRF_MIDDLEWARE_ERROR'
        };

        if ('query' in request) {
          // Pages Router
          const res = args[0] as any;
          return res.status(500).json(errorResponse);
        } else {
          // App Router
          return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    };
  };
}

/**
 * Middleware específico para APIs admin con protección CSRF estricta
 */
export function withAdminCSRFProtection() {
  return withCSRFProtection({
    strictMode: true,
    requireReferer: true,
    requireOrigin: true
  });
}
