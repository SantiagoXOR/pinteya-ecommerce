import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/integrations/supabase/server'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'

/**
 * GET /api/admin/orders/[id]/history
 * Obtiene el historial de estados de una orden específica
 * ⚡ MULTITENANT: Filtra por tenant_id
 */
export const GET = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  let orderId: string | undefined
  try {
    const { tenantId } = guardResult
    const { id } = await context.params
    orderId = id

    logger.log(LogLevel.INFO, LogCategory.API, 'Fetching order history', {
      orderId,
      tenantId,
      userId: guardResult.userId,
    })

    // ⚡ MULTITENANT: Verificar que la orden existe y pertenece al tenant
    const supabase = createAdminClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, created_at')
      .eq('id', orderId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
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
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
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
})
