'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone, Building, Save, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

// Schema de validación mejorado
const addressSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  street: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(255, 'La dirección no puede exceder 255 caracteres'),
  apartment: z
    .string()
    .max(50, 'El número de departamento no puede exceder 50 caracteres')
    .optional(),
  city: z
    .string()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(100, 'La ciudad no puede exceder 100 caracteres'),
  state: z
    .string()
    .min(2, 'La provincia debe tener al menos 2 caracteres')
    .max(100, 'La provincia no puede exceder 100 caracteres'),
  postal_code: z
    .string()
    .min(4, 'El código postal debe tener al menos 4 caracteres')
    .max(20, 'El código postal no puede exceder 20 caracteres')
    .regex(/^[0-9A-Za-z\s-]+$/, 'Código postal inválido'),
  country: z
    .string()
    .min(2, 'El país debe tener al menos 2 caracteres')
    .max(50, 'El país no puede exceder 50 caracteres'),
  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Formato de teléfono inválido')
    .optional(),
  type: z.enum(['shipping', 'billing', 'both']).default('shipping'),
  is_default: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

export interface AdvancedAddress {
  id?: string;
  user_id?: string;
  name: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  type: 'shipping' | 'billing' | 'both';
  is_default: boolean;
  latitude?: number;
  longitude?: number;
  validation_status?: 'pending' | 'validated' | 'invalid';
  created_at?: string;
  updated_at?: string;
}

interface AddressFormAdvancedProps {
  initialData?: AdvancedAddress | null;
  onSubmit: (data: Omit<AdvancedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

// Provincias argentinas
const ARGENTINA_PROVINCES = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza',
  'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
  'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego',
  'Tucumán', 'Ciudad Autónoma de Buenos Aires'
];

export function AddressFormAdvanced({
  initialData,
  onSubmit,
  onCancel,
  mode = 'create'
}: AddressFormAdvancedProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'pending' | 'validated' | 'invalid'>(
    initialData?.validation_status as 'pending' | 'validated' | 'invalid' || 'pending'
  );
  const [validationData, setValidationData] = useState<{
    latitude?: number;
    longitude?: number;
    formatted_address?: string;
    place_id?: string;
  }>({
    latitude: initialData?.latitude || undefined,
    longitude: initialData?.longitude || undefined,
  });

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      street: '',
      apartment: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Argentina',
      phone: '',
      type: 'shipping',
      is_default: false,
    },
  });

  // Cargar datos iniciales si se está editando
  useEffect(() => {
    if (initialData) {
      const resetData = {
        name: initialData.name || '',
        street: initialData.street || '',
        apartment: initialData.apartment || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postal_code: initialData.postal_code || '',
        country: initialData.country || 'Argentina',
        phone: initialData.phone || '',
        type: initialData.type || 'shipping',
        is_default: initialData.is_default || false,
      };

      console.log('Resetting form with data:', resetData); // Debug
      form.reset(resetData);
      setValidationStatus(initialData.validation_status || 'pending');
    }
  }, [initialData, form]);

  // Validar dirección con servicio externo
  const validateAddress = async () => {
    const formData = form.getValues();

    console.log('Validating address with data:', formData); // Debug

    // Verificar que los campos requeridos estén completos
    if (!formData.street || !formData.city || !formData.state || !formData.postal_code) {
      console.log('Missing required fields:', {
        street: !formData.street,
        city: !formData.city,
        state: !formData.state,
        postal_code: !formData.postal_code
      }); // Debug

      toast({
        title: 'Campos incompletos',
        description: 'Por favor completa todos los campos requeridos antes de validar.',
        variant: 'destructive',
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/user/addresses/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country || 'Argentina',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const validation = result.data;
        console.log('Validation result:', validation); // Debug

        if (validation.isValid && validation.confidence > 0.6) {
          setValidationStatus('validated');

          // Guardar datos de validación (coordenadas, etc.)
          setValidationData({
            latitude: validation.coordinates?.latitude,
            longitude: validation.coordinates?.longitude,
            formatted_address: validation.formatted_address,
            place_id: validation.place_id,
          });

          toast({
            title: 'Dirección validada',
            description: `Dirección verificada con ${Math.round(validation.confidence * 100)}% de confianza.`,
            variant: 'default',
          });
        } else {
          setValidationStatus('invalid');
          toast({
            title: 'Dirección no válida',
            description: validation.suggestions?.join(', ') || 'La dirección no pudo ser verificada.',
            variant: 'destructive',
          });
        }
      } else {
        console.error('Validation error:', result); // Debug
        setValidationStatus('invalid');
        toast({
          title: 'Error de validación',
          description: result.error || 'No se pudo validar la dirección.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error validating address:', error);
      setValidationStatus('invalid');
      toast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con el servicio de validación.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (data: AddressFormData) => {
    try {
      setIsSubmitting(true);

      // Validar que todos los campos requeridos estén completos
      const errors = [];
      if (!data.name) errors.push('Nombre');
      if (!data.street) errors.push('Dirección');
      if (!data.city) errors.push('Ciudad');
      if (!data.state) errors.push('Provincia');
      if (!data.postal_code) errors.push('Código postal');

      if (errors.length > 0) {
        toast({
          title: 'Campos requeridos',
          description: `Por favor completa: ${errors.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      await onSubmit({
        ...data,
        validation_status: validationStatus,
        latitude: validationData.latitude,
        longitude: validationData.longitude,
      });

      toast({
        title: 'Dirección guardada',
        description: 'La dirección se ha guardado correctamente.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error al guardar dirección:', error);
      toast({
        title: 'Error al guardar',
        description: 'No se pudo guardar la dirección. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getValidationBadge = () => {
    switch (validationStatus) {
      case 'validated':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Validada
          </Badge>
        );
      case 'invalid':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Inválida
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <MapPin className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="w-5 h-5" />
          <span>{mode === 'edit' ? 'Editar Dirección' : 'Nueva Dirección'}</span>
          {getValidationBadge()}
        </CardTitle>
        <CardDescription>
          {mode === 'edit'
            ? 'Modifica los datos de tu dirección'
            : 'Agrega una nueva dirección para tus envíos'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Nombre de la dirección */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la dirección</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Casa, Trabajo, Oficina"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Un nombre descriptivo para identificar esta dirección.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de dirección */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de dirección</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-select-in-modal" position="popper" sideOffset={4}>
                      <SelectItem value="shipping">Solo envíos</SelectItem>
                      <SelectItem value="billing">Solo facturación</SelectItem>
                      <SelectItem value="both">Envíos y facturación</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Dirección principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Av. Córdoba 1234"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="apartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depto/Piso (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 4B, PB"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ciudad, Provincia, CP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Córdoba"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona provincia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-select-in-modal" position="popper" sideOffset={4}>
                        {ARGENTINA_PROVINCES.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Postal</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 5000"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Teléfono */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Teléfono de contacto (opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: +54 351 123 4567"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Para coordinar la entrega con el transportista.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Opciones adicionales */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Dirección predeterminada
                      </FormLabel>
                      <FormDescription>
                        Usar esta dirección por defecto en nuevas compras.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Validación de dirección */}
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-base">Validar dirección</Label>
                    {getValidationBadge()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Verificar que la dirección existe y es correcta.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateAddress}
                  disabled={isValidating || isSubmitting}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Validar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isValidating}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'edit' ? 'Actualizar' : 'Guardar'} Dirección
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}









