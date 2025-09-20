// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - METRICS API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector, MercadoPagoMetrics } from '@/lib/enterprise/metrics';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { auth } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Verificar autenticación (solo usuarios autenticados pueden ver métricas)
    const user = session?.user;
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Rate limiting para API de métricas
    const rateLimitResult = await checkRateLimit(request, RATE_LIMIT_CONFIGS.QUERY_API);
    if (!rateLimitResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
      }, { status: 429 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const hoursBack = parseInt(searchParams.get('hours') || '1');
    const endpoint = searchParams.get('endpoint');

    logger.info(LogCategory.API, 'Metrics API request', {
      userId: user.id,
      hoursBack,
      endpoint,
      clientIP,
    });

    // Si se especifica un endpoint, retornar métricas específicas
    if (endpoint) {
      const metrics = await metricsCollector.getApiMetrics(endpoint, 'POST', hoursBack);
      
      return NextResponse.json({
        success: true,
        data: {
          endpoint,
          timeRange: `${hoursBack}h`,
          metrics,
          timestamp: Date.now(),
        },
      });
    }

    // Obtener métricas completas de MercadoPago
    const [paymentCreation, paymentQueries, webhookProcessing] = await Promise.all([
      metricsCollector.getApiMetrics('create-preference', 'POST', hoursBack),
      metricsCollector.getApiMetrics('payment-info', 'GET', hoursBack),
      metricsCollector.getApiMetrics('webhook', 'POST', hoursBack),
    ]);

    // Calcular métricas generales de salud
    const totalRequests = paymentCreation.requests.total + paymentQueries.requests.total + webhookProcessing.requests.total;
    const totalErrors = paymentCreation.requests.error + paymentQueries.requests.error + webhookProcessing.requests.error;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    const avgResponseTime = totalRequests > 0 ? 
      (paymentCreation.response_times.avg * paymentCreation.requests.total +
       paymentQueries.response_times.avg * paymentQueries.requests.total +
       webhookProcessing.response_times.avg * webhookProcessing.requests.total) / totalRequests : 0;

    const uptimePercentage = Math.max(0, 100 - (errorRate * 100));

    const mercadoPagoMetrics: MercadoPagoMetrics = {
      payment_creation: paymentCreation,
      payment_queries: paymentQueries,
      webhook_processing: webhookProcessing,
      overall_health: {
        uptime_percentage: uptimePercentage,
        avg_response_time: avgResponseTime,
        error_rate: errorRate,
        last_incident: null, // TODO: Implementar detección de incidentes
      },
    };

    const processingTime = Date.now() - startTime;

    logger.performance(LogLevel.INFO, 'Metrics API response generated', {
      operation: 'metrics-api',
      duration: processingTime,
      statusCode: 200,
    }, {
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        timeRange: `${hoursBack}h`,
        metrics: mercadoPagoMetrics,
        timestamp: Date.now(),
        processingTime,
      },
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    logger.performance(LogLevel.ERROR, 'Metrics API error', {
      operation: 'metrics-api',
      duration: processingTime,
      statusCode: 500,
    }, {
      clientIP,
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}

// Endpoint para obtener alertas activas
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Verificar autenticación
    const user = session?.user;
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, RATE_LIMIT_CONFIGS.QUERY_API);
    if (!rateLimitResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
      }, { status: 429 });
    }

    const body = await request.json();
    const { action, alertType, threshold } = body;

    if (action === 'check_alerts') {
      // Obtener métricas recientes para verificar alertas
      const recentMetrics = await Promise.all([
        metricsCollector.getApiMetrics('create-preference', 'POST', 0.25), // Últimos 15 minutos
        metricsCollector.getApiMetrics('payment-info', 'GET', 0.25),
        metricsCollector.getApiMetrics('webhook', 'POST', 0.25),
      ]);

      const alerts = [];

      // Verificar alertas de tasa de error
      for (const [index, metrics] of recentMetrics.entries()) {
        const endpoints = ['create-preference', 'payment-info', 'webhook'];
        const endpoint = endpoints[index];
        
        if (metrics.requests.total > 0) {
          const errorRate = metrics.requests.error / metrics.requests.total;
          
          if (errorRate > 0.05) { // 5% de tasa de error
            alerts.push({
              type: 'error_rate',
              severity: errorRate > 0.1 ? 'critical' : 'warning',
              endpoint,
              value: errorRate,
              threshold: 0.05,
              message: `High error rate detected on ${endpoint}: ${(errorRate * 100).toFixed(2)}%`,
              timestamp: Date.now(),
            });
          }

          // Verificar tiempo de respuesta P95
          if (metrics.response_times.p95 > 5000) { // 5 segundos
            alerts.push({
              type: 'response_time',
              severity: metrics.response_times.p95 > 10000 ? 'critical' : 'warning',
              endpoint,
              value: metrics.response_times.p95,
              threshold: 5000,
              message: `High response time detected on ${endpoint}: ${metrics.response_times.p95}ms (P95)`,
              timestamp: Date.now(),
            });
          }

          // Verificar rate limiting
          const rateLimitRate = metrics.requests.rate_limited / metrics.requests.total;
          if (rateLimitRate > 0.1) { // 10% de requests limitados
            alerts.push({
              type: 'rate_limit',
              severity: rateLimitRate > 0.2 ? 'critical' : 'warning',
              endpoint,
              value: rateLimitRate,
              threshold: 0.1,
              message: `High rate limiting detected on ${endpoint}: ${(rateLimitRate * 100).toFixed(2)}%`,
              timestamp: Date.now(),
            });
          }
        }
      }

      logger.info(LogCategory.API, 'Alerts checked', {
        userId: user.id,
        alertsFound: alerts.length,
        clientIP,
      });

      return NextResponse.json({
        success: true,
        data: {
          alerts,
          timestamp: Date.now(),
          checkDuration: Date.now() - startTime,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    logger.performance(LogLevel.ERROR, 'Metrics alerts API error', {
      operation: 'metrics-alerts-api',
      duration: processingTime,
      statusCode: 500,
    }, {
      clientIP,
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}










