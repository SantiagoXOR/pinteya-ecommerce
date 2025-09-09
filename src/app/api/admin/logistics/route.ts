// =====================================================
// API: DASHBOARD DE LOGÍSTICA ENTERPRISE
// Endpoint: GET /api/admin/logistics
// Descripción: Dashboard principal con métricas tiempo real
// Basado en: Patrones WooCommerce Activity Panels
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { 
  LogisticsDashboardResponse, 
  LogisticsStats, 
  LogisticsAlert,
  PerformanceMetric,
  CarrierPerformance,
  Shipment 
} from '@/types/logistics';

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================================================
async function validateAdminAuth(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Verificar rol de administrador
  if (session.user.role !== 'admin' && session.user.role !== 'manager') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }
  
  return null;
}

// =====================================================
// FUNCIONES DE DATOS
// =====================================================

async function getLogisticsStats(supabase: any): Promise<LogisticsStats> {
  // Obtener estadísticas generales de envíos
  const { data: shipments, error } = await supabase
    .from('shipments')
    .select('status, shipping_cost, created_at, delivered_at, estimated_delivery_date');
  
  if (error) throw error;
  
  const total_shipments = shipments.length;
  const pending_shipments = shipments.filter(s => s.status === 'pending').length;
  const in_transit_shipments = shipments.filter(s => 
    ['confirmed', 'picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)
  ).length;
  const delivered_shipments = shipments.filter(s => s.status === 'delivered').length;
  const exception_shipments = shipments.filter(s => s.status === 'exception').length;
  
  // Calcular tiempo promedio de entrega
  const deliveredWithTimes = shipments.filter(s => 
    s.status === 'delivered' && s.delivered_at && s.created_at
  );
  
  const average_delivery_time = deliveredWithTimes.length > 0 
    ? deliveredWithTimes.reduce((acc, s) => {
        const created = new Date(s.created_at);
        const delivered = new Date(s.delivered_at);
        const days = Math.ceil((delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return acc + days;
      }, 0) / deliveredWithTimes.length
    : 0;
  
  // Calcular tasa de entrega a tiempo
  const onTimeDeliveries = deliveredWithTimes.filter(s => {
    if (!s.estimated_delivery_date) return true;
    const estimated = new Date(s.estimated_delivery_date);
    const actual = new Date(s.delivered_at);
    return actual <= estimated;
  }).length;
  
  const on_time_delivery_rate = deliveredWithTimes.length > 0 
    ? (onTimeDeliveries / deliveredWithTimes.length) * 100 
    : 100;
  
  // Calcular costo total de envíos
  const total_shipping_cost = shipments.reduce((acc, s) => acc + (s.shipping_cost || 0), 0);
  
  // Obtener couriers activos
  const { data: couriers } = await supabase
    .from('couriers')
    .select('id')
    .eq('is_active', true);
  
  const active_couriers = couriers?.length || 0;
  
  return {
    total_shipments,
    pending_shipments,
    in_transit_shipments,
    delivered_shipments,
    exception_shipments,
    average_delivery_time: Math.round(average_delivery_time * 10) / 10,
    on_time_delivery_rate: Math.round(on_time_delivery_rate * 10) / 10,
    total_shipping_cost,
    active_couriers
  };
}

async function getRecentShipments(supabase: any): Promise<Shipment[]> {
  const { data, error } = await supabase
    .from('shipments')
    .select(`
      *,
      carrier:couriers(id, name, code),
      items:shipment_items(
        id, quantity, weight_kg,
        product:products(id, name, sku, image_url)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data || [];
}

async function getLogisticsAlerts(supabase: any): Promise<LogisticsAlert[]> {
  const alerts: LogisticsAlert[] = [];
  
  // Alertas por envíos con retraso
  const { data: delayedShipments } = await supabase
    .from('shipments')
    .select('id, shipment_number, estimated_delivery_date')
    .in('status', ['in_transit', 'out_for_delivery'])
    .lt('estimated_delivery_date', new Date().toISOString().split('T')[0]);
  
  delayedShipments?.forEach(shipment => {
    alerts.push({
      id: `delay-${shipment.id}`,
      type: 'warning',
      title: 'Envío con retraso',
      description: `El envío ${shipment.shipment_number} está retrasado`,
      shipment_id: shipment.id,
      created_at: new Date().toISOString(),
      is_read: false,
      action_url: `/admin/logistics/shipments/${shipment.id}`
    });
  });
  
  // Alertas por envíos con excepciones
  const { data: exceptionShipments } = await supabase
    .from('shipments')
    .select('id, shipment_number')
    .eq('status', 'exception');
  
  exceptionShipments?.forEach(shipment => {
    alerts.push({
      id: `exception-${shipment.id}`,
      type: 'error',
      title: 'Excepción en envío',
      description: `El envío ${shipment.shipment_number} tiene una excepción`,
      shipment_id: shipment.id,
      created_at: new Date().toISOString(),
      is_read: false,
      action_url: `/admin/logistics/shipments/${shipment.id}`
    });
  });
  
  return alerts;
}

async function getPerformanceMetrics(supabase: any): Promise<PerformanceMetric[]> {
  // Obtener métricas de los últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: shipments } = await supabase
    .from('shipments')
    .select('created_at, status, shipping_cost, delivered_at, estimated_delivery_date')
    .gte('created_at', thirtyDaysAgo.toISOString());
  
  // Agrupar por día
  const dailyMetrics: Record<string, PerformanceMetric> = {};
  
  shipments?.forEach(shipment => {
    const date = shipment.created_at.split('T')[0];
    
    if (!dailyMetrics[date]) {
      dailyMetrics[date] = {
        date,
        shipments_count: 0,
        delivered_count: 0,
        on_time_count: 0,
        average_delivery_time: 0,
        total_cost: 0
      };
    }
    
    dailyMetrics[date].shipments_count++;
    dailyMetrics[date].total_cost += shipment.shipping_cost || 0;
    
    if (shipment.status === 'delivered') {
      dailyMetrics[date].delivered_count++;
      
      // Verificar si fue a tiempo
      if (shipment.estimated_delivery_date && shipment.delivered_at) {
        const estimated = new Date(shipment.estimated_delivery_date);
        const actual = new Date(shipment.delivered_at);
        if (actual <= estimated) {
          dailyMetrics[date].on_time_count++;
        }
      }
    }
  });
  
  return Object.values(dailyMetrics).sort((a, b) => a.date.localeCompare(b.date));
}

async function getCarrierPerformance(supabase: any): Promise<CarrierPerformance[]> {
  const { data, error } = await supabase
    .from('shipments')
    .select(`
      carrier_id,
      status,
      shipping_cost,
      created_at,
      delivered_at,
      estimated_delivery_date,
      carrier:couriers(name)
    `)
    .not('carrier_id', 'is', null);
  
  if (error) throw error;
  
  // Agrupar por courier
  const carrierStats: Record<number, CarrierPerformance> = {};
  
  data?.forEach(shipment => {
    const carrierId = shipment.carrier_id;
    
    if (!carrierStats[carrierId]) {
      carrierStats[carrierId] = {
        carrier_id: carrierId,
        carrier_name: shipment.carrier?.name || 'Unknown',
        total_shipments: 0,
        delivered_shipments: 0,
        on_time_deliveries: 0,
        on_time_rate: 0,
        average_delivery_time: 0,
        total_cost: 0,
        average_cost_per_shipment: 0
      };
    }
    
    const stats = carrierStats[carrierId];
    stats.total_shipments++;
    stats.total_cost += shipment.shipping_cost || 0;
    
    if (shipment.status === 'delivered') {
      stats.delivered_shipments++;
      
      if (shipment.estimated_delivery_date && shipment.delivered_at) {
        const estimated = new Date(shipment.estimated_delivery_date);
        const actual = new Date(shipment.delivered_at);
        if (actual <= estimated) {
          stats.on_time_deliveries++;
        }
      }
    }
  });
  
  // Calcular métricas finales
  Object.values(carrierStats).forEach(stats => {
    stats.on_time_rate = stats.delivered_shipments > 0 
      ? (stats.on_time_deliveries / stats.delivered_shipments) * 100 
      : 0;
    stats.average_cost_per_shipment = stats.total_shipments > 0 
      ? stats.total_cost / stats.total_shipments 
      : 0;
  });
  
  return Object.values(carrierStats);
}

// =====================================================
// ENDPOINT PRINCIPAL
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    const authError = await validateAdminAuth(request);
    if (authError) return authError;
    
    // Crear cliente Supabase
    const supabase = createClient();
    
    // Obtener todos los datos en paralelo para mejor performance
    const [stats, recentShipments, alerts, performanceMetrics, carrierPerformance] = 
      await Promise.all([
        getLogisticsStats(supabase),
        getRecentShipments(supabase),
        getLogisticsAlerts(supabase),
        getPerformanceMetrics(supabase),
        getCarrierPerformance(supabase)
      ]);
    
    const response: LogisticsDashboardResponse = {
      data: {
        stats,
        recent_shipments: recentShipments,
        alerts,
        performance_metrics: performanceMetrics,
        carrier_performance: carrierPerformance
      }
    };
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Error in logistics dashboard API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
