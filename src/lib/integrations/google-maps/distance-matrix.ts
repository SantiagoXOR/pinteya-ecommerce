// =====================================================
// SERVICIO: GOOGLE MAPS DISTANCE MATRIX API
// Descripción: Integración con Google Maps Distance Matrix API
// Para cálculo de distancias y tiempos de viaje
// =====================================================

import { Address } from '@/types/logistics'

// =====================================================
// INTERFACES
// =====================================================

export interface DistanceMatrixRequest {
  origins: Array<{ lat: number; lng: number } | string>
  destinations: Array<{ lat: number; lng: number } | string>
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
  units?: 'metric' | 'imperial'
  departure_time?: 'now' | number // timestamp en segundos
  traffic_model?: 'best_guess' | 'pessimistic' | 'optimistic'
  avoid?: Array<'tolls' | 'highways' | 'ferries' | 'indoor'>
  language?: string
}

export interface DistanceMatrixResponse {
  status: string
  origin_addresses: string[]
  destination_addresses: string[]
  rows: DistanceMatrixRow[]
  error_message?: string
}

export interface DistanceMatrixRow {
  elements: DistanceMatrixElement[]
}

export interface DistanceMatrixElement {
  status: string
  distance?: {
    text: string
    value: number // en metros
  }
  duration?: {
    text: string
    value: number // en segundos
  }
  duration_in_traffic?: {
    text: string
    value: number // en segundos
  }
  fare?: {
    currency: string
    text: string
    value: number
  }
}

export interface RouteDistance {
  distance: {
    text: string
    value: number // metros
  }
  duration: {
    text: string
    value: number // segundos
  }
  durationInTraffic?: {
    text: string
    value: number // segundos
  }
  originAddress: string
  destinationAddress: string
  status: string
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function formatCoordinate(coord: { lat: number; lng: number } | string): string {
  if (typeof coord === 'string') {
    return coord
  }
  return `${coord.lat},${coord.lng}`
}

function formatAddress(address: Address): string {
  const parts = [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean)

  return parts.join(', ')
}

// =====================================================
// SERVICIO PRINCIPAL
// =====================================================

export class GoogleMapsDistanceMatrixService {
  private apiKey: string
  private baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Google Maps API key no configurada')
    }
  }

  /**
   * Calcula distancia y tiempo entre múltiples orígenes y destinos
   */
  async getDistanceMatrix(
    request: DistanceMatrixRequest
  ): Promise<DistanceMatrixResponse> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key no configurada')
    }

    // Construir URL
    const params = new URLSearchParams({
      key: this.apiKey,
      origins: request.origins.map(formatCoordinate).join('|'),
      destinations: request.destinations.map(formatCoordinate).join('|'),
      mode: request.mode || 'driving',
      units: request.units || 'metric',
      language: request.language || 'es',
    })

    if (request.departure_time) {
      if (request.departure_time === 'now') {
        params.append('departure_time', 'now')
      } else {
        params.append('departure_time', request.departure_time.toString())
      }
    }

    if (request.traffic_model) {
      params.append('traffic_model', request.traffic_model)
    }

    if (request.avoid && request.avoid.length > 0) {
      params.append('avoid', request.avoid.join('|'))
    }

    try {
      const response = await fetch(`${this.baseUrl}?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: DistanceMatrixResponse = await response.json()

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(data.error_message || `API error: ${data.status}`)
      }

      return data
    } catch (error) {
      console.error('Error calling Google Maps Distance Matrix API:', error)
      throw error
    }
  }

  /**
   * Calcula distancia y tiempo entre un origen y un destino
   */
  async getDistance(
    origin: { lat: number; lng: number } | string | Address,
    destination: { lat: number; lng: number } | string | Address,
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
      departureTime?: 'now' | number
      trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic'
    }
  ): Promise<RouteDistance | null> {
    // Convertir Address a coordenadas o string
    let originStr: string | { lat: number; lng: number }
    let destinationStr: string | { lat: number; lng: number }

    if ('street' in origin) {
      originStr = formatAddress(origin)
    } else {
      originStr = origin
    }

    if ('street' in destination) {
      destinationStr = formatAddress(destination)
    } else {
      destinationStr = destination
    }

    try {
      const response = await this.getDistanceMatrix({
        origins: [originStr],
        destinations: [destinationStr],
        mode: options?.mode || 'driving',
        departure_time: options?.departureTime || 'now',
        traffic_model: options?.trafficModel || 'best_guess',
      })

      if (response.rows.length === 0 || response.rows[0].elements.length === 0) {
        return null
      }

      const element = response.rows[0].elements[0]

      if (element.status !== 'OK') {
        console.warn(`Distance Matrix status: ${element.status}`)
        return null
      }

      return {
        distance: element.distance!,
        duration: element.duration!,
        durationInTraffic: element.duration_in_traffic
          ? {
              text: element.duration_in_traffic.text,
              value: element.duration_in_traffic.value,
            }
          : undefined,
        originAddress: response.origin_addresses[0],
        destinationAddress: response.destination_addresses[0],
        status: element.status,
      }
    } catch (error) {
      console.error('Error getting distance:', error)
      return null
    }
  }

  /**
   * Calcula distancias desde un origen a múltiples destinos
   */
  async getDistancesToMultipleDestinations(
    origin: { lat: number; lng: number } | string | Address,
    destinations: Array<{ lat: number; lng: number } | string | Address>,
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
      departureTime?: 'now' | number
      trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic'
    }
  ): Promise<RouteDistance[]> {
    // Convertir Address a coordenadas o string
    let originStr: string | { lat: number; lng: number }

    if ('street' in origin) {
      originStr = formatAddress(origin)
    } else {
      originStr = origin
    }

    const destinationsStr = destinations.map(dest => {
      if ('street' in dest) {
        return formatAddress(dest)
      }
      return dest
    })

    try {
      const response = await this.getDistanceMatrix({
        origins: [originStr],
        destinations: destinationsStr,
        mode: options?.mode || 'driving',
        departure_time: options?.departureTime || 'now',
        traffic_model: options?.trafficModel || 'best_guess',
      })

      if (response.rows.length === 0) {
        return []
      }

      const results: RouteDistance[] = []

      response.rows[0].elements.forEach((element, index) => {
        if (element.status === 'OK' && element.distance && element.duration) {
          results.push({
            distance: element.distance,
            duration: element.duration,
            durationInTraffic: element.duration_in_traffic
              ? {
                  text: element.duration_in_traffic.text,
                  value: element.duration_in_traffic.value,
                }
              : undefined,
            originAddress: response.origin_addresses[0],
            destinationAddress: response.destination_addresses[index],
            status: element.status,
          })
        }
      })

      return results
    } catch (error) {
      console.error('Error getting distances to multiple destinations:', error)
      return []
    }
  }

  /**
   * Calcula la distancia total de una ruta con múltiples waypoints
   */
  async calculateRouteDistance(
    waypoints: Array<{ lat: number; lng: number } | string | Address>,
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
      departureTime?: 'now' | number
      trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic'
    }
  ): Promise<{
    totalDistance: number // metros
    totalDuration: number // segundos
    totalDurationInTraffic?: number // segundos
    segments: RouteDistance[]
  } | null> {
    if (waypoints.length < 2) {
      return null
    }

    const segments: RouteDistance[] = []

    // Calcular distancia entre cada par consecutivo de waypoints
    for (let i = 0; i < waypoints.length - 1; i++) {
      const segment = await this.getDistance(waypoints[i], waypoints[i + 1], options)

      if (!segment) {
        console.warn(`No se pudo calcular distancia entre waypoint ${i} y ${i + 1}`)
        return null
      }

      segments.push(segment)
    }

    // Sumar todas las distancias y duraciones
    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance.value, 0)
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration.value, 0)
    const totalDurationInTraffic = segments.reduce(
      (sum, seg) => sum + (seg.durationInTraffic?.value || seg.duration.value),
      0
    )

    return {
      totalDistance,
      totalDuration,
      totalDurationInTraffic,
      segments,
    }
  }
}

// =====================================================
// INSTANCIA SINGLETON
// =====================================================

let distanceMatrixService: GoogleMapsDistanceMatrixService | null = null

export function getDistanceMatrixService(
  apiKey?: string
): GoogleMapsDistanceMatrixService {
  if (!distanceMatrixService) {
    distanceMatrixService = new GoogleMapsDistanceMatrixService(apiKey)
  }
  return distanceMatrixService
}

// =====================================================
// FUNCIONES DE CONVENIENCIA
// =====================================================

/**
 * Calcula distancia y tiempo entre dos puntos
 */
export async function calculateDistance(
  origin: { lat: number; lng: number } | string | Address,
  destination: { lat: number; lng: number } | string | Address,
  options?: {
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
    departureTime?: 'now' | number
    trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic'
  }
): Promise<RouteDistance | null> {
  const service = getDistanceMatrixService()
  return service.getDistance(origin, destination, options)
}

/**
 * Calcula distancias desde un origen a múltiples destinos
 */
export async function calculateDistancesToMultiple(
  origin: { lat: number; lng: number } | string | Address,
  destinations: Array<{ lat: number; lng: number } | string | Address>,
  options?: {
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
    departureTime?: 'now' | number
    trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic'
  }
): Promise<RouteDistance[]> {
  const service = getDistanceMatrixService()
  return service.getDistancesToMultipleDestinations(origin, destinations, options)
}

/**
 * Calcula la distancia total de una ruta con waypoints
 */
export async function calculateRouteTotalDistance(
  waypoints: Array<{ lat: number; lng: number } | string | Address>,
  options?: {
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
    departureTime?: 'now' | number
    trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic'
  }
): Promise<{
  totalDistance: number
  totalDuration: number
  totalDurationInTraffic?: number
  segments: RouteDistance[]
} | null> {
  const service = getDistanceMatrixService()
  return service.calculateRouteDistance(waypoints, options)
}
