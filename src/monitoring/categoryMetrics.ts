/**
 * Category Metrics Monitoring System
 * Real-time performance and success metrics tracking
 * Pinteya E-commerce - Enterprise Monitoring
 */

import React from 'react'
import type { CategoryId } from '@/types/categories'

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  /** Component render time in milliseconds */
  renderTime: number
  /** Time from user interaction to visual response */
  interactionTime: number
  /** Memory usage in MB */
  memoryUsage: number
  /** Bundle size impact in KB */
  bundleSize: number
  /** Timestamp of measurement */
  timestamp: number
}

/**
 * Accessibility metrics interface
 */
export interface AccessibilityMetrics {
  /** WCAG 2.1 AA compliance percentage */
  wcagCompliance: number
  /** Number of accessibility violations */
  violations: number
  /** Keyboard navigation success rate */
  keyboardNavSuccess: number
  /** Screen reader compatibility score */
  screenReaderScore: number
  /** Focus management score */
  focusManagementScore: number
}

/**
 * User experience metrics interface
 */
export interface UserExperienceMetrics {
  /** User interaction rate (clicks per session) */
  interactionRate: number
  /** Error rate percentage */
  errorRate: number
  /** Task completion rate percentage */
  taskCompletionRate: number
  /** User satisfaction score (1-10) */
  satisfactionScore: number
  /** Session duration in seconds */
  sessionDuration: number
}

/**
 * Business impact metrics interface
 */
export interface BusinessMetrics {
  /** Conversion rate from category to purchase */
  conversionRate: number
  /** Revenue per category interaction */
  revenuePerInteraction: number
  /** Page load time impact */
  pageLoadImpact: number
  /** SEO ranking impact */
  seoImpact: number
  /** Mobile usage percentage */
  mobileUsage: number
}

/**
 * Combined metrics interface
 */
export interface CategoryMetrics {
  performance: PerformanceMetrics
  accessibility: AccessibilityMetrics
  userExperience: UserExperienceMetrics
  business: BusinessMetrics
  metadata: {
    sessionId: string
    userId?: string
    timestamp: number
    version: string
  }
}

/**
 * Metrics configuration
 */
interface MetricsConfig {
  /** Whether metrics collection is enabled */
  enabled: boolean
  /** Sampling rate for metrics collection */
  samplingRate: number
  /** Batch size for sending metrics */
  batchSize: number
  /** Flush interval in milliseconds */
  flushInterval: number
  /** Performance measurement precision */
  precision: number
  /** Debug mode for development */
  debug: boolean
}

/**
 * Default metrics configuration
 */
const defaultConfig: MetricsConfig = {
  enabled: true,
  samplingRate: 0.1, // 10% sampling in production
  batchSize: 20,
  flushInterval: 30000, // 30 seconds
  precision: 2,
  debug: process.env.NODE_ENV === 'development',
}

/**
 * Performance measurement utilities
 */
class PerformanceMeasurer {
  private startTimes: Map<string, number> = new Map()
  private observer: PerformanceObserver | null = null

  constructor() {
    this.initializeObserver()
  }

  /**
   * Initialize performance observer
   */
  private initializeObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return
    }

    try {
      this.observer = new PerformanceObserver(list => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.name.startsWith('category-')) {
            this.handlePerformanceEntry(entry)
          }
        })
      })

      this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] })
    } catch (error) {
      console.warn('Failed to initialize performance observer:', error)
    }
  }

  /**
   * Handle performance entry
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    if (defaultConfig.debug) {
    }

    // Process specific performance metrics
    CategoryMetricsManager.getInstance().recordPerformanceEntry(entry)
  }

  /**
   * Start measuring performance
   */
  startMeasure(name: string): void {
    const startTime = performance.now()
    this.startTimes.set(name, startTime)

    if (performance.mark) {
      performance.mark(`${name}-start`)
    }
  }

  /**
   * End measuring performance
   */
  endMeasure(name: string): number {
    const startTime = this.startTimes.get(name)
    if (!startTime) {
      return 0
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    if (performance.mark && performance.measure) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
    }

    this.startTimes.delete(name)
    return Number(duration.toFixed(defaultConfig.precision))
  }

  /**
   * Get memory usage
   */
  getMemoryUsage(): number {
    if (typeof window === 'undefined' || !window.performance.memory) {
      return 0
    }

    const memory = window.performance.memory
    return Number((memory.usedJSHeapSize / 1024 / 1024).toFixed(defaultConfig.precision))
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.startTimes.clear()
  }
}

/**
 * Category metrics manager
 */
class CategoryMetricsManager {
  private static instance: CategoryMetricsManager | null = null
  private config: MetricsConfig
  private performanceMeasurer: PerformanceMeasurer
  private metricsQueue: CategoryMetrics[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private sessionId: string

  private constructor(config: Partial<MetricsConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.performanceMeasurer = new PerformanceMeasurer()
    this.sessionId = this.generateSessionId()
    this.initialize()
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<MetricsConfig>): CategoryMetricsManager {
    if (!CategoryMetricsManager.instance) {
      CategoryMetricsManager.instance = new CategoryMetricsManager(config)
    }
    return CategoryMetricsManager.instance
  }

  /**
   * Initialize metrics manager
   */
  private initialize(): void {
    if (!this.config.enabled) {
      return
    }

    // Set up flush timer
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)

    // Set up page unload handler
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush()
      })
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Check if should sample
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.samplingRate
  }

  /**
   * Start performance measurement
   */
  startPerformanceMeasure(name: string): void {
    if (!this.config.enabled || !this.shouldSample()) {
      return
    }
    this.performanceMeasurer.startMeasure(`category-${name}`)
  }

  /**
   * End performance measurement
   */
  endPerformanceMeasure(name: string): number {
    if (!this.config.enabled) {
      return 0
    }
    return this.performanceMeasurer.endMeasure(`category-${name}`)
  }

  /**
   * Record performance entry
   */
  recordPerformanceEntry(entry: PerformanceEntry): void {
    if (this.config.debug) {
    }
    // Process and store performance data
  }

  /**
   * Record accessibility metrics
   */
  recordAccessibilityMetrics(metrics: Partial<AccessibilityMetrics>): void {
    if (!this.config.enabled || !this.shouldSample()) {
      return
    }

    const fullMetrics: AccessibilityMetrics = {
      wcagCompliance: 100,
      violations: 0,
      keyboardNavSuccess: 100,
      screenReaderScore: 100,
      focusManagementScore: 100,
      ...metrics,
    }

    this.addToQueue({
      accessibility: fullMetrics,
    } as CategoryMetrics)
  }

  /**
   * Record user experience metrics
   */
  recordUserExperienceMetrics(metrics: Partial<UserExperienceMetrics>): void {
    if (!this.config.enabled || !this.shouldSample()) {
      return
    }

    const fullMetrics: UserExperienceMetrics = {
      interactionRate: 0,
      errorRate: 0,
      taskCompletionRate: 100,
      satisfactionScore: 8,
      sessionDuration: 0,
      ...metrics,
    }

    this.addToQueue({
      userExperience: fullMetrics,
    } as CategoryMetrics)
  }

  /**
   * Record business metrics
   */
  recordBusinessMetrics(metrics: Partial<BusinessMetrics>): void {
    if (!this.config.enabled || !this.shouldSample()) {
      return
    }

    const fullMetrics: BusinessMetrics = {
      conversionRate: 0,
      revenuePerInteraction: 0,
      pageLoadImpact: 0,
      seoImpact: 0,
      mobileUsage: 0,
      ...metrics,
    }

    this.addToQueue({
      business: fullMetrics,
    } as CategoryMetrics)
  }

  /**
   * Add metrics to queue
   */
  private addToQueue(partialMetrics: Partial<CategoryMetrics>): void {
    const metrics: CategoryMetrics = {
      performance: {
        renderTime: 0,
        interactionTime: 0,
        memoryUsage: this.performanceMeasurer.getMemoryUsage(),
        bundleSize: 0,
        timestamp: Date.now(),
      },
      accessibility: {
        wcagCompliance: 100,
        violations: 0,
        keyboardNavSuccess: 100,
        screenReaderScore: 100,
        focusManagementScore: 100,
      },
      userExperience: {
        interactionRate: 0,
        errorRate: 0,
        taskCompletionRate: 100,
        satisfactionScore: 8,
        sessionDuration: 0,
      },
      business: {
        conversionRate: 0,
        revenuePerInteraction: 0,
        pageLoadImpact: 0,
        seoImpact: 0,
        mobileUsage: 0,
      },
      metadata: {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        version: '1.0.0',
      },
      ...partialMetrics,
    }

    this.metricsQueue.push(metrics)

    if (this.config.debug) {
    }

    // Flush if queue is full
    if (this.metricsQueue.length >= this.config.batchSize) {
      this.flush()
    }
  }

  /**
   * Flush metrics to endpoint
   */
  private async flush(): Promise<void> {
    if (this.metricsQueue.length === 0) {
      return
    }

    const metricsToSend = [...this.metricsQueue]
    this.metricsQueue = []

    try {
      if (typeof window !== 'undefined' && window.fetch) {
        await fetch('/api/metrics/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ metrics: metricsToSend }),
        })
      }

      if (this.config.debug) {
      }
    } catch (error) {
      console.warn('Failed to flush metrics:', error)
      // Re-add to queue for retry
      this.metricsQueue.unshift(...metricsToSend)
    }
  }

  /**
   * Get current metrics summary
   */
  getSummary(): {
    queueSize: number
    sessionId: string
    config: MetricsConfig
  } {
    return {
      queueSize: this.metricsQueue.length,
      sessionId: this.sessionId,
      config: this.config,
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }

    this.flush()
    this.performanceMeasurer.destroy()
    CategoryMetricsManager.instance = null
  }
}

/**
 * React hook for category metrics
 */
export const useCategoryMetrics = (config?: Partial<MetricsConfig>) => {
  const manager = CategoryMetricsManager.getInstance(config)

  React.useEffect(() => {
    return () => {
      // Don't destroy on unmount, let it persist for the session
    }
  }, [])

  return {
    startPerformanceMeasure: manager.startPerformanceMeasure.bind(manager),
    endPerformanceMeasure: manager.endPerformanceMeasure.bind(manager),
    recordAccessibilityMetrics: manager.recordAccessibilityMetrics.bind(manager),
    recordUserExperienceMetrics: manager.recordUserExperienceMetrics.bind(manager),
    recordBusinessMetrics: manager.recordBusinessMetrics.bind(manager),
    getSummary: manager.getSummary.bind(manager),
  }
}

/**
 * Convenience functions
 */
export const startCategoryRender = () => {
  CategoryMetricsManager.getInstance().startPerformanceMeasure('render')
}

export const endCategoryRender = () => {
  return CategoryMetricsManager.getInstance().endPerformanceMeasure('render')
}

export const recordCategoryInteraction = (interactionTime: number) => {
  CategoryMetricsManager.getInstance().recordUserExperienceMetrics({
    interactionRate: 1,
  })
}

/**
 * Export manager class
 */
export { CategoryMetricsManager }
