/**
 * User Sync Service
 * Servicio de sincronización de usuarios entre NextAuth y Supabase
 */

import { supabaseAdmin } from '@/lib/integrations/supabase';
import { logger } from '@/lib/enterprise/logger';

export interface UserSyncData {
  id: string;
  email: string;
  name?: string;
  image?: string;
  provider?: string;
}

export interface SyncResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * Sincroniza un usuario de NextAuth a Supabase
 */
export async function syncUserToSupabase(userData: UserSyncData): Promise<SyncResult> {
  try {
    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', userData.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Error verificando usuario existente:', checkError);
      return { success: false, error: 'Error verificando usuario' };
    }

    if (existingUser) {
      // Usuario existe, actualizar información
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          name: userData.name,
          image: userData.image,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);

      if (updateError) {
        logger.error('Error actualizando usuario:', updateError);
        return { success: false, error: 'Error actualizando usuario' };
      }

      logger.info(`Usuario actualizado: ${userData.email}`);
      return { success: true, userId: existingUser.id };
    } else {
      // Usuario nuevo, crear
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          image: userData.image,
          role: 'customer', // Rol por defecto
          is_active: true,
          provider: userData.provider || 'google',
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) {
        logger.error('Error creando usuario:', createError);
        return { success: false, error: 'Error creando usuario' };
      }

      logger.info(`Usuario creado: ${userData.email}`);
      return { success: true, userId: newUser.id };
    }
  } catch (error) {
    logger.error('Error en syncUserToSupabase:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Elimina un usuario de Supabase
 */
export async function deleteUserFromSupabase(userId: string): Promise<SyncResult> {
  try {
    // Marcar como inactivo en lugar de eliminar
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      logger.error('Error desactivando usuario:', error);
      return { success: false, error: 'Error desactivando usuario' };
    }

    logger.info(`Usuario desactivado: ${userId}`);
    return { success: true, userId };
  } catch (error) {
    logger.error('Error en deleteUserFromSupabase:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Sincroniza usuario desde NextAuth (legacy Clerk migration)
 */
export async function syncUserFromClerk(userData: UserSyncData): Promise<SyncResult> {
  // Esta función es para compatibilidad con la migración de Clerk
  // Redirige a la función principal de sincronización
  return syncUserToSupabase(userData);
}

/**
 * Obtiene información de usuario desde Supabase
 */
export async function getUserFromSupabase(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.error('Error obteniendo usuario:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error en getUserFromSupabase:', error);
    return null;
  }
}

/**
 * Actualiza el último login de un usuario
 */
export async function updateLastLogin(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      logger.error('Error actualizando último login:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error en updateLastLogin:', error);
    return false;
  }
}

/**
 * Verifica si un usuario está activo
 */
export async function isUserActive(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('is_active')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Error verificando estado de usuario:', error);
      return false;
    }

    return data.is_active;
  } catch (error) {
    logger.error('Error en isUserActive:', error);
    return false;
  }
}

/**
 * Obtiene estadísticas de sincronización
 */
export async function getSyncStatistics() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('provider, is_active, created_at')
      .not('provider', 'is', null);

    if (error) {
      logger.error('Error obteniendo estadísticas de sync:', error);
      return null;
    }

    const stats = {
      totalUsers: data.length,
      activeUsers: data.filter(u => u.is_active).length,
      inactiveUsers: data.filter(u => !u.is_active).length,
      byProvider: {
        google: data.filter(u => u.provider === 'google').length,
        clerk: data.filter(u => u.provider === 'clerk').length,
        other: data.filter(u => u.provider && !['google', 'clerk'].includes(u.provider)).length,
      },
      recentSyncs: data.filter(u => {
        const createdAt = new Date(u.created_at);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return createdAt > dayAgo;
      }).length
    };

    return stats;
  } catch (error) {
    logger.error('Error en getSyncStatistics:', error);
    return null;
  }
}









