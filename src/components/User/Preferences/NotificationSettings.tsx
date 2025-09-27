'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Bell, Mail, Smartphone, AlertCircle } from 'lucide-react'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { toast } from 'sonner'

export function NotificationSettings() {
  const { preferences, isLoading, updateSection } = useUserPreferences()

  const notificationPrefs = preferences?.notifications || {
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    securityAlerts: true,
    marketingEmails: false,
    pushNotifications: true,
    smsNotifications: false,
  }

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await updateSection('notifications', {
        ...notificationPrefs,
        [key]: value,
      })
      toast.success('Preferencia actualizada correctamente')
    } catch (error) {
      toast.error('Error al actualizar preferencia')
    }
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-2'></div>
          <div className='h-3 bg-gray-200 rounded w-1/2'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>Configuración de Notificaciones</h3>
        <p className='text-sm text-gray-600'>
          Controla qué notificaciones quieres recibir y cómo prefieres recibirlas.
        </p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Mail className='h-5 w-5 mr-2' />
            Notificaciones por Email
          </CardTitle>
          <CardDescription>
            Configura las notificaciones que quieres recibir por correo electrónico.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='email-notifications'>Notificaciones generales</Label>
              <p className='text-sm text-gray-600'>Recibir notificaciones importantes por email</p>
            </div>
            <Switch
              id='email-notifications'
              checked={notificationPrefs.emailNotifications}
              onCheckedChange={checked => handleToggle('emailNotifications', checked)}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='order-updates'>Actualizaciones de órdenes</Label>
              <p className='text-sm text-gray-600'>Notificaciones sobre el estado de tus órdenes</p>
            </div>
            <Switch
              id='order-updates'
              checked={notificationPrefs.orderUpdates}
              onCheckedChange={checked => handleToggle('orderUpdates', checked)}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='security-alerts'>Alertas de seguridad</Label>
              <p className='text-sm text-gray-600'>
                Notificaciones sobre actividad sospechosa en tu cuenta
              </p>
            </div>
            <Switch
              id='security-alerts'
              checked={notificationPrefs.securityAlerts}
              onCheckedChange={checked => handleToggle('securityAlerts', checked)}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='marketing-emails'>Emails de marketing</Label>
              <p className='text-sm text-gray-600'>Ofertas especiales, descuentos y novedades</p>
            </div>
            <Switch
              id='marketing-emails'
              checked={notificationPrefs.marketingEmails}
              onCheckedChange={checked => handleToggle('marketingEmails', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Bell className='h-5 w-5 mr-2' />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Notificaciones instantáneas en tu navegador o dispositivo móvil.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='push-notifications'>Notificaciones push</Label>
              <p className='text-sm text-gray-600'>
                Recibir notificaciones instantáneas en el navegador
              </p>
            </div>
            <Switch
              id='push-notifications'
              checked={notificationPrefs.pushNotifications}
              onCheckedChange={checked => handleToggle('pushNotifications', checked)}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='promotions'>Promociones y ofertas</Label>
              <p className='text-sm text-gray-600'>
                Notificaciones sobre descuentos y ofertas especiales
              </p>
            </div>
            <Switch
              id='promotions'
              checked={notificationPrefs.promotions}
              onCheckedChange={checked => handleToggle('promotions', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Smartphone className='h-5 w-5 mr-2' />
            Notificaciones SMS
          </CardTitle>
          <CardDescription>Notificaciones por mensaje de texto (próximamente).</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='sms-notifications'>Notificaciones SMS</Label>
              <p className='text-sm text-gray-600'>Recibir notificaciones importantes por SMS</p>
            </div>
            <Switch
              id='sms-notifications'
              checked={notificationPrefs.smsNotifications}
              onCheckedChange={checked => handleToggle('smsNotifications', checked)}
              disabled
            />
          </div>
          <div className='flex items-center p-3 bg-blue-50 rounded-lg'>
            <AlertCircle className='h-4 w-4 text-blue-600 mr-2' />
            <p className='text-sm text-blue-800'>
              Las notificaciones SMS estarán disponibles próximamente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className='flex justify-end space-x-3'>
        <Button variant='outline' onClick={() => window.location.reload()}>
          Cancelar
        </Button>
        <Button onClick={() => toast.success('Configuración guardada')}>Guardar cambios</Button>
      </div>
    </div>
  )
}
