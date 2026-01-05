// =====================================================
// COMPONENTE: SHIPMENTS LIST ENTERPRISE
// Descripción: Lista de envíos con filtros y acciones
// Basado en: Patrones WooCommerce + shadcn/ui DataTable
// =====================================================

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Package,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Clock,
  Truck,
} from '@/lib/optimized-imports'
import { Shipment, ShipmentStatus } from '@/types/logistics'
import {
  useShipments,
  useShipmentFilters,
  useBulkShipmentOperations,
} from '@/hooks/admin/useShipments'
import { cn } from '@/lib/core/utils'
import { formatDate, formatCurrency } from '@/lib/utils/consolidated-utils'
import Link from 'next/link'

// =====================================================
// INTERFACES
// =====================================================

interface ShipmentsListProps {
  shipments?: Shipment[]
  compact?: boolean
  showActions?: boolean
  showFilters?: boolean
  showPagination?: boolean
  className?: string
}

// =====================================================
// MAPEO DE ESTADOS
// =====================================================

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-800', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: Package },
  picked_up: { label: 'Recolectado', color: 'bg-yellow-100 text-yellow-800', icon: Truck },
  in_transit: { label: 'En Tránsito', color: 'bg-orange-100 text-orange-800', icon: Truck },
  out_for_delivery: { label: 'En Reparto', color: 'bg-purple-100 text-purple-800', icon: MapPin },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: Package },
  exception: { label: 'Excepción', color: 'bg-red-100 text-red-800', icon: Package },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: Package },
  returned: { label: 'Devuelto', color: 'bg-red-100 text-red-800', icon: Package },
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ShipmentsList({
  shipments: propShipments,
  compact = false,
  showActions = true,
  showFilters = false,
  showPagination = false,
  className,
}: ShipmentsListProps) {
  // Hooks para filtros y datos
  const { filters, setStatus, setSearch, setPage } = useShipmentFilters()
  const { data, isLoading, refetch } = useShipments(showFilters ? filters : undefined)
  const {
    selectedShipments,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkUpdateStatus,
    bulkDelete,
    isLoading: isBulkLoading,
  } = useBulkShipmentOperations()

  // Usar shipments de props o de la query
  const shipments = propShipments || data?.data || []
  const pagination = data?.pagination

  // Estado local
  const [searchTerm, setSearchTerm] = useState('')

  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (showFilters) {
      setSearch(value)
    }
  }

  const handleStatusFilter = (status: string) => {
    if (showFilters) {
      setStatus(status === 'all' ? undefined : (status as ShipmentStatus))
    }
  }

  const handleSelectAll = () => {
    const allIds = shipments.map(s => s.id)
    if (selectedShipments.length === allIds.length) {
      clearSelection()
    } else {
      selectAll(allIds)
    }
  }

  // Filtrar shipments localmente si no se usan filtros de servidor
  const filteredShipments =
    !showFilters && searchTerm
      ? shipments.filter(
          shipment =>
            shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shipment.order_id.toString().includes(searchTerm) ||
            shipment.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : shipments

  return (
    <Card className={className}>
      {!compact && (
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Envíos
              </CardTitle>
              <CardDescription>
                {showFilters && pagination
                  ? `${pagination.total} envíos encontrados`
                  : `${filteredShipments.length} envíos`}
              </CardDescription>
            </div>

            <div className='flex items-center gap-2'>
              {selectedShipments.length > 0 && (
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>
                    {selectedShipments.length} seleccionados
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline' size='sm' disabled={isBulkLoading}>
                        Acciones
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() =>
                          bulkUpdateStatus.mutate({
                            shipmentIds: selectedShipments,
                            status: ShipmentStatus.CONFIRMED,
                          })
                        }
                      >
                        Marcar como Confirmado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          bulkUpdateStatus.mutate({
                            shipmentIds: selectedShipments,
                            status: ShipmentStatus.CANCELLED,
                          })
                        }
                      >
                        Cancelar Envíos
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => bulkDelete.mutate(selectedShipments)}
                        className='text-red-600'
                      >
                        Eliminar Envíos
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <Button variant='outline' size='sm' onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={compact ? 'p-4' : undefined}>
        {/* Filtros */}
        {showFilters && (
          <div className='flex flex-col sm:flex-row gap-4 mb-6'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                <Input
                  placeholder='Buscar por tracking, orden o destinatario...'
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <Select onValueChange={handleStatusFilter}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Filtrar por estado' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los estados</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tabla */}
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                {showActions && (
                  <TableHead className='w-12'>
                    <Checkbox
                      checked={
                        selectedShipments.length === filteredShipments.length &&
                        filteredShipments.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Envío</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Destino</TableHead>
                {!compact && <TableHead>Costo</TableHead>}
                {!compact && <TableHead>Fecha</TableHead>}
                {showActions && <TableHead className='w-12'></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={showActions ? (compact ? 6 : 8) : compact ? 5 : 7}
                    className='text-center py-8'
                  >
                    <div className='flex flex-col items-center gap-2'>
                      <Package className='w-8 h-8 text-muted-foreground' />
                      <p className='text-muted-foreground'>
                        {isLoading ? 'Cargando envíos...' : 'No se encontraron envíos'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredShipments.map(shipment => (
                  <TableRow key={shipment.id}>
                    {showActions && (
                      <TableCell>
                        <Checkbox
                          checked={selectedShipments.includes(shipment.id)}
                          onCheckedChange={() => toggleSelection(shipment.id)}
                        />
                      </TableCell>
                    )}

                    <TableCell>
                      <div className='space-y-1'>
                        <div className='font-medium'>Envío #{shipment.id.slice(0, 8)}</div>
                        {shipment.tracking_number && (
                          <div className='text-sm text-muted-foreground'>
                            Tracking: {shipment.tracking_number}
                          </div>
                        )}
                        <div className='text-sm text-muted-foreground'>
                          Orden #{shipment.order_id}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={shipment.status} />
                    </TableCell>

                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {shipment.carrier?.logo_url && (
                          <img
                            src={shipment.carrier.logo_url}
                            alt={shipment.carrier.name}
                            className='w-6 h-6 rounded'
                          />
                        )}
                        <span className='text-sm'>{shipment.carrier?.name || 'Sin asignar'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='text-sm'>
                        {shipment.recipient_city || 'N/A'}, {shipment.recipient_country || 'N/A'}
                      </div>
                    </TableCell>

                    {!compact && (
                      <TableCell>
                        <div className='font-medium'>{formatCurrency(shipment.total_cost)}</div>
                      </TableCell>
                    )}

                    {!compact && (
                      <TableCell>
                        <div className='text-sm'>{formatDate(shipment.created_at)}</div>
                      </TableCell>
                    )}

                    {showActions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='w-4 h-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/logistics/shipments/${shipment.id}`}>
                                <Eye className='w-4 h-4 mr-2' />
                                Ver Detalles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/logistics/shipments/${shipment.id}/edit`}>
                                <Edit className='w-4 h-4 mr-2' />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-red-600'
                              onClick={() => {
                                // TODO: Implementar confirmación
                                console.log('Delete shipment', shipment.id)
                              }}
                            >
                              <Trash2 className='w-4 h-4 mr-2' />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {showPagination && pagination && (
          <div className='flex items-center justify-between mt-4'>
            <div className='text-sm text-muted-foreground'>
              Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}{' '}
              envíos
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(pagination.page - 1)}
                disabled={!pagination.has_prev}
              >
                Anterior
              </Button>

              <span className='text-sm'>
                Página {pagination.page} de {pagination.total_pages}
              </span>

              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(pagination.page + 1)}
                disabled={!pagination.has_next}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =====================================================
// COMPONENTE STATUS BADGE
// =====================================================

function StatusBadge({ status }: { status: ShipmentStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant='secondary' className={cn('flex items-center gap-1', config.color)}>
      <Icon className='w-3 h-3' />
      {config.label}
    </Badge>
  )
}
