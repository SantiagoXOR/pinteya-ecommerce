// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { supabaseAdmin } from '@/lib/integrations/supabase'

/**
 * GET /api/admin/orders/stats
 * Obtener estadísticas de órdenes desde Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const authResult = await requireAdminAuth()

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Obtener estadísticas de órdenes con revenue
    const [
      totalResult,
      pendingResult,
      processingResult,
      completedResult,
      cancelledResult,
      todayResult,
      revenueResult,
      todayRevenueResult,
    ] = await Promise.all([
      // Total de órdenes
      supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
      // Órdenes pendientes
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      // Órdenes en procesamiento (confirmadas + en proceso)
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['confirmed', 'processing']),
      // Órdenes completadas
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'delivered'),
      // Órdenes canceladas
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'cancelled'),
      // Órdenes de hoy
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`),
      // Revenue total (órdenes completadas)
      supabaseAdmin.from('orders').select('total').eq('status', 'delivered'),
      // Revenue de hoy (órdenes completadas de hoy)
      supabaseAdmin
        .from('orders')
        .select('total')
        .eq('status', 'delivered')
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`),
    ])

    // Calcular revenue
    const totalRevenue =
      revenueResult.data?.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0) || 0
    const todayRevenue =
      todayRevenueResult.data?.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0) || 0

    // Calcular valor promedio de orden
    const completedCount = completedResult.count || 0
    const averageOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0

    const stats = {
      total_orders: totalResult.count || 0,
      pending_orders: pendingResult.count || 0,
      processing_orders: processingResult.count || 0,
      completed_orders: completedCount,
      cancelled_orders: cancelledResult.count || 0,
      orders_today: todayResult.count || 0,
      total_revenue: totalRevenue,
      today_revenue: todayRevenue,
      average_order_value: averageOrderValue,
    }

    return NextResponse.json({
      success: true,
      data: stats, // Consistente con otros endpoints que usan 'data'
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas de órdenes:', error)

    // Estructura de fallback consistente con respuesta exitosa
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        data: {
          total_orders: 0,
          pending_orders: 0,
          processing_orders: 0, // ✅ Agregado para consistencia
          completed_orders: 0,
          cancelled_orders: 0, // ✅ Agregado para consistencia
          orders_today: 0, // ✅ Corregido: era 'today_orders'
          total_revenue: 0,
          today_revenue: 0,
          average_order_value: 0, // ✅ Agregado para consistencia
        },
      },
      { status: 500 }
    )
  }
}
