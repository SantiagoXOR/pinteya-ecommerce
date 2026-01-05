// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - ADMIN BULK ORDERS API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { auth } from '@/lib/auth/config'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { checkRateLimit } from '@/lib/auth/rate-limiting'
import { addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter'
import { metricsCollector } from '@/lib/enterprise/metrics'

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const BulkStatusUpdateSchema = z.object({
  order_ids: z
    .array(z.string().uuid())
    .min(1, 'Al menos una orden es requerida')
    .max(100, 'Máximo 100 órdenes por operación'),
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  reason: z.string().min(1, 'Razón del cambio es requerida').max(500, 'Razón muy larga'),
  notify_customers: z.boolean().default(false),
})

const BulkExportSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  filters: z
    .object({
      status: z.string().optional(),
      payment_status: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
    })
    .optional(),
  include_items: z.boolean().default(true),
})

// ===================================
// VALIDACIONES DE TRANSICIÓN DE ESTADOS
// ===================================

const stateTransitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  refunded: [],
  returned: ['refunded'],
}

function validateStateTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) {
    return false
  }
  return stateTransitions[currentStatus]?.includes(newStatus) || false
}

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 }
    }

    const user = session?.user
    if (!session?.user) {
      return { error: 'Usuario no encontrado', status: 401 }
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
// POST - Operaciones masivas
// ===================================
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting más estricto para operaciones masivas
    const rateLimitResult = await checkRateLimit(
      request,
      10, // Máximo 10 operaciones masivas por hora
      3600000, // 1 hora
      'admin-bulk-operations'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: 'Demasiadas operaciones masivas. Límite: 10 por hora' },
        { status: 429 }
      )
      addRateLimitHeaders(response, rateLimitResult)
      return response
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Obtener tipo de operación
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get('operation')

    if (operation === 'status_update') {
      return await handleBulkStatusUpdate(request, authResult)
    } else if (operation === 'export') {
      return await handleBulkExport(request, authResult)
    } else {
      return NextResponse.json(
        { error: 'Operación no válida. Operaciones disponibles: status_update, export' },
        { status: 400 }
      )
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    metricsCollector.recordApiCall('admin-bulk-operations', responseTime, 500)

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/orders/bulk', { error })

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ===================================
// ACTUALIZACIÓN MASIVA DE ESTADOS
// ===================================
async function handleBulkStatusUpdate(request: NextRequest, authResult: any) {
  const startTime = Date.now()

  try {
    // Validar datos de entrada
    const body = await request.json()
    const validationResult = BulkStatusUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos de operación masiva inválidos', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { order_ids, status: newStatus, reason, notify_customers } = validationResult.data

    // Obtener órdenes actuales para validar transiciones
    const { data: currentOrders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status, order_number')
      .in('id', order_ids)

    if (fetchError) {
      logger.log(
        LogLevel.ERROR,
        LogCategory.DATABASE,
        'Error al obtener órdenes para bulk update',
        { fetchError }
      )
      return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 })
    }

    if (!currentOrders || currentOrders.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron órdenes con los IDs proporcionados' },
        { status: 404 }
      )
    }

    // Validar transiciones para cada orden
    const validOrders = []
    const invalidOrders = []

    for (const order of currentOrders) {
      if (validateStateTransition(order.status, newStatus)) {
        validOrders.push(order)
      } else {
        invalidOrders.push({
          id: order.id,
          order_number: order.order_number,
          current_status: order.status,
          reason: `Transición no permitida: ${order.status} → ${newStatus}`,
        })
      }
    }

    if (validOrders.length === 0) {
      return NextResponse.json(
        {
          error: 'Ninguna orden puede cambiar al estado solicitado',
          invalid_orders: invalidOrders,
        },
        { status: 400 }
      )
    }

    // Actualizar órdenes válidas
    const validOrderIds = validOrders.map(order => order.id)
    const { data: updatedOrders, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .in('id', validOrderIds)
      .select()

    if (updateError) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error en actualización masiva', {
        updateError,
      })
      return NextResponse.json({ error: 'Error al actualizar órdenes' }, { status: 500 })
    }

    // Registrar cambios en historial
    const historyEntries = validOrders.map(order => ({
      order_id: order.id,
      previous_status: order.status,
      new_status: newStatus,
      changed_by: authResult.user.id,
      reason: `Cambio masivo: ${reason}`,
      metadata: JSON.stringify({
        bulk_operation: true,
        total_orders: validOrders.length,
      }),
    }))

    try {
      await supabaseAdmin.from('order_status_history').insert(historyEntries)
    } catch (historyError) {
      logger.log(LogLevel.WARN, LogCategory.DATABASE, 'No se pudo registrar historial masivo', {
        historyError,
      })
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime
    metricsCollector.recordApiCall('admin-bulk-status-update', responseTime, 200)

    const response: ApiResponse<{
      updated_orders: typeof updatedOrders
      invalid_orders: typeof invalidOrders
      summary: {
        total_requested: number
        successfully_updated: number
        failed_updates: number
      }
    }> = {
      data: {
        updated_orders: updatedOrders,
        invalid_orders: invalidOrders,
        summary: {
          total_requested: order_ids.length,
          successfully_updated: validOrders.length,
          failed_updates: invalidOrders.length,
        },
      },
      success: true,
      error: null,
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Actualización masiva de estados completada', {
      totalRequested: order_ids.length,
      successfullyUpdated: validOrders.length,
      failedUpdates: invalidOrders.length,
      newStatus,
      adminId: authResult.user.id,
      responseTime,
    })

    return NextResponse.json(response)
  } catch (error) {
    const responseTime = Date.now() - startTime
    metricsCollector.recordApiCall('admin-bulk-status-update', responseTime, 500)

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en bulk status update', { error })
    throw error
  }
}

// ===================================
// EXPORTACIÓN MASIVA DE DATOS
// ===================================
async function handleBulkExport(request: NextRequest, authResult: any) {
  const startTime = Date.now()

  try {
    // Validar datos de entrada
    const body = await request.json()
    const validationResult = BulkExportSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Parámetros de exportación inválidos', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { format, filters, include_items } = validationResult.data

    // Construir query base
    let query = supabaseAdmin.from('orders').select(`
        id,
        order_number,
        status,
        payment_status,
        total,
        currency,
        created_at,
        updated_at,
        shipping_address,
        notes,
        user_profiles!orders_user_id_fkey (
          name,
          email,
          phone
        )
        ${
          include_items
            ? `,
        order_items (
          quantity,
          unit_price,
          total_price,
          products (
            name,
            sku
          )
        )`
            : ''
        }
      `)

    // Aplicar filtros
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.payment_status) {
      query = query.eq('payment_status', filters.payment_status)
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    // Limitar a 1000 órdenes máximo para evitar timeouts
    const { data: orders, error } = await query
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al exportar órdenes', { error })
      return NextResponse.json(
        { error: 'Error al obtener datos para exportación' },
        { status: 500 }
      )
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime
    await metricsCollector.recordRequest('admin-bulk-export', 'GET', 200, responseTime)

    const response: ApiResponse<{
      orders: typeof orders
      export_info: {
        format: string
        total_records: number
        generated_at: string
        filters_applied: typeof filters
      }
    }> = {
      data: {
        orders,
        export_info: {
          format,
          total_records: orders?.length || 0,
          generated_at: new Date().toISOString(),
          filters_applied: filters,
        },
      },
      success: true,
      error: null,
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Exportación masiva completada', {
      format,
      totalRecords: orders?.length || 0,
      includeItems: include_items,
      adminId: authResult.user.id,
      responseTime,
    })

    return NextResponse.json(response)
  } catch (error) {
    const responseTime = Date.now() - startTime
    metricsCollector.recordApiCall('admin-bulk-export', responseTime, 500)

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en bulk export', { error })
    throw error
  }
}
