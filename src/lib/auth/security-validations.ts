/**
 * Validaciones de Seguridad Avanzadas
 * Implementa verificaciones granulares de permisos y roles
 */

import { clerkClient } from '@clerk/nextjs/server';
import type { NextRequest, NextApiRequest } from 'next';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface SecurityContext {
  userId: string;
  sessionId?: string;
  userRole: string;
  permissions: UserPermissions;
  metadata: UserMetadata;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserPermissions {
  canReadProducts: boolean;
  canWriteProducts: boolean;
  canDeleteProducts: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageOrders: boolean;
  canAccessAdmin: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

export interface UserMetadata {
  role: string;
  department?: string;
  permissions?: Record<string, any>;
  lastLogin?: string;
  loginCount?: number;
  isActive: boolean;
  emailVerified: boolean;
}

export interface SecurityValidationResult {
  valid: boolean;
  context?: SecurityContext;
  error?: string;
  code?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// =====================================================
// FUNCIONES DE VALIDACIÓN DE ROLES
// =====================================================

/**
 * Obtiene permisos detallados basados en el rol del usuario
 */
export function getPermissionsByRole(role: string): UserPermissions {
  const rolePermissions: Record<string, UserPermissions> = {
    admin: {
      canReadProducts: true,
      canWriteProducts: true,
      canDeleteProducts: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageOrders: true,
      canAccessAdmin: true,
      isAdmin: true,
      isModerator: true
    },
    moderator: {
      canReadProducts: true,
      canWriteProducts: true,
      canDeleteProducts: false,
      canManageUsers: false,
      canViewAnalytics: true,
      canManageOrders: true,
      canAccessAdmin: true,
      isAdmin: false,
      isModerator: true
    },
    manager: {
      canReadProducts: true,
      canWriteProducts: true,
      canDeleteProducts: false,
      canManageUsers: false,
      canViewAnalytics: true,
      canManageOrders: true,
      canAccessAdmin: true,
      isAdmin: false,
      isModerator: false
    },
    user: {
      canReadProducts: false,
      canWriteProducts: false,
      canDeleteProducts: false,
      canManageUsers: false,
      canViewAnalytics: false,
      canManageOrders: false,
      canAccessAdmin: false,
      isAdmin: false,
      isModerator: false
    }
  };

  return rolePermissions[role] || rolePermissions.user;
}

/**
 * Valida si un rol es válido para operaciones administrativas
 */
export function isValidAdminRole(role: string): boolean {
  const validAdminRoles = ['admin', 'moderator', 'manager'];
  return validAdminRoles.includes(role);
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(
  permissions: UserPermissions,
  permission: keyof UserPermissions
): boolean {
  return permissions[permission] === true;
}

/**
 * Verifica múltiples permisos (OR logic)
 */
export function hasAnyPermission(
  permissions: UserPermissions,
  requiredPermissions: (keyof UserPermissions)[]
): boolean {
  return requiredPermissions.some(permission => hasPermission(permissions, permission));
}

/**
 * Verifica múltiples permisos (AND logic)
 */
export function hasAllPermissions(
  permissions: UserPermissions,
  requiredPermissions: (keyof UserPermissions)[]
): boolean {
  return requiredPermissions.every(permission => hasPermission(permissions, permission));
}

// =====================================================
// FUNCIONES DE VALIDACIÓN DE CONTEXTO
// =====================================================

/**
 * Obtiene el contexto de seguridad completo del usuario
 */
export async function getSecurityContext(
  userId: string,
  request?: NextRequest | NextApiRequest
): Promise<SecurityContext | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    if (!session?.user) {
      return null;
    }

    // Extraer metadata del usuario
    const metadata = user.publicMetadata as UserMetadata;
    const userRole = metadata?.role || 'user';
    
    // Obtener permisos basados en el rol
    const permissions = getPermissionsByRole(userRole);
    
    // Extraer información de la request
    let ipAddress: string | undefined;
    let userAgent: string | undefined;
    
    if (request) {
      if ('headers' in request && typeof request.headers.get === 'function') {
        // NextRequest
        ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
        userAgent = request.headers.get('user-agent') || 'unknown';
      } else if ('headers' in request) {
        // NextApiRequest
        const req = request as NextApiRequest;
        ipAddress = req.headers['x-forwarded-for'] as string || 
                   req.headers['x-real-ip'] as string || 
                   'unknown';
        userAgent = req.headers['user-agent'] || 'unknown';
      }
    }

    return {
      userId,
      userRole,
      permissions,
      metadata: {
        role: userRole,
        department: metadata?.department,
        permissions: metadata?.permissions,
        lastLogin: metadata?.lastLogin,
        loginCount: metadata?.loginCount,
        isActive: metadata?.isActive !== false,
        emailVerified: user.emailAddresses?.[0]?.verification?.status === 'verified'
      },
      ipAddress,
      userAgent
    };
  } catch (error) {
    console.error('[SECURITY] Error obteniendo contexto de seguridad:', error);
    return null;
  }
}

/**
 * Valida el contexto de seguridad para operaciones específicas
 */
export async function validateSecurityContext(
  userId: string,
  operation: string,
  requiredPermissions: (keyof UserPermissions)[],
  request?: NextRequest | NextApiRequest
): Promise<SecurityValidationResult> {
  try {
    // Obtener contexto de seguridad
    const context = await getSecurityContext(userId, request);
    
    if (!context) {
      return {
        valid: false,
        error: 'No se pudo obtener el contexto de seguridad del usuario',
        code: 'SECURITY_CONTEXT_ERROR',
        severity: 'high'
      };
    }

    // Validar que el usuario esté activo
    if (!context.metadata.isActive) {
      return {
        valid: false,
        error: 'Usuario inactivo',
        code: 'USER_INACTIVE',
        severity: 'medium'
      };
    }

    // Validar que el email esté verificado para operaciones críticas
    const criticalOperations = ['DELETE', 'MANAGE_USERS', 'MANAGE_ORDERS'];
    if (criticalOperations.some(op => operation.includes(op)) && !context.metadata.emailVerified) {
      return {
        valid: false,
        error: 'Email no verificado para operaciones críticas',
        code: 'EMAIL_NOT_VERIFIED',
        severity: 'medium'
      };
    }

    // Validar permisos requeridos
    if (!hasAllPermissions(context.permissions, requiredPermissions)) {
      return {
        valid: false,
        error: `Permisos insuficientes para la operación: ${operation}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        severity: 'high'
      };
    }

    // Validar rol para acceso admin
    if (requiredPermissions.includes('canAccessAdmin') && !isValidAdminRole(context.userRole)) {
      return {
        valid: false,
        error: 'Rol insuficiente para acceso administrativo',
        code: 'INVALID_ADMIN_ROLE',
        severity: 'high'
      };
    }

    return {
      valid: true,
      context
    };
  } catch (error) {
    console.error('[SECURITY] Error en validación de contexto:', error);
    return {
      valid: false,
      error: 'Error interno en validación de seguridad',
      code: 'VALIDATION_ERROR',
      severity: 'critical'
    };
  }
}

// =====================================================
// FUNCIONES DE VALIDACIÓN ESPECÍFICAS
// =====================================================

/**
 * Valida permisos para operaciones CRUD en productos
 */
export async function validateProductPermissions(
  userId: string,
  action: 'read' | 'create' | 'update' | 'delete',
  request?: NextRequest | NextApiRequest
): Promise<SecurityValidationResult> {
  const permissionMap = {
    read: ['canReadProducts'] as (keyof UserPermissions)[],
    create: ['canWriteProducts'] as (keyof UserPermissions)[],
    update: ['canWriteProducts'] as (keyof UserPermissions)[],
    delete: ['canDeleteProducts'] as (keyof UserPermissions)[]
  };

  return validateSecurityContext(
    userId,
    `PRODUCT_${action.toUpperCase()}`,
    permissionMap[action],
    request
  );
}

/**
 * Valida permisos para gestión de usuarios
 */
export async function validateUserManagementPermissions(
  userId: string,
  request?: NextRequest | NextApiRequest
): Promise<SecurityValidationResult> {
  return validateSecurityContext(
    userId,
    'MANAGE_USERS',
    ['canManageUsers', 'canAccessAdmin'],
    request
  );
}

/**
 * Valida permisos para acceso a analytics
 */
export async function validateAnalyticsPermissions(
  userId: string,
  request?: NextRequest | NextApiRequest
): Promise<SecurityValidationResult> {
  return validateSecurityContext(
    userId,
    'VIEW_ANALYTICS',
    ['canViewAnalytics', 'canAccessAdmin'],
    request
  );
}

/**
 * Valida permisos para gestión de órdenes
 */
export async function validateOrderManagementPermissions(
  userId: string,
  request?: NextRequest | NextApiRequest
): Promise<SecurityValidationResult> {
  return validateSecurityContext(
    userId,
    'MANAGE_ORDERS',
    ['canManageOrders', 'canAccessAdmin'],
    request
  );
}

// =====================================================
// MIDDLEWARE DE SEGURIDAD
// =====================================================

/**
 * Middleware de validación de seguridad para APIs
 */
export function withSecurityValidation(
  requiredPermissions: (keyof UserPermissions)[],
  operation: string
) {
  return function (handler: Function) {
    return async (request: NextRequest | NextApiRequest, ...args: any[]) => {
      try {
        // Obtener userId del request (debe ser añadido por middleware de autenticación)
        const userId = (request as any).userId ||
                      request.headers?.get?.('x-clerk-user-id') ||
                      (request.headers as any)?.['x-clerk-user-id'];

        if (!session?.user) {
          const errorResponse = {
            success: false,
            error: 'Usuario no autenticado',
            code: 'AUTH_REQUIRED'
          };

          if ('json' in args[0]) {
            // NextApiResponse
            return args[0].status(401).json(errorResponse);
          } else {
            // NextResponse
            return new Response(JSON.stringify(errorResponse), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Validar contexto de seguridad
        const validation = await validateSecurityContext(
          userId,
          operation,
          requiredPermissions,
          request
        );

        if (!validation.valid) {
          const errorResponse = {
            success: false,
            error: validation.error,
            code: validation.code,
            severity: validation.severity
          };

          const statusCode = validation.code === 'AUTH_REQUIRED' ? 401 : 403;

          if ('json' in args[0]) {
            // NextApiResponse
            return args[0].status(statusCode).json(errorResponse);
          } else {
            // NextResponse
            return new Response(JSON.stringify(errorResponse), {
              status: statusCode,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Añadir contexto de seguridad al request
        (request as any).securityContext = validation.context;

        // Ejecutar handler original
        return handler(request, ...args);
      } catch (error) {
        console.error('[SECURITY] Error en middleware de seguridad:', error);

        const errorResponse = {
          success: false,
          error: 'Error interno de seguridad',
          code: 'SECURITY_ERROR'
        };

        if ('json' in args[0]) {
          // NextApiResponse
          return args[0].status(500).json(errorResponse);
        } else {
          // NextResponse
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
 * Wrapper específico para validación de productos
 */
export function withProductSecurity(action: 'read' | 'create' | 'update' | 'delete') {
  const permissionMap = {
    read: ['canReadProducts'] as (keyof UserPermissions)[],
    create: ['canWriteProducts'] as (keyof UserPermissions)[],
    update: ['canWriteProducts'] as (keyof UserPermissions)[],
    delete: ['canDeleteProducts'] as (keyof UserPermissions)[]
  };

  return withSecurityValidation(
    permissionMap[action],
    `PRODUCT_${action.toUpperCase()}`
  );
}

/**
 * Wrapper específico para validación de usuarios
 */
export function withUserManagementSecurity() {
  return withSecurityValidation(
    ['canManageUsers', 'canAccessAdmin'],
    'MANAGE_USERS'
  );
}

/**
 * Wrapper específico para validación de analytics
 */
export function withAnalyticsSecurity() {
  return withSecurityValidation(
    ['canViewAnalytics', 'canAccessAdmin'],
    'VIEW_ANALYTICS'
  );
}

/**
 * Wrapper específico para validación de órdenes
 */
export function withOrderManagementSecurity() {
  return withSecurityValidation(
    ['canManageOrders', 'canAccessAdmin'],
    'MANAGE_ORDERS'
  );
}
