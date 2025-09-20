// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - MONITORING STATS API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { logger, LogCategory } from '@/lib/enterprise/logger';
import { realTimePerformanceMonitor } from '@/lib/monitoring/real-time-performance-monitor';
import { advancedAlertingEngine } from '@/lib/monitoring/advanced-alerting-engine';
import { performanceBudgetsMonitor } from '@/lib/monitoring/performance-budgets-monitor';
import { realTimeMetricsStreaming } from '@/lib/monitoring/real-time-metrics-streaming';

/**
 * GET - Obtiene estadísticas de monitoreo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const period = parseInt(searchParams.get('period') || '24'); // horas

    logger.info(LogCategory.API, 'Monitoring stats requested', {
      type,
      period
    });

    let stats: any = {};

    switch (type) {
      case 'performance':
        stats = await getPerformanceStats(period);
        break;
      
      case 'alerts':
        stats = await getAlertStats(period);
        break;
      
      case 'budgets':
        stats = await getBudgetStats(period);
        break;
      
      case 'streaming':
        stats = await getStreamingStats();
        break;
      
      case 'all':
      default:
        stats = await getAllStats(period);
        break;
    }

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: Date.now(),
      period: type === 'streaming' ? undefined : period
    });

  } catch (error) {
    logger.error(LogCategory.API, 'Error getting monitoring stats', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Error retrieving monitoring statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Obtiene estadísticas de performance
 */
async function getPerformanceStats(periodHours: number) {
  const currentMetrics = realTimePerformanceMonitor.getCurrentMetrics();
  const latestMetrics = currentMetrics.realTime[currentMetrics.realTime.length - 1];

  // Calcular promedios del período
  const now = Date.now();
  const periodStart = now - (periodHours * 60 * 60 * 1000);
  
  const periodMetrics = currentMetrics.realTime.filter(m => m.timestamp >= periodStart);
  const periodWebVitals = currentMetrics.webVitals.filter(v => v.timestamp >= periodStart);
  const periodApiMetrics = currentMetrics.apiMetrics.filter(a => a.timestamp >= periodStart);

  const avgResponseTime = periodMetrics.length > 0 
    ? periodMetrics.reduce((sum, m) => sum + m.responseTime, 0) / periodMetrics.length 
    : 0;

  const avgErrorRate = periodMetrics.length > 0 
    ? periodMetrics.reduce((sum, m) => sum + m.errorRate, 0) / periodMetrics.length 
    : 0;

  const avgThroughput = periodMetrics.length > 0 
    ? periodMetrics.reduce((sum, m) => sum + m.throughput, 0) / periodMetrics.length 
    : 0;

  // Core Web Vitals promedios
  const avgLCP = periodWebVitals.length > 0 
    ? periodWebVitals.reduce((sum, v) => sum + v.lcp, 0) / periodWebVitals.length 
    : 0;

  const avgFID = periodWebVitals.length > 0 
    ? periodWebVitals.reduce((sum, v) => sum + v.fid, 0) / periodWebVitals.length 
    : 0;

  const avgCLS = periodWebVitals.length > 0 
    ? periodWebVitals.reduce((sum, v) => sum + v.cls, 0) / periodWebVitals.length 
    : 0;

  return {
    current: latestMetrics || null,
    period: {
      averages: {
        responseTime: Math.round(avgResponseTime),
        errorRate: Number((avgErrorRate * 100).toFixed(2)),
        throughput: Number(avgThroughput.toFixed(2)),
        coreWebVitals: {
          lcp: Math.round(avgLCP),
          fid: Math.round(avgFID),
          cls: Number(avgCLS.toFixed(3))
        }
      },
      counts: {
        totalMetrics: periodMetrics.length,
        webVitalsRecords: periodWebVitals.length,
        apiCalls: periodApiMetrics.length
      }
    },
    trends: {
      responseTime: calculateTrend(periodMetrics.map(m => m.responseTime)),
      errorRate: calculateTrend(periodMetrics.map(m => m.errorRate)),
      throughput: calculateTrend(periodMetrics.map(m => m.throughput))
    }
  };
}

/**
 * Obtiene estadísticas de alertas
 */
async function getAlertStats(periodHours: number) {
  const alertStats = advancedAlertingEngine.getAlertStats();
  const activeAlerts = advancedAlertingEngine.getActiveAlerts();

  // Filtrar alertas del período
  const now = Date.now();
  const periodStart = now - (periodHours * 60 * 60 * 1000);
  const periodAlerts = activeAlerts.filter(alert => alert.timestamp >= periodStart);

  // Agrupar por severidad
  const alertsBySeverity = periodAlerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Agrupar por tipo
  const alertsByType = periodAlerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Alertas más recientes
  const recentAlerts = activeAlerts
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)
    .map(alert => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      timestamp: alert.timestamp,
      status: alert.status
    }));

  return {
    summary: alertStats,
    period: {
      total: periodAlerts.length,
      bySeverity: alertsBySeverity,
      byType: alertsByType
    },
    recent: recentAlerts,
    escalation: {
      escalatedAlerts: activeAlerts.filter(a => a.escalationLevel > 0).length,
      averageEscalationLevel: activeAlerts.length > 0 
        ? activeAlerts.reduce((sum, a) => sum + a.escalationLevel, 0) / activeAlerts.length 
        : 0
    }
  };
}

/**
 * Obtiene estadísticas de presupuestos
 */
async function getBudgetStats(periodHours: number) {
  const budgetReport = performanceBudgetsMonitor.generateReport(periodHours);
  const activeBudgets = performanceBudgetsMonitor.getActiveBudgets();

  // Calcular métricas adicionales
  const budgetsByStatus = budgetReport.budgetResults.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const budgetsByTrend = budgetReport.budgetResults.reduce((acc, result) => {
    acc[result.trend] = (acc[result.trend] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top violaciones
  const topViolations = budgetReport.budgetResults
    .filter(result => result.violations > 0)
    .sort((a, b) => b.violations - a.violations)
    .slice(0, 5)
    .map(result => ({
      budgetName: result.budget.name,
      violations: result.violations,
      averageValue: result.averageValue,
      target: result.budget.target,
      unit: result.budget.unit
    }));

  return {
    summary: budgetReport.summary,
    period: budgetReport.period,
    distribution: {
      byStatus: budgetsByStatus,
      byTrend: budgetsByTrend
    },
    topViolations,
    recommendations: budgetReport.recommendations,
    activeBudgets: activeBudgets.length
  };
}

/**
 * Obtiene estadísticas de streaming
 */
async function getStreamingStats() {
  const streamingStats = realTimeMetricsStreaming.getStats();
  const activeClients = realTimeMetricsStreaming.getActiveClients();
  const recentEvents = realTimeMetricsStreaming.getRecentEvents(20);

  // Agrupar clientes por tipo de suscripción
  const clientsBySubscription = activeClients.reduce((acc, client) => {
    client.subscriptions.forEach(sub => {
      acc[sub] = (acc[sub] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Eventos recientes por tipo
  const eventsByType = recentEvents.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    overview: streamingStats,
    clients: {
      active: activeClients.length,
      bySubscription: clientsBySubscription,
      details: activeClients.map(client => ({
        id: client.id,
        subscriptions: client.subscriptions.length,
        lastActivity: client.lastActivity,
        queueSize: client.queueSize
      }))
    },
    events: {
      recent: recentEvents.length,
      byType: eventsByType,
      latest: recentEvents.slice(0, 5).map(event => ({
        type: event.type,
        timestamp: event.timestamp,
        id: event.id
      }))
    }
  };
}

/**
 * Obtiene todas las estadísticas
 */
async function getAllStats(periodHours: number) {
  const [performance, alerts, budgets, streaming] = await Promise.all([
    getPerformanceStats(periodHours),
    getAlertStats(periodHours),
    getBudgetStats(periodHours),
    getStreamingStats()
  ]);

  // Calcular score general del sistema
  const systemScore = calculateSystemScore(performance, alerts, budgets);

  return {
    systemScore,
    performance,
    alerts,
    budgets,
    streaming,
    summary: {
      healthy: systemScore >= 80,
      activeAlerts: alerts.summary.active,
      budgetViolations: budgets.topViolations.length,
      streamingClients: streaming.clients.active,
      lastUpdate: Date.now()
    }
  };
}

/**
 * Calcula tendencia de una serie de valores
 */
function calculateTrend(values: number[]): number {
  if (values.length < 2) {return 0;}

  const half = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, half);
  const secondHalf = values.slice(half);

  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  return firstAvg === 0 ? 0 : ((secondAvg - firstAvg) / firstAvg) * 100;
}

/**
 * Calcula score general del sistema
 */
function calculateSystemScore(performance: any, alerts: any, budgets: any): number {
  let score = 100;

  // Penalizar por alertas activas
  score -= alerts.summary.active * 5;
  score -= alerts.summary.acknowledged * 2;

  // Penalizar por presupuestos fallidos
  score -= budgets.summary.failingBudgets * 10;
  score -= budgets.summary.warningBudgets * 5;

  // Penalizar por performance pobre
  if (performance.current) {
    if (performance.current.errorRate > 0.05) {score -= 15;} // >5% error rate
    if (performance.current.responseTime > 2000) {score -= 10;} // >2s response time
    if (performance.current.memoryUsage > 0.9) {score -= 10;} // >90% memory
    if (performance.current.cpuUsage > 0.8) {score -= 10;} // >80% CPU
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}










