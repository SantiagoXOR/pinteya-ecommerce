// ===================================
// SUPABASE MONITORING & HEALTH CHECKS
// ===================================

import { supabase, supabaseAdmin } from './index'
import { API_TIMEOUTS } from '@/lib/config/api-timeouts'

// ===================================
// INTERFACES
// ===================================

export interface HealthCheckResult {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  timestamp: string
  error?: string
  details?: any
}

export interface MonitoringStats {
  uptime: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  lastHealthCheck: string
  services: {
    database: HealthCheckResult
    auth: HealthCheckResult
    storage: HealthCheckResult
    realtime: HealthCheckResult
  }
}

// ===================================
// MONITORING CLASS
// ===================================

class SupabaseMonitoring {
  private stats: MonitoringStats
  private startTime: number
  private healthCheckInterval?: NodeJS.Timeout

  constructor() {
    this.startTime = Date.now()
    this.stats = {
      uptime: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastHealthCheck: new Date().toISOString(),
      services: {
        database: this.createEmptyHealthCheck('database'),
        auth: this.createEmptyHealthCheck('auth'),
        storage: this.createEmptyHealthCheck('storage'),
        realtime: this.createEmptyHealthCheck('realtime'),
      },
    }
  }

  private createEmptyHealthCheck(service: string): HealthCheckResult {
    return {
      service,
      status: 'unhealthy',
      responseTime: 0,
      timestamp: new Date().toISOString(),
    }
  }

  // ===================================
  // HEALTH CHECKS
  // ===================================

  async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .limit(1)
        .abortSignal(AbortSignal.timeout(API_TIMEOUTS.supabase.healthCheck))

      const responseTime = Date.now() - startTime

      if (error) {
        return {
          service: 'database',
          status: 'unhealthy',
          responseTime,
          timestamp: new Date().toISOString(),
          error: error.message,
          details: error,
        }
      }

      return {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date().toISOString(),
        details: { recordsFound: data?.length || 0 },
      }
    } catch (error: any) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message || 'Database connection failed',
      }
    }
  }

  async checkAuthHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase.auth.getSession()
      const responseTime = Date.now() - startTime

      if (error) {
        return {
          service: 'auth',
          status: 'unhealthy',
          responseTime,
          timestamp: new Date().toISOString(),
          error: error.message,
          details: error,
        }
      }

      return {
        service: 'auth',
        status: responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date().toISOString(),
        details: { hasSession: !!data.session },
      }
    } catch (error: any) {
      return {
        service: 'auth',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message || 'Auth service failed',
      }
    }
  }

  async checkStorageHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase.storage.listBuckets()
      const responseTime = Date.now() - startTime

      if (error) {
        return {
          service: 'storage',
          status: 'unhealthy',
          responseTime,
          timestamp: new Date().toISOString(),
          error: error.message,
          details: error,
        }
      }

      return {
        service: 'storage',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date().toISOString(),
        details: { bucketsCount: data?.length || 0 },
      }
    } catch (error: any) {
      return {
        service: 'storage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message || 'Storage service failed',
      }
    }
  }

  async checkRealtimeHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Simple realtime connection test
      const channel = supabase.channel('health-check')

      return new Promise<HealthCheckResult>(resolve => {
        const timeout = setTimeout(() => {
          channel.unsubscribe()
          resolve({
            service: 'realtime',
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            error: 'Realtime connection timeout',
          })
        }, 3000)

        channel
          .on('presence', { event: 'sync' }, () => {
            clearTimeout(timeout)
            channel.unsubscribe()

            const responseTime = Date.now() - startTime
            resolve({
              service: 'realtime',
              status: responseTime < 1000 ? 'healthy' : 'degraded',
              responseTime,
              timestamp: new Date().toISOString(),
              details: { connected: true },
            })
          })
          .subscribe()
      })
    } catch (error: any) {
      return {
        service: 'realtime',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message || 'Realtime service failed',
      }
    }
  }

  // ===================================
  // COMPREHENSIVE HEALTH CHECK
  // ===================================

  async performHealthCheck(): Promise<MonitoringStats> {
    const healthChecks = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkAuthHealth(),
      this.checkStorageHealth(),
      this.checkRealtimeHealth(),
    ])

    // Update stats with health check results
    this.stats.services.database =
      healthChecks[0].status === 'fulfilled'
        ? healthChecks[0].value
        : this.createEmptyHealthCheck('database')

    this.stats.services.auth =
      healthChecks[1].status === 'fulfilled'
        ? healthChecks[1].value
        : this.createEmptyHealthCheck('auth')

    this.stats.services.storage =
      healthChecks[2].status === 'fulfilled'
        ? healthChecks[2].value
        : this.createEmptyHealthCheck('storage')

    this.stats.services.realtime =
      healthChecks[3].status === 'fulfilled'
        ? healthChecks[3].value
        : this.createEmptyHealthCheck('realtime')

    // Update general stats
    this.stats.uptime = Date.now() - this.startTime
    this.stats.lastHealthCheck = new Date().toISOString()

    return this.stats
  }

  // ===================================
  // REQUEST TRACKING
  // ===================================

  trackRequest(success: boolean, responseTime: number) {
    this.stats.totalRequests++

    if (success) {
      this.stats.successfulRequests++
    } else {
      this.stats.failedRequests++
    }

    // Update average response time
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) /
      this.stats.totalRequests
  }

  // ===================================
  // MONITORING CONTROL
  // ===================================

  startContinuousMonitoring(intervalMs: number = 30000) {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck()
        console.log('[SUPABASE_MONITORING] Health check completed:', {
          timestamp: new Date().toISOString(),
          services: Object.values(this.stats.services).map(s => ({
            service: s.service,
            status: s.status,
            responseTime: s.responseTime,
          })),
        })
      } catch (error) {
        console.error('[SUPABASE_MONITORING] Health check failed:', error)
      }
    }, intervalMs)

    console.log(`[SUPABASE_MONITORING] Continuous monitoring started (interval: ${intervalMs}ms)`)
  }

  stopContinuousMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = undefined
      console.log('[SUPABASE_MONITORING] Continuous monitoring stopped')
    }
  }

  // ===================================
  // STATS & REPORTING
  // ===================================

  getStats(): MonitoringStats {
    return { ...this.stats }
  }

  getHealthSummary() {
    const services = Object.values(this.stats.services)
    const healthyCount = services.filter(s => s.status === 'healthy').length
    const degradedCount = services.filter(s => s.status === 'degraded').length
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length

    return {
      overall: unhealthyCount === 0 ? (degradedCount === 0 ? 'healthy' : 'degraded') : 'unhealthy',
      services: {
        total: services.length,
        healthy: healthyCount,
        degraded: degradedCount,
        unhealthy: unhealthyCount,
      },
      uptime: this.stats.uptime,
      successRate:
        this.stats.totalRequests > 0
          ? (this.stats.successfulRequests / this.stats.totalRequests) * 100
          : 0,
    }
  }

  // ===================================
  // ALERTS & NOTIFICATIONS
  // ===================================

  checkForAlerts(): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts = []
    const summary = this.getHealthSummary()

    // Overall health alerts
    if (summary.overall === 'unhealthy') {
      alerts.push({
        type: 'system_unhealthy',
        message: `Sistema Supabase en estado crítico: ${summary.services.unhealthy} servicios no disponibles`,
        severity: 'high' as const,
      })
    } else if (summary.overall === 'degraded') {
      alerts.push({
        type: 'system_degraded',
        message: `Rendimiento degradado: ${summary.services.degraded} servicios con latencia alta`,
        severity: 'medium' as const,
      })
    }

    // Success rate alerts
    if (summary.successRate < 95 && this.stats.totalRequests > 10) {
      alerts.push({
        type: 'low_success_rate',
        message: `Tasa de éxito baja: ${summary.successRate.toFixed(1)}%`,
        severity: summary.successRate < 90 ? 'high' : 'medium',
      })
    }

    // Response time alerts
    if (this.stats.averageResponseTime > 2000) {
      alerts.push({
        type: 'high_response_time',
        message: `Tiempo de respuesta alto: ${this.stats.averageResponseTime.toFixed(0)}ms`,
        severity: this.stats.averageResponseTime > 5000 ? 'high' : 'medium',
      })
    }

    return alerts
  }
}

// ===================================
// SINGLETON INSTANCE
// ===================================

let monitoringInstance: SupabaseMonitoring | null = null

export function getSupabaseMonitoring(): SupabaseMonitoring {
  if (!monitoringInstance) {
    monitoringInstance = new SupabaseMonitoring()
  }
  return monitoringInstance
}

// ===================================
// REACT HOOK
// ===================================

export function useSupabaseMonitoring() {
  const monitoring = getSupabaseMonitoring()

  return {
    performHealthCheck: () => monitoring.performHealthCheck(),
    getStats: () => monitoring.getStats(),
    getHealthSummary: () => monitoring.getHealthSummary(),
    checkForAlerts: () => monitoring.checkForAlerts(),
    trackRequest: (success: boolean, responseTime: number) =>
      monitoring.trackRequest(success, responseTime),
    startMonitoring: (interval?: number) => monitoring.startContinuousMonitoring(interval),
    stopMonitoring: () => monitoring.stopContinuousMonitoring(),
  }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

export async function quickHealthCheck(): Promise<boolean> {
  try {
    const monitoring = getSupabaseMonitoring()
    const stats = await monitoring.performHealthCheck()

    const criticalServices = ['database', 'auth']
    const criticalHealthy = criticalServices.every(
      service => stats.services[service as keyof typeof stats.services].status !== 'unhealthy'
    )

    return criticalHealthy
  } catch (error) {
    console.error('[SUPABASE_MONITORING] Quick health check failed:', error)
    return false
  }
}

export function formatHealthStatus(status: HealthCheckResult['status']): string {
  const statusMap = {
    healthy: '🟢 Saludable',
    degraded: '🟡 Degradado',
    unhealthy: '🔴 No disponible',
  }
  return statusMap[status] || '⚪ Desconocido'
}

export function formatResponseTime(ms: number): string {
  if (ms < 100) return `${ms}ms 🚀`
  if (ms < 500) return `${ms}ms ✅`
  if (ms < 1000) return `${ms}ms ⚠️`
  return `${ms}ms 🐌`
}
