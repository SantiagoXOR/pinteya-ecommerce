// ===================================
// PINTEYA E-COMMERCE - ADMIN USER BY ID API ENTERPRISE
// ⚡ MULTITENANT: Filtra por tenant_id
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { checkRateLimit } from '@/lib/auth/rate-limiting'
import { addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter'
import { metricsCollector } from '@/lib/enterprise/metrics'
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres').optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  is_active: z.boolean().optional(),
  phone: z.string().optional().nullable(),
  address: z
    .object({
      street_name: z.string().optional(),
      street_number: z.string().optional(),
      zip_code: z.string().optional(),
      city_name: z.string().optional(),
      state_name: z.string().optional(),
    })
    .optional()
    .nullable(),
})

const UserParamsSchema = z.object({
  id: z.string().uuid('ID de usuario inválido'),
})

// ===================================
// TIPOS DE DATOS
// ===================================

interface UserWithStats {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  phone?: string
  address?: any
  created_at: string
  updated_at: string
  last_login?: string
  orders_count: number
  total_spent: number
  avatar_url?: string
  recent_orders?: Array<{
    id: string
    total: number
    status: string
    created_at: string
  }>
}

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    // BYPASS TEMPORAL PARA DESARROLLO
    // ⚠️ TEMPORAL: Remover restricción de desarrollo para permitir bypass en producción hoy (2026-01-08)
    if (process.env.BYPASS_AUTH === 'true') {
      // En producción, permitir bypass directamente si BYPASS_AUTH está configurado
      try {
        const fs = require('fs')
        const path = require('path')
        const envLocalPath = path.join(process.cwd(), '.env.local')
        if (fs.existsSync(envLocalPath) || process.env.NODE_ENV === 'production') {
          return {
            user: {
              id: 'dev-admin',
              email: 'admin@bypass.dev',
              name: 'Dev Admin',
            },
            userId: 'dev-admin',
          }
        }
      } catch (error) {
        console.warn('[API Admin Users ID] No se pudo verificar .env.local, bypass deshabilitado')
      }
    }

    const session = await auth()
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 }
    }

    // Verificar si es admin usando el rol de la sesión (cargado desde la BD en auth.ts)
    const isAdmin = session.user.role === 'admin'
    if (!isAdmin) {
      return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 }
    }

    return { user: session.user, userId: session.user.id }
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error en validación admin', { error })
    return { error: 'Error de autenticación', status: 500 }
  }
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

async function getUserWithStats(userId: string, tenantId: string): Promise<UserWithStats | null> {
  try {
    // ⚡ MULTITENANT: Obtener datos del usuario filtrando por tenant_id
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        role_id,
        is_active,
        metadata,
        created_at,
        updated_at,
        user_roles (
          role_name,
          permissions
        )
      `
      )
      .eq('id', userId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
      .single()

    if (userError || !user) {
      return null
    }

    // ⚡ MULTITENANT: Obtener estadísticas de órdenes filtrando por tenant_id
    const { data: orderStats } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
      .eq('status', 'completed')

    const orders_count = orderStats?.length || 0
    const total_spent = orderStats?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

    // ⚡ MULTITENANT: Obtener órdenes recientes filtrando por tenant_id
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('id, total, status, created_at')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
      .order('created_at', { ascending: false })
      .limit(5)

    return {
      ...user,
      orders_count,
      total_spent,
      recent_orders: recentOrders || [],
    }
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error obteniendo usuario con estadísticas', {
      error,
      userId,
    })
    throw error
  }
}

// ===================================
// GET - Obtener usuario específico por ID
// ⚡ MULTITENANT: Filtra por tenant_id
// ===================================
export const GET = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now()
  const { tenantId } = guardResult

  try {
    const { id } = await context.params
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
        message: RATE_LIMIT_CONFIGS.admin.message || 'Demasiadas solicitudes administrativas',
      },
      'admin-user-detail'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult)
      return response
    }

    // Validar parámetros
    const paramsValidation = UserParamsSchema.safeParse({ id })
    if (!paramsValidation.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de usuario inválido',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const userId = paramsValidation.data.id
    // ⚡ MULTITENANT: Pasar tenantId a getUserWithStats
    const user = await getUserWithStats(userId, tenantId)

    if (!user) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no encontrado',
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users/[id]',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: guardResult.userId,
    })

    // Log de auditoría
    logger.log(LogLevel.INFO, LogCategory.ADMIN, 'Usuario consultado', {
      adminUserId: guardResult.userId,
      targetUserId: userId,
      tenantId,
    })

    const response: ApiResponse<UserWithStats> = {
      data: user,
      success: true,
      message: 'Usuario obtenido exitosamente',
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult)
    return nextResponse
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/users/[id]', {
      error,
      userId: id,
      tenantId,
    })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users/[id]',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
})

// ===================================
// PUT - Actualizar usuario
// ⚡ MULTITENANT: Filtra por tenant_id
// ===================================
export const PUT = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now()
  const { tenantId } = guardResult

  try {
    const { id } = await context.params
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
        message: RATE_LIMIT_CONFIGS.admin.message || 'Demasiadas solicitudes administrativas',
      },
      'admin-user-update'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult)
      return response
    }

    // Validar parámetros
    const paramsValidation = UserParamsSchema.safeParse({ id })
    if (!paramsValidation.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de usuario inválido',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Validar datos de entrada
    const body = await request.json()
    const validationResult = UpdateUserSchema.safeParse(body)

    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Datos de actualización inválidos',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const userId = paramsValidation.data.id
    const updateData = validationResult.data

    // ⚡ MULTITENANT: Verificar que el usuario existe y pertenece al tenant
    const existingUser = await getUserWithStats(userId, tenantId)
    if (!existingUser) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no encontrado',
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Prevenir que un admin se desactive a sí mismo
    if (userId === guardResult.userId && updateData.is_active === false) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'No puedes desactivar tu propia cuenta',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // ⚡ MULTITENANT: Actualizar usuario en la base de datos filtrando por tenant_id
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
      .select()
      .single()

    if (updateError) {
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error actualizando usuario', {
        updateError,
        userId,
      })
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error actualizando usuario',
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // Si se cambió el rol, actualizar también en Auth metadata
    if (updateData.role) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingUser,
          role: updateData.role,
        },
      })
    }

    // ⚡ MULTITENANT: Obtener usuario actualizado con estadísticas
    const userWithStats = await getUserWithStats(userId, tenantId)

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users/[id]',
      method: 'PUT',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: guardResult.userId,
    })

    // Log de auditoría
    logger.log(LogLevel.INFO, LogCategory.ADMIN, 'Usuario actualizado', {
      adminUserId: guardResult.userId,
      targetUserId: userId,
      tenantId,
      changes: updateData,
    })

    const response: ApiResponse<UserWithStats> = {
      data: userWithStats!,
      success: true,
      message: 'Usuario actualizado exitosamente',
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult)
    return nextResponse
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en PUT /api/admin/users/[id]', {
      error,
      userId: id,
      tenantId,
    })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users/[id]',
      method: 'PUT',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
})

// ===================================
// DELETE - Eliminar usuario
// ⚡ MULTITENANT: Filtra por tenant_id
// ===================================
export const DELETE = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now()
  const { tenantId } = guardResult

  try {
    const { id } = await context.params
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
        message: RATE_LIMIT_CONFIGS.admin.message || 'Demasiadas solicitudes administrativas',
      },
      'admin-user-delete'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult)
      return response
    }

    // Validar parámetros
    const paramsValidation = UserParamsSchema.safeParse({ id })
    if (!paramsValidation.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de usuario inválido',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const userId = paramsValidation.data.id

    // ⚡ MULTITENANT: Verificar que el usuario existe y pertenece al tenant
    const existingUser = await getUserWithStats(userId, tenantId)
    if (!existingUser) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no encontrado',
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Prevenir que un admin se elimine a sí mismo
    if (userId === guardResult.userId) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'No puedes eliminar tu propia cuenta',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Verificar si el usuario tiene órdenes (ya filtrado por tenant en getUserWithStats)
    if (existingUser.orders_count > 0) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error:
          'No se puede eliminar un usuario con órdenes asociadas. Considera desactivarlo en su lugar.',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Eliminar usuario de Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authDeleteError) {
      logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error eliminando usuario de Auth', {
        authDeleteError,
        userId,
      })
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error eliminando usuario de autenticación',
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // ⚡ MULTITENANT: Eliminar perfil de usuario filtrando por tenant_id
    const { error: profileDeleteError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT

    if (profileDeleteError) {
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error eliminando perfil de usuario', {
        profileDeleteError,
        userId,
        tenantId,
      })
      // Nota: El usuario ya fue eliminado de Auth, pero el perfil falló
      // En un escenario real, podrías querer implementar una limpieza manual
    }

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users/[id]',
      method: 'DELETE',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: guardResult.userId,
    })

    // Log de auditoría
    logger.log(LogLevel.INFO, LogCategory.ADMIN, 'Usuario eliminado', {
      adminUserId: guardResult.userId,
      deletedUserId: userId,
      tenantId,
      deletedUserEmail: existingUser.email,
    })

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: 'Usuario eliminado exitosamente',
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult)
    return nextResponse
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en DELETE /api/admin/users/[id]', {
      error,
      userId: id,
      tenantId,
    })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users/[id]',
      method: 'DELETE',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
})
