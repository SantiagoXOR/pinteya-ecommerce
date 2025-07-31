/**
 * Servicio de Sincronización Automática de Usuarios
 * Maneja la sincronización robusta entre Clerk y Supabase con retry logic y manejo de errores
 */

import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logSecurityEvent, logAdminAction } from './security-audit';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface ClerkUserData {
  id: string;
  email_addresses: {
    email_address: string;
    id: string;
    verification: {
      status: string;
      strategy: string;
    };
  }[];
  first_name: string | null;
  last_name: string | null;
  created_at: number;
  updated_at: number;
  image_url?: string;
  phone_numbers?: {
    phone_number: string;
    id: string;
    verification: {
      status: string;
    };
  }[];
  public_metadata?: Record<string, any>;
  private_metadata?: Record<string, any>;
}

export interface UserSyncResult {
  success: boolean;
  action: 'created' | 'updated' | 'found_existing' | 'deleted' | 'error';
  userId?: string;
  error?: string;
  details?: Record<string, any>;
}

export interface SyncOptions {
  retryAttempts?: number;
  retryDelay?: number;
  validateData?: boolean;
  createMissingRole?: boolean;
  logEvents?: boolean;
}

// =====================================================
// CONFIGURACIÓN Y CONSTANTES
// =====================================================

const DEFAULT_SYNC_OPTIONS: Required<SyncOptions> = {
  retryAttempts: 3,
  retryDelay: 1000, // 1 segundo
  validateData: true,
  createMissingRole: true,
  logEvents: true
};

const DEFAULT_ROLE_NAME = 'customer';

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

/**
 * Espera un tiempo determinado (para retry logic)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Valida los datos del usuario de Clerk
 */
function validateClerkUserData(userData: ClerkUserData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!userData.id) {
    errors.push('ID de usuario de Clerk es requerido');
  }

  if (!userData.email_addresses || userData.email_addresses.length === 0) {
    errors.push('Al menos un email es requerido');
  } else {
    const primaryEmail = userData.email_addresses[0]?.email_address;
    if (!primaryEmail || !primaryEmail.includes('@')) {
      errors.push('Email primario inválido');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Obtiene o crea el rol por defecto
 */
async function ensureDefaultRole(): Promise<number | null> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible');
    }

    // Intentar obtener el rol customer
    const { data: role, error } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role_name', DEFAULT_ROLE_NAME)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (role) {
      return role.id;
    }

    // Si no existe, crear el rol customer
    console.log('[USER_SYNC] Creando rol customer por defecto...');
    const { data: newRole, error: createError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        role_name: DEFAULT_ROLE_NAME,
        display_name: 'Cliente',
        description: 'Cliente regular del e-commerce',
        permissions: {
          orders: { create: true, read: true, update: false, delete: false },
          profile: { read: true, update: true }
        },
        is_active: true,
        is_system_role: true
      })
      .select('id')
      .single();

    if (createError) {
      console.error('[USER_SYNC] Error creando rol por defecto:', createError);
      return null;
    }

    return newRole.id;
  } catch (error) {
    console.error('[USER_SYNC] Error en ensureDefaultRole:', error);
    return null;
  }
}

// =====================================================
// FUNCIONES PRINCIPALES DE SINCRONIZACIÓN
// =====================================================

/**
 * Sincroniza un usuario de Clerk con Supabase
 */
export async function syncUserToSupabase(
  clerkUserData: ClerkUserData,
  options: SyncOptions = {}
): Promise<UserSyncResult> {
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };
  let lastError: Error | null = null;

  // Validar datos si está habilitado
  if (opts.validateData) {
    const validation = validateClerkUserData(clerkUserData);
    if (!validation.valid) {
      const error = `Datos de usuario inválidos: ${validation.errors.join(', ')}`;
      console.error('[USER_SYNC]', error);
      return { success: false, action: 'error', error };
    }
  }

  // Retry logic
  for (let attempt = 1; attempt <= opts.retryAttempts; attempt++) {
    try {
      console.log(`[USER_SYNC] Intento ${attempt}/${opts.retryAttempts} para usuario ${clerkUserData.id}`);

      const result = await performUserSync(clerkUserData, opts);

      // Log evento de éxito si está habilitado
      if (opts.logEvents && result.success) {
        await logSecurityEvent({
          user_id: clerkUserData.id,
          event_type: 'DATA_ACCESS',
          event_category: 'data_access',
          severity: 'low',
          description: `Usuario sincronizado: ${result.action}`,
          metadata: {
            action: result.action,
            email: clerkUserData.email_addresses[0]?.email_address,
            attempt
          }
        });
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`[USER_SYNC] Error en intento ${attempt}:`, error);

      // Si no es el último intento, esperar antes de reintentar
      if (attempt < opts.retryAttempts) {
        const delayMs = opts.retryDelay * attempt; // Backoff exponencial
        console.log(`[USER_SYNC] Esperando ${delayMs}ms antes del siguiente intento...`);
        await delay(delayMs);
      }
    }
  }

  // Log evento de error si está habilitado
  if (opts.logEvents) {
    await logSecurityEvent({
      user_id: clerkUserData.id,
      event_type: 'SECURITY_VIOLATION',
      event_category: 'data_access',
      severity: 'medium',
      description: `Error sincronizando usuario después de ${opts.retryAttempts} intentos`,
      metadata: {
        error: lastError?.message,
        email: clerkUserData.email_addresses[0]?.email_address,
        attempts: opts.retryAttempts
      }
    });
  }

  return {
    success: false,
    action: 'error',
    error: `Error después de ${opts.retryAttempts} intentos: ${lastError?.message}`
  };
}

/**
 * Realiza la sincronización real del usuario
 */
async function performUserSync(
  clerkUserData: ClerkUserData,
  options: Required<SyncOptions>
): Promise<UserSyncResult> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client no disponible');
  }

  const primaryEmail = clerkUserData.email_addresses[0]?.email_address;
  const isEmailVerified = clerkUserData.email_addresses[0]?.verification?.status === 'verified';

  // Verificar si el usuario ya existe
  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .or(`email.eq.${primaryEmail},clerk_user_id.eq.${clerkUserData.id}`)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Error verificando usuario existente: ${fetchError.message}`);
  }

  // Preparar datos del usuario
  const userData = {
    clerk_user_id: clerkUserData.id,
    email: primaryEmail,
    first_name: clerkUserData.first_name,
    last_name: clerkUserData.last_name,
    is_verified: isEmailVerified,
    is_active: true,
    metadata: {
      clerk_created_at: clerkUserData.created_at,
      clerk_updated_at: clerkUserData.updated_at,
      image_url: clerkUserData.image_url,
      phone_numbers: clerkUserData.phone_numbers,
      public_metadata: clerkUserData.public_metadata,
      last_sync: new Date().toISOString()
    },
    updated_at: new Date().toISOString()
  };

  if (existingUser) {
    // Actualizar usuario existente
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(userData)
      .eq('id', existingUser.id)
      .select('*')
      .single();

    if (updateError) {
      throw new Error(`Error actualizando usuario: ${updateError.message}`);
    }

    return {
      success: true,
      action: 'updated',
      userId: updatedUser.id,
      details: { previousData: existingUser, newData: updatedUser }
    };
  } else {
    // Crear nuevo usuario
    let roleId: number | null = null;

    if (options.createMissingRole) {
      roleId = await ensureDefaultRole();
    }

    const newUserData = {
      ...userData,
      role_id: roleId
    };

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('user_profiles')
      .insert(newUserData)
      .select('*')
      .single();

    if (insertError) {
      // Manejar error de clave duplicada
      if (insertError.code === '23505') {
        console.log('[USER_SYNC] Usuario ya existe (clave duplicada), obteniendo usuario...');
        const { data: existingUserRetry, error: retryError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .or(`email.eq.${primaryEmail},clerk_user_id.eq.${clerkUserData.id}`)
          .single();

        if (!retryError && existingUserRetry) {
          return {
            success: true,
            action: 'found_existing',
            userId: existingUserRetry.id,
            details: { userData: existingUserRetry }
          };
        }
      }

      throw new Error(`Error creando usuario: ${insertError.message}`);
    }

    return {
      success: true,
      action: 'created',
      userId: newUser.id,
      details: { userData: newUser }
    };
  }
}

/**
 * Elimina un usuario de Supabase (soft delete)
 */
export async function deleteUserFromSupabase(
  clerkUserId: string,
  options: SyncOptions = {}
): Promise<UserSyncResult> {
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };
  let lastError: Error | null = null;

  // Retry logic
  for (let attempt = 1; attempt <= opts.retryAttempts; attempt++) {
    try {
      console.log(`[USER_SYNC] Eliminando usuario ${clerkUserId} - Intento ${attempt}/${opts.retryAttempts}`);

      if (!supabaseAdmin) {
        throw new Error('Supabase admin client no disponible');
      }

      // Soft delete: marcar como inactivo en lugar de eliminar
      const { data: deletedUser, error: deleteError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          is_active: false,
          clerk_user_id: null, // Limpiar referencia a Clerk
          metadata: {
            deleted_at: new Date().toISOString(),
            deleted_by: 'clerk_webhook',
            original_clerk_id: clerkUserId
          },
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', clerkUserId)
        .select('*')
        .single();

      if (deleteError && deleteError.code !== 'PGRST116') {
        throw new Error(`Error eliminando usuario: ${deleteError.message}`);
      }

      if (!deletedUser) {
        console.log(`[USER_SYNC] Usuario ${clerkUserId} no encontrado en Supabase`);
        return {
          success: true,
          action: 'deleted',
          details: { message: 'Usuario no encontrado en Supabase' }
        };
      }

      // Log evento si está habilitado
      if (opts.logEvents) {
        await logSecurityEvent({
          user_id: clerkUserId,
          event_type: 'ADMIN_ACTION',
          event_category: 'admin_operations',
          severity: 'medium',
          description: 'Usuario eliminado de Supabase',
          metadata: {
            action: 'soft_delete',
            user_email: deletedUser.email,
            attempt
          }
        });
      }

      return {
        success: true,
        action: 'deleted',
        userId: deletedUser.id,
        details: { deletedUser }
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`[USER_SYNC] Error en intento ${attempt}:`, error);

      if (attempt < opts.retryAttempts) {
        const delayMs = opts.retryDelay * attempt;
        await delay(delayMs);
      }
    }
  }

  return {
    success: false,
    action: 'error',
    error: `Error después de ${opts.retryAttempts} intentos: ${lastError?.message}`
  };
}

/**
 * Sincroniza un usuario desde Clerk usando su ID
 */
export async function syncUserFromClerk(
  clerkUserId: string,
  options: SyncOptions = {}
): Promise<UserSyncResult> {
  try {
    console.log(`[USER_SYNC] Obteniendo usuario ${clerkUserId} desde Clerk...`);

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);

    if (!clerkUser) {
      return {
        success: false,
        action: 'error',
        error: 'Usuario no encontrado en Clerk'
      };
    }

    // Convertir datos de Clerk al formato esperado
    const clerkUserData: ClerkUserData = {
      id: clerkUser.id,
      email_addresses: clerkUser.emailAddresses.map(email => ({
        email_address: email.emailAddress,
        id: email.id,
        verification: {
          status: email.verification?.status || 'unverified',
          strategy: email.verification?.strategy || 'unknown'
        }
      })),
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      created_at: clerkUser.createdAt,
      updated_at: clerkUser.updatedAt,
      image_url: clerkUser.imageUrl,
      phone_numbers: clerkUser.phoneNumbers?.map(phone => ({
        phone_number: phone.phoneNumber,
        id: phone.id,
        verification: {
          status: phone.verification?.status || 'unverified'
        }
      })),
      public_metadata: clerkUser.publicMetadata,
      private_metadata: clerkUser.privateMetadata
    };

    return await syncUserToSupabase(clerkUserData, options);
  } catch (error) {
    console.error('[USER_SYNC] Error obteniendo usuario de Clerk:', error);
    return {
      success: false,
      action: 'error',
      error: `Error obteniendo usuario de Clerk: ${error.message}`
    };
  }
}

/**
 * Sincronización masiva de usuarios desde Clerk
 */
export async function bulkSyncUsersFromClerk(
  options: SyncOptions & { batchSize?: number; maxUsers?: number } = {}
): Promise<{
  success: boolean;
  totalProcessed: number;
  successful: number;
  failed: number;
  results: UserSyncResult[];
}> {
  const opts = {
    ...DEFAULT_SYNC_OPTIONS,
    batchSize: 10,
    maxUsers: 100,
    ...options
  };

  console.log('[USER_SYNC] Iniciando sincronización masiva de usuarios...');

  try {
    const client = await clerkClient();
    const results: UserSyncResult[] = [];
    let offset = 0;
    let totalProcessed = 0;
    let successful = 0;
    let failed = 0;

    while (totalProcessed < opts.maxUsers) {
      const limit = Math.min(opts.batchSize, opts.maxUsers - totalProcessed);

      console.log(`[USER_SYNC] Obteniendo batch ${offset}-${offset + limit}...`);

      const clerkUsers = await client.users.getUserList({
        limit,
        offset
      });

      if (!clerkUsers || clerkUsers.length === 0) {
        console.log('[USER_SYNC] No hay más usuarios para procesar');
        break;
      }

      // Procesar usuarios en paralelo (con límite)
      const batchPromises = clerkUsers.map(async (clerkUser) => {
        const clerkUserData: ClerkUserData = {
          id: clerkUser.id,
          email_addresses: clerkUser.emailAddresses.map(email => ({
            email_address: email.emailAddress,
            id: email.id,
            verification: {
              status: email.verification?.status || 'unverified',
              strategy: email.verification?.strategy || 'unknown'
            }
          })),
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
          created_at: clerkUser.createdAt,
          updated_at: clerkUser.updatedAt,
          image_url: clerkUser.imageUrl,
          phone_numbers: clerkUser.phoneNumbers?.map(phone => ({
            phone_number: phone.phoneNumber,
            id: phone.id,
            verification: {
              status: phone.verification?.status || 'unverified'
            }
          })),
          public_metadata: clerkUser.publicMetadata,
          private_metadata: clerkUser.privateMetadata
        };

        return await syncUserToSupabase(clerkUserData, {
          ...opts,
          logEvents: false // Evitar spam de logs en sync masivo
        });
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (result.value.success) {
            successful++;
          } else {
            failed++;
          }
        } else {
          console.error(`[USER_SYNC] Error procesando usuario ${index}:`, result.reason);
          results.push({
            success: false,
            action: 'error',
            error: result.reason?.message || 'Error desconocido'
          });
          failed++;
        }
      });

      totalProcessed += clerkUsers.length;
      offset += limit;

      // Pequeña pausa entre batches para no sobrecargar
      if (totalProcessed < opts.maxUsers) {
        await delay(500);
      }
    }

    console.log(`[USER_SYNC] Sincronización masiva completada: ${successful} exitosos, ${failed} fallidos`);

    return {
      success: failed === 0,
      totalProcessed,
      successful,
      failed,
      results
    };
  } catch (error) {
    console.error('[USER_SYNC] Error en sincronización masiva:', error);
    return {
      success: false,
      totalProcessed: 0,
      successful: 0,
      failed: 1,
      results: [{
        success: false,
        action: 'error',
        error: `Error en sincronización masiva: ${error.message}`
      }]
    };
  }
}
