import { useState, useEffect, useCallback } from 'react'

// Tipos de datos para las configuraciones del sistema
export interface SystemSettings {
  general: {
    site_name: string
    site_description: string
    site_url: string
    contact_email: string
    support_phone: string
    timezone: string
    currency: string
    language: string
    maintenance_mode: boolean
  }
  ecommerce: {
    tax_rate: number
    shipping_cost: number
    free_shipping_threshold: number
    inventory_tracking: boolean
    low_stock_threshold: number
    allow_backorders: boolean
    auto_approve_reviews: boolean
    max_cart_items: number
    session_timeout: number
  }
  payments: {
    stripe_enabled: boolean
    paypal_enabled: boolean
    mercadopago_enabled: boolean
    cash_on_delivery: boolean
    bank_transfer: boolean
    payment_timeout: number
  }
  notifications: {
    email_notifications: boolean
    sms_notifications: boolean
    push_notifications: boolean
    order_confirmation: boolean
    shipping_updates: boolean
    marketing_emails: boolean
    low_stock_alerts: boolean
    new_order_alerts: boolean
  }
  security: {
    two_factor_auth: boolean
    password_min_length: number
    session_duration: number
    max_login_attempts: number
    lockout_duration: number
    require_email_verification: boolean
    admin_ip_whitelist: string[]
  }
  integrations: {
    google_analytics_id: string
    facebook_pixel_id: string
    google_tag_manager_id: string
    mailchimp_api_key: string
    sendgrid_api_key: string
    cloudinary_cloud_name: string
    aws_s3_bucket: string
  }
}

interface ApiResponse<T> {
  data: T | null
  success: boolean
  error?: string
  message?: string
}

interface UseSettingsReturn {
  settings: SystemSettings | null
  loading: boolean
  error: string | null
  saving: boolean
  saveError: string | null
  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<SystemSettings>) => Promise<boolean>
  resetToDefaults: () => Promise<boolean>
  hasChanges: boolean
  resetChanges: () => void
}

// Cache para evitar múltiples requests simultáneos
let settingsCache: SystemSettings | null = null
let settingsCacheTime: number = 0
const CACHE_DURATION = 30000 // 30 segundos

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<SystemSettings | null>(settingsCache)
  const [loading, setLoading] = useState(!settingsCache)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [originalSettings, setOriginalSettings] = useState<SystemSettings | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar cache
      const now = Date.now()
      if (settingsCache && now - settingsCacheTime < CACHE_DURATION) {
        setSettings(settingsCache)
        setOriginalSettings(JSON.parse(JSON.stringify(settingsCache)))
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result: ApiResponse<SystemSettings> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Error al obtener configuraciones')
      }

      // Actualizar cache
      settingsCache = result.data
      settingsCacheTime = now
      setSettings(result.data)
      setOriginalSettings(JSON.parse(JSON.stringify(result.data)))
    } catch (err) {
      console.error('Error fetching settings:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback(
    async (updates: Partial<SystemSettings>): Promise<boolean> => {
      try {
        setSaving(true)
        setSaveError(null)

        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
        }

        const result: ApiResponse<SystemSettings> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Error al actualizar configuraciones')
        }

        // Actualizar cache
        settingsCache = result.data
        settingsCacheTime = Date.now()
        setSettings(result.data)
        setOriginalSettings(JSON.parse(JSON.stringify(result.data)))

        return true
      } catch (err) {
        console.error('Error updating settings:', err)
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        setSaveError(errorMessage)
        return false
      } finally {
        setSaving(false)
      }
    },
    []
  )

  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    if (!confirm('¿Estás seguro de que quieres restablecer todas las configuraciones a los valores por defecto? Esta acción no se puede deshacer.')) {
      return false
    }

    try {
      setSaving(true)
      setSaveError(null)

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const result: ApiResponse<SystemSettings> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Error al restablecer configuraciones')
      }

      // Actualizar cache
      settingsCache = result.data
      settingsCacheTime = Date.now()
      setSettings(result.data)
      setOriginalSettings(JSON.parse(JSON.stringify(result.data)))

      return true
    } catch (err) {
      console.error('Error resetting settings:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setSaveError(errorMessage)
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  const resetChanges = useCallback(() => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)))
      setSaveError(null)
    }
  }, [originalSettings])

  // Calcular si hay cambios
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  // Cargar configuraciones al montar
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    saving,
    saveError,
    fetchSettings,
    updateSettings,
    resetToDefaults,
    hasChanges,
    resetChanges,
  }
}
