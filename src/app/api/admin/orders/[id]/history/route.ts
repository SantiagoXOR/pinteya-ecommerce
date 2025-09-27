import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/integrations/supabase/server'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'

/**
 * GET /api/admin/orders/[id]/history
 * Obtiene el historial de estados de una orden específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const orderId = params.id

    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Fetching order history', {
      orderId,
      userId: session.user.id,
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
            name,
            email
          )
        `
        )
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (!historyError && history && history.length > 0) {
        // Formatear historial real
        statusHistory = history.map((item, index) => ({
          id: item.id,
          status: item.new_status,
          timestamp: item.created_at,
          note: item.reason || `Estado cambiado a ${item.new_status}`,
          user: item.user_profiles?.name || 'Sistema',
        }))
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
        LogCategory.DATABASE,
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
      orderId: params.id,
      error,
    })

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
