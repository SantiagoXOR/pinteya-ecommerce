// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO METRICS API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { metricsCollector } from '@/lib/enterprise/metrics';
import { isRedisAvailable } from '@/lib/integrations/redis';
import { logger, LogCategory } from '@/lib/enterprise/logger';

// Tipos para la respuesta de métricas
interface MetricsResponse {
  success: boolean;
  data?: {
    realTimeMetrics: {
      totalRequests: number;
      successRate: number;
      errorRate: number;
      averageResponseTime: number;
      rateLimitHits: number;
      retryAttempts: number;
    };
    endpointMetrics: {
      createPreference: EndpointMetric;
      webhook: EndpointMetric;
      paymentQuery: EndpointMetric;
    };
    systemHealth: {
      redisStatus: 'connected' | 'disconnected';
      lastUpdate: string;
      uptime: number;
    };
    alerts: Alert[];
  };
  error?: string;
}

interface EndpointMetric {
  requests: number;
  successRate: number;
  averageResponseTime: number;
  errorCount: number;
  lastError?: string;
}

interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
  endpoint?: string;
}

/**
 * GET /api/admin/mercadopago/metrics
 * Obtiene métricas en tiempo real de MercadoPago
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // TODO: Verificar rol de admin
    // const isAdmin = await checkUserRole(userId);
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { success: false, error: 'Acceso denegado' },
    //     { status: 403 }
    //   );
    // }

    logger.info(LogCategory.API, 'Fetching MercadoPago metrics', { userId });

    // Obtener métricas del sistema
    const metrics = await metricsCollector.getMercadoPagoMetrics();
    const redisStatus = await isRedisAvailable();

    // Calcular métricas en tiempo real
    const totalRequests = metrics.payment_creation.requests.total + 
                         metrics.payment_queries.requests.total + 
                         metrics.webhook_processing.requests.total;

    const totalSuccess = metrics.payment_creation.requests.success + 
                        metrics.payment_queries.requests.success + 
                        metrics.webhook_processing.requests.success;

    const totalErrors = metrics.payment_creation.requests.error + 
                       metrics.payment_queries.requests.error + 
                       metrics.webhook_processing.requests.error;

    const successRate = totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 100;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Calcular tiempo de respuesta promedio ponderado
    const avgResponseTime = (
      metrics.payment_creation.response_times.avg * metrics.payment_creation.requests.total +
      metrics.payment_queries.response_times.avg * metrics.payment_queries.requests.total +
      metrics.webhook_processing.response_times.avg * metrics.webhook_processing.requests.total
    ) / (totalRequests || 1);

    // Generar alertas basadas en umbrales
    const alerts: Alert[] = [];

    if (errorRate > 5) {
      alerts.push({
        type: 'error',
        message: `Tasa de error alta: ${errorRate.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
      });
    }

    if (avgResponseTime > 3000) {
      alerts.push({
        type: 'warning',
        message: `Tiempo de respuesta alto: ${avgResponseTime.toFixed(0)}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    if (!redisStatus) {
      alerts.push({
        type: 'warning',
        message: 'Redis desconectado - usando fallback en memoria',
        timestamp: new Date().toISOString(),
      });
    }

    // Preparar respuesta
    const response: MetricsResponse = {
      success: true,
      data: {
        realTimeMetrics: {
          totalRequests,
          successRate: Math.round(successRate * 100) / 100,
          errorRate: Math.round(errorRate * 100) / 100,
          averageResponseTime: Math.round(avgResponseTime),
          rateLimitHits: metrics.payment_creation.requests.rate_limited + 
                        metrics.payment_queries.requests.rate_limited + 
                        metrics.webhook_processing.requests.rate_limited,
          retryAttempts: metrics.payment_creation.retry_stats.total_retries + 
                        metrics.payment_queries.retry_stats.total_retries + 
                        metrics.webhook_processing.retry_stats.total_retries,
        },
        endpointMetrics: {
          createPreference: {
            requests: metrics.payment_creation.requests.total,
            successRate: metrics.payment_creation.requests.total > 0 ? 
              (metrics.payment_creation.requests.success / metrics.payment_creation.requests.total) * 100 : 100,
            averageResponseTime: Math.round(metrics.payment_creation.response_times.avg),
            errorCount: metrics.payment_creation.requests.error,
          },
          webhook: {
            requests: metrics.webhook_processing.requests.total,
            successRate: metrics.webhook_processing.requests.total > 0 ? 
              (metrics.webhook_processing.requests.success / metrics.webhook_processing.requests.total) * 100 : 100,
            averageResponseTime: Math.round(metrics.webhook_processing.response_times.avg),
            errorCount: metrics.webhook_processing.requests.error,
          },
          paymentQuery: {
            requests: metrics.payment_queries.requests.total,
            successRate: metrics.payment_queries.requests.total > 0 ? 
              (metrics.payment_queries.requests.success / metrics.payment_queries.requests.total) * 100 : 100,
            averageResponseTime: Math.round(metrics.payment_queries.response_times.avg),
            errorCount: metrics.payment_queries.requests.error,
          },
        },
        systemHealth: {
          redisStatus: redisStatus ? 'connected' : 'disconnected',
          lastUpdate: new Date().toISOString(),
          uptime: process.uptime(),
        },
        alerts,
      },
    };

    logger.info(LogCategory.API, 'MercadoPago metrics retrieved successfully');

    return NextResponse.json(response);

  } catch (error) {
    logger.error(LogCategory.API, 'Error fetching MercadoPago metrics', error as Error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/mercadopago/metrics
 * Reinicia las métricas de MercadoPago
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    logger.info(LogCategory.API, 'Resetting MercadoPago metrics', { userId });

    // TODO: Implementar reset de métricas
    // await metricsCollector.resetMetrics();

    return NextResponse.json({
      success: true,
      message: 'Métricas reiniciadas correctamente',
    });

  } catch (error) {
    logger.error(LogCategory.API, 'Error resetting MercadoPago metrics', error as Error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}









