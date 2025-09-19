/**
 * Enterprise User Management
 * Gestión avanzada de usuarios para el sistema enterprise
 */

import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { logger } from '@/lib/enterprise/logger';

export interface EnterpriseUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'customer' | 'moderator';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserManagementOptions {
  includePermissions?: boolean;
  includeLastLogin?: boolean;
  filterByRole?: string;
  isActive?: boolean;
}

/**
 * Obtiene un usuario por ID con información enterprise
 */
export async function getEnterpriseUser(
  userId: string,
  options: UserManagementOptions = {}
): Promise<EnterpriseUser | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        is_active,
        last_login,
        created_at,
        updated_at
        ${options.includePermissions ? ', permissions' : ''}
      `)
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Error obteniendo usuario enterprise:', error);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      permissions: data.permissions || [],
      isActive: data.is_active,
      lastLogin: data.last_login ? new Date(data.last_login) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    logger.error('Error en getEnterpriseUser:', error);
    return null;
  }
}

/**
 * Lista usuarios con filtros enterprise
 */
export async function listEnterpriseUsers(
  options: UserManagementOptions = {}
): Promise<EnterpriseUser[]> {
  try {
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        is_active,
        last_login,
        created_at,
        updated_at
        ${options.includePermissions ? ', permissions' : ''}
      `);

    if (options.filterByRole) {
      query = query.eq('role', options.filterByRole);
    }

    if (options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Error listando usuarios enterprise:', error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions || [],
      isActive: user.is_active,
      lastLogin: user.last_login ? new Date(user.last_login) : undefined,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    }));
  } catch (error) {
    logger.error('Error en listEnterpriseUsers:', error);
    return [];
  }
}

/**
 * Actualiza el rol de un usuario
 */
export async function updateUserRole(
  userId: string,
  newRole: 'admin' | 'customer' | 'moderator'
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      logger.error('Error actualizando rol de usuario:', error);
      return false;
    }

    logger.info(`Rol de usuario ${userId} actualizado a ${newRole}`);
    return true;
  } catch (error) {
    logger.error('Error en updateUserRole:', error);
    return false;
  }
}

/**
 * Activa o desactiva un usuario
 */
export async function toggleUserStatus(
  userId: string,
  isActive: boolean
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      logger.error('Error cambiando estado de usuario:', error);
      return false;
    }

    logger.info(`Usuario ${userId} ${isActive ? 'activado' : 'desactivado'}`);
    return true;
  } catch (error) {
    logger.error('Error en toggleUserStatus:', error);
    return false;
  }
}

/**
 * Obtiene estadísticas de usuarios enterprise
 */
export async function getUserStatistics() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role, is_active')
      .not('role', 'is', null);

    if (error) {
      logger.error('Error obteniendo estadísticas de usuarios:', error);
      return null;
    }

    const stats = {
      total: data.length,
      active: data.filter(u => u.is_active).length,
      inactive: data.filter(u => !u.is_active).length,
      byRole: {
        admin: data.filter(u => u.role === 'admin').length,
        customer: data.filter(u => u.role === 'customer').length,
        moderator: data.filter(u => u.role === 'moderator').length,
      }
    };

    return stats;
  } catch (error) {
    logger.error('Error en getUserStatistics:', error);
    return null;
  }
}

/**
 * Registra el último login de un usuario
 */
export async function recordUserLogin(userId: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  } catch (error) {
    logger.error('Error registrando login de usuario:', error);
  }
}









