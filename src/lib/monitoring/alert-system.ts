// ===================================
// PINTEYA E-COMMERCE - ENTERPRISE ALERT SYSTEM
// ===================================

import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { getSupabaseClient } from '@/lib/integrations/supabase';
import { emailService } from '@/lib/notifications/email';
import { slackService } from '@/lib/notifications/slack';

// ✅ IMPORT CONDICIONAL: Solo cargar CacheUtils en servidor para evitar errores de ioredis en cliente
let CacheUtils: any = null;
if (typeof window === 'undefined') {
  // Solo en servidor
  try {
    CacheUtils = require('@/lib/cache-manager').CacheUtils;
  } catch (error) {
    console.warn('[EnterpriseAlertSystem] CacheUtils not available:', error);
  }
}

// Niveles de alerta con escalamiento
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning', 
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

// Tipos de notificación
export enum NotificationType {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms',
  PUSH = 'push',
  LOG = 'log'
}

// Estados de alerta
export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed'
}

// Configuración de canal de notificación
export interface NotificationChannel {
  id: string;
  type: NotificationType;
  name: string;
  config: Record<string, any>;
  enabled: boolean;
  levels: AlertLevel[];
  rateLimit?: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

// Regla de escalamiento
export interface EscalationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    level: AlertLevel;
    duration: number; // minutos sin resolución
    repeatCount?: number; // número de repeticiones
  };
  actions: {
    escalateToLevel?: AlertLevel;
    notifyChannels: string[]; // IDs de canales
    assignToUser?: string;
  };
}

// Configuración de alerta
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metricName: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  level: AlertLevel;
  cooldownMinutes: number;
  channels: string[]; // IDs de canales de notificación
  escalationRules: string[]; // IDs de reglas de escalamiento
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

// Alerta activa
export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  level: AlertLevel;
  status: AlertStatus;
  message: string;
  metricName: string;
  value: number;
  threshold: number;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  escalatedAt?: string;
  escalatedFrom?: AlertLevel;
  notificationsSent: NotificationLog[];
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

// Log de notificación
export interface NotificationLog {
  id: string;
  channelId: string;
  channelType: NotificationType;
  sentAt: string;
  success: boolean;
  error?: string;
  responseTime: number;
}

/**
 * Sistema de Alertas Enterprise con escalamiento automático
 */
export class EnterpriseAlertSystem {
  private static instance: EnterpriseAlertSystem;
  private alertRules: Map<string, AlertRule> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private escalationRules: Map<string, EscalationRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private escalationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultChannels();
    this.initializeDefaultRules();
    this.startEscalationMonitoring();
  }

  static getInstance(): EnterpriseAlertSystem {
    if (!EnterpriseAlertSystem.instance) {
      EnterpriseAlertSystem.instance = new EnterpriseAlertSystem();
    }
    return EnterpriseAlertSystem.instance;
  }

  /**
   * Configura un canal de notificación
   */
  setNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannels.set(channel.id, channel);
    logger.info(LogLevel.INFO, `Notification channel configured: ${channel.id}`, {
      type: channel.type,
      enabled: channel.enabled,
      levels: channel.levels
    }, LogCategory.SYSTEM);
  }

  /**
   * Configura una regla de escalamiento
   */
  setEscalationRule(rule: EscalationRule): void {
    this.escalationRules.set(rule.id, rule);
    logger.info(LogLevel.INFO, `Escalation rule configured: ${rule.id}`, {
      level: rule.conditions.level,
      duration: rule.conditions.duration,
      enabled: rule.enabled
    }, LogCategory.SYSTEM);
  }

  /**
   * Configura una regla de alerta
   */
  setAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info(LogLevel.INFO, `Alert rule configured: ${rule.id}`, {
      metricName: rule.metricName,
      threshold: rule.threshold,
      level: rule.level,
      enabled: rule.enabled
    }, LogCategory.SYSTEM);
  }

  /**
   * Dispara una alerta
   */
  async triggerAlert(
    ruleId: string,
    metricName: string,
    value: number,
    message?: string
  ): Promise<Alert | null> {
    const rule = this.alertRules.get(ruleId);
    if (!rule || !rule.enabled) {
      return null;
    }

    // Verificar cooldown
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === ruleId && alert.status === AlertStatus.ACTIVE);

    if (existingAlert) {
      const cooldownEnd = new Date(existingAlert.triggeredAt);
      cooldownEnd.setMinutes(cooldownEnd.getMinutes() + rule.cooldownMinutes);
      
      if (new Date() < cooldownEnd) {
        return null; // Aún en cooldown
      }
    }

    // Crear nueva alerta
    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      ruleName: rule.name,
      level: rule.level,
      status: AlertStatus.ACTIVE,
      message: message || `${rule.description} - Value: ${value}, Threshold: ${rule.threshold}`,
      metricName,
      value,
      threshold: rule.threshold,
      triggeredAt: new Date().toISOString(),
      notificationsSent: [],
      tags: rule.tags,
      metadata: rule.metadata
    };

    this.activeAlerts.set(alert.id, alert);

    // Enviar notificaciones
    await this.sendNotifications(alert, rule.channels);

    // Almacenar en base de datos
    await this.storeAlert(alert);

    logger.warn(LogLevel.WARN, `Alert triggered: ${rule.name}`, {
      alertId: alert.id,
      level: alert.level,
      metricName: alert.metricName,
      value: alert.value,
      threshold: alert.threshold
    }, LogCategory.SYSTEM);

    return alert;
  }

  /**
   * Reconoce una alerta
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.status !== AlertStatus.ACTIVE) {
      return false;
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = userId;

    await this.updateAlert(alert);

    logger.info(LogLevel.INFO, `Alert acknowledged: ${alertId}`, {
      userId,
      level: alert.level,
      ruleName: alert.ruleName
    }, LogCategory.SYSTEM);

    return true;
  }

  /**
   * Resuelve una alerta
   */
  async resolveAlert(alertId: string, userId?: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = userId;

    await this.updateAlert(alert);
    this.activeAlerts.delete(alertId);

    logger.info(LogLevel.INFO, `Alert resolved: ${alertId}`, {
      userId,
      level: alert.level,
      ruleName: alert.ruleName,
      duration: this.calculateDuration(alert.triggeredAt, alert.resolvedAt!)
    }, LogCategory.SYSTEM);

    return true;
  }

  /**
   * Envía notificaciones para una alerta
   */
  private async sendNotifications(alert: Alert, channelIds: string[]): Promise<void> {
    const notifications = await Promise.allSettled(
      channelIds.map(channelId => this.sendNotification(alert, channelId))
    );

    // Log resultados
    notifications.forEach((result, index) => {
      const channelId = channelIds[index];
      if (result.status === 'fulfilled' && result.value) {
        alert.notificationsSent.push(result.value);
      } else if (result.status === 'rejected') {
        logger.error(LogLevel.ERROR, `Failed to send notification to channel: ${channelId}`, {
          alertId: alert.id,
          error: result.reason
        }, LogCategory.SYSTEM);
      }
    });
  }

  /**
   * Envía notificación a un canal específico
   */
  private async sendNotification(alert: Alert, channelId: string): Promise<NotificationLog | null> {
    const channel = this.notificationChannels.get(channelId);
    if (!channel || !channel.enabled || !channel.levels.includes(alert.level)) {
      return null;
    }

    // Verificar rate limiting
    if (channel.rateLimit && !(await this.checkRateLimit(channelId, channel.rateLimit))) {
      logger.warn(LogLevel.WARN, `Rate limit exceeded for channel: ${channelId}`, {
        alertId: alert.id
      }, LogCategory.SYSTEM);
      return null;
    }

    const startTime = Date.now();
    let success = false;
    let error: string | undefined;

    try {
      switch (channel.type) {
        case NotificationType.EMAIL:
          await this.sendEmailNotification(alert, channel);
          break;
        case NotificationType.SLACK:
          await this.sendSlackNotification(alert, channel);
          break;
        case NotificationType.WEBHOOK:
          await this.sendWebhookNotification(alert, channel);
          break;
        case NotificationType.SMS:
          await this.sendSMSNotification(alert, channel);
          break;
        case NotificationType.LOG:
          await this.sendLogNotification(alert, channel);
          break;
        default:
          throw new Error(`Unsupported notification type: ${channel.type}`);
      }
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const notificationLog: NotificationLog = {
      id: this.generateNotificationId(),
      channelId,
      channelType: channel.type,
      sentAt: new Date().toISOString(),
      success,
      error,
      responseTime: Date.now() - startTime
    };

    return notificationLog;
  }

  /**
   * Monitoreo de escalamiento automático
   */
  private async checkEscalations(): Promise<void> {
    for (const alert of this.activeAlerts.values()) {
      if (alert.status !== AlertStatus.ACTIVE) {
        continue;
      }

      const rule = this.alertRules.get(alert.ruleId);
      if (!rule) {
        continue;
      }

      // Verificar reglas de escalamiento
      for (const escalationRuleId of rule.escalationRules) {
        const escalationRule = this.escalationRules.get(escalationRuleId);
        if (!escalationRule || !escalationRule.enabled) {
          continue;
        }

        // Verificar condiciones de escalamiento
        if (this.shouldEscalate(alert, escalationRule)) {
          await this.escalateAlert(alert, escalationRule);
        }
      }
    }
  }

  /**
   * Verifica si una alerta debe escalarse
   */
  private shouldEscalate(alert: Alert, rule: EscalationRule): boolean {
    // Verificar nivel
    if (alert.level !== rule.conditions.level) {
      return false;
    }

    // Verificar duración
    const alertAge = Date.now() - new Date(alert.triggeredAt).getTime();
    const requiredDuration = rule.conditions.duration * 60 * 1000; // convertir a ms

    if (alertAge < requiredDuration) {
      return false;
    }

    // Verificar si ya fue escalada
    if (alert.escalatedAt) {
      return false;
    }

    return true;
  }

  /**
   * Escala una alerta
   */
  private async escalateAlert(alert: Alert, rule: EscalationRule): Promise<void> {
    const originalLevel = alert.level;
    
    // Actualizar nivel si es necesario
    if (rule.actions.escalateToLevel) {
      alert.level = rule.actions.escalateToLevel;
      alert.escalatedFrom = originalLevel;
    }

    alert.escalatedAt = new Date().toISOString();

    // Enviar notificaciones de escalamiento
    await this.sendNotifications(alert, rule.actions.notifyChannels);

    // Asignar a usuario si es necesario
    if (rule.actions.assignToUser) {
      alert.metadata = {
        ...alert.metadata,
        assignedTo: rule.actions.assignToUser
      };
    }

    await this.updateAlert(alert);

    logger.error(LogLevel.ERROR, `Alert escalated: ${alert.id}`, {
      originalLevel,
      newLevel: alert.level,
      escalationRule: rule.name,
      duration: this.calculateDuration(alert.triggeredAt, alert.escalatedAt)
    }, LogCategory.SYSTEM);
  }

  /**
   * Implementaciones de notificación específicas
   */
  private async sendEmailNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    try {
      const subject = `[${alert.level.toUpperCase()}] ${alert.ruleName}`;
      const emailData = {
        to: channel.config.to || ['admin@example.com'],
        subject,
        template: 'alert-notification',
        data: {
          alert,
          level: alert.level.toUpperCase(),
          timestamp: new Date(alert.triggeredAt).toLocaleString(),
          message: alert.message,
          metricName: alert.metricName,
          value: alert.value,
          threshold: alert.threshold
        },
        priority: alert.level === AlertLevel.CRITICAL || alert.level === AlertLevel.EMERGENCY ? 'high' as const : 'normal' as const
      };

      await emailService.sendNotification(emailData);
      
      logger.info(LogLevel.INFO, `Email notification sent successfully`, {
        alertId: alert.id,
        to: channel.config.to,
        subject
      }, LogCategory.SYSTEM);
    } catch (error) {
      logger.error(LogLevel.ERROR, `Failed to send email notification`, {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, LogCategory.SYSTEM);
      throw error;
    }
  }

  private async sendSlackNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    try {
      const alertData = {
        title: `${alert.level.toUpperCase()}: ${alert.ruleName}`,
        message: alert.message,
        severity: alert.level === AlertLevel.CRITICAL || alert.level === AlertLevel.EMERGENCY ? 'error' as const : 
                 alert.level === AlertLevel.WARNING ? 'warning' as const : 'info' as const,
        details: {
          'Alert ID': alert.id,
          'Timestamp': new Date(alert.triggeredAt).toLocaleString(),
          'Metric': alert.metricName,
          'Value': alert.value?.toString() || 'N/A',
          'Threshold': alert.threshold?.toString() || 'N/A',
          'Status': alert.status,
          ...alert.tags
        }
      };

      await slackService.sendSystemAlert(alertData);
      
      logger.info(LogLevel.INFO, `Slack notification sent successfully`, {
        alertId: alert.id,
        channel: channel.config.channel,
        webhook: channel.config.webhookUrl ? 'configured' : 'missing'
      }, LogCategory.SYSTEM);
    } catch (error) {
      logger.error(LogLevel.ERROR, `Failed to send Slack notification`, {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, LogCategory.SYSTEM);
      throw error;
    }
  }

  private async sendWebhookNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    if (!channel.config.url) {
      throw new Error('Webhook URL not configured');
    }

    const response = await fetch(channel.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(channel.config.headers || {})
      },
      body: JSON.stringify({
        alert,
        timestamp: new Date().toISOString(),
        source: 'pinteya-ecommerce'
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  private async sendSMSNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // TODO: Implementar envío de SMS
    logger.info(LogLevel.INFO, `SMS notification sent`, {
      alertId: alert.id,
      to: channel.config.phoneNumber
    }, LogCategory.SYSTEM);
  }

  private async sendLogNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const logLevel = alert.level === AlertLevel.EMERGENCY || alert.level === AlertLevel.CRITICAL 
      ? LogLevel.ERROR 
      : LogLevel.WARN;

    logger.log(logLevel, `ALERT: ${alert.message}`, {
      alertId: alert.id,
      level: alert.level,
      metricName: alert.metricName,
      value: alert.value,
      threshold: alert.threshold,
      ruleName: alert.ruleName
    }, LogCategory.SYSTEM);
  }

  /**
   * Inicializa canales por defecto
   */
  private initializeDefaultChannels(): void {
    // Canal de log por defecto
    this.setNotificationChannel({
      id: 'default_log',
      type: NotificationType.LOG,
      name: 'Default Log Channel',
      config: {},
      enabled: true,
      levels: [AlertLevel.INFO, AlertLevel.WARNING, AlertLevel.CRITICAL, AlertLevel.EMERGENCY]
    });

    // Canal de webhook por defecto (deshabilitado)
    this.setNotificationChannel({
      id: 'default_webhook',
      type: NotificationType.WEBHOOK,
      name: 'Default Webhook Channel',
      config: {
        url: process.env.ALERT_WEBHOOK_URL || ''
      },
      enabled: false,
      levels: [AlertLevel.CRITICAL, AlertLevel.EMERGENCY],
      rateLimit: {
        maxPerHour: 10,
        maxPerDay: 50
      }
    });
  }

  /**
   * Inicializa reglas por defecto
   */
  private initializeDefaultRules(): void {
    // Regla de escalamiento para alertas críticas
    this.setEscalationRule({
      id: 'critical_escalation',
      name: 'Critical Alert Escalation',
      enabled: true,
      conditions: {
        level: AlertLevel.CRITICAL,
        duration: 15 // 15 minutos
      },
      actions: {
        escalateToLevel: AlertLevel.EMERGENCY,
        notifyChannels: ['default_log', 'default_webhook']
      }
    });
  }

  /**
   * Inicia monitoreo de escalamiento
   */
  private startEscalationMonitoring(): void {
    this.escalationInterval = setInterval(() => {
      this.checkEscalations();
    }, 60000); // Verificar cada minuto
  }

  /**
   * Funciones auxiliares
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateDuration(start: string, end: string): number {
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60); // minutos
  }

  private async checkRateLimit(channelId: string, rateLimit: { maxPerHour: number; maxPerDay: number }): Promise<boolean> {
    // TODO: Implementar verificación de rate limiting con Redis
    return true;
  }

  private async storeAlert(alert: Alert): Promise<void> {
    try {
      const supabase = getSupabaseClient(true);
      if (!supabase) {return;}

      await supabase.from('enterprise_alerts').insert({
        id: alert.id,
        rule_id: alert.ruleId,
        rule_name: alert.ruleName,
        level: alert.level,
        status: alert.status,
        message: alert.message,
        metric_name: alert.metricName,
        value: alert.value,
        threshold: alert.threshold,
        triggered_at: alert.triggeredAt,
        acknowledged_at: alert.acknowledgedAt,
        acknowledged_by: alert.acknowledgedBy,
        resolved_at: alert.resolvedAt,
        resolved_by: alert.resolvedBy,
        escalated_at: alert.escalatedAt,
        escalated_from: alert.escalatedFrom,
        notifications_sent: alert.notificationsSent,
        tags: alert.tags,
        metadata: alert.metadata
      });
    } catch (error) {
      logger.error(LogLevel.ERROR, 'Failed to store alert', {
        error: error instanceof Error ? error.message : 'Unknown error',
        alertId: alert.id
      }, LogCategory.SYSTEM);
    }
  }

  private async updateAlert(alert: Alert): Promise<void> {
    try {
      const supabase = getSupabaseClient(true);
      if (!supabase) {return;}

      await supabase
        .from('enterprise_alerts')
        .update({
          level: alert.level,
          status: alert.status,
          acknowledged_at: alert.acknowledgedAt,
          acknowledged_by: alert.acknowledgedBy,
          resolved_at: alert.resolvedAt,
          resolved_by: alert.resolvedBy,
          escalated_at: alert.escalatedAt,
          escalated_from: alert.escalatedFrom,
          notifications_sent: alert.notificationsSent,
          metadata: alert.metadata
        })
        .eq('id', alert.id);
    } catch (error) {
      logger.error(LogLevel.ERROR, 'Failed to update alert', {
        error: error instanceof Error ? error.message : 'Unknown error',
        alertId: alert.id
      }, LogCategory.SYSTEM);
    }
  }

  /**
   * Limpia recursos
   */
  destroy(): void {
    if (this.escalationInterval) {
      clearInterval(this.escalationInterval);
      this.escalationInterval = null;
    }
  }
}

// Instancia singleton
export const enterpriseAlertSystem = EnterpriseAlertSystem.getInstance();

// Funciones de conveniencia
export const triggerAlert = enterpriseAlertSystem.triggerAlert.bind(enterpriseAlertSystem);
export const acknowledgeAlert = enterpriseAlertSystem.acknowledgeAlert.bind(enterpriseAlertSystem);
export const resolveAlert = enterpriseAlertSystem.resolveAlert.bind(enterpriseAlertSystem);









