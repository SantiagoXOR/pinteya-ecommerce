/**
 * Sistema Enterprise de Alertas y Notificaciones
 * Monitorea todos los sistemas y envía alertas automáticas
 */

import { enterpriseAuditSystem } from '@/lib/security/enterprise-audit-system';
import { metricsCollector } from '@/lib/rate-limiting/enterprise-rate-limiter';
import { enterpriseCacheSystem } from '@/lib/optimization/enterprise-cache-system';
import type { EnterpriseAuthContext } from '@/lib/auth/enterprise-auth-utils';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'suppressed';
export type AlertCategory = 'security' | 'performance' | 'availability' | 'capacity' | 'error';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  enabled: boolean;
  
  // Condiciones de activación
  conditions: AlertCondition[];
  
  // Configuración de notificación
  notificationChannels: NotificationChannel[];
  cooldownMinutes: number;
  
  // Configuración de escalamiento
  escalationRules?: EscalationRule[];
  
  // Metadatos
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'not_contains';
  threshold: number | string;
  timeWindow: number; // minutos
  evaluationInterval: number; // segundos
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'dashboard';
  config: NotificationConfig;
  enabled: boolean;
}

// Configuraciones específicas para cada tipo de notificación
export interface NotificationConfig {
  // Email config
  to?: string[];
  from?: string;
  subject?: string;
  
  // Slack config
  webhook?: string;
  channel?: string;
  username?: string;
  
  // Webhook config
  url?: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  
  // SMS config
  phoneNumbers?: string[];
  provider?: string;
  
  // Dashboard config
  displayDuration?: number;
  priority?: number;
}

export interface EscalationRule {
  afterMinutes: number;
  severity: AlertSeverity;
  additionalChannels: NotificationChannel[];
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  
  // Detalles del alert
  title: string;
  description: string;
  message: string;
  
  // Datos del trigger
  triggeredAt: string;
  triggeredBy: string;
  triggerValue: number | string;
  threshold: number | string;
  
  // Gestión del alert
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  
  // Metadatos
  metadata: AlertMetadata;
  tags: string[];
}

// Metadatos específicos para alertas
export interface AlertMetadata {
  // Información del contexto
  source?: string;
  environment?: 'development' | 'staging' | 'production';
  version?: string;
  
  // Información técnica
  errorCode?: string;
  stackTrace?: string;
  requestId?: string;
  userId?: string;
  
  // Métricas relacionadas
  threshold?: number;
  actualValue?: number;
  previousValue?: number;
  
  // Información de recuperación
  recoveryActions?: string[];
  relatedAlerts?: string[];
  
  // Información adicional
  customFields?: Record<string, string | number | boolean>;
}

export interface AlertMetrics {
  totalAlerts: number;
  activeAlerts: number;
  alertsByCategory: Record<AlertCategory, number>;
  alertsBySeverity: Record<AlertSeverity, number>;
  averageResolutionTime: number;
  falsePositiveRate: number;
}

// =====================================================
// REGLAS DE ALERTA PREDEFINIDAS
// =====================================================

export const ENTERPRISE_ALERT_RULES: AlertRule[] = [
  // Alertas de seguridad
  {
    id: 'security_high_blocked_requests',
    name: 'Alto número de requests bloqueados',
    description: 'Se detectó un número inusualmente alto de requests bloqueados por rate limiting',
    category: 'security',
    severity: 'high',
    enabled: true,
    conditions: [
      {
        metric: 'rate_limiting.blocked_requests_per_minute',
        operator: 'gt',
        threshold: 100,
        timeWindow: 5,
        evaluationInterval: 60
      }
    ],
    notificationChannels: [
      {
        type: 'email',
        config: { recipients: ['security@pinteya.com'] },
        enabled: true
      },
      {
        type: 'dashboard',
        config: {},
        enabled: true
      }
    ],
    cooldownMinutes: 15,
    escalationRules: [
      {
        afterMinutes: 30,
        severity: 'critical',
        additionalChannels: [
          {
            type: 'sms',
            config: { phone: '+5491123456789' },
            enabled: true
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },

  {
    id: 'security_critical_events',
    name: 'Eventos críticos de seguridad',
    description: 'Se detectaron eventos críticos en el sistema de auditoría',
    category: 'security',
    severity: 'critical',
    enabled: true,
    conditions: [
      {
        metric: 'audit.critical_events_per_hour',
        operator: 'gt',
        threshold: 5,
        timeWindow: 60,
        evaluationInterval: 300
      }
    ],
    notificationChannels: [
      {
        type: 'email',
        config: { recipients: ['security@pinteya.com', 'admin@pinteya.com'] },
        enabled: true
      },
      {
        type: 'sms',
        config: { phone: '+5491123456789' },
        enabled: true
      }
    ],
    cooldownMinutes: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },

  // Alertas de performance
  {
    id: 'performance_high_response_time',
    name: 'Tiempo de respuesta alto',
    description: 'El tiempo de respuesta P95 está por encima del umbral aceptable',
    category: 'performance',
    severity: 'medium',
    enabled: true,
    conditions: [
      {
        metric: 'api.response_time_p95',
        operator: 'gt',
        threshold: 1000, // 1 segundo
        timeWindow: 10,
        evaluationInterval: 120
      }
    ],
    notificationChannels: [
      {
        type: 'email',
        config: { recipients: ['devops@pinteya.com'] },
        enabled: true
      }
    ],
    cooldownMinutes: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },

  {
    id: 'performance_low_cache_hit_rate',
    name: 'Baja tasa de hit de cache',
    description: 'La tasa de hit del cache está por debajo del umbral óptimo',
    category: 'performance',
    severity: 'medium',
    enabled: true,
    conditions: [
      {
        metric: 'cache.hit_rate',
        operator: 'lt',
        threshold: 0.8, // 80%
        timeWindow: 15,
        evaluationInterval: 300
      }
    ],
    notificationChannels: [
      {
        type: 'email',
        config: { recipients: ['devops@pinteya.com'] },
        enabled: true
      }
    ],
    cooldownMinutes: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },

  // Alertas de capacidad
  {
    id: 'capacity_high_memory_usage',
    name: 'Alto uso de memoria',
    description: 'El uso de memoria del sistema está por encima del 85%',
    category: 'capacity',
    severity: 'high',
    enabled: true,
    conditions: [
      {
        metric: 'system.memory_usage_percent',
        operator: 'gt',
        threshold: 85,
        timeWindow: 5,
        evaluationInterval: 60
      }
    ],
    notificationChannels: [
      {
        type: 'email',
        config: { recipients: ['devops@pinteya.com'] },
        enabled: true
      }
    ],
    cooldownMinutes: 15,
    escalationRules: [
      {
        afterMinutes: 15,
        severity: 'critical',
        additionalChannels: [
          {
            type: 'sms',
            config: { phone: '+5491123456789' },
            enabled: true
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },

  // Alertas de errores
  {
    id: 'error_high_5xx_rate',
    name: 'Alta tasa de errores 5xx',
    description: 'La tasa de errores 5xx está por encima del umbral aceptable',
    category: 'error',
    severity: 'high',
    enabled: true,
    conditions: [
      {
        metric: 'api.error_rate_5xx',
        operator: 'gt',
        threshold: 0.05, // 5%
        timeWindow: 10,
        evaluationInterval: 120
      }
    ],
    notificationChannels: [
      {
        type: 'email',
        config: { recipients: ['devops@pinteya.com', 'backend@pinteya.com'] },
        enabled: true
      }
    ],
    cooldownMinutes: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  }
];

// =====================================================
// SISTEMA ENTERPRISE DE ALERTAS
// =====================================================

export class EnterpriseAlertSystem {
  private static instance: EnterpriseAlertSystem;
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private evaluationTimers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): EnterpriseAlertSystem {
    if (!EnterpriseAlertSystem.instance) {
      EnterpriseAlertSystem.instance = new EnterpriseAlertSystem();
    }
    return EnterpriseAlertSystem.instance;
  }

  /**
   * Inicializa el sistema de alertas
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {return;}

    try {
      // Cargar reglas predefinidas
      ENTERPRISE_ALERT_RULES.forEach(rule => {
        this.alertRules.set(rule.id, rule);
      });

      // Iniciar evaluación de reglas
      this.startRuleEvaluation();

      // Iniciar limpieza automática
      this.startCleanupScheduler();

      this.isInitialized = true;
      console.log('[ENTERPRISE_ALERTS] Sistema inicializado con', this.alertRules.size, 'reglas');
    } catch (error) {
      console.error('[ENTERPRISE_ALERTS] Error inicializando sistema:', error);
      throw error;
    }
  }

  /**
   * Evalúa todas las reglas de alerta activas
   */
  async evaluateRules(): Promise<void> {
    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled) {continue;}

      try {
        await this.evaluateRule(rule);
      } catch (error) {
        console.error(`[ENTERPRISE_ALERTS] Error evaluating rule ${ruleId}:`, error);
      }
    }
  }

  /**
   * Evalúa una regla específica
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    for (const condition of rule.conditions) {
      const metricValue = await this.getMetricValue(condition.metric);
      
      if (this.evaluateCondition(condition, metricValue)) {
        // Verificar si ya existe un alert activo para esta regla
        const existingAlert = Array.from(this.alerts.values())
          .find(alert => alert.ruleId === rule.id && alert.status === 'active');

        if (!existingAlert) {
          await this.triggerAlert(rule, condition, metricValue);
        }
      }
    }
  }

  /**
   * Evalúa una condición específica
   */
  private evaluateCondition(condition: AlertCondition, value: number | string): boolean {
    const { operator, threshold } = condition;

    switch (operator) {
      case 'gt':
        return Number(value) > Number(threshold);
      case 'lt':
        return Number(value) < Number(threshold);
      case 'gte':
        return Number(value) >= Number(threshold);
      case 'lte':
        return Number(value) <= Number(threshold);
      case 'eq':
        return value === threshold;
      case 'contains':
        return String(value).includes(String(threshold));
      case 'not_contains':
        return !String(value).includes(String(threshold));
      default:
        return false;
    }
  }

  /**
   * Obtiene el valor de una métrica
   */
  private async getMetricValue(metric: string): Promise<number | string> {
    try {
      const [system, metricName] = metric.split('.');

      switch (system) {
        case 'rate_limiting':
          const rateLimitMetrics = metricsCollector.getMetrics();
          switch (metricName) {
            case 'blocked_requests_per_minute':
              return rateLimitMetrics.blockedRequests || 0;
            case 'average_response_time':
              return rateLimitMetrics.averageResponseTime || 0;
            case 'error_rate':
              const total = rateLimitMetrics.totalRequests || 1;
              return (rateLimitMetrics.errors || 0) / total;
            default:
              return 0;
          }

        case 'cache':
          const cacheMetrics = enterpriseCacheSystem.getMetrics();
          const cacheKeys = Object.keys(cacheMetrics);
          
          switch (metricName) {
            case 'hit_rate':
              if (cacheKeys.length === 0) {return 0;}
              const totalHits = cacheKeys.reduce((sum, key) => sum + cacheMetrics[key].hits, 0);
              const totalMisses = cacheKeys.reduce((sum, key) => sum + cacheMetrics[key].misses, 0);
              const totalRequests = totalHits + totalMisses;
              return totalRequests > 0 ? totalHits / totalRequests : 0;
            case 'average_response_time':
              if (cacheKeys.length === 0) {return 0;}
              return cacheKeys.reduce((sum, key) => sum + cacheMetrics[key].avgResponseTime, 0) / cacheKeys.length;
            default:
              return 0;
          }

        case 'system':
          switch (metricName) {
            case 'memory_usage_percent':
              const memoryUsage = process.memoryUsage();
              return (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
            case 'cpu_usage_percent':
              // Simulado - en producción usar librerías como 'os-utils'
              return Math.random() * 40 + 30;
            default:
              return 0;
          }

        case 'api':
          // Métricas de API simuladas - en producción vendrían del sistema de métricas
          switch (metricName) {
            case 'response_time_p95':
              return Math.random() * 500 + 200;
            case 'error_rate_5xx':
              return Math.random() * 0.02;
            default:
              return 0;
          }

        case 'audit':
          switch (metricName) {
            case 'critical_events_per_hour':
              // Simulado - en producción vendría del sistema de auditoría
              return Math.floor(Math.random() * 3);
            default:
              return 0;
          }

        default:
          return 0;
      }
    } catch (error) {
      console.error(`[ENTERPRISE_ALERTS] Error getting metric ${metric}:`, error);
      return 0;
    }
  }

  /**
   * Dispara una nueva alerta
   */
  private async triggerAlert(
    rule: AlertRule, 
    condition: AlertCondition, 
    triggerValue: number | string
  ): Promise<void> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
      status: 'active',
      title: rule.name,
      description: rule.description,
      message: `${rule.name}: ${condition.metric} is ${triggerValue} (threshold: ${condition.threshold})`,
      triggeredAt: new Date().toISOString(),
      triggeredBy: 'system',
      triggerValue,
      threshold: condition.threshold,
      metadata: {
        metric: condition.metric,
        operator: condition.operator,
        timeWindow: condition.timeWindow,
        evaluationInterval: condition.evaluationInterval
      },
      tags: [rule.category, rule.severity, 'auto-generated']
    };

    // Guardar alerta
    this.alerts.set(alertId, alert);

    // Enviar notificaciones
    await this.sendNotifications(alert, rule.notificationChannels);

    // Registrar en auditoría
    await this.logAlertEvent(alert, 'TRIGGERED');

    // Programar escalamiento si está configurado
    if (rule.escalationRules && rule.escalationRules.length > 0) {
      this.scheduleEscalation(alert, rule.escalationRules);
    }

    console.log(`[ENTERPRISE_ALERTS] Alert triggered: ${alert.title}`);
  }

  /**
   * Envía notificaciones para una alerta
   */
  private async sendNotifications(alert: Alert, channels: NotificationChannel[]): Promise<void> {
    for (const channel of channels) {
      if (!channel.enabled) {continue;}

      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailNotification(alert, channel.config);
            break;
          case 'slack':
            await this.sendSlackNotification(alert, channel.config);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert, channel.config);
            break;
          case 'sms':
            await this.sendSMSNotification(alert, channel.config);
            break;
          case 'dashboard':
            // Las alertas del dashboard se muestran automáticamente
            break;
          default:
            console.warn(`[ENTERPRISE_ALERTS] Unknown notification channel: ${channel.type}`);
        }
      } catch (error) {
        console.error(`[ENTERPRISE_ALERTS] Error sending ${channel.type} notification:`, error);
      }
    }
  }

  /**
   * Envía notificación por email
   */
  private async sendEmailNotification(alert: Alert, config: NotificationConfig): Promise<void> {
    // Implementación de email - en producción usar servicios como SendGrid, SES, etc.
    console.log(`[ENTERPRISE_ALERTS] Email notification sent to ${config.to?.join(', ')}:`, alert.title);
  }

  /**
   * Envía notificación por Slack
   */
  private async sendSlackNotification(alert: Alert, config: NotificationConfig): Promise<void> {
    // Implementación de Slack webhook
    console.log(`[ENTERPRISE_ALERTS] Slack notification sent to ${config.channel}:`, alert.title);
  }

  /**
   * Envía notificación por webhook
   */
  private async sendWebhookNotification(alert: Alert, config: NotificationConfig): Promise<void> {
    // Implementación de webhook HTTP
    console.log(`[ENTERPRISE_ALERTS] Webhook notification sent to ${config.url}:`, alert.title);
  }

  /**
   * Envía notificación por SMS
   */
  private async sendSMSNotification(alert: Alert, config: NotificationConfig): Promise<void> {
    // Implementación de SMS - en producción usar servicios como Twilio, AWS SNS, etc.
    console.log(`[ENTERPRISE_ALERTS] SMS notification sent to ${config.phoneNumbers?.join(', ')}:`, alert.title);
  }

  /**
   * Programa escalamiento de alerta
   */
  private scheduleEscalation(alert: Alert, escalationRules: EscalationRule[]): void {
    escalationRules.forEach(rule => {
      setTimeout(async () => {
        const currentAlert = this.alerts.get(alert.id);
        if (currentAlert && currentAlert.status === 'active') {
          // Escalar severidad
          currentAlert.severity = rule.severity;
          
          // Enviar notificaciones adicionales
          await this.sendNotifications(currentAlert, rule.additionalChannels);
          
          // Registrar escalamiento
          await this.logAlertEvent(currentAlert, 'ESCALATED');
          
          console.log(`[ENTERPRISE_ALERTS] Alert escalated: ${alert.title} -> ${rule.severity}`);
        }
      }, rule.afterMinutes * 60 * 1000);
    });
  }

  /**
   * Registra eventos de alerta en auditoría
   */
  private async logAlertEvent(alert: Alert, action: string): Promise<void> {
    try {
      await enterpriseAuditSystem.logEnterpriseEvent({
        user_id: 'system',
        event_type: 'ALERT_EVENT' as 'ALERT_EVENT',
        event_category: 'monitoring',
        severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
        description: `Alert ${action}: ${alert.title}`,
        metadata: {
          alert_id: alert.id,
          rule_id: alert.ruleId,
          action,
          category: alert.category,
          severity: alert.severity,
          trigger_value: alert.triggerValue,
          threshold: alert.threshold
        },
        ip_address: '127.0.0.1',
        user_agent: 'EnterpriseAlertSystem/1.0'
      }, {
        userId: 'system',
        sessionId: 'alert_system',
        email: 'system@pinteya.com',
        role: 'system',
        permissions: ['system_access'],
        sessionValid: true,
        securityLevel: 'critical',
        ipAddress: '127.0.0.1',
        userAgent: 'EnterpriseAlertSystem/1.0',
        supabase: null,
        validations: {
          jwtValid: true,
          csrfValid: true,
          rateLimitPassed: true,
          originValid: true
        }
      });
    } catch (error) {
      console.error('[ENTERPRISE_ALERTS] Error logging alert event:', error);
    }
  }

  /**
   * Obtiene todas las alertas activas
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
  }

  /**
   * Obtiene métricas de alertas
   */
  getAlertMetrics(): AlertMetrics {
    const allAlerts = Array.from(this.alerts.values());
    const activeAlerts = allAlerts.filter(alert => alert.status === 'active');
    
    const alertsByCategory = allAlerts.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {} as Record<AlertCategory, number>);

    const alertsBySeverity = allAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    // Calcular tiempo promedio de resolución
    const resolvedAlerts = allAlerts.filter(alert => alert.resolvedAt);
    const averageResolutionTime = resolvedAlerts.length > 0 ?
      resolvedAlerts.reduce((sum, alert) => {
        const triggered = new Date(alert.triggeredAt).getTime();
        const resolved = new Date(alert.resolvedAt!).getTime();
        return sum + (resolved - triggered);
      }, 0) / resolvedAlerts.length / 1000 / 60 : 0; // en minutos

    return {
      totalAlerts: allAlerts.length,
      activeAlerts: activeAlerts.length,
      alertsByCategory,
      alertsBySeverity,
      averageResolutionTime,
      falsePositiveRate: 0.05 // Simulado
    };
  }

  /**
   * Reconoce una alerta
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = userId;

    await this.logAlertEvent(alert, 'ACKNOWLEDGED');
    return true;
  }

  /**
   * Resuelve una alerta
   */
  async resolveAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert || (alert.status !== 'active' && alert.status !== 'acknowledged')) {
      return false;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = userId;

    await this.logAlertEvent(alert, 'RESOLVED');
    return true;
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  private startRuleEvaluation(): void {
    // Evaluar reglas cada 60 segundos
    setInterval(() => {
      this.evaluateRules().catch(error => {
        console.error('[ENTERPRISE_ALERTS] Error in rule evaluation:', error);
      });
    }, 60 * 1000);
  }

  private startCleanupScheduler(): void {
    // Limpiar alertas resueltas antiguas cada hora
    setInterval(() => {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      for (const [alertId, alert] of this.alerts.entries()) {
        if (alert.status === 'resolved' && alert.resolvedAt) {
          const resolvedTime = new Date(alert.resolvedAt).getTime();
          if (resolvedTime < oneWeekAgo) {
            this.alerts.delete(alertId);
          }
        }
      }
    }, 60 * 60 * 1000); // 1 hora
  }
}

// =====================================================
// INSTANCIA SINGLETON
// =====================================================

export const enterpriseAlertSystem = EnterpriseAlertSystem.getInstance();

/**
 * Funciones de utilidad para alertas
 */
export const EnterpriseAlertUtils = {
  /**
   * Crea una alerta manual
   */
  async createManualAlert(
    title: string,
    description: string,
    severity: AlertSeverity,
    category: AlertCategory,
    userId: string
  ): Promise<string> {
    const alertId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alert: Alert = {
      id: alertId,
      ruleId: 'manual',
      ruleName: 'Manual Alert',
      category,
      severity,
      status: 'active',
      title,
      description,
      message: description,
      triggeredAt: new Date().toISOString(),
      triggeredBy: userId,
      triggerValue: 'manual',
      threshold: 'manual',
      metadata: {
        manual: true,
        created_by: userId
      },
      tags: ['manual', category, severity]
    };

    enterpriseAlertSystem['alerts'].set(alertId, alert);
    await enterpriseAlertSystem['logAlertEvent'](alert, 'CREATED');

    return alertId;
  },

  /**
   * Obtiene alertas por categoría
   */
  getAlertsByCategory(category: AlertCategory): Alert[] {
    return Array.from(enterpriseAlertSystem['alerts'].values())
      .filter(alert => alert.category === category);
  },

  /**
   * Obtiene alertas por severidad
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return Array.from(enterpriseAlertSystem['alerts'].values())
      .filter(alert => alert.severity === severity);
  }
};









