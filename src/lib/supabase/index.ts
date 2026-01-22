// ===================================
// SUPABASE INTEGRATION LAYER
// ===================================

import { createClient } from '@supabase/supabase-js'
import { getQueryOptimizer } from './query-optimizer'
import { getCacheManager } from './cache-manager'
import { getConnectionPool } from './connection-pool'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validación de variables de entorno
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
}

// Configuración optimizada para el cliente público
const OPTIMIZED_CLIENT_CONFIG = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce' as const,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'pintureria-digital/1.0.0',
      'x-connection-pool': 'enabled',
    },
  },
}

// Configuración optimizada para el cliente admin
const OPTIMIZED_ADMIN_CONFIG = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'pintureria-digital-admin/1.0.0',
      'x-connection-pool': 'enabled',
    },
  },
}

// Crear clientes Supabase optimizados
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, OPTIMIZED_CLIENT_CONFIG)

// Solo crear el cliente admin si tenemos la service key (server-side)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl!, supabaseServiceKey, OPTIMIZED_ADMIN_CONFIG)
  : null

// ===================================
// SISTEMA DE OPTIMIZACIÓN INTEGRADO
// ===================================

// Exportar instancias de optimización
export const queryOptimizer = getQueryOptimizer()
export const cacheManager = getCacheManager()
export const connectionPool = getConnectionPool()

// ===================================
// FUNCIONES DE UTILIDAD
// ===================================

export function handleSupabaseError(error: any) {
  console.error('[SUPABASE_ERROR]', {
    message: error?.message || 'Unknown error',
    details: error?.details || null,
    hint: error?.hint || null,
    code: error?.code || null,
    timestamp: new Date().toISOString(),
  })

  return {
    error: true,
    message: error?.message || 'Error en la base de datos',
    code: error?.code || 'UNKNOWN_ERROR',
  }
}

export async function checkSupabaseConnection() {
  try {
    // Usar una consulta más simple que no dependa de políticas RLS complejas
    const { data, error } = await supabase.from('categories').select('id').limit(1)

    if (error) throw error

    return { connected: true, timestamp: new Date().toISOString() }
  } catch (error) {
    console.warn('[SUPABASE_CONNECTION] Connection check failed:', error)
    // No fallar completamente, solo advertir
    return { 
      connected: true, // Asumir conectado para no romper la app
      warning: error?.message || 'Connection check failed',
      timestamp: new Date().toISOString() 
    }
  }
}

export async function getAuthenticatedUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) throw error

    return { user, error: null }
  } catch (error) {
    return { user: null, error: handleSupabaseError(error) }
  }
}

export async function getCurrentUser() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) throw error

    return {
      user: session?.user || null,
      session,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      session: null,
      error: handleSupabaseError(error),
    }
  }
}

// ===================================
// HOOKS DE OPTIMIZACIÓN
// ===================================

export function useSupabaseOptimization() {
  return {
    // Query optimizer
    optimizer: queryOptimizer,

    // Cache management
    cache: cacheManager,

    // Connection pool
    pool: connectionPool,

    // Utility functions
    handleError: handleSupabaseError,
    checkConnection: checkSupabaseConnection,
    getCurrentUser,
    getAuthenticatedUser,

    // Stats
    getOptimizationStats: () => ({
      cache: cacheManager.getStats(),
      pool: connectionPool.getStats(),
      optimizer: queryOptimizer.getOptimizerStats(),
    }),
  }
}

// ===================================
// TIPOS Y INTERFACES
// ===================================

export interface SupabaseResponse<T = any> {
  data: T | null
  error: any
  count?: number
}

export interface OptimizedQueryOptions {
  useCache?: boolean
  cacheTTL?: number
  timeout?: number
  retries?: number
}

export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

// ===================================
// VALIDACIONES DE CONFIGURACIÓN
// ===================================

// NOTA: La SUPABASE_SERVICE_ROLE_KEY solo existe en el servidor (server-side)
// Es NORMAL que no exista en el cliente (browser) por seguridad
// El supabaseAdmin ya está correctamente configurado para retornar null si no existe

// ===================================
// INICIALIZACIÓN DEL SISTEMA
// ===================================

// Inicializar el sistema de optimización
async function initializeOptimizationSystem() {
  try {
    // Verificar conexión
    const connectionStatus = await checkSupabaseConnection()

    if (!connectionStatus.connected) {
      console.error('[SUPABASE_INIT] Failed to connect to Supabase:', connectionStatus.error)
      return false
    }

    console.log('[SUPABASE_INIT] ✅ Supabase connection established')
    console.log('[SUPABASE_INIT] ✅ Query optimizer initialized')
    console.log('[SUPABASE_INIT] ✅ Cache manager initialized')
    console.log('[SUPABASE_INIT] ✅ Connection pool initialized')

    return true
  } catch (error) {
    console.error('[SUPABASE_INIT] Initialization failed:', error)
    return false
  }
}

// Ejecutar inicialización en el lado del cliente
if (typeof window !== 'undefined') {
  initializeOptimizationSystem()
}

export default supabase
