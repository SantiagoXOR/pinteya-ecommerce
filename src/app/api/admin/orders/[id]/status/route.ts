// ===================================
// PINTEYA E-COMMERCE - ADMIN ORDER STATUS API ENTERPRISE
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

const StatusUpdateSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
    'returned',
  ]),
  reason: z.string().min(1, 'Razón del cambio es requerida').max(500, 'Razón muy larga'),
  notify_customer: z.boolean().default(true),
  tracking_number: z.string().optional(),
  carrier: z.string().optional(),
  estimated_delivery: z.string().optional(),
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

const statusDescriptions: Record<string, string> = {
  pending: 'Pendiente de confirmación',
  confirmed: 'Confirmada, preparando pedido',
  processing: 'En proceso de preparación',
  shipped: 'Enviada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
  returned: 'Devuelta',
}

function validateStateTransition(
  currentStatus: string,
  newStatus: string
): { valid: boolean; message?: string } {
  if (currentStatus === newStatus) {
    return { valid: false, message: 'El estado ya es el mismo' }
  }

  const allowedTransitions = stateTransitions[currentStatus]
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      message: `Transición no permitida: ${statusDescriptions[currentStatus]} → ${statusDescriptions[newStatus]}`,
    }
  }

  return { valid: true }
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
// POST - Cambiar estado de orden
// ===================================
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.admin.requests,
      RATE_LIMIT_CONFIGS.admin.window,
      'admin-order-status'
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
    const validationResult = StatusUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos de cambio de estado inválidos', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const {
      status: newStatus,
      reason,
      notify_customer,
      tracking_number,
      carrier,
      estimated_delivery,
    } = validationResult.data

    // Obtener orden actual
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(
        `
        id,
        status,
        payment_status,
        order_number,
        user_profiles!orders_user_id_fkey (
          id,
          name,
          email
        )
      `
      )
      .eq('id', orderId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
      }

      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al obtener orden', {
        fetchError,
        orderId,
      })
      return NextResponse.json({ error: 'Error al obtener orden' }, { status: 500 })
    }

    // Validar transición de estado
    const transitionValidation = validateStateTransition(currentOrder.status, newStatus)
    if (!transitionValidation.valid) {
      return NextResponse.json({ error: transitionValidation.message }, { status: 400 })
    }

    // Preparar datos de actualización
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // Agregar campos adicionales según el estado
    if (tracking_number) {
      updateData.tracking_number = tracking_number
    }
    if (carrier) {
      updateData.carrier = carrier
    }
    if (estimated_delivery) {
      updateData.estimated_delivery = estimated_delivery
    }

    // Actualizar estado de pago automáticamente en ciertos casos
    if (newStatus === 'delivered') {
      updateData.payment_status = 'paid'
    } else if (newStatus === 'cancelled' || newStatus === 'refunded') {
      updateData.payment_status = 'refunded'
    }

    // Actualizar orden
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al actualizar estado de orden', {
        updateError,
        orderId,
      })
      return NextResponse.json({ error: 'Error al actualizar estado de orden' }, { status: 500 })
    }

    // Registrar en historial de estados
    try {
      await supabaseAdmin.from('order_status_history').insert({
        order_id: orderId,
        previous_status: currentOrder.status,
        new_status: newStatus,
        changed_by: authResult.user.id,
        reason: reason,
        metadata: JSON.stringify({
          tracking_number,
          carrier,
          estimated_delivery,
          notify_customer,
        }),
      })
    } catch (historyError) {
      // Si la tabla no existe, continuar sin registrar historial
      logger.log(LogLevel.WARN, LogCategory.DATABASE, 'No se pudo registrar historial de estado', {
        historyError,
      })
    }

    // Agregar nota interna sobre el cambio
    try {
      await supabaseAdmin.from('order_notes').insert({
        order_id: orderId,
        admin_id: authResult.user.id,
        note_type: 'internal',
        content: `Estado cambiado de "${statusDescriptions[currentOrder.status]}" a "${statusDescriptions[newStatus]}". Razón: ${reason}`,
        is_visible_to_customer: false,
      })
    } catch (noteError) {
      // Si la tabla no existe, continuar sin agregar nota
      logger.log(
        LogLevel.WARN,
        LogCategory.DATABASE,
        'No se pudo agregar nota de cambio de estado',
        { noteError }
      )
    }

    // TODO: Enviar notificación al cliente si notify_customer es true
    if (notify_customer) {
      logger.log(
        LogLevel.INFO,
        LogCategory.NOTIFICATION,
        'Notificación de cambio de estado pendiente',
        {
          orderId,
          customerEmail: currentOrder.user_profiles?.email,
          newStatus,
          orderNumber: currentOrder.order_number,
        }
      )
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime
    await metricsCollector.recordRequest('admin-order-status-change', 'POST', 200, responseTime)

    const response: ApiResponse<{
      order: typeof updatedOrder
      previousStatus: string
      newStatus: string
      statusDescription: string
    }> = {
      data: {
        order: updatedOrder,
        previousStatus: currentOrder.status,
        newStatus,
        statusDescription: statusDescriptions[newStatus],
      },
      success: true,
      error: null,
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult)

    logger.log(LogLevel.INFO, LogCategory.API, 'Estado de orden cambiado exitosamente', {
      orderId,
      previousStatus: currentOrder.status,
      newStatus,
      reason,
      adminId: authResult.user.id,
      responseTime,
    })

    return nextResponse
  } catch (error) {
    const responseTime = Date.now() - startTime
    await metricsCollector.recordRequest('admin-order-status-change', 'POST', 500, responseTime)

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/orders/[id]/status', {
      error,
      orderId: params.id,
    })

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ===================================
// GET - Obtener estados disponibles
// ===================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const orderId = params.id

    // Obtener estado actual de la orden
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
      }

      return NextResponse.json({ error: 'Error al obtener orden' }, { status: 500 })
    }

    const currentStatus = order.status
    const availableTransitions = stateTransitions[currentStatus] || []

    const response: ApiResponse<{
      currentStatus: string
      currentStatusDescription: string
      availableTransitions: Array<{
        status: string
        description: string
      }>
    }> = {
      data: {
        currentStatus,
        currentStatusDescription: statusDescriptions[currentStatus],
        availableTransitions: availableTransitions.map(status => ({
          status,
          description: statusDescriptions[status],
        })),
      },
      success: true,
      error: null,
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime
    metricsCollector.recordApiCall('admin-order-status-options', responseTime, 200)

    return NextResponse.json(response)
  } catch (error) {
    const responseTime = Date.now() - startTime
    metricsCollector.recordApiCall('admin-order-status-options', responseTime, 500)

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/orders/[id]/status', {
      error,
      orderId: params.id,
    })

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
