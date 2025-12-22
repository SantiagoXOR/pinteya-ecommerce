// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// =====================================================
// API: DASHBOARD DE LOGÍSTICA ENTERPRISE
// Endpoint: GET /api/admin/logistics/dashboard
// Descripción: Dashboard principal con métricas tiempo real
// Basado en: Patrones WooCommerce Activity Panels
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import {
  LogisticsDashboardResponse,
  LogisticsStats,
  LogisticsAlert,
  PerformanceMetric,
  CarrierPerformance,
  Shipment,
} from '@/types/logistics'

// Cliente admin de Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================================================
async function validateAdminAuth(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verificar si es admin usando el rol de la sesión (cargado desde la BD en auth.ts)
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  return null
}

// =====================================================
// FUNCIONES DE DATOS
// =====================================================

async function getLogisticsStats(
  supabase: ReturnType<typeof createClient<Database>>
): Promise<LogisticsStats> {
  // Obtener estadísticas basadas en órdenes reales
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'id, status, fulfillment_status, total, created_at, tracking_number, carrier, estimated_delivery'
    )

  if (error) {
    throw error
  }

  const total_shipments = orders.length

  // Mapear estados de órdenes a estados de envío
  const pending_shipments = orders.filter(
    o => o.status === 'pending' || o.fulfillment_status === 'unfulfilled'
  ).length

  const in_transit_shipments = orders.filter(
    o => o.status === 'shipped' || o.fulfillment_status === 'partial'
  ).length

  const delivered_shipments = orders.filter(
    o => o.status === 'delivered' || o.fulfillment_status === 'fulfilled'
  ).length

  const exception_shipments = orders.filter(
    o => o.status === 'cancelled' || o.status === 'refunded'
  ).length

  // Calcular tiempo promedio de entrega (estimado basado en órdenes entregadas)
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const average_delivery_time = deliveredOrders.length > 0 ? 3.5 : 0 // Promedio estimado

  // Calcular tasa de entrega a tiempo (estimado)
  const on_time_delivery_rate = deliveredOrders.length > 0 ? 85.0 : 100.0

  // Calcular costo total estimado de envíos (10% del total de órdenes)
  const total_shipping_cost = orders.reduce((acc, o) => acc + parseFloat(o.total) * 0.1, 0)

  // Obtener couriers activos
  const { data: couriers } = await supabase.from('couriers').select('id').eq('is_active', true)

  const active_couriers = couriers?.length || 0

  return {
    total_shipments,
    pending_shipments,
    in_transit_shipments,
    delivered_shipments,
    exception_shipments,
    average_delivery_time: Math.round(average_delivery_time * 10) / 10,
    on_time_delivery_rate: Math.round(on_time_delivery_rate * 10) / 10,
    total_shipping_cost: Math.round(total_shipping_cost * 100) / 100,
    active_couriers,
  }
}

async function getRecentShipments(
  supabase: ReturnType<typeof createClient<Database>>
): Promise<Shipment[]> {
  // Obtener órdenes reales con información de envío
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      status,
      fulfillment_status,
      total,
      shipping_address,
      tracking_number,
      carrier,
      estimated_delivery,
      created_at,
      updated_at
    `
    )
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    throw error
  }

  // Obtener couriers para mapear nombres
  const { data: couriers } = await supabase.from('couriers').select('id, name, code')

  const courierMap = new Map(couriers?.map(c => [c.code, c]) || [])

  // Transformar órdenes a formato de envíos
  return (orders || []).map((order, index) => {
    const shippingAddr = order.shipping_address || {}
    const courierCode = order.carrier || 'CORREO_AR'
    const courier = courierMap.get(courierCode) || {
      id: '68cbf83e-a5bd-413b-bf44-9138e29fa870',
      name: 'Correo Argentino',
      code: 'CORREO_AR',
    }

    // Mapear estado de orden a estado de envío
    let shipmentStatus = 'pending'
    if (order.status === 'shipped') shipmentStatus = 'in_transit'
    else if (order.status === 'delivered') shipmentStatus = 'delivered'
    else if (order.status === 'paid') shipmentStatus = 'confirmed'

    return {
      id: `order-${order.id}`,
      shipment_number: order.tracking_number || `TRK${String(order.id).padStart(8, '0')}`,
      order_id: order.id,
      status: shipmentStatus,
      courier_id: courier.id,
      tracking_number: order.tracking_number || `TRK${String(order.id).padStart(8, '0')}`,
      recipient_name: shippingAddr.name || 'Cliente',
      recipient_address:
        shippingAddr.street || shippingAddr.street_name || 'Dirección no especificada',
      recipient_city: shippingAddr.city || shippingAddr.city_name || 'Buenos Aires',
      recipient_postal_code: shippingAddr.postal_code || shippingAddr.zip_code || '1000',
      recipient_country: shippingAddr.country || 'Argentina',
      package_weight_kg: 2.5, // Peso estimado
      package_value: parseFloat(order.total),
      shipping_cost: parseFloat(order.total) * 0.1, // 10% del total como costo de envío
      total_cost: parseFloat(order.total) * 0.1,
      estimated_delivery_date: order.estimated_delivery,
      created_at: order.created_at,
      updated_at: order.updated_at,
      carrier: courier,
      delivery_address: {
        street: shippingAddr.street || shippingAddr.street_name || 'Dirección no especificada',
        number: shippingAddr.street_number || '',
        neighborhood: '',
        city: shippingAddr.city || shippingAddr.city_name || 'Buenos Aires',
        state: shippingAddr.state || shippingAddr.state_name || 'Buenos Aires',
        postal_code: shippingAddr.postal_code || shippingAddr.zip_code || '1000',
        country: shippingAddr.country || 'Argentina',
      },
      weight_kg: 2.5,
    }
  })
}

async function getLogisticsAlerts(
  supabase: ReturnType<typeof createClient<Database>>
): Promise<LogisticsAlert[]> {
  const alerts: LogisticsAlert[] = []

  // Alertas por órdenes pendientes de envío (más de 2 días)
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, created_at')
    .eq('status', 'paid')
    .eq('fulfillment_status', 'unfulfilled')
    .lt('created_at', twoDaysAgo.toISOString())

  pendingOrders?.forEach(order => {
    alerts.push({
      id: `pending-${order.id}`,
      type: 'warning',
      title: 'Orden pendiente de envío',
      description: `La orden ${order.order_number || order.id} lleva más de 2 días sin enviar`,
      shipment_id: `order-${order.id}`,
      created_at: new Date().toISOString(),
      is_read: false,
      action_url: `/admin/orders/${order.id}`,
    })
  })

  // Alertas por órdenes sin dirección de envío
  const { data: ordersWithoutAddress } = await supabase
    .from('orders')
    .select('id, order_number, status')
    .eq('status', 'paid')
    .is('shipping_address', null)

  ordersWithoutAddress?.forEach(order => {
    alerts.push({
      id: `no-address-${order.id}`,
      type: 'error',
      title: 'Orden sin dirección de envío',
      description: `La orden ${order.order_number || order.id} no tiene dirección de envío`,
      shipment_id: `order-${order.id}`,
      created_at: new Date().toISOString(),
      is_read: false,
      action_url: `/admin/orders/${order.id}`,
    })
  })

  return alerts
}

async function getPerformanceMetrics(
  supabase: ReturnType<typeof createClient<Database>>
): Promise<PerformanceMetric[]> {
  // Obtener métricas basadas en órdenes reales de los últimos 30 días
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: orders } = await supabase
    .from('orders')
    .select('created_at, status, total, updated_at')
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Agrupar por día
  const dailyMetrics: Record<string, PerformanceMetric> = {}

  orders?.forEach(order => {
    const date = order.created_at.split('T')[0]

    if (!dailyMetrics[date]) {
      dailyMetrics[date] = {
        date,
        shipments_count: 0,
        delivered_count: 0,
        on_time_count: 0,
        average_delivery_time: 0,
        total_cost: 0,
      }
    }

    dailyMetrics[date].shipments_count++
    dailyMetrics[date].total_cost += parseFloat(order.total) * 0.1 // 10% como costo de envío

    if (order.status === 'delivered') {
      dailyMetrics[date].delivered_count++
      dailyMetrics[date].on_time_count++ // Asumir que las entregas son a tiempo
    }
  })

  return Object.values(dailyMetrics).sort((a, b) => a.date.localeCompare(b.date))
}

async function getCarrierPerformance(
  supabase: ReturnType<typeof createClient<Database>>
): Promise<CarrierPerformance[]> {
  // Obtener órdenes reales y couriers
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, carrier, created_at')

  const { data: couriers } = await supabase
    .from('couriers')
    .select('id, name, code')
    .eq('is_active', true)

  // Crear mapa de couriers
  const courierMap = new Map(couriers?.map(c => [c.code, c]) || [])

  // Agrupar por courier (usar Correo Argentino como default)
  const carrierStats: Record<string, CarrierPerformance> = {}

  orders?.forEach(order => {
    const carrierCode = order.carrier || 'CORREO_AR'
    const courier = courierMap.get(carrierCode) || {
      id: '68cbf83e-a5bd-413b-bf44-9138e29fa870',
      name: 'Correo Argentino',
      code: 'CORREO_AR',
    }

    if (!carrierStats[courier.id]) {
      carrierStats[courier.id] = {
        carrier_id: courier.id,
        carrier_name: courier.name,
        total_shipments: 0,
        delivered_shipments: 0,
        on_time_deliveries: 0,
        on_time_rate: 0,
        average_delivery_time: 3.5,
        total_cost: 0,
        average_cost_per_shipment: 0,
      }
    }

    const stats = carrierStats[courier.id]
    stats.total_shipments++
    stats.total_cost += parseFloat(order.total) * 0.1 // 10% como costo de envío

    if (order.status === 'delivered') {
      stats.delivered_shipments++
      stats.on_time_deliveries++ // Asumir entregas a tiempo
    }
  })

  // Calcular métricas finales
  Object.values(carrierStats).forEach(stats => {
    stats.on_time_rate =
      stats.delivered_shipments > 0
        ? (stats.on_time_deliveries / stats.delivered_shipments) * 100
        : 100 // 100% si no hay entregas aún
    stats.average_cost_per_shipment =
      stats.total_shipments > 0 ? stats.total_cost / stats.total_shipments : 0
  })

  return Object.values(carrierStats).filter(stats => stats.total_shipments > 0)
}

// =====================================================
// ENDPOINT PRINCIPAL
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    const authError = await validateAdminAuth(request)
    if (authError) {
      return authError
    }

    // Obtener todos los datos en paralelo para mejor performance usando cliente admin
    const [stats, recentShipments, alerts, performanceMetrics, carrierPerformance] =
      await Promise.all([
        getLogisticsStats(supabaseAdmin),
        getRecentShipments(supabaseAdmin),
        getLogisticsAlerts(supabaseAdmin),
        getPerformanceMetrics(supabaseAdmin),
        getCarrierPerformance(supabaseAdmin),
      ])

    const response: LogisticsDashboardResponse = {
      data: {
        stats,
        recent_shipments: recentShipments,
        alerts,
        performance_metrics: performanceMetrics,
        carrier_performance: carrierPerformance,
      },
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    console.error('Error in logistics dashboard API:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
