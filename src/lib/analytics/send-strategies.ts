/**
 * Múltiples estrategias de envío de eventos de analytics
 * Implementa fallback automático cuando una estrategia falla
 */

import { adBlockDetector } from './adblock-detector'
import { indexedDBManager } from './indexeddb-manager'

export interface AnalyticsEvent {
  event: string
  category: string
  action: string
  label?: string
  value?: number
  userId?: string
  sessionId: string
  visitorId?: string // ID persistente para usuarios anónimos recurrentes
  page: string
  userAgent?: string
  metadata?: Record<string, any>
}

export type SendStrategy = 'fetch-primary' | 'fetch-alternative' | 'sendBeacon' | 'indexedDB'

interface SendResult {
  success: boolean
  strategy: SendStrategy
  error?: string
}

class SendStrategies {
  private primaryEndpoint = '/api/analytics/events'
  private alternativeEndpoint = '/api/track/events'
  private preferredStrategy: SendStrategy | null = null

  /**
   * Enviar evento usando múltiples estrategias con fallback
   */
  async sendEvent(event: AnalyticsEvent): Promise<SendResult> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] sendEvent:', { event: event.event, category: event.category, action: event.action })
    }

    // Estrategia 1: Fetch al endpoint alternativo (menos detectable)
    const alternativeResult = await this.tryFetchAlternative(event)
    if (alternativeResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] ✅ Evento enviado (alternative):', alternativeResult)
      }
      return alternativeResult
    }

    // Estrategia 2: SendBeacon (más difícil de bloquear)
    if (adBlockDetector.isSendBeaconAvailable()) {
      const beaconResult = await this.trySendBeacon(event)
      if (beaconResult.success) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Analytics] ✅ Evento enviado (beacon):', beaconResult)
        }
        return beaconResult
      }
    }

    // Estrategia 3: Fetch al endpoint original (compatibilidad)
    const primaryResult = await this.tryFetchPrimary(event)
    if (primaryResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] ✅ Evento enviado (primary):', primaryResult)
      }
      return primaryResult
    }

    // Estrategia 4: Persistir en IndexedDB para envío posterior
    await indexedDBManager.storeEvent(event)
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Analytics] ⚠️ Todas las estrategias fallaron, evento guardado en IndexedDB')
    }

    return {
      success: false,
      strategy: 'indexedDB',
      error: 'Todas las estrategias fallaron, evento guardado para retry',
    }
  }

  /**
   * Estrategia 1: Fetch al endpoint alternativo
   */
  private async tryFetchAlternative(event: AnalyticsEvent): Promise<SendResult> {
    try {
      const response = await fetch(this.alternativeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        keepalive: true, // Mantener conexión viva
      })

      if (response.ok) {
        this.preferredStrategy = 'fetch-alternative'
        return {
          success: true,
          strategy: 'fetch-alternative',
        }
      }

      return {
        success: false,
        strategy: 'fetch-alternative',
        error: `HTTP ${response.status}`,
      }
    } catch (error: any) {
      return {
        success: false,
        strategy: 'fetch-alternative',
        error: error.message || 'Network error',
      }
    }
  }

  /**
   * Estrategia 2: SendBeacon
   */
  private async trySendBeacon(event: AnalyticsEvent): Promise<SendResult> {
    try {
      const blob = new Blob([JSON.stringify(event)], { type: 'application/json' })
      const sent = navigator.sendBeacon(this.alternativeEndpoint, blob)

      if (sent) {
        this.preferredStrategy = 'sendBeacon'
        return {
          success: true,
          strategy: 'sendBeacon',
        }
      }

      return {
        success: false,
        strategy: 'sendBeacon',
        error: 'sendBeacon returned false',
      }
    } catch (error: any) {
      return {
        success: false,
        strategy: 'sendBeacon',
        error: error.message || 'sendBeacon error',
      }
    }
  }

  /**
   * Estrategia 3: Fetch al endpoint original
   */
  private async tryFetchPrimary(event: AnalyticsEvent): Promise<SendResult> {
    try {
      const response = await fetch(this.primaryEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        keepalive: true,
      })

      if (response.ok) {
        return {
          success: true,
          strategy: 'fetch-primary',
        }
      }

      return {
        success: false,
        strategy: 'fetch-primary',
        error: `HTTP ${response.status}`,
      }
    } catch (error: any) {
      return {
        success: false,
        strategy: 'fetch-primary',
        error: error.message || 'Network error',
      }
    }
  }

  /**
   * Enviar eventos pendientes desde IndexedDB
   */
  async flushPendingEvents(): Promise<number> {
    try {
      const pendingEvents = await indexedDBManager.getPendingEvents(50)

      if (pendingEvents.length === 0) {
        return 0
      }

      let successCount = 0

      for (const storedEvent of pendingEvents) {
        const result = await this.sendEvent(storedEvent.event)

        if (result.success) {
          await indexedDBManager.removeEvent(storedEvent.id)
          successCount++
        } else {
          await indexedDBManager.incrementRetry(storedEvent.id)
        }

        // Pausa pequeña entre eventos para no sobrecargar
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Limpiar eventos con demasiados reintentos
      await indexedDBManager.cleanup()

      return successCount
    } catch (error) {
      console.warn('Error flushing pending events:', error)
      return 0
    }
  }

  /**
   * Obtener estrategia preferida actual
   */
  getPreferredStrategy(): SendStrategy | null {
    return this.preferredStrategy
  }

  /**
   * Resetear estrategia preferida
   */
  resetPreferredStrategy(): void {
    this.preferredStrategy = null
  }
}

export const sendStrategies = new SendStrategies()
