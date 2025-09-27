// ===================================
// PINTEYA E-COMMERCE - ORDER STATUS MANAGER COMPONENT
// ===================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, CheckCircle, Clock, Truck, Package, RefreshCw } from 'lucide-react'
import { OrderEnterprise, OrderStatus } from '@/types/orders-enterprise'
import {
  formatOrderStatus,
  validateStateTransition,
  getAvailableTransitions,
  statusRequiresAdditionalInfo,
} from '@/lib/orders-enterprise'
import { useToast } from '@/hooks/use-toast'

// ===================================
// INTERFACES
// ===================================

interface OrderStatusManagerProps {
  order: OrderEnterprise
  onStatusChange: (newStatus: string, reason: string, additionalData?: any) => void
  className?: string
}

interface StatusChangeForm {
  newStatus: OrderStatus | ''
  reason: string
  notifyCustomer: boolean
  trackingNumber: string
  carrier: string
  estimatedDelivery: string
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const OrderStatusManager: React.FC<OrderStatusManagerProps> = ({
  order,
  onStatusChange,
  className = '',
}) => {
  const { toast } = useToast()

  // Estado del formulario
  const [form, setForm] = useState<StatusChangeForm>({
    newStatus: '',
    reason: '',
    notifyCustomer: true,
    trackingNumber: order.tracking_number || '',
    carrier: order.carrier || '',
    estimatedDelivery: order.estimated_delivery || '',
  })

  const [loading, setLoading] = useState(false)
  const [availableTransitions, setAvailableTransitions] = useState<any[]>([])

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    const transitions = getAvailableTransitions(order.status)
    setAvailableTransitions(transitions)
  }, [order.status])

  // ===================================
  // MANEJADORES DE EVENTOS
  // ===================================

  const handleFormChange = (field: keyof StatusChangeForm, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleStatusChange = async () => {
    if (!form.newStatus) {
      toast({
        title: 'Error',
        description: 'Selecciona un nuevo estado',
        variant: 'destructive',
      })
      return
    }

    if (!form.reason.trim()) {
      toast({
        title: 'Error',
        description: 'La razón del cambio es requerida',
        variant: 'destructive',
      })
      return
    }

    // Validar transición
    const validation = validateStateTransition(order.status, form.newStatus)
    if (!validation.valid) {
      toast({
        title: 'Transición no válida',
        description: validation.message,
        variant: 'destructive',
      })
      return
    }

    // Validar campos adicionales requeridos
    const additionalInfo = statusRequiresAdditionalInfo(form.newStatus)
    if (additionalInfo.requiresTracking && !form.trackingNumber.trim()) {
      toast({
        title: 'Error',
        description: 'El número de seguimiento es requerido para este estado',
        variant: 'destructive',
      })
      return
    }

    if (additionalInfo.requiresCarrier && !form.carrier.trim()) {
      toast({
        title: 'Error',
        description: 'El transportista es requerido para este estado',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const additionalData = {
        notify_customer: form.notifyCustomer,
        tracking_number: form.trackingNumber || undefined,
        carrier: form.carrier || undefined,
        estimated_delivery: form.estimatedDelivery || undefined,
      }

      await onStatusChange(form.newStatus, form.reason, additionalData)

      // Limpiar formulario
      setForm(prev => ({
        ...prev,
        newStatus: '',
        reason: '',
      }))
    } catch (error) {
      // El error ya se maneja en el componente padre
    } finally {
      setLoading(false)
    }
  }

  // ===================================
  // RENDER DE ESTADO ACTUAL
  // ===================================

  const renderCurrentStatus = () => {
    const statusInfo = formatOrderStatus(order.status)

    return (
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='w-5 h-5' />
            Estado Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4'>
            <Badge
              className={
                statusInfo.color === 'green'
                  ? 'bg-green-100 text-green-800'
                  : statusInfo.color === 'blue'
                    ? 'bg-blue-100 text-blue-800'
                    : statusInfo.color === 'yellow'
                      ? 'bg-yellow-100 text-yellow-800'
                      : statusInfo.color === 'red'
                        ? 'bg-red-100 text-red-800'
                        : statusInfo.color === 'purple'
                          ? 'bg-purple-100 text-purple-800'
                          : statusInfo.color === 'orange'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
              }
            >
              {statusInfo.label}
            </Badge>
            <span className='text-gray-600'>{statusInfo.description}</span>
          </div>

          {/* Información adicional del estado actual */}
          <div className='mt-4 space-y-2'>
            {order.tracking_number && (
              <div className='flex items-center gap-2'>
                <Truck className='w-4 h-4 text-gray-500' />
                <span className='text-sm'>
                  <strong>Seguimiento:</strong> {order.tracking_number}
                </span>
              </div>
            )}
            {order.carrier && (
              <div className='flex items-center gap-2'>
                <Package className='w-4 h-4 text-gray-500' />
                <span className='text-sm'>
                  <strong>Transportista:</strong> {order.carrier}
                </span>
              </div>
            )}
            {order.estimated_delivery && (
              <div className='flex items-center gap-2'>
                <Clock className='w-4 h-4 text-gray-500' />
                <span className='text-sm'>
                  <strong>Entrega estimada:</strong>{' '}
                  {new Date(order.estimated_delivery).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ===================================
  // RENDER DE TRANSICIONES DISPONIBLES
  // ===================================

  const renderAvailableTransitions = () => {
    if (availableTransitions.length === 0) {
      return (
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='text-center text-gray-500'>
              <CheckCircle className='w-12 h-12 mx-auto mb-2 text-green-500' />
              <p>No hay transiciones disponibles para este estado</p>
              <p className='text-sm'>La orden está en un estado final</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Transiciones Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
            {availableTransitions.map(transition => {
              const statusInfo = formatOrderStatus(transition.status)
              return (
                <Button
                  key={transition.status}
                  variant='outline'
                  className='h-auto p-4 flex flex-col items-start'
                  onClick={() => handleFormChange('newStatus', transition.status)}
                >
                  <Badge
                    className={
                      statusInfo.color === 'green'
                        ? 'bg-green-100 text-green-800'
                        : statusInfo.color === 'blue'
                          ? 'bg-blue-100 text-blue-800'
                          : statusInfo.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : statusInfo.color === 'red'
                              ? 'bg-red-100 text-red-800'
                              : statusInfo.color === 'purple'
                                ? 'bg-purple-100 text-purple-800'
                                : statusInfo.color === 'orange'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {statusInfo.label}
                  </Badge>
                  <span className='text-sm text-gray-600 mt-1'>{transition.description}</span>
                  {transition.requiresReason && (
                    <div className='flex items-center gap-1 mt-2'>
                      <AlertTriangle className='w-3 h-3 text-amber-500' />
                      <span className='text-xs text-amber-600'>Requiere razón</span>
                    </div>
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ===================================
  // RENDER DE FORMULARIO DE CAMBIO
  // ===================================

  const renderChangeForm = () => {
    if (!form.newStatus) {
      return null
    }

    const selectedStatusInfo = formatOrderStatus(form.newStatus)
    const additionalInfo = statusRequiresAdditionalInfo(form.newStatus)

    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <RefreshCw className='w-5 h-5' />
            Cambiar a: {selectedStatusInfo.label}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Razón del cambio */}
          <div>
            <Label htmlFor='reason'>Razón del cambio *</Label>
            <Textarea
              id='reason'
              placeholder='Describe la razón del cambio de estado...'
              value={form.reason}
              onChange={e => handleFormChange('reason', e.target.value)}
              className='mt-1'
            />
          </div>

          {/* Campos adicionales según el estado */}
          {additionalInfo.requiresTracking && (
            <div>
              <Label htmlFor='tracking'>Número de seguimiento *</Label>
              <Input
                id='tracking'
                placeholder='Ej: 1234567890'
                value={form.trackingNumber}
                onChange={e => handleFormChange('trackingNumber', e.target.value)}
                className='mt-1'
              />
            </div>
          )}

          {additionalInfo.requiresCarrier && (
            <div>
              <Label htmlFor='carrier'>Transportista *</Label>
              <Select
                value={form.carrier}
                onValueChange={value => handleFormChange('carrier', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Selecciona transportista' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='correo-argentino'>Correo Argentino</SelectItem>
                  <SelectItem value='oca'>OCA</SelectItem>
                  <SelectItem value='andreani'>Andreani</SelectItem>
                  <SelectItem value='mercado-envios'>Mercado Envíos</SelectItem>
                  <SelectItem value='otro'>Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {additionalInfo.requiresEstimatedDelivery && (
            <div>
              <Label htmlFor='delivery'>Fecha estimada de entrega</Label>
              <Input
                id='delivery'
                type='date'
                value={form.estimatedDelivery}
                onChange={e => handleFormChange('estimatedDelivery', e.target.value)}
                className='mt-1'
              />
            </div>
          )}

          {/* Notificar al cliente */}
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='notify'
              checked={form.notifyCustomer}
              onCheckedChange={checked => handleFormChange('notifyCustomer', !!checked)}
            />
            <Label htmlFor='notify' className='text-sm'>
              Notificar al cliente por email
            </Label>
          </div>

          {/* Botones de acción */}
          <div className='flex gap-2 pt-4'>
            <Button onClick={handleStatusChange} disabled={loading} className='flex-1'>
              {loading ? (
                <>
                  <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                  Cambiando...
                </>
              ) : (
                <>
                  <CheckCircle className='w-4 h-4 mr-2' />
                  Confirmar Cambio
                </>
              )}
            </Button>
            <Button
              variant='outline'
              onClick={() => setForm(prev => ({ ...prev, newStatus: '', reason: '' }))}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ===================================
  // RENDER PRINCIPAL
  // ===================================

  return (
    <div className={`space-y-6 ${className}`}>
      {renderCurrentStatus()}
      {renderAvailableTransitions()}
      {renderChangeForm()}
    </div>
  )
}
