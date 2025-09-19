// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE DE SEGURIDAD
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { generateNonces, buildStrictCSP, buildDevelopmentCSP, createNonceHeaders } from '@/lib/security/csp-nonce';

// ===================================
// CONFIGURACIÓN DE RATE LIMITING
// ===================================

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/payments': { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute
  '/api/user': { windowMs: 60000, maxRequests: 30 }, // 30 requests per minute
  '/api/orders': { windowMs: 60000, maxRequests: 20 }, // 20 requests per minute
  '/api/products': { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
  default: { windowMs: 60000, maxRequests: 60 }, // 60 requests per minute
};

// Store para rate limiting (en producción usar Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Implementa rate limiting básico
 */
function checkRateLimit(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const pathname = request.nextUrl.pathname;
  
  // Encontrar configuración de rate limit
  let config = RATE_LIMITS.default;
  for (const [path, pathConfig] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      config = pathConfig;
      break;
    }
  }
  
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  const current = requestCounts.get(key);
  
  if (!current || current.resetTime < windowStart) {
    // Nueva ventana o primera request
    requestCounts.set(key, { count: 1, resetTime: now });
    return true;
  }
  
  if (current.count >= config.maxRequests) {
    return false; // Rate limit excedido
  }
  
  // Incrementar contador
  current.count++;
  return true;
}

// ===================================
// HEADERS DE SEGURIDAD
// ===================================

/**
 * Agrega headers de seguridad a la respuesta
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Generar nonces para CSP
  const nonces = generateNonces();
  
  // Content Security Policy con nonces
  const csp = process.env.NODE_ENV === 'production' 
    ? buildStrictCSP(nonces)
    : buildDevelopmentCSP(nonces);
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Agregar nonces a los headers para que estén disponibles en la aplicación
  const nonceHeaders = createNonceHeaders(nonces);
  Object.entries(nonceHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Otros headers de seguridad
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (solo en HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}

// ===================================
// VALIDACIÓN DE REQUESTS
// ===================================

/**
 * Valida que el request sea seguro
 */
function validateRequest(request: NextRequest): { isValid: boolean; error?: string } {
  const { pathname } = request.nextUrl;
  
  // Validar User-Agent (básico)
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    return { isValid: false, error: 'Invalid User-Agent' };
  }
  
  // Validar Content-Type para requests con body (solo para APIs que requieren JSON)
  if (['POST', 'PUT', 'PATCH'].includes(request.method) && pathname.startsWith('/api/')) {
    const contentType = request.headers.get('content-type');
    const contentLength = request.headers.get('content-length');

    // Solo validar Content-Type si hay contenido en el body
    if (contentLength && parseInt(contentLength) > 0) {
      // Permitir tipos de contenido válidos
      const validContentTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain'
      ];

      if (!contentType || !validContentTypes.some(type => contentType.includes(type))) {
        return { isValid: false, error: 'Invalid Content-Type' };
      }
    }
  }
  
  // Validar tamaño del request (básico)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB max
    return { isValid: false, error: 'Request too large' };
  }
  
  return { isValid: true };
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
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  console.warn(`[SECURITY] ${event}`, {
    ip,
    pathname: request.nextUrl.pathname,
    method: request.method,
    userAgent,
    timestamp: new Date().toISOString(),
    details,
  });
}

// ===================================
// MIDDLEWARE PRINCIPAL
// ===================================

/**
 * Middleware de seguridad principal
 */
export function securityMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  
  // Skip para archivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return null; // Continuar sin procesar
  }
  
  // Validar request
  const validation = validateRequest(request);
  if (!validation.isValid) {
    logSecurityEvent('INVALID_REQUEST', request, validation.error);
    return new NextResponse('Bad Request', { status: 400 });
  }
  
  // Verificar rate limiting para APIs
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(request)) {
      logSecurityEvent('RATE_LIMIT', request);
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      });
    }
  }
  
  // Crear respuesta con headers de seguridad
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

// ===================================
// UTILIDADES ADICIONALES
// ===================================

/**
 * Limpia el store de rate limiting (llamar periódicamente)
 */
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, data] of Array.from(requestCounts.entries())) {
    if (now - data.resetTime > 300000) { // 5 minutos
      requestCounts.delete(key);
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
  };
}









