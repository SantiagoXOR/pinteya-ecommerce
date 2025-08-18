// ===================================
// PINTEYA E-COMMERCE - ENTERPRISE METRICS SYSTEM
// ===================================

import { logger, LogLevel, LogCategory } from '@/lib/logger';
import { getSupabaseClient } from '@/lib/supabase';
import { CacheUtils } from '@/lib/cache-manager';
import { enterpriseAlertSystem, AlertLevel as AlertSystemLevel } from './alert-system';

// Tipos de métricas enterprise
export enum MetricType {
  COUNTER = 'counter',           // Contador incremental
  GAUGE = 'gauge',              // Valor actual
  HISTOGRAM = 'histogram',       // Distribución de valores
  TIMER = 'timer',              // Medición de tiempo
  RATE = 'rate'                 // Tasa por unidad de tiempo
}

// Categorías de métricas de negocio
export enum BusinessMetricCategory {
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  BUSINESS = 'business',
  INFRASTRUCTURE = 'infrastructure',
  USER_EXPERIENCE = 'user_experience'
}

// Niveles de alerta
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

// Métrica enterprise
export interface EnterpriseMetric {
  id: string;
  name: string;
  type: MetricType;
  category: BusinessMetricCategory;
  value: number;
  timestamp: string;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
  aggregationPeriod?: string; // '1m', '5m', '1h', '1d'
}

// Configuración de alerta
export interface AlertRule {
  id: string;
  metricName: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  level: AlertLevel;
  enabled: boolean;
  cooldownMinutes: number;
  description: string;
  actions: AlertAction[];
}

// Acción de alerta
export interface AlertAction {
  type: 'email' | 'webhook' | 'log' | 'slack';
  config: Record<string, any>;
}

// Alerta activa
export interface ActiveAlert {
  id: string;
  ruleId: string;
  metricName: string;
  level: AlertLevel;
  message: string;
  value: number;
  threshold: number;
  triggeredAt: string;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

// Agregación temporal
export interface MetricAggregation {
  period: string;
  startTime: string;
  endTime: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Sistema de Métricas Enterprise con agregación temporal y alertas
 */
export class EnterpriseMetricsCollector {
  private static instance: EnterpriseMetricsCollector;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, ActiveAlert> = new Map();
  private metricsBuffer: EnterpriseMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultAlerts();
    this.startMetricsFlush();
  }

  static getInstance(): EnterpriseMetricsCollector {
    if (!EnterpriseMetricsCollector.instance) {
      EnterpriseMetricsCollector.instance = new EnterpriseMetricsCollector();
    }
    return EnterpriseMetricsCollector.instance;
  }

  /**
   * Registra una métrica enterprise
   */
  async recordMetric(
    name: string,
    value: number,
    type: MetricType = MetricType.GAUGE,
    category: BusinessMetricCategory = BusinessMetricCategory.PERFORMANCE,
    tags: Record<string, string> = {},
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const metric: EnterpriseMetric = {
        id: this.generateMetricId(),
        name,
        type,
        category,
        value,
        timestamp: new Date().toISOString(),
        tags,
        metadata
      };

      // Agregar a buffer para flush batch
      this.metricsBuffer.push(metric);

      // Verificar alertas
      await this.checkAlerts(metric);

      // Log para debugging
      logger.debug(LogLevel.DEBUG, `Metric recorded: ${name}`, {
        value,
        type,
        category,
        tags
      }, LogCategory.SYSTEM);

    } catch (error) {
      logger.error(LogLevel.ERROR, `Failed to record metric: ${name}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        value,
        type
      }, LogCategory.SYSTEM);
    }
  }

  /**
   * Métricas de performance específicas
   */
  async recordPerformanceMetric(
    operation: string,
    duration: number,
    success: boolean,
    tags: Record<string, string> = {}
  ): Promise<void> {
    await this.recordMetric(
      `performance.${operation}.duration`,
      duration,
      MetricType.TIMER,
      BusinessMetricCategory.PERFORMANCE,
      { ...tags, success: success.toString() }
    );

    await this.recordMetric(
      `performance.${operation}.count`,
      1,
      MetricType.COUNTER,
      BusinessMetricCategory.PERFORMANCE,
      { ...tags, success: success.toString() }
    );
  }

  /**
   * Métricas de negocio específicas
   */
  async recordBusinessMetric(
    event: string,
    value: number = 1,
    tags: Record<string, string> = {}
  ): Promise<void> {
    await this.recordMetric(
      `business.${event}`,
      value,
      MetricType.COUNTER,
      BusinessMetricCategory.BUSINESS,
      tags
    );
  }

  /**
   * Métricas de seguridad específicas
   */
  async recordSecurityMetric(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    tags: Record<string, string> = {}
  ): Promise<void> {
    await this.recordMetric(
      `security.${event}`,
      1,
      MetricType.COUNTER,
      BusinessMetricCategory.SECURITY,
      { ...tags, severity }
    );
  }

  /**
   * Métricas de experiencia de usuario
   */
  async recordUserExperienceMetric(
    metric: string,
    value: number,
    userId?: string,
    tags: Record<string, string> = {}
  ): Promise<void> {
    await this.recordMetric(
      `ux.${metric}`,
      value,
      MetricType.GAUGE,
      BusinessMetricCategory.USER_EXPERIENCE,
      { ...tags, userId: userId || 'anonymous' }
    );
  }

  /**
   * Configura una regla de alerta
   */
  setAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info(LogLevel.INFO, `Alert rule configured: ${rule.id}`, {
      metricName: rule.metricName,
      threshold: rule.threshold,
      level: rule.level
    }, LogCategory.SYSTEM);
  }

  /**
   * Verifica alertas para una métrica
   */
  private async checkAlerts(metric: EnterpriseMetric): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled || rule.metricName !== metric.name) {
        continue;
      }

      // Verificar si ya hay una alerta activa en cooldown
      const existingAlert = Array.from(this.activeAlerts.values())
        .find(alert => alert.ruleId === rule.id && !alert.resolvedAt);

      if (existingAlert) {
        const cooldownEnd = new Date(existingAlert.triggeredAt);
        cooldownEnd.setMinutes(cooldownEnd.getMinutes() + rule.cooldownMinutes);
        
        if (new Date() < cooldownEnd) {
          continue; // Aún en cooldown
        }
      }

      // Evaluar condición
      const triggered = this.evaluateCondition(metric.value, rule.condition, rule.threshold);

      if (triggered) {
        await this.triggerAlert(rule, metric);
      }
    }
  }

  /**
   * Evalúa condición de alerta
   */
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  /**
   * Dispara una alerta usando el sistema enterprise
   */
  private async triggerAlert(rule: AlertRule, metric: EnterpriseMetric): Promise<void> {
    // Convertir nivel de alerta al sistema enterprise
    const alertLevel = this.convertToAlertSystemLevel(rule.level);

    // Usar el sistema de alertas enterprise
    const alert = await enterpriseAlertSystem.triggerAlert(
      rule.id,
      rule.metricName,
      metric.value,
      `${rule.description} - Value: ${metric.value}, Threshold: ${rule.threshold}`
    );

    if (alert) {
      // Mantener referencia local para compatibilidad
      const localAlert: ActiveAlert = {
        id: alert.id,
        ruleId: alert.ruleId,
        metricName: alert.metricName,
        level: rule.level,
        message: alert.message,
        value: alert.value,
        threshold: alert.threshold,
        triggeredAt: alert.triggeredAt,
        metadata: {
          metric: metric,
          rule: rule
        }
      };

      this.activeAlerts.set(alert.id, localAlert);

      // Log alerta
      logger.warn(LogLevel.WARN, `Alert triggered via enterprise system: ${rule.id}`, {
        alertId: alert.id,
        level: alert.level,
        metricName: alert.metricName,
        value: alert.value,
        threshold: alert.threshold
      }, LogCategory.SYSTEM);
    }
  }

  /**
   * Ejecuta acción de alerta
   */
  private async executeAlertAction(action: AlertAction, alert: ActiveAlert): Promise<void> {
    try {
      switch (action.type) {
        case 'log':
          logger.error(LogLevel.ERROR, `ALERT: ${alert.message}`, {
            alertId: alert.id,
            level: alert.level
          }, LogCategory.SYSTEM);
          break;

        case 'webhook':
          if (action.config.url) {
            await fetch(action.config.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(alert)
            });
          }
          break;

        case 'email':
          // TODO: Implementar envío de email
          logger.info(LogLevel.INFO, `Email alert would be sent to: ${action.config.to}`, {
            alertId: alert.id
          }, LogCategory.SYSTEM);
          break;

        case 'slack':
          // TODO: Implementar notificación Slack
          logger.info(LogLevel.INFO, `Slack alert would be sent to: ${action.config.channel}`, {
            alertId: alert.id
          }, LogCategory.SYSTEM);
          break;
      }
    } catch (error) {
      logger.error(LogLevel.ERROR, `Failed to execute alert action: ${action.type}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        alertId: alert.id
      }, LogCategory.SYSTEM);
    }
  }

  /**
   * Obtiene métricas agregadas
   */
  async getAggregatedMetrics(
    metricName: string,
    period: '1m' | '5m' | '1h' | '1d' | '7d',
    startTime: string,
    endTime: string
  ): Promise<MetricAggregation[]> {
    const cacheKey = `metrics:aggregated:${metricName}:${period}:${startTime}:${endTime}`;
    
    return CacheUtils.cacheMetricsAggregation(cacheKey, async () => {
      const supabase = getSupabaseClient(true);
      
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Query con agregación SQL
      const { data, error } = await supabase.rpc('aggregate_metrics', {
        metric_name: metricName,
        period_interval: period,
        start_time: startTime,
        end_time: endTime
      });

      if (error) {
        throw new Error(`Failed to aggregate metrics: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Flush métricas a base de datos
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    try {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];

      const supabase = getSupabaseClient(true);
      if (!supabase) {
        logger.error(LogLevel.ERROR, 'Supabase client not available for metrics flush', {}, LogCategory.SYSTEM);
        return;
      }

      const { error } = await supabase
        .from('enterprise_metrics')
        .insert(metrics.map(metric => ({
          id: metric.id,
          name: metric.name,
          type: metric.type,
          category: metric.category,
          value: metric.value,
          timestamp: metric.timestamp,
          tags: metric.tags,
          metadata: metric.metadata
        })));

      if (error) {
        logger.error(LogLevel.ERROR, 'Failed to flush metrics to database', {
          error: error.message,
          metricsCount: metrics.length
        }, LogCategory.SYSTEM);
      } else {
        logger.debug(LogLevel.DEBUG, `Flushed ${metrics.length} metrics to database`, {}, LogCategory.SYSTEM);
      }

    } catch (error) {
      logger.error(LogLevel.ERROR, 'Error during metrics flush', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, LogCategory.SYSTEM);
    }
  }

  /**
   * Inicializa alertas por defecto
   */
  private initializeDefaultAlerts(): void {
    // Alerta de response time alto
    this.setAlertRule({
      id: 'high_response_time',
      metricName: 'performance.api.duration',
      condition: 'gt',
      threshold: 5000, // 5 segundos
      level: AlertLevel.WARNING,
      enabled: true,
      cooldownMinutes: 5,
      description: 'API response time is too high',
      actions: [{ type: 'log', config: {} }]
    });

    // Alerta de error rate alto
    this.setAlertRule({
      id: 'high_error_rate',
      metricName: 'performance.api.error_rate',
      condition: 'gt',
      threshold: 0.05, // 5%
      level: AlertLevel.CRITICAL,
      enabled: true,
      cooldownMinutes: 2,
      description: 'API error rate is too high',
      actions: [{ type: 'log', config: {} }]
    });

    // Alerta de violaciones de seguridad
    this.setAlertRule({
      id: 'security_violations',
      metricName: 'security.violation',
      condition: 'gte',
      threshold: 1,
      level: AlertLevel.EMERGENCY,
      enabled: true,
      cooldownMinutes: 1,
      description: 'Security violation detected',
      actions: [{ type: 'log', config: {} }]
    });
  }

  /**
   * Inicia flush automático de métricas
   */
  private startMetricsFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 30000); // Flush cada 30 segundos
  }

  /**
   * Almacena alerta en base de datos
   */
  private async storeAlert(alert: ActiveAlert): Promise<void> {
    try {
      const supabase = getSupabaseClient(true);
      if (!supabase) return;

      await supabase.from('enterprise_alerts').insert({
        id: alert.id,
        rule_id: alert.ruleId,
        metric_name: alert.metricName,
        level: alert.level,
        message: alert.message,
        value: alert.value,
        threshold: alert.threshold,
        triggered_at: alert.triggeredAt,
        resolved_at: alert.resolvedAt,
        metadata: alert.metadata
      });
    } catch (error) {
      logger.error(LogLevel.ERROR, 'Failed to store alert', {
        error: error instanceof Error ? error.message : 'Unknown error',
        alertId: alert.id
      }, LogCategory.SYSTEM);
    }
  }

  /**
   * Genera ID único para métrica
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convierte nivel de alerta al sistema enterprise
   */
  private convertToAlertSystemLevel(level: AlertLevel): AlertSystemLevel {
    switch (level) {
      case AlertLevel.INFO:
        return AlertSystemLevel.INFO;
      case AlertLevel.WARNING:
        return AlertSystemLevel.WARNING;
      case AlertLevel.CRITICAL:
        return AlertSystemLevel.CRITICAL;
      case AlertLevel.EMERGENCY:
        return AlertSystemLevel.EMERGENCY;
      default:
        return AlertSystemLevel.INFO;
    }
  }

  /**
   * Genera ID único para alerta
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpia recursos
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushMetrics(); // Flush final
  }
}

// Instancia singleton
export const enterpriseMetrics = EnterpriseMetricsCollector.getInstance();

// Funciones de conveniencia
export const recordPerformanceMetric = enterpriseMetrics.recordPerformanceMetric.bind(enterpriseMetrics);
export const recordBusinessMetric = enterpriseMetrics.recordBusinessMetric.bind(enterpriseMetrics);
export const recordSecurityMetric = enterpriseMetrics.recordSecurityMetric.bind(enterpriseMetrics);
export const recordUserExperienceMetric = enterpriseMetrics.recordUserExperienceMetric.bind(enterpriseMetrics);
