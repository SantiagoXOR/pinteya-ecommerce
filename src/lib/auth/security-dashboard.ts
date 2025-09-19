/**
 * Dashboard de Seguridad
 * Proporciona una interfaz unificada para monitoreo y gestión de seguridad
 */

import {
  getSecurityMetrics,
  getActiveSecurityAlerts,
  analyzeSecurityPatterns,
  runSecurityHealthCheck,
  generateSecurityReport,
  startSecurityMonitoring,
  stopSecurityMonitoring,
  type SecurityMetrics,
  type SecurityAlert,
  type SecurityReport
} from './security-audit-enhanced';

// =====================================================
// TIPOS Y INTERFACES DEL DASHBOARD
// =====================================================

export interface SecurityDashboardData {
  metrics: SecurityMetrics;
  alerts: SecurityAlert[];
  healthCheck: {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  };
  recentActivity: {
    totalEvents: number;
    criticalEvents: number;
    newAlerts: number;
    resolvedAlerts: number;
  };
  trends: {
    eventsLast7Days: number[];
    alertsLast7Days: number[];
    securityScoreTrend: number[];
  };
}

export interface SecurityDashboardConfig {
  refreshInterval: number; // en segundos
  alertThresholds: {
    criticalEvents: number;
    authFailures: number;
    suspiciousActivities: number;
    securityScore: number;
  };
  autoAnalysis: boolean;
  notifications: {
    email: boolean;
    slack: boolean;
    webhook?: string;
  };
}

// =====================================================
// CLASE PRINCIPAL DEL DASHBOARD
// =====================================================

export class SecurityDashboard {
  private config: SecurityDashboardConfig;
  private monitoringInterval?: NodeJS.Timeout;
  private refreshInterval?: NodeJS.Timeout;
  private lastUpdate: Date;
  private cachedData?: SecurityDashboardData;

  constructor(config: Partial<SecurityDashboardConfig> = {}) {
    this.config = {
      refreshInterval: 30, // 30 segundos por defecto
      alertThresholds: {
        criticalEvents: 1,
        authFailures: 10,
        suspiciousActivities: 5,
        securityScore: 70
      },
      autoAnalysis: true,
      notifications: {
        email: false,
        slack: false
      },
      ...config
    };
    this.lastUpdate = new Date();
  }

  /**
   * Inicia el dashboard de seguridad
   */
  async start(): Promise<void> {
    try {
      console.log('[SECURITY DASHBOARD] Iniciando dashboard de seguridad...');

      // Cargar datos iniciales
      await this.refreshData();

      // Iniciar monitoreo automático si está habilitado
      if (this.config.autoAnalysis) {
        this.monitoringInterval = startSecurityMonitoring(5); // cada 5 minutos
      }

      // Iniciar refresh automático de datos
      this.refreshInterval = setInterval(async () => {
        await this.refreshData();
      }, this.config.refreshInterval * 1000);

      console.log('[SECURITY DASHBOARD] Dashboard iniciado exitosamente');
    } catch (error) {
      console.error('[SECURITY DASHBOARD] Error iniciando dashboard:', error);
      throw error;
    }
  }

  /**
   * Detiene el dashboard de seguridad
   */
  stop(): void {
    console.log('[SECURITY DASHBOARD] Deteniendo dashboard...');

    if (this.monitoringInterval) {
      stopSecurityMonitoring(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }

    console.log('[SECURITY DASHBOARD] Dashboard detenido');
  }

  /**
   * Actualiza los datos del dashboard
   */
  async refreshData(): Promise<SecurityDashboardData> {
    try {
      console.log('[SECURITY DASHBOARD] Actualizando datos...');

      // Obtener datos en paralelo
      const [metrics, alerts, healthCheck] = await Promise.all([
        getSecurityMetrics(),
        getActiveSecurityAlerts(),
        runSecurityHealthCheck()
      ]);

      // Calcular actividad reciente (comparar con datos anteriores)
      const recentActivity = {
        totalEvents: metrics.total_events_24h,
        criticalEvents: metrics.critical_events_24h,
        newAlerts: alerts.filter(a => 
          new Date(a.first_occurrence) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        resolvedAlerts: 0 // TODO: implementar cuando se tenga histórico
      };

      // Generar tendencias (simuladas por ahora)
      const trends = {
        eventsLast7Days: await this.getEventsTrend(7),
        alertsLast7Days: await this.getAlertsTrend(7),
        securityScoreTrend: await this.getSecurityScoreTrend(7)
      };

      this.cachedData = {
        metrics,
        alerts,
        healthCheck: {
          status: healthCheck.status,
          issues: healthCheck.issues,
          recommendations: healthCheck.recommendations
        },
        recentActivity,
        trends
      };

      this.lastUpdate = new Date();

      // Verificar umbrales y generar alertas si es necesario
      await this.checkThresholds(metrics, alerts);

      console.log('[SECURITY DASHBOARD] Datos actualizados exitosamente');
      return this.cachedData;
    } catch (error) {
      console.error('[SECURITY DASHBOARD] Error actualizando datos:', error);
      throw error;
    }
  }

  /**
   * Obtiene los datos actuales del dashboard
   */
  async getData(forceRefresh: boolean = false): Promise<SecurityDashboardData> {
    if (forceRefresh || !this.cachedData || 
        Date.now() - this.lastUpdate.getTime() > this.config.refreshInterval * 1000) {
      return await this.refreshData();
    }
    return this.cachedData;
  }

  /**
   * Ejecuta un análisis manual de seguridad
   */
  async runManualAnalysis(userId?: string): Promise<SecurityAlert[]> {
    try {
      console.log('[SECURITY DASHBOARD] Ejecutando análisis manual...');
      
      const alerts = await analyzeSecurityPatterns(userId);
      
      // Actualizar datos después del análisis
      await this.refreshData();
      
      console.log(`[SECURITY DASHBOARD] Análisis completado: ${alerts.length} alertas generadas`);
      return alerts;
    } catch (error) {
      console.error('[SECURITY DASHBOARD] Error en análisis manual:', error);
      throw error;
    }
  }

  /**
   * Genera un reporte de seguridad
   */
  async generateReport(startDate: Date, endDate: Date): Promise<SecurityReport> {
    try {
      console.log('[SECURITY DASHBOARD] Generando reporte de seguridad...');
      
      const report = await generateSecurityReport(startDate, endDate);
      
      console.log('[SECURITY DASHBOARD] Reporte generado exitosamente');
      return report;
    } catch (error) {
      console.error('[SECURITY DASHBOARD] Error generando reporte:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado actual del dashboard
   */
  getStatus(): {
    isRunning: boolean;
    lastUpdate: Date;
    config: SecurityDashboardConfig;
    uptime: number;
  } {
    return {
      isRunning: !!this.refreshInterval,
      lastUpdate: this.lastUpdate,
      config: this.config,
      uptime: Date.now() - this.lastUpdate.getTime()
    };
  }

  /**
   * Actualiza la configuración del dashboard
   */
  updateConfig(newConfig: Partial<SecurityDashboardConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[SECURITY DASHBOARD] Configuración actualizada');
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  /**
   * Verifica umbrales y genera notificaciones
   */
  private async checkThresholds(metrics: SecurityMetrics, alerts: SecurityAlert[]): Promise<void> {
    const issues: string[] = [];

    if (metrics.critical_events_24h >= this.config.alertThresholds.criticalEvents) {
      issues.push(`Eventos críticos: ${metrics.critical_events_24h} (umbral: ${this.config.alertThresholds.criticalEvents})`);
    }

    if (metrics.auth_failures_24h >= this.config.alertThresholds.authFailures) {
      issues.push(`Fallos de autenticación: ${metrics.auth_failures_24h} (umbral: ${this.config.alertThresholds.authFailures})`);
    }

    if (metrics.suspicious_activities_24h >= this.config.alertThresholds.suspiciousActivities) {
      issues.push(`Actividades sospechosas: ${metrics.suspicious_activities_24h} (umbral: ${this.config.alertThresholds.suspiciousActivities})`);
    }

    if (metrics.security_score <= this.config.alertThresholds.securityScore) {
      issues.push(`Score de seguridad bajo: ${metrics.security_score} (umbral: ${this.config.alertThresholds.securityScore})`);
    }

    if (issues.length > 0) {
      console.warn('[SECURITY DASHBOARD] Umbrales excedidos:', issues);
      await this.sendNotifications(issues);
    }
  }

  /**
   * Envía notificaciones según la configuración
   */
  private async sendNotifications(issues: string[]): Promise<void> {
    try {
      if (this.config.notifications.webhook) {
        // Enviar webhook
        const payload = {
          timestamp: new Date().toISOString(),
          source: 'security-dashboard',
          level: 'warning',
          message: 'Umbrales de seguridad excedidos',
          issues
        };

        await fetch(this.config.notifications.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      // TODO: Implementar notificaciones por email y Slack
      if (this.config.notifications.email) {
        console.log('[SECURITY DASHBOARD] Enviando notificación por email...');
      }

      if (this.config.notifications.slack) {
        console.log('[SECURITY DASHBOARD] Enviando notificación por Slack...');
      }
    } catch (error) {
      console.error('[SECURITY DASHBOARD] Error enviando notificaciones:', error);
    }
  }

  /**
   * Obtiene tendencia de eventos (simulada)
   */
  private async getEventsTrend(days: number): Promise<number[]> {
    // TODO: Implementar consulta real a la base de datos
    return Array(days).fill(0).map(() => Math.floor(Math.random() * 100));
  }

  /**
   * Obtiene tendencia de alertas (simulada)
   */
  private async getAlertsTrend(days: number): Promise<number[]> {
    // TODO: Implementar consulta real a la base de datos
    return Array(days).fill(0).map(() => Math.floor(Math.random() * 10));
  }

  /**
   * Obtiene tendencia del score de seguridad (simulada)
   */
  private async getSecurityScoreTrend(days: number): Promise<number[]> {
    // TODO: Implementar consulta real a la base de datos
    return Array(days).fill(0).map(() => Math.floor(Math.random() * 40) + 60);
  }
}

// =====================================================
// INSTANCIA SINGLETON DEL DASHBOARD
// =====================================================

let dashboardInstance: SecurityDashboard | null = null;

/**
 * Obtiene la instancia singleton del dashboard
 */
export function getSecurityDashboard(config?: Partial<SecurityDashboardConfig>): SecurityDashboard {
  if (!dashboardInstance) {
    dashboardInstance = new SecurityDashboard(config);
  }
  return dashboardInstance;
}

/**
 * Inicia el dashboard global de seguridad
 */
export async function startGlobalSecurityDashboard(config?: Partial<SecurityDashboardConfig>): Promise<SecurityDashboard> {
  const dashboard = getSecurityDashboard(config);
  await dashboard.start();
  return dashboard;
}

/**
 * Detiene el dashboard global de seguridad
 */
export function stopGlobalSecurityDashboard(): void {
  if (dashboardInstance) {
    dashboardInstance.stop();
    dashboardInstance = null;
  }
}









