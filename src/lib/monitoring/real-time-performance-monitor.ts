// ===================================
// PINTEYA E-COMMERCE - REAL-TIME PERFORMANCE MONITOR
// ===================================

import { logger, LogCategory } from '../enterprise/logger'
import { getRedisClient } from '../integrations/redis'

/**
 * Métricas de performance en tiempo real
 */
export interface RealTimeMetrics {
  timestamp: number
  responseTime: number
  throughput: number
  errorRate: number
  cpuUsage: number
  memoryUsage: number
  activeConnections: number
  queueSize: number
  cacheHitRate: number
  dbConnectionPool: number
}

/**
 * Core Web Vitals en tiempo real
 */
export interface CoreWebVitals {
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
  inp: number // Interaction to Next Paint
  timestamp: number
}

/**
 * Métricas de API en tiempo real
 */
export interface APIMetrics {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  requestSize: number
  responseSize: number
  userAgent: string
  ip: string
  timestamp: number
}

/**
 * Métricas de base de datos
 */
export interface DatabaseMetrics {
  queryTime: number
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  tableName: string
  rowsAffected: number
  connectionPoolSize: number
  activeConnections: number
  waitingConnections: number
  timestamp: number
}

/**
 * Alertas de performance
 */
export interface PerformanceAlert {
  id: string
  type: 'performance' | 'error' | 'capacity' | 'availability'
  severity: 'low' | 'medium' | 'high' | 'critical'
  metric: string
  value: number
  threshold: number
  message: string
  timestamp: number
  resolved: boolean
  resolvedAt?: number
  escalated: boolean
  escalatedAt?: number
}

/**
 * Configuración de umbrales
 */
export interface PerformanceThresholds {
  responseTime: {
    warning: number
    critical: number
  }
  errorRate: {
    warning: number
    critical: number
  }
  cpuUsage: {
    warning: number
    critical: number
  }
  memoryUsage: {
    warning: number
    critical: number
  }
  coreWebVitals: {
    lcp: { good: number; poor: number }
    fid: { good: number; poor: number }
    cls: { good: number; poor: number }
    fcp: { good: number; poor: number }
    ttfb: { good: number; poor: number }
  }
}

/**
 * Configuración por defecto de umbrales
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  responseTime: {
    warning: 1000, // 1 segundo
    critical: 3000, // 3 segundos
  },
  errorRate: {
    warning: 0.05, // 5%
    critical: 0.1, // 10%
  },
  cpuUsage: {
    warning: 0.7, // 70%
    critical: 0.9, // 90%
  },
  memoryUsage: {
    warning: 0.8, // 80%
    critical: 0.95, // 95%
  },
  coreWebVitals: {
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    fcp: { good: 1800, poor: 3000 },
    ttfb: { good: 800, poor: 1800 },
  },
}

/**
 * Monitor de performance en tiempo real
 */
export class RealTimePerformanceMonitor {
  private static instance: RealTimePerformanceMonitor
  private redis = getRedisClient()
  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
  private alerts: Map<string, PerformanceAlert> = new Map()
  private metricsBuffer: RealTimeMetrics[] = []
  private webVitalsBuffer: CoreWebVitals[] = []
  private apiMetricsBuffer: APIMetrics[] = []
  private dbMetricsBuffer: DatabaseMetrics[] = []
  private subscribers: Set<(data: any) => void> = new Set()
  private flushInterval?: NodeJS.Timeout
  private monitoringInterval?: NodeJS.Timeout

  private constructor() {
    // ⚡ FIX: Deshabilitar monitoreo durante build
    if (this.isBuildTime()) {
      return
    }
    this.startMonitoring()
    this.startPeriodicFlush()
  }

  /**
   * Verifica si estamos en tiempo de build
   */
  private isBuildTime(): boolean {
    return (
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.DISABLE_MONITORING === 'true' ||
      (process.env.VERCEL && !process.env.VERCEL_ENV)
    )
  }

  static getInstance(): RealTimePerformanceMonitor {
    if (!RealTimePerformanceMonitor.instance) {
      RealTimePerformanceMonitor.instance = new RealTimePerformanceMonitor()
    }
    return RealTimePerformanceMonitor.instance
  }

  /**
   * Inicia el monitoreo en tiempo real
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics()
    }, 5000) // Cada 5 segundos

    logger.info(LogCategory.MONITORING, 'Real-time performance monitoring started')
  }

  /**
   * Inicia el flush periódico de métricas
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushMetricsToRedis()
    }, 30000) // Cada 30 segundos
  }

  /**
   * Recolecta métricas del sistema
   */
  private async collectSystemMetrics(): Promise<void> {
    // ⚡ FIX: Deshabilitar durante build time
    // Previene alertas de memoria/CPU durante compilación
    if (this.isBuildTime()) {
      return
    }

    try {
      const metrics: RealTimeMetrics = {
        timestamp: Date.now(),
        responseTime: await this.getAverageResponseTime(),
        throughput: await this.getCurrentThroughput(),
        errorRate: await this.getCurrentErrorRate(),
        cpuUsage: await this.getCPUUsage(),
        memoryUsage: await this.getMemoryUsage(),
        activeConnections: await this.getActiveConnections(),
        queueSize: await this.getQueueSize(),
        cacheHitRate: await this.getCacheHitRate(),
        dbConnectionPool: await this.getDBConnectionPoolSize(),
      }

      this.metricsBuffer.push(metrics)

      // Mantener solo las últimas 100 métricas en buffer
      if (this.metricsBuffer.length > 100) {
        this.metricsBuffer = this.metricsBuffer.slice(-100)
      }

      // Verificar umbrales y generar alertas
      await this.checkThresholds(metrics)

      // Notificar a suscriptores
      this.notifySubscribers('metrics', metrics)
    } catch (error) {
      logger.error(LogCategory.MONITORING, 'Error collecting system metrics', error as Error)
    }
  }

  /**
   * Registra métricas de Core Web Vitals
   */
  recordWebVitals(vitals: Omit<CoreWebVitals, 'timestamp'>): void {
    const webVitals: CoreWebVitals = {
      ...vitals,
      timestamp: Date.now(),
    }

    this.webVitalsBuffer.push(webVitals)

    // Mantener solo las últimas 50 métricas
    if (this.webVitalsBuffer.length > 50) {
      this.webVitalsBuffer = this.webVitalsBuffer.slice(-50)
    }

    // Verificar umbrales de Core Web Vitals
    this.checkWebVitalsThresholds(webVitals)

    // Notificar a suscriptores
    this.notifySubscribers('webVitals', webVitals)
  }

  /**
   * Registra métricas de API
   */
  recordAPIMetrics(metrics: Omit<APIMetrics, 'timestamp'>): void {
    const apiMetrics: APIMetrics = {
      ...metrics,
      timestamp: Date.now(),
    }

    this.apiMetricsBuffer.push(apiMetrics)

    // Mantener solo las últimas 200 métricas
    if (this.apiMetricsBuffer.length > 200) {
      this.apiMetricsBuffer = this.apiMetricsBuffer.slice(-200)
    }

    // Verificar umbrales de API
    this.checkAPIThresholds(apiMetrics)

    // Notificar a suscriptores
    this.notifySubscribers('apiMetrics', apiMetrics)
  }

  /**
   * Registra métricas de base de datos
   */
  recordDatabaseMetrics(metrics: Omit<DatabaseMetrics, 'timestamp'>): void {
    const dbMetrics: DatabaseMetrics = {
      ...metrics,
      timestamp: Date.now(),
    }

    this.dbMetricsBuffer.push(dbMetrics)

    // Mantener solo las últimas 100 métricas
    if (this.dbMetricsBuffer.length > 100) {
      this.dbMetricsBuffer = this.dbMetricsBuffer.slice(-100)
    }

    // Verificar umbrales de DB
    this.checkDatabaseThresholds(dbMetrics)

    // Notificar a suscriptores
    this.notifySubscribers('dbMetrics', dbMetrics)
  }

  /**
   * Verifica umbrales y genera alertas
   */
  private async checkThresholds(metrics: RealTimeMetrics): Promise<void> {
    // ⚡ FIX: Deshabilitar alertas durante build
    if (this.isBuildTime()) {
      return
    }

    // Verificar tiempo de respuesta
    if (metrics.responseTime > this.thresholds.responseTime.critical) {
      await this.createAlert(
        'performance',
        'critical',
        'responseTime',
        metrics.responseTime,
        this.thresholds.responseTime.critical,
        `Response time crítico: ${metrics.responseTime}ms`
      )
    } else if (metrics.responseTime > this.thresholds.responseTime.warning) {
      await this.createAlert(
        'performance',
        'medium',
        'responseTime',
        metrics.responseTime,
        this.thresholds.responseTime.warning,
        `Response time alto: ${metrics.responseTime}ms`
      )
    }

    // Verificar tasa de errores
    if (metrics.errorRate > this.thresholds.errorRate.critical) {
      await this.createAlert(
        'error',
        'critical',
        'errorRate',
        metrics.errorRate,
        this.thresholds.errorRate.critical,
        `Tasa de errores crítica: ${(metrics.errorRate * 100).toFixed(1)}%`
      )
    } else if (metrics.errorRate > this.thresholds.errorRate.warning) {
      await this.createAlert(
        'error',
        'medium',
        'errorRate',
        metrics.errorRate,
        this.thresholds.errorRate.warning,
        `Tasa de errores alta: ${(metrics.errorRate * 100).toFixed(1)}%`
      )
    }

    // Verificar uso de CPU
    if (metrics.cpuUsage > this.thresholds.cpuUsage.critical) {
      await this.createAlert(
        'capacity',
        'critical',
        'cpuUsage',
        metrics.cpuUsage,
        this.thresholds.cpuUsage.critical,
        `Uso de CPU crítico: ${(metrics.cpuUsage * 100).toFixed(1)}%`
      )
    } else if (metrics.cpuUsage > this.thresholds.cpuUsage.warning) {
      await this.createAlert(
        'capacity',
        'medium',
        'cpuUsage',
        metrics.cpuUsage,
        this.thresholds.cpuUsage.warning,
        `Uso de CPU alto: ${(metrics.cpuUsage * 100).toFixed(1)}%`
      )
    }

    // Verificar uso de memoria
    if (metrics.memoryUsage > this.thresholds.memoryUsage.critical) {
      await this.createAlert(
        'capacity',
        'critical',
        'memoryUsage',
        metrics.memoryUsage,
        this.thresholds.memoryUsage.critical,
        `Uso de memoria crítico: ${(metrics.memoryUsage * 100).toFixed(1)}%`
      )
    } else if (metrics.memoryUsage > this.thresholds.memoryUsage.warning) {
      await this.createAlert(
        'capacity',
        'medium',
        'memoryUsage',
        metrics.memoryUsage,
        this.thresholds.memoryUsage.warning,
        `Uso de memoria alto: ${(metrics.memoryUsage * 100).toFixed(1)}%`
      )
    }
  }

  /**
   * Verifica umbrales de Core Web Vitals
   */
  private checkWebVitalsThresholds(vitals: CoreWebVitals): void {
    const { coreWebVitals } = this.thresholds

    // Verificar LCP
    if (vitals.lcp > coreWebVitals.lcp.poor) {
      this.createAlert(
        'performance',
        'high',
        'lcp',
        vitals.lcp,
        coreWebVitals.lcp.poor,
        `LCP pobre: ${vitals.lcp}ms`
      )
    } else if (vitals.lcp > coreWebVitals.lcp.good) {
      this.createAlert(
        'performance',
        'medium',
        'lcp',
        vitals.lcp,
        coreWebVitals.lcp.good,
        `LCP necesita mejora: ${vitals.lcp}ms`
      )
    }

    // Verificar FID
    if (vitals.fid > coreWebVitals.fid.poor) {
      this.createAlert(
        'performance',
        'high',
        'fid',
        vitals.fid,
        coreWebVitals.fid.poor,
        `FID pobre: ${vitals.fid}ms`
      )
    } else if (vitals.fid > coreWebVitals.fid.good) {
      this.createAlert(
        'performance',
        'medium',
        'fid',
        vitals.fid,
        coreWebVitals.fid.good,
        `FID necesita mejora: ${vitals.fid}ms`
      )
    }

    // Verificar CLS
    if (vitals.cls > coreWebVitals.cls.poor) {
      this.createAlert(
        'performance',
        'high',
        'cls',
        vitals.cls,
        coreWebVitals.cls.poor,
        `CLS pobre: ${vitals.cls}`
      )
    } else if (vitals.cls > coreWebVitals.cls.good) {
      this.createAlert(
        'performance',
        'medium',
        'cls',
        vitals.cls,
        coreWebVitals.cls.good,
        `CLS necesita mejora: ${vitals.cls}`
      )
    }
  }

  /**
   * Verifica umbrales de API
   */
  private checkAPIThresholds(metrics: APIMetrics): void {
    if (metrics.responseTime > this.thresholds.responseTime.critical) {
      this.createAlert(
        'performance',
        'high',
        'apiResponseTime',
        metrics.responseTime,
        this.thresholds.responseTime.critical,
        `API lenta: ${metrics.method} ${metrics.endpoint} - ${metrics.responseTime}ms`
      )
    }

    if (metrics.statusCode >= 500) {
      this.createAlert(
        'error',
        'high',
        'apiError',
        metrics.statusCode,
        500,
        `Error de servidor: ${metrics.method} ${metrics.endpoint} - ${metrics.statusCode}`
      )
    } else if (metrics.statusCode >= 400) {
      this.createAlert(
        'error',
        'medium',
        'apiClientError',
        metrics.statusCode,
        400,
        `Error de cliente: ${metrics.method} ${metrics.endpoint} - ${metrics.statusCode}`
      )
    }
  }

  /**
   * Verifica umbrales de base de datos
   */
  private checkDatabaseThresholds(metrics: DatabaseMetrics): void {
    if (metrics.queryTime > 5000) {
      // 5 segundos
      this.createAlert(
        'performance',
        'high',
        'slowQuery',
        metrics.queryTime,
        5000,
        `Query lenta: ${metrics.queryType} en ${metrics.tableName} - ${metrics.queryTime}ms`
      )
    }

    if (metrics.waitingConnections > 10) {
      this.createAlert(
        'capacity',
        'medium',
        'dbConnectionWait',
        metrics.waitingConnections,
        10,
        `Conexiones esperando: ${metrics.waitingConnections}`
      )
    }
  }

  /**
   * Crea una alerta
   */
  private async createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    metric: string,
    value: number,
    threshold: number,
    message: string
  ): Promise<void> {
    const alertId = `${type}_${metric}_${Date.now()}`

    const alert: PerformanceAlert = {
      id: alertId,
      type,
      severity,
      metric,
      value,
      threshold,
      message,
      timestamp: Date.now(),
      resolved: false,
      escalated: false,
    }

    this.alerts.set(alertId, alert)

    // Notificar a suscriptores
    this.notifySubscribers('alert', alert)

    // Log de la alerta
    logger.warn(LogCategory.MONITORING, `Performance alert: ${message}`, {
      type,
      severity,
      metric,
      value,
      threshold,
    })

    // Persistir en Redis
    await this.persistAlert(alert)
  }

  /**
   * Suscribirse a actualizaciones en tiempo real
   */
  subscribe(callback: (data: any) => void): () => void {
    this.subscribers.add(callback)

    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Notifica a todos los suscriptores
   */
  private notifySubscribers(type: string, data: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback({ type, data, timestamp: Date.now() })
      } catch (error) {
        logger.error(LogCategory.MONITORING, 'Error notifying subscriber', error as Error)
      }
    })
  }

  /**
   * Obtiene métricas actuales
   */
  getCurrentMetrics(): {
    realTime: RealTimeMetrics[]
    webVitals: CoreWebVitals[]
    apiMetrics: APIMetrics[]
    dbMetrics: DatabaseMetrics[]
    alerts: PerformanceAlert[]
  } {
    return {
      realTime: [...this.metricsBuffer],
      webVitals: [...this.webVitalsBuffer],
      apiMetrics: [...this.apiMetricsBuffer],
      dbMetrics: [...this.dbMetricsBuffer],
      alerts: Array.from(this.alerts.values()).filter(a => !a.resolved),
    }
  }

  /**
   * Actualiza umbrales
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds }
    logger.info(LogCategory.MONITORING, 'Performance thresholds updated')
  }

  /**
   * Resuelve una alerta
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = Date.now()

      this.notifySubscribers('alertResolved', alert)
      logger.info(LogCategory.MONITORING, `Alert resolved: ${alertId}`)
      return true
    }
    return false
  }

  /**
   * Flush de métricas a Redis
   */
  private async flushMetricsToRedis(): Promise<void> {
    // ⚡ FIX: No hacer flush durante build time
    if (this.isBuildTime()) {
      return
    }

    try {
      // ⚡ FIX: Verificar que Redis tenga el método setex antes de usarlo
      if (!this.redis || typeof this.redis.setex !== 'function') {
        return
      }

      const timestamp = Date.now()

      // Guardar métricas en Redis con TTL de 24 horas
      if (this.metricsBuffer.length > 0) {
        await this.redis.setex(
          `metrics:realtime:${timestamp}`,
          86400,
          JSON.stringify(this.metricsBuffer)
        )
      }

      if (this.webVitalsBuffer.length > 0) {
        await this.redis.setex(
          `metrics:webvitals:${timestamp}`,
          86400,
          JSON.stringify(this.webVitalsBuffer)
        )
      }

      if (this.apiMetricsBuffer.length > 0) {
        await this.redis.setex(
          `metrics:api:${timestamp}`,
          86400,
          JSON.stringify(this.apiMetricsBuffer)
        )
      }

      if (this.dbMetricsBuffer.length > 0) {
        await this.redis.setex(
          `metrics:database:${timestamp}`,
          86400,
          JSON.stringify(this.dbMetricsBuffer)
        )
      }
    } catch (error) {
      logger.error(LogCategory.MONITORING, 'Error flushing metrics to Redis', error as Error)
    }
  }

  /**
   * Persiste alerta en Redis
   */
  private async persistAlert(alert: PerformanceAlert): Promise<void> {
    // ⚡ FIX: No persistir durante build time
    if (this.isBuildTime()) {
      return
    }

    try {
      // ⚡ FIX: Verificar que Redis tenga el método setex antes de usarlo
      if (this.redis && typeof this.redis.setex === 'function') {
        await this.redis.setex(
          `alert:${alert.id}`,
          86400 * 7, // 7 días
          JSON.stringify(alert)
        )
      }
    } catch (error) {
      logger.error(LogCategory.MONITORING, 'Error persisting alert', error as Error)
    }
  }

  // ===================================
  // MÉTODOS DE RECOLECCIÓN DE MÉTRICAS
  // ===================================

  private async getAverageResponseTime(): Promise<number> {
    // Calcular tiempo de respuesta promedio de las últimas métricas de API
    const recentAPI = this.apiMetricsBuffer.slice(-10)
    if (recentAPI.length === 0) {
      return 0
    }

    const total = recentAPI.reduce((sum, metric) => sum + metric.responseTime, 0)
    return total / recentAPI.length
  }

  private async getCurrentThroughput(): Promise<number> {
    // Calcular throughput basado en requests por segundo
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const recentRequests = this.apiMetricsBuffer.filter(m => m.timestamp > oneMinuteAgo)
    return recentRequests.length / 60 // requests por segundo
  }

  private async getCurrentErrorRate(): Promise<number> {
    const recentAPI = this.apiMetricsBuffer.slice(-100)
    if (recentAPI.length === 0) {
      return 0
    }

    const errors = recentAPI.filter(m => m.statusCode >= 400).length
    return errors / recentAPI.length
  }

  private async getCPUUsage(): Promise<number> {
    // Simulación de uso de CPU (en implementación real, usar librerías del sistema)
    return Math.random() * 0.8 // 0-80%
  }

  private async getMemoryUsage(): Promise<number> {
    // Obtener uso de memoria real
    if (typeof process !== 'undefined') {
      const memUsage = process.memoryUsage()
      return memUsage.heapUsed / memUsage.heapTotal
    }
    return Math.random() * 0.7 // Fallback
  }

  private async getActiveConnections(): Promise<number> {
    // Simulación de conexiones activas
    return Math.floor(Math.random() * 100) + 10
  }

  private async getQueueSize(): Promise<number> {
    // Simulación de tamaño de cola
    return Math.floor(Math.random() * 20)
  }

  private async getCacheHitRate(): Promise<number> {
    // Obtener hit rate del cache (integrar con cache manager)
    return Math.random() * 0.3 + 0.7 // 70-100%
  }

  private async getDBConnectionPoolSize(): Promise<number> {
    // Simulación de pool de conexiones DB
    return Math.floor(Math.random() * 10) + 5
  }

  /**
   * Destructor
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.subscribers.clear()
  }
}

// Instancia singleton
export const realTimePerformanceMonitor = RealTimePerformanceMonitor.getInstance()

/**
 * Utilidades para monitoreo en tiempo real
 */
export const RealTimeMonitoringUtils = {
  /**
   * Registra métricas de Web Vitals desde el cliente
   */
  recordWebVitals(vitals: Omit<CoreWebVitals, 'timestamp'>): void {
    realTimePerformanceMonitor.recordWebVitals(vitals)
  },

  /**
   * Registra métricas de API
   */
  recordAPICall(metrics: Omit<APIMetrics, 'timestamp'>): void {
    realTimePerformanceMonitor.recordAPIMetrics(metrics)
  },

  /**
   * Registra métricas de base de datos
   */
  recordDatabaseQuery(metrics: Omit<DatabaseMetrics, 'timestamp'>): void {
    realTimePerformanceMonitor.recordDatabaseMetrics(metrics)
  },

  /**
   * Obtiene resumen de estado actual
   */
  getCurrentStatus(): {
    healthy: boolean
    activeAlerts: number
    avgResponseTime: number
    errorRate: number
    lastUpdate: number
  } {
    const current = realTimePerformanceMonitor.getCurrentMetrics()
    const latestMetrics = current.realTime[current.realTime.length - 1]

    if (!latestMetrics) {
      return {
        healthy: false,
        activeAlerts: 0,
        avgResponseTime: 0,
        errorRate: 0,
        lastUpdate: 0,
      }
    }

    const activeAlerts = current.alerts.length
    const healthy =
      activeAlerts === 0 && latestMetrics.responseTime < 2000 && latestMetrics.errorRate < 0.05

    return {
      healthy,
      activeAlerts,
      avgResponseTime: latestMetrics.responseTime,
      errorRate: latestMetrics.errorRate,
      lastUpdate: latestMetrics.timestamp,
    }
  },
}
