'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Mail, User, Phone, Loader2 } from '@/lib/optimized-imports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useUserProfile, UpdateProfileData } from '@/hooks/useUserProfile'
import { toast } from 'sonner'

// Schema de validación
const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  email: z.string().email('Ingresa un email válido').min(1, 'El email es requerido'),
  phone: z
    .string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') {
        return true
      }
      // Validar formato de teléfono argentino
      const phoneRegex = /^(\+54|54)?[\s-]?(\d{2,4})[\s-]?\d{6,8}$/
      return phoneRegex.test(val)
    }, 'Ingresa un número de teléfono válido (formato argentino)'),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileEditorProps {
  onSave?: () => void
  className?: string
}

export function ProfileEditor({ onSave, className }: ProfileEditorProps) {
  const { profile, loading, updateProfile } = useUserProfile()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  })

  // Actualizar formulario cuando se carga el perfil
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      })
    }
  }, [profile, form])

  // Manejar envío del formulario
  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true)

      const updateData: UpdateProfileData = {
        name: data.name,
        email: data.email,
        phone: data.phone?.trim() || undefined,
      }

      const success = await updateProfile(updateData)

      if (success) {
        toast.success('Perfil actualizado correctamente')
        onSave?.()
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error)
      toast.error('Error al actualizar el perfil')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Verificar si hay cambios en el formulario
  const hasChanges = form.formState.isDirty

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className='flex items-center justify-center h-64'>
          <div className='flex items-center space-x-2'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <span>Cargando perfil...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <User className='h-5 w-5' />
          <span>Información Personal</span>
        </CardTitle>
        <CardDescription>
          Actualiza tu información personal. Los cambios se guardarán automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Nombre */}
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center space-x-2'>
                    <User className='h-4 w-4' />
                    <span>Nombre completo</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Ingresa tu nombre completo'
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Tu nombre completo como aparecerá en tu perfil.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center space-x-2'>
                    <Mail className='h-4 w-4' />
                    <span>Correo electrónico</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='tu@email.com'
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Tu dirección de correo electrónico principal.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Teléfono */}
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center space-x-2'>
                    <Phone className='h-4 w-4' />
                    <span>Teléfono (opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='tel'
                      placeholder='+54 11 1234-5678'
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Tu número de teléfono para contacto (formato argentino).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones de acción */}
            <div className='flex justify-end space-x-3 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => form.reset()}
                disabled={isSubmitting || !hasChanges}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting || !hasChanges || !form.formState.isValid}
                className='flex items-center space-x-2'
              >
                {isSubmitting ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Save className='h-4 w-4' />
                )}
                <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
              </Button>
            </div>

            {/* Información adicional */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6'>
              <h4 className='font-medium text-blue-900 mb-2'>Información importante</h4>
              <ul className='text-sm text-blue-800 space-y-1'>
                <li>• Los cambios en tu email pueden requerir verificación</li>
                <li>• Tu información personal está protegida y encriptada</li>
                <li>• Solo tú puedes ver y editar esta información</li>
              </ul>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
