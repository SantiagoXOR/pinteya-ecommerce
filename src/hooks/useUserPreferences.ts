'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

// Tipos para las preferencias de usuario
export interface NotificationPreferences {
  emailNotifications: boolean
  orderUpdates: boolean
  promotions: boolean
  securityAlerts: boolean
  marketingEmails: boolean
  pushNotifications: boolean
  smsNotifications: boolean
}

export interface DisplayPreferences {
  language: string
  timezone: string
  currency: string
  theme: string
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private'
  activityTracking: boolean
  marketingConsent: boolean
  dataCollection: boolean
  thirdPartySharing: boolean
  analyticsOptOut: boolean
}

export interface UserPreferences {
  notifications: NotificationPreferences
  display: DisplayPreferences
  privacy: PrivacyPreferences
}

export interface UseUserPreferencesReturn {
  preferences: UserPreferences | null
  isLoading: boolean
  error: string | null
  getPreferences: () => Promise<void>
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<boolean>
  updateSection: (section: keyof UserPreferences, data: any) => Promise<boolean>
  resetToDefaults: () => Promise<boolean>
}

// Preferencias por defecto
const defaultPreferences: UserPreferences = {
  notifications: {
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    securityAlerts: true,
    marketingEmails: false,
    pushNotifications: true,
    smsNotifications: false,
  },
  display: {
    language: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    theme: 'system',
  },
  privacy: {
    profileVisibility: 'private',
    activityTracking: true,
    marketingConsent: false,
    dataCollection: true,
    thirdPartySharing: false,
    analyticsOptOut: false,
  },
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const { data: session } = useSession()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Obtener preferencias del usuario
  const getPreferences = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/user/preferences', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al obtener preferencias')
      }

      const data = await response.json()

      // Combinar con valores por defecto para asegurar que todas las propiedades existan
      const mergedPreferences = {
        notifications: { ...defaultPreferences.notifications, ...data.preferences?.notifications },
        display: { ...defaultPreferences.display, ...data.preferences?.display },
        privacy: { ...defaultPreferences.privacy, ...data.preferences?.privacy },
      }

      setPreferences(mergedPreferences)
    } catch (err) {
      console.error('Error al obtener preferencias:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      // Usar preferencias por defecto en caso de error
      setPreferences(defaultPreferences)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  // Actualizar preferencias completas
  const updatePreferences = useCallback(
    async (newPreferences: Partial<UserPreferences>): Promise<boolean> => {
      if (!session?.user?.id) {
        setError('Usuario no autenticado')
        return false
      }

      try {
        setError(null)

        const response = await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preferences: newPreferences }),
        })

        if (!response.ok) {
          throw new Error('Error al actualizar preferencias')
        }

        const data = await response.json()

        // Actualizar estado local
        setPreferences(prev => ({
          ...prev!,
          ...newPreferences,
        }))

        return true
      } catch (err) {
        console.error('Error al actualizar preferencias:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        return false
      }
    },
    [session?.user?.id]
  )

  // Actualizar sección específica de preferencias
  const updateSection = useCallback(
    async (section: keyof UserPreferences, data: any): Promise<boolean> => {
      if (!session?.user?.id) {
        setError('Usuario no autenticado')
        return false
      }

      try {
        setError(null)

        const response = await fetch(`/api/user/preferences/${section}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [section]: data }),
        })

        if (!response.ok) {
          throw new Error(`Error al actualizar ${section}`)
        }

        // Actualizar estado local
        setPreferences(prev => ({
          ...prev!,
          [section]: data,
        }))

        return true
      } catch (err) {
        console.error(`Error al actualizar ${section}:`, err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        return false
      }
    },
    [session?.user?.id]
  )

  // Resetear a valores por defecto
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      setError('Usuario no autenticado')
      return false
    }

    try {
      setError(null)

      const response = await fetch('/api/user/preferences', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al resetear preferencias')
      }

      // Actualizar estado local con valores por defecto
      setPreferences(defaultPreferences)

      return true
    } catch (err) {
      console.error('Error al resetear preferencias:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return false
    }
  }, [session?.user?.id])

  // Cargar preferencias al montar el componente
  useEffect(() => {
    getPreferences()
  }, [getPreferences])

  return {
    preferences,
    isLoading,
    error,
    getPreferences,
    updatePreferences,
    updateSection,
    resetToDefaults,
  }
}

// Hook auxiliar para obtener preferencias específicas
export function useNotificationPreferences() {
  const { preferences } = useUserPreferences()
  return preferences?.notifications || defaultPreferences.notifications
}

export function useDisplayPreferences() {
  const { preferences } = useUserPreferences()
  return preferences?.display || defaultPreferences.display
}

export function usePrivacyPreferences() {
  const { preferences } = useUserPreferences()
  return preferences?.privacy || defaultPreferences.privacy
}

// Hook para validaciones de preferencias
export function usePreferencesValidation() {
  const validateLanguage = useCallback((language: string): boolean => {
    const supportedLanguages = ['es', 'en', 'pt']
    return supportedLanguages.includes(language)
  }, [])

  const validateTimezone = useCallback((timezone: string): boolean => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
      return true
    } catch {
      return false
    }
  }, [])

  const validateCurrency = useCallback((currency: string): boolean => {
    const supportedCurrencies = ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'COP', 'MXN', 'PEN']
    return supportedCurrencies.includes(currency)
  }, [])

  const validateTheme = useCallback((theme: string): boolean => {
    const supportedThemes = ['light', 'dark', 'system']
    return supportedThemes.includes(theme)
  }, [])

  return {
    validateLanguage,
    validateTimezone,
    validateCurrency,
    validateTheme,
  }
}
