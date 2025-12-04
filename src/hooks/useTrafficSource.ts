/**
 * Hook para acceder al origen de tráfico en componentes React
 */

import { useState, useEffect } from 'react'
import {
  getTrafficSource,
  isMetaTraffic,
  TrafficSource,
  getTrafficSourceForAnalytics,
} from '@/lib/traffic-source-detector'

export interface UseTrafficSourceReturn {
  trafficSource: TrafficSource
  isMeta: boolean
  analyticsData: Record<string, any>
  refresh: () => void
}

/**
 * Hook que proporciona información del origen de tráfico
 * Detecta automáticamente al montar el componente
 */
export const useTrafficSource = (): UseTrafficSourceReturn => {
  const [trafficSource, setTrafficSource] = useState<TrafficSource>(() => {
    // Inicializar con detección inmediata
    if (typeof window !== 'undefined') {
      return getTrafficSource()
    }
    return {
      source: 'organic',
      detectedAt: Date.now(),
    }
  })

  const refresh = () => {
    if (typeof window !== 'undefined') {
      setTrafficSource(getTrafficSource())
    }
  }

  // Detectar al montar el componente
  useEffect(() => {
    refresh()
  }, [])

  return {
    trafficSource,
    isMeta: isMetaTraffic(),
    analyticsData: getTrafficSourceForAnalytics(),
    refresh,
  }
}

