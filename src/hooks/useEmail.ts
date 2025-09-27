// ===================================
// PINTEYA E-COMMERCE - HOOK DE EMAIL
// ===================================

import { useState } from 'react'

// ===================================
// TIPOS
// ===================================

interface EmailTestRequest {
  type: 'welcome' | 'order' | 'reset'
  email: string
  userName: string
}

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
  type?: string
  sentTo?: string
}

interface EmailConfig {
  isReady: boolean
  fromEmail: string
  supportEmail: string
  hasApiKey: boolean
  provider: string
}

// ===================================
// HOOK useEmail
// ===================================

export function useEmail() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Envía un email de prueba
   */
  const sendTestEmail = async (request: EmailTestRequest): Promise<EmailResponse> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error enviando email')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Verifica la configuración del servicio de email
   */
  const checkEmailConfig = async (): Promise<EmailConfig> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/email/test', {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error verificando configuración')
      }

      return data.config
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Envía email de bienvenida
   */
  const sendWelcomeEmail = async (email: string, userName: string) => {
    return sendTestEmail({ type: 'welcome', email, userName })
  }

  /**
   * Envía email de confirmación de pedido
   */
  const sendOrderEmail = async (email: string, userName: string) => {
    return sendTestEmail({ type: 'order', email, userName })
  }

  /**
   * Envía email de recuperación de contraseña
   */
  const sendResetEmail = async (email: string, userName: string) => {
    return sendTestEmail({ type: 'reset', email, userName })
  }

  return {
    loading,
    error,
    sendTestEmail,
    sendWelcomeEmail,
    sendOrderEmail,
    sendResetEmail,
    checkEmailConfig,
  }
}

// ===================================
// HOOK useEmailConfig
// ===================================

export function useEmailConfig() {
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Carga la configuración de email
   */
  const loadConfig = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/email/test')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error cargando configuración')
      }

      setConfig(data.config)
      return data.config
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    config,
    loading,
    error,
    loadConfig,
  }
}
