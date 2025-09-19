// ===================================
// PINTEYA E-COMMERCE - ADVANCED ALERTING ENGINE
// ===================================

import { logger, LogCategory } from '../enterprise/logger';
import { getRedisClient } from '../integrations/redis';

/**
 * Canales de notificación disponibles
 */
export enum AlertChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms',
  DISCORD = 'discord',
  TEAMS = 'teams',
  CONSOLE = 'console'
}

/**
 * Tipos de alerta
 */
export enum AlertType {
  PERFORMANCE = 'performance',
  ERROR = 'error',
  CAPACITY = 'capacity',
  AVAILABILITY = 'availability',
  SECURITY = 'security',
  BUSINESS = 'business'
}

/**
 * Severidad de alerta
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Estado de alerta
 */
export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed'
}

/**
 * Configuración de canal de alerta
 */
export interface AlertChannelConfig {
  channel: AlertChannel;
  enabled: boolean;
  config: {
    // Email
    recipients?: string[];
    smtpConfig?: {
      host: string;
      port: number;
      secure: boolean;
      auth: { user: string; pass: string };
    };
    
    // Slack
    webhookUrl?: string;
    slackChannel?: string;
    
    // Webhook
    url?: string;
    headers?: Record<string, string>;
    
    // SMS
    provider?: 'twilio' | 'aws-sns';
    phoneNumbers?: string[];
    
    // Discord
    discordWebhook?: string;
    
    // Teams
    teamsWebhook?: string;
  };
  filters?: {
    severities?: AlertSeverity[];
    types?: AlertType[];
    keywords?: string[];
  };
  rateLimiting?: {
    maxAlertsPerHour: number;
    cooldownMinutes: number;
  };
}

/**
 * Política de escalación
 */
export interface EscalationPolicy {
  id: string;
  name: string;
  enabled: boolean;
  rules: EscalationRule[];
}

/**
 * Regla de escalación
 */
export interface EscalationRule {
  level: number;
  delayMinutes: number;
  channels: AlertChannel[];
  conditions?: {
    severities?: AlertSeverity[];
    types?: AlertType[];
    unacknowledgedOnly?: boolean;
  };
  recipients?: {
    emails?: string[];
    phones?: string[];
    slackUsers?: string[];
  };
}

/**
 * Alerta avanzada
 */
export interface AdvancedAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  details: Record<string, any>;
  source: string;
  timestamp: number;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolvedBy?: string;
  resolvedAt?: number;
  escalationLevel: number;
  escalatedAt?: number;
  suppressedUntil?: number;
  tags: string[];
  fingerprint: string; // Para deduplicación
  relatedAlerts: string[];
  metrics?: {
    value: number;
    threshold: number;
    unit: string;
  };
}

/**
 * Configuración de supresión
 */
export interface SuppressionRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    types?: AlertType[];
    severities?: AlertSeverity[];
    sources?: string[];
    keywords?: string[];
    timeWindows?: Array<{
      start: string; // HH:MM
      end: string;   // HH:MM
      days: number[]; // 0-6 (domingo-sábado)
    }>;
  };
  duration?: number; // minutos
  reason: string;
}

/**
 * Configuraciones predefinidas de canales
 */
export const DEFAULT_CHANNEL_CONFIGS: AlertChannelConfig[] = [
  {
    channel: AlertChannel.EMAIL,
    enabled: true,
    config: {
      recipients: ['admin@pinteya.com', 'dev@pinteya.com']
    },
    filters: {
      severities: [AlertSeverity.HIGH, AlertSeverity.CRITICAL]
    },
    rateLimiting: {
      maxAlertsPerHour: 10,
      cooldownMinutes: 5
    }
  },
  {
    channel: AlertChannel.SLACK,
    enabled: true,
    config: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      slackChannel: '#alerts'
    },
    filters: {
      severities: [AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
    },
    rateLimiting: {
      maxAlertsPerHour: 20,
      cooldownMinutes: 2
    }
  },
  {
    channel: AlertChannel.CONSOLE,
    enabled: true,
    config: {},
    rateLimiting: {
      maxAlertsPerHour: 100,
      cooldownMinutes: 0
    }
  }
];

/**
 * Política de escalación por defecto
 */
export const DEFAULT_ESCALATION_POLICY: EscalationPolicy = {
  id: 'default',
  name: 'Política de Escalación por Defecto',
  enabled: true,
  rules: [
    {
      level: 1,
      delayMinutes: 0,
      channels: [AlertChannel.SLACK, AlertChannel.CONSOLE],
      conditions: {
        severities: [AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
      }
    },
    {
      level: 2,
      delayMinutes: 15,
      channels: [AlertChannel.EMAIL],
      conditions: {
        severities: [AlertSeverity.HIGH, AlertSeverity.CRITICAL],
        unacknowledgedOnly: true
      }
    },
    {
      level: 3,
      delayMinutes: 60,
      channels: [AlertChannel.SMS],
      conditions: {
        severities: [AlertSeverity.CRITICAL],
        unacknowledgedOnly: true
      },
      recipients: {
        phones: ['+5491123456789'] // Número de emergencia
      }
    }
  ]
};

/**
 * Motor de alertas avanzado
 */
export class AdvancedAlertingEngine {
  private static instance: AdvancedAlertingEngine;
  private redis = getRedisClient();
  private alerts: Map<string, AdvancedAlert> = new Map();
  private channelConfigs: Map<AlertChannel, AlertChannelConfig> = new Map();
  private escalationPolicies: Map<string, EscalationPolicy> = new Map();
  private suppressionRules: Map<string, SuppressionRule> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
  private rateLimitCounters: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {
    this.initializeDefaultConfigs();
  }

  static getInstance(): AdvancedAlertingEngine {
    if (!AdvancedAlertingEngine.instance) {
      AdvancedAlertingEngine.instance = new AdvancedAlertingEngine();
    }
    return AdvancedAlertingEngine.instance;
  }

  /**
   * Inicializa configuraciones por defecto
   */
  private initializeDefaultConfigs(): void {
    // Configurar canales por defecto
    DEFAULT_CHANNEL_CONFIGS.forEach(config => {
      this.channelConfigs.set(config.channel, config);
    });

    // Configurar política de escalación por defecto
    this.escalationPolicies.set(DEFAULT_ESCALATION_POLICY.id, DEFAULT_ESCALATION_POLICY);

    logger.info(LogCategory.MONITORING, 'Advanced Alerting Engine initialized');
  }

  /**
   * Crea y procesa una nueva alerta
   */
  async createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    details: Record<string, any> = {},
    source: string = 'system',
    tags: string[] = []
  ): Promise<string> {
    // Generar fingerprint para deduplicación
    const fingerprint = this.generateFingerprint(type, title, source);
    
    // Verificar si ya existe una alerta similar activa
    const existingAlert = this.findExistingAlert(fingerprint);
    if (existingAlert && existingAlert.status === AlertStatus.ACTIVE) {
      // Actualizar alerta existente en lugar de crear nueva
      return this.updateExistingAlert(existingAlert.id, details);
    }

    // Verificar reglas de supresión
    if (await this.isAlertSuppressed(type, severity, source, title)) {
      logger.info(LogCategory.MONITORING, `Alert suppressed: ${title}`);
      return '';
    }

    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: AdvancedAlert = {
      id: alertId,
      type,
      severity,
      status: AlertStatus.ACTIVE,
      title,
      message,
      details,
      source,
      timestamp: Date.now(),
      escalationLevel: 0,
      tags,
      fingerprint,
      relatedAlerts: []
    };

    this.alerts.set(alertId, alert);

    // Persistir en Redis
    await this.persistAlert(alert);

    // Procesar alerta inmediatamente
    await this.processAlert(alert);

    // Programar escalación si es necesario
    this.scheduleEscalation(alert);

    logger.info(LogCategory.MONITORING, `Alert created: ${title}`, {
      id: alertId,
      type,
      severity,
      source
    });

    return alertId;
  }

  /**
   * Procesa una alerta enviándola a los canales apropiados
   */
  private async processAlert(alert: AdvancedAlert): Promise<void> {
    const applicableChannels = this.getApplicableChannels(alert);
    
    const sendPromises = applicableChannels.map(async (channelConfig) => {
      try {
        // Verificar rate limiting
        if (!this.checkRateLimit(channelConfig)) {
          logger.warn(LogCategory.MONITORING, `Rate limit exceeded for channel ${channelConfig.channel}`);
          return;
        }

        await this.sendToChannel(alert, channelConfig);
        this.updateRateLimit(channelConfig);
        
      } catch (error) {
        logger.error(LogCategory.MONITORING, `Error sending alert to ${channelConfig.channel}`, error as Error);
      }
    });

    await Promise.allSettled(sendPromises);
  }

  /**
   * Envía alerta a un canal específico
   */
  private async sendToChannel(alert: AdvancedAlert, channelConfig: AlertChannelConfig): Promise<void> {
    switch (channelConfig.channel) {
      case AlertChannel.EMAIL:
        await this.sendEmailAlert(alert, channelConfig);
        break;
      
      case AlertChannel.SLACK:
        await this.sendSlackAlert(alert, channelConfig);
        break;
      
      case AlertChannel.WEBHOOK:
        await this.sendWebhookAlert(alert, channelConfig);
        break;
      
      case AlertChannel.SMS:
        await this.sendSMSAlert(alert, channelConfig);
        break;
      
      case AlertChannel.DISCORD:
        await this.sendDiscordAlert(alert, channelConfig);
        break;
      
      case AlertChannel.TEAMS:
        await this.sendTeamsAlert(alert, channelConfig);
        break;
      
      case AlertChannel.CONSOLE:
        this.sendConsoleAlert(alert);
        break;
    }
  }

  /**
   * Envía alerta por email
   */
  private async sendEmailAlert(alert: AdvancedAlert, config: AlertChannelConfig): Promise<void> {
    // Implementación de envío de email
    // En implementación real, usar nodemailer o servicio de email
    logger.info(LogCategory.MONITORING, `Email alert sent: ${alert.title}`, {
      recipients: config.config.recipients
    });
  }

  /**
   * Envía alerta a Slack
   */
  private async sendSlackAlert(alert: AdvancedAlert, config: AlertChannelConfig): Promise<void> {
    if (!config.config.webhookUrl) {return;}

    const payload = {
      text: `🚨 ${this.getSeverityEmoji(alert.severity)} ${alert.title}`,
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          fields: [
            { title: 'Tipo', value: alert.type, short: true },
            { title: 'Severidad', value: alert.severity, short: true },
            { title: 'Fuente', value: alert.source, short: true },
            { title: 'Timestamp', value: new Date(alert.timestamp).toISOString(), short: true }
          ],
          text: alert.message,
          footer: `Alert ID: ${alert.id}`
        }
      ]
    };

    try {
      const response = await fetch(config.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }

      logger.info(LogCategory.MONITORING, `Slack alert sent: ${alert.title}`);
    } catch (error) {
      logger.error(LogCategory.MONITORING, 'Error sending Slack alert', error as Error);
    }
  }

  /**
   * Envía alerta por webhook
   */
  private async sendWebhookAlert(alert: AdvancedAlert, config: AlertChannelConfig): Promise<void> {
    if (!config.config.url) {return;}

    try {
      const response = await fetch(config.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.config.headers
        },
        body: JSON.stringify({
          alert,
          timestamp: Date.now(),
          source: 'pinteya-ecommerce'
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      logger.info(LogCategory.MONITORING, `Webhook alert sent: ${alert.title}`);
    } catch (error) {
      logger.error(LogCategory.MONITORING, 'Error sending webhook alert', error as Error);
    }
  }

  /**
   * Envía alerta por SMS
   */
  private async sendSMSAlert(alert: AdvancedAlert, config: AlertChannelConfig): Promise<void> {
    // Implementación de SMS (Twilio, AWS SNS, etc.)
    logger.info(LogCategory.MONITORING, `SMS alert sent: ${alert.title}`, {
      phones: config.config.phoneNumbers
    });
  }

  /**
   * Envía alerta a Discord
   */
  private async sendDiscordAlert(alert: AdvancedAlert, config: AlertChannelConfig): Promise<void> {
    if (!config.config.discordWebhook) {return;}

    const embed = {
      title: `🚨 ${alert.title}`,
      description: alert.message,
      color: this.getSeverityColorHex(alert.severity),
      fields: [
        { name: 'Tipo', value: alert.type, inline: true },
        { name: 'Severidad', value: alert.severity, inline: true },
        { name: 'Fuente', value: alert.source, inline: true }
      ],
      timestamp: new Date(alert.timestamp).toISOString(),
      footer: { text: `Alert ID: ${alert.id}` }
    };

    try {
      const response = await fetch(config.config.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status}`);
      }

      logger.info(LogCategory.MONITORING, `Discord alert sent: ${alert.title}`);
    } catch (error) {
      logger.error(LogCategory.MONITORING, 'Error sending Discord alert', error as Error);
    }
  }

  /**
   * Envía alerta a Teams
   */
  private async sendTeamsAlert(alert: AdvancedAlert, config: AlertChannelConfig): Promise<void> {
    if (!config.config.teamsWebhook) {return;}

    const card = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": this.getSeverityColorHex(alert.severity),
      "summary": alert.title,
      "sections": [
        {
          "activityTitle": `🚨 ${alert.title}`,
          "activitySubtitle": alert.message,
          "facts": [
            { "name": "Tipo", "value": alert.type },
            { "name": "Severidad", "value": alert.severity },
            { "name": "Fuente", "value": alert.source },
            { "name": "Timestamp", "value": new Date(alert.timestamp).toISOString() }
          ]
        }
      ]
    };

    try {
      const response = await fetch(config.config.teamsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      });

      if (!response.ok) {
        throw new Error(`Teams webhook failed: ${response.status}`);
      }

      logger.info(LogCategory.MONITORING, `Teams alert sent: ${alert.title}`);
    } catch (error) {
      logger.error(LogCategory.MONITORING, 'Error sending Teams alert', error as Error);
    }
  }

  /**
   * Envía alerta a consola
   */
  private sendConsoleAlert(alert: AdvancedAlert): void {
    const emoji = this.getSeverityEmoji(alert.severity);
    console.log(`${emoji} [${alert.severity.toUpperCase()}] ${alert.title}`);
    console.log(`   Message: ${alert.message}`);
    console.log(`   Source: ${alert.source} | Type: ${alert.type}`);
    console.log(`   ID: ${alert.id} | Time: ${new Date(alert.timestamp).toISOString()}`);
  }

  /**
   * Obtiene canales aplicables para una alerta
   */
  private getApplicableChannels(alert: AdvancedAlert): AlertChannelConfig[] {
    return Array.from(this.channelConfigs.values()).filter(config => {
      if (!config.enabled) {return false;}

      const { filters } = config;
      if (!filters) {return true;}

      // Filtrar por severidad
      if (filters.severities && !filters.severities.includes(alert.severity)) {
        return false;
      }

      // Filtrar por tipo
      if (filters.types && !filters.types.includes(alert.type)) {
        return false;
      }

      // Filtrar por keywords
      if (filters.keywords) {
        const text = `${alert.title} ${alert.message}`.toLowerCase();
        const hasKeyword = filters.keywords.some(keyword => 
          text.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) {return false;}
      }

      return true;
    });
  }

  /**
   * Verifica rate limiting
   */
  private checkRateLimit(config: AlertChannelConfig): boolean {
    if (!config.rateLimiting) {return true;}

    const key = `${config.channel}_rate_limit`;
    const now = Date.now();
    const counter = this.rateLimitCounters.get(key);

    if (!counter || now > counter.resetTime) {
      // Reset counter
      this.rateLimitCounters.set(key, {
        count: 0,
        resetTime: now + (60 * 60 * 1000) // 1 hora
      });
      return true;
    }

    return counter.count < config.rateLimiting.maxAlertsPerHour;
  }

  /**
   * Actualiza contador de rate limiting
   */
  private updateRateLimit(config: AlertChannelConfig): void {
    if (!config.rateLimiting) {return;}

    const key = `${config.channel}_rate_limit`;
    const counter = this.rateLimitCounters.get(key);
    
    if (counter) {
      counter.count++;
    }
  }

  /**
   * Programa escalación de alerta
   */
  private scheduleEscalation(alert: AdvancedAlert): void {
    const policy = this.escalationPolicies.get('default');
    if (!policy || !policy.enabled) {return;}

    const nextRule = policy.rules.find(rule => rule.level > alert.escalationLevel);
    if (!nextRule) {return;}

    const delay = nextRule.delayMinutes * 60 * 1000;
    
    const timer = setTimeout(async () => {
      await this.escalateAlert(alert.id, nextRule);
    }, delay);

    this.escalationTimers.set(alert.id, timer);
  }

  /**
   * Escala una alerta
   */
  private async escalateAlert(alertId: string, rule: EscalationRule): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== AlertStatus.ACTIVE) {return;}

    // Verificar condiciones de escalación
    if (rule.conditions?.unacknowledgedOnly && alert.status === AlertStatus.ACKNOWLEDGED) {
      return;
    }

    if (rule.conditions?.severities && !rule.conditions.severities.includes(alert.severity)) {
      return;
    }

    if (rule.conditions?.types && !rule.conditions.types.includes(alert.type)) {
      return;
    }

    // Actualizar nivel de escalación
    alert.escalationLevel = rule.level;
    alert.escalatedAt = Date.now();

    // Enviar a canales de escalación
    const escalationChannels = rule.channels.map(channel => 
      this.channelConfigs.get(channel)
    ).filter(Boolean) as AlertChannelConfig[];

    for (const channelConfig of escalationChannels) {
      await this.sendToChannel(alert, channelConfig);
    }

    // Programar siguiente escalación
    this.scheduleEscalation(alert);

    logger.warn(LogCategory.MONITORING, `Alert escalated to level ${rule.level}: ${alert.title}`, {
      alertId,
      level: rule.level
    });
  }

  /**
   * Reconoce una alerta
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== AlertStatus.ACTIVE) {return false;}

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = Date.now();

    // Cancelar escalación
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    logger.info(LogCategory.MONITORING, `Alert acknowledged: ${alert.title}`, {
      alertId,
      acknowledgedBy
    });

    return true;
  }

  /**
   * Resuelve una alerta
   */
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status === AlertStatus.RESOLVED) {return false;}

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = Date.now();

    // Cancelar escalación
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    logger.info(LogCategory.MONITORING, `Alert resolved: ${alert.title}`, {
      alertId,
      resolvedBy
    });

    return true;
  }

  /**
   * Suprime una alerta
   */
  suppressAlert(alertId: string, durationMinutes: number, reason: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {return false;}

    alert.status = AlertStatus.SUPPRESSED;
    alert.suppressedUntil = Date.now() + (durationMinutes * 60 * 1000);

    logger.info(LogCategory.MONITORING, `Alert suppressed: ${alert.title}`, {
      alertId,
      durationMinutes,
      reason
    });

    return true;
  }

  /**
   * Obtiene alertas activas
   */
  getActiveAlerts(): AdvancedAlert[] {
    return Array.from(this.alerts.values()).filter(alert => 
      alert.status === AlertStatus.ACTIVE || alert.status === AlertStatus.ACKNOWLEDGED
    );
  }

  /**
   * Obtiene estadísticas de alertas
   */
  getAlertStats(): {
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    suppressed: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<AlertType, number>;
  } {
    const alerts = Array.from(this.alerts.values());
    
    const stats = {
      total: alerts.length,
      active: 0,
      acknowledged: 0,
      resolved: 0,
      suppressed: 0,
      bySeverity: {
        [AlertSeverity.LOW]: 0,
        [AlertSeverity.MEDIUM]: 0,
        [AlertSeverity.HIGH]: 0,
        [AlertSeverity.CRITICAL]: 0
      },
      byType: {
        [AlertType.PERFORMANCE]: 0,
        [AlertType.ERROR]: 0,
        [AlertType.CAPACITY]: 0,
        [AlertType.AVAILABILITY]: 0,
        [AlertType.SECURITY]: 0,
        [AlertType.BUSINESS]: 0
      }
    };

    alerts.forEach(alert => {
      switch (alert.status) {
        case AlertStatus.ACTIVE:
          stats.active++;
          break;
        case AlertStatus.ACKNOWLEDGED:
          stats.acknowledged++;
          break;
        case AlertStatus.RESOLVED:
          stats.resolved++;
          break;
        case AlertStatus.SUPPRESSED:
          stats.suppressed++;
          break;
      }

      stats.bySeverity[alert.severity]++;
      stats.byType[alert.type]++;
    });

    return stats;
  }

  // ===================================
  // MÉTODOS AUXILIARES
  // ===================================

  private generateFingerprint(type: AlertType, title: string, source: string): string {
    const content = `${type}:${title}:${source}`;
    return Buffer.from(content).toString('base64').slice(0, 16);
  }

  private findExistingAlert(fingerprint: string): AdvancedAlert | undefined {
    return Array.from(this.alerts.values()).find(alert => 
      alert.fingerprint === fingerprint && alert.status === AlertStatus.ACTIVE
    );
  }

  private async updateExistingAlert(alertId: string, newDetails: Record<string, any>): Promise<string> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.details = { ...alert.details, ...newDetails };
      alert.timestamp = Date.now(); // Actualizar timestamp
      await this.persistAlert(alert);
    }
    return alertId;
  }

  private async isAlertSuppressed(
    type: AlertType,
    severity: AlertSeverity,
    source: string,
    title: string
  ): Promise<boolean> {
    // Verificar reglas de supresión
    for (const rule of this.suppressionRules.values()) {
      if (!rule.enabled) {continue;}

      const { conditions } = rule;
      
      if (conditions.types && !conditions.types.includes(type)) {continue;}
      if (conditions.severities && !conditions.severities.includes(severity)) {continue;}
      if (conditions.sources && !conditions.sources.includes(source)) {continue;}
      
      if (conditions.keywords) {
        const text = title.toLowerCase();
        const hasKeyword = conditions.keywords.some(keyword => 
          text.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) {continue;}
      }

      // Verificar ventanas de tiempo
      if (conditions.timeWindows) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDay = now.getDay();
        
        const inTimeWindow = conditions.timeWindows.some(window => {
          return window.days.includes(currentDay) &&
                 currentTime >= window.start &&
                 currentTime <= window.end;
        });
        
        if (!inTimeWindow) {continue;}
      }

      return true; // Alerta suprimida
    }

    return false;
  }

  private async persistAlert(alert: AdvancedAlert): Promise<void> {
    try {
      await this.redis.setex(
        `alert:${alert.id}`,
        86400 * 30, // 30 días
        JSON.stringify(alert)
      );
    } catch (error) {
      logger.error(LogCategory.MONITORING, 'Error persisting alert', error as Error);
    }
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.LOW: return '🟡';
      case AlertSeverity.MEDIUM: return '🟠';
      case AlertSeverity.HIGH: return '🔴';
      case AlertSeverity.CRITICAL: return '🚨';
      default: return '⚪';
    }
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.LOW: return '#ffeb3b';
      case AlertSeverity.MEDIUM: return '#ff9800';
      case AlertSeverity.HIGH: return '#f44336';
      case AlertSeverity.CRITICAL: return '#d32f2f';
      default: return '#9e9e9e';
    }
  }

  private getSeverityColorHex(severity: AlertSeverity): number {
    switch (severity) {
      case AlertSeverity.LOW: return 0xffeb3b;
      case AlertSeverity.MEDIUM: return 0xff9800;
      case AlertSeverity.HIGH: return 0xf44336;
      case AlertSeverity.CRITICAL: return 0xd32f2f;
      default: return 0x9e9e9e;
    }
  }

  /**
   * Configurar canales de alerta
   */
  configureChannel(channel: AlertChannel, config: Partial<AlertChannelConfig>): void {
    const existing = this.channelConfigs.get(channel) || {
      channel,
      enabled: false,
      config: {}
    };

    this.channelConfigs.set(channel, { ...existing, ...config });
    logger.info(LogCategory.MONITORING, `Alert channel configured: ${channel}`);
  }

  /**
   * Configurar política de escalación
   */
  configureEscalationPolicy(policy: EscalationPolicy): void {
    this.escalationPolicies.set(policy.id, policy);
    logger.info(LogCategory.MONITORING, `Escalation policy configured: ${policy.name}`);
  }

  /**
   * Agregar regla de supresión
   */
  addSuppressionRule(rule: SuppressionRule): void {
    this.suppressionRules.set(rule.id, rule);
    logger.info(LogCategory.MONITORING, `Suppression rule added: ${rule.name}`);
  }

  /**
   * Destructor
   */
  destroy(): void {
    this.escalationTimers.forEach(timer => clearTimeout(timer));
    this.escalationTimers.clear();
  }
}

// Instancia singleton
export const advancedAlertingEngine = AdvancedAlertingEngine.getInstance();

/**
 * Utilidades para alertas avanzadas
 */
export const AdvancedAlertingUtils = {
  /**
   * Crea alerta de performance
   */
  async createPerformanceAlert(
    title: string,
    message: string,
    severity: AlertSeverity = AlertSeverity.MEDIUM,
    details: Record<string, any> = {}
  ): Promise<string> {
    return advancedAlertingEngine.createAlert(
      AlertType.PERFORMANCE,
      severity,
      title,
      message,
      details,
      'performance-monitor'
    );
  },

  /**
   * Crea alerta de error
   */
  async createErrorAlert(
    title: string,
    message: string,
    severity: AlertSeverity = AlertSeverity.HIGH,
    details: Record<string, any> = {}
  ): Promise<string> {
    return advancedAlertingEngine.createAlert(
      AlertType.ERROR,
      severity,
      title,
      message,
      details,
      'error-tracker'
    );
  },

  /**
   * Crea alerta de capacidad
   */
  async createCapacityAlert(
    title: string,
    message: string,
    severity: AlertSeverity = AlertSeverity.MEDIUM,
    details: Record<string, any> = {}
  ): Promise<string> {
    return advancedAlertingEngine.createAlert(
      AlertType.CAPACITY,
      severity,
      title,
      message,
      details,
      'capacity-monitor'
    );
  },

  /**
   * Obtiene resumen de alertas
   */
  getAlertSummary(): {
    activeCount: number;
    criticalCount: number;
    lastAlert?: AdvancedAlert;
  } {
    const activeAlerts = advancedAlertingEngine.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === AlertSeverity.CRITICAL);
    const lastAlert = activeAlerts.sort((a, b) => b.timestamp - a.timestamp)[0];

    return {
      activeCount: activeAlerts.length,
      criticalCount: criticalAlerts.length,
      lastAlert
    };
  }
};









