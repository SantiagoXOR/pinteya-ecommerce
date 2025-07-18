// ===================================
// PINTEYA E-COMMERCE - METRICS SYSTEM
// ===================================

import { redisCache } from './redis';
import { logger, LogLevel, LogCategory } from './logger';

// Tipos de métricas
export interface MetricData {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

export interface AggregatedMetric {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

export interface ApiMetrics {
  requests: {
    total: number;
    success: number;
    error: number;
    rate_limited: number;
  };
  response_times: AggregatedMetric;
  error_rates: {
    '4xx': number;
    '5xx': number;
    network: number;
    timeout: number;
  };
  retry_stats: {
    total_retries: number;
    successful_retries: number;
    failed_retries: number;
    avg_attempts: number;
  };
}

export interface MercadoPagoMetrics {
  payment_creation: ApiMetrics;
  payment_queries: ApiMetrics;
  webhook_processing: ApiMetrics;
  overall_health: {
    uptime_percentage: number;
    avg_response_time: number;
    error_rate: number;
    last_incident: string | null;
  };
}

// Configuración de métricas
const METRICS_CONFIG = {
  RETENTION_HOURS: 24,
  AGGREGATION_WINDOW_MINUTES: 5,
  ALERT_THRESHOLDS: {
    ERROR_RATE: 0.05, // 5%
    RESPONSE_TIME_P95: 5000, // 5 segundos
    RATE_LIMIT_RATE: 0.1, // 10%
  },
};

/**
 * Clase principal para manejo de métricas
 */
export class MetricsCollector {
  private static instance: MetricsCollector;

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Registra una métrica de request
   */
  async recordRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    labels: Record<string, string> = {}
  ): Promise<void> {
    const timestamp = Date.now();
    const baseKey = `metrics:${endpoint}:${method}`;

    try {
      // Registrar request total
      await this.incrementCounter(`${baseKey}:requests:total`, timestamp);

      // Registrar por tipo de respuesta
      if (statusCode >= 200 && statusCode < 300) {
        await this.incrementCounter(`${baseKey}:requests:success`, timestamp);
      } else if (statusCode === 429) {
        await this.incrementCounter(`${baseKey}:requests:rate_limited`, timestamp);
      } else {
        await this.incrementCounter(`${baseKey}:requests:error`, timestamp);
        
        // Categorizar errores
        if (statusCode >= 400 && statusCode < 500) {
          await this.incrementCounter(`${baseKey}:errors:4xx`, timestamp);
        } else if (statusCode >= 500) {
          await this.incrementCounter(`${baseKey}:errors:5xx`, timestamp);
        }
      }

      // Registrar tiempo de respuesta
      await this.recordValue(`${baseKey}:response_time`, responseTime, timestamp);

      // Log para debugging
      logger.info(LogCategory.API, 'Metric recorded');

    } catch (error) {
      logger.error(LogCategory.API, 'Failed to record metric', error as Error);
    }
  }

  /**
   * Registra métricas de retry
   */
  async recordRetry(
    operation: string,
    attempts: number,
    success: boolean,
    totalDuration: number
  ): Promise<void> {
    const timestamp = Date.now();
    const baseKey = `metrics:retry:${operation}`;

    try {
      await this.incrementCounter(`${baseKey}:total`, timestamp);
      await this.recordValue(`${baseKey}:attempts`, attempts, timestamp);
      await this.recordValue(`${baseKey}:duration`, totalDuration, timestamp);

      if (success) {
        await this.incrementCounter(`${baseKey}:success`, timestamp);
      } else {
        await this.incrementCounter(`${baseKey}:failed`, timestamp);
      }

    } catch (error) {
      logger.error(LogCategory.API, 'Failed to record retry metric', error as Error);
    }
  }

  /**
   * Registra métricas de rate limiting
   */
  async recordRateLimit(
    endpoint: string,
    blocked: boolean,
    remaining: number,
    limit: number
  ): Promise<void> {
    const timestamp = Date.now();
    const baseKey = `metrics:rate_limit:${endpoint}`;

    try {
      await this.incrementCounter(`${baseKey}:checks`, timestamp);
      
      if (blocked) {
        await this.incrementCounter(`${baseKey}:blocked`, timestamp);
      }

      await this.recordValue(`${baseKey}:remaining`, remaining, timestamp);
      await this.recordValue(`${baseKey}:utilization`, (limit - remaining) / limit, timestamp);

    } catch (error) {
      logger.error(LogCategory.API, 'Failed to record rate limit metric', error as Error);
    }
  }

  /**
   * Incrementa un contador
   */
  private async incrementCounter(key: string, timestamp: number): Promise<void> {
    const windowKey = this.getWindowKey(key, timestamp);
    await redisCache.incr(windowKey);
    await redisCache.expire(windowKey, METRICS_CONFIG.RETENTION_HOURS * 3600);
  }

  /**
   * Registra un valor numérico
   */
  private async recordValue(key: string, value: number, timestamp: number): Promise<void> {
    const windowKey = this.getWindowKey(key, timestamp);
    const listKey = `${windowKey}:values`;
    
    // Agregar valor a la lista (usando Redis como cola circular)
    const client = redisCache['client'];
    await client.lpush(listKey, value.toString());
    await client.ltrim(listKey, 0, 999); // Mantener últimos 1000 valores
    await client.expire(listKey, METRICS_CONFIG.RETENTION_HOURS * 3600);
  }

  /**
   * Genera clave de ventana temporal
   */
  private getWindowKey(baseKey: string, timestamp: number): string {
    const windowStart = Math.floor(timestamp / (METRICS_CONFIG.AGGREGATION_WINDOW_MINUTES * 60 * 1000));
    return `${baseKey}:${windowStart}`;
  }

  /**
   * Obtiene métricas agregadas para un endpoint
   */
  async getApiMetrics(endpoint: string, method: string, hoursBack: number = 1): Promise<ApiMetrics> {
    const baseKey = `metrics:${endpoint}:${method}`;
    const now = Date.now();
    const startTime = now - (hoursBack * 60 * 60 * 1000);

    try {
      // Obtener contadores
      const requests = await this.getCounterSum(baseKey, 'requests', startTime, now);
      const errors = await this.getCounterSum(baseKey, 'errors', startTime, now);
      
      // Obtener tiempos de respuesta
      const responseTimes = await this.getValueStats(`${baseKey}:response_time`, startTime, now);
      
      // Obtener métricas de retry
      const retryStats = await this.getRetryStats(endpoint, startTime, now);

      return {
        requests: {
          total: requests.total || 0,
          success: requests.success || 0,
          error: requests.error || 0,
          rate_limited: requests.rate_limited || 0,
        },
        response_times: responseTimes,
        error_rates: {
          '4xx': errors['4xx'] || 0,
          '5xx': errors['5xx'] || 0,
          network: errors.network || 0,
          timeout: errors.timeout || 0,
        },
        retry_stats: retryStats,
      };

    } catch (error) {
      logger.error(LogCategory.API, 'Failed to get API metrics', error as Error);
      
      // Retornar métricas vacías en caso de error
      return this.getEmptyApiMetrics();
    }
  }

  /**
   * Obtiene suma de contadores en un rango de tiempo
   */
  private async getCounterSum(
    baseKey: string, 
    category: string, 
    startTime: number, 
    endTime: number
  ): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    const windowSize = METRICS_CONFIG.AGGREGATION_WINDOW_MINUTES * 60 * 1000;
    
    for (let time = startTime; time <= endTime; time += windowSize) {
      const windowStart = Math.floor(time / windowSize);
      
      // Obtener diferentes tipos de contadores
      const types = ['total', 'success', 'error', 'rate_limited', '4xx', '5xx', 'network', 'timeout'];
      
      for (const type of types) {
        const key = `${baseKey}:${category}:${type}:${windowStart}`;
        const value = await redisCache.get(key);
        result[type] = (result[type] || 0) + (parseInt(value || '0'));
      }
    }
    
    return result;
  }

  /**
   * Obtiene estadísticas de valores numéricos
   */
  private async getValueStats(
    baseKey: string, 
    startTime: number, 
    endTime: number
  ): Promise<AggregatedMetric> {
    const values: number[] = [];
    const windowSize = METRICS_CONFIG.AGGREGATION_WINDOW_MINUTES * 60 * 1000;
    
    for (let time = startTime; time <= endTime; time += windowSize) {
      const windowStart = Math.floor(time / windowSize);
      const key = `${baseKey}:${windowStart}:values`;
      
      try {
        const client = redisCache['client'];
        const windowValues = await client.lrange(key, 0, -1);
        values.push(...windowValues.map(v => parseFloat(v)).filter(v => !isNaN(v)));
      } catch (error) {
        // Continuar si no se puede obtener valores de una ventana
      }
    }

    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p95: values[Math.floor(values.length * 0.95)] || 0,
      p99: values[Math.floor(values.length * 0.99)] || 0,
    };
  }

  /**
   * Obtiene estadísticas de retry
   */
  private async getRetryStats(
    operation: string, 
    startTime: number, 
    endTime: number
  ): Promise<ApiMetrics['retry_stats']> {
    const baseKey = `metrics:retry:${operation}`;
    const counters = await this.getCounterSum(baseKey, '', startTime, endTime);
    const attempts = await this.getValueStats(`${baseKey}:attempts`, startTime, endTime);

    return {
      total_retries: counters.total || 0,
      successful_retries: counters.success || 0,
      failed_retries: counters.failed || 0,
      avg_attempts: attempts.avg || 0,
    };
  }

  /**
   * Obtiene métricas específicas de MercadoPago
   */
  async getMercadoPagoMetrics(hoursBack: number = 1): Promise<MercadoPagoMetrics> {
    try {
      const [paymentCreation, paymentQueries, webhookProcessing] = await Promise.all([
        this.getApiMetrics('/api/payments/create-preference', 'POST', hoursBack),
        this.getApiMetrics('/api/payments/query', 'GET', hoursBack),
        this.getApiMetrics('/api/webhooks/mercadopago', 'POST', hoursBack),
      ]);

      // Calcular métricas generales de salud
      const totalRequests = paymentCreation.requests.total +
                           paymentQueries.requests.total +
                           webhookProcessing.requests.total;

      const totalErrors = paymentCreation.requests.error +
                         paymentQueries.requests.error +
                         webhookProcessing.requests.error;

      const overallErrorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

      const avgResponseTime = totalRequests > 0 ?
        (paymentCreation.response_times.avg * paymentCreation.requests.total +
         paymentQueries.response_times.avg * paymentQueries.requests.total +
         webhookProcessing.response_times.avg * webhookProcessing.requests.total) / totalRequests : 0;

      return {
        payment_creation: paymentCreation,
        payment_queries: paymentQueries,
        webhook_processing: webhookProcessing,
        overall_health: {
          uptime_percentage: overallErrorRate < 0.05 ? 99.9 : 95.0, // Simplificado
          avg_response_time: avgResponseTime,
          error_rate: overallErrorRate,
          last_incident: overallErrorRate > 0.1 ? new Date().toISOString() : null,
        },
      };
    } catch (error) {
      console.error('Error getting MercadoPago metrics:', error);
      // Retornar métricas vacías en caso de error
      const emptyMetrics = this.getEmptyApiMetrics();
      return {
        payment_creation: emptyMetrics,
        payment_queries: emptyMetrics,
        webhook_processing: emptyMetrics,
        overall_health: {
          uptime_percentage: 0,
          avg_response_time: 0,
          error_rate: 1,
          last_incident: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Retorna métricas vacías por defecto
   */
  private getEmptyApiMetrics(): ApiMetrics {
    return {
      requests: { total: 0, success: 0, error: 0, rate_limited: 0 },
      response_times: { count: 0, sum: 0, avg: 0, min: 0, max: 0, p95: 0, p99: 0 },
      error_rates: { '4xx': 0, '5xx': 0, network: 0, timeout: 0 },
      retry_stats: { total_retries: 0, successful_retries: 0, failed_retries: 0, avg_attempts: 0 },
    };
  }
}

// Instancia singleton
export const metricsCollector = MetricsCollector.getInstance();
