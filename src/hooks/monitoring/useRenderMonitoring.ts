// ===================================
// PINTEYA E-COMMERCE - RENDER MONITORING SYSTEM
// Sistema de monitoreo en tiempo real para detectar problemas de renderizado
// ===================================

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

// ===================================
// TIPOS Y INTERFACES
// ===================================

export interface RenderMetrics {
  readonly componentName: string
  readonly renderCount: number
  readonly averageRenderTime: number
  readonly lastRenderTime: number
  readonly slowRenders: number
  readonly errorCount: number
  readonly memoryUsage?: number
  readonly timestamp: number
}

export interface PerformanceThresholds {
  readonly slowRenderThreshold: number // ms
  readonly maxRenderCount: number // renders per minute
  readonly memoryThreshold: number // MB
  readonly errorThreshold: number // errors per minute
}

export interface MonitoringAlert {
  readonly id: string
  readonly type: 'performance' | 'error' | 'memory' | 'render-loop'
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
  readonly message: string
  readonly componentName: string
  readonly metrics: Partial<RenderMetrics>
  readonly timestamp: number
  readonly resolved: boolean
}

export interface MonitoringState {
  readonly isEnabled: boolean
  readonly metrics: Map<string, RenderMetrics>
  readonly alerts: MonitoringAlert[]
  readonly globalStats: {
    readonly totalComponents: number
    readonly totalRenders: number
    readonly averageRenderTime: number
    readonly activeAlerts: number
  }
}

export interface MonitoringOptions {
  readonly enabled?: boolean
  readonly componentName: string
  readonly thresholds?: Partial<PerformanceThresholds>
  readonly enableToasts?: boolean
  readonly enableConsoleLogging?: boolean
  readonly enableLocalStorage?: boolean
  readonly sampleRate?: number // 0-1, percentage of renders to monitor
}

// ===================================
// CONFIGURACIÓN POR DEFECTO
// ===================================

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  slowRenderThreshold: 16, // 16ms = 60fps
  maxRenderCount: 60, // 60 renders per minute
  memoryThreshold: 100, // 100MB
  errorThreshold: 5, // 5 errors per minute
}

const DEFAULT_OPTIONS: Required<Omit<MonitoringOptions, 'componentName'>> = {
  enabled: process.env.NODE_ENV === 'development',
  thresholds: DEFAULT_THRESHOLDS,
  enableToasts: true,
  enableConsoleLogging: true,
  enableLocalStorage: true,
  sampleRate: 1.0,
}

// ===================================
// ALMACENAMIENTO GLOBAL
// ===================================

class MonitoringStore {
  private static instance: MonitoringStore
  private metrics = new Map<string, RenderMetrics>()
  private alerts: MonitoringAlert[] = []
  private listeners = new Set<(state: MonitoringState) => void>()

  static getInstance(): MonitoringStore {
    if (!MonitoringStore.instance) {
      MonitoringStore.instance = new MonitoringStore()
    }
    return MonitoringStore.instance
  }

  addListener(listener: (state: MonitoringState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    // Debounce para evitar loops infinitos
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout)
    }

    this.notifyTimeout = setTimeout(() => {
      const state = this.getState()
      this.listeners.forEach(listener => listener(state))
      this.notifyTimeout = null
    }, 16) // 16ms = ~60fps
  }

  private notifyTimeout: NodeJS.Timeout | null = null

  getState(): MonitoringState {
    const totalRenders = Array.from(this.metrics.values()).reduce(
      (sum, metric) => sum + metric.renderCount,
      0
    )

    const averageRenderTime = Array.from(this.metrics.values()).reduce(
      (sum, metric, _, arr) => sum + metric.averageRenderTime / arr.length,
      0
    )

    return {
      isEnabled: true,
      metrics: new Map(this.metrics),
      alerts: [...this.alerts],
      globalStats: {
        totalComponents: this.metrics.size,
        totalRenders,
        averageRenderTime,
        activeAlerts: this.alerts.filter(alert => !alert.resolved).length,
      },
    }
  }

  updateMetrics(componentName: string, metrics: Partial<RenderMetrics>): void {
    const existing = this.metrics.get(componentName)
    const updated: RenderMetrics = {
      componentName,
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      slowRenders: 0,
      errorCount: 0,
      timestamp: Date.now(),
      ...existing,
      ...metrics,
    }

    this.metrics.set(componentName, updated)
    this.notifyListeners()
  }

  addAlert(alert: Omit<MonitoringAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const newAlert: MonitoringAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false,
    }

    this.alerts.unshift(newAlert)

    // Mantener solo las últimas 100 alertas
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100)
    }

    this.notifyListeners()
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      ;(alert as any).resolved = true
      this.notifyListeners()
    }
  }

  clearAlerts(): void {
    this.alerts = []
    this.notifyListeners()
  }

  exportData(): string {
    return JSON.stringify(
      {
        metrics: Array.from(this.metrics.entries()),
        alerts: this.alerts,
        timestamp: Date.now(),
      },
      null,
      2
    )
  }
}

const monitoringStore = MonitoringStore.getInstance()

// ===================================
// UTILIDADES DE PERFORMANCE
// ===================================

function measureRenderTime<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  return { result, duration }
}

function getMemoryUsage(): number {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
  }
  return 0
}

function shouldSample(sampleRate: number): boolean {
  return Math.random() < sampleRate
}

// ===================================
// HOOK PRINCIPAL DE MONITOREO
// ===================================

export function useRenderMonitoring(options: MonitoringOptions) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { toast } = useToast()

  // Referencias para tracking
  const renderCountRef = useRef(0)
  const renderTimesRef = useRef<number[]>([])
  const lastRenderTimeRef = useRef(0)
  const slowRendersRef = useRef(0)
  const errorCountRef = useRef(0)
  const mountTimeRef = useRef(Date.now())

  // Estado local
  const [monitoringState, setMonitoringState] = useState<MonitoringState>(
    monitoringStore.getState()
  )

  // ===================================
  // FUNCIONES DE ANÁLISIS
  // ===================================

  const analyzePerformance = useCallback(
    (renderTime: number) => {
      const { componentName, thresholds } = opts

      // Detectar render lento
      if (renderTime > thresholds.slowRenderThreshold) {
        slowRendersRef.current++

        monitoringStore.addAlert({
          type: 'performance',
          severity: renderTime > thresholds.slowRenderThreshold * 2 ? 'high' : 'medium',
          message: `Render lento detectado: ${renderTime.toFixed(2)}ms (umbral: ${thresholds.slowRenderThreshold}ms)`,
          componentName,
          metrics: { lastRenderTime: renderTime },
        })

        if (opts.enableConsoleLogging) {
          console.warn(
            `[RenderMonitoring] Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`
          )
        }
      }

      // Detectar posible render loop
      const now = Date.now()
      const oneMinuteAgo = now - 60000
      const recentRenders = renderTimesRef.current.filter(time => time > oneMinuteAgo).length

      if (recentRenders > thresholds.maxRenderCount) {
        monitoringStore.addAlert({
          type: 'render-loop',
          severity: 'critical',
          message: `Posible render loop: ${recentRenders} renders en el último minuto (máximo: ${thresholds.maxRenderCount})`,
          componentName,
          metrics: { renderCount: recentRenders },
        })

        if (opts.enableToasts) {
          toast({
            title: 'Render Loop Detectado',
            description: `${componentName}: ${recentRenders} renders/min`,
            variant: 'destructive',
          })
        }
      }

      // Detectar uso excesivo de memoria
      const memoryUsage = getMemoryUsage()
      if (memoryUsage > thresholds.memoryThreshold) {
        monitoringStore.addAlert({
          type: 'memory',
          severity: 'high',
          message: `Uso de memoria elevado: ${memoryUsage.toFixed(2)}MB (umbral: ${thresholds.memoryThreshold}MB)`,
          componentName,
          metrics: { memoryUsage },
        })
      }
    },
    [opts, toast]
  )

  // ===================================
  // FUNCIÓN DE TRACKING DE RENDER
  // ===================================

  const trackRender = useCallback(() => {
    if (!opts.enabled || !shouldSample(opts.sampleRate)) {
      return
    }

    const renderTime = performance.now() - lastRenderTimeRef.current
    renderCountRef.current++
    renderTimesRef.current.push(Date.now())

    // Mantener solo los últimos 100 renders
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current = renderTimesRef.current.slice(-100)
    }

    // Calcular promedio de tiempo de render
    const recentTimes = renderTimesRef.current.slice(-10) // Últimos 10 renders
    const averageRenderTime = recentTimes.reduce((sum, time, i, arr) => {
      if (i === 0) {
        return 0
      }
      return sum + (time - arr[i - 1]) / (arr.length - 1)
    }, 0)

    // Actualizar métricas
    const metrics: Partial<RenderMetrics> = {
      renderCount: renderCountRef.current,
      averageRenderTime,
      lastRenderTime: renderTime,
      slowRenders: slowRendersRef.current,
      errorCount: errorCountRef.current,
      memoryUsage: getMemoryUsage(),
      timestamp: Date.now(),
    }

    monitoringStore.updateMetrics(opts.componentName, metrics)

    // Analizar performance
    analyzePerformance(renderTime)

    // Guardar en localStorage si está habilitado
    if (opts.enableLocalStorage) {
      try {
        localStorage.setItem(`render-monitoring-${opts.componentName}`, JSON.stringify(metrics))
      } catch (error) {
        // Ignorar errores de localStorage
      }
    }

    lastRenderTimeRef.current = performance.now()
  }, [opts, analyzePerformance])

  // ===================================
  // FUNCIÓN DE TRACKING DE ERRORES
  // ===================================

  const trackError = useCallback(
    (error: Error, errorInfo?: any) => {
      if (!opts.enabled) {
        return
      }

      errorCountRef.current++

      monitoringStore.addAlert({
        type: 'error',
        severity: 'high',
        message: `Error en componente: ${error.message}`,
        componentName: opts.componentName,
        metrics: { errorCount: errorCountRef.current },
      })

      if (opts.enableConsoleLogging) {
        console.error(`[RenderMonitoring] Error in ${opts.componentName}:`, error, errorInfo)
      }

      if (opts.enableToasts) {
        toast({
          title: 'Error de Componente',
          description: `${opts.componentName}: ${error.message}`,
          variant: 'destructive',
        })
      }
    },
    [opts, toast]
  )

  // ===================================
  // EFECTOS
  // ===================================

  // Suscribirse a cambios del store
  useEffect(() => {
    const unsubscribe = monitoringStore.addListener(setMonitoringState)
    return unsubscribe
  }, [])

  // Track render en cada render del componente
  useEffect(() => {
    trackRender()
  })

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (opts.enableConsoleLogging) {
        const totalTime = Date.now() - mountTimeRef.current
        console.log(
          `[RenderMonitoring] ${opts.componentName} unmounted after ${totalTime}ms, ` +
            `${renderCountRef.current} renders, ` +
            `${slowRendersRef.current} slow renders, ` +
            `${errorCountRef.current} errors`
        )
      }
    }
  }, [opts])

  // ===================================
  // API PÚBLICA
  // ===================================

  return {
    // Estado
    isEnabled: opts.enabled,
    metrics: monitoringState.metrics.get(opts.componentName),
    globalStats: monitoringState.globalStats,
    alerts: monitoringState.alerts.filter(alert => alert.componentName === opts.componentName),

    // Funciones
    trackError,
    trackRender,

    // Utilidades
    exportData: () => monitoringStore.exportData(),
    clearAlerts: () => monitoringStore.clearAlerts(),
    resolveAlert: (alertId: string) => monitoringStore.resolveAlert(alertId),
  }
}

// ===================================
// HOOK PARA MONITOREO GLOBAL
// ===================================

export function useGlobalMonitoring() {
  const [state, setState] = useState<MonitoringState>(monitoringStore.getState())

  useEffect(() => {
    const unsubscribe = monitoringStore.addListener(setState)
    return unsubscribe
  }, [])

  return {
    ...state,
    exportData: () => monitoringStore.exportData(),
    clearAlerts: () => monitoringStore.clearAlerts(),
    resolveAlert: (alertId: string) => monitoringStore.resolveAlert(alertId),
  }
}

// ===================================
// HOC PARA MONITOREO AUTOMÁTICO
// ===================================

export function withRenderMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<MonitoringOptions, 'componentName'>
): React.ComponentType<P> {
  const componentName = Component.displayName || Component.name || 'UnknownComponent'

  const WrappedComponent: React.FC<P> = props => {
    const { trackError } = useRenderMonitoring({
      ...options,
      componentName,
    })

    // Error boundary simple
    useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        trackError(new Error(event.message))
      }

      window.addEventListener('error', handleError)
      return () => window.removeEventListener('error', handleError)
    }, [trackError])

    return React.createElement(Component, props)
  }

  WrappedComponent.displayName = `withRenderMonitoring(${componentName})`
  return WrappedComponent
}

// ===================================
// UTILIDADES EXPORTADAS
// ===================================

/**
 * Obtiene métricas de un componente específico
 */
export function getComponentMetrics(componentName: string): RenderMetrics | undefined {
  return monitoringStore.getState().metrics.get(componentName)
}

/**
 * Obtiene todas las alertas activas
 */
export function getActiveAlerts(): MonitoringAlert[] {
  return monitoringStore.getState().alerts.filter(alert => !alert.resolved)
}

/**
 * Exporta todos los datos de monitoreo
 */
export function exportMonitoringData(): string {
  return monitoringStore.exportData()
}

/**
 * Limpia todas las alertas
 */
export function clearAllAlerts(): void {
  monitoringStore.clearAlerts()
}
