/**
 * Optimizador de Rate Limiting para Producción
 * Gestiona límites dinámicos y métricas de rendimiento
 */

export interface ProductionMetrics {
  endpoint: string
  requestsPerMinute: number
  averageResponseTime: number
  errorRate: number
  timestamp: number
}

export interface OptimizedLimits {
  endpoint: string
  currentLimit: number
  recommendedLimit: number
  reason: string
}

export class ProductionRateLimitOptimizer {
  private metrics: Map<string, ProductionMetrics[]> = new Map()
  private readonly METRICS_WINDOW = 5 * 60 * 1000 // 5 minutos
  private readonly MAX_METRICS_PER_ENDPOINT = 100

  /**
   * Registra métricas de un endpoint
   */
  recordMetrics(endpoint: string, responseTime: number, isError: boolean = false) {
    const now = Date.now()
    const endpointMetrics = this.metrics.get(endpoint) || []
    
    // Limpiar métricas antiguas
    const recentMetrics = endpointMetrics.filter(
      m => now - m.timestamp < this.METRICS_WINDOW
    )
    
    // Calcular métricas actuales
    const requestsInWindow = recentMetrics.length
    const requestsPerMinute = (requestsInWindow / 5) // 5 minutos
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length || 0
    const errorCount = recentMetrics.filter(m => m.errorRate > 0).length
    const errorRate = errorCount / recentMetrics.length || 0
    
    const newMetric: ProductionMetrics = {
      endpoint,
      requestsPerMinute,
      averageResponseTime: responseTime,
      errorRate: isError ? 1 : 0,
      timestamp: now
    }
    
    recentMetrics.push(newMetric)
    
    // Mantener solo las métricas más recientes
    if (recentMetrics.length > this.MAX_METRICS_PER_ENDPOINT) {
      recentMetrics.splice(0, recentMetrics.length - this.MAX_METRICS_PER_ENDPOINT)
    }
    
    this.metrics.set(endpoint, recentMetrics)
  }

  /**
   * Analiza y recomienda límites optimizados
   */
  analyzeAndRecommend(currentLimits: Record<string, { maxRequests: number }>): OptimizedLimits[] {
    const recommendations: OptimizedLimits[] = []
    
    for (const [endpoint, metrics] of this.metrics.entries()) {
      if (metrics.length < 10) continue // Necesitamos datos suficientes
      
      const currentLimit = currentLimits[endpoint]?.maxRequests || 30
      const recentMetrics = metrics.slice(-20) // Últimas 20 métricas
      
      const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length
      const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length
      const avgRequestsPerMinute = recentMetrics.reduce((sum, m) => sum + m.requestsPerMinute, 0) / recentMetrics.length
      
      let recommendedLimit = currentLimit
      let reason = 'Límite actual es óptimo'
      
      // Análisis de rendimiento
      if (avgResponseTime > 500 && avgErrorRate > 0.05) {
        // Respuesta lenta y errores altos - reducir límite
        recommendedLimit = Math.max(Math.floor(currentLimit * 0.7), 5)
        reason = 'Reducir por alta latencia y errores'
      } else if (avgResponseTime < 200 && avgErrorRate < 0.01 && avgRequestsPerMinute < currentLimit * 0.5) {
        // Buen rendimiento y bajo uso - puede aumentar
        recommendedLimit = Math.min(Math.floor(currentLimit * 1.3), currentLimit + 20)
        reason = 'Aumentar por buen rendimiento y bajo uso'
      } else if (avgRequestsPerMinute > currentLimit * 0.8) {
        // Alto uso pero buen rendimiento - aumentar moderadamente
        if (avgResponseTime < 300 && avgErrorRate < 0.02) {
          recommendedLimit = Math.min(Math.floor(currentLimit * 1.1), currentLimit + 10)
          reason = 'Aumentar moderadamente por alto uso con buen rendimiento'
        }
      }
      
      recommendations.push({
        endpoint,
        currentLimit,
        recommendedLimit,
        reason
      })
    }
    
    return recommendations
  }

  /**
   * Obtiene métricas de rendimiento para monitoreo
   */
  getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {}
    
    for (const [endpoint, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue
      
      const recentMetrics = metrics.slice(-10)
      const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length
      const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length
      const avgRequestsPerMinute = recentMetrics.reduce((sum, m) => sum + m.requestsPerMinute, 0) / recentMetrics.length
      
      report[endpoint] = {
        averageResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(avgErrorRate * 100) / 100,
        requestsPerMinute: Math.round(avgRequestsPerMinute),
        totalRequests: metrics.length,
        status: this.getEndpointStatus(avgResponseTime, avgErrorRate)
      }
    }
    
    return report
  }

  private getEndpointStatus(responseTime: number, errorRate: number): string {
    if (errorRate > 0.1 || responseTime > 1000) return 'CRITICAL'
    if (errorRate > 0.05 || responseTime > 500) return 'WARNING'
    if (responseTime < 200 && errorRate < 0.01) return 'EXCELLENT'
    return 'GOOD'
  }

  /**
   * Limpia métricas antiguas para liberar memoria
   */
  cleanup() {
    const now = Date.now()
    for (const [endpoint, metrics] of this.metrics.entries()) {
      const recentMetrics = metrics.filter(
        m => now - m.timestamp < this.METRICS_WINDOW
      )
      this.metrics.set(endpoint, recentMetrics)
    }
  }
}

// Instancia singleton para uso global
export const productionOptimizer = new ProductionRateLimitOptimizer()

// Cleanup automático cada 10 minutos
if (typeof window === 'undefined') { // Solo en servidor
  setInterval(() => {
    productionOptimizer.cleanup()
  }, 10 * 60 * 1000)
}