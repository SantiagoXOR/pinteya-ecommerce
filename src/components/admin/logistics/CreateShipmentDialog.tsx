// =====================================================
// COMPONENTE: CREATE SHIPMENT DIALOG ENTERPRISE
// Descripción: Modal para creación rápida de envíos desde dashboard
// Basado en: shadcn/ui Dialog + React Hook Form + Zod
// =====================================================

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormField, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Package,
  MapPin,
  Truck,
  Calculator,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { CreateShipmentRequest, ShippingService, Shipment } from '@/types/logistics'
import { useCreateShipment } from '@/hooks/admin/useShipments'
import { useCouriers, useShippingQuote } from '@/hooks/admin/useShippingQuote'
import { cn } from '@/lib/core/utils'
import { formatCurrency } from '@/lib/utils/consolidated-utils'

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const QuickShipmentSchema = z.object({
  order_id: z.number().positive('ID de orden es requerido'),
  shipping_service: z.nativeEnum(ShippingService),
  carrier_id: z.number().positive().optional(),

  // Dirección simplificada
  delivery_city: z.string().min(1, 'Ciudad es requerida'),
  delivery_state: z.string().min(1, 'Provincia es requerida'),
  delivery_address: z.string().min(1, 'Dirección es requerida'),
  delivery_postal_code: z.string().min(4, 'Código postal es requerido'),

  // Detalles del paquete
  weight_kg: z.number().positive('Peso es requerido'),
  dimensions_cm: z
    .string()
    .regex(/^\d+x\d+x\d+$/, 'Formato: LxWxH')
    .optional(),

  // Producto simplificado
  product_id: z.number().positive('ID de producto es requerido'),
  quantity: z.number().positive('Cantidad es requerida'),

  // Notas opcionales
  notes: z.string().max(500).optional(),
})

type QuickShipmentFormData = z.infer<typeof QuickShipmentSchema>

// =====================================================
// INTERFACES
// =====================================================

interface CreateShipmentDialogProps {
  children: React.ReactNode
  onSuccess?: (shipment: Shipment) => void
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function CreateShipmentDialog({ children, onSuccess }: CreateShipmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'form' | 'quote' | 'confirm'>('form')
  const [selectedQuote, setSelectedQuote] = useState<any>(null)

  // Hooks
  const { data: couriers } = useCouriers({ activeOnly: true })
  const createShipment = useCreateShipment()
  const { getQuote, quotes, isLoading: quoteLoading } = useShippingQuote()

  // Form setup
  const form = useForm<QuickShipmentFormData>({
    resolver: zodResolver(QuickShipmentSchema),
    defaultValues: {
      shipping_service: ShippingService.STANDARD,
      quantity: 1,
      weight_kg: 1,
    },
  })

  // Handlers
  const onSubmit = async (data: QuickShipmentFormData) => {
    if (step === 'form') {
      // Paso 1: Obtener cotizaciones
      try {
        await getQuote({
          origin_address: {
            city: 'Buenos Aires',
            state: 'Buenos Aires',
            postal_code: '1000',
          },
          destination_address: {
            city: data.delivery_city,
            state: data.delivery_state,
            postal_code: data.delivery_postal_code,
          },
          weight_kg: data.weight_kg,
          dimensions_cm: data.dimensions_cm || '30x20x15',
          service_type: data.shipping_service,
        })
        setStep('quote')
      } catch (error) {
        console.error('Error getting quotes:', error)
      }
    } else if (step === 'confirm') {
      // Paso 3: Crear envío
      try {
        const shipmentData: CreateShipmentRequest = {
          order_id: data.order_id,
          carrier_id: selectedQuote?.courier_id,
          shipping_service: data.shipping_service,
          delivery_address: {
            street: data.delivery_address.split(' ')[0] || '',
            number: data.delivery_address.split(' ')[1] || '1',
            apartment: '',
            neighborhood: '',
            city: data.delivery_city,
            state: data.delivery_state,
            postal_code: data.delivery_postal_code,
            country: 'Argentina',
          },
          weight_kg: data.weight_kg,
          dimensions_cm: data.dimensions_cm,
          items: [
            {
              product_id: data.product_id,
              quantity: data.quantity,
              weight_kg: data.weight_kg,
            },
          ],
          notes: data.notes,
        }

        const newShipment = await createShipment.mutateAsync(shipmentData)
        onSuccess?.(newShipment)
        handleClose()
      } catch (error) {
        console.error('Error creating shipment:', error)
      }
    }
  }

  const handleSelectQuote = (quote: any) => {
    setSelectedQuote(quote)
    setStep('confirm')
  }

  const handleClose = () => {
    setOpen(false)
    setStep('form')
    setSelectedQuote(null)
    form.reset()
  }

  const handleBack = () => {
    if (step === 'quote') {
      setStep('form')
    } else if (step === 'confirm') {
      setStep('quote')
    }
  }

  const isLoading = createShipment.isPending || quoteLoading

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Package className='w-5 h-5' />
            Crear Envío Rápido
          </DialogTitle>
          <DialogDescription>
            {step === 'form' && 'Complete la información básica del envío'}
            {step === 'quote' && 'Seleccione la mejor cotización'}
            {step === 'confirm' && 'Confirme los detalles del envío'}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de pasos */}
        <div className='flex items-center justify-center space-x-4 py-4'>
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              step === 'form' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
            )}
          >
            {step === 'form' ? '1' : <CheckCircle className='w-4 h-4' />}
          </div>
          <div className={cn('h-0.5 w-12', step !== 'form' ? 'bg-green-300' : 'bg-gray-200')} />
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              step === 'quote'
                ? 'bg-blue-100 text-blue-600'
                : step === 'confirm'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
            )}
          >
            {step === 'confirm' ? <CheckCircle className='w-4 h-4' /> : '2'}
          </div>
          <div className={cn('h-0.5 w-12', step === 'confirm' ? 'bg-green-300' : 'bg-gray-200')} />
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              step === 'confirm' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            )}
          >
            3
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Paso 1: Formulario */}
            {step === 'form' && (
              <div className='space-y-6'>
                {/* Información básica */}
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='order_id'
                    render={({ field }) => (
                      <FormField>
                        <Label>ID de Orden</Label>
                        <Input
                          type='number'
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                        <FormMessage />
                      </FormField>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='shipping_service'
                    render={({ field }) => (
                      <FormField>
                        <Label>Tipo de Servicio</Label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ShippingService.STANDARD}>Estándar</SelectItem>
                            <SelectItem value={ShippingService.EXPRESS}>Express</SelectItem>
                            <SelectItem value={ShippingService.NEXT_DAY}>Día Siguiente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormField>
                    )}
                  />
                </div>

                <Separator />

                {/* Dirección de entrega */}
                <div className='space-y-4'>
                  <h4 className='font-semibold flex items-center gap-2'>
                    <MapPin className='w-4 h-4' />
                    Dirección de Entrega
                  </h4>

                  <FormField
                    control={form.control}
                    name='delivery_address'
                    render={({ field }) => (
                      <FormField>
                        <Label>Dirección Completa</Label>
                        <Input {...field} placeholder='Av. Corrientes 1234' />
                        <FormMessage />
                      </FormField>
                    )}
                  />

                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='delivery_city'
                      render={({ field }) => (
                        <FormField>
                          <Label>Ciudad</Label>
                          <Input {...field} />
                          <FormMessage />
                        </FormField>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='delivery_state'
                      render={({ field }) => (
                        <FormField>
                          <Label>Provincia</Label>
                          <Input {...field} />
                          <FormMessage />
                        </FormField>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='delivery_postal_code'
                    render={({ field }) => (
                      <FormField>
                        <Label>Código Postal</Label>
                        <Input {...field} />
                        <FormMessage />
                      </FormField>
                    )}
                  />
                </div>

                <Separator />

                {/* Detalles del paquete */}
                <div className='space-y-4'>
                  <h4 className='font-semibold flex items-center gap-2'>
                    <Package className='w-4 h-4' />
                    Detalles del Paquete
                  </h4>

                  <div className='grid grid-cols-3 gap-4'>
                    <FormField
                      control={form.control}
                      name='product_id'
                      render={({ field }) => (
                        <FormField>
                          <Label>ID Producto</Label>
                          <Input
                            type='number'
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                          <FormMessage />
                        </FormField>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='quantity'
                      render={({ field }) => (
                        <FormField>
                          <Label>Cantidad</Label>
                          <Input
                            type='number'
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                          <FormMessage />
                        </FormField>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='weight_kg'
                      render={({ field }) => (
                        <FormField>
                          <Label>Peso (kg)</Label>
                          <Input
                            type='number'
                            step='0.1'
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                          <FormMessage />
                        </FormField>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='dimensions_cm'
                    render={({ field }) => (
                      <FormField>
                        <Label>Dimensiones (opcional)</Label>
                        <Input {...field} placeholder='30x20x15' />
                        <FormMessage />
                      </FormField>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='notes'
                  render={({ field }) => (
                    <FormField>
                      <Label>Notas (opcional)</Label>
                      <Textarea {...field} rows={2} />
                      <FormMessage />
                    </FormField>
                  )}
                />
              </div>
            )}

            {/* Paso 2: Cotizaciones */}
            {step === 'quote' && (
              <div className='space-y-4'>
                <h4 className='font-semibold flex items-center gap-2'>
                  <Calculator className='w-4 h-4' />
                  Seleccionar Cotización
                </h4>

                {quotes.length === 0 ? (
                  <div className='text-center py-8'>
                    <AlertTriangle className='w-8 h-8 text-yellow-500 mx-auto mb-2' />
                    <p className='text-muted-foreground'>
                      No se encontraron cotizaciones disponibles
                    </p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {quotes.map((quote, index) => (
                      <div
                        key={index}
                        className={cn(
                          'p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md',
                          selectedQuote?.courier_id === quote.courier_id &&
                            'border-blue-500 bg-blue-50'
                        )}
                        onClick={() => handleSelectQuote(quote)}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                            <Truck className='w-5 h-5 text-muted-foreground' />
                            <div>
                              <div className='font-medium'>{quote.courier_name}</div>
                              <div className='text-sm text-muted-foreground'>
                                {quote.service_type} • {quote.estimated_delivery_days} días
                              </div>
                            </div>
                          </div>

                          <div className='text-right'>
                            <div className='text-lg font-bold'>{formatCurrency(quote.cost)}</div>
                            <div className='text-sm text-muted-foreground'>
                              Entrega: {quote.estimated_delivery_date}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Paso 3: Confirmación */}
            {step === 'confirm' && selectedQuote && (
              <div className='space-y-4'>
                <h4 className='font-semibold flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4' />
                  Confirmar Envío
                </h4>

                <div className='p-4 bg-muted/50 rounded-lg space-y-3'>
                  <div className='flex justify-between'>
                    <span>Courier:</span>
                    <span className='font-medium'>{selectedQuote.courier_name}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Servicio:</span>
                    <span className='font-medium'>{selectedQuote.service_type}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Costo:</span>
                    <span className='font-medium'>{formatCurrency(selectedQuote.cost)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Entrega estimada:</span>
                    <span className='font-medium'>{selectedQuote.estimated_delivery_date}</span>
                  </div>
                </div>

                <div className='text-sm text-muted-foreground'>
                  Al confirmar, se creará el envío y se notificará al courier seleccionado.
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className='flex items-center justify-between pt-6'>
              <div>
                {step !== 'form' && (
                  <Button type='button' variant='outline' onClick={handleBack}>
                    Atrás
                  </Button>
                )}
              </div>

              <div className='flex items-center gap-3'>
                <Button type='button' variant='outline' onClick={handleClose}>
                  Cancelar
                </Button>

                <Button type='submit' disabled={isLoading || (step === 'quote' && !selectedQuote)}>
                  {isLoading && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                  {step === 'form' && 'Cotizar'}
                  {step === 'quote' && 'Continuar'}
                  {step === 'confirm' && 'Crear Envío'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
