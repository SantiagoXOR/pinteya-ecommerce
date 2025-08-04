/**
 * API de monitoreo para panel administrativo
 * Proporciona métricas de performance y alertas de seguridad
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/supabase-auth-utils';
import { 
  getPerformanceMetrics, 
  getActiveAlerts,
  withPerformanceMonitoring,
  logStructured 
} from '@/lib/monitoring/admin-monitoring';

/**
 * GET /api/admin/monitoring
 * Obtener métricas de monitoreo y alertas
 */
async function getHandler(request: NextRequest) {
  try {
    logStructured('info', 'Admin monitoring API called', {
      endpoint: '/api/admin/monitoring',
      method: 'GET'
    });

    // Verificar autenticación admin
    const authResult = await requireAdminAuth(request);

    if (!authResult.success) {
      logStructured('warn', 'Unauthorized access to monitoring API', {
        error: authResult.error,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json(
        { 
          error: authResult.error,
          code: 'AUTH_FAILED',
          timestamp: new Date().toISOString()
        },
        { status: authResult.status || 401 }
      );
    }

    const { user } = authResult;
    logStructured('info', 'Admin monitoring access granted', {
      userId: user?.id,
      email: user?.email
    });

    // Obtener parámetros de query
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') as '1h' | '24h' | '7d' || '24h';
    const includeAlerts = url.searchParams.get('alerts') !== 'false';

    // Obtener métricas de performance
    const performanceMetrics = await getPerformanceMetrics(timeframe);

    // Obtener alertas activas si se solicitan
    let activeAlerts = null;
    if (includeAlerts) {
      activeAlerts = await getActiveAlerts();
    }

    // Calcular estadísticas adicionales
    const now = new Date();
    const systemStatus = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: now.toISOString(),
      version: '2.0.0'
    };

    const response = {
      success: true,
      data: {
        performance: performanceMetrics,
        alerts: activeAlerts,
        system: systemStatus,
        timeframe,
        requestedBy: {
          userId: user?.id,
          email: user?.email,
          timestamp: now.toISOString()
        }
      },
      meta: {
        api: 'admin-monitoring',
        version: '2.0.0',
        timestamp: now.toISOString()
      }
    };

    logStructured('info', 'Admin monitoring data retrieved successfully', {
      userId: user?.id,
      timeframe,
      alertsIncluded: includeAlerts,
      metricsCount: performanceMetrics?.stats?.totalRequests || 0,
      alertsCount: activeAlerts?.length || 0
    });

    return NextResponse.json(response);

  } catch (error) {
    logStructured('error', 'Error in admin monitoring API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/monitoring
 * Resolver alertas o ejecutar acciones de monitoreo
 */
async function postHandler(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const authResult = await requireAdminAuth(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const { user, supabase } = authResult;
    const body = await request.json();

    const { action, alertId, metadata } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Acción requerida' },
        { status: 400 }
      );
    }

    let result = null;

    switch (action) {
      case 'resolve_alert':
        if (!alertId) {
          return NextResponse.json(
            { error: 'ID de alerta requerido' },
            { status: 400 }
          );
        }

        // Resolver alerta en base de datos
        const { error: resolveError } = await supabase
          .from('admin_security_alerts')
          .update({
            resolved: true,
            resolved_by: user?.id,
            resolved_at: new Date().toISOString()
          })
          .eq('id', alertId);

        if (resolveError) {
          logStructured('error', 'Error resolving alert', {
            alertId,
            error: resolveError.message,
            userId: user?.id
          });

          return NextResponse.json(
            { error: 'Error al resolver alerta' },
            { status: 500 }
          );
        }

        result = { alertId, resolved: true };
        
        logStructured('info', 'Alert resolved by admin', {
          alertId,
          userId: user?.id,
          email: user?.email
        });
        break;

      case 'cleanup_metrics':
        // Ejecutar limpieza de métricas antiguas
        const { error: cleanupError } = await supabase.rpc('cleanup_old_admin_metrics');

        if (cleanupError) {
          logStructured('error', 'Error cleaning up metrics', {
            error: cleanupError.message,
            userId: user?.id
          });

          return NextResponse.json(
            { error: 'Error al limpiar métricas' },
            { status: 500 }
          );
        }

        result = { cleaned: true, timestamp: new Date().toISOString() };
        
        logStructured('info', 'Metrics cleanup executed by admin', {
          userId: user?.id,
          email: user?.email
        });
        break;

      case 'get_performance_stats':
        const timeframeHours = metadata?.timeframeHours || 24;
        
        const { data: stats, error: statsError } = await supabase
          .rpc('get_admin_performance_stats', { timeframe_hours: timeframeHours });

        if (statsError) {
          return NextResponse.json(
            { error: 'Error al obtener estadísticas' },
            { status: 500 }
          );
        }

        result = { stats: stats[0] || null };
        break;

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
      executedBy: {
        userId: user?.id,
        email: user?.email
      }
    });

  } catch (error) {
    logStructured('error', 'Error in admin monitoring POST', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// Aplicar middleware de monitoreo de performance
export const GET = withPerformanceMonitoring(getHandler);
export const POST = withPerformanceMonitoring(postHandler);
