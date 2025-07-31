/**
 * Gestión de Usuarios Enterprise
 * Utilidades avanzadas para gestión de usuarios combinando Clerk + Supabase
 */

import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { EnterpriseAuthContext } from './enterprise-auth-utils';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface EnterpriseUser {
  id: string;
  clerkId: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'moderator';
  permissions: string[];
  isActive: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  loginCount: number;
}

export interface UserCreationOptions {
  email: string;
  name?: string;
  role?: 'admin' | 'user' | 'moderator';
  permissions?: string[];
  metadata?: any;
  sendInvitation?: boolean;
}

export interface UserUpdateOptions {
  name?: string;
  role?: 'admin' | 'user' | 'moderator';
  permissions?: string[];
  metadata?: any;
  isActive?: boolean;
}

export interface UserSearchOptions {
  query?: string;
  role?: 'admin' | 'user' | 'moderator';
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserOperationResult {
  success: boolean;
  user?: EnterpriseUser;
  users?: EnterpriseUser[];
  error?: string;
  code?: string;
  total?: number;
}

// =====================================================
// FUNCIONES DE GESTIÓN DE USUARIOS
// =====================================================

/**
 * Obtiene un usuario por su ID de Clerk
 */
export async function getEnterpriseUser(
  clerkUserId: string,
  context?: EnterpriseAuthContext
): Promise<UserOperationResult> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: 'Supabase admin client no disponible',
        code: 'SUPABASE_UNAVAILABLE'
      };
    }

    // Obtener datos de Supabase
    const { data: userProfile, error: supabaseError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (supabaseError && supabaseError.code !== 'PGRST116') {
      console.error('[ENTERPRISE_USER] Error obteniendo usuario de Supabase:', supabaseError);
      return {
        success: false,
        error: 'Error obteniendo datos del usuario',
        code: 'SUPABASE_ERROR'
      };
    }

    // Obtener datos de Clerk
    let clerkUser;
    try {
      const client = await clerkClient();
      clerkUser = await client.users.getUser(clerkUserId);
    } catch (clerkError) {
      console.error('[ENTERPRISE_USER] Error obteniendo usuario de Clerk:', clerkError);
      return {
        success: false,
        error: 'Error obteniendo datos de autenticación',
        code: 'CLERK_ERROR'
      };
    }

    // Combinar datos
    const enterpriseUser: EnterpriseUser = {
      id: userProfile?.id || clerkUserId,
      clerkId: clerkUserId,
      email: clerkUser.emailAddresses[0]?.emailAddress || userProfile?.email || '',
      name: userProfile?.name || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || undefined,
      role: userProfile?.role || 'user',
      permissions: userProfile?.permissions || [],
      isActive: userProfile?.is_active ?? true,
      metadata: userProfile?.metadata || {},
      createdAt: userProfile?.created_at || clerkUser.createdAt.toString(),
      updatedAt: userProfile?.updated_at || clerkUser.updatedAt.toString(),
      lastLoginAt: userProfile?.last_login_at,
      loginCount: userProfile?.login_count || 0
    };

    return {
      success: true,
      user: enterpriseUser
    };

  } catch (error) {
    console.error('[ENTERPRISE_USER] Error en getEnterpriseUser:', error);
    return {
      success: false,
      error: 'Error interno obteniendo usuario',
      code: 'INTERNAL_ERROR'
    };
  }
}

/**
 * Busca usuarios con filtros avanzados
 */
export async function searchEnterpriseUsers(
  options: UserSearchOptions = {},
  context?: EnterpriseAuthContext
): Promise<UserOperationResult> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: 'Supabase admin client no disponible',
        code: 'SUPABASE_UNAVAILABLE'
      };
    }

    // Verificar permisos
    if (context && !context.permissions.includes('user_management')) {
      return {
        success: false,
        error: 'Permisos insuficientes para buscar usuarios',
        code: 'INSUFFICIENT_PERMISSIONS'
      };
    }

    let query = supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (options.query) {
      query = query.or(`name.ilike.%${options.query}%,email.ilike.%${options.query}%`);
    }

    if (options.role) {
      query = query.eq('role', options.role);
    }

    if (options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    // Aplicar ordenamiento
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Aplicar paginación
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data: userProfiles, error: searchError, count } = await query;

    if (searchError) {
      console.error('[ENTERPRISE_USER] Error buscando usuarios:', searchError);
      return {
        success: false,
        error: 'Error buscando usuarios',
        code: 'SEARCH_ERROR'
      };
    }

    // Convertir a formato enterprise
    const enterpriseUsers: EnterpriseUser[] = (userProfiles || []).map(profile => ({
      id: profile.id,
      clerkId: profile.clerk_user_id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      permissions: profile.permissions || [],
      isActive: profile.is_active,
      metadata: profile.metadata || {},
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      lastLoginAt: profile.last_login_at,
      loginCount: profile.login_count || 0
    }));

    return {
      success: true,
      users: enterpriseUsers,
      total: count || 0
    };

  } catch (error) {
    console.error('[ENTERPRISE_USER] Error en searchEnterpriseUsers:', error);
    return {
      success: false,
      error: 'Error interno buscando usuarios',
      code: 'INTERNAL_ERROR'
    };
  }
}

/**
 * Actualiza un usuario enterprise
 */
export async function updateEnterpriseUser(
  clerkUserId: string,
  updates: UserUpdateOptions,
  context: EnterpriseAuthContext
): Promise<UserOperationResult> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: 'Supabase admin client no disponible',
        code: 'SUPABASE_UNAVAILABLE'
      };
    }

    // Verificar permisos
    if (!context.permissions.includes('user_management')) {
      return {
        success: false,
        error: 'Permisos insuficientes para actualizar usuarios',
        code: 'INSUFFICIENT_PERMISSIONS'
      };
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    // Actualizar en Supabase
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('clerk_user_id', clerkUserId)
      .select('*')
      .single();

    if (updateError) {
      console.error('[ENTERPRISE_USER] Error actualizando usuario:', updateError);
      return {
        success: false,
        error: 'Error actualizando usuario',
        code: 'UPDATE_ERROR'
      };
    }

    // Actualizar en Clerk si es necesario
    if (updates.name) {
      try {
        const client = await clerkClient();
        const nameParts = updates.name.split(' ');
        await client.users.updateUser(clerkUserId, {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || ''
        });
      } catch (clerkError) {
        console.warn('[ENTERPRISE_USER] Error actualizando nombre en Clerk:', clerkError);
        // No fallar la operación por esto
      }
    }

    // Retornar usuario actualizado
    const userResult = await getEnterpriseUser(clerkUserId, context);
    return userResult;

  } catch (error) {
    console.error('[ENTERPRISE_USER] Error en updateEnterpriseUser:', error);
    return {
      success: false,
      error: 'Error interno actualizando usuario',
      code: 'INTERNAL_ERROR'
    };
  }
}

/**
 * Registra actividad de login del usuario
 */
export async function recordUserLogin(
  clerkUserId: string,
  metadata?: any
): Promise<void> {
  try {
    if (!supabaseAdmin) return;

    await supabaseAdmin
      .from('user_profiles')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: supabaseAdmin.raw('login_count + 1'),
        updated_at: new Date().toISOString(),
        metadata: supabaseAdmin.raw(`
          COALESCE(metadata, '{}'::jsonb) || 
          jsonb_build_object('last_login_metadata', $1::jsonb)
        `, [JSON.stringify(metadata || {})])
      })
      .eq('clerk_user_id', clerkUserId);

  } catch (error) {
    console.error('[ENTERPRISE_USER] Error registrando login:', error);
  }
}

/**
 * Obtiene estadísticas de usuarios
 */
export async function getUserStatistics(
  context: EnterpriseAuthContext
): Promise<{
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  recentLogins: number;
}> {
  try {
    if (!supabaseAdmin || !context.permissions.includes('user_management')) {
      return { totalUsers: 0, activeUsers: 0, adminUsers: 0, recentLogins: 0 };
    }

    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: adminUsers },
      { count: recentLogins }
    ] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true })
        .gte('last_login_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      adminUsers: adminUsers || 0,
      recentLogins: recentLogins || 0
    };

  } catch (error) {
    console.error('[ENTERPRISE_USER] Error obteniendo estadísticas:', error);
    return { totalUsers: 0, activeUsers: 0, adminUsers: 0, recentLogins: 0 };
  }
}
