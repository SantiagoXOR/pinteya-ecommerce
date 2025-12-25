/**
 * Sistema de monitoreo y logging para APIs administrativas
 * Incluye métricas de performance, alertas y logging estructurado
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Tipos para métricas
export interface PerformanceMetric {
  endpoint: string
  method: string
  duration: number
  status: number
  userId?: string
  timestamp: string
  error?: string
}

export interface SecurityAlert {
  type: 'rate_limit' | 'auth_failure' | 'permission_denied' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  metadata: Record<string, any>
  timestamp: string
}

// Cache en memoria para métricas (en producción usar Redis)
const metricsCache = new Map<string, any>()
const alertsCache: SecurityAlert[] = []

// ⚡ OPTIMIZACIÓN: Buffer para batch processing de métricas
const metricsBuffer: PerformanceMetric[] = []
let flushTimer: NodeJS.Timeout | null = null
const BATCH_SIZE = parseInt(process.env.ANALYTICS_BATCH_SIZE || '50', 10)
const FLUSH_INTERVAL = parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || '30000', 10) // 30 segundos

/**
 * ⚡ OPTIMIZACIÓN: Flush de métricas en batch a la base de datos
 */
async function flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) {
    return
  }

  // ⚡ FIX: Extraer y limpiar buffer ANTES de intentar insertar para evitar duplicados
  const metricsToFlush = [...metricsBuffer]
  metricsBuffer.length = 0 // Limpiar buffer inmediatamente

  try {
    // Preparar datos para inserción batch
    const metricsToInsert = metricsToFlush.map(metric => ({
      endpoint: metric.endpoint,
      method: metric.method,
      duration_ms: metric.duration,
      status_code: metric.status,
      user_id: metric.userId,
      error_message: metric.error,
      timestamp: metric.timestamp,
    }))

    // Inserción batch usando múltiples VALUES
    const { error } = await supabase.from('admin_performance_metrics').insert(metricsToInsert)

    if (error) {
      console.error('Error flushing metrics batch:', error)
      // ⚡ FIX: Re-agregar métricas originales al buffer para reintento (no duplicadas)
      // Convertir de vuelta al formato PerformanceMetric
      const metricsToRetry: PerformanceMetric[] = metricsToFlush.map(metric => ({
        endpoint: metric.endpoint,
        method: metric.method,
        duration: metric.duration,
        status: metric.status,
        ...(metric.userId !== undefined && { userId: metric.userId }),
        ...(metric.error !== undefined && { error: metric.error }),
        timestamp: metric.timestamp,
      }))
      // Agregar al inicio del buffer para reintento prioritario
      metricsBuffer.unshift(...metricsToRetry)
    }
    // Si no hay error, las métricas ya fueron insertadas y el buffer ya está limpio
  } catch (error) {
    console.error('Error in flushMetrics:', error)
    // ⚡ FIX: En caso de excepción, también re-agregar métricas para reintento
    const metricsToRetry: PerformanceMetric[] = metricsToFlush.map(metric => ({
      endpoint: metric.endpoint,
      method: metric.method,
      duration: metric.duration,
      status: metric.status,
      ...(metric.userId !== undefined && { userId: metric.userId }),
      ...(metric.error !== undefined && { error: metric.error }),
      timestamp: metric.timestamp,
    }))
    metricsBuffer.unshift(...metricsToRetry)
  }
}

/**
 * Registrar métrica de performance
 * ⚡ OPTIMIZACIÓN: Usa buffer en lugar de inserción inmediata
 */
export async function recordPerformanceMetric(metric: PerformanceMetric): Promise<void> {
  try {
    // Agregar al buffer en lugar de insertar inmediatamente
    metricsBuffer.push(metric)

    // Actualizar cache de métricas (sincrónico, no bloquea)
    const key = `${metric.endpoint}_${metric.method}`
    const cached = metricsCache.get(key) || { count: 0, totalDuration: 0, errors: 0 }

    cached.count++
    cached.totalDuration += metric.duration
    if (metric.status >= 400) {
      cached.errors++
    }
    cached.avgDuration = cached.totalDuration / cached.count
    cached.errorRate = (cached.errors / cached.count) * 100

    metricsCache.set(key, cached)

    // Flush automático si el buffer alcanza el tamaño máximo
    if (metricsBuffer.length >= BATCH_SIZE) {
      await flushMetrics()
    } else {
      // Iniciar timer de flush si no existe
      if (!flushTimer) {
        flushTimer = setTimeout(() => {
          flushMetrics().finally(() => {
            flushTimer = null
          })
        }, FLUSH_INTERVAL)
      }
    }

    // Verificar si necesita alerta (sincrónico para alertas críticas)
    if (metric.duration > 5000) {
      // Más de 5 segundos
      await createAlert({
        type: 'suspicious_activity',
        severity: 'medium',
        message: `API response time exceeded 5 seconds: ${metric.endpoint}`,
        metadata: { metric },
        timestamp: new Date().toISOString(),
      })
    }

    if (metric.status >= 500) {
      await createAlert({
        type: 'suspicious_activity',
        severity: 'high',
        message: `Server error in admin API: ${metric.endpoint}`,
        metadata: { metric },
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Error recording performance metric:', error)
  }
}

/**
 * Crear alerta de seguridad
 */
export async function createAlert(alert: SecurityAlert): Promise<void> {
  try {
    // Guardar en base de datos
    await supabase.from('admin_security_alerts').insert({
      alert_type: alert.type,
      severity: alert.severity,
      message: alert.message,
      metadata: alert.metadata,
      timestamp: alert.timestamp,
      resolved: false,
    })

    // Agregar al cache
    alertsCache.push(alert)

    // Mantener solo las últimas 100 alertas en cache
    if (alertsCache.length > 100) {
      alertsCache.shift()
    }

    // Log crítico para alertas de alta severidad
    if (alert.severity === 'critical' || alert.severity === 'high') {
      console.error('🚨 CRITICAL SECURITY ALERT:', alert)
    }
  } catch (error) {
    console.error('Error creating security alert:', error)
  }
}

/**
 * Obtener métricas de performance
 */
export async function getPerformanceMetrics(timeframe: '1h' | '24h' | '7d' = '24h'): Promise<any> {
  try {
    const now = new Date()
    let startTime: Date

    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
    }

    const { data: metrics, error } = await supabase
      .from('admin_performance_metrics')
      .select('*')
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching performance metrics:', error)
      return null
    }

    // Calcular estadísticas
    const stats = {
      totalRequests: metrics.length,
      avgDuration: metrics.reduce((sum, m) => sum + m.duration_ms, 0) / metrics.length || 0,
      errorRate: (metrics.filter(m => m.status_code >= 400).length / metrics.length) * 100 || 0,
      slowRequests: metrics.filter(m => m.duration_ms > 2000).length,
      endpoints: {} as Record<string, any>,
    }

    // Agrupar por endpoint
    metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`
      if (!stats.endpoints[key]) {
        stats.endpoints[key] = {
          count: 0,
          totalDuration: 0,
          errors: 0,
        }
      }

      stats.endpoints[key].count++
      stats.endpoints[key].totalDuration += metric.duration_ms
      if (metric.status_code >= 400) {
        stats.endpoints[key].errors++
      }
    })

    // Calcular promedios por endpoint
    Object.keys(stats.endpoints).forEach(key => {
      const endpoint = stats.endpoints[key]
      endpoint.avgDuration = endpoint.totalDuration / endpoint.count
      endpoint.errorRate = (endpoint.errors / endpoint.count) * 100
    })

    return {
      timeframe,
      stats,
      rawMetrics: metrics.slice(0, 50), // Últimas 50 métricas
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error getting performance metrics:', error)
    return null
  }
}

/**
 * Obtener alertas de seguridad activas
 */
export async function getActiveAlerts(): Promise<SecurityAlert[]> {
  try {
    const { data: alerts, error } = await supabase
      .from('admin_security_alerts')
      .select('*')
      .eq('resolved', false)
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching security alerts:', error)
      return []
    }

    return alerts.map(alert => ({
      type: alert.alert_type,
      severity: alert.severity,
      message: alert.message,
      metadata: alert.metadata,
      timestamp: alert.timestamp,
    }))
  } catch (error) {
    console.error('Error getting active alerts:', error)
    return []
  }
}

/**
 * Middleware para medir performance de APIs
 */
export function withPerformanceMonitoring(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const startTime = Date.now()
    const url = new URL(request.url)

    try {
      const response = await handler(request)
      const duration = Date.now() - startTime

      // Registrar métrica
      await recordPerformanceMetric({
        endpoint: url.pathname,
        method: request.method,
        duration,
        status: response.status,
        timestamp: new Date().toISOString(),
      })

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // Registrar métrica de error
      await recordPerformanceMetric({
        endpoint: url.pathname,
        method: request.method,
        duration,
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })

      throw error
    }
  }
}

/**
 * Logging estructurado
 */
export function logStructured(
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata: Record<string, any> = {}
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata,
    service: 'admin-api',
  }

  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry))
      break
    case 'warn':
      console.warn(JSON.stringify(logEntry))
      break
    default:
      console.log(JSON.stringify(logEntry))
  }
}

/**
 * Limpiar métricas antiguas (ejecutar periódicamente)
 */
export async function cleanupOldMetrics(daysToKeep: number = 30): Promise<void> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    await supabase
      .from('admin_performance_metrics')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())

    await supabase.from('admin_security_alerts').delete().lt('timestamp', cutoffDate.toISOString())

    logStructured('info', 'Cleaned up old metrics and alerts', {
      cutoffDate: cutoffDate.toISOString(),
      daysKept: daysToKeep,
    })
  } catch (error) {
    logStructured('error', 'Error cleaning up old metrics', { error })
  }
}
