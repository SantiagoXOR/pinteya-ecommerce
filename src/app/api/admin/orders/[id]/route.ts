// ===================================
// PINTEYA E-COMMERCE - ADMIN ORDER DETAIL API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { auth } from '@/auth'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { checkRateLimit } from '@/lib/auth/rate-limiting'
import { addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter'
import { MetricsCollector } from '@/lib/enterprise/metrics'

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const UpdateOrderSchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .optional(),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  notes: z.string().optional(),
  tracking_number: z.string().optional(),
  carrier: z.string().optional(),
  shipping_address: z
    .object({
      street_name: z.string().min(1),
      street_number: z.string().min(1),
      zip_code: z.string().min(1),
      city_name: z.string().min(1),
      state_name: z.string().min(1),
    })
    .optional(),
})

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 }
    }

    // Verificar si es admin
    const isAdmin = session.user.email === 'santiago@xor.com.ar'
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
    return true
  }
  return stateTransitions[currentStatus]?.includes(newStatus) || false
}

// ===================================
// GET - Obtener orden específica
// ===================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.admin.requests,
      RATE_LIMIT_CONFIGS.admin.window,
      'admin-order-detail'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult)
      return response
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const orderId = params.id

    // Obtener orden con todos los detalles
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        user_profiles!orders_user_id_fkey (
          id,
          name,
          email,
          phone
        ),
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          products (
            id,
            name,
            images,
            sku,
            category
          )
        )
      `
      )
      .eq('id', orderId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
      }

      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al obtener orden', { error, orderId })
      return NextResponse.json({ error: 'Error al obtener orden' }, { status: 500 })
    }

    // Obtener historial de estados si existe la tabla
    let statusHistory = []
    try {
      const { data: history } = await supabaseAdmin
        .from('order_status_history')
        .select(
          `
          id,
          previous_status,
          new_status,
          reason,
          created_at,
          user_profiles!order_status_history_changed_by_fkey (
            name,
            email
          )
        `
        )
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      statusHistory = history || []
    } catch (historyError) {
      // Si la tabla no existe, continuar sin historial
      logger.log(LogLevel.WARN, LogCategory.DATABASE, 'Tabla order_status_history no existe', {
        historyError,
      })
    }

    // Obtener notas si existe la tabla
    let orderNotes = []
    try {
      const { data: notes } = await supabaseAdmin
        .from('order_notes')
        .select(
          `
          id,
          note_type,
          content,
          is_visible_to_customer,
          created_at,
          user_profiles!order_notes_admin_id_fkey (
            name,
            email
          )
        `
        )
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      orderNotes = notes || []
    } catch (notesError) {
      // Si la tabla no existe, continuar sin notas
      logger.log(LogLevel.WARN, LogCategory.DATABASE, 'Tabla order_notes no existe', { notesError })
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime
    await MetricsCollector.getInstance().recordRequest(
      'admin-order-detail',
      'GET',
      200,
      responseTime
    )

    const response: ApiResponse<{
      order: typeof order
      statusHistory: typeof statusHistory
      notes: typeof orderNotes
    }> = {
      data: {
        order,
        statusHistory,
        notes: orderNotes,
      },
      success: true,
      error: null,
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult)

    logger.log(LogLevel.INFO, LogCategory.API, 'Orden obtenida exitosamente', {
      orderId,
      responseTime,
    })

    return nextResponse
  } catch (error) {
    const responseTime = Date.now() - startTime
    await MetricsCollector.getInstance().recordRequest(
      'admin-order-detail',
      'GET',
      500,
      responseTime
    )

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/orders/[id]', {
      error,
      orderId: params.id,
    })

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ===================================
// PATCH - Actualizar orden
// ===================================
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.admin.requests,
      RATE_LIMIT_CONFIGS.admin.window,
      'admin-order-update'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult)
      return response
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const orderId = params.id

    // Validar datos de entrada
    const body = await request.json()
    const validationResult = UpdateOrderSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos de actualización inválidos', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Obtener orden actual para validar transiciones
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_status')
      .eq('id', orderId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
      }

      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al obtener orden actual', {
        fetchError,
        orderId,
      })
      return NextResponse.json({ error: 'Error al obtener orden' }, { status: 500 })
    }

    // Validar transición de estado si se está cambiando
    if (updateData.status && !validateStateTransition(currentOrder.status, updateData.status)) {
      return NextResponse.json(
        { error: `Transición de estado inválida: ${currentOrder.status} → ${updateData.status}` },
        { status: 400 }
      )
    }

    // Preparar datos de actualización
    const updatePayload: any = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    // Convertir shipping_address a JSON si se proporciona
    if (updateData.shipping_address) {
      updatePayload.shipping_address = JSON.stringify(updateData.shipping_address)
    }

    // Actualizar orden
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al actualizar orden', {
        updateError,
        orderId,
      })
      return NextResponse.json({ error: 'Error al actualizar orden' }, { status: 500 })
    }

    // Registrar cambio de estado en historial si cambió el status
    if (updateData.status && updateData.status !== currentOrder.status) {
      try {
        await supabaseAdmin.from('order_status_history').insert({
          order_id: orderId,
          previous_status: currentOrder.status,
          new_status: updateData.status,
          changed_by: authResult.user.id,
          reason: `Cambio manual por administrador`,
        })
      } catch (historyError) {
        // Si la tabla no existe, continuar sin registrar historial
        logger.log(
          LogLevel.WARN,
          LogCategory.DATABASE,
          'No se pudo registrar historial de estado',
          { historyError }
        )
      }
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime
    await MetricsCollector.getInstance().recordRequest(
      'admin-order-update',
      'PATCH',
      200,
      responseTime
    )

    const response: ApiResponse<typeof updatedOrder> = {
      data: updatedOrder,
      success: true,
      error: null,
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult)

    logger.log(LogLevel.INFO, LogCategory.API, 'Orden actualizada exitosamente', {
      orderId,
      changes: updateData,
      responseTime,
    })

    return nextResponse
  } catch (error) {
    const responseTime = Date.now() - startTime
    await MetricsCollector.getInstance().recordRequest(
      'admin-order-update',
      'PATCH',
      500,
      responseTime
    )

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en PATCH /api/admin/orders/[id]', {
      error,
      orderId: params.id,
    })

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
