/**
 * Validaciones Avanzadas de JWT para Seguridad
 * Implementa verificación de integridad, autenticidad y validez de tokens
 */

import { auth } from '@/lib/auth/config';
import { NextRequest } from 'next/server';
import type { NextApiRequest } from 'next';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

// Tipos específicos para JWT
export interface JWTPayload {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  nbf?: number;
  jti?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  sessionId?: string;
  [key: string]: unknown;
}

export interface JWTMetadata {
  tokenType?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActivity?: number;
  [key: string]: unknown;
}

export interface JWTDetails {
  issuer?: string;
  audience?: string;
  expiresAt?: number;
  issuedAt?: number;
  notBefore?: number;
  subject?: string;
  sessionId?: string;
  metadata?: JWTMetadata;
}

export interface JWTValidationResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
  code?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  details?: JWTDetails;
}

export interface TokenSecurityChecks {
  signatureValid: boolean;
  notExpired: boolean;
  notBeforeValid: boolean;
  issuerValid: boolean;
  audienceValid: boolean;
  subjectValid: boolean;
  metadataValid: boolean;
  sessionValid: boolean;
}

export interface RequestWithJWT extends NextRequest {
  jwtPayload?: JWTPayload;
  jwtDetails?: JWTDetails;
}

export interface NextApiRequestWithJWT extends NextApiRequest {
  jwtPayload?: JWTPayload;
  jwtDetails?: JWTDetails;
}

export interface ResponseLike {
  status: (code: number) => {
    json: (data: unknown) => unknown;
  };
}

// =====================================================
// CONFIGURACIÓN DE SEGURIDAD
// =====================================================

const JWT_SECURITY_CONFIG = {
  // Tiempo máximo de vida del token (24 horas)
  maxTokenAge: 24 * 60 * 60 * 1000,
  
  // Tiempo mínimo antes de expiración para considerar válido (5 minutos)
  minTimeBeforeExpiry: 5 * 60 * 1000,
  
  // Issuer esperado de Clerk
  expectedIssuer: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.split('_')[1] || 'clerk',
  
  // Audience esperada
  expectedAudience: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  
  // Algoritmos permitidos
  allowedAlgorithms: ['RS256', 'HS256'],
  
  // Claims requeridos
  requiredClaims: ['sub', 'iat', 'exp', 'iss', 'aud']
};

// =====================================================
// FUNCIONES DE VALIDACIÓN DE JWT
// =====================================================

/**
 * Valida la integridad y autenticidad de un token JWT
 */
export async function validateJWTIntegrity(
  request?: NextRequest | NextApiRequest
): Promise<JWTValidationResult> {
  try {
    // NextAuth.js - Obtener sesión en lugar de token JWT
    if (request && 'query' in request) {
      // Pages Router - No soportado con NextAuth.js
      return {
        valid: false,
        error: 'Pages Router no soportado con NextAuth.js',
        code: 'NOT_SUPPORTED',
        severity: 'medium'
      };
    } else {
      // App Router - NextAuth.js
      try {
        const session = await auth();
        if (!session?.user) {
          return {
            valid: false,
            error: 'Usuario no autenticado',
            code: 'NOT_AUTHENTICATED',
            severity: 'medium'
          };
        }
        // Para NextAuth.js, consideramos válida la sesión si existe
        return {
          valid: true,
          payload: {
            userId: session.user.id,
            email: session.user.email,
            name: session.user.name
          } as JWTPayload,
          details: {
            subject: session.user.id,
            issuer: 'nextauth'
          }
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Error obteniendo sesión desde NextAuth.js',
          code: 'SESSION_RETRIEVAL_ERROR',
          severity: 'medium'
        };
      }
    }
  } catch (error) {
    console.error('[JWT] Error en validación de integridad:', error);
    return {
      valid: false,
      error: 'Error interno en validación de JWT',
      code: 'VALIDATION_ERROR',
      severity: 'critical'
    };
  }
}

/**
 * Realiza verificaciones de seguridad específicas del token
 */
async function performTokenSecurityChecks(
  payload: any,
  token: string
): Promise<TokenSecurityChecks> {
  const now = Math.floor(Date.now() / 1000);

  return {
    // Verificar que el token no esté expirado
    notExpired: payload.exp && payload.exp > now,
    
    // Verificar notBefore si existe
    notBeforeValid: !payload.nbf || payload.nbf <= now,
    
    // Verificar issuer
    issuerValid: payload.iss && payload.iss.includes('clerk'),
    
    // Verificar audience
    audienceValid: payload.aud && typeof payload.aud === 'string',
    
    // Verificar subject (userId)
    subjectValid: payload.sub && typeof payload.sub === 'string',
    
    // Verificar metadata básica
    metadataValid: true, // Clerk maneja esto internamente
    
    // Verificar sesión
    sessionValid: payload.sid && typeof payload.sid === 'string',
    
    // Nota: La verificación de firma la hace Clerk internamente
    signatureValid: true
  };
}

/**
 * Valida permisos específicos en el token JWT
 */
export async function validateJWTPermissions(
  requiredRole: string,
  requiredPermissions: string[] = [],
  request?: NextRequest | NextApiRequest
): Promise<JWTValidationResult> {
  try {
    const jwtValidation = await validateJWTIntegrity(request);
    
    if (!jwtValidation.valid) {
      return jwtValidation;
    }

    const payload = jwtValidation.payload;
    
    // Verificar rol en metadata
    const userRole = payload?.role;
    if (requiredRole && userRole !== requiredRole) {
      return {
        valid: false,
        error: `Rol requerido: ${requiredRole}, rol actual: ${userRole}`,
        code: 'INSUFFICIENT_ROLE',
        severity: 'high'
      };
    }

    // Verificar permisos específicos si se proporcionan
    if (requiredPermissions.length > 0) {
      const userPermissions = payload?.permissions || [];
      const hasAllPermissions = requiredPermissions.every(
        permission => userPermissions.includes(permission)
      );
      
      if (!hasAllPermissions) {
        return {
          valid: false,
          error: `Permisos insuficientes. Requeridos: ${requiredPermissions.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS',
          severity: 'high'
        };
      }
    }

    return {
      valid: true,
      payload,
      details: jwtValidation.details
    };

  } catch (error) {
    console.error('[JWT] Error en validación de permisos:', error);
    return {
      valid: false,
      error: 'Error interno en validación de permisos JWT',
      code: 'PERMISSION_VALIDATION_ERROR',
      severity: 'critical'
    };
  }
}

/**
 * Middleware para validación automática de JWT
 */
export function withJWTValidation(
  requiredRole?: string,
  requiredPermissions?: string[]
) {
  return function (handler: Function) {
    return async (request: NextRequest | NextApiRequest, ...args: any[]) => {
      try {
        // Validar integridad del JWT
        const jwtValidation = await validateJWTIntegrity(request);
        
        if (!jwtValidation.valid) {
          const errorResponse = {
            success: false,
            error: jwtValidation.error,
            code: jwtValidation.code,
            severity: jwtValidation.severity
          };

          if ('query' in request) {
            // Pages Router
            const res = args[0] as ResponseLike;
            return res.status(401).json(errorResponse);
          } else {
            // App Router
            return new Response(JSON.stringify(errorResponse), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Validar permisos si se especifican
        if (requiredRole || requiredPermissions) {
          const permissionValidation = await validateJWTPermissions(
            requiredRole || '',
            requiredPermissions || [],
            request
          );
          
          if (!permissionValidation.valid) {
            const errorResponse = {
              success: false,
              error: permissionValidation.error,
              code: permissionValidation.code,
              severity: permissionValidation.severity
            };

            if ('query' in request) {
              // Pages Router
              const res = args[0] as ResponseLike;
              return res.status(403).json(errorResponse);
            } else {
              // App Router
              return new Response(JSON.stringify(errorResponse), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
        }

        // Añadir información del JWT al request
        (request as RequestWithJWT).jwtPayload = jwtValidation.payload;
        (request as RequestWithJWT).jwtDetails = jwtValidation.details;

        // Continuar con el handler original
        return handler(request, ...args);

      } catch (error) {
        console.error('[JWT] Error en middleware de validación:', error);
        
        const errorResponse = {
          success: false,
          error: 'Error interno en validación JWT',
          code: 'JWT_MIDDLEWARE_ERROR'
        };

        if ('query' in request) {
          // Pages Router
          const res = args[0] as ResponseLike;
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









