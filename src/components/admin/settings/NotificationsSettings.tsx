'use client'

import { AdminCard } from '../ui/AdminCard'
import { SystemSettings } from '@/hooks/admin/useSettings'
import { Bell } from '@/lib/optimized-imports'

interface NotificationsSettingsProps {
  settings: SystemSettings
  onChange: (updates: Partial<SystemSettings>) => void
}

export function NotificationsSettings({ settings, onChange }: NotificationsSettingsProps) {
  const handleChange = <K extends keyof SystemSettings['notifications']>(
    key: K,
    value: SystemSettings['notifications'][K]
  ) => {
    onChange({
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    })
  }

  const ToggleSwitch = ({ 
    label, 
    description, 
    checked, 
    onChange 
  }: { 
    label: string
    description?: string
    checked: boolean
    onChange: (checked: boolean) => void
  }) => (
    <div className='flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg'>
      <div>
        <p className='font-medium text-gray-900'>{label}</p>
        {description && <p className='text-sm text-gray-600'>{description}</p>}
      </div>
      <label className='relative inline-flex items-center cursor-pointer'>
        <input
          type='checkbox'
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className='sr-only peer'
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  )

  return (
    <div className='space-y-6'>
      <AdminCard title='Canales de Notificación' description='Habilitar tipos de notificaciones'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <ToggleSwitch
            label='Notificaciones por Email'
            description='Enviar notificaciones vía correo electrónico'
            checked={settings.notifications.email_notifications}
            onChange={(checked) => handleChange('email_notifications', checked)}
          />

          <ToggleSwitch
            label='Notificaciones SMS'
            description='Enviar notificaciones por mensaje de texto'
            checked={settings.notifications.sms_notifications}
            onChange={(checked) => handleChange('sms_notifications', checked)}
          />

          <ToggleSwitch
            label='Notificaciones Push'
            description='Notificaciones push en el navegador'
            checked={settings.notifications.push_notifications}
            onChange={(checked) => handleChange('push_notifications', checked)}
          />
        </div>
      </AdminCard>

      <AdminCard title='Notificaciones de Órdenes' description='Configurar qué notificaciones enviar sobre órdenes'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <ToggleSwitch
            label='Confirmación de Orden'
            description='Enviar cuando se crea una nueva orden'
            checked={settings.notifications.order_confirmation}
            onChange={(checked) => handleChange('order_confirmation', checked)}
          />

          <ToggleSwitch
            label='Actualizaciones de Envío'
            description='Notificar cambios en el estado de envío'
            checked={settings.notifications.shipping_updates}
            onChange={(checked) => handleChange('shipping_updates', checked)}
          />
        </div>
      </AdminCard>

      <AdminCard title='Alertas del Sistema' description='Notificaciones automáticas del sistema'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <ToggleSwitch
            label='Alertas de Stock Bajo'
            description='Notificar cuando productos tienen stock bajo'
            checked={settings.notifications.low_stock_alerts}
            onChange={(checked) => handleChange('low_stock_alerts', checked)}
          />

          <ToggleSwitch
            label='Alertas de Nuevas Órdenes'
            description='Notificar a administradores sobre nuevas órdenes'
            checked={settings.notifications.new_order_alerts}
            onChange={(checked) => handleChange('new_order_alerts', checked)}
          />
        </div>
      </AdminCard>

      <AdminCard title='Marketing' description='Configuración de emails de marketing'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <ToggleSwitch
            label='Emails de Marketing'
            description='Enviar emails promocionales y de marketing'
            checked={settings.notifications.marketing_emails}
            onChange={(checked) => handleChange('marketing_emails', checked)}
          />
        </div>
      </AdminCard>
    </div>
  )
}
