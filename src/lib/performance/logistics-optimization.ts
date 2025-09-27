// =====================================================
// OPTIMIZACIÓN: PERFORMANCE LOGISTICS MODULE
// Descripción: Optimizaciones de performance para el módulo de logística
// Basado en: React.memo + useMemo + useCallback + Bundle Splitting
// =====================================================

import { memo, useMemo, useCallback, lazy, Suspense } from 'react'
import { debounce, throttle } from 'lodash-es'

// =====================================================
// LAZY LOADING DE COMPONENTES
// =====================================================

// Componentes principales con lazy loading
export const LazyLogisticsMap = lazy(() =>
  import('@/components/admin/logistics/LogisticsMap').then(module => ({
    default: module.LogisticsMap,
  }))
)

export const LazyTrackingTimeline = lazy(() =>
  import('@/components/admin/logistics/TrackingTimeline').then(module => ({
    default: module.TrackingTimeline,
  }))
)

export const LazyGeofenceManager = lazy(() =>
  import('@/components/admin/logistics/GeofenceManager').then(module => ({
    default: module.GeofenceManager,
  }))
)

export const LazyRealTimeDashboard = lazy(() =>
  import('@/components/admin/logistics/RealTimeDashboard').then(module => ({
    default: module.RealTimeDashboard,
  }))
)

export const LazyPerformanceChart = lazy(() =>
  import('@/components/admin/logistics/PerformanceChart').then(module => ({
    default: module.PerformanceChart,
  }))
)

// =====================================================
// COMPONENTE DE LOADING OPTIMIZADO
// =====================================================

export const LogisticsLoadingFallback = memo(() =>
  React.createElement(
    'div',
    { className: 'flex items-center justify-center p-8' },
    React.createElement(
      'div',
      { className: 'space-y-4 w-full max-w-md' },
      React.createElement('div', { className: 'h-4 bg-gray-200 rounded animate-pulse' }),
      React.createElement('div', { className: 'h-4 bg-gray-200 rounded animate-pulse w-3/4' }),
      React.createElement('div', { className: 'h-4 bg-gray-200 rounded animate-pulse w-1/2' })
    )
  )
)

LogisticsLoadingFallback.displayName = 'LogisticsLoadingFallback'

// =====================================================
// WRAPPER CON SUSPENSE
// =====================================================

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const LazyWrapper = memo(({ children, fallback }: LazyWrapperProps) =>
  React.createElement(
    Suspense,
    { fallback: fallback || React.createElement(LogisticsLoadingFallback) },
    children
  )
)

LazyWrapper.displayName = 'LazyWrapper'

// =====================================================
// HOOKS DE OPTIMIZACIÓN
// =====================================================

// Hook para debounce de búsquedas
export const useDebounceSearch = (callback: (value: string) => void, delay: number = 300) => {
  return useCallback(
    debounce((value: string) => {
      callback(value)
    }, delay),
    [callback, delay]
  )
}

// Hook para throttle de eventos de scroll/resize
export const useThrottleCallback = (callback: (...args: any[]) => void, delay: number = 100) => {
  return useCallback(
    throttle((...args: any[]) => {
      callback(...args)
    }, delay),
    [callback, delay]
  )
}

// Hook para memoización de datos complejos
export const useMemoizedData = <T>(data: T[], dependencies: any[] = []): T[] => {
  return useMemo(() => {
    if (!Array.isArray(data)) {
      return []
    }

    // Filtrar datos inválidos
    return data.filter(item => item != null)
  }, [data, ...dependencies])
}

// Hook para memoización de filtros
export const useMemoizedFilters = (data: any[], filters: Record<string, any>) => {
  return useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return []
    }

    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          return true
        }
        if (value === 'all') {
          return true
        }

        const itemValue = item[key]
        if (Array.isArray(value)) {
          return value.includes(itemValue)
        }

        return itemValue === value
      })
    })
  }, [data, filters])
}

// =====================================================
// OPTIMIZACIÓN DE WEBSOCKETS
// =====================================================

export class OptimizedWebSocketManager {
  private connections = new Map<string, WebSocket>()
  private messageQueue = new Map<string, any[]>()
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly BATCH_SIZE = 10
  private readonly BATCH_DELAY = 100 // ms

  // Crear conexión optimizada
  createConnection(
    url: string,
    options: {
      maxReconnectAttempts?: number
      reconnectDelay?: number
      heartbeatInterval?: number
    } = {}
  ) {
    const { maxReconnectAttempts = 5, reconnectDelay = 1000, heartbeatInterval = 30000 } = options

    if (this.connections.has(url)) {
      return this.connections.get(url)!
    }

    const ws = new WebSocket(url)
    this.connections.set(url, ws)
    this.messageQueue.set(url, [])

    // Optimizar envío de mensajes en batch
    this.setupBatchedMessaging(url)

    // Heartbeat optimizado
    this.setupHeartbeat(ws, heartbeatInterval)

    return ws
  }

  // Envío de mensajes en batch
  private setupBatchedMessaging(url: string) {
    const sendBatch = () => {
      const queue = this.messageQueue.get(url)
      if (!queue || queue.length === 0) {
        return
      }

      const ws = this.connections.get(url)
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return
      }

      // Enviar mensajes en batch
      const batch = queue.splice(0, this.BATCH_SIZE)
      if (batch.length > 0) {
        ws.send(
          JSON.stringify({
            type: 'batch',
            messages: batch,
            timestamp: Date.now(),
          })
        )
      }

      // Programar siguiente batch si hay más mensajes
      if (queue.length > 0) {
        this.batchTimeout = setTimeout(sendBatch, this.BATCH_DELAY)
      }
    }

    // Iniciar procesamiento de batch
    this.batchTimeout = setTimeout(sendBatch, this.BATCH_DELAY)
  }

  // Heartbeat optimizado
  private setupHeartbeat(ws: WebSocket, interval: number) {
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'ping',
            timestamp: Date.now(),
          })
        )
      } else {
        clearInterval(heartbeat)
      }
    }, interval)
  }

  // Agregar mensaje a la cola
  queueMessage(url: string, message: any) {
    const queue = this.messageQueue.get(url)
    if (queue) {
      queue.push(message)
    }
  }

  // Limpiar conexiones
  cleanup() {
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })

    this.connections.clear()
    this.messageQueue.clear()

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }
  }
}

// =====================================================
// OPTIMIZACIÓN DE MAPAS
// =====================================================

export class MapPerformanceOptimizer {
  private static instance: MapPerformanceOptimizer
  private markerPool: any[] = []
  private visibleMarkers = new Set<string>()
  private readonly MAX_VISIBLE_MARKERS = 100

  static getInstance(): MapPerformanceOptimizer {
    if (!MapPerformanceOptimizer.instance) {
      MapPerformanceOptimizer.instance = new MapPerformanceOptimizer()
    }
    return MapPerformanceOptimizer.instance
  }

  // Pool de markers para reutilización
  getMarker(): any {
    return this.markerPool.pop() || this.createNewMarker()
  }

  returnMarker(marker: any): void {
    if (this.markerPool.length < 50) {
      // Límite del pool
      this.markerPool.push(marker)
    }
  }

  private createNewMarker(): any {
    // Crear nuevo marker (implementación específica del mapa)
    return {
      id: Math.random().toString(36),
      visible: false,
      coordinates: [0, 0],
    }
  }

  // Clustering inteligente
  clusterMarkers(markers: any[], zoom: number): any[] {
    if (zoom > 12) {
      return markers
    } // No cluster en zoom alto

    const clustered: any[] = []
    const processed = new Set<string>()
    const clusterDistance = this.getClusterDistance(zoom)

    markers.forEach(marker => {
      if (processed.has(marker.id)) {
        return
      }

      const cluster = {
        id: `cluster-${marker.id}`,
        coordinates: marker.coordinates,
        markers: [marker],
        isCluster: true,
      }

      // Buscar markers cercanos
      markers.forEach(otherMarker => {
        if (otherMarker.id === marker.id || processed.has(otherMarker.id)) {
          return
        }

        const distance = this.calculateDistance(marker.coordinates, otherMarker.coordinates)

        if (distance < clusterDistance) {
          cluster.markers.push(otherMarker)
          processed.add(otherMarker.id)
        }
      })

      processed.add(marker.id)

      if (cluster.markers.length > 1) {
        clustered.push(cluster)
      } else {
        clustered.push(marker)
      }
    })

    return clustered
  }

  private getClusterDistance(zoom: number): number {
    // Distancia de clustering basada en zoom
    return Math.max(0.01, 0.1 / Math.pow(2, zoom - 8))
  }

  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const [lng1, lat1] = coord1
    const [lng2, lat2] = coord2

    const R = 6371 // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180
  }

  // Viewport culling
  cullMarkersOutsideViewport(markers: any[], bounds: any): any[] {
    return markers.filter(marker => {
      const [lng, lat] = marker.coordinates
      return lng >= bounds.west && lng <= bounds.east && lat >= bounds.south && lat <= bounds.north
    })
  }

  // Limitar markers visibles
  limitVisibleMarkers(markers: any[]): any[] {
    if (markers.length <= this.MAX_VISIBLE_MARKERS) {
      return markers
    }

    // Priorizar por importancia (ej: estado, fecha)
    return markers
      .sort((a, b) => {
        const priorityA = this.getMarkerPriority(a)
        const priorityB = this.getMarkerPriority(b)
        return priorityB - priorityA
      })
      .slice(0, this.MAX_VISIBLE_MARKERS)
  }

  private getMarkerPriority(marker: any): number {
    let priority = 0

    // Prioridad por estado
    const statusPriority = {
      exception: 100,
      out_for_delivery: 80,
      in_transit: 60,
      confirmed: 40,
      delivered: 20,
      pending: 10,
    }

    priority += statusPriority[marker.status as keyof typeof statusPriority] || 0

    // Prioridad por fecha (más reciente = mayor prioridad)
    if (marker.created_at) {
      const daysSinceCreated =
        (Date.now() - new Date(marker.created_at).getTime()) / (1000 * 60 * 60 * 24)
      priority += Math.max(0, 50 - daysSinceCreated)
    }

    return priority
  }
}

// =====================================================
// UTILIDADES DE PERFORMANCE
// =====================================================

// Medición de performance
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
}

// Medición de performance async
export const measureAsyncPerformance = async (name: string, fn: () => Promise<void>) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
}

// Detector de memory leaks
export const detectMemoryLeaks = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as any).memory
    if (memory) {
      console.log('Memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
      })
    }
  }
}

// Singleton para gestión global de performance
export class PerformanceManager {
  private static instance: PerformanceManager
  private wsManager: OptimizedWebSocketManager
  private mapOptimizer: MapPerformanceOptimizer

  private constructor() {
    this.wsManager = new OptimizedWebSocketManager()
    this.mapOptimizer = MapPerformanceOptimizer.getInstance()
  }

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager()
    }
    return PerformanceManager.instance
  }

  getWebSocketManager(): OptimizedWebSocketManager {
    return this.wsManager
  }

  getMapOptimizer(): MapPerformanceOptimizer {
    return this.mapOptimizer
  }

  cleanup(): void {
    this.wsManager.cleanup()
  }
}
