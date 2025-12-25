// ===================================
// PRODUCTION MONITORING CONFIGURATION
// Sistema completo de monitoreo para producción
// ===================================

export interface ProductionMonitoringConfig {
  // Core Web Vitals thresholds
  webVitals: {
    LCP: { good: number; needsImprovement: number }
    FID: { good: number; needsImprovement: number }
    CLS: { good: number; needsImprovement: number }
  }

  // Performance budgets
  performance: {
    bundleSize: number // KB
    firstLoadJS: number // KB
    buildTime: number // ms
    apiResponseTime: number // ms
  }

  // Monitoring endpoints
  endpoints: {
    metrics: string
    alerts: string
    healthCheck: string
    analytics: string
  }

  // Alert configuration
  alerts: {
    enabled: boolean
    channels: string[]
    thresholds: {
      errorRate: number
      responseTime: number
      memoryUsage: number
    }
  }

  // Data retention
  retention: {
    metrics: number // days
    logs: number // days
    analytics: number // days
  }
}

export const productionMonitoringConfig: ProductionMonitoringConfig = {
  webVitals: {
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
  },

  performance: {
    bundleSize: 4096, // 4MB
    firstLoadJS: 600, // 600KB
    buildTime: 45000, // 45s
    apiResponseTime: 2000, // 2s
  },

  endpoints: {
    metrics: '/api/admin/performance/metrics',
    alerts: '/api/admin/monitoring/alerts',
    healthCheck: '/api/health',
    analytics: '/api/analytics/events',
  },

  alerts: {
    enabled: process.env.NODE_ENV === 'production',
    channels: ['console', 'webhook'],
    thresholds: {
      errorRate: 0.05, // 5%
      responseTime: 2000, // 2s
      memoryUsage: 0.85, // 85%
    },
  },

  retention: {
    metrics: 30, // 30 days
    logs: 7, // 7 days
    analytics: 90, // 90 days
  },
}

// ===================================
// MONITORING UTILITIES
// ===================================

export class ProductionMonitor {
  private config: ProductionMonitoringConfig
  private metricsBuffer: any[] = []
  private flushInterval: NodeJS.Timeout | null = null
  
  // ⚡ OPTIMIZACIÓN: Sample rate para reducir overhead
  private readonly sampleRate = parseFloat(
    process.env.PERFORMANCE_MONITORING_SAMPLE_RATE || '0.1'
  )
  
  // ⚡ OPTIMIZACIÓN: Buffer size reducido
  private readonly maxBufferSize = 30 // Reducido de 50

  constructor(config: ProductionMonitoringConfig = productionMonitoringConfig) {
    this.config = config
    this.startAutoFlush()
  }

  // Core Web Vitals tracking
  trackWebVital(name: string, value: number, id: string) {
    const metric = {
      name,
      value,
      id,
      timestamp: Date.now(),
      rating: this.getRating(name, value),
    }

    this.addMetric(metric)

    // Send alert if poor performance
    if (metric.rating === 'poor') {
      this.sendAlert(`Poor ${name} detected: ${value}`, 'performance')
    }
  }

  // Performance metrics tracking
  trackPerformance(metric: {
    name: string
    value: number
    category: string
    metadata?: Record<string, any>
  }) {
    // ⚡ OPTIMIZACIÓN: Aplicar muestreo probabilístico
    if (Math.random() >= this.sampleRate) {
      return // No trackear esta métrica
    }

    const enrichedMetric = {
      ...metric,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    }

    this.addMetric(enrichedMetric)

    // Check against performance budgets
    this.checkPerformanceBudget(enrichedMetric)
  }

  // Error tracking
  trackError(error: Error, context?: Record<string, any>) {
    // ⚡ OPTIMIZACIÓN: Siempre trackear errores críticos, pero aplicar muestreo a errores menores
    const isCritical = this.getErrorSeverity(error) === 'critical'
    if (!isCritical && Math.random() >= this.sampleRate) {
      return // No trackear errores no críticos si no pasa el muestreo
    }

    const errorMetric = {
      name: 'error',
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      severity: this.getErrorSeverity(error),
    }

    this.addMetric(errorMetric)
    this.sendAlert(`Error: ${error.message}`, 'error')
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, boolean>
    timestamp: number
  }> {
    const checks = {
      api: await this.checkApiHealth(),
      database: await this.checkDatabaseHealth(),
      memory: this.checkMemoryUsage(),
      performance: this.checkPerformanceHealth(),
    }

    const healthyChecks = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.keys(checks).length

    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (healthyChecks === totalChecks) {
      status = 'healthy'
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    return {
      status,
      checks,
      timestamp: Date.now(),
    }
  }

  // Private methods
  private addMetric(metric: any) {
    this.metricsBuffer.push(metric)

    // ⚡ OPTIMIZACIÓN: Flush si buffer alcanza tamaño máximo reducido
    if (this.metricsBuffer.length >= this.maxBufferSize) {
      this.flushMetrics()
    }
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) {
      return
    }

    const metrics = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      await fetch(this.config.endpoints.metrics, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      })
    } catch (error) {
      console.error('Failed to flush metrics:', error)
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metrics)
    }
  }

  private startAutoFlush() {
    // ⚡ OPTIMIZACIÓN: Aumentar intervalo de flush a 60 segundos
    this.flushInterval = setInterval(() => {
      this.flushMetrics()
    }, 60000) // 60 seconds (aumentado de 30s)
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = this.config.webVitals[name as keyof typeof this.config.webVitals]
    if (!thresholds) {
      return 'good'
    }

    if (value <= thresholds.good) {
      return 'good'
    }
    if (value <= thresholds.needsImprovement) {
      return 'needs-improvement'
    }
    return 'poor'
  }

  private checkPerformanceBudget(metric: any) {
    const { performance } = this.config

    if (metric.name === 'bundleSize' && metric.value > performance.bundleSize) {
      this.sendAlert(
        `Bundle size exceeded: ${metric.value}KB > ${performance.bundleSize}KB`,
        'budget'
      )
    }

    if (metric.name === 'apiResponseTime' && metric.value > performance.apiResponseTime) {
      this.sendAlert(
        `API response time exceeded: ${metric.value}ms > ${performance.apiResponseTime}ms`,
        'budget'
      )
    }
  }

  private sendAlert(message: string, type: string) {
    if (!this.config.alerts.enabled) {
      return
    }

    const alert = {
      message,
      type,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type),
    }

    // Send to configured channels
    this.config.alerts.channels.forEach(channel => {
      this.sendToChannel(channel, alert)
    })
  }

  private sendToChannel(channel: string, alert: any) {
    switch (channel) {
      case 'console':
        console.warn(`[ALERT] ${alert.message}`)
        break
      case 'webhook':
        // Send to webhook endpoint
        fetch(this.config.endpoints.alerts, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert),
        }).catch(console.error)
        break
    }
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('monitoring-session-id')
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15)
        sessionStorage.setItem('monitoring-session-id', sessionId)
      }
      return sessionId
    }
    return 'server'
  }

  private getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'medium'
    }
    if (error.message.includes('TypeError') || error.message.includes('ReferenceError')) {
      return 'high'
    }
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading')) {
      return 'critical'
    }
    return 'low'
  }

  private getAlertSeverity(type: string): 'info' | 'warning' | 'error' | 'critical' {
    switch (type) {
      case 'performance':
        return 'warning'
      case 'error':
        return 'error'
      case 'budget':
        return 'warning'
      default:
        return 'info'
    }
  }

  private async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.config.endpoints.healthCheck, {
        method: 'GET',
        timeout: 5000,
      } as any)
      return response.ok
    } catch {
      return false
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Simple database check - could be enhanced
      const response = await fetch('/api/health/database', {
        method: 'GET',
        timeout: 5000,
      } as any)
      return response.ok
    } catch {
      return false
    }
  }

  private checkMemoryUsage(): boolean {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit
      return usageRatio < this.config.alerts.thresholds.memoryUsage
    }
    return true // Assume healthy if can't measure
  }

  private checkPerformanceHealth(): boolean {
    // Check recent performance metrics
    const recentMetrics = this.metricsBuffer.filter(
      metric => Date.now() - metric.timestamp < 300000 // 5 minutes
    )

    const errorRate = recentMetrics.filter(m => m.name === 'error').length / recentMetrics.length
    return errorRate < this.config.alerts.thresholds.errorRate
  }

  // Cleanup
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flushMetrics() // Final flush
  }
}

// Global monitor instance
export const productionMonitor = new ProductionMonitor()

// React hook for easy integration
export function useProductionMonitoring() {
  return {
    trackWebVital: productionMonitor.trackWebVital.bind(productionMonitor),
    trackPerformance: productionMonitor.trackPerformance.bind(productionMonitor),
    trackError: productionMonitor.trackError.bind(productionMonitor),
    healthCheck: productionMonitor.healthCheck.bind(productionMonitor),
  }
}
