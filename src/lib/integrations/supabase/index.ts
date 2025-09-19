// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN SUPABASE
// ===================================

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { supabaseConfig, isSupabaseConfigured } from '../../../../lib/env-config';

// Verificar configuración de Supabase
if (!isSupabaseConfigured()) {
  console.error('Variables de entorno de Supabase faltantes:', {
    NEXT_PUBLIC_SUPABASE_URL: !!supabaseConfig.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseConfig.anonKey,
    SUPABASE_SERVICE_ROLE_KEY: !!supabaseConfig.serviceRoleKey,
  });

  // En desarrollo, mostrar error detallado
  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      'Faltan variables de entorno de Supabase. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
    );
  }

  // En producción, continuar con valores por defecto para evitar que falle el build
  console.warn('Usando configuración por defecto de Supabase para el build');
}

// ===================================
// CLIENTE PÚBLICO (PARA FRONTEND)
// ===================================
export const supabase = isSupabaseConfigured()
  ? createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : null;

// ===================================
// CLIENTE ADMINISTRATIVO (PARA API ROUTES)
// ===================================
export const supabaseAdmin = supabaseConfig.url && supabaseConfig.serviceRoleKey
  ? createClient<Database>(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// ===================================
// FUNCIONES AUXILIARES
// ===================================

/**
 * Obtiene el cliente de Supabase apropiado según el contexto
 * @param useAdmin - Si usar el cliente administrativo
 * @returns Cliente de Supabase
 */
export function getSupabaseClient(useAdmin = false) {
  if (useAdmin) {
    if (!supabaseAdmin) {
      throw new Error(
        'Cliente administrativo de Supabase no disponible. Verifica SUPABASE_SERVICE_ROLE_KEY en .env.local'
      );
    }
    return supabaseAdmin;
  }
  return supabase;
}

/**
 * Maneja errores de Supabase de manera consistente
 * @param error - Error de Supabase
 * @param context - Contexto donde ocurrió el error
 */
export function handleSupabaseError(error: any, context: string) {
  console.error(`Error en ${context}:`, error);
  
  if (error?.code === 'PGRST116') {
    throw new Error('Recurso no encontrado');
  }
  
  if (error?.code === '23505') {
    throw new Error('Ya existe un registro con estos datos');
  }
  
  if (error?.code === '23503') {
    throw new Error('Referencia inválida a otro registro');
  }
  
  throw new Error(error?.message || 'Error interno del servidor');
}

/**
 * Verifica si el usuario está autenticado
 * @returns Promise<boolean>
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    if (!supabase) {return false;}
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Obtiene el usuario actual
 * @returns Promise<User | null>
 */
export async function getCurrentUser() {
  try {
    if (!supabase) {return null;}
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {throw error;}
    return user;
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    return null;
  }
}

// ===================================
// TIPOS PARA RESPUESTAS
// ===================================
export type SupabaseResponse<T> = {
  data: T | null;
  error: any;
};

export type SupabaseArrayResponse<T> = {
  data: T[] | null;
  error: any;
  count?: number | null;
};








