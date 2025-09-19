/**
 * Security Validations
 * Validaciones de seguridad y permisos para el sistema enterprise
 */

import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { logger } from '@/lib/enterprise/logger';

export type Permission = 
  | 'read:products'
  | 'write:products'
  | 'delete:products'
  | 'read:orders'
  | 'write:orders'
  | 'delete:orders'
  | 'read:users'
  | 'write:users'
  | 'delete:users'
  | 'admin:dashboard'
  | 'admin:settings'
  | 'admin:reports'
  | 'moderate:content'
  | 'moderate:users';

export type Role = 'admin' | 'customer' | 'moderator';

export interface RolePermissions {
  [key: string]: Permission[];
}

/**
 * Definición de permisos por rol
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    'read:products',
    'write:products',
    'delete:products',
    'read:orders',
    'write:orders',
    'delete:orders',
    'read:users',
    'write:users',
    'delete:users',
    'admin:dashboard',
    'admin:settings',
    'admin:reports',
    'moderate:content',
    'moderate:users',
  ],
  moderator: [
    'read:products',
    'write:products',
    'read:orders',
    'write:orders',
    'read:users',
    'moderate:content',
    'moderate:users',
  ],
  customer: [
    'read:products',
    'read:orders',
  ],
};

/**
 * Obtiene los permisos de un rol específico
 */
export function getPermissionsByRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Verifica si un rol tiene un permiso específico
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const permissions = getPermissionsByRole(role);
  return permissions.includes(permission);
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role, permissions')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      logger.error('Error obteniendo usuario para validación de permisos:', error);
      return false;
    }

    // Verificar permisos del rol
    const rolePermissions = getPermissionsByRole(user.role as Role);
    if (rolePermissions.includes(permission)) {
      return true;
    }

    // Verificar permisos específicos del usuario
    const userPermissions = user.permissions || [];
    return userPermissions.includes(permission);
  } catch (error) {
    logger.error('Error en hasPermission:', error);
    return false;
  }
}

/**
 * Verifica si un usuario tiene alguno de los permisos especificados
 */
export async function hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(userId, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Verifica si un usuario tiene todos los permisos especificados
 */
export async function hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(userId, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Verifica si un usuario es administrador
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return false;
    }

    return user.role === 'admin';
  } catch (error) {
    logger.error('Error en isAdmin:', error);
    return false;
  }
}

/**
 * Verifica si un usuario es moderador o administrador
 */
export async function isModerator(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return false;
    }

    return ['admin', 'moderator'].includes(user.role);
  } catch (error) {
    logger.error('Error en isModerator:', error);
    return false;
  }
}

/**
 * Obtiene el rol de un usuario
 */
export async function getUserRole(userId: string): Promise<Role | null> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return null;
    }

    return user.role as Role;
  } catch (error) {
    logger.error('Error en getUserRole:', error);
    return null;
  }
}

/**
 * Valida acceso a recurso específico
 */
export async function validateResourceAccess(
  userId: string,
  resourceType: 'product' | 'order' | 'user',
  action: 'read' | 'write' | 'delete',
  resourceId?: string
): Promise<boolean> {
  const permission = `${action}:${resourceType}s` as Permission;
  
  // Verificar permiso básico
  if (!(await hasPermission(userId, permission))) {
    return false;
  }

  // Validaciones adicionales por tipo de recurso
  if (resourceType === 'order' && resourceId) {
    // Los customers solo pueden acceder a sus propias órdenes
    const userRole = await getUserRole(userId);
    if (userRole === 'customer') {
      return await validateOrderOwnership(userId, resourceId);
    }
  }

  return true;
}

/**
 * Valida que un usuario sea propietario de una orden
 */
async function validateOrderOwnership(userId: string, orderId: string): Promise<boolean> {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return false;
    }

    return order.user_id === userId;
  } catch (error) {
    logger.error('Error validando propiedad de orden:', error);
    return false;
  }
}

/**
 * Middleware de validación de permisos
 */
export function requirePermission(permission: Permission) {
  return async (userId: string): Promise<boolean> => {
    return await hasPermission(userId, permission);
  };
}

/**
 * Middleware de validación de rol
 */
export function requireRole(role: Role) {
  return async (userId: string): Promise<boolean> => {
    const userRole = await getUserRole(userId);
    return userRole === role;
  };
}

/**
 * Middleware de validación de administrador
 */
export function requireAdmin() {
  return async (userId: string): Promise<boolean> => {
    return await isAdmin(userId);
  };
}

/**
 * Obtiene todos los permisos de un usuario
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role, permissions')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return [];
    }

    const rolePermissions = getPermissionsByRole(user.role as Role);
    const userPermissions = user.permissions || [];
    
    // Combinar permisos del rol y permisos específicos del usuario
    const allPermissions = [...rolePermissions, ...userPermissions];
    
    // Eliminar duplicados
    return [...new Set(allPermissions)];
  } catch (error) {
    logger.error('Error en getUserPermissions:', error);
    return [];
  }
}









