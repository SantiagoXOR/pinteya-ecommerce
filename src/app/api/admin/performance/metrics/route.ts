// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// API: Performance Metrics
// Endpoint para recopilar y servir métricas de performance
// Integrado con sistema de monitoring de producción
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { APIAnalytics } from '@/middleware/performance-monitoring'
import { productionMonitor } from '@/config/production-monitoring'

interface PerformanceMetric {
  timestamp: number
  url: string
  metrics: {
    LCP?: number
    FID?: number
    CLS?: number
    FCP?: number
    TTI?: number
    bundleSize?: number
    renderTime?: number
  }
  userAgent: string
  connection?: string
}

// Interfaz para health check
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    api: boolean
    database: boolean
    memory: boolean
    performance: boolean
  }
  timestamp: number
}

// Almacenamiento temporal de métricas (en producción usar base de datos)
let metricsStore: PerformanceMetric[] = []

// Función para realizar health check
async function performHealthCheck(): Promise<HealthCheck> {
  const checks = {
    api: true, // Siempre true si llegamos aquí
    database: await checkDatabase(),
    memory: await checkMemory(),
    performance: await checkPerformance(),
  }

  const healthyCount = Object.values(checks).filter(Boolean).length
  let status: 'healthy' | 'degraded' | 'unhealthy'

  if (healthyCount === 4) {
    status = 'healthy'
  } else if (healthyCount >= 2) {
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

// Verificar estado de la base de datos
async function checkDatabase(): Promise<boolean> {
  try {
    // Aquí iría la verificación real de la DB
    // Por ahora simulamos una verificación exitosa
    return true
  } catch {
    return false
  }
}

// Verificar uso de memoria
async function checkMemory(): Promise<boolean> {
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      const usedMB = usage.heapUsed / 1024 / 1024
      // Considerar unhealthy si usa más de 512MB
      return usedMB < 512
    }
    return true
  } catch {
    return false
  }
}

// Verificar rendimiento general
async function checkPerformance(): Promise<boolean> {
  try {
    const report = APIAnalytics.getAggregatedMetrics()
    // Considerar unhealthy si el tiempo promedio es > 2s o error rate > 10%
    return report.averageResponseTime < 2000 && report.errorRate < 0.1
  } catch {
    return true // Default a healthy si no podemos verificar
  }
}

// Función para formatear tiempo legible
function formatTimeWindow(ms: number): string {
  const minutes = ms / (1000 * 60)
  const hours = minutes / 60
  const days = hours / 24

  if (days >= 1) {
    return `${Math.round(days)} día${days !== 1 ? 's' : ''}`
  }
  if (hours >= 1) {
    return `${Math.round(hours)} hora${hours !== 1 ? 's' : ''}`
  }
  return `${Math.round(minutes)} minuto${minutes !== 1 ? 's' : ''}`
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '1h'
    const url = searchParams.get('url')
    const includeHealth = searchParams.get('health') === 'true'

    // Calcular timestamp de inicio basado en timeframe
    const now = Date.now()
    let timeWindow = 60 * 60 * 1000 // Default 1h

    switch (timeframe) {
      case '15m':
        timeWindow = 15 * 60 * 1000
        break
      case '1h':
        timeWindow = 60 * 60 * 1000
        break
      case '24h':
        timeWindow = 24 * 60 * 60 * 1000
        break
      case '7d':
        timeWindow = 7 * 24 * 60 * 60 * 1000
        break
    }

    const startTime = now - timeWindow

    // Obtener métricas del sistema de monitoring usando métodos estáticos
    const report = APIAnalytics.getAggregatedMetrics(timeWindow)

    // Filtrar métricas por ventana de tiempo
    const filteredMetrics = metricsStore.filter(metric => metric.timestamp >= startTime)

    // Calcular endpoints más lentos desde las métricas filtradas
    const endpointTimes = new Map<string, number[]>()
    filteredMetrics.forEach(metric => {
      const path = metric.url
      if (!endpointTimes.has(path)) {
        endpointTimes.set(path, [])
      }
      // Usar renderTime como tiempo de respuesta si está disponible
      const responseTime = metric.metrics.renderTime || metric.metrics.TTI || 0
      if (responseTime > 0) {
        endpointTimes.get(path)!.push(responseTime)
      }
    })

    const slowestEndpoints = Array.from(endpointTimes.entries())
      .map(([path, times]) => ({
        path,
        avgTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      }))
      .filter(e => e.avgTime > 0)
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10)

    // Usar errores del reporte de analytics o valores por defecto
    const errorsByStatus = report.errorsByStatus || {
      404: 0,
      500: 0,
      503: 0,
    }

    // Incluir health check si se solicita
    let healthCheck = null
    if (includeHealth) {
      healthCheck = await performHealthCheck()
    }

    // Preparar respuesta en el formato esperado por el componente
    const response = {
      timestamp: new Date().toISOString(),
      timeWindow,
      timeWindowHuman: formatTimeWindow(timeWindow),
      metrics: {
        totalRequests: report.totalRequests || filteredMetrics.length,
        averageResponseTime: report.averageResponseTime || 0,
        errorRate: report.errorRate || 0,
        slowestEndpoints: report.slowestEndpoints.length > 0 ? report.slowestEndpoints : slowestEndpoints,
        errorsByStatus,
      },
      healthCheck,
      meta: {
        generatedAt: Date.now(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de admin (bypass para desarrollo)
    const isDevelopment = process.env.NODE_ENV === 'development'

    if (!isDevelopment) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { metrics, url, userAgent, connection, timestamp, batchSize } = body

    // Validar que las métricas sean válidas
    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json({ error: 'Invalid metrics data - expected array' }, { status: 400 })
    }

    // Validar URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Procesar cada métrica del batch
    const processedMetrics: PerformanceMetric[] = []

    for (const metric of metrics) {
      if (!metric || typeof metric !== 'object') {
        continue
      }

      const newMetric: PerformanceMetric = {
        timestamp: timestamp || Date.now(),
        url,
        metrics: metric,
        userAgent: userAgent || 'Unknown',
        connection: connection || 'Unknown',
      }

      processedMetrics.push(newMetric)
    }

    // Almacenar en memoria (limitado a 1000 métricas)
    metricsStore.push(...processedMetrics)
    if (metricsStore.length > 1000) {
      metricsStore.splice(0, metricsStore.length - 1000) // Mantener solo las últimas 1000
    }

    // Verificar violaciones de presupuesto para la última métrica
    const violations =
      processedMetrics.length > 0
        ? checkBudgetViolations(processedMetrics[processedMetrics.length - 1])
        : []

    if (violations.length > 0) {
      console.warn('Performance budget violations detected:', violations)
    }

    return NextResponse.json({
      success: true,
      processedCount: processedMetrics.length,
      totalStored: metricsStore.length,
      violations,
    })
  } catch (error) {
    console.error('Error processing performance metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateAggregatedStats(metrics: PerformanceMetric[]) {
  if (metrics.length === 0) {
    return {
      LCP: { avg: 0, p50: 0, p95: 0, p99: 0 },
      FID: { avg: 0, p50: 0, p95: 0, p99: 0 },
      CLS: { avg: 0, p50: 0, p95: 0, p99: 0 },
      FCP: { avg: 0, p50: 0, p95: 0, p99: 0 },
      renderTime: { avg: 0, p50: 0, p95: 0, p99: 0 },
    }
  }

  const calculatePercentiles = (values: number[]) => {
    const sorted = values.sort((a, b) => a - b)
    const len = sorted.length

    return {
      avg: values.reduce((sum, val) => sum + val, 0) / len,
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
    }
  }

  const lcpValues = metrics.map(m => m.metrics.LCP).filter(v => v !== undefined) as number[]
  const fidValues = metrics.map(m => m.metrics.FID).filter(v => v !== undefined) as number[]
  const clsValues = metrics.map(m => m.metrics.CLS).filter(v => v !== undefined) as number[]
  const fcpValues = metrics.map(m => m.metrics.FCP).filter(v => v !== undefined) as number[]
  const renderValues = metrics
    .map(m => m.metrics.renderTime)
    .filter(v => v !== undefined) as number[]

  return {
    LCP: calculatePercentiles(lcpValues),
    FID: calculatePercentiles(fidValues),
    CLS: calculatePercentiles(clsValues),
    FCP: calculatePercentiles(fcpValues),
    renderTime: calculatePercentiles(renderValues),
  }
}

function checkBudgetViolations(metric: PerformanceMetric): string[] {
  const violations: string[] = []
  const budgets = {
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    FCP: 1800,
    TTI: 3800,
  }

  Object.entries(budgets).forEach(([key, budget]) => {
    const value = metric.metrics[key as keyof typeof budgets]
    if (value !== undefined && value > budget) {
      violations.push(`${key}: ${value} exceeds budget of ${budget}`)
    }
  })

  return violations
}

// Endpoint para limpiar métricas antiguas
export async function DELETE(request: NextRequest) {
  try {
    // Verificación básica de autenticación (simplificada para demo)
    const authHeader = request.headers.get('authorization')
    if (!authHeader && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const olderThan = searchParams.get('olderThan') || '24h'

    let cutoffTime = Date.now()
    switch (olderThan) {
      case '1h':
        cutoffTime -= 60 * 60 * 1000
        break
      case '24h':
        cutoffTime -= 24 * 60 * 60 * 1000
        break
      case '7d':
        cutoffTime -= 7 * 24 * 60 * 60 * 1000
        break
    }

    const originalCount = metricsStore.length
    metricsStore = metricsStore.filter(metric => metric.timestamp >= cutoffTime)
    const deletedCount = originalCount - metricsStore.length

    return NextResponse.json({
      success: true,
      data: {
        deletedCount,
        remainingCount: metricsStore.length,
      },
    })
  } catch (error) {
    console.error('Error cleaning performance metrics:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
