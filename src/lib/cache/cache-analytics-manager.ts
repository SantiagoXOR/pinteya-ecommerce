// ===================================
// PINTEYA E-COMMERCE - CACHE ANALYTICS MANAGER
// ===================================

import { logger, LogCategory } from '../enterprise/logger';
import { getRedisClient } from '../integrations/redis';
import { multiLayerCacheManager } from './multi-layer-cache-manager';
import { advancedCacheStrategyManager } from './advanced-cache-strategy-manager';

/**
 * Métricas de performance de cache
 */
export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  avgResponseTime: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  bytesServed: number;
  bytesStored: number;
  evictions: number;
  errors: number;
  timestamp: number;
}

/**
 * Métricas por estrategia
 */
export interface StrategyMetrics {
  strategy: string;
  hitRate: number;
  avgResponseTime: number;
  totalRequests: number;
  successRate: number;
  errorRate: number;
  lastUsed: number;
}

/**
 * Métricas por capa de cache
 */
export interface LayerMetrics {
  layer: string;
  hitRate: number;
  avgLatency: number;
  totalRequests: number;
  bytesStored: number;
  entriesCount: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
}

/**
 * Análisis de tendencias
 */
export interface TrendAnalysis {
  period: 'hour' | 'day' | 'week' | 'month';
  hitRateTrend: number; // Porcentaje de cambio
  responseTrend: number;
  volumeTrend: number;
  errorTrend: number;
  predictions: {
    nextHourHitRate: number;
    nextDayVolume: number;
    recommendedActions: string[];
  };
}

/**
 * Alertas de cache
 */
export interface CacheAlert {
  id: string;
  type: 'performance' | 'capacity' | 'error' | 'health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * Configuración de alertas
 */
export interface AlertConfig {
  hitRateThreshold: number;
  responseTimeThreshold: number;
  errorRateThreshold: number;
  capacityThreshold: number;
  healthCheckInterval: number;
  alertCooldown: number;
}

/**
 * Reporte de cache
 */
export interface CacheReport {
  period: { start: number; end: number };
  summary: {
    totalRequests: number;
    avgHitRate: number;
    avgResponseTime: number;
    totalErrors: number;
    dataTransferred: number;
  };
  strategies: StrategyMetrics[];
  layers: LayerMetrics[];
  trends: TrendAnalysis;
  alerts: CacheAlert[];
  recommendations: string[];
  topKeys: Array<{ key: string; hits: number; misses: number }>;
}

/**
 * Configuración por defecto de alertas
 */
export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  hitRateThreshold: 0.8,        // 80% hit rate mínimo
  responseTimeThreshold: 100,    // 100ms máximo
  errorRateThreshold: 0.05,     // 5% error rate máximo
  capacityThreshold: 0.85,      // 85% capacidad máxima
  healthCheckInterval: 60000,   // 1 minuto
  alertCooldown: 300000         // 5 minutos
};

/**
 * Manager de analytics de cache
 */
export class CacheAnalyticsManager {
  private static instance: CacheAnalyticsManager;
  private redis = getRedisClient();
  private metrics: Map<string, CachePerformanceMetrics[]> = new Map();
  private alerts: Map<string, CacheAlert> = new Map();
  private alertConfig: AlertConfig = DEFAULT_ALERT_CONFIG;
  private lastAlertTime: Map<string, number> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor() {
    this.initializeHealthChecks();
  }

  static getInstance(): CacheAnalyticsManager {
    if (!CacheAnalyticsManager.instance) {
      CacheAnalyticsManager.instance = new CacheAnalyticsManager();
    }
    return CacheAnalyticsManager.instance;
  }

  /**
   * Registra métricas de performance
   */
  async recordMetrics(
    key: string,
    hitRate: number,
    responseTime: number,
    bytesServed: number = 0,
    error: boolean = false
  ): Promise<void> {
    const timestamp = Date.now();
    const keyMetrics = this.metrics.get(key) || [];
    
    // Obtener métricas anteriores para calcular totales
    const lastMetric = keyMetrics[keyMetrics.length - 1];
    const totalRequests = (lastMetric?.totalRequests || 0) + 1;
    const totalHits = (lastMetric?.totalHits || 0) + (hitRate > 0 ? 1 : 0);
    const totalMisses = (lastMetric?.totalMisses || 0) + (hitRate === 0 ? 1 : 0);
    const errors = (lastMetric?.errors || 0) + (error ? 1 : 0);

    const metric: CachePerformanceMetrics = {
      hitRate,
      missRate: 1 - hitRate,
      avgResponseTime: responseTime,
      totalRequests,
      totalHits,
      totalMisses,
      bytesServed: (lastMetric?.bytesServed || 0) + bytesServed,
      bytesStored: lastMetric?.bytesStored || 0,
      evictions: lastMetric?.evictions || 0,
      errors,
      timestamp
    };

    keyMetrics.push(metric);
    
    // Mantener solo las últimas 1000 métricas por key
    if (keyMetrics.length > 1000) {
      keyMetrics.splice(0, keyMetrics.length - 1000);
    }
    
    this.metrics.set(key, keyMetrics);

    // Persistir en Redis para análisis histórico
    await this.persistMetrics(key, metric);

    // Verificar alertas
    await this.checkAlerts(key, metric);
  }

  /**
   * Obtiene métricas actuales
   */
  getCurrentMetrics(): Record<string, CachePerformanceMetrics> {
    const current: Record<string, CachePerformanceMetrics> = {};
    
    this.metrics.forEach((metrics, key) => {
      if (metrics.length > 0) {
        current[key] = metrics[metrics.length - 1];
      }
    });
    
    return current;
  }

  /**
   * Obtiene métricas históricas
   */
  getHistoricalMetrics(
    key: string,
    startTime: number,
    endTime: number
  ): CachePerformanceMetrics[] {
    const keyMetrics = this.metrics.get(key) || [];
    return keyMetrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Obtiene métricas por estrategia
   */
  getStrategyMetrics(): StrategyMetrics[] {
    const strategyMetrics = advancedCacheStrategyManager.getAllMetrics();
    
    return Object.entries(strategyMetrics).map(([strategy, metrics]) => ({
      strategy,
      hitRate: metrics.hitRate,
      avgResponseTime: metrics.avgResponseTime,
      totalRequests: metrics.totalRequests,
      successRate: metrics.hits / metrics.totalRequests,
      errorRate: (metrics.totalRequests - metrics.hits) / metrics.totalRequests,
      lastUsed: metrics.lastUpdated
    }));
  }

  /**
   * Obtiene métricas por capa
   */
  getLayerMetrics(): LayerMetrics[] {
    const layerMetrics = multiLayerCacheManager.getLayerMetrics();
    const layerHealth = multiLayerCacheManager.getLayerHealth();
    
    return Object.entries(layerMetrics).map(([layer, metrics]) => {
      const health = layerHealth[layer as keyof typeof layerHealth];
      
      return {
        layer,
        hitRate: metrics.hitRate,
        avgLatency: metrics.avgLatency,
        totalRequests: metrics.totalRequests,
        bytesStored: metrics.bytesStored,
        entriesCount: metrics.entriesCount,
        healthStatus: health?.healthy ? 'healthy' : 'unhealthy',
        lastCheck: health?.lastCheck || 0
      };
    });
  }

  /**
   * Analiza tendencias
   */
  async analyzeTrends(period: 'hour' | 'day' | 'week' | 'month'): Promise<TrendAnalysis> {
    const now = Date.now();
    const periodMs = this.getPeriodMs(period);
    const startTime = now - periodMs;
    
    // Obtener métricas del período
    const allMetrics: CachePerformanceMetrics[] = [];
    this.metrics.forEach(metrics => {
      const periodMetrics = metrics.filter(
        m => m.timestamp >= startTime && m.timestamp <= now
      );
      allMetrics.push(...periodMetrics);
    });

    if (allMetrics.length === 0) {
      return this.getEmptyTrendAnalysis(period);
    }

    // Calcular tendencias
    const midPoint = startTime + (periodMs / 2);
    const firstHalf = allMetrics.filter(m => m.timestamp <= midPoint);
    const secondHalf = allMetrics.filter(m => m.timestamp > midPoint);

    const firstHalfAvg = this.calculateAverageMetrics(firstHalf);
    const secondHalfAvg = this.calculateAverageMetrics(secondHalf);

    const hitRateTrend = this.calculateTrend(firstHalfAvg.hitRate, secondHalfAvg.hitRate);
    const responseTrend = this.calculateTrend(firstHalfAvg.avgResponseTime, secondHalfAvg.avgResponseTime);
    const volumeTrend = this.calculateTrend(firstHalf.length, secondHalf.length);
    const errorTrend = this.calculateTrend(firstHalfAvg.errors, secondHalfAvg.errors);

    // Generar predicciones
    const predictions = await this.generatePredictions(allMetrics);

    return {
      period,
      hitRateTrend,
      responseTrend,
      volumeTrend,
      errorTrend,
      predictions
    };
  }

  /**
   * Genera reporte comprehensivo
   */
  async generateReport(
    startTime: number,
    endTime: number
  ): Promise<CacheReport> {
    const period = { start: startTime, end: endTime };
    
    // Recopilar todas las métricas del período
    const allMetrics: CachePerformanceMetrics[] = [];
    this.metrics.forEach(metrics => {
      const periodMetrics = metrics.filter(
        m => m.timestamp >= startTime && m.timestamp <= endTime
      );
      allMetrics.push(...periodMetrics);
    });

    // Calcular resumen
    const summary = this.calculateSummary(allMetrics);
    
    // Obtener métricas por estrategia y capa
    const strategies = this.getStrategyMetrics();
    const layers = this.getLayerMetrics();
    
    // Analizar tendencias
    const trends = await this.analyzeTrends('day');
    
    // Obtener alertas del período
    const alerts = Array.from(this.alerts.values()).filter(
      alert => alert.timestamp >= startTime && alert.timestamp <= endTime
    );
    
    // Generar recomendaciones
    const recommendations = this.generateRecommendations(summary, strategies, layers, trends);
    
    // Obtener top keys
    const topKeys = this.getTopKeys(10);

    return {
      period,
      summary,
      strategies,
      layers,
      trends,
      alerts,
      recommendations,
      topKeys
    };
  }

  /**
   * Configura alertas
   */
  configureAlerts(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    logger.info(LogCategory.CACHE, 'Configuración de alertas actualizada');
  }

  /**
   * Obtiene alertas activas
   */
  getActiveAlerts(): CacheAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Resuelve una alerta
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      logger.info(LogCategory.CACHE, `Alerta resuelta: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Limpia métricas antiguas
   */
  async cleanupOldMetrics(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoff = Date.now() - maxAge;
    
    this.metrics.forEach((metrics, key) => {
      const filtered = metrics.filter(metric => metric.timestamp > cutoff);
      if (filtered.length !== metrics.length) {
        this.metrics.set(key, filtered);
      }
    });

    // Limpiar alertas resueltas antiguas
    const oldAlerts = Array.from(this.alerts.entries()).filter(
      ([_, alert]) => alert.resolved && (alert.resolvedAt || 0) < cutoff
    );
    
    oldAlerts.forEach(([id, _]) => {
      this.alerts.delete(id);
    });

    logger.info(LogCategory.CACHE, `Limpieza completada: ${oldAlerts.length} alertas antiguas eliminadas`);
  }

  // ===================================
  // MÉTODOS PRIVADOS
  // ===================================

  /**
   * Inicializa health checks
   */
  private initializeHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.alertConfig.healthCheckInterval);
  }

  /**
   * Realiza health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Verificar estado de las capas
      const layerHealth = multiLayerCacheManager.getLayerHealth();
      
      Object.entries(layerHealth).forEach(([layer, health]) => {
        if (!health.healthy) {
          this.createAlert(
            'health',
            'high',
            `Capa de cache no saludable: ${layer}`,
            { layer, errors: health.errors }
          );
        }
      });

      // Verificar métricas generales
      const currentMetrics = this.getCurrentMetrics();
      Object.entries(currentMetrics).forEach(([key, metrics]) => {
        this.checkMetricThresholds(key, metrics);
      });

    } catch (error) {
      logger.error(LogCategory.CACHE, 'Error en health check', error as Error);
    }
  }

  /**
   * Verifica umbrales de métricas
   */
  private checkMetricThresholds(key: string, metrics: CachePerformanceMetrics): void {
    // Verificar hit rate
    if (metrics.hitRate < this.alertConfig.hitRateThreshold) {
      this.createAlert(
        'performance',
        'medium',
        `Hit rate bajo para ${key}: ${(metrics.hitRate * 100).toFixed(1)}%`,
        { key, hitRate: metrics.hitRate, threshold: this.alertConfig.hitRateThreshold }
      );
    }

    // Verificar response time
    if (metrics.avgResponseTime > this.alertConfig.responseTimeThreshold) {
      this.createAlert(
        'performance',
        'medium',
        `Tiempo de respuesta alto para ${key}: ${metrics.avgResponseTime}ms`,
        { key, responseTime: metrics.avgResponseTime, threshold: this.alertConfig.responseTimeThreshold }
      );
    }

    // Verificar error rate
    const errorRate = metrics.errors / metrics.totalRequests;
    if (errorRate > this.alertConfig.errorRateThreshold) {
      this.createAlert(
        'error',
        'high',
        `Tasa de errores alta para ${key}: ${(errorRate * 100).toFixed(1)}%`,
        { key, errorRate, threshold: this.alertConfig.errorRateThreshold }
      );
    }
  }

  /**
   * Persiste métricas en Redis
   */
  private async persistMetrics(key: string, metric: CachePerformanceMetrics): Promise<void> {
    try {
      const redisKey = `cache_metrics:${key}:${Date.now()}`;
      await this.redis.setex(redisKey, 86400 * 7, JSON.stringify(metric)); // 7 días
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Error persistiendo métricas', error as Error);
    }
  }

  /**
   * Verifica alertas
   */
  private async checkAlerts(key: string, metric: CachePerformanceMetrics): Promise<void> {
    this.checkMetricThresholds(key, metric);
  }

  /**
   * Crea una alerta
   */
  private createAlert(
    type: CacheAlert['type'],
    severity: CacheAlert['severity'],
    message: string,
    details: any
  ): void {
    const alertKey = `${type}_${severity}_${message}`;
    const lastAlert = this.lastAlertTime.get(alertKey);
    const now = Date.now();

    // Verificar cooldown
    if (lastAlert && (now - lastAlert) < this.alertConfig.alertCooldown) {
      return;
    }

    const alert: CacheAlert = {
      id: `alert_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      details,
      timestamp: now,
      resolved: false
    };

    this.alerts.set(alert.id, alert);
    this.lastAlertTime.set(alertKey, now);

    logger.warn(LogCategory.CACHE, `Alerta de cache: ${message}`, details);
  }

  /**
   * Obtiene duración del período en ms
   */
  private getPeriodMs(period: 'hour' | 'day' | 'week' | 'month'): number {
    switch (period) {
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Calcula métricas promedio
   */
  private calculateAverageMetrics(metrics: CachePerformanceMetrics[]): CachePerformanceMetrics {
    if (metrics.length === 0) {
      return {
        hitRate: 0, missRate: 0, avgResponseTime: 0, totalRequests: 0,
        totalHits: 0, totalMisses: 0, bytesServed: 0, bytesStored: 0,
        evictions: 0, errors: 0, timestamp: Date.now()
      };
    }

    const sum = metrics.reduce((acc, metric) => ({
      hitRate: acc.hitRate + metric.hitRate,
      missRate: acc.missRate + metric.missRate,
      avgResponseTime: acc.avgResponseTime + metric.avgResponseTime,
      totalRequests: acc.totalRequests + metric.totalRequests,
      totalHits: acc.totalHits + metric.totalHits,
      totalMisses: acc.totalMisses + metric.totalMisses,
      bytesServed: acc.bytesServed + metric.bytesServed,
      bytesStored: acc.bytesStored + metric.bytesStored,
      evictions: acc.evictions + metric.evictions,
      errors: acc.errors + metric.errors,
      timestamp: Math.max(acc.timestamp, metric.timestamp)
    }));

    const count = metrics.length;
    return {
      hitRate: sum.hitRate / count,
      missRate: sum.missRate / count,
      avgResponseTime: sum.avgResponseTime / count,
      totalRequests: sum.totalRequests,
      totalHits: sum.totalHits,
      totalMisses: sum.totalMisses,
      bytesServed: sum.bytesServed,
      bytesStored: sum.bytesStored,
      evictions: sum.evictions,
      errors: sum.errors,
      timestamp: sum.timestamp
    };
  }

  /**
   * Calcula tendencia porcentual
   */
  private calculateTrend(oldValue: number, newValue: number): number {
    if (oldValue === 0) {return newValue > 0 ? 100 : 0;}
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Genera predicciones
   */
  private async generatePredictions(metrics: CachePerformanceMetrics[]): Promise<TrendAnalysis['predictions']> {
    // Implementación simplificada de predicciones
    const recent = metrics.slice(-10);
    const avgHitRate = recent.reduce((sum, m) => sum + m.hitRate, 0) / recent.length;
    const avgVolume = recent.reduce((sum, m) => sum + m.totalRequests, 0) / recent.length;

    return {
      nextHourHitRate: Math.min(1, avgHitRate * 1.02), // Predicción optimista
      nextDayVolume: avgVolume * 24,
      recommendedActions: this.generatePredictionActions(avgHitRate, avgVolume)
    };
  }

  /**
   * Genera acciones recomendadas basadas en predicciones
   */
  private generatePredictionActions(hitRate: number, volume: number): string[] {
    const actions: string[] = [];

    if (hitRate < 0.8) {
      actions.push('Considerar aumentar TTL de cache');
      actions.push('Revisar estrategias de invalidación');
    }

    if (volume > 1000) {
      actions.push('Considerar escalado horizontal');
      actions.push('Optimizar queries más frecuentes');
    }

    return actions;
  }

  /**
   * Obtiene análisis de tendencias vacío
   */
  private getEmptyTrendAnalysis(period: 'hour' | 'day' | 'week' | 'month'): TrendAnalysis {
    return {
      period,
      hitRateTrend: 0,
      responseTrend: 0,
      volumeTrend: 0,
      errorTrend: 0,
      predictions: {
        nextHourHitRate: 0,
        nextDayVolume: 0,
        recommendedActions: []
      }
    };
  }

  /**
   * Calcula resumen de métricas
   */
  private calculateSummary(metrics: CachePerformanceMetrics[]): CacheReport['summary'] {
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        avgHitRate: 0,
        avgResponseTime: 0,
        totalErrors: 0,
        dataTransferred: 0
      };
    }

    const latest = metrics[metrics.length - 1];
    const avgMetrics = this.calculateAverageMetrics(metrics);

    return {
      totalRequests: latest.totalRequests,
      avgHitRate: avgMetrics.hitRate,
      avgResponseTime: avgMetrics.avgResponseTime,
      totalErrors: latest.errors,
      dataTransferred: latest.bytesServed
    };
  }

  /**
   * Genera recomendaciones
   */
  private generateRecommendations(
    summary: CacheReport['summary'],
    strategies: StrategyMetrics[],
    layers: LayerMetrics[],
    trends: TrendAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en hit rate
    if (summary.avgHitRate < 0.8) {
      recommendations.push('Hit rate bajo: considerar ajustar TTL o estrategias de cache');
    }

    // Recomendaciones basadas en response time
    if (summary.avgResponseTime > 100) {
      recommendations.push('Tiempo de respuesta alto: optimizar queries o aumentar capacidad');
    }

    // Recomendaciones basadas en tendencias
    if (trends.hitRateTrend < -10) {
      recommendations.push('Hit rate en declive: revisar patrones de invalidación');
    }

    if (trends.volumeTrend > 50) {
      recommendations.push('Volumen creciente: considerar escalado de infraestructura');
    }

    // Recomendaciones basadas en capas
    const unhealthyLayers = layers.filter(l => l.healthStatus !== 'healthy');
    if (unhealthyLayers.length > 0) {
      recommendations.push(`Capas no saludables: ${unhealthyLayers.map(l => l.layer).join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Obtiene top keys por actividad
   */
  private getTopKeys(limit: number): Array<{ key: string; hits: number; misses: number }> {
    const keyStats: Array<{ key: string; hits: number; misses: number }> = [];

    this.metrics.forEach((metrics, key) => {
      if (metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        keyStats.push({
          key,
          hits: latest.totalHits,
          misses: latest.totalMisses
        });
      }
    });

    return keyStats
      .sort((a, b) => (b.hits + b.misses) - (a.hits + a.misses))
      .slice(0, limit);
  }

  /**
   * Destructor
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Instancia singleton
export const cacheAnalyticsManager = CacheAnalyticsManager.getInstance();

/**
 * Utilidades para analytics de cache
 */
export const CacheAnalyticsUtils = {
  /**
   * Registra hit de cache
   */
  async recordHit(key: string, responseTime: number, bytesServed: number = 0): Promise<void> {
    await cacheAnalyticsManager.recordMetrics(key, 1, responseTime, bytesServed, false);
  },

  /**
   * Registra miss de cache
   */
  async recordMiss(key: string, responseTime: number): Promise<void> {
    await cacheAnalyticsManager.recordMetrics(key, 0, responseTime, 0, false);
  },

  /**
   * Registra error de cache
   */
  async recordError(key: string, responseTime: number): Promise<void> {
    await cacheAnalyticsManager.recordMetrics(key, 0, responseTime, 0, true);
  },

  /**
   * Obtiene resumen rápido
   */
  getQuickSummary(): {
    totalKeys: number;
    avgHitRate: number;
    activeAlerts: number;
    healthyLayers: number;
  } {
    const currentMetrics = cacheAnalyticsManager.getCurrentMetrics();
    const alerts = cacheAnalyticsManager.getActiveAlerts();
    const layers = cacheAnalyticsManager.getLayerMetrics();

    const totalKeys = Object.keys(currentMetrics).length;
    const avgHitRate = Object.values(currentMetrics).reduce((sum, m) => sum + m.hitRate, 0) / totalKeys || 0;
    const activeAlerts = alerts.length;
    const healthyLayers = layers.filter(l => l.healthStatus === 'healthy').length;

    return { totalKeys, avgHitRate, activeAlerts, healthyLayers };
  }
};









