import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createAdminClient } from '@/lib/integrations/supabase/server'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    // BYPASS SOLO EN DESARROLLO CON VALIDACIÓN ESTRICTA
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      try {
        const fs = require('fs')
        const path = require('path')
        const envLocalPath = path.join(process.cwd(), '.env.local')
        if (fs.existsSync(envLocalPath)) {
          return {
            user: {
              id: 'dev-admin',
              email: 'santiago@xor.com.ar',
              name: 'Dev Admin',
            },
            userId: 'dev-admin',
          }
        }
      } catch (error) {
        console.warn('[API Admin Mark Paid] No se pudo verificar .env.local, bypass deshabilitado')
      }
    }

    const session = await auth()
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 }
    }

    // Verificar si es admin (usando email como en otros endpoints admin)
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

/**
 * POST /api/admin/orders/[id]/mark-paid
 * Marca una orden como pagada manualmente
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  let orderId: string | undefined
  try {
    const { id } = await context.params
    orderId = id
    const body = await request.json()
    const { payment_method = 'manual', notes = '' } = body

    // Verificar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status || 401 })
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Marking order as paid manually', {
      orderId,
      userId: authResult.userId,
      payment_method,
    })

    // Obtener datos actuales de la orden
    const supabase = createAdminClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, payment_status, total')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      logger.log(LogLevel.WARN, LogCategory.API, 'Order not found', { orderId, orderError })
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 })
    }

    // Verificar que la orden esté pendiente de pago
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'La orden ya está marcada como pagada' },
        { status: 400 }
      )
    }

    // Actualizar estado de pago y orden
    // payment_status='paid' (estado de PAGO)
    // status='confirmed' (estado de ORDEN - orden confirmada después del pago)
    const updateData = {
      payment_status: 'paid',
      status: order.status === 'pending' ? 'confirmed' : order.status,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) {
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error updating order payment status', {
        orderId,
        updateError,
      })
      return NextResponse.json(
        { success: false, error: 'Error al actualizar estado de pago' },
        { status: 500 }
      )
    }

    // Registrar en historial de estados si cambió el status
    if (order.status === 'pending' && updateData.status === 'confirmed') {
      try {
        await supabase.from('order_status_history').insert({
          order_id: orderId,
          previous_status: 'pending',
          new_status: 'confirmed',
          changed_by: authResult.userId,
          reason: `Pago confirmado manualmente por administrador (${payment_method})`,
          metadata: JSON.stringify({
            payment_method,
            notes,
            manual_confirmation: true,
          }),
        })
      } catch (historyError) {
        // Si la tabla no existe, continuar sin registrar historial
        logger.log(LogLevel.WARN, LogCategory.API, 'Could not register status history', {
          historyError,
        })
      }
    }

    // TODO: Aquí se podrían agregar acciones adicionales como:
    // - Enviar email de confirmación al cliente
    // - Actualizar inventario
    // - Crear notificaciones

    logger.log(LogLevel.INFO, LogCategory.API, 'Order marked as paid successfully', {
      orderId,
      previousStatus: order.status,
      newStatus: updateData.status,
      payment_method,
    })

    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        payment_status: 'paid',
        status: updateData.status,
      },
      message: 'Orden marcada como pagada exitosamente',
    })
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Unexpected error marking order as paid', {
      orderId: orderId || 'unknown',
      error,
    })

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
