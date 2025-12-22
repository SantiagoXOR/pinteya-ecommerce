'use client'

import { AdminCard } from '../ui/AdminCard'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { SystemSettings } from '@/hooks/admin/useSettings'
import { Globe, Mail, Phone, Clock, DollarSign, Languages, AlertTriangle } from '@/lib/optimized-imports'

interface GeneralSettingsProps {
  settings: SystemSettings
  onChange: (updates: Partial<SystemSettings>) => void
}

export function GeneralSettings({ settings, onChange }: GeneralSettingsProps) {
  const handleChange = <K extends keyof SystemSettings['general']>(
    key: K,
    value: SystemSettings['general'][K]
  ) => {
    onChange({
      general: {
        ...settings.general,
        [key]: value,
      },
    })
  }

  return (
    <div className='space-y-6'>
      <AdminCard title='Información General' description='Configuración básica del sitio'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='md:col-span-2'>
            <Input
              label='Nombre del Sitio'
              value={settings.general.site_name}
              onChange={(e) => handleChange('site_name', e.target.value)}
              icon={Globe}
              placeholder='Ej: Pinteya E-Commerce'
              required
            />
          </div>

          <div className='md:col-span-2'>
            <Textarea
              label='Descripción del Sitio'
              value={settings.general.site_description}
              onChange={(e) => handleChange('site_description', e.target.value)}
              rows={3}
              placeholder='Descripción breve de tu tienda'
            />
          </div>

          <Input
            label='URL del Sitio'
            type='url'
            value={settings.general.site_url}
            onChange={(e) => handleChange('site_url', e.target.value)}
            icon={Globe}
            placeholder='https://tutienda.com'
            required
          />

          <Input
            label='Email de Contacto'
            type='email'
            value={settings.general.contact_email}
            onChange={(e) => handleChange('contact_email', e.target.value)}
            icon={Mail}
            placeholder='contacto@tutienda.com'
            required
          />

          <Input
            label='Teléfono de Soporte'
            type='tel'
            value={settings.general.support_phone}
            onChange={(e) => handleChange('support_phone', e.target.value)}
            icon={Phone}
            placeholder='+54 11 1234-5678'
          />

          <Input
            label='Zona Horaria'
            value={settings.general.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            icon={Clock}
            placeholder='America/Argentina/Buenos_Aires'
            helperText='Formato: Continente/País/Ciudad'
          />

          <Input
            label='Moneda'
            value={settings.general.currency}
            onChange={(e) => handleChange('currency', e.target.value.toUpperCase())}
            icon={DollarSign}
            placeholder='ARS'
            helperText='Código ISO 4217 (ej: ARS, USD, EUR)'
            maxLength={3}
          />

          <Input
            label='Idioma'
            value={settings.general.language}
            onChange={(e) => handleChange('language', e.target.value.toLowerCase())}
            icon={Languages}
            placeholder='es'
            helperText='Código ISO 639-1 (ej: es, en, pt)'
            maxLength={2}
          />
        </div>
      </AdminCard>

      <AdminCard title='Estado del Sistema' description='Configuraciones de operación'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <AlertTriangle className='w-5 h-5 text-yellow-600' />
              <div>
                <p className='font-medium text-gray-900'>Modo de Mantenimiento</p>
                <p className='text-sm text-gray-600'>
                  Cuando está activado, solo los administradores pueden acceder al sitio
                </p>
              </div>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.general.maintenance_mode}
                onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                className='sr-only peer'
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </AdminCard>
    </div>
  )
}
