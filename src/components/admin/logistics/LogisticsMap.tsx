// =====================================================
// COMPONENTE: LOGISTICS MAP ENTERPRISE
// Descripción: Mapa interactivo con tracking tiempo real usando MapLibre GL JS
// Basado en: MapLibre GL JS + React + WebSockets
// =====================================================

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Map as MapIcon,
  Navigation,
  Layers,
  Zap,
  MapPin,
  Truck,
  Package,
  Settings,
  Maximize2,
  RefreshCw,
  Filter,
} from '@/lib/optimized-imports'
import { Shipment, TrackingEvent } from '@/types/logistics'
import { cn } from '@/lib/core/utils'

// =====================================================
// INTERFACES
// =====================================================

interface LogisticsMapProps {
  shipments?: Shipment[]
  selectedShipment?: Shipment | null
  onShipmentSelect?: (shipment: Shipment) => void
  realTimeEnabled?: boolean
  className?: string
}

interface MapMarker {
  id: string
  type: 'shipment' | 'warehouse' | 'delivery' | 'courier'
  coordinates: [number, number]
  data: any
  status?: string
}

interface GeofenceZone {
  id: string
  name: string
  coordinates: [number, number][]
  type: 'delivery_zone' | 'restricted' | 'priority'
  active: boolean
}

// =====================================================
// CONFIGURACIÓN DEL MAPA
// =====================================================

const MAP_CONFIG = {
  style: 'https://api.maptiler.com/maps/streets/style.json?key=demo', // Demo key - reemplazar en producción
  center: [-58.3816, -34.6037] as [number, number], // Buenos Aires
  zoom: 10,
  pitch: 45,
  bearing: 0,
}

const MARKER_COLORS = {
  pending: '#6b7280',
  confirmed: '#3b82f6',
  picked_up: '#f59e0b',
  in_transit: '#f97316',
  out_for_delivery: '#8b5cf6',
  delivered: '#10b981',
  exception: '#ef4444',
  cancelled: '#6b7280',
  returned: '#ef4444',
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function LogisticsMap({
  shipments = [],
  selectedShipment,
  onShipmentSelect,
  realTimeEnabled = false,
  className,
}: LogisticsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain'>('streets')
  const [showGeofences, setShowGeofences] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Estados del mapa
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [geofences, setGeofences] = useState<GeofenceZone[]>([])
  const [activeRoutes, setActiveRoutes] = useState<any[]>([])

  // =====================================================
  // INICIALIZACIÓN DEL MAPA
  // =====================================================

  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return
    }

    // Importar MapLibre GL JS dinámicamente
    import('maplibre-gl').then(maplibregl => {
      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: MAP_CONFIG.style,
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,
        pitch: MAP_CONFIG.pitch,
        bearing: MAP_CONFIG.bearing,
      })

      map.current.on('load', () => {
        setMapLoaded(true)
        initializeMapLayers()
        loadInitialData()
      })

      // Eventos del mapa
      map.current.on('click', 'shipments-layer', (e: any) => {
        const shipmentId = e.features[0].properties.shipmentId
        const shipment = shipments.find(s => s.id.toString() === shipmentId)
        if (shipment && onShipmentSelect) {
          onShipmentSelect(shipment)
        }
      })

      // Cursor pointer en markers
      map.current.on('mouseenter', 'shipments-layer', () => {
        map.current.getCanvas().style.cursor = 'pointer'
      })

      map.current.on('mouseleave', 'shipments-layer', () => {
        map.current.getCanvas().style.cursor = ''
      })
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // =====================================================
  // INICIALIZAR CAPAS DEL MAPA
  // =====================================================

  const initializeMapLayers = useCallback(() => {
    if (!map.current || !mapLoaded) {
      return
    }

    // Capa de geofences
    map.current.addSource('geofences', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })

    map.current.addLayer({
      id: 'geofences-fill',
      type: 'fill',
      source: 'geofences',
      paint: {
        'fill-color': [
          'match',
          ['get', 'type'],
          'delivery_zone',
          '#10b981',
          'restricted',
          '#ef4444',
          'priority',
          '#f59e0b',
          '#6b7280',
        ],
        'fill-opacity': 0.2,
      },
    })

    map.current.addLayer({
      id: 'geofences-border',
      type: 'line',
      source: 'geofences',
      paint: {
        'line-color': [
          'match',
          ['get', 'type'],
          'delivery_zone',
          '#10b981',
          'restricted',
          '#ef4444',
          'priority',
          '#f59e0b',
          '#6b7280',
        ],
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    })

    // Capa de envíos
    map.current.addSource('shipments', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })

    map.current.addLayer({
      id: 'shipments-layer',
      type: 'circle',
      source: 'shipments',
      paint: {
        'circle-radius': ['case', ['==', ['get', 'selected'], true], 12, 8],
        'circle-color': [
          'match',
          ['get', 'status'],
          'pending',
          MARKER_COLORS.pending,
          'confirmed',
          MARKER_COLORS.confirmed,
          'picked_up',
          MARKER_COLORS.picked_up,
          'in_transit',
          MARKER_COLORS.in_transit,
          'out_for_delivery',
          MARKER_COLORS.out_for_delivery,
          'delivered',
          MARKER_COLORS.delivered,
          'exception',
          MARKER_COLORS.exception,
          'cancelled',
          MARKER_COLORS.cancelled,
          'returned',
          MARKER_COLORS.returned,
          MARKER_COLORS.pending,
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    })

    // Capa de rutas
    map.current.addSource('routes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })

    map.current.addLayer({
      id: 'routes-layer',
      type: 'line',
      source: 'routes',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 3,
        'line-opacity': 0.7,
      },
    })
  }, [mapLoaded])

  // =====================================================
  // CARGAR DATOS INICIALES
  // =====================================================

  const loadInitialData = useCallback(() => {
    // Cargar geofences de ejemplo
    const sampleGeofences: GeofenceZone[] = [
      {
        id: 'caba',
        name: 'CABA - Zona Prioritaria',
        coordinates: [
          [-58.5315, -34.5264],
          [-58.3354, -34.5264],
          [-58.3354, -34.7051],
          [-58.5315, -34.7051],
          [-58.5315, -34.5264],
        ],
        type: 'priority',
        active: true,
      },
      {
        id: 'gba_norte',
        name: 'GBA Norte - Zona de Entrega',
        coordinates: [
          [-58.6, -34.4],
          [-58.4, -34.4],
          [-58.4, -34.55],
          [-58.6, -34.55],
          [-58.6, -34.4],
        ],
        type: 'delivery_zone',
        active: true,
      },
    ]

    setGeofences(sampleGeofences)
    updateGeofencesLayer(sampleGeofences)
  }, [])

  // =====================================================
  // ACTUALIZAR CAPAS DEL MAPA
  // =====================================================

  const updateShipmentsLayer = useCallback(
    (shipmentsData: Shipment[]) => {
      if (!map.current || !mapLoaded) {
        return
      }

      const filteredShipments =
        filterStatus === 'all'
          ? shipmentsData
          : shipmentsData.filter(s => s.status === filterStatus)

      const features = filteredShipments.map(shipment => {
        // Generar coordenadas aleatorias en Buenos Aires para demo
        const lat = -34.6037 + (Math.random() - 0.5) * 0.2
        const lng = -58.3816 + (Math.random() - 0.5) * 0.2

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          properties: {
            shipmentId: shipment.id.toString(),
            status: shipment.status,
            shipmentNumber: shipment.shipment_number,
            selected: selectedShipment?.id === shipment.id,
          },
        }
      })

      map.current.getSource('shipments').setData({
        type: 'FeatureCollection',
        features,
      })
    },
    [mapLoaded, filterStatus, selectedShipment]
  )

  const updateGeofencesLayer = useCallback(
    (geofencesData: GeofenceZone[]) => {
      if (!map.current || !mapLoaded) {
        return
      }

      const features = geofencesData
        .filter(zone => zone.active && showGeofences)
        .map(zone => ({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [zone.coordinates],
          },
          properties: {
            id: zone.id,
            name: zone.name,
            type: zone.type,
          },
        }))

      map.current.getSource('geofences').setData({
        type: 'FeatureCollection',
        features,
      })
    },
    [mapLoaded, showGeofences]
  )

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    if (mapLoaded && shipments.length > 0) {
      updateShipmentsLayer(shipments)
    }
  }, [shipments, mapLoaded, updateShipmentsLayer])

  useEffect(() => {
    if (mapLoaded) {
      updateGeofencesLayer(geofences)
    }
  }, [geofences, mapLoaded, updateGeofencesLayer])

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleStyleChange = (style: string) => {
    setMapStyle(style as any)
    if (map.current) {
      const styleUrls = {
        streets: 'https://api.maptiler.com/maps/streets/style.json?key=demo',
        satellite: 'https://api.maptiler.com/maps/satellite/style.json?key=demo',
        terrain: 'https://api.maptiler.com/maps/terrain/style.json?key=demo',
      }
      map.current.setStyle(styleUrls[style as keyof typeof styleUrls])
    }
  }

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    // TODO: Implementar fullscreen real
  }

  const handleFitBounds = () => {
    if (map.current && shipments.length > 0) {
      // Calcular bounds basado en los shipments
      const bounds = new (window as any).maplibregl.LngLatBounds()
      shipments.forEach(() => {
        // Coordenadas de ejemplo - en producción usar coordenadas reales
        const lat = -34.6037 + (Math.random() - 0.5) * 0.2
        const lng = -58.3816 + (Math.random() - 0.5) * 0.2
        bounds.extend([lng, lat])
      })
      map.current.fitBounds(bounds, { padding: 50 })
    }
  }

  const handleRefresh = () => {
    if (mapLoaded) {
      updateShipmentsLayer(shipments)
      updateGeofencesLayer(geofences)
    }
  }

  return (
    <Card className={cn('relative', className, isFullscreen && 'fixed inset-0 z-50')}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <MapIcon className='w-5 h-5' />
              Mapa de Logística
            </CardTitle>
            <CardDescription>Tracking en tiempo real de {shipments.length} envíos</CardDescription>
          </div>

          <div className='flex items-center gap-2'>
            {/* Filtro de estado */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos</SelectItem>
                <SelectItem value='in_transit'>En Tránsito</SelectItem>
                <SelectItem value='out_for_delivery'>En Reparto</SelectItem>
                <SelectItem value='delivered'>Entregados</SelectItem>
              </SelectContent>
            </Select>

            {/* Controles de capas */}
            <div className='flex items-center gap-2'>
              <Switch checked={showGeofences} onCheckedChange={setShowGeofences} size='sm' />
              <span className='text-sm'>Zonas</span>
            </div>

            <div className='flex items-center gap-2'>
              <Switch checked={showRoutes} onCheckedChange={setShowRoutes} size='sm' />
              <span className='text-sm'>Rutas</span>
            </div>

            {/* Botones de acción */}
            <Button variant='outline' size='sm' onClick={handleRefresh}>
              <RefreshCw className='w-4 h-4' />
            </Button>

            <Button variant='outline' size='sm' onClick={handleFitBounds}>
              <Navigation className='w-4 h-4' />
            </Button>

            <Button variant='outline' size='sm' onClick={handleFullscreen}>
              <Maximize2 className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Controles de estilo */}
        <div className='flex items-center gap-4'>
          <Select value={mapStyle} onValueChange={handleStyleChange}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='streets'>Calles</SelectItem>
              <SelectItem value='satellite'>Satélite</SelectItem>
              <SelectItem value='terrain'>Terreno</SelectItem>
            </SelectContent>
          </Select>

          {realTimeEnabled && (
            <Badge variant='secondary' className='flex items-center gap-1'>
              <Zap className='w-3 h-3' />
              Tiempo Real
            </Badge>
          )}

          <div className='flex items-center gap-4 text-sm'>
            <div className='flex items-center gap-1'>
              <div className='w-3 h-3 rounded-full bg-blue-500'></div>
              <span>En Tránsito</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='w-3 h-3 rounded-full bg-purple-500'></div>
              <span>En Reparto</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='w-3 h-3 rounded-full bg-green-500'></div>
              <span>Entregado</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        <div
          ref={mapContainer}
          className={cn('w-full bg-gray-100 rounded-b-lg', isFullscreen ? 'h-screen' : 'h-96')}
          style={{ minHeight: isFullscreen ? '100vh' : '400px' }}
        />

        {!mapLoaded && (
          <div className='absolute inset-0 flex items-center justify-center bg-gray-100 rounded-b-lg'>
            <div className='text-center'>
              <MapIcon className='w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse' />
              <p className='text-gray-500'>Cargando mapa...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
