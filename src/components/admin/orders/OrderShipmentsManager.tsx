// =====================================================
// COMPONENTE: OrderShipmentsManager
// Descripción: Gestión de envíos desde el detalle de orden
// Integra: Órdenes + Logística
// =====================================================

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { useOrderLogistics, CreateShipmentRequest, Shipment } from '@/hooks/admin/useOrderLogistics'
import { formatDate, formatShipmentStatus } from '@/lib/utils/consolidated-utils'
import { cn } from '@/lib/core/utils'

// =====================================================
// INTERFACES
// =====================================================

interface OrderShipmentsManagerProps {
  orderId: string
  orderItems: Array<{
    id: string
    product_id: string
    quantity: number
    unit_price: number
    product_name: string
    sku?: string
  }>
  shippingAddress?: any
  className?: string
}

interface CreateShipmentDialogProps {
  orderId: string
  orderItems: any[]
  carriers: any[]
  selectedItems: string[]
  onCreateShipment: (data: CreateShipmentRequest) => Promise<void>
  isLoading: boolean
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function OrderShipmentsManager({
  orderId,
  orderItems,
  shippingAddress,
  className,
}: OrderShipmentsManagerProps) {
  const {
    shipments,
    carriers,
    isLoading,
    error,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    createShipment,
    updateShipmentStatus,
    refetchShipments,
    isCreatingShipment,
    isUpdatingStatus,
    derivedMetrics,
  } = useOrderLogistics(orderId)

  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleCreateShipment = async (shipmentData: CreateShipmentRequest) => {
    try {
      await createShipment(shipmentData)
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Error creando envío:', error)
    }
  }

  const handleUpdateStatus = async (shipmentId: string, status: string) => {
    try {
      await updateShipmentStatus(shipmentId, status)
    } catch (error) {
      console.error('Error actualizando estado:', error)
    }
  }

  const handleSelectAllItems = () => {
    const availableItems = orderItems.filter(item => !isItemFullyShipped(item.id))
    selectAllItems(availableItems.map(item => item.id))
  }

  const isItemFullyShipped = (itemId: string) => {
    const item = orderItems.find(i => i.id === itemId)
    if (!item) {
      return false
    }

    const shippedQuantity = shipments.reduce((total, shipment) => {
      const shipmentItem = shipment.items?.find(si => si.order_item.id === itemId)
      return total + (shipmentItem?.quantity || 0)
    }, 0)

    return shippedQuantity >= item.quantity
  }

  const getAvailableQuantity = (itemId: string) => {
    const item = orderItems.find(i => i.id === itemId)
    if (!item) {
      return 0
    }

    const shippedQuantity = shipments.reduce((total, shipment) => {
      const shipmentItem = shipment.items?.find(si => si.order_item.id === itemId)
      return total + (shipmentItem?.quantity || 0)
    }, 0)

    return item.quantity - shippedQuantity
  }

  // =====================================================
  // RENDER
  // =====================================================

  if (error) {
    return (
      <Card className={className}>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>
            <AlertTriangle className='w-8 h-8 mx-auto mb-2' />
            <p className='font-medium'>Error cargando envíos</p>
            <p className='text-sm text-gray-500 mt-1'>
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
            <Button variant='outline' size='sm' onClick={() => refetchShipments()} className='mt-2'>
              <RefreshCw className='w-4 h-4 mr-2' />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header con acciones */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Truck className='w-5 h-5' />
                Gestión de Envíos
              </CardTitle>
              <CardDescription>Crear y gestionar envíos para esta orden</CardDescription>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => refetchShipments()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size='sm' disabled={selectedItems.length === 0 || isCreatingShipment}>
                    <Plus className='w-4 h-4 mr-2' />
                    Crear Envío
                  </Button>
                </DialogTrigger>
                <CreateShipmentDialog
                  orderId={orderId}
                  orderItems={orderItems}
                  carriers={carriers}
                  selectedItems={selectedItems}
                  onCreateShipment={handleCreateShipment}
                  isLoading={isCreatingShipment}
                />
              </Dialog>
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold'>{derivedMetrics.totalShipments}</div>
              <div className='text-sm text-muted-foreground'>Total Envíos</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {derivedMetrics.pendingShipments}
              </div>
              <div className='text-sm text-muted-foreground'>Pendientes</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {derivedMetrics.inTransitShipments}
              </div>
              <div className='text-sm text-muted-foreground'>En Tránsito</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {derivedMetrics.deliveredShipments}
              </div>
              <div className='text-sm text-muted-foreground'>Entregados</div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Selección de items */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h4 className='font-medium'>Items de la Orden</h4>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-muted-foreground'>
                  {selectedItems.length} seleccionados
                </span>
                <Button variant='outline' size='sm' onClick={handleSelectAllItems}>
                  Seleccionar Disponibles
                </Button>
                <Button variant='outline' size='sm' onClick={clearSelection}>
                  Limpiar
                </Button>
              </div>
            </div>

            <div className='space-y-2'>
              {orderItems.map(item => {
                const availableQty = getAvailableQuantity(item.id)
                const isFullyShipped = availableQty === 0

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center justify-between p-3 border rounded-lg',
                      isFullyShipped ? 'bg-gray-50 opacity-60' : 'bg-white'
                    )}
                  >
                    <div className='flex items-center gap-3'>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        disabled={isFullyShipped}
                      />
                      <Package className='w-4 h-4 text-gray-400' />
                      <div>
                        <div className='font-medium'>{item.product_name}</div>
                        <div className='text-sm text-muted-foreground'>
                          SKU: {item.sku || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className='text-right'>
                      <div className='font-medium'>
                        {availableQty} / {item.quantity} disponibles
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        ${item.unit_price.toLocaleString()} c/u
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de envíos existentes */}
      {derivedMetrics.hasShipments && (
        <Card>
          <CardHeader>
            <CardTitle>Envíos Existentes</CardTitle>
            <CardDescription>Historial de envíos creados para esta orden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {shipments.map(shipment => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onUpdateStatus={handleUpdateStatus}
                  isUpdating={isUpdatingStatus}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTE TARJETA DE ENVÍO
// =====================================================

interface ShipmentCardProps {
  shipment: Shipment
  onUpdateStatus: (shipmentId: string, status: string) => void
  isUpdating: boolean
}

function ShipmentCard({ shipment, onUpdateStatus, isUpdating }: ShipmentCardProps) {
  const statusConfig = formatShipmentStatus(shipment.status)
  const latestEvent = shipment.tracking_events?.[0]

  return (
    <div className='border rounded-lg p-4 space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Truck className='w-5 h-5 text-blue-500' />
          <div>
            <div className='font-medium'>{shipment.shipment_number}</div>
            <div className='text-sm text-muted-foreground'>
              {shipment.carrier?.name} - {shipment.shipping_service}
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>

          <Select
            value={shipment.status}
            onValueChange={status => onUpdateStatus(shipment.id, status)}
            disabled={isUpdating}
          >
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='pending'>Pendiente</SelectItem>
              <SelectItem value='confirmed'>Confirmado</SelectItem>
              <SelectItem value='picked_up'>Retirado</SelectItem>
              <SelectItem value='in_transit'>En Tránsito</SelectItem>
              <SelectItem value='delivered'>Entregado</SelectItem>
              <SelectItem value='exception'>Excepción</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {latestEvent && (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Clock className='w-4 h-4' />
          <span>{latestEvent.description}</span>
          <span>•</span>
          <span>{formatDate(latestEvent.occurred_at)}</span>
        </div>
      )}

      <div className='flex items-center gap-4 text-sm'>
        <div className='flex items-center gap-1'>
          <Package className='w-4 h-4' />
          <span>{shipment.items?.length || 0} items</span>
        </div>
        {shipment.weight_kg && (
          <div>
            <span>{shipment.weight_kg}kg</span>
          </div>
        )}
        <div className='flex items-center gap-1'>
          <MapPin className='w-4 h-4' />
          <span>{shipment.delivery_address?.city_name}</span>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// DIALOG CREAR ENVÍO
// =====================================================

function CreateShipmentDialog({
  orderId,
  orderItems,
  carriers,
  selectedItems,
  onCreateShipment,
  isLoading,
}: CreateShipmentDialogProps) {
  const [carrierId, setCarrierId] = useState<number | null>(null)
  const [shippingService, setShippingService] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async () => {
    if (!carrierId || !shippingService) {
      return
    }

    const shipmentData: CreateShipmentRequest = {
      carrier_id: carrierId,
      shipping_service: shippingService,
      items: selectedItems.map(itemId => ({
        order_item_id: itemId,
        quantity: orderItems.find(i => i.id === itemId)?.quantity || 1,
      })),
      delivery_address: {
        street_name: 'Calle Ejemplo',
        street_number: '123',
        city_name: 'Ciudad',
        state_name: 'Provincia',
        zip_code: '1234',
        country: 'Argentina',
      },
      notes,
    }

    await onCreateShipment(shipmentData)
  }

  return (
    <DialogContent className='max-w-md'>
      <DialogHeader>
        <DialogTitle>Crear Nuevo Envío</DialogTitle>
        <DialogDescription>
          Configurar envío para {selectedItems.length} items seleccionados
        </DialogDescription>
      </DialogHeader>

      <div className='space-y-4'>
        <div>
          <label className='text-sm font-medium'>Carrier</label>
          <Select
            value={carrierId?.toString()}
            onValueChange={value => setCarrierId(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder='Seleccionar carrier' />
            </SelectTrigger>
            <SelectContent>
              {carriers.map(carrier => (
                <SelectItem key={carrier.id} value={carrier.id.toString()}>
                  {carrier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className='text-sm font-medium'>Servicio de Envío</label>
          <Select value={shippingService} onValueChange={setShippingService}>
            <SelectTrigger>
              <SelectValue placeholder='Seleccionar servicio' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='standard'>Estándar</SelectItem>
              <SelectItem value='express'>Express</SelectItem>
              <SelectItem value='next_day'>Día Siguiente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className='text-sm font-medium'>Notas (Opcional)</label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder='Instrucciones especiales...'
            rows={3}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant='outline' disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!carrierId || !shippingService || isLoading}>
          {isLoading ? 'Creando...' : 'Crear Envío'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
