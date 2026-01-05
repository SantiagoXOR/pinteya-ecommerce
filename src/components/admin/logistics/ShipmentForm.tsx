// =====================================================
// COMPONENTE: SHIPMENT FORM ENTERPRISE
// Descripción: Formulario completo para creación/edición de envíos
// Basado en: React Hook Form + Zod + shadcn/ui
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Package,
  MapPin,
  Truck,
  Plus,
  Trash2,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from '@/lib/optimized-imports'
import {
  CreateShipmentRequest,
  Shipment,
  ShippingService,
  Courier,
  Address,
} from '@/types/logistics'
import { useCreateShipment, useUpdateShipment } from '@/hooks/admin/useShipments'
import { useCouriers } from '@/hooks/admin/useCouriers'
import { useShippingQuote } from '@/hooks/admin/useShippingQuote'
import { cn } from '@/lib/core/utils'
import { formatCurrency } from '@/lib/utils/consolidated-utils'

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const AddressSchema = z.object({
  street: z.string().min(1, 'Calle es requerida'),
  number: z.string().min(1, 'Número es requerido'),
  apartment: z.string().optional(),
  neighborhood: z.string().min(1, 'Barrio es requerido'),
  city: z.string().min(1, 'Ciudad es requerida'),
  state: z.string().min(1, 'Provincia es requerida'),
  postal_code: z.string().min(4, 'Código postal debe tener al menos 4 caracteres'),
  country: z.string().default('Argentina'),
  reference: z.string().optional(),
})

const ShipmentItemSchema = z.object({
  product_id: z.number().positive('ID de producto es requerido'),
  quantity: z.number().positive('Cantidad debe ser positiva'),
  weight_kg: z.number().positive().optional(),
})

const ShipmentFormSchema = z.object({
  order_id: z.number().positive('ID de orden es requerido'),
  carrier_id: z.number().positive().optional(),
  shipping_service: z.nativeEnum(ShippingService),
  delivery_address: AddressSchema,
  pickup_address: AddressSchema.optional(),
  weight_kg: z.number().positive().optional(),
  dimensions_cm: z
    .string()
    .regex(/^\d+x\d+x\d+$/, 'Formato debe ser LxWxH (ej: 30x20x15)')
    .optional(),
  special_instructions: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  estimated_delivery_date: z.string().optional(),
  items: z.array(ShipmentItemSchema).min(1, 'Debe incluir al menos un item'),
})

type ShipmentFormData = z.infer<typeof ShipmentFormSchema>

// =====================================================
// INTERFACES
// =====================================================

interface ShipmentFormProps {
  shipment?: Shipment
  orderId?: number
  onSuccess?: (shipment: Shipment) => void
  onCancel?: () => void
  className?: string
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ShipmentForm({
  shipment,
  orderId,
  onSuccess,
  onCancel,
  className,
}: ShipmentFormProps) {
  const [showQuotes, setShowQuotes] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<any>(null)

  // Hooks
  const { data: couriers, isLoading: couriersLoading } = useCouriers({ activeOnly: true })
  const createShipment = useCreateShipment()
  const updateShipment = useUpdateShipment()
  const { getQuote, isLoading: quoteLoading } = useShippingQuote()

  // Form setup
  const form = useForm<ShipmentFormData>({
    resolver: zodResolver(ShipmentFormSchema),
    defaultValues: {
      order_id: orderId || shipment?.order_id || 0,
      shipping_service: ShippingService.STANDARD,
      delivery_address: {
        country: 'Argentina',
      },
      items: [{ product_id: 0, quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  // Cargar datos del shipment si está editando
  useEffect(() => {
    if (shipment) {
      form.reset({
        order_id: shipment.order_id,
        carrier_id: shipment.carrier_id || undefined,
        shipping_service: shipment.shipping_service,
        delivery_address: shipment.delivery_address,
        pickup_address: shipment.pickup_address || undefined,
        weight_kg: shipment.weight_kg || undefined,
        dimensions_cm: shipment.dimensions_cm || undefined,
        special_instructions: shipment.special_instructions || undefined,
        notes: shipment.notes || undefined,
        estimated_delivery_date: shipment.estimated_delivery_date || undefined,
        items: shipment.items?.map(item => ({
          product_id: item.product_id || 0,
          quantity: item.quantity,
          weight_kg: item.weight_kg || undefined,
        })) || [{ product_id: 0, quantity: 1 }],
      })
    }
  }, [shipment, form])

  // Handlers
  const onSubmit = async (data: ShipmentFormData) => {
    try {
      if (shipment) {
        // Actualizar envío existente
        const updatedShipment = await updateShipment.mutateAsync({
          id: shipment.id,
          data: {
            carrier_id: data.carrier_id,
            shipping_service: data.shipping_service,
            delivery_address: data.delivery_address,
            pickup_address: data.pickup_address,
            weight_kg: data.weight_kg,
            dimensions_cm: data.dimensions_cm,
            special_instructions: data.special_instructions,
            notes: data.notes,
            estimated_delivery_date: data.estimated_delivery_date,
          },
        })
        onSuccess?.(updatedShipment)
      } else {
        // Crear nuevo envío
        const newShipment = await createShipment.mutateAsync(data)
        onSuccess?.(newShipment)
      }
    } catch (error) {
      console.error('Error saving shipment:', error)
    }
  }

  const handleGetQuotes = async () => {
    const formData = form.getValues()

    if (!formData.delivery_address.city || !formData.weight_kg) {
      form.setError('delivery_address.city', { message: 'Ciudad es requerida para cotizar' })
      form.setError('weight_kg', { message: 'Peso es requerido para cotizar' })
      return
    }

    try {
      const quotes = await getQuote({
        origin_address: {
          city: 'Buenos Aires',
          state: 'Buenos Aires',
          postal_code: '1000',
        },
        destination_address: {
          city: formData.delivery_address.city,
          state: formData.delivery_address.state,
          postal_code: formData.delivery_address.postal_code,
        },
        weight_kg: formData.weight_kg,
        dimensions_cm: formData.dimensions_cm || '30x20x15',
        service_type: formData.shipping_service,
      })

      setShowQuotes(true)
    } catch (error) {
      console.error('Error getting quotes:', error)
    }
  }

  const isLoading = createShipment.isPending || updateShipment.isPending

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Package className='w-5 h-5' />
          {shipment ? 'Editar Envío' : 'Crear Nuevo Envío'}
        </CardTitle>
        <CardDescription>
          {shipment
            ? `Modificar envío ${shipment.shipment_number}`
            : 'Complete la información para crear un nuevo envío'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Información básica */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='order_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID de Orden</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                        disabled={!!shipment}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='shipping_service'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Servicio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Seleccionar servicio' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ShippingService.STANDARD}>Estándar</SelectItem>
                        <SelectItem value={ShippingService.EXPRESS}>Express</SelectItem>
                        <SelectItem value={ShippingService.NEXT_DAY}>Día Siguiente</SelectItem>
                        <SelectItem value={ShippingService.SAME_DAY}>Mismo Día</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Courier */}
            <FormField
              control={form.control}
              name='carrier_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Courier</FormLabel>
                  <Select
                    onValueChange={value => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Seleccionar courier' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {couriers?.map(courier => (
                        <SelectItem key={courier.id} value={courier.id.toString()}>
                          <div className='flex items-center gap-2'>
                            {courier.logo_url && (
                              <img src={courier.logo_url} alt={courier.name} className='w-4 h-4' />
                            )}
                            {courier.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Dirección de entrega */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <MapPin className='w-5 h-5' />
                Dirección de Entrega
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='delivery_address.street'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calle</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='delivery_address.number'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='delivery_address.apartment'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='delivery_address.neighborhood'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barrio</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='delivery_address.city'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='delivery_address.state'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='delivery_address.postal_code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Postal</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='delivery_address.reference'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencias (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormDescription>
                      Información adicional para facilitar la entrega
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Detalles del paquete */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Detalles del Paquete
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='weight_kg'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.1'
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='dimensions_cm'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensiones (cm)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='30x20x15' />
                      </FormControl>
                      <FormDescription>Formato: Largo x Ancho x Alto</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Botón de cotización */}
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleGetQuotes}
                  disabled={quoteLoading}
                  className='flex items-center gap-2'
                >
                  {quoteLoading ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <Calculator className='w-4 h-4' />
                  )}
                  Cotizar Envío
                </Button>

                {selectedQuote && (
                  <Badge variant='secondary' className='flex items-center gap-1'>
                    <CheckCircle className='w-3 h-3' />
                    Cotización: {formatCurrency(selectedQuote.cost)}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Items del envío */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>Items del Envío</h3>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => append({ product_id: 0, quantity: 1 })}
                >
                  <Plus className='w-4 h-4 mr-2' />
                  Agregar Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className='flex items-end gap-4 p-4 border rounded-lg'>
                  <FormField
                    control={form.control}
                    name={`items.${index}.product_id`}
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>ID Producto</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className='w-24'>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.weight_kg`}
                    render={({ field }) => (
                      <FormItem className='w-24'>
                        <FormLabel>Peso (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.1'
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {fields.length > 1 && (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => remove(index)}
                      className='text-red-600 hover:text-red-700'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* Notas e instrucciones */}
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='special_instructions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrucciones Especiales</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormDescription>Instrucciones específicas para el courier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Internas</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormDescription>
                      Notas para uso interno (no visibles para el cliente)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botones de acción */}
            <div className='flex items-center justify-end gap-4 pt-6'>
              {onCancel && (
                <Button type='button' variant='outline' onClick={onCancel}>
                  Cancelar
                </Button>
              )}

              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                {shipment ? 'Actualizar Envío' : 'Crear Envío'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
