// =====================================================
// HOOK: OPTIMIZACIÓN DE RUTAS PARA LOGÍSTICA
// Descripción: Gestión inteligente de rutas para carriers propios
// Funcionalidades: Optimización automática, clustering geográfico
// =====================================================

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

interface Coordinates {
  lat: number
  lng: number
}

interface ShipmentLocation {
  id: string
  tracking_number: string
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'exception'
  destination: {
    address: string
    city: string
    coordinates?: Coordinates
  }
  courier: string
  estimated_delivery?: string
  cost: number
  created_at: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  route_id?: string
}

interface OptimizedRoute {
  id: string
  name: string
  shipments: ShipmentLocation[]
  total_distance: number
  estimated_time: number
  driver?: string
  vehicle?: string
  status: 'planned' | 'active' | 'completed'
  created_at: string
  start_location?: Coordinates
  waypoints: Coordinates[]
  optimization_score: number
}

interface RouteOptimizationParams {
  max_shipments_per_route?: number
  max_distance_per_route?: number
  max_time_per_route?: number
  priority_weight?: number
  distance_weight?: number
  time_weight?: number
}

interface Driver {
  id: string
  name: string
  phone: string
  vehicle_type: string
  license_plate: string
  status: 'available' | 'busy' | 'offline'
  current_location?: Coordinates
  max_capacity: number
}

// =====================================================
// CONFIGURACIÓN Y CONSTANTES
// =====================================================

const DEFAULT_OPTIMIZATION_PARAMS: RouteOptimizationParams = {
  max_shipments_per_route: 15,
  max_distance_per_route: 50, // km
  max_time_per_route: 480, // 8 horas en minutos
  priority_weight: 0.3,
  distance_weight: 0.4,
  time_weight: 0.3,
}

const CITY_COORDINATES = {
  'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
  Córdoba: { lat: -31.4201, lng: -64.1888 },
  Rosario: { lat: -32.9442, lng: -60.6505 },
  Mendoza: { lat: -32.8895, lng: -68.8458 },
  'La Plata': { lat: -34.9215, lng: -57.9545 },
  'Alta Gracia': { lat: -31.6539, lng: -64.4281 },
  'Mar del Plata': { lat: -38.0055, lng: -57.5426 },
  Salta: { lat: -24.7821, lng: -65.4232 },
  'San Miguel de Tucumán': { lat: -26.8083, lng: -65.2176 },
  'Santa Fe': { lat: -31.6333, lng: -60.7 },
}

// Datos mock para drivers (estructura actualizada para coincidir con DB)
const mockDrivers: Driver[] = [
  {
    id: 'driver-1',
    name: 'Carlos Rodríguez',
    phone: '+54 11 1234-5678',
    vehicle_type: 'Camioneta',
    license_plate: 'ABC123',
    status: 'available',
    max_capacity: 30,
  },
  {
    id: 'driver-2',
    name: 'María González',
    phone: '+54 11 2345-6789',
    vehicle_type: 'Furgón',
    license_plate: 'DEF456',
    status: 'available',
    max_capacity: 50,
  },
  {
    id: 'driver-3',
    name: 'Juan Pérez',
    phone: '+54 11 3456-7890',
    vehicle_type: 'Motocicleta',
    license_plate: 'GHI789',
    status: 'available',
    max_capacity: 10,
  },
  {
    id: 'driver-4',
    name: 'Ana Martínez',
    phone: '+54 11 4567-8901',
    vehicle_type: 'Camión',
    license_plate: 'JKL012',
    status: 'available',
    max_capacity: 100,
  },
  {
    id: 'driver-5',
    name: 'Luis Fernández',
    phone: '+54 11 5678-9012',
    vehicle_type: 'Camioneta',
    license_plate: 'MNO345',
    status: 'busy',
    max_capacity: 30,
  },
]

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

// Calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180
  const dLon = ((point2.lng - point1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Clustering geográfico usando K-means simplificado
function clusterShipments(
  shipments: ShipmentLocation[],
  maxClusters: number
): ShipmentLocation[][] {
  if (shipments.length <= maxClusters) {
    return shipments.map(s => [s])
  }

  // Inicializar centroides
  const centroids: Coordinates[] = []
  for (let i = 0; i < maxClusters; i++) {
    const randomIndex = Math.floor(Math.random() * shipments.length)
    const shipment = shipments[randomIndex]
    if (shipment.destination.coordinates) {
      centroids.push(shipment.destination.coordinates)
    }
  }

  let clusters: ShipmentLocation[][] = Array(maxClusters)
    .fill(null)
    .map(() => [])
  let iterations = 0
  const maxIterations = 10

  while (iterations < maxIterations) {
    // Limpiar clusters
    clusters = Array(maxClusters)
      .fill(null)
      .map(() => [])

    // Asignar cada envío al centroide más cercano
    shipments.forEach(shipment => {
      if (!shipment.destination.coordinates) return

      let minDistance = Infinity
      let closestCluster = 0

      centroids.forEach((centroid, index) => {
        const distance = calculateDistance(shipment.destination.coordinates!, centroid)
        if (distance < minDistance) {
          minDistance = distance
          closestCluster = index
        }
      })

      clusters[closestCluster].push(shipment)
    })

    // Recalcular centroides
    let changed = false
    clusters.forEach((cluster, index) => {
      if (cluster.length > 0) {
        const avgLat =
          cluster.reduce((sum, s) => sum + (s.destination.coordinates?.lat || 0), 0) /
          cluster.length
        const avgLng =
          cluster.reduce((sum, s) => sum + (s.destination.coordinates?.lng || 0), 0) /
          cluster.length

        const newCentroid = { lat: avgLat, lng: avgLng }
        const distance = calculateDistance(centroids[index], newCentroid)

        if (distance > 0.001) {
          // Umbral de convergencia
          centroids[index] = newCentroid
          changed = true
        }
      }
    })

    if (!changed) break
    iterations++
  }

  return clusters.filter(cluster => cluster.length > 0)
}

// Optimizar orden de envíos en una ruta (TSP simplificado)
function optimizeRouteOrder(
  shipments: ShipmentLocation[],
  startLocation?: Coordinates
): ShipmentLocation[] {
  if (shipments.length <= 2) return shipments

  const start = startLocation || CITY_COORDINATES['Buenos Aires']
  const unvisited = [...shipments]
  const route: ShipmentLocation[] = []
  let currentLocation = start

  while (unvisited.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Infinity

    unvisited.forEach((shipment, index) => {
      if (shipment.destination.coordinates) {
        const distance = calculateDistance(currentLocation, shipment.destination.coordinates)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIndex = index
        }
      }
    })

    const nearestShipment = unvisited.splice(nearestIndex, 1)[0]
    route.push(nearestShipment)
    currentLocation = nearestShipment.destination.coordinates || currentLocation
  }

  return route
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useRouteOptimization() {
  const [optimizationParams, setOptimizationParams] = useState<RouteOptimizationParams>(
    DEFAULT_OPTIMIZATION_PARAMS
  )
  const [isOptimizing, setIsOptimizing] = useState(false)
  const queryClient = useQueryClient()

  // Obtener rutas existentes
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery({
    queryKey: ['optimized-routes'],
    queryFn: async (): Promise<OptimizedRoute[]> => {
      try {
        const response = await fetch('/api/admin/logistics/routes')
        if (!response.ok) {
          console.warn('Error al cargar rutas, usando datos mock')
          return []
        }
        return response.json()
      } catch (error) {
        console.warn('Error al cargar rutas, usando datos mock:', error)
        return []
      }
    },
  })

  // Obtener drivers disponibles
  const { data: drivers = [], isLoading: isLoadingDrivers } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: async (): Promise<Driver[]> => {
      try {
        const response = await fetch('/api/admin/logistics/drivers')
        if (!response.ok) {
          console.warn('Error al cargar drivers, usando datos mock')
          return mockDrivers
        }
        return response.json()
      } catch (error) {
        console.warn('Error al cargar drivers, usando datos mock:', error)
        return mockDrivers
      }
    },
  })

  // Crear nueva ruta optimizada
  const createRouteMutation = useMutation({
    mutationFn: async (
      route: Omit<OptimizedRoute, 'id' | 'created_at'>
    ): Promise<OptimizedRoute> => {
      const response = await fetch('/api/admin/logistics/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(route),
      })

      if (!response.ok) {
        throw new Error('Error al crear ruta')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimized-routes'] })
    },
  })

  // Asignar driver a ruta
  const assignDriverMutation = useMutation({
    mutationFn: async ({ routeId, driverId }: { routeId: string; driverId: string }) => {
      const response = await fetch(`/api/admin/logistics/routes/${routeId}/assign-driver`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId }),
      })

      if (!response.ok) {
        throw new Error('Error al asignar driver')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimized-routes'] })
      queryClient.invalidateQueries({ queryKey: ['available-drivers'] })
    },
  })

  // Función principal de optimización
  const optimizeRoutes = useCallback(
    async (shipments: ShipmentLocation[]): Promise<OptimizedRoute[]> => {
      setIsOptimizing(true)

      try {
        // Filtrar solo envíos pendientes y confirmados
        const eligibleShipments = shipments.filter(
          s => ['pending', 'confirmed'].includes(s.status) && s.destination.coordinates
        )

        if (eligibleShipments.length === 0) {
          return []
        }

        // Calcular número óptimo de rutas
        const maxShipmentsPerRoute = optimizationParams.max_shipments_per_route || 15
        const numRoutes = Math.ceil(eligibleShipments.length / maxShipmentsPerRoute)

        // Clustering geográfico
        const clusters = clusterShipments(eligibleShipments, numRoutes)

        // Crear rutas optimizadas
        const optimizedRoutes: OptimizedRoute[] = []

        for (let i = 0; i < clusters.length; i++) {
          const cluster = clusters[i]
          if (cluster.length === 0) continue

          // Determinar ciudad principal del cluster
          const cities = cluster.map(s => s.destination.city)
          const mainCity = cities.reduce((a, b, _, arr) =>
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
          )

          const startLocation =
            CITY_COORDINATES[mainCity as keyof typeof CITY_COORDINATES] ||
            CITY_COORDINATES['Buenos Aires']

          // Optimizar orden de la ruta
          const optimizedOrder = optimizeRouteOrder(cluster, startLocation)

          // Calcular métricas de la ruta
          let totalDistance = 0
          let currentLocation = startLocation
          const waypoints: Coordinates[] = [startLocation]

          optimizedOrder.forEach(shipment => {
            if (shipment.destination.coordinates) {
              totalDistance += calculateDistance(currentLocation, shipment.destination.coordinates)
              waypoints.push(shipment.destination.coordinates)
              currentLocation = shipment.destination.coordinates
            }
          })

          // Estimar tiempo (velocidad promedio 30 km/h + 15 min por parada)
          const estimatedTime = Math.round((totalDistance / 30) * 60 + optimizedOrder.length * 15)

          // Calcular score de optimización
          const avgPriority =
            optimizedOrder.reduce((sum, s) => {
              const priorityScore = { low: 1, medium: 2, high: 3, urgent: 4 }[
                s.priority || 'medium'
              ]
              return sum + priorityScore
            }, 0) / optimizedOrder.length

          const optimizationScore = Math.round(
            optimizationParams.priority_weight! * avgPriority * 25 +
              optimizationParams.distance_weight! * Math.max(0, 100 - totalDistance) +
              optimizationParams.time_weight! * Math.max(0, 100 - estimatedTime / 5)
          )

          const route: OptimizedRoute = {
            id: `route-${Date.now()}-${i}`,
            name: `Ruta ${mainCity} #${i + 1}`,
            shipments: optimizedOrder,
            total_distance: Math.round(totalDistance * 10) / 10,
            estimated_time: estimatedTime,
            status: 'planned',
            created_at: new Date().toISOString(),
            start_location: startLocation,
            waypoints,
            optimization_score: optimizationScore,
          }

          optimizedRoutes.push(route)
        }

        // Ordenar rutas por score de optimización
        optimizedRoutes.sort((a, b) => b.optimization_score - a.optimization_score)

        return optimizedRoutes
      } catch (error) {
        console.error('Error en optimización de rutas:', error)
        throw error
      } finally {
        setIsOptimizing(false)
      }
    },
    [optimizationParams]
  )

  // Estadísticas de rutas
  const routeStats = useMemo(() => {
    const totalRoutes = routes.length
    const activeRoutes = routes.filter(r => r.status === 'active').length
    const completedRoutes = routes.filter(r => r.status === 'completed').length
    const totalShipments = routes.reduce((sum, r) => sum + r.shipments.length, 0)
    const totalDistance = routes.reduce((sum, r) => sum + r.total_distance, 0)
    const avgOptimizationScore =
      routes.length > 0
        ? routes.reduce((sum, r) => sum + r.optimization_score, 0) / routes.length
        : 0

    return {
      totalRoutes,
      activeRoutes,
      completedRoutes,
      totalShipments,
      totalDistance: Math.round(totalDistance * 10) / 10,
      avgOptimizationScore: Math.round(avgOptimizationScore),
    }
  }, [routes])

  return {
    // Datos
    routes,
    drivers,
    routeStats,
    optimizationParams,

    // Estados
    isOptimizing,
    isLoadingRoutes,
    isLoadingDrivers,

    // Funciones
    optimizeRoutes,
    setOptimizationParams,
    createRoute: createRouteMutation.mutateAsync,
    assignDriver: assignDriverMutation.mutateAsync,

    // Estados de mutaciones
    isCreatingRoute: createRouteMutation.isPending,
    isAssigningDriver: assignDriverMutation.isPending,
  }
}

export default useRouteOptimization
