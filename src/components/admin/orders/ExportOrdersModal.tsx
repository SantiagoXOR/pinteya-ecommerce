/**
 * Modal de Exportación de Órdenes - Panel Administrativo
 * Basado en mejores prácticas de e-commerce (Shopify, WooCommerce)
 */

'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Download, FileText, Calendar, Filter, CheckCircle, AlertCircle } from 'lucide-react'
import { useOrderNotifications } from '@/hooks/admin/useOrderNotifications'

// ===================================
// TIPOS
// ===================================

interface ExportField {
  key: string
  label: string
  description?: string
  category: 'basic' | 'customer' | 'products' | 'payment' | 'shipping'
}

interface ExportFilters {
  dateFrom: string
  dateTo: string
  status: string
  paymentStatus: string
  minAmount: string
  maxAmount: string
}

interface ExportOrdersModalProps {
  isOpen: boolean
  onClose: () => void
  totalOrders: number
}

// ===================================
// CAMPOS DISPONIBLES PARA EXPORTAR
// ===================================

const EXPORT_FIELDS: ExportField[] = [
  // Básicos
  { key: 'id', label: 'ID de Orden', category: 'basic' },
  { key: 'external_reference', label: 'Referencia Externa', category: 'basic' },
  { key: 'status', label: 'Estado', category: 'basic' },
  { key: 'created_at', label: 'Fecha de Creación', category: 'basic' },
  { key: 'updated_at', label: 'Última Actualización', category: 'basic' },

  // Cliente
  { key: 'customer_name', label: 'Nombre del Cliente', category: 'customer' },
  { key: 'customer_email', label: 'Email del Cliente', category: 'customer' },
  { key: 'customer_phone', label: 'Teléfono del Cliente', category: 'customer' },

  // Productos
  { key: 'product_count', label: 'Cantidad de Productos', category: 'products' },
  { key: 'product_names', label: 'Nombres de Productos', category: 'products' },
  { key: 'product_quantities', label: 'Cantidades', category: 'products' },

  // Pago
  { key: 'total', label: 'Total', category: 'payment' },
  { key: 'payment_status', label: 'Estado de Pago', category: 'payment' },
  { key: 'payment_method', label: 'Método de Pago', category: 'payment' },

  // Envío
  { key: 'shipping_address', label: 'Dirección de Envío', category: 'shipping' },
  { key: 'shipping_method', label: 'Método de Envío', category: 'shipping' },
  { key: 'tracking_number', label: 'Número de Seguimiento', category: 'shipping' },
]

const FIELD_CATEGORIES = {
  basic: { label: 'Información Básica', icon: FileText },
  customer: { label: 'Datos del Cliente', icon: CheckCircle },
  products: { label: 'Productos', icon: CheckCircle },
  payment: { label: 'Información de Pago', icon: CheckCircle },
  shipping: { label: 'Información de Envío', icon: CheckCircle },
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const ExportOrdersModal: React.FC<ExportOrdersModalProps> = ({
  isOpen,
  onClose,
  totalOrders,
}) => {
  const notifications = useOrderNotifications()

  // Estados
  const [format, setFormat] = useState<'csv' | 'excel'>('csv')
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'id',
    'status',
    'created_at',
    'customer_name',
    'customer_email',
    'total',
  ])
  const [filters, setFilters] = useState<ExportFilters>({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    paymentStatus: 'all',
    minAmount: '',
    maxAmount: '',
  })
  const [isExporting, setIsExporting] = useState(false)

  // ===================================
  // FUNCIONES
  // ===================================

  const toggleField = (fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey) ? prev.filter(key => key !== fieldKey) : [...prev, fieldKey]
    )
  }

  const selectAllFields = () => {
    setSelectedFields(EXPORT_FIELDS.map(field => field.key))
  }

  const selectBasicFields = () => {
    setSelectedFields(['id', 'status', 'created_at', 'customer_name', 'customer_email', 'total'])
  }

  const clearAllFields = () => {
    setSelectedFields([])
  }

  const getEstimatedCount = () => {
    // Simular filtrado (en implementación real, esto vendría del backend)
    let estimated = totalOrders

    if (filters.status !== 'all') {
      estimated = Math.floor(estimated * 0.7) // Aproximación
    }

    if (filters.paymentStatus !== 'all') {
      estimated = Math.floor(estimated * 0.8) // Aproximación
    }

    if (filters.dateFrom || filters.dateTo) {
      estimated = Math.floor(estimated * 0.6) // Aproximación
    }

    return estimated
  }

  const exportOrders = async () => {
    try {
      if (selectedFields.length === 0) {
        notifications.showValidationWarning('Debe seleccionar al menos un campo para exportar')
        return
      }

      setIsExporting(true)
      const processingToast = notifications.showProcessingInfo('Preparando exportación')

      // Preparar parámetros de exportación
      const exportParams = {
        format,
        fields: selectedFields,
        filters: {
          ...filters,
          // Limpiar campos vacíos
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
          maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
        },
      }

      // Simular exportación (reemplazar con API real)
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Simular descarga de archivo
      const estimatedCount = getEstimatedCount()
      const filename = `ordenes_${new Date().toISOString().split('T')[0]}.${format}`

      // En implementación real, aquí se descargaría el archivo
      const blob = new Blob(['Datos de exportación simulados'], {
        type:
          format === 'csv'
            ? 'text/csv'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      processingToast.dismiss()

      notifications.showExportSuccess({
        format: format.toUpperCase() as 'CSV' | 'Excel',
        recordCount: estimatedCount,
      })

      onClose()
    } catch (error) {
      console.error('Error exporting orders:', error)
      notifications.showExportError(format.toUpperCase(), 'Error interno del servidor')
    } finally {
      setIsExporting(false)
    }
  }

  const fieldsByCategory = EXPORT_FIELDS.reduce(
    (acc, field) => {
      if (!acc[field.category]) {
        acc[field.category] = []
      }
      acc[field.category].push(field)
      return acc
    },
    {} as Record<string, ExportField[]>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Download className='h-5 w-5' />
            Exportar Órdenes
          </DialogTitle>
        </DialogHeader>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[600px]'>
          {/* Configuración de Formato */}
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Formato de Exportación</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label>Formato de Archivo</Label>
                  <Select
                    value={format}
                    onValueChange={(value: 'csv' | 'excel') => setFormat(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='csv'>CSV (Comma Separated Values)</SelectItem>
                      <SelectItem value='excel'>Excel (.xlsx)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className='space-y-3'>
                  <Label>Selección de Campos</Label>
                  <div className='flex flex-wrap gap-2'>
                    <Button size='sm' variant='outline' onClick={selectAllFields}>
                      Todos
                    </Button>
                    <Button size='sm' variant='outline' onClick={selectBasicFields}>
                      Básicos
                    </Button>
                    <Button size='sm' variant='outline' onClick={clearAllFields}>
                      Limpiar
                    </Button>
                  </div>
                  <p className='text-sm text-gray-600'>
                    {selectedFields.length} campos seleccionados
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <Filter className='h-4 w-4' />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <Label htmlFor='date-from'>Desde</Label>
                    <Input
                      id='date-from'
                      type='date'
                      value={filters.dateFrom}
                      onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor='date-to'>Hasta</Label>
                    <Input
                      id='date-to'
                      type='date'
                      value={filters.dateTo}
                      onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Estado de Orden</Label>
                  <Select
                    value={filters.status}
                    onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todos los Estados</SelectItem>
                      <SelectItem value='pending'>Pendiente</SelectItem>
                      <SelectItem value='processing'>Procesando</SelectItem>
                      <SelectItem value='shipped'>Enviado</SelectItem>
                      <SelectItem value='delivered'>Entregado</SelectItem>
                      <SelectItem value='cancelled'>Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Estado de Pago</Label>
                  <Select
                    value={filters.paymentStatus}
                    onValueChange={value => setFilters(prev => ({ ...prev, paymentStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todos los Estados</SelectItem>
                      <SelectItem value='pending'>Pendiente</SelectItem>
                      <SelectItem value='paid'>Pagado</SelectItem>
                      <SelectItem value='failed'>Fallido</SelectItem>
                      <SelectItem value='refunded'>Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <Label htmlFor='min-amount'>Monto Mín.</Label>
                    <Input
                      id='min-amount'
                      type='number'
                      placeholder='0'
                      value={filters.minAmount}
                      onChange={e => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor='max-amount'>Monto Máx.</Label>
                    <Input
                      id='max-amount'
                      type='number'
                      placeholder='Sin límite'
                      value={filters.maxAmount}
                      onChange={e => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selección de Campos */}
          <div className='lg:col-span-2 space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Campos a Exportar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  {Object.entries(fieldsByCategory).map(([category, fields]) => {
                    const categoryInfo = FIELD_CATEGORIES[category as keyof typeof FIELD_CATEGORIES]
                    const Icon = categoryInfo.icon

                    return (
                      <div key={category}>
                        <div className='flex items-center gap-2 mb-3'>
                          <Icon className='h-4 w-4' />
                          <h4 className='font-medium'>{categoryInfo.label}</h4>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2 ml-6'>
                          {fields.map(field => (
                            <div key={field.key} className='flex items-center space-x-2'>
                              <Checkbox
                                id={field.key}
                                checked={selectedFields.includes(field.key)}
                                onCheckedChange={() => toggleField(field.key)}
                              />
                              <Label
                                htmlFor={field.key}
                                className='text-sm font-normal cursor-pointer'
                              >
                                {field.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resumen */}
        <Card className='bg-blue-50 border-blue-200'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-blue-600' />
                <span className='font-medium'>Resumen de Exportación</span>
              </div>
              <div className='text-right'>
                <p className='text-sm text-gray-600'>
                  Aproximadamente <span className='font-medium'>{getEstimatedCount()}</span> órdenes
                </p>
                <p className='text-sm text-gray-600'>
                  {selectedFields.length} campos seleccionados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button
            onClick={exportOrders}
            disabled={isExporting || selectedFields.length === 0}
            className='min-w-[120px]'
          >
            {isExporting ? 'Exportando...' : `Exportar ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
