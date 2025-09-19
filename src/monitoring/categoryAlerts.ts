/**
 * Category Alerts System
 * Automated alerting for Categories component metrics
 * Pinteya E-commerce - Enterprise Monitoring Alerts
 */

import type { CategoryMetrics, PerformanceMetrics, AccessibilityMetrics } from './categoryMetrics';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Alert types
 */
export type AlertType = 
  | 'performance_degradation'
  | 'accessibility_violation'
  | 'error_rate_spike'
  | 'conversion_drop'
  | 'memory_leak'
  | 'render_timeout'
  | 'user_satisfaction_drop';

/**
 * Alert interface
 */
export interface CategoryAlert {
  /** Unique alert ID */
  id: string;
  /** Alert type */
  type: AlertType;
  /** Severity level */
  severity: AlertSeverity;
  /** Alert title */
  title: string;
  /** Alert description */
  description: string;
  /** Metric value that triggered the alert */
  value: number;
  /** Expected/target value */
  threshold: number;
  /** Timestamp when alert was triggered */
  timestamp: number;
  /** Whether alert is resolved */
  resolved: boolean;
  /** Resolution timestamp */
  resolvedAt?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Alert rule interface
 */
export interface AlertRule {
  /** Rule ID */
  id: string;
  /** Rule name */
  name: string;
  /** Alert type this rule generates */
  type: AlertType;
  /** Severity level */
  severity: AlertSeverity;
  /** Metric path to evaluate */
  metricPath: string;
  /** Threshold value */
  threshold: number;
  /** Comparison operator */
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  /** Whether rule is enabled */
  enabled: boolean;
  /** Cooldown period in milliseconds */
  cooldown: number;
  /** Custom evaluation function */
  evaluator?: (metrics: CategoryMetrics) => boolean;
}

/**
 * Alert configuration
 */
interface AlertConfig {
  /** Whether alerting is enabled */
  enabled: boolean;
  /** Default cooldown period */
  defaultCooldown: number;
  /** Maximum alerts per hour */
  maxAlertsPerHour: number;
  /** Notification channels */
  channels: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
    console: boolean;
  };
  /** Debug mode */
  debug: boolean;
}

/**
 * Default alert configuration
 */
const defaultConfig: AlertConfig = {
  enabled: true,
  defaultCooldown: 5 * 60 * 1000, // 5 minutes
  maxAlertsPerHour: 20,
  channels: {
    email: false,
    slack: false,
    webhook: true,
    console: true,
  },
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Default alert rules
 */
const defaultRules: AlertRule[] = [
  {
    id: 'render-time-high',
    name: 'High Render Time',
    type: 'performance_degradation',
    severity: 'warning',
    metricPath: 'performance.renderTime',
    threshold: 100,
    operator: 'gt',
    enabled: true,
    cooldown: 5 * 60 * 1000,
  },
  {
    id: 'render-time-critical',
    name: 'Critical Render Time',
    type: 'render_timeout',
    severity: 'critical',
    metricPath: 'performance.renderTime',
    threshold: 200,
    operator: 'gt',
    enabled: true,
    cooldown: 2 * 60 * 1000,
  },
  {
    id: 'memory-usage-high',
    name: 'High Memory Usage',
    type: 'memory_leak',
    severity: 'warning',
    metricPath: 'performance.memoryUsage',
    threshold: 50,
    operator: 'gt',
    enabled: true,
    cooldown: 10 * 60 * 1000,
  },
  {
    id: 'accessibility-violations',
    name: 'Accessibility Violations',
    type: 'accessibility_violation',
    severity: 'error',
    metricPath: 'accessibility.violations',
    threshold: 0,
    operator: 'gt',
    enabled: true,
    cooldown: 1 * 60 * 1000,
  },
  {
    id: 'wcag-compliance-low',
    name: 'WCAG Compliance Below Target',
    type: 'accessibility_violation',
    severity: 'warning',
    metricPath: 'accessibility.wcagCompliance',
    threshold: 95,
    operator: 'lt',
    enabled: true,
    cooldown: 15 * 60 * 1000,
  },
  {
    id: 'error-rate-spike',
    name: 'Error Rate Spike',
    type: 'error_rate_spike',
    severity: 'error',
    metricPath: 'userExperience.errorRate',
    threshold: 1,
    operator: 'gt',
    enabled: true,
    cooldown: 3 * 60 * 1000,
  },
  {
    id: 'conversion-rate-drop',
    name: 'Conversion Rate Drop',
    type: 'conversion_drop',
    severity: 'warning',
    metricPath: 'business.conversionRate',
    threshold: 10,
    operator: 'lt',
    enabled: true,
    cooldown: 30 * 60 * 1000,
  },
  {
    id: 'user-satisfaction-low',
    name: 'User Satisfaction Below Target',
    type: 'user_satisfaction_drop',
    severity: 'warning',
    metricPath: 'userExperience.satisfactionScore',
    threshold: 7,
    operator: 'lt',
    enabled: true,
    cooldown: 60 * 60 * 1000, // 1 hour
  },
];

/**
 * Category alerts manager
 */
class CategoryAlertsManager {
  private static instance: CategoryAlertsManager | null = null;
  private config: AlertConfig;
  private rules: AlertRule[];
  private activeAlerts: Map<string, CategoryAlert> = new Map();
  private alertHistory: CategoryAlert[] = [];
  private lastAlertTimes: Map<string, number> = new Map();
  private alertCounts: Map<number, number> = new Map(); // hour -> count

  private constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.rules = [...defaultRules];
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<AlertConfig>): CategoryAlertsManager {
    if (!CategoryAlertsManager.instance) {
      CategoryAlertsManager.instance = new CategoryAlertsManager(config);
    }
    return CategoryAlertsManager.instance;
  }

  /**
   * Evaluate metrics against alert rules
   */
  evaluateMetrics(metrics: CategoryMetrics): CategoryAlert[] {
    if (!this.config.enabled) {return [];}

    const triggeredAlerts: CategoryAlert[] = [];
    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000));

    // Check rate limiting
    const currentHourAlerts = this.alertCounts.get(currentHour) || 0;
    if (currentHourAlerts >= this.config.maxAlertsPerHour) {
      if (this.config.debug) {
        console.warn('Alert rate limit reached for current hour');
      }
      return [];
    }

    for (const rule of this.rules) {
      if (!rule.enabled) {continue;}

      // Check cooldown
      const lastAlertTime = this.lastAlertTimes.get(rule.id) || 0;
      if (now - lastAlertTime < rule.cooldown) {continue;}

      let shouldAlert = false;

      if (rule.evaluator) {
        // Use custom evaluator
        shouldAlert = rule.evaluator(metrics);
      } else {
        // Use standard evaluation
        const value = this.getMetricValue(metrics, rule.metricPath);
        shouldAlert = this.evaluateCondition(value, rule.threshold, rule.operator);
      }

      if (shouldAlert) {
        const alert = this.createAlert(rule, metrics);
        triggeredAlerts.push(alert);
        
        // Update tracking
        this.lastAlertTimes.set(rule.id, now);
        this.alertCounts.set(currentHour, currentHourAlerts + 1);
        this.activeAlerts.set(alert.id, alert);
        this.alertHistory.push(alert);
      }
    }

    // Send notifications for triggered alerts
    if (triggeredAlerts.length > 0) {
      this.sendNotifications(triggeredAlerts);
    }

    return triggeredAlerts;
  }

  /**
   * Get metric value by path
   */
  private getMetricValue(metrics: CategoryMetrics, path: string): number {
    const parts = path.split('.');
    let value: any = metrics;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return typeof value === 'number' ? value : 0;
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  /**
   * Create alert from rule and metrics
   */
  private createAlert(rule: AlertRule, metrics: CategoryMetrics): CategoryAlert {
    const value = this.getMetricValue(metrics, rule.metricPath);
    
    return {
      id: `${rule.id}_${Date.now()}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      description: this.generateAlertDescription(rule, value),
      value,
      threshold: rule.threshold,
      timestamp: Date.now(),
      resolved: false,
      metadata: {
        ruleId: rule.id,
        metricPath: rule.metricPath,
        operator: rule.operator,
      },
    };
  }

  /**
   * Generate alert description
   */
  private generateAlertDescription(rule: AlertRule, value: number): string {
    const operatorText = {
      gt: 'mayor que',
      lt: 'menor que',
      eq: 'igual a',
      gte: 'mayor o igual que',
      lte: 'menor o igual que',
    }[rule.operator] || 'comparado con';

    return `El valor actual (${value}) es ${operatorText} el umbral (${rule.threshold})`;
  }

  /**
   * Send notifications for alerts
   */
  private async sendNotifications(alerts: CategoryAlert[]): Promise<void> {
    for (const alert of alerts) {
      try {
        // Console notification
        if (this.config.channels.console) {
          this.logAlert(alert);
        }

        // Webhook notification
        if (this.config.channels.webhook) {
          await this.sendWebhookNotification(alert);
        }

        // Email notification (placeholder)
        if (this.config.channels.email) {
          await this.sendEmailNotification(alert);
        }

        // Slack notification (placeholder)
        if (this.config.channels.slack) {
          await this.sendSlackNotification(alert);
        }
      } catch (error) {
        console.error('Failed to send notification for alert:', alert.id, error);
      }
    }
  }

  /**
   * Log alert to console
   */
  private logAlert(alert: CategoryAlert): void {
    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    }[alert.severity];

    console.warn(
      `${emoji} [CATEGORY ALERT] ${alert.title}`,
      `\nSeverity: ${alert.severity}`,
      `\nDescription: ${alert.description}`,
      `\nValue: ${alert.value}`,
      `\nThreshold: ${alert.threshold}`,
      `\nTime: ${new Date(alert.timestamp).toISOString()}`
    );
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: CategoryAlert): Promise<void> {
    if (typeof window === 'undefined' || !window.fetch) {return;}

    try {
      await fetch('/api/alerts/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert,
          source: 'categories_component',
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * Send email notification (placeholder)
   */
  private async sendEmailNotification(alert: CategoryAlert): Promise<void> {
    // Implement email notification logic
    if (this.config.debug) {
    }
  }

  /**
   * Send Slack notification (placeholder)
   */
  private async sendSlackNotification(alert: CategoryAlert): Promise<void> {
    // Implement Slack notification logic
    if (this.config.debug) {
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {return false;}

    alert.resolved = true;
    alert.resolvedAt = Date.now();
    this.activeAlerts.delete(alertId);

    if (this.config.debug) {
    }

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): CategoryAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100): CategoryAlert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Add custom rule
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove rule
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index === -1) {return false;}

    this.rules.splice(index, 1);
    return true;
  }

  /**
   * Update rule
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {return false;}

    Object.assign(rule, updates);
    return true;
  }

  /**
   * Get configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get rules
   */
  getRules(): AlertRule[] {
    return [...this.rules];
  }

  /**
   * Clear alert history
   */
  clearHistory(): void {
    this.alertHistory = [];
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    activeAlerts: number;
    totalAlerts: number;
    alertsByType: Record<AlertType, number>;
    alertsBySeverity: Record<AlertSeverity, number>;
  } {
    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};

    this.alertHistory.forEach(alert => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    });

    return {
      activeAlerts: this.activeAlerts.size,
      totalAlerts: this.alertHistory.length,
      alertsByType: alertsByType as Record<AlertType, number>,
      alertsBySeverity: alertsBySeverity as Record<AlertSeverity, number>,
    };
  }
}

/**
 * React hook for category alerts
 */
export const useCategoryAlerts = (config?: Partial<AlertConfig>) => {
  const manager = CategoryAlertsManager.getInstance(config);

  return {
    evaluateMetrics: manager.evaluateMetrics.bind(manager),
    getActiveAlerts: manager.getActiveAlerts.bind(manager),
    getAlertHistory: manager.getAlertHistory.bind(manager),
    resolveAlert: manager.resolveAlert.bind(manager),
    addRule: manager.addRule.bind(manager),
    removeRule: manager.removeRule.bind(manager),
    updateRule: manager.updateRule.bind(manager),
    getStatistics: manager.getStatistics.bind(manager),
  };
};

/**
 * Export manager and types
 */
export { CategoryAlertsManager };
export type { AlertRule, AlertConfig };









