// ===================================
// PINTEYA E-COMMERCE - ENTERPRISE MONITORING MANAGER
// Sistema de monitoreo enterprise con error tracking, performance y analytics
// ===================================

// Importar performance hooks solo en servidor
const perfHooks = typeof window === 'undefined' ? require('perf_hooks') : null

// ===================================
// TIPOS Y INTERFACES ESPECÍFICAS
// ===================================

// Tipos base para métricas
type MetricValue = number
type MetricTimestamp = Date
type MetricContext = Record<string, string | number | boolean>

// Interfaces específicas para Core Web Vitals
interface CoreWebVitals {
  lcp?: MetricValue // Largest Contentful Paint
  fid?: MetricValue // First Input Delay
  cls?: MetricValue // Cumulative Layout Shift
}

// Interfaces específicas para métricas personalizadas
interface CustomPerformanceMetrics {
  loadTime: MetricValue
  renderTime: MetricValue
  memoryUsage: MetricValue
  bundleSize: MetricValue
}

// Interfaces específicas para métricas de API
interface ApiMetrics {
  apiResponseTime: MetricValue
  apiErrorRate: MetricValue
}

// Interfaces específicas para métricas de usuario
interface UserMetrics {
  sessionDuration: MetricValue
  pageViews: MetricValue
  bounceRate: MetricValue
}

// Interface específica para contexto de métricas
interface MetricsContext {
  page: string
  userId?: string
  sessionId: string
  device: string
  browser: string
}

interface ErrorEvent {
  id: string
  timestamp: MetricTimestamp
  message: string
  stack?: string
  level: 'info' | 'warning' | 'error' | 'critical'
  context: {
    userId?: string
    sessionId: string
    url: string
    userAgent: string
    component?: string
    action?: string
  }
  tags: string[]
  fingerprint: string
  count: number
}

interface PerformanceMetrics {
  timestamp: MetricTimestamp
  metrics: CoreWebVitals & CustomPerformanceMetrics & ApiMetrics & UserMetrics
  context: MetricsContext
}

// Tipos específicos para alertas
type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
type AlertOperator = '>' | '<' | '=' | '>=' | '<='
type AlertMetricName = string

// Interface específica para contexto de alertas
interface AlertContext {
  page?: string
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  metadata?: Record<string, string | number | boolean>
}

// Interfaces específicas para configuración de monitoreo
interface ErrorTrackingConfig {
  enabled: boolean
  sampleRate: number
  ignoreErrors: string[]
  maxBreadcrumbs: number
}

interface PerformanceThresholds {
  lcp: MetricValue
  fid: MetricValue
  cls: MetricValue
  loadTime: MetricValue
}

interface PerformanceConfig {
  enabled: boolean
  sampleRate: number
  thresholds: PerformanceThresholds
}

interface AlertChannels {
  email?: string[]
  slack?: string
  webhook?: string
}

interface AlertsConfig {
  enabled: boolean
  channels: AlertChannels
}

interface AlertRule {
  id: string
  name: string
  metric: AlertMetricName
  threshold: MetricValue
  operator: AlertOperator
  severity: AlertSeverity
  enabled: boolean
  cooldown: number // minutes
  lastTriggered?: MetricTimestamp
}

interface AlertEvent {
  id: string
  ruleId: string
  timestamp: MetricTimestamp
  severity: AlertSeverity
  message: string
  value: MetricValue
  threshold: MetricValue
  context: AlertContext
  acknowledged: boolean
  resolvedAt?: MetricTimestamp
}

interface MonitoringConfig {
  errorTracking: ErrorTrackingConfig
  performance: PerformanceConfig
  alerts: AlertsConfig
}

// ===================================
// INTERFACES
// ===================================

// Interface para Navigation Timing
interface NavigationTiming extends PerformanceEntry {
  loadEventEnd: number
  loadEventStart: number
  domContentLoadedEventEnd: number
  domContentLoadedEventStart: number
}

// Interface para Performance Memory
interface PerformanceMemory {
  usedJSHeapSize: number
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory
}

// ===================================
// ENTERPRISE MONITORING MANAGER
// ===================================
// CLASE PRINCIPAL
// ===================================

class EnterpriseMonitoringManager {
  private static instance: EnterpriseMonitoringManager
  private config: MonitoringConfig
  private errors: Map<string, ErrorEvent> = new Map()
  private performanceData: PerformanceMetrics[] = []
  private alertRules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, AlertEvent> = new Map()
  private sessionId: string

  constructor(config: MonitoringConfig) {
    this.config = config
    this.sessionId = this.generateSessionId()
    this.initializeDefaultAlertRules()
    this.startPerformanceMonitoring()
  }

  static getInstance(config?: MonitoringConfig): EnterpriseMonitoringManager {
    if (!EnterpriseMonitoringManager.instance) {
      if (!config) {
        throw new Error('Configuration required for first initialization')
      }
      EnterpriseMonitoringManager.instance = new EnterpriseMonitoringManager(config)
    }
    return EnterpriseMonitoringManager.instance
  }

  // ===================================
  // ERROR TRACKING
  // ===================================

  /**
   * Capturar y procesar error
   */
  captureError(
    error: Error | string,
    level: ErrorEvent['level'] = 'error',
    context: Partial<ErrorEvent['context']> = {},
    tags: string[] = []
  ): string {
    if (!this.config.errorTracking.enabled) {
      return ''
    }

    // Sample rate check
    if (Math.random() > this.config.errorTracking.sampleRate) {
      return ''
    }

    const errorMessage = typeof error === 'string' ? error : error.message
    const stack = typeof error === 'string' ? undefined : error.stack

    // Check if error should be ignored
    if (this.config.errorTracking.ignoreErrors.some(pattern => errorMessage.includes(pattern))) {
      return ''
    }

    const fingerprint = this.generateErrorFingerprint(errorMessage, stack)
    const errorId = this.generateErrorId()

    const errorEvent: ErrorEvent = {
      id: errorId,
      timestamp: new Date(),
      message: errorMessage,
      stack,
      level,
      context: {
        sessionId: this.sessionId,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        ...context,
      },
      tags,
      fingerprint,
      count: 1,
    }

    // Check if error already exists (deduplication)
    const existingError = Array.from(this.errors.values()).find(e => e.fingerprint === fingerprint)

    if (existingError) {
      existingError.count++
      existingError.timestamp = new Date()
    } else {
      this.errors.set(errorId, errorEvent)
    }

    // Check alert rules
    this.checkErrorAlerts(errorEvent)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Monitoring] Error captured:', errorEvent)
    }

    return errorId
  }

  /**
   * Obtener errores con filtros
   */
  getErrors(
    filters: {
      level?: ErrorEvent['level']
      timeRange?: { start: Date; end: Date }
      component?: string
      limit?: number
    } = {}
  ): ErrorEvent[] {
    let errors = Array.from(this.errors.values())

    // Apply filters
    if (filters.level) {
      errors = errors.filter(e => e.level === filters.level)
    }

    if (filters.timeRange) {
      errors = errors.filter(
        e => e.timestamp >= filters.timeRange!.start && e.timestamp <= filters.timeRange!.end
      )
    }

    if (filters.component) {
      errors = errors.filter(e => e.context.component === filters.component)
    }

    // Sort by timestamp (newest first)
    errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply limit
    if (filters.limit) {
      errors = errors.slice(0, filters.limit)
    }

    return errors
  }

  // ===================================
  // PERFORMANCE MONITORING
  // ===================================

  /**
   * Inicializar monitoreo de performance
   */
  private startPerformanceMonitoring(): void {
    if (!this.config.performance.enabled || typeof window === 'undefined') {
      return
    }

    // Monitor Core Web Vitals
    this.monitorWebVitals()

    // Monitor custom metrics every 30 seconds
    setInterval(() => {
      this.capturePerformanceMetrics()
    }, 30000)

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.capturePerformanceMetrics()
      }
    })
  }

  /**
   * Monitorear Core Web Vitals
   */
  private monitorWebVitals(): void {
    // LCP - Largest Contentful Paint
    new PerformanceObserver(entryList => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.recordMetric('lcp', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // FID - First Input Delay
    // Interfaces para Performance Observer entries
    interface PerformanceEventTiming extends PerformanceEntry {
      processingStart: number
      startTime: number
    }

    interface LayoutShiftEntry extends PerformanceEntry {
      value: number
      hadRecentInput: boolean
    }

    new PerformanceObserver(entryList => {
      const entries = entryList.getEntries()
      entries.forEach((entry: PerformanceEventTiming) => {
        this.recordMetric('fid', entry.processingStart - entry.startTime)
      })
    }).observe({ entryTypes: ['first-input'] })

    // CLS - Cumulative Layout Shift
    let clsValue = 0
    new PerformanceObserver(entryList => {
      const entries = entryList.getEntries()
      entries.forEach((entry: LayoutShiftEntry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.recordMetric('cls', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }

  /**
   * Capturar métricas de performance
   */
  capturePerformanceMetrics(): void {
    if (!this.config.performance.enabled) {
      return
    }

    // Sample rate check
    if (Math.random() > this.config.performance.sampleRate) {
      return
    }

    const metrics: PerformanceMetrics = {
      timestamp: new Date(),
      metrics: {
        loadTime: this.getLoadTime(),
        renderTime: this.getRenderTime(),
        memoryUsage: this.getMemoryUsage(),
        bundleSize: this.getBundleSize(),
        apiResponseTime: this.getAverageApiResponseTime(),
        apiErrorRate: this.getApiErrorRate(),
        sessionDuration: this.getSessionDuration(),
        pageViews: this.getPageViews(),
        bounceRate: this.getBounceRate(),
      },
      context: {
        page: typeof window !== 'undefined' ? window.location.pathname : '',
        sessionId: this.sessionId,
        device: this.getDeviceType(),
        browser: this.getBrowserType(),
        userId: this.getUserId(),
      },
    }

    this.performanceData.push(metrics)

    // Keep only last 1000 entries
    if (this.performanceData.length > 1000) {
      this.performanceData = this.performanceData.slice(-1000)
    }

    // Check performance alerts
    this.checkPerformanceAlerts(metrics)

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Monitoring] Performance metrics captured:', metrics)
    }
  }

  /**
   * Registrar métrica específica
   */
  recordMetric(name: string, value: number, context: MetricContext = {}): void {
    const metric = {
      name,
      value,
      timestamp: new Date(),
      context: {
        sessionId: this.sessionId,
        ...context,
      },
    }

    // Check if metric triggers alerts
    this.checkMetricAlerts(name, value)

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Monitoring] Metric recorded: ${name} = ${value}`, metric)
    }
  }

  // ===================================
  // ALERT SYSTEM
  // ===================================

  /**
   * Inicializar reglas de alerta por defecto
   */
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        metric: 'error_rate',
        threshold: 0.05, // 5%
        operator: '>',
        severity: 'high',
        enabled: true,
        cooldown: 15,
      },
      {
        id: 'slow-page-load',
        name: 'Slow Page Load',
        metric: 'load_time',
        threshold: 3000, // 3 seconds
        operator: '>',
        severity: 'medium',
        enabled: true,
        cooldown: 10,
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        metric: 'memory_usage',
        threshold: 100, // 100MB
        operator: '>',
        severity: 'medium',
        enabled: true,
        cooldown: 20,
      },
      {
        id: 'poor-lcp',
        name: 'Poor Largest Contentful Paint',
        metric: 'lcp',
        threshold: 2500, // 2.5 seconds
        operator: '>',
        severity: 'medium',
        enabled: true,
        cooldown: 15,
      },
    ]

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule)
    })
  }

  /**
   * Verificar alertas de errores
   */
  private checkErrorAlerts(errorEvent: ErrorEvent): void {
    // Calculate error rate
    const recentErrors = this.getErrors({
      timeRange: {
        start: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        end: new Date(),
      },
    })

    const errorRate = recentErrors.length / 100 // Assuming 100 requests per 5 minutes

    this.checkMetricAlerts('error_rate', errorRate)

    // Check for critical errors
    if (errorEvent.level === 'critical') {
      this.triggerAlert('critical-error', {
        message: `Critical error occurred: ${errorEvent.message}`,
        value: 1,
        threshold: 0,
        context: errorEvent,
      })
    }
  }

  /**
   * Verificar alertas de performance
   */
  private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    const { metrics: m } = metrics

    // Check each metric against alert rules
    Object.entries(m).forEach(([metricName, value]) => {
      if (typeof value === 'number') {
        this.checkMetricAlerts(metricName, value)
      }
    })
  }

  /**
   * Verificar alertas para una métrica específica
   */
  private checkMetricAlerts(metricName: string, value: number): void {
    const relevantRules = Array.from(this.alertRules.values()).filter(
      rule => rule.metric === metricName && rule.enabled
    )

    relevantRules.forEach(rule => {
      const shouldTrigger = this.evaluateAlertCondition(rule, value)

      if (shouldTrigger && this.canTriggerAlert(rule)) {
        this.triggerAlert(rule.id, {
          message: `${rule.name}: ${metricName} is ${value} (threshold: ${rule.threshold})`,
          value,
          threshold: rule.threshold,
          context: { metricName, rule },
        })
      }
    })
  }

  /**
   * Evaluar condición de alerta
   */
  private evaluateAlertCondition(rule: AlertRule, value: number): boolean {
    switch (rule.operator) {
      case '>':
        return value > rule.threshold
      case '<':
        return value < rule.threshold
      case '>=':
        return value >= rule.threshold
      case '<=':
        return value <= rule.threshold
      case '=':
        return value === rule.threshold
      default:
        return false
    }
  }

  /**
   * Verificar si se puede disparar alerta (cooldown)
   */
  private canTriggerAlert(rule: AlertRule): boolean {
    if (!rule.lastTriggered) {
      return true
    }

    const cooldownMs = rule.cooldown * 60 * 1000
    const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime()

    return timeSinceLastTrigger >= cooldownMs
  }

  /**
   * Disparar alerta
   */
  private triggerAlert(
    ruleId: string,
    alertData: {
      message: string
      value: number
      threshold: number
      context: AlertContext
    }
  ): void {
    const rule = this.alertRules.get(ruleId)
    if (!rule) {
      return
    }

    const alertId = this.generateAlertId()
    const alert: AlertEvent = {
      id: alertId,
      ruleId,
      timestamp: new Date(),
      severity: rule.severity,
      message: alertData.message,
      value: alertData.value,
      threshold: alertData.threshold,
      context: alertData.context,
      acknowledged: false,
    }

    this.activeAlerts.set(alertId, alert)
    rule.lastTriggered = new Date()

    // Send notifications
    this.sendAlertNotifications(alert)

    console.warn('[Monitoring] Alert triggered:', alert)
  }

  /**
   * Enviar notificaciones de alerta
   */
  private async sendAlertNotifications(alert: AlertEvent): Promise<void> {
    if (!this.config.alerts.enabled) {
      return
    }

    const { channels } = this.config.alerts

    // Email notifications
    if (channels.email && channels.email.length > 0) {
      // Implementation would integrate with email service
      console.log(`[Monitoring] Email alert sent to: ${channels.email.join(', ')}`)
    }

    // Slack notifications
    if (channels.slack) {
      // Implementation would integrate with Slack webhook
      console.log(`[Monitoring] Slack alert sent to: ${channels.slack}`)
    }

    // Webhook notifications
    if (channels.webhook) {
      try {
        // Implementation would send HTTP POST to webhook
        console.log(`[Monitoring] Webhook alert sent to: ${channels.webhook}`)
      } catch (error) {
        console.error('[Monitoring] Failed to send webhook alert:', error)
      }
    }
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateErrorFingerprint(message: string, stack?: string): string {
    const content = `${message}${stack || ''}`
    // Simple hash function for fingerprinting
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  private getLoadTime(): number {
    if (typeof window === 'undefined') {
      return 0
    }
    const navigation = performance.getEntriesByType('navigation')[0] as NavigationTiming
    return navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0
  }

  private getRenderTime(): number {
    if (typeof window === 'undefined') {
      return 0
    }
    const navigation = performance.getEntriesByType('navigation')[0] as NavigationTiming
    return navigation
      ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      : 0
  }

  private getMemoryUsage(): number {
    if (typeof window === 'undefined' || !(performance as PerformanceWithMemory).memory) {
      return 0
    }
    return (performance as PerformanceWithMemory).memory!.usedJSHeapSize / 1024 / 1024 // MB
  }

  private getBundleSize(): number {
    // This would be calculated based on loaded resources
    return 0 // Placeholder
  }

  private getAverageApiResponseTime(): number {
    // This would be calculated from API call metrics
    return 0 // Placeholder
  }

  private getApiErrorRate(): number {
    // This would be calculated from API call metrics
    return 0 // Placeholder
  }

  private getSessionDuration(): number {
    return Date.now() - parseInt(this.sessionId.split('_')[1])
  }

  private getPageViews(): number {
    // This would be tracked separately
    return 1 // Placeholder
  }

  private getBounceRate(): number {
    // This would be calculated from user behavior
    return 0 // Placeholder
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') {
      return 'unknown'
    }
    const width = window.innerWidth
    if (width < 768) {
      return 'mobile'
    }
    if (width < 1024) {
      return 'tablet'
    }
    return 'desktop'
  }

  private getBrowserType(): string {
    if (typeof navigator === 'undefined') {
      return 'unknown'
    }
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) {
      return 'chrome'
    }
    if (userAgent.includes('Firefox')) {
      return 'firefox'
    }
    if (userAgent.includes('Safari')) {
      return 'safari'
    }
    if (userAgent.includes('Edge')) {
      return 'edge'
    }
    return 'other'
  }

  private getUserId(): string | undefined {
    // This would be retrieved from authentication context
    return undefined // Placeholder
  }

  // ===================================
  // PUBLIC API
  // ===================================

  /**
   * Obtener métricas de performance
   */
  getPerformanceMetrics(timeRange?: { start: Date; end: Date }): PerformanceMetrics[] {
    let data = this.performanceData

    if (timeRange) {
      data = data.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end)
    }

    return data
  }

  /**
   * Obtener alertas activas
   */
  getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.resolvedAt)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Reconocer alerta
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
      return true
    }
    return false
  }

  /**
   * Resolver alerta
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.resolvedAt = new Date()
      return true
    }
    return false
  }

  /**
   * Obtener resumen de monitoreo
   */
  getMonitoringSummary() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const recentErrors = this.getErrors({
      timeRange: { start: oneHourAgo, end: now },
    })

    const recentMetrics = this.getPerformanceMetrics({
      start: oneHourAgo,
      end: now,
    })

    const activeAlerts = this.getActiveAlerts()

    return {
      errors: {
        total: recentErrors.length,
        critical: recentErrors.filter(e => e.level === 'critical').length,
        warning: recentErrors.filter(e => e.level === 'warning').length,
      },
      performance: {
        averageLoadTime:
          recentMetrics.length > 0
            ? recentMetrics.reduce((sum, m) => sum + m.metrics.loadTime, 0) / recentMetrics.length
            : 0,
        averageMemoryUsage:
          recentMetrics.length > 0
            ? recentMetrics.reduce((sum, m) => sum + m.metrics.memoryUsage, 0) /
              recentMetrics.length
            : 0,
      },
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        unacknowledged: activeAlerts.filter(a => !a.acknowledged).length,
      },
      system: {
        uptime: this.getSessionDuration(),
        sessionId: this.sessionId,
      },
    }
  }
}

// ===================================
// EXPORTS
// ===================================

export default EnterpriseMonitoringManager

export type { ErrorEvent, PerformanceMetrics, AlertRule, AlertEvent, MonitoringConfig }
