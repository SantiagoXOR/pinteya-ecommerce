'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  proactiveMonitoring,
  reportError,
  SystemHealth,
  ErrorPattern,
  MonitoringConfig
} from '../lib/monitoring/proactive-monitoring'
import { logger, LogLevel, LogCategory } from '../lib/logger'

export interface MonitoringStats {
  totalErrors: number
  activePatterns: number
  recentAlerts: number
  systemHealth: SystemHealth
}

export interface UseProactiveMonitoringReturn {
  // Estado
  isMonitoring: boolean
  stats: MonitoringStats | null
  config: MonitoringConfig
  errorPatterns: ErrorPattern[]
  loading: boolean
  error: string | null

  // Acciones
  startMonitoring: () => void
  stopMonitoring: () => void
  reportError: (error: Error | string, context?: Record<string, any>) => Promise<void>
  updateConfig: (newConfig: Partial<MonitoringConfig>) => void
  addErrorPattern: (pattern: ErrorPattern) => void
  removeErrorPattern: (patternId: string) => void
  refreshStats: () => Promise<void>
  
  // Utilidades
  getHealthStatus: () => 'healthy' | 'warning' | 'critical' | 'down' | 'unknown'
  getHealthColor: () => string
  getHealthIcon: () => string
}

/**
 * Hook para gestionar el sistema de monitoreo proactivo
 */
export function useProactiveMonitoring(): UseProactiveMonitoringReturn {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [config, setConfig] = useState<MonitoringConfig>(proactiveMonitoring.getConfig())
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Actualizar estadísticas periódicamente
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      refreshStats()
    }, 30000) // Cada 30 segundos

    return () => clearInterval(interval)
  }, [isMonitoring])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar configuración
      const currentConfig = proactiveMonitoring.getConfig()
      setConfig(currentConfig)
      setIsMonitoring(currentConfig.enabled)

      // Cargar patrones de error
      const patterns = proactiveMonitoring.getErrorPatterns()
      setErrorPatterns(patterns)

      // Cargar estadísticas
      await refreshStats()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading monitoring data'
      setError(errorMessage)
      logger.error(LogLevel.ERROR, 'Failed to load monitoring data', { error: err }, LogCategory.SYSTEM)
    } finally {
      setLoading(false)
    }
  }

  const startMonitoring = useCallback(() => {
    try {
      proactiveMonitoring.start()
      setIsMonitoring(true)
      setError(null)
      logger.info(LogLevel.INFO, 'Monitoring started via hook', {}, LogCategory.SYSTEM)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start monitoring'
      setError(errorMessage)
      logger.error(LogLevel.ERROR, 'Failed to start monitoring', { error: err }, LogCategory.SYSTEM)
    }
  }, [])

  const stopMonitoring = useCallback(() => {
    try {
      proactiveMonitoring.stop()
      setIsMonitoring(false)
      setError(null)
      logger.info(LogLevel.INFO, 'Monitoring stopped via hook', {}, LogCategory.SYSTEM)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop monitoring'
      setError(errorMessage)
      logger.error(LogLevel.ERROR, 'Failed to stop monitoring', { error: err }, LogCategory.SYSTEM)
    }
  }, [])

  const handleReportError = useCallback(async (error: Error | string, context?: Record<string, any>) => {
    try {
      await reportError(error, context)
      // Actualizar estadísticas después de reportar error
      await refreshStats()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to report error'
      setError(errorMessage)
      logger.error(LogLevel.ERROR, 'Failed to report error', { error: err }, LogCategory.SYSTEM)
    }
  }, [])

  const updateConfig = useCallback((newConfig: Partial<MonitoringConfig>) => {
    try {
      proactiveMonitoring.updateConfig(newConfig)
      const updatedConfig = proactiveMonitoring.getConfig()
      setConfig(updatedConfig)
      setIsMonitoring(updatedConfig.enabled)
      setError(null)
      logger.info(LogLevel.INFO, 'Monitoring config updated', { newConfig }, LogCategory.SYSTEM)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update config'
      setError(errorMessage)
      logger.error(LogLevel.ERROR, 'Failed to update config', { error: err }, LogCategory.SYSTEM)
    }
  }, [])

  const addErrorPattern = useCallback((pattern: ErrorPattern) => {
    try {
      proactiveMonitoring.addErrorPattern(pattern)
      const updatedPatterns = proactiveMonitoring.getErrorPatterns()
      setErrorPatterns(updatedPatterns)
      setError(null)
      logger.info(LogLevel.INFO, 'Error pattern added', { patternId: pattern.id }, LogCategory.SYSTEM)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add error pattern'
      setError(errorMessage)
      logger.error(LogLevel.ERROR, 'Failed to add error pattern', { error: err }, LogCategory.SYSTEM)
    }
  }, [])

  const removeErrorPattern = useCallback((patternId: string) => {
    try {
      proactiveMonitoring.removeErrorPattern(patternId)
      const updatedPatterns = proactiveMonitoring.getErrorPatterns()
      setErrorPatterns(updatedPatterns)
      setError(null)
      logger.info(LogLevel.INFO, 'Error pattern removed', { patternId }, LogCategory.SYSTEM)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove error pattern'
      setError(errorMessage)
      logger.error(LogLevel.ERROR, 'Failed to remove error pattern', { error: err }, LogCategory.SYSTEM)
    }
  }, [])

  const refreshStats = useCallback(async () => {
    try {
      const newStats = await proactiveMonitoring.getMonitoringStats()
      setStats(newStats)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh stats'
      setError(errorMessage)
      logger.error(LogLevel.ERROR, 'Failed to refresh stats', { error: err }, LogCategory.SYSTEM)
    }
  }, [])

  const getHealthStatus = useCallback((): 'healthy' | 'warning' | 'critical' | 'down' | 'unknown' => {
    if (!stats?.systemHealth) return 'unknown'
    return stats.systemHealth.status
  }, [stats])

  const getHealthColor = useCallback((): string => {
    const status = getHealthStatus()
    switch (status) {
      case 'healthy':
        return 'text-green-500'
      case 'warning':
        return 'text-yellow-500'
      case 'critical':
        return 'text-red-500'
      case 'down':
        return 'text-red-700'
      default:
        return 'text-gray-500'
    }
  }, [getHealthStatus])

  const getHealthIcon = useCallback((): string => {
    const status = getHealthStatus()
    switch (status) {
      case 'healthy':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'critical':
        return '🚨'
      case 'down':
        return '❌'
      default:
        return '❓'
    }
  }, [getHealthStatus])

  return {
    // Estado
    isMonitoring,
    stats,
    config,
    errorPatterns,
    loading,
    error,

    // Acciones
    startMonitoring,
    stopMonitoring,
    reportError: handleReportError,
    updateConfig,
    addErrorPattern,
    removeErrorPattern,
    refreshStats,

    // Utilidades
    getHealthStatus,
    getHealthColor,
    getHealthIcon
  }
}

/**
 * Hook simplificado para solo reportar errores
 */
export function useErrorReporting() {
  const reportErrorCallback = useCallback(async (error: Error | string, context?: Record<string, any>) => {
    try {
      await reportError(error, context)
    } catch (err) {
      logger.error(LogLevel.ERROR, 'Failed to report error', { error: err }, LogCategory.SYSTEM)
    }
  }, [])

  return { reportError: reportErrorCallback }
}

/**
 * Hook para monitorear la salud del sistema en tiempo real
 */
export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const stats = await proactiveMonitoring.getMonitoringStats()
        setHealth(stats.systemHealth)
      } catch (err) {
        logger.error(LogLevel.ERROR, 'Failed to load system health', { error: err }, LogCategory.SYSTEM)
      } finally {
        setLoading(false)
      }
    }

    loadHealth()

    // Actualizar cada minuto
    const interval = setInterval(loadHealth, 60000)
    return () => clearInterval(interval)
  }, [])

  return { health, loading }
}