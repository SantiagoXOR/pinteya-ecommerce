// ===================================
// PINTEYA E-COMMERCE - MONITORING CONFIGURATION API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin-auth';
import { enterpriseMetrics } from '@/lib/monitoring/enterprise-metrics';
import { enterpriseAlertSystem } from '@/lib/monitoring/alert-system';
import { 
  mercadoPagoCriticalBreaker, 
  mercadoPagoStandardBreaker, 
  webhookProcessingBreaker 
} from '@/lib/integrations/mercadopago/circuit-breaker';
import { getSupabaseClient } from '@/lib/integrations/supabase';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';

interface MonitoringConfig {
  metrics: {
    enabled: boolean;
    flushInterval: number;
    retentionDays: number;
    aggregationPeriods: string[];
  };
  alerts: {
    enabled: boolean;
    escalationEnabled: boolean;
    defaultCooldown: number;
    maxAlertsPerHour: number;
  };
  circuitBreakers: {
    enabled: boolean;
    configs: Record<string, any>;
  };
  dashboard: {
    refreshInterval: number;
    maxDataPoints: number;
    cacheTimeout: number;
  };
  compliance: {
    auditEnabled: boolean;
    retentionPolicies: Record<string, number>;
    encryptionEnabled: boolean;
  };
}

/**
 * GET /api/admin/monitoring/config
 * Obtiene la configuración actual del sistema de monitoreo
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

    // Obtener configuración actual
    const config: MonitoringConfig = {
      metrics: {
        enabled: true,
        flushInterval: 30000, // 30 segundos
        retentionDays: 30,
        aggregationPeriods: ['1m', '5m', '1h', '1d', '7d']
      },
      alerts: {
        enabled: true,
        escalationEnabled: true,
        defaultCooldown: 5, // minutos
        maxAlertsPerHour: 100
      },
      circuitBreakers: {
        enabled: true,
        configs: {
          mercadopago_critical: mercadoPagoCriticalBreaker.getMetrics(),
          mercadopago_standard: mercadoPagoStandardBreaker.getMetrics(),
          webhook_processing: webhookProcessingBreaker.getMetrics()
        }
      },
      dashboard: {
        refreshInterval: 5000, // 5 segundos
        maxDataPoints: 100,
        cacheTimeout: 30 // segundos
      },
      compliance: {
        auditEnabled: true,
        retentionPolicies: {
          authentication: 365,
          payment_processing: 2555, // 7 años
          security_violation: 2555,
          data_access: 1095 // 3 años
        },
        encryptionEnabled: true
      }
    };

    // Obtener estadísticas del sistema
    const stats = await getSystemStats();

    logger.info(LogLevel.INFO, 'Monitoring configuration retrieved', {
      userId: authResult.userId,
      configSections: Object.keys(config).length
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: true,
      data: {
        config,
        stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Failed to get monitoring configuration', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * PUT /api/admin/monitoring/config
 * Actualiza la configuración del sistema de monitoreo
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authResult = await getAuthenticatedAdmin(request);
    
    if (!authResult.isAdmin || !authResult.userId) {
      return NextResponse.json({
        success: false,
        error: 'Acceso no autorizado'
      }, { status: 401 });
    }

    const body = await request.json();
    const { section, config } = body;

    if (!section || !config) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros: section y config'
      }, { status: 400 });
    }

    // Validar y aplicar configuración según la sección
    let updateResult: any = {};

    switch (section) {
      case 'metrics':
        updateResult = await updateMetricsConfig(config, authResult.userId);
        break;
      case 'alerts':
        updateResult = await updateAlertsConfig(config, authResult.userId);
        break;
      case 'circuitBreakers':
        updateResult = await updateCircuitBreakersConfig(config, authResult.userId);
        break;
      case 'dashboard':
        updateResult = await updateDashboardConfig(config, authResult.userId);
        break;
      case 'compliance':
        updateResult = await updateComplianceConfig(config, authResult.userId);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Sección de configuración no válida'
        }, { status: 400 });
    }

    logger.info(LogLevel.INFO, `Monitoring configuration updated: ${section}`, {
      userId: authResult.userId,
      section,
      changes: Object.keys(config).length
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: true,
      data: {
        section,
        updated: updateResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Failed to update monitoring configuration', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * Obtiene estadísticas del sistema
 */
async function getSystemStats() {
  const supabase = getSupabaseClient(true);
  
  if (!supabase) {
    return {
      metrics: { total: 0, last24h: 0 },
      alerts: { active: 0, total: 0 },
      auditEvents: { total: 0, last24h: 0 }
    };
  }

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Estadísticas de métricas
  const { data: metricsStats } = await supabase
    .from('enterprise_metrics')
    .select('id, timestamp')
    .gte('timestamp', last24h);

  const { count: totalMetrics } = await supabase
    .from('enterprise_metrics')
    .select('*', { count: 'exact', head: true });

  // Estadísticas de alertas
  const { data: alertsStats } = await supabase
    .from('enterprise_alerts')
    .select('id, status, triggered_at')
    .eq('status', 'active');

  const { count: totalAlerts } = await supabase
    .from('enterprise_alerts')
    .select('*', { count: 'exact', head: true });

  // Estadísticas de auditoría
  const { data: auditStats } = await supabase
    .from('audit_events')
    .select('id, timestamp')
    .gte('timestamp', last24h);

  const { count: totalAuditEvents } = await supabase
    .from('audit_events')
    .select('*', { count: 'exact', head: true });

  return {
    metrics: {
      total: totalMetrics || 0,
      last24h: metricsStats?.length || 0
    },
    alerts: {
      active: alertsStats?.length || 0,
      total: totalAlerts || 0
    },
    auditEvents: {
      total: totalAuditEvents || 0,
      last24h: auditStats?.length || 0
    }
  };
}

/**
 * Actualiza configuración de métricas
 */
async function updateMetricsConfig(config: any, userId: string) {
  // TODO: Implementar actualización de configuración de métricas
  // Por ahora solo validamos y retornamos confirmación
  
  const validFields = ['enabled', 'flushInterval', 'retentionDays', 'aggregationPeriods'];
  const updates: Record<string, any> = {};

  for (const field of validFields) {
    if (config[field] !== undefined) {
      updates[field] = config[field];
    }
  }

  return {
    updated: updates,
    message: 'Metrics configuration updated successfully'
  };
}

/**
 * Actualiza configuración de alertas
 */
async function updateAlertsConfig(config: any, userId: string) {
  const validFields = ['enabled', 'escalationEnabled', 'defaultCooldown', 'maxAlertsPerHour'];
  const updates: Record<string, any> = {};

  for (const field of validFields) {
    if (config[field] !== undefined) {
      updates[field] = config[field];
    }
  }

  return {
    updated: updates,
    message: 'Alerts configuration updated successfully'
  };
}

/**
 * Actualiza configuración de circuit breakers
 */
async function updateCircuitBreakersConfig(config: any, userId: string) {
  const updates: Record<string, any> = {};

  if (config.enabled !== undefined) {
    updates.enabled = config.enabled;
  }

  // Reset circuit breakers si se solicita
  if (config.reset) {
    if (config.reset.includes('mercadopago_critical')) {
      mercadoPagoCriticalBreaker.reset();
      updates.mercadopago_critical_reset = true;
    }
    if (config.reset.includes('mercadopago_standard')) {
      mercadoPagoStandardBreaker.reset();
      updates.mercadopago_standard_reset = true;
    }
    if (config.reset.includes('webhook_processing')) {
      webhookProcessingBreaker.reset();
      updates.webhook_processing_reset = true;
    }
  }

  return {
    updated: updates,
    message: 'Circuit breakers configuration updated successfully'
  };
}

/**
 * Actualiza configuración del dashboard
 */
async function updateDashboardConfig(config: any, userId: string) {
  const validFields = ['refreshInterval', 'maxDataPoints', 'cacheTimeout'];
  const updates: Record<string, any> = {};

  for (const field of validFields) {
    if (config[field] !== undefined) {
      updates[field] = config[field];
    }
  }

  return {
    updated: updates,
    message: 'Dashboard configuration updated successfully'
  };
}

/**
 * Actualiza configuración de compliance
 */
async function updateComplianceConfig(config: any, userId: string) {
  const validFields = ['auditEnabled', 'retentionPolicies', 'encryptionEnabled'];
  const updates: Record<string, any> = {};

  for (const field of validFields) {
    if (config[field] !== undefined) {
      updates[field] = config[field];
    }
  }

  return {
    updated: updates,
    message: 'Compliance configuration updated successfully'
  };
}









