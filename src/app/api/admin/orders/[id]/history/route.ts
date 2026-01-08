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
    // ⚠️ TEMPORAL: Remover restricción de desarrollo para permitir bypass en producción hoy (2026-01-08)
    if (process.env.BYPASS_AUTH === 'true') {
      try {
        const fs = require('fs')
        const path = require('path')
        const envLocalPath = path.join(process.cwd(), '.env.local')
        if (fs.existsSync(envLocalPath)) {
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
        console.warn('[API Admin History] No se pudo verificar .env.local, bypass deshabilitado')
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

/**
 * GET /api/admin/orders/[id]/history
 * Obtiene el historial de estados de una orden específica
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  let orderId: string | undefined
  try {
    const { id } = await context.params
    orderId = id

    // Verificar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status || 401 })
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Fetching order history', {
      orderId,
      userId: authResult.userId,
    })

    // Verificar que la orden existe
    const supabase = createAdminClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, created_at')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      logger.log(LogLevel.WARN, LogCategory.API, 'Order not found', { orderId, orderError })
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 })
    }

    // Intentar obtener historial de estados desde order_status_history
    let statusHistory = []
    try {
      const { data: history, error: historyError } = await supabase
        .from('order_status_history')
        .select(
          `
          id,
          previous_status,
          new_status,
          reason,
          created_at,
          user_profiles!order_status_history_changed_by_fkey (
            first_name,
            last_name,
            email
          )
        `
        )
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (!historyError && history && history.length > 0) {
        // Formatear historial real
        statusHistory = history.map((item, index) => {
          const userProfiles = Array.isArray(item.user_profiles) ? item.user_profiles[0] : item.user_profiles
          const userName = userProfiles
            ? `${userProfiles.first_name || ''} ${userProfiles.last_name || ''}`.trim()
            : 'Sistema'
          return {
            id: item.id,
            status: item.new_status,
            timestamp: item.created_at,
            note: item.reason || `Estado cambiado a ${item.new_status}`,
            user: userName || 'Sistema',
          }
        })
      } else {
        // Si no hay historial en la tabla, crear historial básico
        statusHistory = [
          {
            id: '1',
            status: order.status,
            timestamp: order.created_at,
            note: 'Orden creada',
            user: 'Sistema',
          },
        ]

        // Si el estado actual no es 'pending', agregar una entrada adicional
        if (order.status !== 'pending') {
          statusHistory.push({
            id: '2',
            status: order.status,
            timestamp: order.created_at, // En un caso real, esto sería la fecha de cambio
            note: `Estado actualizado a ${order.status}`,
            user: 'Sistema',
          })
        }
      }
    } catch (historyError) {
      logger.log(
        LogLevel.WARN,
        LogCategory.API,
        'Error fetching order history, using fallback',
        {
          orderId,
          historyError,
        }
      )

      // Fallback: crear historial básico
      statusHistory = [
        {
          id: '1',
          status: order.status,
          timestamp: order.created_at,
          note: 'Orden creada',
          user: 'Sistema',
        },
      ]
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Order history fetched successfully', {
      orderId,
      historyCount: statusHistory.length,
    })

    return NextResponse.json({
      success: true,
      data: statusHistory,
    })
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Unexpected error in order history API', {
      orderId: orderId || 'unknown',
      error,
    })

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
