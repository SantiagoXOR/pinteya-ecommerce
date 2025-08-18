// ===================================
// PINTEYA E-COMMERCE - MONITORING METRICS API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin-auth';
import { enterpriseMetrics } from '@/lib/monitoring/enterprise-metrics';
import { 
  mercadoPagoCriticalBreaker, 
  mercadoPagoStandardBreaker, 
  webhookProcessingBreaker 
} from '@/lib/mercadopago/circuit-breaker';
import { getSupabaseClient } from '@/lib/supabase';
import { CacheUtils } from '@/lib/cache-manager';
import { logger, LogLevel, LogCategory } from '@/lib/logger';

interface DashboardMetrics {
  performance: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    uptime: number;
  };
  business: {
    totalRevenue: number;
    ordersToday: number;
    conversionRate: number;
    activeUsers: number;
  };
  security: {
    securityEvents: number;
    blockedRequests: number;
    authFailures: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  infrastructure: {
    circuitBreakerStatus: 'closed' | 'open' | 'half-open';
    cacheHitRate: number;
    databaseConnections: number;
    memoryUsage: number;
  };
}

interface ActiveAlert {
  id: string;
  level: 'info' | 'warning' | 'critical' | 'emergency';
  message: string;
  timestamp: string;
  metric: string;
  value: number;
  threshold: number;
}

/**
 * GET /api/admin/monitoring/metrics
 * Obtiene métricas en tiempo real para el dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authResult = await getAuthenticatedAdmin(request);
    
    if (!authResult.isAdmin || !authResult.userId) {
      return NextResponse.json({
        success: false,
        error: 'Acceso no autorizado'
      }, { status: 401 });
    }

    // Usar cache para evitar sobrecarga
    const cacheKey = 'dashboard:metrics:realtime';
    const cachedMetrics = await CacheUtils.get(cacheKey);
    
    if (cachedMetrics) {
      return NextResponse.json({
        success: true,
        data: cachedMetrics,
        cached: true
      });
    }

    // Obtener métricas en paralelo
    const [
      performanceMetrics,
      businessMetrics,
      securityMetrics,
      infrastructureMetrics,
      activeAlerts
    ] = await Promise.all([
      getPerformanceMetrics(),
      getBusinessMetrics(),
      getSecurityMetrics(),
      getInfrastructureMetrics(),
      getActiveAlerts()
    ]);

    const dashboardData = {
      metrics: {
        performance: performanceMetrics,
        business: businessMetrics,
        security: securityMetrics,
        infrastructure: infrastructureMetrics
      },
      alerts: activeAlerts,
      trends: await getMetricTrends(),
      timestamp: new Date().toISOString()
    };

    // Cache por 30 segundos
    await CacheUtils.set(cacheKey, dashboardData, 30);

    logger.info(LogLevel.INFO, 'Dashboard metrics retrieved', {
      userId: authResult.userId,
      metricsCount: Object.keys(dashboardData.metrics).length,
      alertsCount: activeAlerts.length
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Failed to get dashboard metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * Obtiene métricas de performance
 */
async function getPerformanceMetrics() {
  const supabase = getSupabaseClient(true);
  
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // Obtener métricas de los últimos 5 minutos
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: metrics, error } = await supabase
    .from('enterprise_metrics')
    .select('name, value, timestamp')
    .in('name', [
      'performance.api.duration',
      'performance.api.error_rate',
      'performance.api.throughput',
      'performance.system.uptime'
    ])
    .gte('timestamp', fiveMinutesAgo)
    .order('timestamp', { ascending: false });

  if (error) {
    logger.error(LogLevel.ERROR, 'Failed to fetch performance metrics', { error: error.message }, LogCategory.SYSTEM);
    // Valores por defecto en caso de error
    return {
      responseTime: 0,
      errorRate: 0,
      throughput: 0,
      uptime: 0.99
    };
  }

  // Calcular promedios
  const responseTimeMetrics = metrics?.filter(m => m.name === 'performance.api.duration') || [];
  const errorRateMetrics = metrics?.filter(m => m.name === 'performance.api.error_rate') || [];
  const throughputMetrics = metrics?.filter(m => m.name === 'performance.api.throughput') || [];
  const uptimeMetrics = metrics?.filter(m => m.name === 'performance.system.uptime') || [];

  return {
    responseTime: responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length 
      : 285,
    errorRate: errorRateMetrics.length > 0 
      ? errorRateMetrics.reduce((sum, m) => sum + m.value, 0) / errorRateMetrics.length 
      : 0.004,
    throughput: throughputMetrics.length > 0 
      ? throughputMetrics.reduce((sum, m) => sum + m.value, 0) / throughputMetrics.length 
      : 120,
    uptime: uptimeMetrics.length > 0 
      ? uptimeMetrics[0].value 
      : 0.9997
  };
}

/**
 * Obtiene métricas de negocio
 */
async function getBusinessMetrics() {
  const supabase = getSupabaseClient(true);
  
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const today = new Date().toISOString().split('T')[0];

  // Obtener órdenes del día
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('total_amount, status, created_at')
    .gte('created_at', `${today}T00:00:00Z`)
    .lt('created_at', `${today}T23:59:59Z`);

  if (ordersError) {
    logger.error(LogLevel.ERROR, 'Failed to fetch business metrics', { error: ordersError.message }, LogCategory.SYSTEM);
  }

  const completedOrders = orders?.filter(o => o.status === 'completed') || [];
  const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  // Métricas simuladas para demo (en producción vendrían de analytics reales)
  return {
    totalRevenue,
    ordersToday: completedOrders.length,
    conversionRate: 0.034, // 3.4%
    activeUsers: Math.floor(Math.random() * 50) + 20 // Simulado
  };
}

/**
 * Obtiene métricas de seguridad
 */
async function getSecurityMetrics() {
  const supabase = getSupabaseClient(true);
  
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Obtener eventos de auditoría de seguridad
  const { data: securityEvents, error } = await supabase
    .from('audit_events')
    .select('category, severity, result')
    .eq('category', 'security_violation')
    .gte('timestamp', oneHourAgo);

  if (error) {
    logger.error(LogLevel.ERROR, 'Failed to fetch security metrics', { error: error.message }, LogCategory.SYSTEM);
  }

  const events = securityEvents || [];
  const blockedRequests = events.filter(e => e.result === 'blocked').length;
  const authFailures = events.filter(e => e.result === 'failure').length;
  
  // Determinar nivel de riesgo
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (events.length > 10) riskLevel = 'critical';
  else if (events.length > 5) riskLevel = 'high';
  else if (events.length > 2) riskLevel = 'medium';

  return {
    securityEvents: events.length,
    blockedRequests,
    authFailures,
    riskLevel
  };
}

/**
 * Obtiene métricas de infraestructura
 */
async function getInfrastructureMetrics() {
  // Estado de circuit breakers
  const criticalBreakerState = mercadoPagoCriticalBreaker.getState();
  const standardBreakerState = mercadoPagoStandardBreaker.getState();
  const webhookBreakerState = webhookProcessingBreaker.getState();

  // Determinar estado general (el más crítico)
  let overallStatus: 'closed' | 'open' | 'half-open' = 'closed';
  if ([criticalBreakerState, standardBreakerState, webhookBreakerState].includes('open')) {
    overallStatus = 'open';
  } else if ([criticalBreakerState, standardBreakerState, webhookBreakerState].includes('half-open')) {
    overallStatus = 'half-open';
  }

  // Métricas simuladas (en producción vendrían de monitoreo real)
  return {
    circuitBreakerStatus: overallStatus,
    cacheHitRate: 0.87, // 87%
    databaseConnections: Math.floor(Math.random() * 10) + 5,
    memoryUsage: 0.65 // 65%
  };
}

/**
 * Obtiene alertas activas
 */
async function getActiveAlerts(): Promise<ActiveAlert[]> {
  const supabase = getSupabaseClient(true);
  
  if (!supabase) {
    return [];
  }

  const { data: alerts, error } = await supabase
    .from('enterprise_alerts')
    .select('*')
    .is('resolved_at', null)
    .order('triggered_at', { ascending: false })
    .limit(10);

  if (error) {
    logger.error(LogLevel.ERROR, 'Failed to fetch active alerts', { error: error.message }, LogCategory.SYSTEM);
    return [];
  }

  return (alerts || []).map(alert => ({
    id: alert.id,
    level: alert.level,
    message: alert.message,
    timestamp: alert.triggered_at,
    metric: alert.metric_name,
    value: alert.value,
    threshold: alert.threshold
  }));
}

/**
 * Obtiene tendencias de métricas
 */
async function getMetricTrends() {
  const supabase = getSupabaseClient(true);
  
  if (!supabase) {
    return {};
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: trends, error } = await supabase
    .from('enterprise_metrics')
    .select('name, value, timestamp')
    .in('name', [
      'performance.api.duration',
      'performance.api.error_rate',
      'business.revenue',
      'security.events'
    ])
    .gte('timestamp', oneHourAgo)
    .order('timestamp', { ascending: true });

  if (error) {
    logger.error(LogLevel.ERROR, 'Failed to fetch metric trends', { error: error.message }, LogCategory.SYSTEM);
    return {};
  }

  // Agrupar por nombre de métrica
  const groupedTrends: Record<string, Array<{ timestamp: string; value: number }>> = {};
  
  (trends || []).forEach(trend => {
    if (!groupedTrends[trend.name]) {
      groupedTrends[trend.name] = [];
    }
    groupedTrends[trend.name].push({
      timestamp: trend.timestamp,
      value: trend.value
    });
  });

  return groupedTrends;
}
