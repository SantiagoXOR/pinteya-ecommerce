'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Address } from './AddressManager';

// Schema de validación para direcciones
const addressSchema = z.object({
  title: z
    .string()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(50, 'El título no puede exceder 50 caracteres'),
  street: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(100, 'La dirección no puede exceder 100 caracteres'),
  city: z
    .string()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(50, 'La ciudad no puede exceder 50 caracteres'),
  state: z
    .string()
    .min(2, 'La provincia debe tener al menos 2 caracteres')
    .max(50, 'La provincia no puede exceder 50 caracteres'),
  postal_code: z
    .string()
    .min(4, 'El código postal debe tener al menos 4 caracteres')
    .max(10, 'El código postal no puede exceder 10 caracteres')
    .regex(/^[0-9A-Za-z\s-]+$/, 'Código postal inválido'),
  country: z
    .string()
    .min(2, 'El país debe tener al menos 2 caracteres')
    .max(50, 'El país no puede exceder 50 caracteres'),
  is_default: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  initialData?: Address | null;
  onSubmit: (data: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

export function AddressForm({ initialData, onSubmit, onCancel }: AddressFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Argentina',
      is_default: false,
    },
  });

  // Cargar datos iniciales si se está editando
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        street: initialData.street,
        city: initialData.city,
        state: initialData.state,
        postal_code: initialData.postal_code,
        country: initialData.country,
        is_default: initialData.is_default,
      });
    }
  }, [initialData, form]);

  // Manejar envío del formulario
  const handleSubmit = async (data: AddressFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Error al guardar dirección:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Título */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título de la dirección</FormLabel>
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

        {/* Dirección */}
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder="Calle, número, piso, departamento"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ciudad y Provincia */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Buenos Aires"
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
                <FormControl>
                  <Input
                    placeholder="CABA"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Código Postal y País */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Postal</FormLabel>
                <FormControl>
                  <Input
                    placeholder="1234"
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
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Argentina"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dirección principal */}
        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Dirección principal
                </FormLabel>
                <FormDescription>
                  Usar esta dirección como predeterminada para envíos.
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

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Cancelar</span>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
            className="flex items-center space-x-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>
              {isSubmitting ? 'Guardando...' : 'Guardar Dirección'}
            </span>
          </Button>
        </div>
      </form>
    </Form>
  );
}









