// ===================================
// PERFORMANCE MONITORING MIDDLEWARE
// Middleware para Next.js que captura métricas de rendimiento
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { productionMonitor } from '../config/production-monitoring';

// Tipos para métricas de API
interface APIMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  contentLength?: number;
  userAgent?: string;
  ip?: string;
  timestamp: number;
}

// Cache para almacenar métricas temporalmente
const metricsCache = new Map<string, APIMetrics>();
const CACHE_TTL = 60000; // 1 minuto

// Limpiar cache periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, metric] of metricsCache.entries()) {
    if (now - metric.timestamp > CACHE_TTL) {
      metricsCache.delete(key);
    }
  }
}, CACHE_TTL);

export function performanceMonitoringMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const { method, url, headers } = request;
  const pathname = new URL(url).pathname;
  
  // Skip monitoring for static assets and internal routes
  if (shouldSkipMonitoring(pathname)) {
    return NextResponse.next();
  }
  
  // Crear response con headers de monitoring
  const response = NextResponse.next();
  
  // Agregar headers de performance
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  response.headers.set('X-Timestamp', new Date().toISOString());
  
  // Capturar métricas después de la respuesta
  const responseTime = Date.now() - startTime;
  const statusCode = response.status;
  
  const metrics: APIMetrics = {
    method,
    path: pathname,
    statusCode,
    responseTime,
    contentLength: parseInt(response.headers.get('content-length') || '0'),
    userAgent: headers.get('user-agent') || undefined,
    ip: getClientIP(request),
    timestamp: Date.now(),
  };
  
  // Enviar métricas al sistema de monitoring
  trackAPIMetrics(metrics);
  
  // Detectar problemas de rendimiento
  detectPerformanceIssues(metrics);
  
  return response;
}

// Función para determinar si se debe omitir el monitoring
function shouldSkipMonitoring(pathname: string): boolean {
  const skipPatterns = [
    /^\/_next\//,           // Next.js internals
    /^\/__nextjs_/,        // Next.js dev server
    /\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/i, // Static assets
    /^\/api\/health$/,     // Health check endpoint
    /^\/favicon/,          // Favicon requests
    /^\/robots\.txt$/,     // Robots.txt
    /^\/sitemap/,          // Sitemap files
  ];
  
  return skipPatterns.some(pattern => pattern.test(pathname));
}

// Función para obtener la IP del cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || cfConnectingIP || 'unknown';
}

// Función para trackear métricas de API
function trackAPIMetrics(metrics: APIMetrics) {
  try {
    // Enviar al sistema de monitoring de producción
    productionMonitor.trackPerformance({
      name: 'api_response_time',
      value: metrics.responseTime,
      category: 'api',
      metadata: {
        method: metrics.method,
        path: metrics.path,
        statusCode: metrics.statusCode,
        contentLength: metrics.contentLength,
        userAgent: metrics.userAgent,
        ip: metrics.ip,
      },
    });
    
    // Trackear errores HTTP
    if (metrics.statusCode >= 400) {
      productionMonitor.trackError(
        new Error(`HTTP ${metrics.statusCode} on ${metrics.method} ${metrics.path}`),
        {
          type: 'http_error',
          statusCode: metrics.statusCode,
          method: metrics.method,
          path: metrics.path,
          responseTime: metrics.responseTime,
          ip: metrics.ip,
        }
      );
    }
    
    // Almacenar en cache para análisis
    const cacheKey = `${metrics.method}:${metrics.path}:${metrics.timestamp}`;
    metricsCache.set(cacheKey, metrics);
    
  } catch (error) {
    console.error('Error tracking API metrics:', error);
  }
}

// Función para detectar problemas de rendimiento
function detectPerformanceIssues(metrics: APIMetrics) {
  const { responseTime, statusCode, path, method } = metrics;
  
  // Detectar respuestas lentas
  if (responseTime > 5000) { // 5 segundos
    productionMonitor.trackError(
      new Error(`Slow API response: ${responseTime}ms`),
      {
        type: 'performance_issue',
        severity: 'high',
        responseTime,
        path,
        method,
        threshold: 5000,
      }
    );
  } else if (responseTime > 2000) { // 2 segundos
    productionMonitor.trackPerformance({
      name: 'slow_api_warning',
      value: responseTime,
      category: 'performance_warning',
      metadata: { path, method, threshold: 2000 },
    });
  }
  
  // Detectar errores frecuentes en el mismo endpoint
  if (statusCode >= 500) {
    const recentErrors = Array.from(metricsCache.values())
      .filter(m => 
        m.path === path && 
        m.method === method && 
        m.statusCode >= 500 &&
        Date.now() - m.timestamp < 300000 // Últimos 5 minutos
      );
    
    if (recentErrors.length >= 5) {
      productionMonitor.trackError(
        new Error(`High error rate detected on ${method} ${path}`),
        {
          type: 'high_error_rate',
          severity: 'critical',
          errorCount: recentErrors.length,
          timeWindow: '5min',
          path,
          method,
        }
      );
    }
  }
}

// ===================================
// ANALYTICS Y REPORTING
// ===================================

export class APIAnalytics {
  // Obtener métricas agregadas
  static getAggregatedMetrics(timeWindow: number = 3600000): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowestEndpoints: Array<{ path: string; avgTime: number }>;
    errorsByStatus: Record<number, number>;
  } {
    const now = Date.now();
    const recentMetrics = Array.from(metricsCache.values())
      .filter(m => now - m.timestamp < timeWindow);
    
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowestEndpoints: [],
        errorsByStatus: {},
      };
    }
    
    const totalRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errors = recentMetrics.filter(m => m.statusCode >= 400);
    const errorRate = errors.length / totalRequests;
    
    // Agrupar por endpoint para encontrar los más lentos
    const endpointTimes = new Map<string, number[]>();
    recentMetrics.forEach(m => {
      const key = `${m.method} ${m.path}`;
      if (!endpointTimes.has(key)) {
        endpointTimes.set(key, []);
      }
      endpointTimes.get(key)!.push(m.responseTime);
    });
    
    const slowestEndpoints = Array.from(endpointTimes.entries())
      .map(([path, times]) => ({
        path,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);
    
    // Contar errores por código de estado
    const errorsByStatus: Record<number, number> = {};
    errors.forEach(m => {
      errorsByStatus[m.statusCode] = (errorsByStatus[m.statusCode] || 0) + 1;
    });
    
    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      slowestEndpoints,
      errorsByStatus,
    };
  }
  
  // Generar reporte de rendimiento
  static generatePerformanceReport(): string {
    const metrics = this.getAggregatedMetrics();
    
    return `
=== API Performance Report ===
Total Requests: ${metrics.totalRequests}
Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms
Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%

Slowest Endpoints:
${metrics.slowestEndpoints.map(e => `  ${e.path}: ${e.avgTime.toFixed(2)}ms`).join('\n')}

Errors by Status Code:
${Object.entries(metrics.errorsByStatus).map(([code, count]) => `  ${code}: ${count}`).join('\n')}

Generated at: ${new Date().toISOString()}
    `.trim();
  }
  
  // Limpiar métricas antiguas
  static clearOldMetrics(maxAge: number = 3600000) {
    const now = Date.now();
    for (const [key, metric] of metricsCache.entries()) {
      if (now - metric.timestamp > maxAge) {
        metricsCache.delete(key);
      }
    }
  }
}

// Exportar el middleware como default
export default performanceMonitoringMiddleware;