/**
 * Manager de persistencia de eventos de analytics
 * Maneja almacenamiento, retry y envío de eventos pendientes
 */

import { indexedDBManager } from './indexeddb-manager'
import { sendStrategies, AnalyticsEvent } from './send-strategies'

interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelay: 1000, // 1 segundo
  maxDelay: 60000, // 60 segundos
  backoffMultiplier: 2,
}

class EventPersistence {
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  private flushInterval: NodeJS.Timeout | null = null
  private isFlushing = false

  /**
   * Inicializar sistema de persistencia
   */
  async init(): Promise<void> {
    // Inicializar IndexedDB
    try {
      await indexedDBManager.init()
    } catch (error) {
      console.warn('IndexedDB no disponible, usando fallback:', error)
    }

    // Enviar eventos pendientes al cargar
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.flushPendingEvents()
      })

      // Enviar eventos pendientes antes de cerrar página
      window.addEventListener('beforeunload', () => {
        this.flushPendingEvents()
      })

      // Enviar eventos pendientes periódicamente
      this.startPeriodicFlush()
    }
  }

  /**
   * Almacenar evento para retry posterior
   */
  async storeForRetry(event: AnalyticsEvent): Promise<void> {
    try {
      await indexedDBManager.storeEvent(event)
    } catch (error) {
      console.warn('Error almacenando evento para retry:', error)
    }
  }

  /**
   * Enviar eventos pendientes
   */
  async flushPendingEvents(): Promise<number> {
    if (this.isFlushing) {
      return 0
    }

    this.isFlushing = true

    try {
      const count = await sendStrategies.flushPendingEvents()
      return count
    } finally {
      this.isFlushing = false
    }
  }

  /**
   * Iniciar envío periódico de eventos pendientes
   */
  startPeriodicFlush(intervalMs: number = 30000): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }

    this.flushInterval = setInterval(() => {
      this.flushPendingEvents()
    }, intervalMs)
  }

  /**
   * Detener envío periódico
   */
  stopPeriodicFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }

  /**
   * Obtener cantidad de eventos pendientes
   */
  async getPendingCount(): Promise<number> {
    return indexedDBManager.getPendingCount()
  }

  /**
   * Limpiar eventos antiguos o con demasiados reintentos
   */
  async cleanup(): Promise<void> {
    await indexedDBManager.cleanup()
  }

  /**
   * Configurar parámetros de retry
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config }
  }
}

export const eventPersistence = new EventPersistence()

// Inicializar automáticamente en el cliente
if (typeof window !== 'undefined') {
  eventPersistence.init().catch(console.warn)
}
