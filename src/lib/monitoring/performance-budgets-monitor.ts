// ===================================
// PINTEYA E-COMMERCE - PERFORMANCE BUDGETS MONITOR
// ===================================

import { logger, LogCategory } from '../enterprise/logger'
import { getRedisClient } from '../integrations/redis'
import { advancedAlertingEngine, AlertSeverity, AlertType } from './advanced-alerting-engine'

/**
 * Tipos de métricas de performance
 */
export enum PerformanceMetricType {
  LOAD_TIME = 'loadTime',
  FIRST_CONTENTFUL_PAINT = 'fcp',
  LARGEST_CONTENTFUL_PAINT = 'lcp',
  FIRST_INPUT_DELAY = 'fid',
  CUMULATIVE_LAYOUT_SHIFT = 'cls',
  TIME_TO_FIRST_BYTE = 'ttfb',
  INTERACTION_TO_NEXT_PAINT = 'inp',
  BUNDLE_SIZE = 'bundleSize',
  RESPONSE_TIME = 'responseTime',
  THROUGHPUT = 'throughput',
  ERROR_RATE = 'errorRate',
  MEMORY_USAGE = 'memoryUsage',
  CPU_USAGE = 'cpuUsage',
}

/**
 * Presupuesto de performance
 */
export interface PerformanceBudget {
  id: string
  name: string
  description: string
  enabled: boolean
  metricType: PerformanceMetricType
  target: number
  warning: number
  critical: number
  unit: string
  context?: {
    page?: string
    device?: 'mobile' | 'desktop' | 'tablet'
    network?: '3g' | '4g' | 'wifi'
    environment?: 'development' | 'staging' | 'production'
  }
  tags: string[]
  createdAt: number
  updatedAt: number
}

/**
 * Medición de performance
 */
export interface PerformanceMeasurement {
  id: string
  budgetId: string
  value: number
  timestamp: number
  context: {
    page?: string
    device?: string
    network?: string
    userAgent?: string
    sessionId?: string
  }
  metadata?: Record<string, any>
}

/**
 * Resultado de evaluación de presupuesto
 */
export interface BudgetEvaluation {
  budgetId: string
  measurement: PerformanceMeasurement
  status: 'good' | 'warning' | 'critical'
  deviation: number // Porcentaje de desviación del target
  threshold: number // Umbral que se superó
  message: string
  recommendations?: string[]
}

/**
 * Reporte de presupuestos
 */
export interface BudgetReport {
  period: {
    start: number
    end: number
  }
  summary: {
    totalBudgets: number
    passingBudgets: number
    warningBudgets: number
    failingBudgets: number
    overallScore: number // 0-100
  }
  budgetResults: Array<{
    budget: PerformanceBudget
    measurements: PerformanceMeasurement[]
    averageValue: number
    status: 'good' | 'warning' | 'critical'
    trend: 'improving' | 'stable' | 'degrading'
    violations: number
  }>
  recommendations: string[]
}

/**
 * Presupuestos predefinidos
 */
export const DEFAULT_PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  {
    id: 'lcp_mobile',
    name: 'LCP Mobile',
    description: 'Largest Contentful Paint para dispositivos móviles',
    enabled: true,
    metricType: PerformanceMetricType.LARGEST_CONTENTFUL_PAINT,
    target: 2500,
    warning: 3000,
    critical: 4000,
    unit: 'ms',
    context: { device: 'mobile' },
    tags: ['core-web-vitals', 'mobile'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'lcp_desktop',
    name: 'LCP Desktop',
    description: 'Largest Contentful Paint para escritorio',
    enabled: true,
    metricType: PerformanceMetricType.LARGEST_CONTENTFUL_PAINT,
    target: 2000,
    warning: 2500,
    critical: 3500,
    unit: 'ms',
    context: { device: 'desktop' },
    tags: ['core-web-vitals', 'desktop'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'fid_global',
    name: 'FID Global',
    description: 'First Input Delay para todos los dispositivos',
    enabled: true,
    metricType: PerformanceMetricType.FIRST_INPUT_DELAY,
    target: 100,
    warning: 200,
    critical: 300,
    unit: 'ms',
    tags: ['core-web-vitals', 'interactivity'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'cls_global',
    name: 'CLS Global',
    description: 'Cumulative Layout Shift para todos los dispositivos',
    enabled: true,
    metricType: PerformanceMetricType.CUMULATIVE_LAYOUT_SHIFT,
    target: 0.1,
    warning: 0.15,
    critical: 0.25,
    unit: 'score',
    tags: ['core-web-vitals', 'visual-stability'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'bundle_size_js',
    name: 'Bundle Size JS',
    description: 'Tamaño del bundle JavaScript principal',
    enabled: true,
    metricType: PerformanceMetricType.BUNDLE_SIZE,
    target: 250000, // 250KB
    warning: 350000, // 350KB
    critical: 500000, // 500KB
    unit: 'bytes',
    tags: ['bundle-size', 'javascript'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'api_response_time',
    name: 'API Response Time',
    description: 'Tiempo de respuesta promedio de APIs',
    enabled: true,
    metricType: PerformanceMetricType.RESPONSE_TIME,
    target: 500,
    warning: 1000,
    critical: 2000,
    unit: 'ms',
    tags: ['api', 'backend'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'error_rate',
    name: 'Error Rate',
    description: 'Tasa de errores del sistema',
    enabled: true,
    metricType: PerformanceMetricType.ERROR_RATE,
    target: 0.01, // 1%
    warning: 0.03, // 3%
    critical: 0.05, // 5%
    unit: 'percentage',
    tags: ['reliability', 'errors'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

/**
 * Monitor de presupuestos de performance
 */
export class PerformanceBudgetsMonitor {
  private static instance: PerformanceBudgetsMonitor
  private redis = getRedisClient()
  private budgets: Map<string, PerformanceBudget> = new Map()
  private measurements: Map<string, PerformanceMeasurement[]> = new Map()
  private evaluationInterval?: NodeJS.Timeout

  private constructor() {
    this.initializeDefaultBudgets()
    this.startPeriodicEvaluation()
  }

  static getInstance(): PerformanceBudgetsMonitor {
    if (!PerformanceBudgetsMonitor.instance) {
      PerformanceBudgetsMonitor.instance = new PerformanceBudgetsMonitor()
    }
    return PerformanceBudgetsMonitor.instance
  }

  /**
   * Inicializa presupuestos por defecto
   */
  private initializeDefaultBudgets(): void {
    DEFAULT_PERFORMANCE_BUDGETS.forEach(budget => {
      this.budgets.set(budget.id, budget)
    })

    logger.info(LogCategory.MONITORING, 'Performance budgets initialized', {
      count: this.budgets.size,
    })
  }

  /**
   * Inicia evaluación periódica
   */
  private startPeriodicEvaluation(): void {
    this.evaluationInterval = setInterval(() => {
      this.evaluateAllBudgets()
    }, 60000) // Cada minuto
  }

  /**
   * Registra una medición de performance
   */
  recordMeasurement(
    budgetId: string,
    value: number,
    context: PerformanceMeasurement['context'] = {},
    metadata?: Record<string, any>
  ): string {
    const budget = this.budgets.get(budgetId)
    if (!budget || !budget.enabled) {
      logger.warn(LogCategory.MONITORING, `Budget not found or disabled: ${budgetId}`)
      return ''
    }

    const measurementId = `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const measurement: PerformanceMeasurement = {
      id: measurementId,
      budgetId,
      value,
      timestamp: Date.now(),
      context,
      metadata,
    }

    // Almacenar medición
    if (!this.measurements.has(budgetId)) {
      this.measurements.set(budgetId, [])
    }

    const budgetMeasurements = this.measurements.get(budgetId)!
    budgetMeasurements.push(measurement)

    // Mantener solo las últimas 1000 mediciones por presupuesto
    if (budgetMeasurements.length > 1000) {
      budgetMeasurements.splice(0, budgetMeasurements.length - 1000)
    }

    // Evaluar presupuesto inmediatamente
    this.evaluateBudget(budgetId, measurement)

    // Persistir en Redis
    this.persistMeasurement(measurement)

    logger.debug(LogCategory.MONITORING, `Performance measurement recorded`, {
      budgetId,
      value,
      unit: budget.unit,
    })

    return measurementId
  }

  /**
   * Evalúa un presupuesto específico
   */
  private async evaluateBudget(
    budgetId: string,
    measurement: PerformanceMeasurement
  ): Promise<BudgetEvaluation | null> {
    const budget = this.budgets.get(budgetId)
    if (!budget) {
      return null
    }

    const evaluation = this.createEvaluation(budget, measurement)

    // Generar alerta si es necesario
    if (evaluation.status === 'warning' || evaluation.status === 'critical') {
      await this.createBudgetAlert(evaluation)
    }

    return evaluation
  }

  /**
   * Crea evaluación de presupuesto
   */
  private createEvaluation(
    budget: PerformanceBudget,
    measurement: PerformanceMeasurement
  ): BudgetEvaluation {
    let status: 'good' | 'warning' | 'critical'
    let threshold: number
    let message: string

    if (measurement.value <= budget.target) {
      status = 'good'
      threshold = budget.target
      message = `${budget.name} dentro del objetivo: ${measurement.value}${budget.unit}`
    } else if (measurement.value <= budget.warning) {
      status = 'warning'
      threshold = budget.warning
      message = `${budget.name} excede objetivo pero dentro de advertencia: ${measurement.value}${budget.unit}`
    } else if (measurement.value <= budget.critical) {
      status = 'warning'
      threshold = budget.critical
      message = `${budget.name} en nivel de advertencia: ${measurement.value}${budget.unit}`
    } else {
      status = 'critical'
      threshold = budget.critical
      message = `${budget.name} en nivel crítico: ${measurement.value}${budget.unit}`
    }

    const deviation = ((measurement.value - budget.target) / budget.target) * 100

    const recommendations = this.generateRecommendations(budget, measurement, status)

    return {
      budgetId: budget.id,
      measurement,
      status,
      deviation,
      threshold,
      message,
      recommendations,
    }
  }

  /**
   * Genera recomendaciones basadas en la evaluación
   */
  private generateRecommendations(
    budget: PerformanceBudget,
    measurement: PerformanceMeasurement,
    status: 'good' | 'warning' | 'critical'
  ): string[] {
    if (status === 'good') {
      return []
    }

    const recommendations: string[] = []

    switch (budget.metricType) {
      case PerformanceMetricType.LARGEST_CONTENTFUL_PAINT:
        recommendations.push(
          'Optimizar imágenes y usar formatos modernos (WebP, AVIF)',
          'Implementar lazy loading para imágenes',
          'Reducir el tamaño del bundle JavaScript crítico',
          'Usar CDN para recursos estáticos'
        )
        break

      case PerformanceMetricType.FIRST_INPUT_DELAY:
        recommendations.push(
          'Reducir el tiempo de ejecución de JavaScript',
          'Dividir tareas largas en chunks más pequeños',
          'Usar Web Workers para procesamiento pesado',
          'Optimizar event listeners'
        )
        break

      case PerformanceMetricType.CUMULATIVE_LAYOUT_SHIFT:
        recommendations.push(
          'Especificar dimensiones para imágenes y videos',
          'Reservar espacio para contenido dinámico',
          'Evitar insertar contenido sobre contenido existente',
          'Usar transform en lugar de cambiar propiedades de layout'
        )
        break

      case PerformanceMetricType.BUNDLE_SIZE:
        recommendations.push(
          'Implementar code splitting',
          'Remover dependencias no utilizadas',
          'Usar tree shaking',
          'Comprimir assets con gzip/brotli'
        )
        break

      case PerformanceMetricType.RESPONSE_TIME:
        recommendations.push(
          'Optimizar consultas de base de datos',
          'Implementar cache en múltiples niveles',
          'Usar connection pooling',
          'Optimizar algoritmos de procesamiento'
        )
        break

      case PerformanceMetricType.ERROR_RATE:
        recommendations.push(
          'Revisar logs de errores recientes',
          'Implementar circuit breakers',
          'Mejorar validación de entrada',
          'Aumentar cobertura de tests'
        )
        break
    }

    return recommendations
  }

  /**
   * Crea alerta de presupuesto
   */
  private async createBudgetAlert(evaluation: BudgetEvaluation): Promise<void> {
    const budget = this.budgets.get(evaluation.budgetId)
    if (!budget) {
      return
    }

    const severity = evaluation.status === 'critical' ? AlertSeverity.HIGH : AlertSeverity.MEDIUM

    const title = `Presupuesto de Performance Excedido: ${budget.name}`
    const message = evaluation.message

    const details = {
      budgetId: budget.id,
      metricType: budget.metricType,
      value: evaluation.measurement.value,
      target: budget.target,
      threshold: evaluation.threshold,
      deviation: evaluation.deviation,
      unit: budget.unit,
      context: evaluation.measurement.context,
      recommendations: evaluation.recommendations,
    }

    await advancedAlertingEngine.createAlert(
      AlertType.PERFORMANCE,
      severity,
      title,
      message,
      details,
      'performance-budgets',
      ['performance', 'budget', budget.metricType, ...budget.tags]
    )
  }

  /**
   * Evalúa todos los presupuestos
   */
  private async evaluateAllBudgets(): Promise<void> {
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000

    for (const [budgetId, budget] of this.budgets) {
      if (!budget.enabled) {
        continue
      }

      const measurements = this.measurements.get(budgetId) || []
      const recentMeasurements = measurements.filter(m => m.timestamp > fiveMinutesAgo)

      if (recentMeasurements.length === 0) {
        continue
      }

      // Evaluar promedio de mediciones recientes
      const averageValue =
        recentMeasurements.reduce((sum, m) => sum + m.value, 0) / recentMeasurements.length

      const syntheticMeasurement: PerformanceMeasurement = {
        id: `synthetic_${budgetId}_${now}`,
        budgetId,
        value: averageValue,
        timestamp: now,
        context: { synthetic: true },
      }

      await this.evaluateBudget(budgetId, syntheticMeasurement)
    }
  }

  /**
   * Genera reporte de presupuestos
   */
  generateReport(periodHours: number = 24): BudgetReport {
    const now = Date.now()
    const periodStart = now - periodHours * 60 * 60 * 1000

    const budgetResults = Array.from(this.budgets.values())
      .filter(budget => budget.enabled)
      .map(budget => {
        const measurements = (this.measurements.get(budget.id) || []).filter(
          m => m.timestamp >= periodStart
        )

        if (measurements.length === 0) {
          return {
            budget,
            measurements: [],
            averageValue: 0,
            status: 'good' as const,
            trend: 'stable' as const,
            violations: 0,
          }
        }

        const averageValue = measurements.reduce((sum, m) => sum + m.value, 0) / measurements.length

        let status: 'good' | 'warning' | 'critical'
        if (averageValue <= budget.target) {
          status = 'good'
        } else if (averageValue <= budget.warning) {
          status = 'warning'
        } else {
          status = 'critical'
        }

        const violations = measurements.filter(m => m.value > budget.critical).length

        // Calcular tendencia
        const halfPeriod = measurements.length / 2
        const firstHalf = measurements.slice(0, halfPeriod)
        const secondHalf = measurements.slice(halfPeriod)

        const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length

        let trend: 'improving' | 'stable' | 'degrading'
        const change = ((secondAvg - firstAvg) / firstAvg) * 100

        if (change < -5) {
          trend = 'improving'
        } else if (change > 5) {
          trend = 'degrading'
        } else {
          trend = 'stable'
        }

        return {
          budget,
          measurements,
          averageValue,
          status,
          trend,
          violations,
        }
      })

    const totalBudgets = budgetResults.length
    const passingBudgets = budgetResults.filter(r => r.status === 'good').length
    const warningBudgets = budgetResults.filter(r => r.status === 'warning').length
    const failingBudgets = budgetResults.filter(r => r.status === 'critical').length

    const overallScore = totalBudgets > 0 ? Math.round((passingBudgets / totalBudgets) * 100) : 100

    const recommendations = this.generateReportRecommendations(budgetResults)

    return {
      period: {
        start: periodStart,
        end: now,
      },
      summary: {
        totalBudgets,
        passingBudgets,
        warningBudgets,
        failingBudgets,
        overallScore,
      },
      budgetResults,
      recommendations,
    }
  }

  /**
   * Genera recomendaciones para el reporte
   */
  private generateReportRecommendations(budgetResults: BudgetReport['budgetResults']): string[] {
    const recommendations: string[] = []

    const failingBudgets = budgetResults.filter(r => r.status === 'critical')
    const degradingBudgets = budgetResults.filter(r => r.trend === 'degrading')

    if (failingBudgets.length > 0) {
      recommendations.push(
        `${failingBudgets.length} presupuestos están en estado crítico y requieren atención inmediata`
      )
    }

    if (degradingBudgets.length > 0) {
      recommendations.push(
        `${degradingBudgets.length} presupuestos muestran tendencia de degradación`
      )
    }

    const highViolationBudgets = budgetResults.filter(r => r.violations > 10)
    if (highViolationBudgets.length > 0) {
      recommendations.push('Revisar presupuestos con alta frecuencia de violaciones')
    }

    if (
      budgetResults.some(
        r => r.budget.metricType === PerformanceMetricType.BUNDLE_SIZE && r.status !== 'good'
      )
    ) {
      recommendations.push('Implementar estrategias de optimización de bundle size')
    }

    if (
      budgetResults.some(
        r =>
          r.budget.metricType === PerformanceMetricType.LARGEST_CONTENTFUL_PAINT &&
          r.status !== 'good'
      )
    ) {
      recommendations.push('Optimizar Core Web Vitals para mejorar experiencia de usuario')
    }

    return recommendations
  }

  /**
   * Obtiene presupuestos activos
   */
  getActiveBudgets(): PerformanceBudget[] {
    return Array.from(this.budgets.values()).filter(budget => budget.enabled)
  }

  /**
   * Obtiene mediciones recientes
   */
  getRecentMeasurements(budgetId: string, hours: number = 1): PerformanceMeasurement[] {
    const measurements = this.measurements.get(budgetId) || []
    const cutoff = Date.now() - hours * 60 * 60 * 1000
    return measurements.filter(m => m.timestamp >= cutoff)
  }

  /**
   * Agrega presupuesto personalizado
   */
  addBudget(budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const fullBudget: PerformanceBudget = {
      ...budget,
      id,
      createdAt: now,
      updatedAt: now,
    }

    this.budgets.set(id, fullBudget)

    logger.info(LogCategory.MONITORING, `Custom performance budget added: ${budget.name}`, { id })

    return id
  }

  /**
   * Actualiza presupuesto
   */
  updateBudget(id: string, updates: Partial<PerformanceBudget>): boolean {
    const budget = this.budgets.get(id)
    if (!budget) {
      return false
    }

    const updatedBudget = {
      ...budget,
      ...updates,
      id, // Mantener ID original
      updatedAt: Date.now(),
    }

    this.budgets.set(id, updatedBudget)

    logger.info(LogCategory.MONITORING, `Performance budget updated: ${id}`)

    return true
  }

  /**
   * Elimina presupuesto
   */
  removeBudget(id: string): boolean {
    const deleted = this.budgets.delete(id)
    if (deleted) {
      this.measurements.delete(id)
      logger.info(LogCategory.MONITORING, `Performance budget removed: ${id}`)
    }
    return deleted
  }

  /**
   * Persiste medición en Redis
   */
  private async persistMeasurement(measurement: PerformanceMeasurement): Promise<void> {
    try {
      await this.redis.setex(
        `measurement:${measurement.id}`,
        86400 * 7, // 7 días
        JSON.stringify(measurement)
      )
    } catch (error) {
      logger.error(LogCategory.MONITORING, 'Error persisting measurement', error as Error)
    }
  }

  /**
   * Destructor
   */
  destroy(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval)
    }
  }
}

// Instancia singleton
export const performanceBudgetsMonitor = PerformanceBudgetsMonitor.getInstance()

/**
 * Utilidades para presupuestos de performance
 */
export const PerformanceBudgetUtils = {
  /**
   * Registra Core Web Vitals
   */
  recordWebVitals(
    vitals: {
      lcp?: number
      fid?: number
      cls?: number
      fcp?: number
      ttfb?: number
      inp?: number
    },
    context: PerformanceMeasurement['context'] = {}
  ): void {
    if (vitals.lcp) {
      const budgetId = context.device === 'mobile' ? 'lcp_mobile' : 'lcp_desktop'
      performanceBudgetsMonitor.recordMeasurement(budgetId, vitals.lcp, context)
    }

    if (vitals.fid) {
      performanceBudgetsMonitor.recordMeasurement('fid_global', vitals.fid, context)
    }

    if (vitals.cls) {
      performanceBudgetsMonitor.recordMeasurement('cls_global', vitals.cls, context)
    }
  },

  /**
   * Registra métricas de API
   */
  recordAPIMetrics(responseTime: number, context: PerformanceMeasurement['context'] = {}): void {
    performanceBudgetsMonitor.recordMeasurement('api_response_time', responseTime, context)
  },

  /**
   * Registra tasa de errores
   */
  recordErrorRate(errorRate: number, context: PerformanceMeasurement['context'] = {}): void {
    performanceBudgetsMonitor.recordMeasurement('error_rate', errorRate, context)
  },

  /**
   * Registra tamaño de bundle
   */
  recordBundleSize(size: number, context: PerformanceMeasurement['context'] = {}): void {
    performanceBudgetsMonitor.recordMeasurement('bundle_size_js', size, context)
  },

  /**
   * Obtiene estado general de presupuestos
   */
  getBudgetStatus(): {
    totalBudgets: number
    passingBudgets: number
    overallScore: number
    criticalBudgets: string[]
  } {
    const report = performanceBudgetsMonitor.generateReport(1) // Última hora

    return {
      totalBudgets: report.summary.totalBudgets,
      passingBudgets: report.summary.passingBudgets,
      overallScore: report.summary.overallScore,
      criticalBudgets: report.budgetResults
        .filter(r => r.status === 'critical')
        .map(r => r.budget.name),
    }
  },
}
