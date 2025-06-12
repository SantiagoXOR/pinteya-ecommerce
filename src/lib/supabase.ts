// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN SUPABASE
// ===================================

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Verificar que las variables de entorno estén configuradas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
  );
}

// ===================================
// CLIENTE PÚBLICO (PARA FRONTEND)
// ===================================
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// ===================================
// CLIENTE ADMINISTRATIVO (PARA API ROUTES)
// ===================================
export const supabaseAdmin = supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
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
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
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
