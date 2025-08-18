/**
 * Sistema de Autenticación y Autorización para Panel Administrativo
 * Implementa verificación de roles y permisos granulares
 */

import { auth, currentUser, getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  validateSecurityContext,
  getSecurityContext,
  type SecurityValidationResult,
  type SecurityContext
} from './security-validations';
import {
  logAuthSuccess,
  logAuthFailure,
  logPermissionDenied,
  runSecurityDetection
} from './security-audit';
import {
  logAuthentication,
  logDataAccess,
  logAdminAction,
  AuditResult
} from '@/lib/security/audit-trail';
import {
  validateJWTIntegrity,
  validateJWTPermissions,
  type JWTValidationResult
} from './jwt-validation';
import {
  validateRequestOrigin,
  type CSRFValidationResult
} from './csrf-protection';
import {
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
  type RateLimitResult
} from './rate-limiting';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface UserProfile {
  id: string;
  supabase_user_id: string | null;
  clerk_user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role_id: number;
  is_active: boolean;
  is_verified: boolean;
  user_roles: {
    id: number;
    role_name: string;
    display_name: string;
    permissions: Record<string, any>;
    is_active: boolean;
  };
}

export interface AdminAuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  status?: number;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  userId?: string;
}

// =====================================================
// FUNCIONES DE VERIFICACIÓN DE AUTENTICACIÓN
// =====================================================

/**
 * Obtiene el usuario autenticado usando SOLO métodos oficiales de Clerk
 * MIGRADO: Ya no usa headers ni JWT como fallback - Solo getAuth(req) y auth()
 */
export async function getAuthenticatedUser(
  request?: NextRequest | NextApiRequest
): Promise<{ userId: string | null; sessionId?: string; error?: string; isAdmin?: boolean }> {
  try {
    // Método 1: Usar getAuth oficial de Clerk para API Routes (PREFERIDO)
    if (request && 'query' in request) {
      // Es NextApiRequest (Pages Router)
      const { userId, sessionId, getToken } = getAuth(request as NextApiRequest);
      if (userId) {
        console.log(`[AUTH] Usuario autenticado via getAuth: ${userId}`);

        // ✅ CORREGIDO: Verificar si es admin usando el token y fallback a currentUser
        let isAdmin = false;
        try {
          const token = await getToken();
          if (token) {
            // Decodificar token para obtener metadata
            const payload = JSON.parse(atob(token.split('.')[1]));
            const publicRole = payload.publicMetadata?.role;
            const privateRole = payload.privateMetadata?.role;
            isAdmin = publicRole === 'admin' || privateRole === 'admin';

            console.log(`[AUTH] Token verificación - publicRole: ${publicRole}, privateRole: ${privateRole}, isAdmin: ${isAdmin}`);
          }

          // Si no encontramos el rol en el token, verificar directamente con Clerk
          if (!isAdmin) {
            try {
              const user = await currentUser();
              if (user) {
                const userPublicRole = user.publicMetadata?.role as string;
                const userPrivateRole = user.privateMetadata?.role as string;
                isAdmin = userPublicRole === 'admin' || userPrivateRole === 'admin';

                console.log(`[AUTH] Fallback currentUser - userPublicRole: ${userPublicRole}, userPrivateRole: ${userPrivateRole}, isAdmin: ${isAdmin}`);
              }
            } catch (fallbackError) {
              console.warn('[AUTH] Error en fallback currentUser:', fallbackError);
            }
          }
        } catch (tokenError) {
          console.warn('[AUTH] Error obteniendo token para verificar admin:', tokenError);
        }

        return { userId, sessionId, isAdmin };
      }
    }

    // Método 2: Usar auth() para App Router Route Handlers
    if (!request || !('query' in request)) {
      try {
        const { userId, sessionId, sessionClaims } = await auth();
        if (userId) {
          console.log(`[AUTH] Usuario autenticado via auth(): ${userId}`);

          // ✅ CORREGIDO: Verificar si es admin usando publicMetadata y privateMetadata
          const publicRole = sessionClaims?.publicMetadata?.role as string;
          const privateRole = sessionClaims?.privateMetadata?.role as string;
          let isAdmin = publicRole === 'admin' || privateRole === 'admin';

          // Logging para debugging en producción
          console.log(`[AUTH] Verificación de roles - publicRole: ${publicRole}, privateRole: ${privateRole}, isAdmin: ${isAdmin}`);

          // Si no encontramos el rol en sessionClaims, verificar directamente con Clerk
          if (!isAdmin && userId) {
            try {
              const user = await currentUser();
              if (user) {
                const userPublicRole = user.publicMetadata?.role as string;
                const userPrivateRole = user.privateMetadata?.role as string;
                isAdmin = userPublicRole === 'admin' || userPrivateRole === 'admin';

                console.log(`[AUTH] Fallback verificación - userPublicRole: ${userPublicRole}, userPrivateRole: ${userPrivateRole}, isAdmin: ${isAdmin}`);
              }
            } catch (fallbackError) {
              console.warn('[AUTH] Error en fallback de verificación de admin:', fallbackError);
            }
          }

          return { userId, sessionId, isAdmin };
        }
      } catch (authError) {
        console.warn('[AUTH] Error usando auth():', authError);
        return {
          userId: null,
          error: `Error de autenticación: ${authError.message}`
        };
      }
    }

    console.warn('[AUTH] No se pudo obtener userId - usuario no autenticado');
    return { userId: null, error: 'Usuario no autenticado' };
  } catch (error) {
    console.error('[AUTH] Error en getAuthenticatedUser:', error);
    return {
      userId: null,
      error: error instanceof Error ? error.message : 'Error de autenticación'
    };
  }
}

/**
 * Función de migración para APIs que aún usan headers directamente
 * DEPRECADA: Usar getAuthenticatedUser() en su lugar
 */
export async function getAuthFromHeaders(
  request: NextRequest
): Promise<{ userId: string | null; error?: string; deprecated: boolean }> {
  console.warn('[AUTH] ⚠️ DEPRECADO: getAuthFromHeaders() - Migrar a getAuthenticatedUser()');

  const clerkUserId = request.headers.get('x-clerk-user-id');

  if (!clerkUserId) {
    return {
      userId: null,
      error: 'Header x-clerk-user-id no encontrado',
      deprecated: true
    };
  }

  return {
    userId: clerkUserId,
    deprecated: true
  };
}

/**
 * Función mejorada que combina autenticación y verificación de admin
 * Reemplaza el patrón común de getAuthenticatedUser + checkAdminAccess
 */
export async function getAuthenticatedAdmin(
  request?: NextRequest | NextApiRequest
): Promise<{
  userId: string | null;
  sessionId?: string;
  isAdmin: boolean;
  user?: any;
  supabase?: any;
  error?: string;
  status?: number;
}> {
  try {
    // Obtener usuario autenticado
    const authResult = await getAuthenticatedUser(request);

    if (!authResult.userId) {
      return {
        userId: null,
        isAdmin: false,
        error: authResult.error || 'Usuario no autenticado',
        status: 401
      };
    }

    // Si ya tenemos información de admin del token, usarla
    if (authResult.isAdmin !== undefined) {
      if (!authResult.isAdmin) {
        return {
          userId: authResult.userId,
          sessionId: authResult.sessionId,
          isAdmin: false,
          error: 'Permisos de administrador requeridos',
          status: 403
        };
      }

      return {
        userId: authResult.userId,
        sessionId: authResult.sessionId,
        isAdmin: true,
        supabase: supabaseAdmin
      };
    }

    // Fallback: verificar admin en base de datos
    const adminCheck = await checkAdminAccess(authResult.userId);

    if (!adminCheck.success) {
      return {
        userId: authResult.userId,
        sessionId: authResult.sessionId,
        isAdmin: false,
        error: adminCheck.error,
        status: adminCheck.status
      };
    }

    return {
      userId: authResult.userId,
      sessionId: authResult.sessionId,
      isAdmin: true,
      user: adminCheck.user,
      supabase: adminCheck.supabase
    };
  } catch (error) {
    console.error('[AUTH] Error en getAuthenticatedAdmin:', error);
    return {
      userId: null,
      isAdmin: false,
      error: 'Error interno de autenticación',
      status: 500
    };
  }
}

/**
 * Nueva función específica para Pages Router API Routes
 * Usa getAuth(req) oficial de Clerk
 */
export function getAuthFromApiRoute(req: NextApiRequest, res: NextApiResponse) {
  const { userId, sessionId, getToken } = getAuth(req);

  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  console.log(`[AUTH] API Route autenticada: ${userId}`);
  return { userId, sessionId, getToken };
}

/**
 * Nueva función específica para App Router Route Handlers
 * Usa auth() oficial de Clerk
 */
export async function getAuthFromRouteHandler() {
  const { userId, sessionId, getToken } = await auth();

  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  console.log(`[AUTH] Route Handler autenticado: ${userId}`);
  return { userId, sessionId, getToken };
}

/**
 * Función unificada que detecta automáticamente el tipo de ruta
 * Con manejo robusto de errores y fallbacks
 */
export async function getUnifiedAuth(request?: NextRequest | NextApiRequest) {
  try {
    // Detectar si es API Route (Pages Router)
    if (request && 'query' in request) {
      try {
        return getAuthFromApiRoute(request as NextApiRequest, {} as NextApiResponse);
      } catch (apiError) {
        console.warn('[AUTH] Error en API Route, usando fallback:', apiError);
        // Fallback a función original
        return await getAuthenticatedUser(request);
      }
    }

    // Detectar si es Route Handler (App Router) o sin request
    if (!request || !('query' in request)) {
      try {
        return await getAuthFromRouteHandler();
      } catch (routeError) {
        console.warn('[AUTH] Error en Route Handler, usando fallback:', routeError);
        // Fallback a función original
        return await getAuthenticatedUser(request);
      }
    }

    // Fallback a función original
    return await getAuthenticatedUser(request);
  } catch (error) {
    console.error('[AUTH] Error en getUnifiedAuth:', error);
    // En lugar de lanzar error, retornar resultado de fallback
    return await getAuthenticatedUser(request);
  }
}

/**
 * Obtiene el perfil completo del usuario desde Supabase
 */
export async function getUserProfile(clerkUserId: string): Promise<UserProfile | null> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    // Primero obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .eq('is_active', true)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    if (!profile) {
      return null;
    }

    // Luego obtener el rol del usuario
    const { data: role, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('id', profile.role_id)
      .single();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
      return null;
    }

    // Combinar los datos
    const userProfile: UserProfile = {
      ...profile,
      user_roles: role
    };

    return userProfile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

/**
 * Verifica si un usuario tiene acceso al panel administrativo
 */
export async function checkAdminAccess(clerkUserId: string): Promise<AdminAuthResult> {
  try {
    const profile = await getUserProfile(clerkUserId);
    
    if (!profile) {
      return {
        success: false,
        error: 'Perfil de usuario no encontrado',
        status: 404
      };
    }

    if (!profile.user_roles || !profile.is_active) {
      return {
        success: false,
        error: 'Rol de usuario no válido',
        status: 403
      };
    }

    // Verificar si tiene acceso al panel admin
    const hasAdminAccess = hasPermission(profile, ['admin_panel', 'access']);
    
    if (!hasAdminAccess) {
      return {
        success: false,
        error: 'Acceso denegado al panel administrativo',
        status: 403
      };
    }

    return {
      success: true,
      user: profile
    };
  } catch (error) {
    console.error('Error in checkAdminAccess:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      status: 500
    };
  }
}

// =====================================================
// FUNCIONES DE VERIFICACIÓN DE PERMISOS
// =====================================================

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(
  userProfile: UserProfile,
  permissionPath: string[]
): boolean {
  try {
    if (!userProfile.user_roles || !userProfile.user_roles.permissions) {
      return false;
    }

    let current: any = userProfile.user_roles.permissions;
    
    for (const path of permissionPath) {
      if (current[path] === undefined) {
        return false;
      }
      current = current[path];
    }

    // Manejar diferentes tipos de valores de permisos
    if (typeof current === 'boolean') {
      return current;
    }
    
    if (typeof current === 'string') {
      // Para permisos como "own", "own_limited", etc.
      return current !== 'false';
    }

    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Verifica múltiples permisos
 */
export function hasAnyPermission(
  userProfile: UserProfile,
  permissions: string[][]
): boolean {
  return permissions.some(permission => hasPermission(userProfile, permission));
}

/**
 * Verifica todos los permisos
 */
export function hasAllPermissions(
  userProfile: UserProfile,
  permissions: string[][]
): boolean {
  return permissions.every(permission => hasPermission(userProfile, permission));
}

/**
 * Verifica si el usuario es administrador
 */
export function isAdmin(userProfile: UserProfile): boolean {
  return userProfile.user_roles?.role_name === 'admin';
}

/**
 * Verifica si el usuario es moderador o administrador
 */
export function isModeratorOrAdmin(userProfile: UserProfile): boolean {
  const role = userProfile.user_roles?.role_name;
  return role === 'admin' || role === 'moderator';
}

// =====================================================
// MIDDLEWARE DE AUTORIZACIÓN
// =====================================================

/**
 * Middleware principal para verificar permisos administrativos
 * MEJORADO: Incluye validaciones adicionales de seguridad (JWT, CSRF, Rate Limiting)
 */
export async function checkAdminPermissions(
  requiredPermissions?: string[][],
  request?: NextRequest | NextApiRequest
): Promise<AdminAuthResult & {
  supabase?: typeof supabaseAdmin;
  securityContext?: SecurityContext;
  jwtValidation?: JWTValidationResult;
  csrfValidation?: CSRFValidationResult;
  rateLimitResult?: RateLimitResult;
}> {
  try {
    // 1. NUEVA VALIDACIÓN: Rate Limiting para APIs admin
    const rateLimitResult = await checkRateLimit(
      request!,
      RATE_LIMIT_CONFIGS.admin,
      'admin'
    );

    if (!rateLimitResult.allowed) {
      await logAuthFailure(
        'unknown',
        'Rate limit exceeded for admin API',
        request
      );

      return {
        success: false,
        error: rateLimitResult.error || 'Demasiadas requests administrativas',
        status: 429,
        rateLimitResult
      };
    }

    // 2. NUEVA VALIDACIÓN: Origen de request (CSRF Protection)
    const csrfValidation = await validateRequestOrigin(request!);

    if (!csrfValidation.valid) {
      await logAuthFailure(
        'unknown',
        `CSRF validation failed: ${csrfValidation.error}`,
        request
      );

      return {
        success: false,
        error: csrfValidation.error || 'Origen de request no válido',
        status: 403,
        csrfValidation
      };
    }

    // 3. Verificar autenticación con Clerk usando métodos oficiales
    let userId: string;
    let sessionId: string | undefined;

    try {
      const authResult = await getUnifiedAuth(request);
      userId = authResult.userId;
      sessionId = authResult.sessionId;

      // Log autenticación exitosa
      const securityContext = await getSecurityContext(userId, request);
      if (securityContext) {
        await logAuthSuccess(userId, securityContext, request);
      }

      // ✅ ENTERPRISE: Audit trail para autenticación exitosa
      await logAuthentication(
        'user_authenticated',
        AuditResult.SUCCESS,
        userId,
        {
          sessionId,
          authMethod: 'clerk',
          securityContext: securityContext?.riskLevel
        },
        {
          ip: securityContext?.ipAddress || 'unknown',
          userAgent: securityContext?.userAgent || 'unknown',
          sessionId
        }
      );
    } catch (authError) {
      console.warn('[AUTH] Error en autenticación unificada, intentando fallback');
      await logAuthFailure(null, `Error de autenticación: ${authError.message}`, request);

      // ✅ ENTERPRISE: Audit trail para fallo de autenticación
      await logAuthentication(
        'authentication_failed',
        AuditResult.FAILURE,
        undefined,
        {
          error: authError.message,
          authMethod: 'clerk',
          fallbackAttempted: true
        },
        {
          ip: request?.headers?.get('x-forwarded-for') || 'unknown',
          userAgent: request?.headers?.get('user-agent') || 'unknown'
        }
      );

      const fallbackResult = await getAuthenticatedUser(request);
      if (!fallbackResult.userId) {
        await logAuthFailure(null, fallbackResult.error || 'No autorizado', request);

        // ✅ ENTERPRISE: Audit trail para fallo de fallback
        await logAuthentication(
          'authentication_fallback_failed',
          AuditResult.FAILURE,
          undefined,
          {
            error: fallbackResult.error,
            authMethod: 'fallback'
          },
          {
            ip: request?.headers?.get('x-forwarded-for') || 'unknown',
            userAgent: request?.headers?.get('user-agent') || 'unknown'
          }
        );

        return {
          success: false,
          error: fallbackResult.error || 'No autorizado',
          status: 401
        };
      }
      userId = fallbackResult.userId;
      sessionId = fallbackResult.sessionId;
    }

    // 4. NUEVA VALIDACIÓN: Integridad del JWT
    const jwtValidation = await validateJWTIntegrity(request);

    if (!jwtValidation.valid) {
      await logAuthFailure(
        userId,
        `JWT validation failed: ${jwtValidation.error}`,
        request
      );

      return {
        success: false,
        error: jwtValidation.error || 'Token JWT inválido',
        status: 401,
        jwtValidation
      };
    }

    // 5. NUEVA VALIDACIÓN: Permisos específicos en JWT
    const jwtPermissionValidation = await validateJWTPermissions(
      'admin',
      ['admin_access'],
      request
    );

    if (!jwtPermissionValidation.valid) {
      await logPermissionDenied(
        userId,
        `JWT permission validation failed: ${jwtPermissionValidation.error}`,
        request
      );

      return {
        success: false,
        error: jwtPermissionValidation.error || 'Permisos JWT insuficientes',
        status: 403,
        jwtValidation: jwtPermissionValidation
      };
    }

    // 6. Ejecutar detección de seguridad
    await runSecurityDetection(userId);

    // 3. Obtener contexto de seguridad completo
    const securityContext = await getSecurityContext(userId, request);
    if (!securityContext) {
      await logAuthFailure(userId, 'No se pudo obtener contexto de seguridad', request);
      return {
        success: false,
        error: 'Error obteniendo contexto de seguridad',
        status: 500
      };
    }

    // 4. Verificar disponibilidad de Supabase
    if (!supabaseAdmin) {
      return {
        success: false,
        error: 'Servicio administrativo no disponible',
        status: 503
      };
    }

    // 5. Verificar acceso administrativo básico
    const adminCheck = await checkAdminAccess(userId);

    if (!adminCheck.success) {
      await logPermissionDenied(userId, 'ADMIN_ACCESS', ['admin_panel'], securityContext);
      return adminCheck;
    }

    const userProfile = adminCheck.user!;

    // 6. Verificar permisos específicos con validaciones de seguridad
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermissions = hasAnyPermission(userProfile, requiredPermissions);

      if (!hasRequiredPermissions) {
        await logPermissionDenied(
          userId,
          'SPECIFIC_PERMISSIONS',
          requiredPermissions.flat(),
          securityContext
        );
        return {
          success: false,
          error: 'Permisos insuficientes para esta operación',
          status: 403
        };
      }
    }

    // 7. Registrar acceso en audit log
    await logAdminAccess(userProfile.id, 'API_ACCESS');

    return {
      success: true,
      user: userProfile,
      supabase: supabaseAdmin,
      securityContext,
      jwtValidation,
      csrfValidation,
      rateLimitResult
    };
  } catch (error) {
    console.error('Error in checkAdminPermissions:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      status: 500
    };
  }
}

/**
 * Middleware específico para operaciones CRUD con validaciones de seguridad
 * Actualizado para soportar tanto NextRequest como NextApiRequest
 */
export async function checkCRUDPermissions(
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete',
  request?: NextRequest | NextApiRequest
): Promise<AdminAuthResult & { supabase?: typeof supabaseAdmin; securityContext?: SecurityContext }> {
  const requiredPermissions = [[resource, action]];
  return checkAdminPermissions(requiredPermissions, request);
}

/**
 * Nueva función de validación de seguridad avanzada
 * Integra todas las validaciones de seguridad en una sola función
 */
export async function checkAdvancedSecurity(
  userId: string,
  operation: string,
  requiredPermissions: string[],
  request?: NextRequest | NextApiRequest
): Promise<SecurityValidationResult & { userProfile?: UserProfile; supabase?: typeof supabaseAdmin }> {
  try {
    // 1. Ejecutar detección de seguridad
    await runSecurityDetection(userId);

    // 2. Validar contexto de seguridad
    const securityValidation = await validateSecurityContext(
      userId,
      operation,
      requiredPermissions as any,
      request
    );

    if (!securityValidation.valid) {
      return securityValidation;
    }

    // 3. Obtener perfil de usuario desde Supabase
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return {
        valid: false,
        error: 'Perfil de usuario no encontrado',
        code: 'USER_PROFILE_NOT_FOUND',
        severity: 'high'
      };
    }

    // 4. Verificar disponibilidad de Supabase
    if (!supabaseAdmin) {
      return {
        valid: false,
        error: 'Servicio administrativo no disponible',
        code: 'SERVICE_UNAVAILABLE',
        severity: 'critical'
      };
    }

    return {
      valid: true,
      context: securityValidation.context,
      userProfile,
      supabase: supabaseAdmin
    };
  } catch (error) {
    console.error('[SECURITY] Error en checkAdvancedSecurity:', error);
    return {
      valid: false,
      error: 'Error interno en validación de seguridad',
      code: 'SECURITY_VALIDATION_ERROR',
      severity: 'critical'
    };
  }
}

// =====================================================
// FUNCIONES DE LOGGING Y AUDITORÍA
// =====================================================

/**
 * Registra acceso administrativo en el audit log
 */
export async function logAdminAccess(
  userProfileId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  additionalData?: Record<string, any>
): Promise<void> {
  try {
    if (!supabaseAdmin) return;

    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        user_id: userProfileId,
        action,
        resource_type: resourceType || 'system',
        resource_id: resourceId,
        new_values: additionalData ? JSON.stringify(additionalData) : null
      });
  } catch (error) {
    console.error('Error logging admin access:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
}

/**
 * Registra cambios en recursos administrativos
 */
export async function logAdminAction(
  userProfileId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  oldValues?: any,
  newValues?: any
): Promise<void> {
  try {
    if (!supabaseAdmin) return;

    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        user_id: userProfileId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null
      });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

// =====================================================
// UTILIDADES PARA NEXT.JS API ROUTES
// =====================================================

/**
 * Wrapper para API routes que requieren autenticación admin (App Router)
 */
export function withAdminAuth(
  handler: (
    request: NextRequest,
    context: { user: UserProfile; supabase: typeof supabaseAdmin }
  ) => Promise<Response>,
  requiredPermissions?: string[][]
) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await checkAdminPermissions(requiredPermissions, request);

    if (!authResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: authResult.error
        }),
        {
          status: authResult.status || 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, {
      user: authResult.user!,
      supabase: authResult.supabase!
    });
  };
}

/**
 * Wrapper para Pages Router API Routes que requieren autenticación admin
 */
export function withAdminAuthPages(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    context: { user: UserProfile; supabase: typeof supabaseAdmin }
  ) => Promise<void>,
  requiredPermissions?: string[][]
) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const authResult = await checkAdminPermissions(requiredPermissions, req);

    if (!authResult.success) {
      return res.status(authResult.status || 500).json({
        success: false,
        error: authResult.error
      });
    }

    return handler(req, res, {
      user: authResult.user!,
      supabase: authResult.supabase!
    });
  };
}

/**
 * Extrae información de la request para logging
 * Soporta tanto NextRequest como NextApiRequest
 */
export function getRequestInfo(request: NextRequest | NextApiRequest) {
  if ('query' in request) {
    // NextApiRequest (Pages Router)
    const req = request as NextApiRequest;
    return {
      method: req.method || 'GET',
      url: req.url || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.headers['x-forwarded-for'] ||
          req.headers['x-real-ip'] ||
          req.connection?.remoteAddress ||
          'unknown'
    };
  } else {
    // NextRequest (App Router)
    const req = request as NextRequest;
    return {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent') || 'unknown',
      ip: req.headers.get('x-forwarded-for') ||
          req.headers.get('x-real-ip') ||
          'unknown'
    };
  }
}
