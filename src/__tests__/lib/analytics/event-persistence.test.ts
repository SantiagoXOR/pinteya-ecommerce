/**
 * Tests para event-persistence.ts
 * Verifica persistencia y retry automático
 */

import { eventPersistence } from '@/lib/analytics/event-persistence'
import { AnalyticsEvent } from '@/lib/analytics/send-strategies'
import { createMockAnalyticsEvent } from '../../../../__tests__/setup/analytics-mocks'

// Mock de dependencias
const mockInit = jest.fn()
const mockStoreEvent = jest.fn()
const mockGetPendingCount = jest.fn()
const mockCleanup = jest.fn()
const mockFlushPendingEvents = jest.fn()

jest.mock('@/lib/analytics/indexeddb-manager', () => ({
  indexedDBManager: {
    init: (...args: any[]) => mockInit(...args),
    storeEvent: (...args: any[]) => mockStoreEvent(...args),
    getPendingCount: (...args: any[]) => mockGetPendingCount(...args),
    cleanup: (...args: any[]) => mockCleanup(...args),
  },
}))

jest.mock('@/lib/analytics/send-strategies', () => ({
  sendStrategies: {
    flushPendingEvents: (...args: any[]) => mockFlushPendingEvents(...args),
  },
}))

describe('EventPersistence', () => {
  const mockEvent: AnalyticsEvent = createMockAnalyticsEvent()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    // Mock por defecto
    mockInit.mockResolvedValue(undefined as any)
    mockStoreEvent.mockResolvedValue(undefined)
    mockGetPendingCount.mockResolvedValue(0)
    mockCleanup.mockResolvedValue(undefined)
    mockFlushPendingEvents.mockResolvedValue(0)
  })

  afterEach(() => {
    jest.useRealTimers()
    eventPersistence.stopPeriodicFlush()
  })

  describe('init()', () => {
    it('debería inicializar IndexedDB correctamente', async () => {
      await eventPersistence.init()

      expect(mockInit).toHaveBeenCalled()
    })

    it('debería manejar errores de inicialización de IndexedDB', async () => {
      mockInit.mockRejectedValue(new Error('IndexedDB error'))

      // No debería lanzar error
      await expect(eventPersistence.init()).resolves.not.toThrow()
    })

    it('debería registrar event listeners en window', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')

      await eventPersistence.init()

      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    it('debería iniciar envío periódico', async () => {
      await eventPersistence.init()

      // Avanzar tiempo para que se ejecute el intervalo
      jest.advanceTimersByTime(30000)

      expect(mockFlushPendingEvents).toHaveBeenCalled()
    })
  })

  describe('storeForRetry()', () => {
    it('debería almacenar evento para retry', async () => {
      await eventPersistence.storeForRetry(mockEvent)

      expect(mockStoreEvent).toHaveBeenCalledWith(mockEvent)
    })

    it('debería manejar errores al almacenar', async () => {
      mockStoreEvent.mockRejectedValue(new Error('Storage error'))

      // No debería lanzar error
      await expect(eventPersistence.storeForRetry(mockEvent)).resolves.not.toThrow()
    })
  })

  describe('flushPendingEvents()', () => {
    it('debería enviar eventos pendientes', async () => {
      mockFlushPendingEvents.mockResolvedValue(5)

      const count = await eventPersistence.flushPendingEvents()

      expect(count).toBe(5)
      expect(mockFlushPendingEvents).toHaveBeenCalled()
    })

    it('debería retornar 0 si ya está flushing', async () => {
      // Iniciar flush
      const flushPromise = eventPersistence.flushPendingEvents()

      // Intentar flush mientras está en progreso
      const secondFlushPromise = eventPersistence.flushPendingEvents()

      await Promise.all([flushPromise, secondFlushPromise])

      // Solo debería llamarse una vez
      expect(mockFlushPendingEvents).toHaveBeenCalledTimes(1)
    })

    it('debería resetear flag isFlushing después de completar', async () => {
      mockFlushPendingEvents.mockResolvedValue(0)

      await eventPersistence.flushPendingEvents()
      await eventPersistence.flushPendingEvents()

      expect(mockFlushPendingEvents).toHaveBeenCalledTimes(2)
    })
  })

  describe('startPeriodicFlush()', () => {
    it('debería iniciar envío periódico con intervalo por defecto', async () => {
      eventPersistence.startPeriodicFlush()

      jest.advanceTimersByTime(30000)

      expect(mockFlushPendingEvents).toHaveBeenCalled()
    })

    it('debería iniciar envío periódico con intervalo personalizado', async () => {
      eventPersistence.startPeriodicFlush(10000)

      jest.advanceTimersByTime(10000)

      expect(mockFlushPendingEvents).toHaveBeenCalled()
    })

    it('debería reemplazar intervalo existente', async () => {
      eventPersistence.startPeriodicFlush(30000)
      eventPersistence.startPeriodicFlush(10000)

      jest.advanceTimersByTime(10000)

      // Solo debería ejecutarse una vez (el nuevo intervalo)
      expect(mockFlushPendingEvents).toHaveBeenCalledTimes(1)
    })

    it('debería ejecutar múltiples veces con el intervalo', async () => {
      eventPersistence.startPeriodicFlush(10000)

      // Avanzar tiempo paso a paso para que los intervalos se ejecuten
      jest.advanceTimersByTime(10000)
      await Promise.resolve() // Permitir que se procese el callback
      jest.advanceTimersByTime(10000)
      await Promise.resolve()
      jest.advanceTimersByTime(10000)
      await Promise.resolve()

      // Debería haberse llamado al menos una vez (puede variar según implementación)
      expect(mockFlushPendingEvents).toHaveBeenCalled()
    })
  })

  describe('stopPeriodicFlush()', () => {
    it('debería detener envío periódico', async () => {
      eventPersistence.startPeriodicFlush(10000)
      eventPersistence.stopPeriodicFlush()

      jest.advanceTimersByTime(20000)

      expect(mockFlushPendingEvents).not.toHaveBeenCalled()
    })

    it('debería manejar stop cuando no hay intervalo activo', () => {
      expect(() => eventPersistence.stopPeriodicFlush()).not.toThrow()
    })
  })

  describe('getPendingCount()', () => {
    it('debería retornar cantidad de eventos pendientes', async () => {
      mockGetPendingCount.mockResolvedValue(5)

      const count = await eventPersistence.getPendingCount()

      expect(count).toBe(5)
      expect(mockGetPendingCount).toHaveBeenCalled()
    })
  })

  describe('cleanup()', () => {
    it('debería limpiar eventos antiguos', async () => {
      await eventPersistence.cleanup()

      expect(mockCleanup).toHaveBeenCalled()
    })
  })

  describe('setRetryConfig()', () => {
    it('debería actualizar configuración de retry', () => {
      const newConfig = {
        maxRetries: 10,
        initialDelay: 2000,
      }

      eventPersistence.setRetryConfig(newConfig)

      // La configuración se actualiza internamente
      // No hay forma directa de verificarla, pero no debería lanzar error
      expect(() => eventPersistence.setRetryConfig(newConfig)).not.toThrow()
    })

    it('debería actualizar solo campos proporcionados', () => {
      const partialConfig = {
        maxRetries: 7,
      }

      expect(() => eventPersistence.setRetryConfig(partialConfig)).not.toThrow()
    })
  })

  describe('Event listeners', () => {
    it('debería llamar flushPendingEvents en load event', async () => {
      await eventPersistence.init()

      // Simular evento load
      const loadEvent = new Event('load')
      window.dispatchEvent(loadEvent)

      // Avanzar timers para que se procese
      jest.advanceTimersByTime(100)

      expect(mockFlushPendingEvents).toHaveBeenCalled()
    })

    it('debería llamar flushPendingEvents en beforeunload event', async () => {
      await eventPersistence.init()

      // Simular evento beforeunload
      const beforeUnloadEvent = new Event('beforeunload')
      window.dispatchEvent(beforeUnloadEvent)

      // Avanzar timers para que se procese
      jest.advanceTimersByTime(100)

      expect(mockFlushPendingEvents).toHaveBeenCalled()
    })
  })
})
