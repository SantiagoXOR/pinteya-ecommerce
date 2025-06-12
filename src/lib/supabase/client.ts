// ===================================
// PINTEYA E-COMMERCE - CLIENTE SUPABASE PARA FRONTEND
// ===================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Verificar que las variables de entorno estén configuradas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables de entorno de Supabase faltantes en client.ts:', {
    NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
  });

  // En desarrollo, mostrar error detallado
  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      'Faltan variables de entorno de Supabase. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
    );
  }
}

/**
 * Crea un cliente de Supabase para uso en el frontend
 * Este cliente maneja automáticamente la autenticación y sesiones
 */
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase no configurado correctamente, retornando cliente mock');
    return null;
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}
