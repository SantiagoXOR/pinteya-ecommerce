'use client'

import { AdminCard } from '../ui/AdminCard'
import { Input } from '../ui/Input'
import { SystemSettings } from '@/hooks/admin/useSettings'
import { Shield, Lock, Clock, AlertTriangle } from '@/lib/optimized-imports'

interface SecuritySettingsProps {
  settings: SystemSettings
  onChange: (updates: Partial<SystemSettings>) => void
}

export function SecuritySettings({ settings, onChange }: SecuritySettingsProps) {
  const handleChange = <K extends keyof SystemSettings['security']>(
    key: K,
    value: SystemSettings['security'][K]
  ) => {
    onChange({
      security: {
        ...settings.security,
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
      <AdminCard title='Autenticación' description='Configuración de seguridad de acceso'>
        <div className='space-y-6'>
          <ToggleSwitch
            label='Autenticación de Dos Factores (2FA)'
            description='Requerir código adicional además de la contraseña'
            checked={settings.security.two_factor_auth}
            onChange={(checked) => handleChange('two_factor_auth', checked)}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Input
              label='Longitud Mínima de Contraseña'
              type='number'
              value={settings.security.password_min_length.toString()}
              onChange={(e) => handleChange('password_min_length', parseInt(e.target.value) || 8)}
              icon={Lock}
              min={6}
              max={50}
            />

            <Input
              label='Duración de Sesión (horas)'
              type='number'
              value={settings.security.session_duration.toString()}
              onChange={(e) => handleChange('session_duration', parseInt(e.target.value) || 24)}
              icon={Clock}
              min={1}
              max={168}
              helperText='Tiempo antes de requerir nuevo login'
            />
          </div>
        </div>
      </AdminCard>

      <AdminCard title='Protección contra Intrusiones' description='Configuración de bloqueo de cuentas'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Input
            label='Máximo Intentos de Login'
            type='number'
            value={settings.security.max_login_attempts.toString()}
            onChange={(e) => handleChange('max_login_attempts', parseInt(e.target.value) || 5)}
            icon={AlertTriangle}
            min={3}
            max={10}
            helperText='Intentos fallidos antes de bloquear'
          />

          <Input
            label='Duración de Bloqueo (minutos)'
            type='number'
            value={settings.security.lockout_duration.toString()}
            onChange={(e) => handleChange('lockout_duration', parseInt(e.target.value) || 15)}
            icon={Clock}
            min={5}
            max={1440}
            helperText='Tiempo de bloqueo después de intentos fallidos'
          />
        </div>
      </AdminCard>

      <AdminCard title='Verificación y Acceso' description='Opciones adicionales de seguridad'>
        <div className='space-y-4'>
          <ToggleSwitch
            label='Requerir Verificación de Email'
            description='Los usuarios deben verificar su email al registrarse'
            checked={settings.security.require_email_verification}
            onChange={(checked) => handleChange('require_email_verification', checked)}
          />

          <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-start space-x-3'>
              <Shield className='w-5 h-5 text-blue-600 mt-0.5' />
              <div className='flex-1'>
                <p className='font-medium text-blue-900'>Whitelist de IPs Admin</p>
                <p className='text-sm text-blue-700 mt-1'>
                  Actualmente no hay IPs en la whitelist. Esta funcionalidad permite restringir el acceso administrativo a IPs específicas.
                </p>
                {settings.security.admin_ip_whitelist.length > 0 && (
                  <div className='mt-2'>
                    <p className='text-sm font-medium text-blue-900'>IPs Permitidas:</p>
                    <ul className='list-disc list-inside text-sm text-blue-700 mt-1'>
                      {settings.security.admin_ip_whitelist.map((ip, index) => (
                        <li key={index}>{ip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminCard>
    </div>
  )
}
