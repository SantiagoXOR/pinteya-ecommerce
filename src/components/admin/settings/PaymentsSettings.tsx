'use client'

import { AdminCard } from '../ui/AdminCard'
import { Input } from '../ui/Input'
import { SystemSettings } from '@/hooks/admin/useSettings'
import { CreditCard, Clock } from '@/lib/optimized-imports'

interface PaymentsSettingsProps {
  settings: SystemSettings
  onChange: (updates: Partial<SystemSettings>) => void
}

export function PaymentsSettings({ settings, onChange }: PaymentsSettingsProps) {
  const handleChange = <K extends keyof SystemSettings['payments']>(
    key: K,
    value: SystemSettings['payments'][K]
  ) => {
    onChange({
      payments: {
        ...settings.payments,
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
      <AdminCard title='Métodos de Pago' description='Habilitar o deshabilitar métodos de pago disponibles'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <ToggleSwitch
            label='MercadoPago'
            description='Método de pago principal - Tarjetas de crédito, débito y más'
            checked={settings.payments.mercadopago_enabled}
            onChange={(checked) => handleChange('mercadopago_enabled', checked)}
          />

          <ToggleSwitch
            label='Efectivo'
            description='Pago en efectivo al recibir'
            checked={settings.payments.cash_on_delivery}
            onChange={(checked) => handleChange('cash_on_delivery', checked)}
          />
        </div>
      </AdminCard>

      <AdminCard title='Configuración de Pagos' description='Opciones adicionales de procesamiento'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Input
            label='Timeout de Pago (minutos)'
            type='number'
            value={settings.payments.payment_timeout.toString()}
            onChange={(e) => handleChange('payment_timeout', parseInt(e.target.value) || 15)}
            icon={Clock}
            min={5}
            max={60}
            helperText='Tiempo máximo para completar un pago'
          />
        </div>
      </AdminCard>
    </div>
  )
}
