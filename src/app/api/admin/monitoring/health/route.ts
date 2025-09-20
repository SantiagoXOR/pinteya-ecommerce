// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - HEALTH CHECKS API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin-auth';
import { enterpriseHealthSystem, HealthStatus } from '@/lib/monitoring/health-checks';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';

// Estados de salud
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

// Resultado de health check
interface HealthCheckResult {
  service: string;
  status: HealthStatus;
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
  lastChecked: string;
}

// Resumen de salud del sistema
interface SystemHealth {
  overall: HealthStatus;
  services: HealthCheckResult[];
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    total: number;
  };
  uptime: number;
  version: string;
  timestamp: string;
}

/**
 * GET /api/admin/monitoring/health
 * Obtiene el estado de salud de todos los servicios
 */
export async function GET(request: NextRequest) {
  try {
    // Para health checks, permitir acceso sin autenticación completa para monitoreo externo
    const searchParams = request.nextUrl.searchParams;
    const detailed = searchParams.get('detailed') === 'true';
    const services = searchParams.get('services')?.split(',') || [];

    // Si se solicita información detallada, verificar autenticación
    if (detailed) {
      const authResult = await getAuthenticatedAdmin(request);
      if (!authResult.isAdmin) {
        return NextResponse.json({
          success: false,
          error: 'Acceso no autorizado para información detallada'
        }, { status: 401 });
      }
    }

    // Usar el sistema enterprise de health checks
    let serviceResults;

    if (services.length > 0) {
      // Ejecutar health checks específicos
      serviceResults = await Promise.all(
        services.map(async (service) => {
          try {
            return await enterpriseHealthSystem.runHealthCheck(service);
          } catch (error) {
            return {
              service,
              status: HealthStatus.UNHEALTHY,
              severity: 'critical' as const,
              responseTime: 0,
              message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              details: {},
              lastChecked: new Date().toISOString()
            };
          }
        })
      );
    } else {
      // Ejecutar todos los health checks
      serviceResults = await enterpriseHealthSystem.runAllHealthChecks();
    }

    // Obtener resumen del sistema
    const healthData = enterpriseHealthSystem.getSystemHealth();
    const summary = healthData.summary;
    const overall = healthData.overall;

    const systemHealth: SystemHealth = {
      overall,
      services: serviceResults,
      summary,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '3.0.0',
      timestamp: new Date().toISOString()
    };

    // Log health check
    logger.info(LogLevel.INFO, 'Health check performed', {
      overall,
      servicesChecked: serviceResults.length,
      healthy: summary.healthy,
      degraded: summary.degraded,
      unhealthy: summary.unhealthy
    }, LogCategory.SYSTEM);

    // Retornar respuesta con código de estado apropiado
    const statusCode = overall === HealthStatus.HEALTHY ? 200 :
                      overall === HealthStatus.DEGRADED ? 200 :
                      503;

    return NextResponse.json({
      success: overall !== HealthStatus.UNHEALTHY,
      data: systemHealth
    }, { status: statusCode });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: false,
      data: {
        overall: HealthStatus.UNHEALTHY,
        services: [],
        summary: { healthy: 0, degraded: 0, unhealthy: 1, total: 1 },
        uptime: process.uptime(),
        version: '3.0.0',
        timestamp: new Date().toISOString()
      }
    }, { status: 503 });
  }
}

/**
 * POST /api/admin/monitoring/health
 * Ejecuta health checks específicos o acciones de recuperación
 */
export async function POST(request: NextRequest) {
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
    const { action, service, config } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Falta parámetro: action'
      }, { status: 400 });
    }

    let result: any = {};

    switch (action) {
      case 'check':
        if (!service) {
          return NextResponse.json({
            success: false,
            error: 'Service requerido para check'
          }, { status: 400 });
        }
        result = await enterpriseHealthSystem.runHealthCheck(service);
        break;
      case 'recover':
        if (!service) {
          return NextResponse.json({
            success: false,
            error: 'Service requerido para recover'
          }, { status: 400 });
        }
        const recoveryActionId = getRecoveryActionId(service);
        if (recoveryActionId) {
          const success = await enterpriseHealthSystem.executeRecoveryAction(recoveryActionId, config);
          result = { success, service, action: 'recover' };
        } else {
          result = { success: false, service, error: 'No recovery action available' };
        }
        break;
      case 'reset':
        if (service === 'circuit_breakers' || !service) {
          const success = await enterpriseHealthSystem.executeRecoveryAction('reset_circuit_breakers');
          result = { success, service: service || 'circuit_breakers', action: 'reset' };
        } else {
          result = { success: false, service, error: 'Reset not supported for this service' };
        }
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no válida'
        }, { status: 400 });
    }

    logger.info(LogLevel.INFO, `Health action performed: ${action}`, {
      userId: authResult.userId,
      action,
      service,
      success: result.success
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Health action failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * Obtiene el ID de acción de recuperación para un servicio
 */
function getRecoveryActionId(service: string): string | null {
  switch (service) {
    case 'circuit_breakers':
      return 'reset_circuit_breakers';
    case 'cache':
      return 'clear_cache';
    default:
      return null;
  }
}












