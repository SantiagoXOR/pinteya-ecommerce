/**
 * Configuración centralizada de CORS para la aplicación
 * Maneja orígenes permitidos según el entorno
 */

// ===================================
// CONFIGURACIÓN DE ORÍGENES PERMITIDOS
// ===================================

const PRODUCTION_ORIGINS = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'https://admin.yourdomain.com'
];

const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'https://localhost:3000'
];

const STAGING_ORIGINS = [
  'https://staging.yourdomain.com',
  'https://preview.yourdomain.com'
];

// ===================================
// UTILIDADES CORS
// ===================================

/**
 * Obtiene los orígenes permitidos según el entorno
 */
export function getAllowedOrigins(): string[] {
  const env = process.env.NODE_ENV;
  const customOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
  
  switch (env) {
    case 'production':
      return [...PRODUCTION_ORIGINS, ...customOrigins];
    case 'staging':
      return [...STAGING_ORIGINS, ...customOrigins];
    case 'development':
    case 'test':
    default:
      return [...DEVELOPMENT_ORIGINS, ...customOrigins];
  }
}

/**
 * Verifica si un origen está permitido
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Obtiene el header Access-Control-Allow-Origin apropiado
 */
export function getCorsOriginHeader(requestOrigin?: string): string {
  // En desarrollo, permitir todos los orígenes para facilitar el desarrollo
  if (process.env.NODE_ENV === 'development') {
    return '*';
  }
  
  // En producción, verificar origen específico
  if (requestOrigin && isOriginAllowed(requestOrigin)) {
    return requestOrigin;
  }
  
  // Por defecto, usar el primer origen permitido
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins[0] || 'null';
}

/**
 * Configuración CORS completa para diferentes endpoints
 */
export const CORS_CONFIG = {
  // Para APIs públicas (más restrictivo)
  public: {
    methods: ['GET', 'POST', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization'],
    credentials: false
  },
  
  // Para APIs de administración (muy restrictivo)
  admin: {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Admin-Token'],
    credentials: true
  },
  
  // Para webhooks (específico)
  webhook: {
    methods: ['POST', 'OPTIONS'],
    headers: ['Content-Type', 'X-Signature', 'User-Agent'],
    credentials: false
  }
} as const;

/**
 * Genera headers CORS completos para una respuesta
 */
export function generateCorsHeaders(
  requestOrigin?: string,
  configType: keyof typeof CORS_CONFIG = 'public'
): Record<string, string> {
  const config = CORS_CONFIG[configType];
  
  return {
    'Access-Control-Allow-Origin': getCorsOriginHeader(requestOrigin),
    'Access-Control-Allow-Methods': config.methods.join(', '),
    'Access-Control-Allow-Headers': config.headers.join(', '),
    'Access-Control-Allow-Credentials': config.credentials.toString(),
    'Access-Control-Max-Age': '86400', // 24 horas
    'Vary': 'Origin'
  };
}