/**
 * Componente de navegación GPS en tiempo real para drivers
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { GoogleMap, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navigation, MapPin, CheckCircle, Clock, AlertTriangle, Phone, Package } from '@/lib/optimized-imports'
import { toast } from 'sonner'

interface DeliveryStop {
  orderId: number
  orderNumber: string
  address: string
  coordinates?: {
    lat: number
    lng: number
  }
  sequence: number
  status: 'pending' | 'current' | 'completed'
  estimatedArrival?: string
  total: number
  items: number
  notes?: string
}

interface LiveNavigationMapProps {
  stops: DeliveryStop[]
  onCompleteDelivery: (orderId: number) => void
  onNavigationUpdate?: (currentLocation: { lat: number; lng: number }) => void
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
}

const defaultCenter = {
  lat: -31.4201,
  lng: -64.1888,
}

export default function LiveNavigationMap({
  stops,
  onCompleteDelivery,
  onNavigationUpdate,
}: LiveNavigationMapProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [currentStopIndex, setCurrentStopIndex] = useState(0)
  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)

  useEffect(() => {
    // Verificar si Google Maps está cargado
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true)
      } else {
        setTimeout(checkGoogleMaps, 100)
      }
    }
    checkGoogleMaps()
  }, [])

  useEffect(() => {
    // Solicitar ubicación actual
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentLocation(location)
          if (onNavigationUpdate) {
            onNavigationUpdate(location)
          }
        },
        error => {
          console.error('Error getting location:', error)
          toast.error('No se pudo obtener la ubicación actual')
          // Usar ubicación por defecto (Córdoba)
          setCurrentLocation(defaultCenter)
        }
      )
    }
  }, [onNavigationUpdate])

  useEffect(() => {
    if (currentLocation && stops.length > 0) {
      calculateRoute()
    }
  }, [currentLocation, stops, currentStopIndex])

  const calculateRoute = async () => {
    if (!currentLocation || !window.google || !window.google.maps) return

    const directionsService = new google.maps.DirectionsService()
    const currentStop = stops.find(stop => stop.status === 'current')

    if (!currentStop || !currentStop.coordinates) {
      setDirections(null)
      return
    }

    console.log('🗺️ Calculando ruta GPS desde:', currentLocation, 'hacia:', currentStop.coordinates)

    try {
      const result = await directionsService.route({
        origin: currentLocation,
        destination: currentStop.coordinates,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
        avoidHighways: false,
        avoidTolls: false,
        unitSystem: google.maps.UnitSystem.METRIC,
        language: 'es',
        region: 'AR',
      })

      console.log('✅ Ruta GPS calculada exitosamente:', result)
      setDirections(result)

      // Extraer información de navegación
      const route = result.routes[0]
      const leg = route.legs[0]

      console.log('📊 Información de ruta:', {
        distance: leg.distance?.text,
        duration: leg.duration?.text,
        steps: leg.steps.length,
      })
    } catch (error) {
      console.error('❌ Error calculating route:', error)
      toast.error('Error al calcular la ruta GPS')
    }
  }
  const startNavigation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible')
      return
    }

    setIsNavigating(true)

    const id = navigator.geolocation.watchPosition(
      position => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(location)

        if (onNavigationUpdate) {
          onNavigationUpdate(location)
        }

        // Verificar si llegamos cerca del destino actual
        const currentStop = stops.find(
          stop =>
            stop.status === 'current' ||
            (stop.status === 'pending' && stop.sequence === currentStopIndex + 1)
        )

        if (currentStop && currentStop.coordinates) {
          const distance = calculateDistance(location, currentStop.coordinates)
          if (distance < 0.1) {
            // 100 metros
            toast.success(`Has llegado a ${currentStop.address}`)
          }
        }
      },
      error => {
        console.error('Error watching location:', error)
        toast.error('Error al seguir la ubicación')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )

    setWatchId(id)
    toast.success('Navegación iniciada')
  }

  const stopNavigation = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsNavigating(false)
    toast.info('Navegación detenida')
  }

  const handleCompleteDelivery = async (stop: DeliveryStop) => {
    try {
      const response = await fetch('/api/driver/complete-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: stop.orderId,
          deliveryLocation: currentLocation,
          deliveryTime: new Date().toISOString(),
          deliveryNotes: `Entregado en ${stop.address}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al completar la entrega')
      }

      const result = await response.json()

      if (result.success) {
        toast.success(`Entrega completada: ${stop.orderNumber}`)
        onCompleteDelivery(stop.orderId)
        setCurrentStopIndex(prev => prev + 1)
        setSelectedStop(null)
      } else {
        throw new Error(result.error || 'Error desconocido')
      }
    } catch (error) {
      console.error('Error completing delivery:', error)
      toast.error('Error al completar la entrega')
    }
  }

  const calculateDistance = (
    pos1: { lat: number; lng: number },
    pos2: { lat: number; lng: number }
  ) => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180
    const dLon = ((pos2.lng - pos1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pos1.lat * Math.PI) / 180) *
        Math.cos((pos2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount)
  }

  return (
    <div className='space-y-4'>
      {/* Controles de navegación */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Navigation className='h-5 w-5' />
              <span className='font-medium'>
                {selectedOrders.size} de {orders.length} órdenes seleccionadas
              </span>
            </div>
            <div className='flex gap-2'>
              {!isNavigating ? (
                <Button onClick={startNavigation} size='sm'>
                  Iniciar Navegación
                </Button>
              ) : (
                <Button onClick={stopNavigation} variant='outline' size='sm'>
                  Detener
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between text-sm'>
            <span>Paradas restantes: {stops.filter(s => s.status === 'pending').length}</span>
            <span>Completadas: {stops.filter(s => s.status === 'completed').length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Mapa */}
      <Card>
        <CardContent className='p-0'>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={currentLocation || defaultCenter}
            zoom={13}
            onLoad={map => {
              mapRef.current = map
            }}
          >
            {/* Mostrar ruta */}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: '#2563eb',
                    strokeWeight: 4,
                  },
                }}
              />
            )}

            {/* Marcador de ubicación actual */}
            {currentLocation && window.google && window.google.maps && (
              <Marker
                position={currentLocation}
                icon={{
                  url: '/icons/current-location.png',
                  scaledSize: new google.maps.Size(30, 30),
                }}
                title='Tu ubicación'
              />
            )}

            {/* Marcadores de paradas */}
            {window.google &&
              window.google.maps &&
              stops.map(stop => (
                <Marker
                  key={stop.orderId}
                  position={stop.coordinates || { lat: 0, lng: 0 }}
                  onClick={() => setSelectedStop(stop)}
                  icon={{
                    url:
                      stop.status === 'completed'
                        ? '/icons/marker-green.png'
                        : stop.status === 'current'
                          ? '/icons/marker-blue.png'
                          : '/icons/marker-red.png',
                    scaledSize: new google.maps.Size(25, 25),
                  }}
                  title={`${stop.orderNumber} - ${stop.address}`}
                />
              ))}

            {/* Info window para parada seleccionada */}
            {selectedStop && selectedStop.coordinates && (
              <InfoWindow
                position={selectedStop.coordinates}
                onCloseClick={() => setSelectedStop(null)}
              >
                <div className='p-2 max-w-xs'>
                  <h3 className='font-semibold'>{selectedStop.orderNumber}</h3>
                  <p className='text-sm text-gray-600'>{selectedStop.address}</p>
                  <p className='text-sm'>Total: {formatCurrency(selectedStop.total)}</p>
                  <p className='text-sm'>Items: {selectedStop.items}</p>
                  {selectedStop.status === 'pending' && (
                    <Button
                      size='sm'
                      className='mt-2 w-full'
                      onClick={() => handleCompleteDelivery(selectedStop)}
                    >
                      <CheckCircle className='h-4 w-4 mr-1' />
                      Completar Entrega
                    </Button>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </CardContent>
      </Card>

      {/* Lista de paradas */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Navigation className='h-5 w-5' />
            Paradas del Recorrido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {stops.map((stop, index) => (
              <div
                key={stop.orderId}
                className={`p-3 rounded-lg border ${
                  stop.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : stop.status === 'current'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        stop.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : stop.status === 'current'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {stop.sequence}
                    </div>
                    <div>
                      <p className='font-medium'>{stop.orderNumber}</p>
                      <p className='text-sm text-gray-600'>{stop.address}</p>
                      <p className='text-sm'>
                        {formatCurrency(stop.total)} • {stop.items} items
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant={
                        stop.status === 'completed'
                          ? 'default'
                          : stop.status === 'current'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {stop.status === 'completed'
                        ? 'Completada'
                        : stop.status === 'current'
                          ? 'Actual'
                          : 'Pendiente'}
                    </Badge>
                    {stop.status === 'pending' && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleCompleteDelivery(stop)}
                      >
                        <CheckCircle className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
