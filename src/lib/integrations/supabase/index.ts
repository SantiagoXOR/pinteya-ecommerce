// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN SUPABASE OPTIMIZADA
// ===================================

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { supabaseConfig, isSupabaseConfigured } from '../../../../lib/env-config'
import { API_TIMEOUTS } from '@/lib/config/api-timeouts'

// Verificar configuración de Supabase (no interrumpir desarrollo si faltan variables)
if (!isSupabaseConfigured()) {
  console.error('Variables de entorno de Supabase faltantes:', {
    NEXT_PUBLIC_SUPABASE_URL: !!supabaseConfig.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseConfig.anonKey,
    SUPABASE_SERVICE_ROLE_KEY: !!supabaseConfig.serviceRoleKey,
  })

  if (process.env.NODE_ENV === 'production') {
    // En producción, emitir advertencia pero continuar (evitar romper build)
    console.warn('Usando configuración por defecto de Supabase para el build de producción')
  } else {
    // En desarrollo, no lanzar excepción: se permitirá fallback a mocks
    console.warn(
      'Supabase no configurado en desarrollo. Se utilizarán datos mock/fallback donde aplique.'
    )
  }
}

// ===================================
// CONFIGURACIÓN OPTIMIZADA DE PERFORMANCE
// ===================================

const OPTIMIZED_CLIENT_CONFIG = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'pintureria-digital@1.0.0',
      'x-connection-pool': 'optimized',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}

const OPTIMIZED_ADMIN_CONFIG = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'pintureria-digital-admin@1.0.0',
      'x-connection-pool': 'admin-optimized',
    },
  },
  realtime: {
    disabled: true,
  },
}

// ===================================
// CLIENTE PÚBLICO (PARA FRONTEND)
// ===================================
export const supabase = isSupabaseConfigured()
  ? createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, OPTIMIZED_CLIENT_CONFIG)
  : null

// ===================================
// CLIENTE ADMINISTRATIVO (PARA API ROUTES)
// ===================================
export const supabaseAdmin =
  supabaseConfig.url && supabaseConfig.serviceRoleKey
    ? createClient<Database>(
        supabaseConfig.url,
        supabaseConfig.serviceRoleKey,
        OPTIMIZED_ADMIN_CONFIG
      )
    : null

// ===================================
// FUNCIONES AUXILIARES
// ===================================

/**
 * Obtiene el cliente de Supabase apropiado según el contexto
 * @param useAdmin - Si usar el cliente administrativo
 * @returns Cliente de Supabase
 */
export function getSupabaseClient(useAdmin = false) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase/index.ts:104',message:'getSupabaseClient called',data:{useAdmin,hasSupabase:!!supabase,hasSupabaseAdmin:!!supabaseAdmin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  if (useAdmin) {
    if (!supabaseAdmin) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'Cliente administrativo de Supabase no disponible. Verifica SUPABASE_SERVICE_ROLE_KEY en producción.'
        )
      }
      console.warn(
        '[DEV] Cliente administrativo de Supabase no disponible. Devolviendo null para permitir mocks.'
      )
      return null
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase/index.ts:117',message:'Returning admin client',data:{clientType:'admin'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return supabaseAdmin
  }
  if (!supabase) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Cliente público de Supabase no disponible en producción. Verifica variables de entorno.'
      )
    }
    console.warn('[DEV] Cliente público de Supabase no disponible. Devolviendo null para mocks.')
    return null
  }
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase/index.ts:128',message:'Returning public client',data:{clientType:'anon'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return supabase
}

/**
 * Maneja errores de Supabase de manera consistente
 * @param error - Error de Supabase
 * @param context - Contexto donde ocurrió el error
 */
export function handleSupabaseError(error: any, context: string) {
  console.error(`Error en ${context}:`, error)

  if (error?.code === 'PGRST116') {
    throw new Error('Recurso no encontrado')
  }

  if (error?.code === '23505') {
    throw new Error('Ya existe un registro con estos datos')
  }

  if (error?.code === '23503') {
    throw new Error('Referencia inválida a otro registro')
  }

  throw new Error(error?.message || 'Error interno del servidor')
}

/**
 * Verifica si el usuario está autenticado
 * @returns Promise<boolean>
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    if (!supabase) {
      return false
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

/**
 * Obtiene el usuario actual
 * @returns Promise<User | null>
 */
export async function getCurrentUser() {
  try {
    if (!supabase) {
      return null
    }
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) {
      throw error
    }
    return user
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error)
    return null
  }
}

// ===================================
// TIPOS PARA RESPUESTAS
// ===================================
export type SupabaseResponse<T> = {
  data: T | null
  error: any
}

export type SupabaseArrayResponse<T> = {
  data: T[] | null
  error: any
  count?: number | null
}
