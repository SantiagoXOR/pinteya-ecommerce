// Configuración para Node.js Runtime
export const runtime = 'nodejs';

/**
 * API de Métricas de Rate Limiting Enterprise
 * Proporciona estadísticas detalladas del sistema de rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils';
import { 
  getRateLimitStats, 
  cleanupRateLimitKeys,
  isRedisAvailable 
} from '@/lib/integrations/redis';
import { 
  metricsCollector,
  memoryStore 
} from '@/lib/rate-limiting/enterprise-rate-limiter';

// =====================================================
// GET /api/admin/rate-limiting/metrics
// Obtiene métricas completas de rate limiting
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const authResult = await requireAdminAuth(request, ['admin_access', 'metrics_read']);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;

    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const includeRedisStats = url.searchParams.get('redis') !== 'false';
    const includeMemoryStats = url.searchParams.get('memory') !== 'false';
    const includeTopKeys = url.searchParams.get('topKeys') !== 'false';
    const cleanup = url.searchParams.get('cleanup') === 'true';

    // Verificar disponibilidad de Redis
    const redisAvailable = await isRedisAvailable();

    // Obtener métricas del collector
    const collectorMetrics = includeMemoryStats ? metricsCollector.getMetrics() : null;

    // Obtener estadísticas de Redis si está disponible
    let redisStats = null;
    if (redisAvailable && includeRedisStats) {
      redisStats = await getRateLimitStats();
    }

    // Obtener estadísticas del store en memoria
    let memoryStats = null;
    if (includeMemoryStats) {
      memoryStats = memoryStore.getStats();
    }

    // Limpiar claves expiradas si se solicita
    let cleanupResult = null;
    if (cleanup && redisAvailable) {
      const cleanedKeys = await cleanupRateLimitKeys();
      cleanupResult = {
        cleanedKeys,
        timestamp: new Date().toISOString()
      };
    }

    // Calcular métricas derivadas
    const derivedMetrics = collectorMetrics ? {
      successRate: collectorMetrics.totalRequests > 0 
        ? (collectorMetrics.allowedRequests / collectorMetrics.totalRequests) * 100 
        : 100,
      blockRate: collectorMetrics.totalRequests > 0 
        ? (collectorMetrics.blockedRequests / collectorMetrics.totalRequests) * 100 
        : 0,
      redisUsageRate: collectorMetrics.totalRequests > 0 
        ? (collectorMetrics.redisHits / collectorMetrics.totalRequests) * 100 
        : 0,
      errorRate: collectorMetrics.totalRequests > 0 
        ? (collectorMetrics.errors / collectorMetrics.totalRequests) * 100 
        : 0
    } : null;

    // Construir respuesta
    const response = {
      success: true,
      data: {
        overview: {
          redisAvailable,
          timestamp: new Date().toISOString(),
          requestedBy: context.userId
        },
        collector: collectorMetrics,
        derived: derivedMetrics,
        redis: redisStats,
        memory: memoryStats,
        cleanup: cleanupResult
      },
      enterprise: {
        requester: {
          userId: context.userId,
          role: context.role,
          permissions: context.permissions
        },
        security: {
          level: context.securityLevel,
          validations: context.validations
        }
      },
      message: 'Métricas de rate limiting obtenidas correctamente'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[RATE_LIMIT_METRICS] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Error interno al obtener métricas de rate limiting',
        code: 'INTERNAL_ERROR',
        enterprise: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/admin/rate-limiting/metrics
// Resetea métricas o ejecuta operaciones de mantenimiento
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación admin con permisos críticos
    const authResult = await requireAdminAuth(request, ['admin_access', 'metrics_write', 'system_maintenance']);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;
    const body = await request.json();

    const {
      action = 'reset',
      resetCollector = false,
      cleanupRedis = false,
      pattern = 'rate_limit:*'
    } = body;

    const results: any = {
      timestamp: new Date().toISOString(),
      requestedBy: context.userId,
      actions: []
    };

    // Resetear métricas del collector
    if (action === 'reset' || resetCollector) {
      metricsCollector.reset();
      results.actions.push({
        action: 'reset_collector',
        success: true,
        message: 'Métricas del collector reseteadas'
      });
    }

    // Limpiar claves de Redis
    if (action === 'cleanup' || cleanupRedis) {
      const redisAvailable = await isRedisAvailable();
      
      if (redisAvailable) {
        const cleanedKeys = await cleanupRateLimitKeys(pattern);
        results.actions.push({
          action: 'cleanup_redis',
          success: true,
          cleanedKeys,
          pattern,
          message: `${cleanedKeys} claves limpiadas de Redis`
        });
      } else {
        results.actions.push({
          action: 'cleanup_redis',
          success: false,
          message: 'Redis no disponible para limpieza'
        });
      }
    }

    // Obtener estadísticas actualizadas
    const updatedMetrics = metricsCollector.getMetrics();
    const redisStats = await isRedisAvailable() ? await getRateLimitStats() : null;

    const response = {
      success: true,
      data: {
        operations: results,
        updatedMetrics: {
          collector: updatedMetrics,
          redis: redisStats
        }
      },
      enterprise: {
        requester: {
          userId: context.userId,
          role: context.role,
          permissions: context.permissions
        },
        security: {
          level: context.securityLevel,
          audit: true
        }
      },
      message: 'Operaciones de mantenimiento completadas'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[RATE_LIMIT_MAINTENANCE] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Error interno en operaciones de mantenimiento',
        code: 'INTERNAL_ERROR',
        enterprise: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE /api/admin/rate-limiting/metrics
// Elimina métricas específicas o todas
// =====================================================

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación admin con permisos críticos
    const authResult = await requireAdminAuth(request, ['admin_access', 'system_maintenance']);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;
    const url = new URL(request.url);
    const pattern = url.searchParams.get('pattern') || 'rate_limit:*';
    const force = url.searchParams.get('force') === 'true';

    if (!force) {
      return NextResponse.json(
        {
          error: 'Operación de eliminación requiere confirmación con force=true',
          code: 'CONFIRMATION_REQUIRED',
          enterprise: true
        },
        { status: 400 }
      );
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      requestedBy: context.userId,
      pattern,
      actions: []
    };

    // Resetear collector
    metricsCollector.reset();
    results.actions.push({
      action: 'reset_collector',
      success: true
    });

    // Limpiar Redis si está disponible
    const redisAvailable = await isRedisAvailable();
    if (redisAvailable) {
      const cleanedKeys = await cleanupRateLimitKeys(pattern);
      results.actions.push({
        action: 'cleanup_redis',
        success: true,
        cleanedKeys,
        pattern
      });
    }

    const response = {
      success: true,
      data: results,
      enterprise: {
        requester: {
          userId: context.userId,
          role: context.role
        },
        security: {
          level: context.securityLevel,
          audit: true,
          destructive: true
        }
      },
      message: 'Métricas eliminadas correctamente'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[RATE_LIMIT_DELETE] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Error interno al eliminar métricas',
        code: 'INTERNAL_ERROR',
        enterprise: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}










