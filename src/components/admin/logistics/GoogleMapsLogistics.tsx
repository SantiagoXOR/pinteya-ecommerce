// =====================================================
// COMPONENTE: GOOGLE MAPS LOGISTICS ENTERPRISE
// Descripción: Integración completa de Google Maps para logística
// Basado en: @vis.gl/react-google-maps + Real-time tracking
// =====================================================

'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
  useMap,
  Marker,
} from '@vis.gl/react-google-maps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MapPin,
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Navigation,
  Zap,
  Settings,
} from 'lucide-react'
import { RouteOptimizationPanel } from './RouteOptimizationPanel'
import { RouteVisualization } from './RouteVisualization'
import { useRouteOptimization } from '@/hooks/admin/useRouteOptimization'

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

interface RouteOptimization {
  id: string
  name: string
  shipments: ShipmentLocation[]
  total_distance: number
  estimated_time: number
  driver?: string
  vehicle?: string
  status: 'planned' | 'active' | 'completed'
}

interface GoogleMapsLogisticsProps {
  shipments: ShipmentLocation[]
  onShipmentSelect?: (shipment: ShipmentLocation) => void
  enableRouteOptimization?: boolean
  enableRealTimeTracking?: boolean
  height?: string
}

// =====================================================
// CONFIGURACIÓN Y CONSTANTES
// =====================================================

const DEFAULT_CENTER: Coordinates = { lat: -34.6037, lng: -58.3816 } // Buenos Aires
const DEFAULT_ZOOM = 11

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

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', label: 'Pendiente', icon: Clock },
  confirmed: { color: '#3b82f6', label: 'Confirmado', icon: Package },
  in_transit: { color: '#8b5cf6', label: 'En Tránsito', icon: Truck },
  delivered: { color: '#10b981', label: 'Entregado', icon: CheckCircle },
  exception: { color: '#ef4444', label: 'Excepción', icon: AlertTriangle },
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function GoogleMapsLogistics({
  shipments,
  onShipmentSelect,
  enableRouteOptimization = true,
  enableRealTimeTracking = true,
  height = '600px',
}: GoogleMapsLogisticsProps) {
  // Hook de optimización de rutas
  const { routes } = useRouteOptimization()

  // Estados
  const [selectedShipment, setSelectedShipment] = useState<ShipmentLocation | null>(null)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('map')
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>()
  const [showAllRoutes, setShowAllRoutes] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)

  // Referencias
  const mapRef = useRef<google.maps.Map | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      setSelectedShipment(null)
    }
  }, [])

  // Procesar envíos con coordenadas
  const shipmentsWithCoordinates = useMemo(() => {
    if (!shipments || !Array.isArray(shipments)) {
      return []
    }

    return shipments.map((shipment, index) => {
      if (!shipment.destination || !shipment.destination.coordinates) {
        const destination = shipment.destination || {}
        const city = destination.city || 'Buenos Aires'
        const baseCoords = CITY_COORDINATES[city as keyof typeof CITY_COORDINATES] || DEFAULT_CENTER

        // Agregar variación aleatoria para evitar superposición
        const lat = baseCoords.lat + (Math.random() - 0.5) * 0.02
        const lng = baseCoords.lng + (Math.random() - 0.5) * 0.02

        return {
          ...shipment,
          destination: {
            ...destination,
            city,
            address: destination.address || 'Dirección no especificada',
            coordinates: { lat, lng },
          },
        }
      }
      return shipment
    })
  }, [shipments])

  // Filtrar envíos
  const filteredShipments = useMemo(() => {
    return shipmentsWithCoordinates.filter(shipment => {
      const matchesSearch =
        searchTerm === '' ||
        shipment.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.destination.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.destination.city.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [shipmentsWithCoordinates, searchTerm, statusFilter])

  // Calcular centro del mapa
  useEffect(() => {
    if (!isMountedRef.current) return

    if (filteredShipments.length > 0) {
      const validShipments = filteredShipments.filter(s => s.destination.coordinates)
      if (validShipments.length > 0) {
        const avgLat =
          validShipments.reduce((sum, s) => sum + (s.destination.coordinates?.lat || 0), 0) /
          validShipments.length
        const avgLng =
          validShipments.reduce((sum, s) => sum + (s.destination.coordinates?.lng || 0), 0) /
          validShipments.length

        if (isMountedRef.current && !isNaN(avgLat) && !isNaN(avgLng)) {
          setMapCenter({ lat: avgLat, lng: avgLng })
        }
      }
    }
  }, [filteredShipments])

  // Callbacks seguros
  const handleMarkerClick = useCallback(
    (shipment: ShipmentLocation) => {
      if (isMountedRef.current) {
        setSelectedShipment(shipment)
        onShipmentSelect?.(shipment)
      }
    },
    [onShipmentSelect]
  )

  const handleInfoWindowClose = useCallback(() => {
    if (isMountedRef.current) {
      setSelectedShipment(null)
    }
  }, [])

  // Optimización de rutas
  const optimizeRoutes = useCallback(async () => {
    if (!enableRouteOptimization || filteredShipments.length === 0) return

    try {
      // Agrupar envíos por zona geográfica
      const zones = new Map<string, ShipmentLocation[]>()

      filteredShipments.forEach(shipment => {
        const zone = shipment.destination.city
        if (!zones.has(zone)) {
          zones.set(zone, [])
        }
        zones.get(zone)!.push(shipment)
      })

      const routes: RouteOptimization[] = []
      let routeId = 1

      zones.forEach((shipments, city) => {
        if (shipments.length > 0) {
          // Calcular distancia estimada (simplificado)
          const totalDistance = shipments.length * 5 // 5km promedio por envío
          const estimatedTime = shipments.length * 15 // 15 min promedio por envío

          routes.push({
            id: `route-${routeId++}`,
            name: `Ruta ${city}`,
            shipments,
            total_distance: totalDistance,
            estimated_time: estimatedTime,
            status: 'planned',
          })
        }
      })

      setOptimizedRoutes(routes)
    } catch (error) {
      console.error('Error optimizando rutas:', error)
    }
  }, [filteredShipments, enableRouteOptimization])

  // Obtener configuración de estado
  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  }

  // Verificar si Google Maps está disponible
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <Card className='w-full' style={{ height }}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='w-5 h-5' />
            Mapa de Logística
          </CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-96'>
          <div className='text-center space-y-4'>
            <AlertTriangle className='w-12 h-12 text-yellow-500 mx-auto' />
            <div>
              <h3 className='text-lg font-semibold'>Google Maps API no configurada</h3>
              <p className='text-gray-600 mt-2'>
                Para habilitar el mapa, configura tu API key de Google Maps en las variables de
                entorno.
              </p>
              <p className='text-sm text-gray-500 mt-1'>
                Variable requerida: <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='w-full space-y-4'>
      {/* Controles superiores */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div className='flex flex-col sm:flex-row gap-2 flex-1'>
          <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              placeholder='Buscar por tracking, dirección o ciudad...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Filtrar por estado' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos los estados</SelectItem>
              <SelectItem value='pending'>Pendientes</SelectItem>
              <SelectItem value='confirmed'>Confirmados</SelectItem>
              <SelectItem value='in_transit'>En Tránsito</SelectItem>
              <SelectItem value='delivered'>Entregados</SelectItem>
              <SelectItem value='exception'>Excepciones</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {enableRouteOptimization && (
          <div className='flex gap-2'>
            <Button variant='outline' onClick={optimizeRoutes} className='flex items-center gap-2'>
              <Navigation className='w-4 h-4' />
              Optimizar Rutas
            </Button>
            <Button
              variant={showRoutes ? 'default' : 'outline'}
              onClick={() => setShowRoutes(!showRoutes)}
              className='flex items-center gap-2'
            >
              <Navigation className='w-4 h-4' />
              {showRoutes ? 'Ocultar' : 'Mostrar'} Rutas
            </Button>
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='bg-blue-50 p-3 rounded-lg'>
          <div className='flex items-center gap-2'>
            <Package className='w-4 h-4 text-blue-600' />
            <span className='text-sm font-medium text-blue-900'>Total Envíos</span>
          </div>
          <p className='text-2xl font-bold text-blue-600'>{filteredShipments.length}</p>
        </div>
        <div className='bg-green-50 p-3 rounded-lg'>
          <div className='flex items-center gap-2'>
            <CheckCircle className='w-4 h-4 text-green-600' />
            <span className='text-sm font-medium text-green-900'>Entregados</span>
          </div>
          <p className='text-2xl font-bold text-green-600'>
            {filteredShipments.filter(s => s.status === 'delivered').length}
          </p>
        </div>
        <div className='bg-purple-50 p-3 rounded-lg'>
          <div className='flex items-center gap-2'>
            <Truck className='w-4 h-4 text-purple-600' />
            <span className='text-sm font-medium text-purple-900'>En Tránsito</span>
          </div>
          <p className='text-2xl font-bold text-purple-600'>
            {filteredShipments.filter(s => s.status === 'in_transit').length}
          </p>
        </div>
        <div className='bg-yellow-50 p-3 rounded-lg'>
          <div className='flex items-center gap-2'>
            <Clock className='w-4 h-4 text-yellow-600' />
            <span className='text-sm font-medium text-yellow-900'>Pendientes</span>
          </div>
          <p className='text-2xl font-bold text-yellow-600'>
            {filteredShipments.filter(s => s.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='map'>Mapa Interactivo</TabsTrigger>
          <TabsTrigger value='routes'>Rutas Optimizadas</TabsTrigger>
          <TabsTrigger value='tracking'>Tracking en Vivo</TabsTrigger>
        </TabsList>

        {/* Mapa principal */}
        <TabsContent value='map'>
          <Card style={{ height }}>
            <CardContent className='p-0'>
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={mapCenter}
                  defaultZoom={mapZoom}
                  gestureHandling='greedy'
                  disableDefaultUI={false}
                  style={{ width: '100%', height }}
                >
                  {/* Marcadores de envíos */}
                  {filteredShipments.map(shipment => {
                    if (!shipment.destination.coordinates) return null

                    const statusConfig = getStatusConfig(shipment.status)

                    // Usar Marker normal como fallback si no hay mapId válido
                    return (
                      <Marker
                        key={shipment.id}
                        position={shipment.destination.coordinates}
                        onClick={() => handleMarkerClick(shipment)}
                        title={`Envío ${shipment.id} - ${shipment.status}`}
                      />
                    )
                  })}

                  {/* InfoWindow para envío seleccionado */}
                  {selectedShipment &&
                    selectedShipment.destination.coordinates &&
                    isMountedRef.current && (
                      <InfoWindow
                        position={selectedShipment.destination.coordinates}
                        onClose={handleInfoWindowClose}
                      >
                        <div className='p-2 max-w-sm'>
                          <div className='flex items-center gap-2 mb-2'>
                            <Package className='w-4 h-4' />
                            <span className='font-semibold'>
                              {selectedShipment.tracking_number}
                            </span>
                            <Badge variant='secondary'>
                              {getStatusConfig(selectedShipment.status).label}
                            </Badge>
                          </div>
                          <div className='space-y-1 text-sm'>
                            <p>
                              <strong>Destino:</strong> {selectedShipment.destination.address}
                            </p>
                            <p>
                              <strong>Ciudad:</strong> {selectedShipment.destination.city}
                            </p>
                            <p>
                              <strong>Courier:</strong> {selectedShipment.courier}
                            </p>
                            <p>
                              <strong>Costo:</strong> ${selectedShipment.cost}
                            </p>
                            {selectedShipment.estimated_delivery && (
                              <p>
                                <strong>Entrega estimada:</strong>{' '}
                                {new Date(selectedShipment.estimated_delivery).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                </Map>
              </APIProvider>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rutas optimizadas */}
        <TabsContent value='routes'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Panel de optimización */}
            <div className='space-y-4'>
              <RouteOptimizationPanel
                shipments={filteredShipments}
                onRouteSelect={route => {
                  // Centrar mapa en la ruta seleccionada
                  if (route.start_location) {
                    setMapCenter(route.start_location)
                    setMapZoom(12)
                  }
                  setSelectedRouteId(route.id)
                }}
              />
            </div>

            {/* Mapa con visualización de rutas */}
            <div className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Navigation className='w-5 h-5' />
                    Visualización de Rutas
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-0'>
                  <APIProvider apiKey={apiKey}>
                    <Map
                      defaultCenter={mapCenter}
                      defaultZoom={mapZoom}
                      gestureHandling='greedy'
                      disableDefaultUI={false}
                      style={{ width: '100%', height: '500px' }}
                    >
                      {/* Marcadores de envíos */}
                      {filteredShipments.map(shipment => {
                        if (!shipment.destination.coordinates) return null

                        const statusConfig = getStatusConfig(shipment.status)

                        return (
                          <Marker
                            key={shipment.id}
                            position={shipment.destination.coordinates}
                            onClick={() => handleMarkerClick(shipment)}
                            title={`Envío ${shipment.id} - ${shipment.status}`}
                          />
                        )
                      })}

                      {/* InfoWindow para envío seleccionado */}
                      {selectedShipment &&
                        selectedShipment.destination.coordinates &&
                        isMountedRef.current && (
                          <InfoWindow
                            position={selectedShipment.destination.coordinates}
                            onClose={handleInfoWindowClose}
                          >
                            <div className='p-2 max-w-sm'>
                              <div className='flex items-center gap-2 mb-2'>
                                <Package className='w-4 h-4' />
                                <h3 className='font-semibold'>Envío #{selectedShipment.id}</h3>
                              </div>
                              <div className='space-y-1 text-sm'>
                                <p>
                                  <strong>Tracking:</strong> {selectedShipment.tracking_number}
                                </p>
                                <p>
                                  <strong>Estado:</strong>{' '}
                                  {getStatusConfig(selectedShipment.status).label}
                                </p>
                                <p>
                                  <strong>Destino:</strong> {selectedShipment.destination.address}
                                </p>
                                <p>
                                  <strong>Ciudad:</strong> {selectedShipment.destination.city}
                                </p>
                                <p>
                                  <strong>Courier:</strong> {selectedShipment.courier}
                                </p>
                                {selectedShipment.estimated_delivery && (
                                  <p>
                                    <strong>Entrega estimada:</strong>{' '}
                                    {new Date(
                                      selectedShipment.estimated_delivery
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </InfoWindow>
                        )}
                    </Map>
                  </APIProvider>
                </CardContent>
              </Card>

              {/* Componente de visualización de rutas */}
              <RouteVisualization
                routes={routes}
                selectedRouteId={selectedRouteId}
                onRouteSelect={setSelectedRouteId}
                showAllRoutes={showAllRoutes}
              />
            </div>
          </div>
        </TabsContent>

        {/* Tracking en vivo */}
        <TabsContent value='tracking'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Zap className='w-5 h-5' />
                Tracking en Tiempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8'>
                <Zap className='w-12 h-12 text-blue-500 mx-auto mb-4' />
                <h3 className='text-lg font-semibold mb-2'>Tracking en Tiempo Real</h3>
                <p className='text-gray-600'>
                  Funcionalidad de tracking en vivo en desarrollo. Se integrará con WebSockets para
                  actualizaciones en tiempo real.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GoogleMapsLogistics
