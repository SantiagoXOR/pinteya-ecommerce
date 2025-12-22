'use client'

import { useState, useEffect } from 'react'
import { AdminCard } from '../ui/AdminCard'
import { useSettings, SystemSettings } from '@/hooks/admin/useSettings'
import { cn } from '@/lib/core/utils'
import { 
  Settings, 
  Store, 
  CreditCard, 
  Link, 
  Save, 
  RotateCcw, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users
} from '@/lib/optimized-imports'
import { GeneralSettings } from './GeneralSettings'
import { EcommerceSettings } from './EcommerceSettings'
import { PaymentsSettings } from './PaymentsSettings'
import { IntegrationsSettings } from './IntegrationsSettings'
import { UsersRolesSettings } from './UsersRolesSettings'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<{
    settings: SystemSettings
    onChange: (updates: Partial<SystemSettings>) => void
  }>
}

const tabs: Tab[] = [
  { id: 'general', label: 'General', icon: Settings, component: GeneralSettings },
  { id: 'ecommerce', label: 'E-commerce', icon: Store, component: EcommerceSettings },
  { id: 'payments', label: 'Pagos', icon: CreditCard, component: PaymentsSettings },
  { id: 'users', label: 'Usuarios y Roles', icon: Users, component: UsersRolesSettings },
  { id: 'integrations', label: 'Integraciones', icon: Link, component: IntegrationsSettings },
]

export function SettingsForm() {
  const { 
    settings, 
    loading, 
    error, 
    saving, 
    saveError,
    updateSettings, 
    resetToDefaults,
    hasChanges 
  } = useSettings()
  
  const [activeTab, setActiveTab] = useState('general')
  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(null)
  const [lastSaveSuccess, setLastSaveSuccess] = useState(false)

  // Sincronizar settings locales cuando cambian los settings del hook
  useEffect(() => {
    if (settings) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)))
    }
  }, [settings])

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-8 h-8 animate-spin text-gray-400' />
        <span className='ml-3 text-gray-600'>Cargando configuraciones...</span>
      </div>
    )
  }

  if (error || !settings || !localSettings) {
    return (
      <AdminCard className='border-red-200 bg-red-50'>
        <div className='flex items-center space-x-2 text-red-700'>
          <AlertCircle className='h-5 w-5' />
          <div>
            <p className='font-medium'>Error al cargar configuraciones</p>
            <p className='text-sm'>{error || 'No se pudieron cargar las configuraciones'}</p>
          </div>
        </div>
      </AdminCard>
    )
  }

  const handleChange = (updates: Partial<SystemSettings>) => {
    if (!localSettings) return
    
    setLocalSettings({
      ...localSettings,
      ...Object.keys(updates).reduce((acc, key) => {
        acc[key as keyof SystemSettings] = {
          ...localSettings[key as keyof SystemSettings],
          ...updates[key as keyof SystemSettings],
        } as any
        return acc
      }, {} as Partial<SystemSettings>),
    })
    setLastSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!localSettings) return

    // Calcular solo los cambios
    const updates: Partial<SystemSettings> = {}
    
    Object.keys(localSettings).forEach((categoryKey) => {
      const category = categoryKey as keyof SystemSettings
      const localCategory = localSettings[category]
      const originalCategory = settings[category]
      
      // Solo incluir si hay cambios
      if (JSON.stringify(localCategory) !== JSON.stringify(originalCategory)) {
        updates[category] = localCategory
      }
    })

    if (Object.keys(updates).length === 0) {
      return
    }

    // Confirmación para cambios críticos
    const criticalChanges = ['maintenance_mode']
    const hasCriticalChange = Object.keys(updates).some(category => 
      criticalChanges.some(critical => 
        JSON.stringify(localSettings[category as keyof SystemSettings]).includes(critical)
      )
    )

    if (hasCriticalChange) {
      if (!confirm('Estás a punto de realizar cambios críticos en la configuración. ¿Estás seguro?')) {
        return
      }
    }

    const success = await updateSettings(updates)
    
    if (success) {
      setLastSaveSuccess(true)
      setTimeout(() => setLastSaveSuccess(false), 3000)
    }
  }

  const handleReset = async () => {
    if (!confirm('¿Estás seguro de que quieres restablecer todas las configuraciones a los valores por defecto? Esta acción no se puede deshacer.')) {
      return
    }
    
    await resetToDefaults()
    if (settings) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)))
    }
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className='space-y-6'>
      {/* Header con acciones */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Configuración del Sistema</h2>
          <p className='text-gray-600 mt-1'>Gestiona las configuraciones de tu tienda</p>
        </div>
        <div className='flex items-center space-x-3'>
          <button
            onClick={handleReset}
            disabled={saving || loading}
            className='flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <RotateCcw className='w-4 h-4' />
            <span>Restablecer</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !hasChanges}
            className='flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {saving ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : lastSaveSuccess ? (
              <CheckCircle2 className='w-4 h-4' />
            ) : (
              <Save className='w-4 h-4' />
            )}
            <span>{saving ? 'Guardando...' : lastSaveSuccess ? 'Guardado' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* Mensajes de error/éxito */}
      {saveError && (
        <AdminCard className='border-red-200 bg-red-50'>
          <div className='flex items-center space-x-2 text-red-700'>
            <AlertCircle className='h-5 w-5' />
            <p className='text-sm'>{saveError}</p>
          </div>
        </AdminCard>
      )}

      {/* Tabs */}
      <div className='border-b border-gray-200'>
        <nav className='flex space-x-8 overflow-x-auto'>
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className='w-4 h-4' />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Contenido del tab activo */}
      {ActiveComponent && localSettings && (
        <div className='mt-6'>
          <ActiveComponent settings={localSettings} onChange={handleChange} />
        </div>
      )}
    </div>
  )
}
