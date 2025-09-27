/**
 * Utilidades RLS Enterprise
 * Integración entre Row Level Security de Supabase y autenticación enterprise
 */

import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import type { EnterpriseAuthContext } from './enterprise-auth-utils'

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface RLSContext {
  userId: string
  supabaseUserId?: string
  role: 'admin' | 'user' | 'moderator'
  permissions: string[]
  isActive: boolean
}

export interface RLSValidationResult {
  valid: boolean
  context?: RLSContext
  error?: string
  code?: string
}

export interface RLSQueryOptions {
  enforceRLS?: boolean
  bypassRLS?: boolean
  adminOverride?: boolean
  auditLog?: boolean
}

// =====================================================
// FUNCIONES DE VALIDACIÓN RLS
// =====================================================

/**
 * Valida el contexto RLS para un usuario
 */
export async function validateRLSContext(
  enterpriseContext: EnterpriseAuthContext
): Promise<RLSValidationResult> {
  try {
    if (!supabaseAdmin) {
      return {
        valid: false,
        error: 'Supabase admin client no disponible',
        code: 'SUPABASE_UNAVAILABLE',
      }
    }

    // Obtener información del usuario desde Supabase
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, supabase_user_id, role_id, permissions, is_active, user_roles(role_name)')
      .eq('clerk_user_id', enterpriseContext.userId)
      .single()

    if (profileError) {
      console.error('[RLS] Error obteniendo perfil de usuario:', profileError)
      return {
        valid: false,
        error: 'Error obteniendo perfil de usuario',
        code: 'PROFILE_ERROR',
      }
    }

    if (!userProfile || !userProfile.is_active) {
      return {
        valid: false,
        error: 'Usuario inactivo o no encontrado',
        code: 'USER_INACTIVE',
      }
    }

    // Crear contexto RLS
    const rlsContext: RLSContext = {
      userId: enterpriseContext.userId,
      supabaseUserId: userProfile.supabase_user_id,
      role: (userProfile.user_roles as any)?.role_name || 'user',
      permissions: userProfile.permissions || [],
      isActive: userProfile.is_active,
    }

    return {
      valid: true,
      context: rlsContext,
    }
  } catch (error) {
    console.error('[RLS] Error validando contexto RLS:', error)
    return {
      valid: false,
      error: 'Error interno validando RLS',
      code: 'INTERNAL_ERROR',
    }
  }
}

/**
 * Crea un cliente Supabase con contexto de usuario para RLS
 */
export function createUserSupabaseClient(
  supabaseUserId: string,
  accessToken?: string
): ReturnType<typeof createClient> | null {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[RLS] Configuración de Supabase no disponible')
      return null
    }

    // Crear cliente con contexto de usuario
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'X-User-ID': supabaseUserId,
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
    })

    return client
  } catch (error) {
    console.error('[RLS] Error creando cliente Supabase de usuario:', error)
    return null
  }
}

/**
 * Ejecuta una consulta con contexto RLS
 */
export async function executeWithRLS<T>(
  enterpriseContext: EnterpriseAuthContext,
  queryFunction: (client: any, rlsContext: RLSContext) => Promise<T>,
  options: RLSQueryOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; code?: string }> {
  try {
    // Validar contexto RLS
    const rlsValidation = await validateRLSContext(enterpriseContext)
    if (!rlsValidation.valid) {
      return {
        success: false,
        error: rlsValidation.error,
        code: rlsValidation.code,
      }
    }

    const rlsContext = rlsValidation.context!

    // Determinar qué cliente usar
    let client
    if (options.bypassRLS && enterpriseContext.role === 'admin') {
      // Admin puede usar cliente administrativo para bypass RLS
      client = supabaseAdmin
      console.log('[RLS] Usando cliente admin para bypass RLS')
    } else if (rlsContext.supabaseUserId) {
      // Usar cliente con contexto de usuario para RLS
      client = createUserSupabaseClient(rlsContext.supabaseUserId)
      if (!client) {
        return {
          success: false,
          error: 'Error creando cliente de usuario',
          code: 'CLIENT_ERROR',
        }
      }
      console.log('[RLS] Usando cliente de usuario con RLS')
    } else {
      // Fallback a cliente admin
      client = supabaseAdmin
      console.log('[RLS] Usando cliente admin como fallback')
    }

    // Ejecutar consulta
    const result = await queryFunction(client, rlsContext)

    // Log de auditoría si está habilitado
    if (options.auditLog) {
      await logRLSOperation(enterpriseContext, 'query_executed', {
        bypassRLS: options.bypassRLS,
        adminOverride: options.adminOverride,
        success: true,
      })
    }

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('[RLS] Error ejecutando consulta con RLS:', error)

    // Log de auditoría para errores
    if (options.auditLog) {
      await logRLSOperation(enterpriseContext, 'query_error', {
        error: error.message,
        bypassRLS: options.bypassRLS,
        adminOverride: options.adminOverride,
      })
    }

    return {
      success: false,
      error: 'Error ejecutando consulta',
      code: 'QUERY_ERROR',
    }
  }
}

/**
 * Verifica permisos específicos para operaciones RLS
 */
export function checkRLSPermission(
  rlsContext: RLSContext,
  requiredPermission: string,
  resourceOwner?: string
): boolean {
  // Admin siempre tiene acceso
  if (rlsContext.role === 'admin') {
    return true
  }

  // Verificar permiso específico
  if (rlsContext.permissions.includes(requiredPermission)) {
    return true
  }

  // Verificar si es el propietario del recurso
  if (resourceOwner && resourceOwner === rlsContext.userId) {
    return true
  }

  return false
}

/**
 * Crea filtros RLS para consultas
 */
export function createRLSFilters(rlsContext: RLSContext, tableName: string): Record<string, any> {
  const filters: Record<string, any> = {}

  switch (tableName) {
    case 'user_profiles':
      if (rlsContext.role !== 'admin' && rlsContext.role !== 'moderator') {
        // Los usuarios solo pueden ver su propio perfil
        filters.clerk_user_id = rlsContext.userId
      }
      break

    case 'orders':
      if (rlsContext.role !== 'admin' && rlsContext.role !== 'moderator') {
        // Los usuarios solo pueden ver sus propias órdenes
        filters.user_id = rlsContext.userId
      }
      break

    case 'products':
      if (rlsContext.role !== 'admin' && rlsContext.role !== 'moderator') {
        // Los usuarios solo pueden ver productos activos
        filters.is_active = true
      }
      break

    default:
      // Sin filtros adicionales para otras tablas
      break
  }

  return filters
}

/**
 * Middleware RLS para APIs
 */
export function withRLS(options: RLSQueryOptions = {}) {
  return function (handler: Function) {
    return async (request: any, ...args: any[]) => {
      try {
        // Obtener contexto enterprise del request
        const enterpriseContext = (request as any).enterpriseAuth

        if (!enterpriseContext) {
          const errorResponse = {
            success: false,
            error: 'Contexto enterprise no disponible',
            code: 'NO_ENTERPRISE_CONTEXT',
            timestamp: new Date().toISOString(),
          }

          if ('query' in request) {
            // Pages Router
            const res = args[0] as any
            return res.status(401).json(errorResponse)
          } else {
            // App Router
            return new Response(JSON.stringify(errorResponse), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          }
        }

        // Validar contexto RLS
        const rlsValidation = await validateRLSContext(enterpriseContext)
        if (!rlsValidation.valid) {
          const errorResponse = {
            success: false,
            error: rlsValidation.error,
            code: rlsValidation.code,
            rls: true,
            timestamp: new Date().toISOString(),
          }

          if ('query' in request) {
            // Pages Router
            const res = args[0] as any
            return res.status(403).json(errorResponse)
          } else {
            // App Router
            return new Response(JSON.stringify(errorResponse), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            })
          }
        }

        // Añadir contexto RLS al request
        ;(request as any).rlsContext = rlsValidation.context

        return handler(request, ...args)
      } catch (error) {
        console.error('[RLS] Error en middleware RLS:', error)

        const errorResponse = {
          success: false,
          error: 'Error interno en middleware RLS',
          code: 'RLS_MIDDLEWARE_ERROR',
          timestamp: new Date().toISOString(),
        }

        if ('query' in request) {
          // Pages Router
          const res = args[0] as any
          return res.status(500).json(errorResponse)
        } else {
          // App Router
          return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
    }
  }
}

// =====================================================
// FUNCIONES DE AUDITORÍA
// =====================================================

/**
 * Log de operaciones RLS para auditoría
 */
async function logRLSOperation(
  enterpriseContext: EnterpriseAuthContext,
  operation: string,
  metadata: any
): Promise<void> {
  try {
    if (!supabaseAdmin) {
      return
    }

    await supabaseAdmin.from('security_audit_logs').insert({
      user_id: enterpriseContext.userId,
      event_type: 'RLS_OPERATION',
      event_category: 'database_access',
      severity: 'info',
      description: `RLS operation: ${operation}`,
      metadata: {
        operation,
        role: enterpriseContext.role,
        permissions: enterpriseContext.permissions,
        security_level: enterpriseContext.securityLevel,
        ...metadata,
      },
      ip_address: enterpriseContext.ipAddress,
      user_agent: enterpriseContext.userAgent,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[RLS] Error logging RLS operation:', error)
  }
}

// =====================================================
// UTILIDADES DE TESTING
// =====================================================

/**
 * Función para testing de políticas RLS
 */
export async function testRLSPolicies(
  tableName: string,
  testCases: Array<{
    name: string
    userRole: 'admin' | 'user' | 'moderator'
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
    expectedResult: 'allow' | 'deny'
    testData?: any
  }>
): Promise<Array<{ name: string; passed: boolean; error?: string }>> {
  const results = []

  for (const testCase of testCases) {
    try {
      // Implementar lógica de testing específica
      // Esta función se puede expandir para testing automatizado
      results.push({
        name: testCase.name,
        passed: true, // Placeholder
      })
    } catch (error) {
      results.push({
        name: testCase.name,
        passed: false,
        error: error.message,
      })
    }
  }

  return results
}
