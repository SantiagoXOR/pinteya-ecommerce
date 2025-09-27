// =====================================================
// HOOK: TRACKING EVENTS ENTERPRISE
// Descripción: Hook para gestión de eventos de tracking tiempo real
// Basado en: Patrones TanStack Query + WebSocket simulation
// =====================================================

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  TrackingEvent,
  CreateTrackingEventRequest,
  Shipment,
  UseTrackingEventsReturn,
} from '@/types/logistics'

// =====================================================
// CONFIGURACIÓN DE QUERIES
// =====================================================

const TRACKING_QUERY_KEY = ['admin', 'logistics', 'tracking']
const REAL_TIME_REFETCH_INTERVAL = 30000 // 30 segundos

// =====================================================
// FUNCIONES DE API
// =====================================================

async function fetchTrackingEvents(shipmentId: number): Promise<{
  shipment: Shipment
  tracking_events: TrackingEvent[]
}> {
  const response = await fetch(`/api/admin/logistics/tracking/${shipmentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  const result = await response.json()
  return result.data
}

async function createTrackingEvent(
  shipmentId: number,
  data: Omit<CreateTrackingEventRequest, 'shipment_id'>
): Promise<TrackingEvent> {
  const response = await fetch(`/api/admin/logistics/tracking/${shipmentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  const result = await response.json()
  return result.data
}

async function bulkCreateTrackingEvents(
  shipmentId: number,
  events: Omit<CreateTrackingEventRequest, 'shipment_id'>[]
): Promise<TrackingEvent[]> {
  const response = await fetch(`/api/admin/logistics/tracking/${shipmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ events }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  const result = await response.json()
  return result.data
}

// =====================================================
// HOOK PRINCIPAL: useTrackingEvents
// =====================================================

export function useTrackingEvents(
  shipmentId: number,
  options?: {
    enabled?: boolean
    refetchInterval?: number
    realTime?: boolean
  }
): UseTrackingEventsReturn {
  const queryClient = useQueryClient()

  const queryKey = [...TRACKING_QUERY_KEY, shipmentId]

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchTrackingEvents(shipmentId),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.realTime
      ? (options?.refetchInterval ?? REAL_TIME_REFETCH_INTERVAL)
      : false,
    staleTime: options?.realTime ? 10000 : 60000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    data: data?.tracking_events,
    shipment: data?.shipment,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}

// =====================================================
// HOOK: useCreateTrackingEvent
// =====================================================

export function useCreateTrackingEvent(shipmentId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<CreateTrackingEventRequest, 'shipment_id'>) =>
      createTrackingEvent(shipmentId, data),
    onSuccess: newEvent => {
      // Actualizar cache de tracking events
      const queryKey = [...TRACKING_QUERY_KEY, shipmentId]

      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) {
          return oldData
        }

        return {
          ...oldData,
          tracking_events: [newEvent, ...oldData.tracking_events],
        }
      })

      // Invalidar cache relacionado
      queryClient.invalidateQueries({ queryKey: ['admin', 'logistics', 'shipments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'logistics', 'dashboard'] })

      toast.success('Evento de tracking agregado', {
        description: newEvent.description,
      })
    },
    onError: (error: Error) => {
      toast.error('Error al agregar evento', {
        description: error.message,
      })
    },
  })
}

// =====================================================
// HOOK: useBulkTrackingEvents
// =====================================================

export function useBulkTrackingEvents(shipmentId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (events: Omit<CreateTrackingEventRequest, 'shipment_id'>[]) =>
      bulkCreateTrackingEvents(shipmentId, events),
    onSuccess: newEvents => {
      // Actualizar cache
      const queryKey = [...TRACKING_QUERY_KEY, shipmentId]

      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) {
          return oldData
        }

        return {
          ...oldData,
          tracking_events: [...newEvents, ...oldData.tracking_events],
        }
      })

      // Invalidar cache relacionado
      queryClient.invalidateQueries({ queryKey: ['admin', 'logistics', 'shipments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'logistics', 'dashboard'] })

      toast.success(`${newEvents.length} eventos agregados exitosamente`)
    },
    onError: (error: Error) => {
      toast.error('Error al agregar eventos', {
        description: error.message,
      })
    },
  })
}

// =====================================================
// HOOK: useTrackingTimeline
// =====================================================

export function useTrackingTimeline(shipmentId: number) {
  const {
    data: events,
    shipment,
    isLoading,
    error,
  } = useTrackingEvents(shipmentId, {
    realTime: true,
  })

  // Procesar eventos para timeline
  const timelineEvents =
    events
      ?.map(event => ({
        ...event,
        isCompleted: true,
        isCurrent: false,
        isPending: false,
      }))
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()) || []

  // Determinar estado actual
  const currentStatus = shipment?.status
  const lastEvent = timelineEvents[timelineEvents.length - 1]

  // Estados esperados del timeline
  const expectedStates = [
    { status: 'pending', label: 'Pendiente', description: 'Envío creado' },
    { status: 'confirmed', label: 'Confirmado', description: 'Envío confirmado' },
    { status: 'picked_up', label: 'Recolectado', description: 'Recolectado por courier' },
    { status: 'in_transit', label: 'En tránsito', description: 'En camino' },
    { status: 'out_for_delivery', label: 'En reparto', description: 'Salió para entrega' },
    { status: 'delivered', label: 'Entregado', description: 'Entregado exitosamente' },
  ]

  const timelineStates = expectedStates.map(state => {
    const hasEvent = timelineEvents.some(event => event.status === state.status)
    const isCurrent = currentStatus === state.status
    const isCompleted = hasEvent && !isCurrent
    const isPending = !hasEvent && !isCurrent

    return {
      ...state,
      hasEvent,
      isCurrent,
      isCompleted,
      isPending,
      event: timelineEvents.find(event => event.status === state.status),
    }
  })

  return {
    events: timelineEvents,
    timelineStates,
    shipment,
    currentStatus,
    lastEvent,
    isLoading,
    error,
    progress: {
      completed: timelineStates.filter(state => state.isCompleted).length,
      total: timelineStates.length,
      percentage:
        (timelineStates.filter(state => state.isCompleted).length / timelineStates.length) * 100,
    },
  }
}

// =====================================================
// HOOK: useRealTimeTracking
// =====================================================

export function useRealTimeTracking(shipmentId: number) {
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const { data: events, refetch } = useTrackingEvents(shipmentId, {
    realTime: isRealTimeEnabled,
    refetchInterval: 15000, // 15 segundos para tiempo real
  })

  // Simular notificaciones de nuevos eventos
  useEffect(() => {
    if (events && events.length > 0) {
      setLastUpdate(new Date())
    }
  }, [events])

  const enableRealTime = useCallback(() => {
    setIsRealTimeEnabled(true)
    toast.info('Tracking en tiempo real activado')
  }, [])

  const disableRealTime = useCallback(() => {
    setIsRealTimeEnabled(false)
    toast.info('Tracking en tiempo real desactivado')
  }, [])

  const forceRefresh = useCallback(async () => {
    await refetch()
    setLastUpdate(new Date())
    toast.success('Tracking actualizado')
  }, [refetch])

  return {
    events,
    isRealTimeEnabled,
    lastUpdate,
    enableRealTime,
    disableRealTime,
    forceRefresh,
  }
}

// =====================================================
// HOOK: useTrackingAnalytics
// =====================================================

export function useTrackingAnalytics(shipmentId: number) {
  const { data: events, shipment } = useTrackingEvents(shipmentId)

  if (!events || !shipment) {
    return null
  }

  // Calcular métricas
  const totalEvents = events.length
  const uniqueLocations = [...new Set(events.map(e => e.location).filter(Boolean))].length

  // Tiempo entre eventos
  const eventTimes = events.map(e => new Date(e.occurred_at).getTime()).sort((a, b) => a - b)

  const averageTimeBetweenEvents =
    eventTimes.length > 1
      ? eventTimes.slice(1).reduce((acc, time, index) => {
          return acc + (time - eventTimes[index])
        }, 0) /
        (eventTimes.length - 1)
      : 0

  // Tiempo total de tránsito
  const firstEvent = events[events.length - 1] // Más antiguo
  const lastEvent = events[0] // Más reciente

  const totalTransitTime =
    firstEvent && lastEvent
      ? new Date(lastEvent.occurred_at).getTime() - new Date(firstEvent.occurred_at).getTime()
      : 0

  // Velocidad promedio (si hay ubicaciones)
  const eventsWithLocation = events.filter(e => e.latitude && e.longitude)
  let averageSpeed = 0

  if (eventsWithLocation.length > 1) {
    // Calcular distancia total aproximada entre puntos
    // (implementación simplificada)
    averageSpeed = uniqueLocations / (totalTransitTime / (1000 * 60 * 60)) // km/h aproximado
  }

  return {
    totalEvents,
    uniqueLocations,
    averageTimeBetweenEvents: averageTimeBetweenEvents / (1000 * 60), // minutos
    totalTransitTime: totalTransitTime / (1000 * 60 * 60), // horas
    averageSpeed: Math.round(averageSpeed * 10) / 10,
    eventsWithLocation: eventsWithLocation.length,
    locationCoverage: (eventsWithLocation.length / totalEvents) * 100,
  }
}

// =====================================================
// TIPOS EXTENDIDOS
// =====================================================

export interface UseTrackingEventsExtendedReturn extends UseTrackingEventsReturn {
  shipment?: Shipment
}
