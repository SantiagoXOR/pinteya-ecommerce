// ===================================
// PINTEYA E-COMMERCE - ORDER FORM ENTERPRISE COMPONENT
// ===================================

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Save,
  RefreshCw,
  Plus,
  Trash2,
  User,
  Package,
  MapPin,
  AlertCircle,
  CheckCircle,
} from '@/lib/optimized-imports'
import {
  OrderEnterprise,
  CreateOrderRequest,
  UpdateOrderRequest,
  ShippingAddress,
} from '@/types/orders-enterprise'
import { validateOrderData } from '@/lib/orders-enterprise'
import { useToast } from '@/hooks/use-toast'

// ===================================
// INTERFACES
// ===================================

interface OrderFormEnterpriseProps {
  order?: OrderEnterprise
  onSave: (orderData: CreateOrderRequest | UpdateOrderRequest) => Promise<void>
  onCancel?: () => void
  className?: string
  autoSave?: boolean
  autoSaveInterval?: number
}

interface OrderFormData {
  user_id: string
  items: {
    product_id: number
    quantity: number
    unit_price: number
    product_name?: string
  }[]
  shipping_address?: ShippingAddress
  notes?: string
}

interface FormState {
  data: OrderFormData
  loading: boolean
  saving: boolean
  errors: Record<string, string>
  isDirty: boolean
  lastSaved?: Date
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const OrderFormEnterprise: React.FC<OrderFormEnterpriseProps> = ({
  order,
  onSave,
  onCancel,
  className = '',
  autoSave = true,
  autoSaveInterval = 30000, // 30 segundos
}) => {
  const { toast } = useToast()

  // Estado del formulario
  const [state, setState] = useState<FormState>({
    data: {
      user_id: order?.user_id || '',
      items: order?.order_items?.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        product_name: item.products?.name,
      })) || [{ product_id: 0, quantity: 1, unit_price: 0 }],
      shipping_address: order?.shipping_address
        ? typeof order.shipping_address === 'string'
          ? JSON.parse(order.shipping_address)
          : order.shipping_address
        : undefined,
      notes: order?.notes || '',
    },
    loading: false,
    saving: false,
    errors: {},
    isDirty: false,
    lastSaved: order ? new Date() : undefined,
  })

  // ===================================
  // AUTO-SAVE
  // ===================================

  const performAutoSave = useCallback(async () => {
    if (!autoSave || !state.isDirty || state.saving || !order) {
      return
    }

    setState(prev => ({ ...prev, saving: true }))

    try {
      await onSave(state.data)
      setState(prev => ({
        ...prev,
        saving: false,
        isDirty: false,
        lastSaved: new Date(),
      }))

      toast({
        title: 'Guardado automático',
        description: 'Los cambios se han guardado automáticamente',
      })
    } catch (error) {
      setState(prev => ({ ...prev, saving: false }))
      // No mostrar error en auto-save para no molestar al usuario
    }
  }, [autoSave, state.isDirty, state.saving, order, onSave, state.data, toast])

  useEffect(() => {
    if (!autoSave || !order) {
      return
    }

    const interval = setInterval(performAutoSave, autoSaveInterval)
    return () => clearInterval(interval)
  }, [autoSave, order, autoSaveInterval, performAutoSave])

  // ===================================
  // MANEJADORES DE EVENTOS
  // ===================================

  const handleFieldChange = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
      isDirty: true,
      errors: {
        ...prev.errors,
        [field]: '', // Limpiar error del campo
      },
    }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    setState(prev => {
      const newItems = [...prev.data.items]
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      }

      return {
        ...prev,
        data: {
          ...prev.data,
          items: newItems,
        },
        isDirty: true,
      }
    })
  }

  const handleAddItem = () => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        items: [...prev.data.items, { product_id: 0, quantity: 1, unit_price: 0 }],
      },
      isDirty: true,
    }))
  }

  const handleRemoveItem = (index: number) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        items: prev.data.items.filter((_, i) => i !== index),
      },
      isDirty: true,
    }))
  }

  const handleAddressChange = (field: string, value: string) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        shipping_address: {
          ...prev.data.shipping_address,
          [field]: value,
        } as ShippingAddress,
      },
      isDirty: true,
    }))
  }

  const handleSave = async () => {
    // Validar datos
    const validation = validateOrderData(state.data as any)
    if (!validation.valid) {
      const errors: Record<string, string> = {}
      validation.errors.forEach(error => {
        errors.general = error
      })

      setState(prev => ({ ...prev, errors }))
      toast({
        title: 'Error de validación',
        description: 'Corrige los errores antes de guardar',
        variant: 'destructive',
      })
      return
    }

    setState(prev => ({ ...prev, saving: true, errors: {} }))

    try {
      await onSave(state.data)
      setState(prev => ({
        ...prev,
        saving: false,
        isDirty: false,
        lastSaved: new Date(),
      }))

      toast({
        title: 'Guardado exitoso',
        description: order ? 'La orden ha sido actualizada' : 'La orden ha sido creada',
      })
    } catch (error) {
      setState(prev => ({ ...prev, saving: false }))
      toast({
        title: 'Error al guardar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    }
  }

  // ===================================
  // CÁLCULOS
  // ===================================

  const calculateTotal = () => {
    return state.data.items.reduce((total, item) => {
      return total + item.unit_price * item.quantity
    }, 0)
  }

  // ===================================
  // RENDER DE HEADER
  // ===================================

  const renderHeader = () => (
    <div className='flex items-center justify-between mb-6'>
      <div>
        <h2 className='text-2xl font-bold'>
          {order ? `Editar Orden ${order.order_number}` : 'Nueva Orden'}
        </h2>
        <div className='flex items-center gap-4 mt-2 text-sm text-gray-600'>
          {state.isDirty && (
            <div className='flex items-center gap-1 text-amber-600'>
              <AlertCircle className='w-4 h-4' />
              Cambios sin guardar
            </div>
          )}
          {state.lastSaved && (
            <div className='flex items-center gap-1 text-green-600'>
              <CheckCircle className='w-4 h-4' />
              Guardado: {state.lastSaved.toLocaleTimeString()}
            </div>
          )}
          {state.saving && (
            <div className='flex items-center gap-1 text-blue-600'>
              <RefreshCw className='w-4 h-4 animate-spin' />
              Guardando...
            </div>
          )}
        </div>
      </div>
      <div className='flex gap-2'>
        {onCancel && (
          <Button variant='outline' onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSave} disabled={state.saving}>
          {state.saving ? (
            <>
              <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
              Guardando...
            </>
          ) : (
            <>
              <Save className='w-4 h-4 mr-2' />
              Guardar
            </>
          )}
        </Button>
      </div>
    </div>
  )

  // ===================================
  // RENDER DE INFORMACIÓN DEL CLIENTE
  // ===================================

  const renderCustomerInfo = () => (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <User className='w-5 h-5' />
          Información del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div>
            <Label htmlFor='user_id'>ID del Usuario *</Label>
            <Input
              id='user_id'
              value={state.data.user_id}
              onChange={e => handleFieldChange('user_id', e.target.value)}
              placeholder='UUID del usuario'
              className='mt-1'
            />
            {state.errors.user_id && (
              <p className='text-sm text-red-600 mt-1'>{state.errors.user_id}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // ===================================
  // RENDER DE PRODUCTOS
  // ===================================

  const renderProducts = () => (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Package className='w-5 h-5' />
          Productos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {state.data.items.map((item, index) => (
            <div key={index} className='p-4 border rounded-lg'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div>
                  <Label>ID del Producto *</Label>
                  <Input
                    type='number'
                    value={item.product_id || ''}
                    onChange={e =>
                      handleItemChange(index, 'product_id', parseInt(e.target.value) || 0)
                    }
                    placeholder='ID'
                    className='mt-1'
                  />
                </div>
                <div>
                  <Label>Cantidad *</Label>
                  <Input
                    type='number'
                    min='1'
                    value={item.quantity}
                    onChange={e =>
                      handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                    }
                    className='mt-1'
                  />
                </div>
                <div>
                  <Label>Precio Unitario *</Label>
                  <Input
                    type='number'
                    min='0'
                    step='0.01'
                    value={item.unit_price}
                    onChange={e =>
                      handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)
                    }
                    className='mt-1'
                  />
                </div>
                <div className='flex items-end'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleRemoveItem(index)}
                    disabled={state.data.items.length === 1}
                    className='w-full'
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              </div>
              <div className='mt-2 text-right'>
                <span className='font-medium'>
                  Subtotal: ${(item.unit_price * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          <Button variant='outline' onClick={handleAddItem} className='w-full'>
            <Plus className='w-4 h-4 mr-2' />
            Agregar Producto
          </Button>

          <Separator />

          <div className='text-right'>
            <div className='text-2xl font-bold'>Total: ${calculateTotal().toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // ===================================
  // RENDER DE DIRECCIÓN DE ENVÍO
  // ===================================

  const renderShippingAddress = () => (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MapPin className='w-5 h-5' />
          Dirección de Envío
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label>Calle</Label>
            <Input
              value={state.data.shipping_address?.street_name || ''}
              onChange={e => handleAddressChange('street_name', e.target.value)}
              placeholder='Nombre de la calle'
              className='mt-1'
            />
          </div>
          <div>
            <Label>Número</Label>
            <Input
              value={state.data.shipping_address?.street_number || ''}
              onChange={e => handleAddressChange('street_number', e.target.value)}
              placeholder='Número'
              className='mt-1'
            />
          </div>
          <div>
            <Label>Código Postal</Label>
            <Input
              value={state.data.shipping_address?.zip_code || ''}
              onChange={e => handleAddressChange('zip_code', e.target.value)}
              placeholder='CP'
              className='mt-1'
            />
          </div>
          <div>
            <Label>Ciudad</Label>
            <Input
              value={state.data.shipping_address?.city_name || ''}
              onChange={e => handleAddressChange('city_name', e.target.value)}
              placeholder='Ciudad'
              className='mt-1'
            />
          </div>
          <div className='md:col-span-2'>
            <Label>Provincia</Label>
            <Input
              value={state.data.shipping_address?.state_name || ''}
              onChange={e => handleAddressChange('state_name', e.target.value)}
              placeholder='Provincia'
              className='mt-1'
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // ===================================
  // RENDER DE NOTAS
  // ===================================

  const renderNotes = () => (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle>Notas</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={state.data.notes || ''}
          onChange={e => handleFieldChange('notes', e.target.value)}
          placeholder='Notas adicionales sobre la orden...'
          rows={4}
        />
      </CardContent>
    </Card>
  )

  // ===================================
  // RENDER PRINCIPAL
  // ===================================

  return (
    <div className={`space-y-6 ${className}`}>
      {renderHeader()}

      {state.errors.general && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
          <p className='text-red-600'>{state.errors.general}</p>
        </div>
      )}

      {renderCustomerInfo()}
      {renderProducts()}
      {renderShippingAddress()}
      {renderNotes()}
    </div>
  )
}
