/**
 * Utilidades de Autenticación Enterprise
 * Sistema centralizado que combina Clerk + Supabase con patrones enterprise
 */

import { NextRequest } from 'next/server';
import type { NextApiRequest } from 'next';
import { auth, getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateJWTIntegrity, validateJWTPermissions } from './jwt-validation';
import { validateRequestOrigin } from './csrf-protection';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from './rate-limiting';
import { logAuthSuccess, logAuthFailure, logPermissionDenied } from './security-audit';

// =====================================================
// TIPOS Y INTERFACES ENTERPRISE
// =====================================================

export interface EnterpriseAuthContext {
  // Información del usuario
  userId: string;
  sessionId?: string;
  email?: string;
  role: 'admin' | 'user' | 'moderator';
  permissions: string[];
  
  // Información de la sesión
  sessionValid: boolean;
  sessionMetadata?: any;
  
  // Información de seguridad
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  
  // Clientes de base de datos
  supabase: typeof supabaseAdmin;
  
  // Información de validaciones
  validations: {
    jwtValid: boolean;
    csrfValid: boolean;
    rateLimitPassed: boolean;
    originValid: boolean;
  };
}

export interface EnterpriseAuthResult {
  success: boolean;
  context?: EnterpriseAuthContext;
  error?: string;
  code?: string;
  status?: number;
  retryAfter?: number;
}

export interface EnterpriseAuthOptions {
  requiredRole?: 'admin' | 'user' | 'moderator';
  requiredPermissions?: string[];
  securityLevel?: 'low' | 'medium' | 'high' | 'critical';
  enableRateLimit?: boolean;
  enableCSRFProtection?: boolean;
  enableJWTValidation?: boolean;
  rateLimitType?: keyof typeof RATE_LIMIT_CONFIGS;
}

// =====================================================
// CONFIGURACIONES ENTERPRISE
// =====================================================

const ENTERPRISE_CONFIGS = {
  // Configuración para operaciones críticas (admin, pagos)
  critical: {
    requiredRole: 'admin' as const,
    securityLevel: 'critical' as const,
    enableRateLimit: true,
    enableCSRFProtection: true,
    enableJWTValidation: true,
    rateLimitType: 'admin' as const,
    requiredPermissions: ['admin_access']
  },
  
  // Configuración para operaciones de alto nivel (gestión de contenido)
  high: {
    requiredRole: 'admin' as const,
    securityLevel: 'high' as const,
    enableRateLimit: true,
    enableCSRFProtection: true,
    enableJWTValidation: true,
    rateLimitType: 'admin' as const
  },
  
  // Configuración para operaciones moderadas (APIs de productos)
  medium: {
    securityLevel: 'medium' as const,
    enableRateLimit: true,
    enableCSRFProtection: false,
    enableJWTValidation: false,
    rateLimitType: 'products' as const
  },
  
  // Configuración para operaciones básicas (consultas públicas)
  low: {
    securityLevel: 'low' as const,
    enableRateLimit: true,
    enableCSRFProtection: false,
    enableJWTValidation: false,
    rateLimitType: 'general' as const
  }
};

// =====================================================
// FUNCIONES PRINCIPALES ENTERPRISE
// =====================================================

/**
 * Función principal de autenticación enterprise
 * Combina todas las validaciones y retorna contexto completo
 */
export async function getEnterpriseAuthContext(
  request: NextRequest | NextApiRequest,
  options: EnterpriseAuthOptions = {}
): Promise<EnterpriseAuthResult> {
  try {
    const startTime = Date.now();
    
    // Aplicar configuración predefinida si se especifica nivel de seguridad
    const config = options.securityLevel 
      ? { ...ENTERPRISE_CONFIGS[options.securityLevel], ...options }
      : options;

    // 1. VALIDACIÓN DE RATE LIMITING
    if (config.enableRateLimit && config.rateLimitType) {
      const rateLimitResult = await checkRateLimit(
        request,
        RATE_LIMIT_CONFIGS[config.rateLimitType],
        `enterprise_${config.rateLimitType}`
      );

      if (!rateLimitResult.allowed) {
        await logAuthFailure(
          'unknown',
          `Rate limit exceeded: ${rateLimitResult.error}`,
          request
        );
        
        return {
          success: false,
          error: rateLimitResult.error || 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          status: 429,
          retryAfter: rateLimitResult.retryAfter
        };
      }
    }

    // 2. VALIDACIÓN CSRF
    let csrfValid = true;
    if (config.enableCSRFProtection) {
      const csrfResult = await validateRequestOrigin(request);
      csrfValid = csrfResult.valid;
      
      if (!csrfValid) {
        await logAuthFailure(
          'unknown',
          `CSRF validation failed: ${csrfResult.error}`,
          request
        );
        
        return {
          success: false,
          error: csrfResult.error || 'Invalid request origin',
          code: 'CSRF_VALIDATION_FAILED',
          status: 403
        };
      }
    }

    // 3. AUTENTICACIÓN BÁSICA CON CLERK
    let userId: string;
    let sessionId: string | undefined;
    let userEmail: string | undefined;

    if (request && 'query' in request) {
      // Pages Router
      const { userId: authUserId, sessionId: authSessionId } = getAuth(request as NextApiRequest);
      if (!authUserId) {
        return {
          success: false,
          error: 'Usuario no autenticado',
          code: 'NOT_AUTHENTICATED',
          status: 401
        };
      }
      userId = authUserId;
      sessionId = authSessionId;
    } else {
      // App Router
      const { userId: authUserId, sessionId: authSessionId } = await auth();
      if (!authUserId) {
        return {
          success: false,
          error: 'Usuario no autenticado',
          code: 'NOT_AUTHENTICATED',
          status: 401
        };
      }
      userId = authUserId;
      sessionId = authSessionId;
    }

    // 4. VALIDACIÓN JWT
    let jwtValid = true;
    if (config.enableJWTValidation) {
      const jwtResult = await validateJWTIntegrity(request);
      jwtValid = jwtResult.valid;
      
      if (!jwtValid) {
        await logAuthFailure(
          userId,
          `JWT validation failed: ${jwtResult.error}`,
          request
        );
        
        return {
          success: false,
          error: jwtResult.error || 'Invalid JWT token',
          code: 'JWT_VALIDATION_FAILED',
          status: 401
        };
      }

      // Validar permisos específicos si se requieren
      if (config.requiredRole || config.requiredPermissions) {
        const permissionResult = await validateJWTPermissions(
          config.requiredRole || '',
          config.requiredPermissions || [],
          request
        );
        
        if (!permissionResult.valid) {
          await logPermissionDenied(
            userId,
            `Permission validation failed: ${permissionResult.error}`,
            request
          );
          
          return {
            success: false,
            error: permissionResult.error || 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            status: 403
          };
        }
      }
    }

    // 5. OBTENER INFORMACIÓN DEL USUARIO DESDE SUPABASE
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('[ENTERPRISE_AUTH] Error obteniendo perfil de usuario:', userError);
    }

    // 6. DETERMINAR ROL Y PERMISOS
    const userRole = userProfile?.role || 'user';
    const userPermissions = userProfile?.permissions || [];

    // Validar rol requerido
    if (config.requiredRole && userRole !== config.requiredRole) {
      await logPermissionDenied(
        userId,
        `Role validation failed: required ${config.requiredRole}, got ${userRole}`,
        request
      );
      
      return {
        success: false,
        error: `Rol requerido: ${config.requiredRole}`,
        code: 'INSUFFICIENT_ROLE',
        status: 403
      };
    }

    // Validar permisos requeridos
    if (config.requiredPermissions && config.requiredPermissions.length > 0) {
      const hasAllPermissions = config.requiredPermissions.every(
        permission => userPermissions.includes(permission)
      );
      
      if (!hasAllPermissions) {
        await logPermissionDenied(
          userId,
          `Permission validation failed: missing ${config.requiredPermissions.join(', ')}`,
          request
        );
        
        return {
          success: false,
          error: `Permisos insuficientes: ${config.requiredPermissions.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS',
          status: 403
        };
      }
    }

    // 7. OBTENER INFORMACIÓN ADICIONAL
    const ipAddress = getClientIP(request);
    const userAgent = getHeader(request, 'user-agent') || 'unknown';

    // 8. CREAR CONTEXTO ENTERPRISE
    const context: EnterpriseAuthContext = {
      userId,
      sessionId,
      email: userProfile?.email || userEmail,
      role: userRole as 'admin' | 'user' | 'moderator',
      permissions: userPermissions,
      sessionValid: !!sessionId,
      sessionMetadata: userProfile?.metadata,
      securityLevel: config.securityLevel || 'medium',
      ipAddress,
      userAgent,
      supabase: supabaseAdmin,
      validations: {
        jwtValid,
        csrfValid,
        rateLimitPassed: true,
        originValid: csrfValid
      }
    };

    // 9. LOG DE ÉXITO
    await logAuthSuccess(userId, {
      ip_address: ipAddress,
      user_agent: userAgent,
      session_id: sessionId,
      security_level: config.securityLevel || 'medium',
      permissions: userPermissions,
      role: userRole
    }, request);

    const duration = Date.now() - startTime;
    console.log(`[ENTERPRISE_AUTH] Autenticación exitosa para ${userId} en ${duration}ms`);

    return {
      success: true,
      context
    };

  } catch (error) {
    console.error('[ENTERPRISE_AUTH] Error en autenticación enterprise:', error);
    
    await logAuthFailure(
      'unknown',
      `Enterprise auth error: ${error.message}`,
      request
    );
    
    return {
      success: false,
      error: 'Error interno de autenticación',
      code: 'INTERNAL_AUTH_ERROR',
      status: 500
    };
  }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Obtiene la IP del cliente
 */
function getClientIP(request: NextRequest | NextApiRequest): string {
  if ('ip' in request && request.ip) {
    return request.ip;
  }
  
  const forwarded = getHeader(request, 'x-forwarded-for');
  const realIP = getHeader(request, 'x-real-ip');
  const cfIP = getHeader(request, 'cf-connecting-ip');
  
  return forwarded?.split(',')[0] || realIP || cfIP || 'unknown';
}

/**
 * Obtiene un header de manera compatible
 */
function getHeader(request: NextRequest | NextApiRequest, headerName: string): string | null {
  if ('headers' in request && typeof request.headers.get === 'function') {
    return (request as NextRequest).headers.get(headerName);
  } else if ('headers' in request) {
    const header = (request as NextApiRequest).headers[headerName];
    return Array.isArray(header) ? header[0] : header || null;
  }
  return null;
}

// =====================================================
// FUNCIONES DE CONVENIENCIA ENTERPRISE
// =====================================================

/**
 * Autenticación para operaciones críticas (admin, pagos)
 */
export async function requireCriticalAuth(
  request: NextRequest | NextApiRequest
): Promise<EnterpriseAuthResult> {
  return getEnterpriseAuthContext(request, { securityLevel: 'critical' });
}

/**
 * Autenticación para operaciones de alto nivel (gestión de contenido)
 */
export async function requireHighAuth(
  request: NextRequest | NextApiRequest,
  requiredPermissions?: string[]
): Promise<EnterpriseAuthResult> {
  return getEnterpriseAuthContext(request, {
    securityLevel: 'high',
    requiredPermissions
  });
}

/**
 * Autenticación para operaciones moderadas (APIs de productos)
 */
export async function requireMediumAuth(
  request: NextRequest | NextApiRequest
): Promise<EnterpriseAuthResult> {
  return getEnterpriseAuthContext(request, { securityLevel: 'medium' });
}

/**
 * Autenticación básica para operaciones públicas con rate limiting
 */
export async function requireBasicAuth(
  request: NextRequest | NextApiRequest
): Promise<EnterpriseAuthResult> {
  return getEnterpriseAuthContext(request, { securityLevel: 'low' });
}

/**
 * Autenticación específica para admin con permisos personalizados
 */
export async function requireAdminAuth(
  request: NextRequest | NextApiRequest,
  requiredPermissions: string[] = ['admin_access']
): Promise<EnterpriseAuthResult> {
  return getEnterpriseAuthContext(request, {
    requiredRole: 'admin',
    requiredPermissions,
    securityLevel: 'critical',
    enableRateLimit: true,
    enableCSRFProtection: true,
    enableJWTValidation: true,
    rateLimitType: 'admin'
  });
}

/**
 * Autenticación para APIs de pagos con máxima seguridad
 */
export async function requirePaymentAuth(
  request: NextRequest | NextApiRequest
): Promise<EnterpriseAuthResult> {
  return getEnterpriseAuthContext(request, {
    securityLevel: 'critical',
    enableRateLimit: true,
    enableCSRFProtection: true,
    enableJWTValidation: true,
    rateLimitType: 'payments',
    requiredPermissions: ['payment_access']
  });
}

/**
 * Middleware enterprise que maneja automáticamente errores
 */
export function withEnterpriseAuth(
  authFunction: (request: NextRequest | NextApiRequest) => Promise<EnterpriseAuthResult>
) {
  return function (handler: Function) {
    return async (request: NextRequest | NextApiRequest, ...args: any[]) => {
      try {
        const authResult = await authFunction(request);

        if (!authResult.success) {
          const errorResponse = {
            success: false,
            error: authResult.error,
            code: authResult.code,
            timestamp: new Date().toISOString(),
            enterprise: true
          };

          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };

          if (authResult.retryAfter) {
            headers['Retry-After'] = authResult.retryAfter.toString();
          }

          if ('query' in request) {
            // Pages Router
            const res = args[0] as any;
            Object.entries(headers).forEach(([key, value]) => {
              res.setHeader(key, value);
            });
            return res.status(authResult.status || 401).json(errorResponse);
          } else {
            // App Router
            return new Response(JSON.stringify(errorResponse), {
              status: authResult.status || 401,
              headers
            });
          }
        }

        // Añadir contexto enterprise al request
        (request as any).enterpriseAuth = authResult.context;

        return handler(request, ...args);

      } catch (error) {
        console.error('[ENTERPRISE_AUTH] Error en middleware:', error);

        const errorResponse = {
          success: false,
          error: 'Error interno de autenticación enterprise',
          code: 'ENTERPRISE_AUTH_ERROR',
          timestamp: new Date().toISOString()
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

// =====================================================
// MIDDLEWARES PREDEFINIDOS ENTERPRISE
// =====================================================

/**
 * Middleware para operaciones críticas
 */
export const withCriticalAuth = () => withEnterpriseAuth(requireCriticalAuth);

/**
 * Middleware para operaciones de alto nivel
 */
export const withHighAuth = (requiredPermissions?: string[]) =>
  withEnterpriseAuth((req) => requireHighAuth(req, requiredPermissions));

/**
 * Middleware para operaciones moderadas
 */
export const withMediumAuth = () => withEnterpriseAuth(requireMediumAuth);

/**
 * Middleware para operaciones básicas
 */
export const withBasicAuth = () => withEnterpriseAuth(requireBasicAuth);

/**
 * Middleware para admin
 */
export const withAdminAuth = (requiredPermissions?: string[]) =>
  withEnterpriseAuth((req) => requireAdminAuth(req, requiredPermissions));

/**
 * Middleware para pagos
 */
export const withPaymentAuth = () => withEnterpriseAuth(requirePaymentAuth);
