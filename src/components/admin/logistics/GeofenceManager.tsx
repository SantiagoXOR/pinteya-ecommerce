// =====================================================
// COMPONENTE: GEOFENCE MANAGER ENTERPRISE
// Descripción: Gestión de zonas geográficas con alertas automáticas
// Basado en: MapLibre GL JS + React + Geospatial APIs
// =====================================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Zap,
} from 'lucide-react'
import { useLogisticsWebSocket } from '@/hooks/admin/useLogisticsWebSocket'
import { cn } from '@/lib/core/utils'
import { formatDate } from '@/lib/utils/consolidated-utils'

// =====================================================
// INTERFACES
// =====================================================

interface GeofenceZone {
  id: string
  name: string
  type: 'delivery_zone' | 'restricted' | 'priority' | 'warehouse'
  coordinates: [number, number][]
  center: [number, number]
  radius?: number
  active: boolean
  created_at: string
  updated_at: string
  rules: GeofenceRule[]
  stats?: GeofenceStats
}

interface GeofenceRule {
  id: string
  event_type: 'enter' | 'exit' | 'dwell'
  action: 'alert' | 'notification' | 'status_change' | 'route_optimization'
  conditions: {
    min_dwell_time?: number
    shipment_status?: string[]
    courier_ids?: number[]
    time_windows?: { start: string; end: string }[]
  }
  active: boolean
}

interface GeofenceStats {
  total_events: number
  enter_events: number
  exit_events: number
  unique_shipments: number
  avg_dwell_time: number
  last_event: string
}

interface GeofenceManagerProps {
  className?: string
}

// =====================================================
// DATOS DE EJEMPLO
// =====================================================

const SAMPLE_GEOFENCES: GeofenceZone[] = [
  {
    id: 'caba_priority',
    name: 'CABA - Zona Prioritaria',
    type: 'priority',
    coordinates: [
      [-58.5315, -34.5264],
      [-58.3354, -34.5264],
      [-58.3354, -34.7051],
      [-58.5315, -34.7051],
      [-58.5315, -34.5264],
    ],
    center: [-58.4335, -34.6158],
    active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
    rules: [
      {
        id: 'rule_1',
        event_type: 'enter',
        action: 'notification',
        conditions: {
          shipment_status: ['in_transit', 'out_for_delivery'],
        },
        active: true,
      },
    ],
    stats: {
      total_events: 245,
      enter_events: 123,
      exit_events: 122,
      unique_shipments: 89,
      avg_dwell_time: 45,
      last_event: '2024-01-20T14:30:00Z',
    },
  },
  {
    id: 'gba_norte',
    name: 'GBA Norte - Zona de Entrega',
    type: 'delivery_zone',
    coordinates: [
      [-58.6, -34.4],
      [-58.4, -34.4],
      [-58.4, -34.55],
      [-58.6, -34.55],
      [-58.6, -34.4],
    ],
    center: [-58.5, -34.475],
    active: true,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-18T11:15:00Z',
    rules: [
      {
        id: 'rule_2',
        event_type: 'dwell',
        action: 'alert',
        conditions: {
          min_dwell_time: 30,
          shipment_status: ['out_for_delivery'],
        },
        active: true,
      },
    ],
    stats: {
      total_events: 156,
      enter_events: 78,
      exit_events: 78,
      unique_shipments: 67,
      avg_dwell_time: 28,
      last_event: '2024-01-19T16:45:00Z',
    },
  },
  {
    id: 'warehouse_central',
    name: 'Depósito Central',
    type: 'warehouse',
    coordinates: [
      [-58.42, -34.61],
      [-58.415, -34.61],
      [-58.415, -34.615],
      [-58.42, -34.615],
      [-58.42, -34.61],
    ],
    center: [-58.4175, -34.6125],
    radius: 500,
    active: true,
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
    rules: [
      {
        id: 'rule_3',
        event_type: 'exit',
        action: 'status_change',
        conditions: {
          shipment_status: ['confirmed'],
        },
        active: true,
      },
    ],
    stats: {
      total_events: 89,
      enter_events: 45,
      exit_events: 44,
      unique_shipments: 89,
      avg_dwell_time: 120,
      last_event: '2024-01-20T10:15:00Z',
    },
  },
]

// =====================================================
// CONFIGURACIÓN DE TIPOS
// =====================================================

const GEOFENCE_TYPES = {
  delivery_zone: {
    label: 'Zona de Entrega',
    color: 'bg-blue-100 text-blue-800',
    icon: MapPin,
  },
  restricted: {
    label: 'Zona Restringida',
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
  },
  priority: {
    label: 'Zona Prioritaria',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Zap,
  },
  warehouse: {
    label: 'Depósito',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function GeofenceManager({ className }: GeofenceManagerProps) {
  const [geofences, setGeofences] = useState<GeofenceZone[]>(SAMPLE_GEOFENCES)
  const [selectedGeofence, setSelectedGeofence] = useState<GeofenceZone | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // WebSocket para eventos en tiempo real
  const { isConnected, subscribeToGeofence, lastGeofenceEvent, alerts } = useLogisticsWebSocket({
    simulateInDevelopment: false, // Deshabilitado para evitar notificaciones persistentes
  })

  // Filtrar geofences
  const filteredGeofences = geofences.filter(zone => {
    const matchesType = filterType === 'all' || zone.type === filterType
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  // Estadísticas generales
  const totalZones = geofences.length
  const activeZones = geofences.filter(z => z.active).length
  const totalEvents = geofences.reduce((acc, z) => acc + (z.stats?.total_events || 0), 0)
  const recentEvents = alerts.filter(
    alert =>
      alert.type === 'geofence_event' &&
      new Date(alert.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    // Suscribirse a eventos de todas las zonas activas
    if (isConnected) {
      geofences
        .filter(z => z.active)
        .forEach(zone => {
          subscribeToGeofence(zone.id)
        })
    }
  }, [isConnected, geofences, subscribeToGeofence])

  useEffect(() => {
    // Procesar eventos de geofence en tiempo real
    if (lastGeofenceEvent) {
      console.log('Nuevo evento de geofence:', lastGeofenceEvent)
      // Aquí se podría actualizar las estadísticas en tiempo real
    }
  }, [lastGeofenceEvent])

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleToggleZone = useCallback((zoneId: string) => {
    setGeofences(prev =>
      prev.map(zone =>
        zone.id === zoneId
          ? { ...zone, active: !zone.active, updated_at: new Date().toISOString() }
          : zone
      )
    )
  }, [])

  const handleDeleteZone = useCallback((zoneId: string) => {
    setGeofences(prev => prev.filter(zone => zone.id !== zoneId))
  }, [])

  const handleEditZone = useCallback((zone: GeofenceZone) => {
    setSelectedGeofence(zone)
  }, [])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Gestión de Geofences</h2>
          <p className='text-muted-foreground'>
            Administra zonas geográficas y reglas de automatización
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className='flex items-center gap-1'
          >
            {isConnected ? <CheckCircle className='w-3 h-3' /> : <Clock className='w-3 h-3' />}
            {isConnected ? 'Tiempo Real' : 'Desconectado'}
          </Badge>

          <Dialog>
            <DialogTrigger asChild>
              <Button className='flex items-center gap-2'>
                <Plus className='w-4 h-4' />
                Nueva Zona
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Crear Nueva Zona Geográfica</DialogTitle>
                <DialogDescription>
                  Define una nueva zona con reglas de automatización
                </DialogDescription>
              </DialogHeader>
              <div className='p-4 text-center text-muted-foreground'>
                Formulario de geofence en desarrollo
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Métricas resumen */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Total Zonas</p>
                <p className='text-2xl font-bold'>{totalZones}</p>
              </div>
              <MapPin className='w-8 h-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Zonas Activas</p>
                <p className='text-2xl font-bold'>{activeZones}</p>
              </div>
              <CheckCircle className='w-8 h-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Eventos Totales</p>
                <p className='text-2xl font-bold'>{totalEvents}</p>
              </div>
              <BarChart3 className='w-8 h-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Eventos Hoy</p>
                <p className='text-2xl font-bold'>{recentEvents}</p>
              </div>
              <Zap className='w-8 h-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex-1'>
          <Input
            placeholder='Buscar zonas...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='Filtrar por tipo' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos los tipos</SelectItem>
            <SelectItem value='delivery_zone'>Zona de Entrega</SelectItem>
            <SelectItem value='restricted'>Zona Restringida</SelectItem>
            <SelectItem value='priority'>Zona Prioritaria</SelectItem>
            <SelectItem value='warehouse'>Depósito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contenido principal */}
      <Tabs defaultValue='list' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='list'>Lista de Zonas</TabsTrigger>
          <TabsTrigger value='map'>Vista de Mapa</TabsTrigger>
          <TabsTrigger value='events'>Eventos Recientes</TabsTrigger>
        </TabsList>

        {/* Tab: Lista */}
        <TabsContent value='list'>
          <Card>
            <CardHeader>
              <CardTitle>Zonas Geográficas</CardTitle>
              <CardDescription>Gestiona zonas y sus reglas de automatización</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zona</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Eventos</TableHead>
                      <TableHead>Última Actividad</TableHead>
                      <TableHead>Reglas</TableHead>
                      <TableHead className='w-12'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGeofences.map(zone => (
                      <GeofenceRow
                        key={zone.id}
                        zone={zone}
                        onToggle={handleToggleZone}
                        onEdit={handleEditZone}
                        onDelete={handleDeleteZone}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Mapa */}
        <TabsContent value='map'>
          <Card>
            <CardHeader>
              <CardTitle>Vista de Mapa</CardTitle>
              <CardDescription>Visualización geográfica de las zonas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-96 bg-gray-100 rounded-lg flex items-center justify-center'>
                <div className='text-center'>
                  <MapPin className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-gray-500'>Mapa de geofences en desarrollo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Eventos */}
        <TabsContent value='events'>
          <Card>
            <CardHeader>
              <CardTitle>Eventos Recientes</CardTitle>
              <CardDescription>Actividad en tiempo real de las zonas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {alerts.slice(0, 10).map((alert, index) => (
                  <div key={index} className='flex items-center gap-3 p-3 border rounded-lg'>
                    <div className='w-2 h-2 rounded-full bg-blue-500'></div>
                    <div className='flex-1'>
                      <div className='font-medium'>{alert.message}</div>
                      <div className='text-sm text-muted-foreground'>
                        {formatDate(alert.timestamp)}
                      </div>
                    </div>
                    <Badge variant='outline'>{alert.type}</Badge>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className='text-center py-8'>
                    <Clock className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                    <p className='text-gray-500'>No hay eventos recientes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// =====================================================
// COMPONENTE GEOFENCE ROW
// =====================================================

interface GeofenceRowProps {
  zone: GeofenceZone
  onToggle: (zoneId: string) => void
  onEdit: (zone: GeofenceZone) => void
  onDelete: (zoneId: string) => void
}

function GeofenceRow({ zone, onToggle, onEdit, onDelete }: GeofenceRowProps) {
  const typeConfig = GEOFENCE_TYPES[zone.type]
  const Icon = typeConfig.icon

  return (
    <TableRow>
      <TableCell>
        <div className='flex items-center gap-2'>
          <Icon className='w-4 h-4 text-muted-foreground' />
          <div>
            <div className='font-medium'>{zone.name}</div>
            <div className='text-sm text-muted-foreground'>
              {zone.center[1].toFixed(4)}, {zone.center[0].toFixed(4)}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge variant='outline' className={typeConfig.color}>
          {typeConfig.label}
        </Badge>
      </TableCell>

      <TableCell>
        <div className='flex items-center gap-2'>
          <Switch checked={zone.active} onCheckedChange={() => onToggle(zone.id)} size='sm' />
          <span className='text-sm'>{zone.active ? 'Activa' : 'Inactiva'}</span>
        </div>
      </TableCell>

      <TableCell>
        <div className='text-sm'>
          <div className='font-medium'>{zone.stats?.total_events || 0}</div>
          <div className='text-muted-foreground'>
            {zone.stats?.unique_shipments || 0} envíos únicos
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className='text-sm'>
          {zone.stats?.last_event ? formatDate(zone.stats.last_event) : 'Sin actividad'}
        </div>
      </TableCell>

      <TableCell>
        <div className='flex items-center gap-1'>
          <Badge variant='secondary' className='text-xs'>
            {zone.rules.filter(r => r.active).length} activas
          </Badge>
          <Badge variant='outline' className='text-xs'>
            {zone.rules.length} total
          </Badge>
        </div>
      </TableCell>

      <TableCell>
        <div className='flex items-center gap-1'>
          <Button variant='ghost' size='sm' onClick={() => onEdit(zone)}>
            <Edit className='w-4 h-4' />
          </Button>

          <Button
            variant='ghost'
            size='sm'
            onClick={() => onDelete(zone.id)}
            className='text-red-600 hover:text-red-700'
          >
            <Trash2 className='w-4 h-4' />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
