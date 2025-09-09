'use client'

import { logger, LogLevel, LogCategory } from '../logger'
import { EnterpriseAlertSystem } from './alert-system'
import { EnterpriseMetricsCollector } from './enterprise-metrics'
import { emailService } from '../notifications/email'
import { slackService } from '../notifications/slack'

export interface ErrorPattern {
  id: string
  name: string
  pattern: RegExp | string
  severity: 'low' | 'medium' | 'high' | 'critical'
  threshold: number // Número de ocurrencias antes de alertar
  timeWindow: number // Ventana de tiempo en minutos
  description: string
  isActive: boolean
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical' | 'down'
  uptime: number
  responseTime: number
  errorRate: number
  memoryUsage: number
  cpuUsage: number
  activeConnections: number
  lastCheck: Date
  issues: HealthIssue[]
}

export interface HealthIssue {
  id: string
  type: 'performance' | 'error' | 'resource' | 'security'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: Record<string, any>
  firstDetected: Date
  lastSeen: Date
  count: number
}

export interface MonitoringConfig {
  enabled: boolean
  checkInterval: number // en segundos
  errorThreshold: number
  responseTimeThreshold: number
  memoryThreshold: number
  cpuThreshold: number
  enableAutoRecovery: boolean
  notificationChannels: string[]
}

export class ProactiveMonitoringService {
  private static instance: ProactiveMonitoringService
  private alertSystem: EnterpriseAlertSystem
  private metricsCollector: EnterpriseMetricsCollector
  private errorPatterns: Map<string, ErrorPattern> = new Map()
  private errorCounts: Map<string, { count: number; firstSeen: Date; lastSeen: Date }> = new Map()
  private healthChecks: Map<string, () => Promise<any>> = new Map()
  private monitoringInterval: NodeJS.Timeout | null = null
  private config: MonitoringConfig

  static getInstance(): ProactiveMonitoringService {
    if (!ProactiveMonitoringService.instance) {
      ProactiveMonitoringService.instance = new ProactiveMonitoringService()
    }
    return ProactiveMonitoringService.instance
  }

  constructor() {
    // Solo inicializar en el servidor
    if (typeof window === 'undefined') {
      this.alertSystem = EnterpriseAlertSystem.getInstance()
      this.metricsCollector = EnterpriseMetricsCollector.getInstance()
    }
    this.config = {
      enabled: true,
      checkInterval: 30, // 30 segundos
      errorThreshold: 5, // 5% error rate
      responseTimeThreshold: 2000, // 2 segundos
      memoryThreshold: 80, // 80% memoria
      cpuThreshold: 70, // 70% CPU
      enableAutoRecovery: true,
      notificationChannels: ['email', 'slack']
    }
    this.initializeDefaultPatterns()
  }

  private initializeDefaultPatterns(): void {
    const defaultPatterns: ErrorPattern[] = [
      {
        id: 'database_connection_error',
        name: 'Database Connection Error',
        pattern: /database.*connection.*failed|connection.*timeout|pool.*exhausted/i,
        severity: 'critical',
        threshold: 3,
        timeWindow: 5,
        description: 'Errores de conexión a la base de datos',
        isActive: true
      },
      {
        id: 'payment_processing_error',
        name: 'Payment Processing Error',
        pattern: /payment.*failed|transaction.*error|mercadopago.*error/i,
        severity: 'high',
        threshold: 5,
        timeWindow: 10,
        description: 'Errores en el procesamiento de pagos',
        isActive: true
      },
      {
        id: 'authentication_error',
        name: 'Authentication Error',
        pattern: /auth.*failed|unauthorized|invalid.*token|session.*expired/i,
        severity: 'medium',
        threshold: 10,
        timeWindow: 15,
        description: 'Errores de autenticación',
        isActive: true
      },
      {
        id: 'api_rate_limit',
        name: 'API Rate Limit Exceeded',
        pattern: /rate.*limit.*exceeded|too.*many.*requests|429/i,
        severity: 'medium',
        threshold: 20,
        timeWindow: 5,
        description: 'Límite de velocidad de API excedido',
        isActive: true
      },
      {
        id: 'server_error',
        name: 'Internal Server Error',
        pattern: /internal.*server.*error|500.*error|unhandled.*exception/i,
        severity: 'high',
        threshold: 5,
        timeWindow: 10,
        description: 'Errores internos del servidor',
        isActive: true
      }
    ]

    defaultPatterns.forEach(pattern => {
      this.errorPatterns.set(pattern.id, pattern)
    })
  }

  /**
   * Inicia el monitoreo proactivo
   */
  start(): void {
    // Solo ejecutar en el servidor
    if (typeof window !== 'undefined') {
      return
    }

    if (!this.config.enabled) {
      logger.info(LogLevel.INFO, 'Proactive monitoring is disabled', {}, LogCategory.SYSTEM)
      return
    }

    if (this.monitoringInterval) {
      this.stop()
    }

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.config.checkInterval * 1000)

    logger.info(LogLevel.INFO, 'Proactive monitoring started', {
      interval: this.config.checkInterval,
      patterns: this.errorPatterns.size
    }, LogCategory.SYSTEM)
  }

  /**
   * Detiene el monitoreo proactivo
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info(LogLevel.INFO, 'Proactive monitoring stopped', {}, LogCategory.SYSTEM)
    }
  }

  /**
   * Registra un error para análisis
   */
  async reportError(error: Error | string, context?: Record<string, any>): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error
    const errorStack = error instanceof Error ? error.stack : undefined

    // Solo procesar en el servidor
    if (typeof window === 'undefined') {
      // Analizar patrones de error
      for (const [patternId, pattern] of this.errorPatterns) {
        if (!pattern.isActive) continue

        const regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern, 'i')
        if (regex.test(errorMessage)) {
          await this.handlePatternMatch(patternId, pattern, errorMessage, context)
        }
      }

      // Registrar métricas si está disponible
      if (this.metricsCollector) {
        await this.metricsCollector.recordMetric('errors_total', 1, undefined, undefined, {
          type: 'application_error',
          ...context
        })
      }
    }

    // Log del error
    logger.error(LogLevel.ERROR, 'Error reported to monitoring', {
      error: errorMessage,
      stack: errorStack,
      context
    }, LogCategory.SYSTEM)
  }

  private async handlePatternMatch(
    patternId: string,
    pattern: ErrorPattern,
    errorMessage: string,
    context?: Record<string, any>
  ): Promise<void> {
    const now = new Date()
    const key = `${patternId}_${Math.floor(now.getTime() / (pattern.timeWindow * 60 * 1000))}`
    
    const existing = this.errorCounts.get(key)
    if (existing) {
      existing.count++
      existing.lastSeen = now
    } else {
      this.errorCounts.set(key, {
        count: 1,
        firstSeen: now,
        lastSeen: now
      })
    }

    const errorCount = this.errorCounts.get(key)!
    
    // Verificar si se alcanzó el umbral (solo en servidor)
    if (errorCount.count >= pattern.threshold && this.alertSystem) {
      await this.triggerAlert(pattern, errorCount, errorMessage, context)
      
      // Limpiar contador para evitar spam de alertas
      this.errorCounts.delete(key)
    }
  }

  private async triggerAlert(
    pattern: ErrorPattern,
    errorCount: { count: number; firstSeen: Date; lastSeen: Date },
    errorMessage: string,
    context?: Record<string, any>
  ): Promise<void> {
    const alert = {
      id: `pattern_${pattern.id}_${Date.now()}`,
      title: `Error Pattern Detected: ${pattern.name}`,
      message: `Pattern "${pattern.name}" detected ${errorCount.count} times in ${pattern.timeWindow} minutes`,
      severity: pattern.severity,
      details: {
        pattern: pattern.name,
        description: pattern.description,
        count: errorCount.count,
        threshold: pattern.threshold,
        timeWindow: pattern.timeWindow,
        firstSeen: errorCount.firstSeen.toISOString(),
        lastSeen: errorCount.lastSeen.toISOString(),
        lastError: errorMessage,
        context
      }
    }

    // Enviar notificaciones
    if (this.config.notificationChannels.includes('email')) {
      await this.sendEmailAlert(alert)
    }

    if (this.config.notificationChannels.includes('slack')) {
      await this.sendSlackAlert(alert)
    }

    logger.warn(LogLevel.WARN, 'Error pattern alert triggered', alert, LogCategory.SYSTEM)
  }

  private async sendEmailAlert(alert: any): Promise<void> {
    try {
      await emailService.sendNotification({
        to: ['admin@example.com'], // Configurar emails de admin
        subject: `🚨 ${alert.title}`,
        template: 'error-pattern-alert',
        data: alert,
        priority: alert.severity === 'critical' ? 'high' : 'normal'
      })
    } catch (error) {
      logger.error(LogLevel.ERROR, 'Failed to send email alert', { error }, LogCategory.SYSTEM)
    }
  }

  private async sendSlackAlert(alert: any): Promise<void> {
    try {
      await slackService.sendErrorAlert({
        error: alert.message,
        context: alert.title,
        timestamp: new Date(),
        severity: alert.severity
      })
    } catch (error) {
      logger.error(LogLevel.ERROR, 'Failed to send Slack alert', { error }, LogCategory.SYSTEM)
    }
  }

  /**
   * Realiza verificación de salud del sistema
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const health = await this.getSystemHealth()
      
      // Verificar umbrales críticos
      if (health.status === 'critical' || health.status === 'down') {
        await this.handleCriticalHealth(health)
      } else if (health.status === 'warning') {
        await this.handleWarningHealth(health)
      }

      // Actualizar métricas si está disponible
      if (this.metricsCollector) {
        await this.metricsCollector.recordMetric('system_health_score', this.calculateHealthScore(health))
        await this.metricsCollector.recordMetric('system_response_time', health.responseTime)
        await this.metricsCollector.recordMetric('system_error_rate', health.errorRate)
        await this.metricsCollector.recordMetric('system_memory_usage', health.memoryUsage)
        await this.metricsCollector.recordMetric('system_cpu_usage', health.cpuUsage)
      }

    } catch (error) {
      logger.error(LogLevel.ERROR, 'Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, LogCategory.SYSTEM)
    }
  }

  private async getSystemHealth(): Promise<SystemHealth> {
    const issues: HealthIssue[] = []
    let status: SystemHealth['status'] = 'healthy'

    // Simular verificaciones de salud (en producción, estas serían verificaciones reales)
    const responseTime = Math.random() * 1000 + 200 // 200-1200ms
    const errorRate = Math.random() * 5 // 0-5%
    const memoryUsage = Math.random() * 40 + 40 // 40-80%
    const cpuUsage = Math.random() * 30 + 20 // 20-50%
    const activeConnections = Math.floor(Math.random() * 100) + 50

    // Verificar umbrales
    if (responseTime > this.config.responseTimeThreshold) {
      issues.push({
        id: 'high_response_time',
        type: 'performance',
        severity: 'medium',
        message: 'High response time detected',
        details: { responseTime, threshold: this.config.responseTimeThreshold },
        firstDetected: new Date(),
        lastSeen: new Date(),
        count: 1
      })
      status = 'warning'
    }

    if (errorRate > this.config.errorThreshold) {
      issues.push({
        id: 'high_error_rate',
        type: 'error',
        severity: 'high',
        message: 'High error rate detected',
        details: { errorRate, threshold: this.config.errorThreshold },
        firstDetected: new Date(),
        lastSeen: new Date(),
        count: 1
      })
      status = 'critical'
    }

    if (memoryUsage > this.config.memoryThreshold) {
      issues.push({
        id: 'high_memory_usage',
        type: 'resource',
        severity: 'medium',
        message: 'High memory usage detected',
        details: { memoryUsage, threshold: this.config.memoryThreshold },
        firstDetected: new Date(),
        lastSeen: new Date(),
        count: 1
      })
      if (status === 'healthy') status = 'warning'
    }

    return {
      status,
      uptime: typeof process !== 'undefined' && process.uptime ? process.uptime() : Date.now() / 1000,
      responseTime,
      errorRate,
      memoryUsage,
      cpuUsage,
      activeConnections,
      lastCheck: new Date(),
      issues
    }
  }

  private calculateHealthScore(health: SystemHealth): number {
    let score = 100
    
    health.issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 30
          break
        case 'high':
          score -= 20
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    })

    return Math.max(0, score)
  }

  private async handleCriticalHealth(health: SystemHealth): Promise<void> {
    logger.error(LogLevel.ERROR, 'Critical system health detected', { health }, LogCategory.SYSTEM)
    
    // Enviar alertas críticas
    await this.sendSlackAlert({
      title: '🚨 CRITICAL: System Health Alert',
      message: 'System health is critical - immediate attention required',
      severity: 'critical',
      details: health
    })

    // Auto-recovery si está habilitado
    if (this.config.enableAutoRecovery) {
      await this.attemptAutoRecovery(health)
    }
  }

  private async handleWarningHealth(health: SystemHealth): Promise<void> {
    logger.warn(LogLevel.WARN, 'System health warning', { health }, LogCategory.SYSTEM)
  }

  private async attemptAutoRecovery(health: SystemHealth): Promise<void> {
    logger.info(LogLevel.INFO, 'Attempting auto-recovery', { health }, LogCategory.SYSTEM)
    
    // Implementar lógica de auto-recuperación
    // Por ejemplo: reiniciar servicios, limpiar cache, etc.
  }

  /**
   * Configuración del servicio
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (this.config.enabled && !this.monitoringInterval) {
      this.start()
    } else if (!this.config.enabled && this.monitoringInterval) {
      this.stop()
    }
  }

  getConfig(): MonitoringConfig {
    return { ...this.config }
  }

  /**
   * Gestión de patrones de error
   */
  addErrorPattern(pattern: ErrorPattern): void {
    this.errorPatterns.set(pattern.id, pattern)
    logger.info(LogLevel.INFO, 'Error pattern added', { patternId: pattern.id }, LogCategory.SYSTEM)
  }

  removeErrorPattern(patternId: string): void {
    this.errorPatterns.delete(patternId)
    logger.info(LogLevel.INFO, 'Error pattern removed', { patternId }, LogCategory.SYSTEM)
  }

  getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values())
  }

  /**
   * Obtener estadísticas de monitoreo
   */
  async getMonitoringStats(): Promise<{
    totalErrors: number
    activePatterns: number
    recentAlerts: number
    systemHealth: SystemHealth
  }> {
    const totalErrors = Array.from(this.errorCounts.values())
      .reduce((sum, count) => sum + count.count, 0)
    
    const activePatterns = Array.from(this.errorPatterns.values())
      .filter(p => p.isActive).length
    
    const recentAlerts = this.alertSystem ? 
      Array.from(this.errorCounts.values())
        .filter(count => Date.now() - count.lastSeen.getTime() < 24 * 60 * 60 * 1000).length
      : 0
    
    const systemHealth = await this.getSystemHealth()

    return {
      totalErrors,
      activePatterns,
      recentAlerts,
      systemHealth
    }
  }
}

// Instancia singleton
export const proactiveMonitoring = ProactiveMonitoringService.getInstance()

// Funciones de conveniencia
export const reportError = (error: Error | string, context?: Record<string, any>) =>
  proactiveMonitoring.reportError(error, context)

export const startMonitoring = () => proactiveMonitoring.start()
export const stopMonitoring = () => proactiveMonitoring.stop()