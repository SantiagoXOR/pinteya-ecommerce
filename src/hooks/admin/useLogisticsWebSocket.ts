// =====================================================
// HOOK: LOGISTICS WEBSOCKET ENTERPRISE
// Descripción: Hook React para WebSocket tiempo real
// Basado en: React Hooks + WebSocket + Context
// =====================================================

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getLogisticsWebSocket,
  LogisticsWebSocketSimulator,
  TrackingUpdate,
  GeofenceEvent,
  LogisticsAlert,
} from '@/lib/websockets/logistics-websocket'

// =====================================================
// INTERFACES
// =====================================================

export interface UseLogisticsWebSocketOptions {
  enabled?: boolean
  autoConnect?: boolean
  showNotifications?: boolean
  simulateInDevelopment?: boolean
}

export interface UseLogisticsWebSocketReturn {
  isConnected: boolean
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error'
  connect: () => Promise<void>
  disconnect: () => void
  subscribeToShipment: (shipmentId: number) => void
  unsubscribeFromShipment: (shipmentId: number) => void
  subscribeToGeofence: (zoneId: string) => void
  subscribeToAlerts: () => void
  lastTrackingUpdate: TrackingUpdate | null
  lastAlert: LogisticsAlert | null
  lastGeofenceEvent: GeofenceEvent | null
  alerts: LogisticsAlert[]
  clearAlerts: () => void
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useLogisticsWebSocket(
  options: UseLogisticsWebSocketOptions = {}
): UseLogisticsWebSocketReturn {
  const {
    enabled = true,
    autoConnect = true,
    showNotifications = true,
    simulateInDevelopment = true,
  } = options

  // Estados
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected')
  const [lastTrackingUpdate, setLastTrackingUpdate] = useState<TrackingUpdate | null>(null)
  const [lastAlert, setLastAlert] = useState<LogisticsAlert | null>(null)
  const [lastGeofenceEvent, setLastGeofenceEvent] = useState<GeofenceEvent | null>(null)
  const [alerts, setAlerts] = useState<LogisticsAlert[]>([])

  // Referencias
  const wsRef = useRef(getLogisticsWebSocket())
  const simulatorRef = useRef<LogisticsWebSocketSimulator | null>(null)
  const queryClient = useQueryClient()

  // =====================================================
  // CONFIGURACIÓN DE EVENTOS
  // =====================================================

  useEffect(() => {
    if (!enabled) {
      return
    }

    const ws = wsRef.current

    // Eventos de conexión
    const handleConnected = () => {
      setIsConnected(true)
      setConnectionState('connected')
      if (showNotifications) {
        toast.success('Conectado al sistema de tracking en tiempo real')
      }
    }

    const handleDisconnected = () => {
      setIsConnected(false)
      setConnectionState('disconnected')
      if (showNotifications) {
        toast.warning('Desconectado del sistema de tracking')
      }
    }

    const handleError = (error: any) => {
      setConnectionState('error')
      console.error('WebSocket error:', error)
      if (showNotifications) {
        toast.error('Error en la conexión de tiempo real')
      }
    }

    // Eventos de datos
    const handleTrackingUpdate = (update: TrackingUpdate) => {
      setLastTrackingUpdate(update)

      // Invalidar cache de tracking para el shipment
      queryClient.invalidateQueries({
        queryKey: ['admin', 'logistics', 'tracking', update.shipment_id],
      })

      // Invalidar dashboard si es necesario
      queryClient.invalidateQueries({
        queryKey: ['admin', 'logistics', 'dashboard'],
      })

      if (showNotifications) {
        toast.info(`Actualización de envío #${update.shipment_id}`, {
          description: `Estado: ${update.status}`,
        })
      }
    }

    const handleAlert = (alert: LogisticsAlert) => {
      setLastAlert(alert)
      setAlerts(prev => [alert, ...prev.slice(0, 49)]) // Mantener últimas 50

      if (showNotifications) {
        const toastFn =
          alert.severity === 'critical'
            ? toast.error
            : alert.severity === 'high'
              ? toast.warning
              : toast.info

        toastFn(`Alerta: ${alert.type}`, {
          description: alert.message,
        })
      }
    }

    const handleGeofenceEvent = (event: GeofenceEvent) => {
      setLastGeofenceEvent(event)

      // Invalidar cache relacionado
      queryClient.invalidateQueries({
        queryKey: ['admin', 'logistics', 'tracking', event.shipment_id],
      })

      if (showNotifications) {
        toast.info(`Evento de zona: ${event.zone_name}`, {
          description: `Envío #${event.shipment_id} ${event.event_type === 'enter' ? 'entró' : 'salió'}`,
        })
      }
    }

    // Registrar eventos
    ws.on('connected', handleConnected)
    ws.on('disconnected', handleDisconnected)
    ws.on('error', handleError)
    ws.on('tracking_update', handleTrackingUpdate)
    ws.on('alert', handleAlert)
    ws.on('geofence_event', handleGeofenceEvent)

    // Cleanup
    return () => {
      ws.off('connected', handleConnected)
      ws.off('disconnected', handleDisconnected)
      ws.off('error', handleError)
      ws.off('tracking_update', handleTrackingUpdate)
      ws.off('alert', handleAlert)
      ws.off('geofence_event', handleGeofenceEvent)
    }
  }, [enabled, showNotifications, queryClient])

  // =====================================================
  // SIMULADOR PARA DESARROLLO
  // =====================================================

  useEffect(() => {
    if (!enabled || !simulateInDevelopment || process.env.NODE_ENV !== 'development') {
      return
    }

    // Crear simulador si no existe
    if (!simulatorRef.current) {
      simulatorRef.current = new LogisticsWebSocketSimulator()

      // Conectar eventos del simulador a los handlers
      simulatorRef.current.on('tracking_update', (update: TrackingUpdate) => {
        setLastTrackingUpdate(update)
        queryClient.invalidateQueries({
          queryKey: ['admin', 'logistics', 'tracking', update.shipment_id],
        })
      })

      simulatorRef.current.on('alert', (alert: LogisticsAlert) => {
        setLastAlert(alert)
        setAlerts(prev => [alert, ...prev.slice(0, 49)])

        if (showNotifications) {
          toast.info(`🎭 Simulación - ${alert.type}`, {
            description: alert.message,
          })
        }
      })

      simulatorRef.current.on('geofence_event', (event: GeofenceEvent) => {
        setLastGeofenceEvent(event)
        queryClient.invalidateQueries({
          queryKey: ['admin', 'logistics', 'tracking', event.shipment_id],
        })
      })
    }

    // Iniciar simulador
    simulatorRef.current.start()
    setIsConnected(true)
    setConnectionState('connected')

    if (showNotifications) {
      toast.success('🎭 Simulador de WebSocket iniciado')
    }

    return () => {
      if (simulatorRef.current) {
        simulatorRef.current.stop()
      }
    }
  }, [enabled, simulateInDevelopment, showNotifications, queryClient])

  // =====================================================
  // AUTO-CONEXIÓN
  // =====================================================

  useEffect(() => {
    if (enabled && autoConnect && process.env.NODE_ENV !== 'development') {
      connect()
    }
  }, [enabled, autoConnect])

  // =====================================================
  // FUNCIONES PÚBLICAS
  // =====================================================

  const connect = useCallback(async () => {
    if (process.env.NODE_ENV === 'development' && simulateInDevelopment) {
      // En desarrollo usar simulador
      return
    }

    try {
      setConnectionState('connecting')
      await wsRef.current.connect()
    } catch (error) {
      setConnectionState('error')
      throw error
    }
  }, [simulateInDevelopment])

  const disconnect = useCallback(() => {
    if (process.env.NODE_ENV === 'development' && simulatorRef.current) {
      simulatorRef.current.stop()
      setIsConnected(false)
      setConnectionState('disconnected')
      return
    }

    wsRef.current.disconnect()
    setIsConnected(false)
    setConnectionState('disconnected')
  }, [])

  const subscribeToShipment = useCallback((shipmentId: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎭 Simulando suscripción a envío ${shipmentId}`)
      return
    }

    wsRef.current.subscribeToShipment(shipmentId)
  }, [])

  const unsubscribeFromShipment = useCallback((shipmentId: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎭 Simulando desuscripción de envío ${shipmentId}`)
      return
    }

    wsRef.current.unsubscribeFromShipment(shipmentId)
  }, [])

  const subscribeToGeofence = useCallback((zoneId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎭 Simulando suscripción a zona ${zoneId}`)
      return
    }

    wsRef.current.subscribeToGeofence(zoneId)
  }, [])

  const subscribeToAlerts = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎭 Simulando suscripción a alertas')
      return
    }

    wsRef.current.subscribeToAlerts()
  }, [])

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    subscribeToShipment,
    unsubscribeFromShipment,
    subscribeToGeofence,
    subscribeToAlerts,
    lastTrackingUpdate,
    lastAlert,
    lastGeofenceEvent,
    alerts,
    clearAlerts,
  }
}

// =====================================================
// HOOK PARA TRACKING ESPECÍFICO
// =====================================================

export function useShipmentTracking(shipmentId: number) {
  const { isConnected, subscribeToShipment, unsubscribeFromShipment, lastTrackingUpdate } =
    useLogisticsWebSocket({
      simulateInDevelopment: false, // Deshabilitado para evitar notificaciones persistentes
    })

  const [trackingHistory, setTrackingHistory] = useState<TrackingUpdate[]>([])

  // Suscribirse al envío específico
  useEffect(() => {
    if (isConnected && shipmentId) {
      subscribeToShipment(shipmentId)

      return () => {
        unsubscribeFromShipment(shipmentId)
      }
    }
  }, [isConnected, shipmentId, subscribeToShipment, unsubscribeFromShipment])

  // Actualizar historial cuando llegan nuevas actualizaciones
  useEffect(() => {
    if (lastTrackingUpdate && lastTrackingUpdate.shipment_id === shipmentId) {
      setTrackingHistory(prev => [lastTrackingUpdate, ...prev.slice(0, 99)]) // Últimas 100
    }
  }, [lastTrackingUpdate, shipmentId])

  return {
    isConnected,
    shipmentId,
    currentLocation: lastTrackingUpdate?.shipment_id === shipmentId ? lastTrackingUpdate : null,
    trackingHistory: trackingHistory.filter(update => update.shipment_id === shipmentId),
  }
}

// =====================================================
// HOOK PARA ALERTAS
// =====================================================

export function useLogisticsAlerts() {
  const { isConnected, subscribeToAlerts, alerts, clearAlerts, lastAlert } = useLogisticsWebSocket({
    simulateInDevelopment: false, // Deshabilitado para evitar notificaciones persistentes
  })

  // Auto-suscribirse a alertas
  useEffect(() => {
    if (isConnected) {
      subscribeToAlerts()
    }
  }, [isConnected, subscribeToAlerts])

  // Filtrar alertas por severidad
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical')
  const highAlerts = alerts.filter(alert => alert.severity === 'high')
  const unreadAlerts = alerts.filter(alert => !alert.auto_resolve)

  return {
    isConnected,
    alerts,
    criticalAlerts,
    highAlerts,
    unreadAlerts,
    lastAlert,
    clearAlerts,
    totalAlerts: alerts.length,
    criticalCount: criticalAlerts.length,
    highCount: highAlerts.length,
    unreadCount: unreadAlerts.length,
  }
}
