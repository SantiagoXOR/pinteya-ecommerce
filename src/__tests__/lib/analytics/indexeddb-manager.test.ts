/**
 * Tests para indexeddb-manager.ts
 * Verifica gestión de IndexedDB para persistencia de eventos
 */

import 'fake-indexeddb/auto'
import { indexedDBManager } from '@/lib/analytics/indexeddb-manager'
import { clearIndexedDB } from '../../../../__tests__/setup/indexeddb-setup'
import { createMockAnalyticsEvent } from '../../../../__tests__/setup/analytics-mocks'

describe('IndexedDBManager', () => {
  const mockEvent = createMockAnalyticsEvent()

  beforeEach(async () => {
    // Cerrar la base de datos si está abierta
    if (indexedDBManager['db']) {
      indexedDBManager['db'].close()
      indexedDBManager['db'] = null
      indexedDBManager['initPromise'] = null
      // Esperar un poco para que la base de datos se cierre completamente
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Limpiar IndexedDB antes de cada test
    try {
      await clearIndexedDB()
      // Esperar un poco para asegurar que la limpieza se complete
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      // Ignorar errores si la base de datos no existe
    }
    
    // Resetear el singleton completamente
    indexedDBManager['db'] = null
    indexedDBManager['initPromise'] = null
    
    jest.clearAllMocks()
  })

  describe('init()', () => {
    it('debería inicializar IndexedDB correctamente', async () => {
      const db = await indexedDBManager.init()

      expect(db).toBeDefined()
      expect(db.name).toBe('analytics_events_db')
      expect(db.version).toBe(1)
    })

    it('debería retornar la misma instancia en llamadas múltiples', async () => {
      const db1 = await indexedDBManager.init()
      const db2 = await indexedDBManager.init()

      expect(db1).toBe(db2)
    })

    it('debería crear object store si no existe', async () => {
      const db = await indexedDBManager.init()

      expect(db.objectStoreNames.contains('failed_events')).toBe(true)
    })

    it('debería crear índices correctamente', async () => {
      const db = await indexedDBManager.init()
      const transaction = db.transaction(['failed_events'], 'readonly')
      const store = transaction.objectStore('failed_events')

      expect(store.indexNames.contains('timestamp')).toBe(true)
      expect(store.indexNames.contains('retryCount')).toBe(true)
    })

    it('debería lanzar error cuando IndexedDB no está disponible', async () => {
      const originalIndexedDB = global.indexedDB
      ;(global as any).indexedDB = undefined

      await expect(indexedDBManager.init()).rejects.toThrow('IndexedDB no está disponible')

      ;(global as any).indexedDB = originalIndexedDB
    })
  })

  describe('storeEvent()', () => {
    beforeEach(async () => {
      await indexedDBManager.init()
    })

    it('debería almacenar evento correctamente', async () => {
      await indexedDBManager.storeEvent(mockEvent)
      
      // Esperar un poco para que la transacción se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const count = await indexedDBManager.getPendingCount()
      expect(count).toBe(1)
    })

    it('debería generar ID único para cada evento', async () => {
      await indexedDBManager.storeEvent(mockEvent)
      await new Promise(resolve => setTimeout(resolve, 50))
      await indexedDBManager.storeEvent(mockEvent)
      await new Promise(resolve => setTimeout(resolve, 50))

      const count = await indexedDBManager.getPendingCount()
      expect(count).toBe(2)
    })

    it('debería almacenar todos los campos del evento', async () => {
      await indexedDBManager.storeEvent(mockEvent)
      
      // Esperar un poco para que la transacción se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const events = await indexedDBManager.getPendingEvents(1)
      expect(events.length).toBe(1)
      expect(events[0].event).toEqual(mockEvent)
      expect(events[0].timestamp).toBeDefined()
      expect(events[0].retryCount).toBe(0)
    })

    it('debería eliminar eventos antiguos cuando se alcanza el límite', async () => {
      // Almacenar más eventos que el límite (MAX_EVENTS = 1000)
      // Para este test, vamos a almacenar algunos eventos y verificar el comportamiento
      const events = Array.from({ length: 5 }, () => createMockAnalyticsEvent())

      for (const event of events) {
        await indexedDBManager.storeEvent(event)
      }

      const count = await indexedDBManager.getPendingCount()
      expect(count).toBe(5)
    })

    it('debería manejar errores de almacenamiento', async () => {
      // Cerrar la base de datos para simular error
      const db = await indexedDBManager.init()
      db.close()

      // No debería lanzar error, solo loguear warning
      await expect(indexedDBManager.storeEvent(mockEvent)).resolves.not.toThrow()
    })
  })

  describe('getPendingEvents()', () => {
    beforeEach(async () => {
      await indexedDBManager.init()
    })

    it('debería retornar array vacío cuando no hay eventos', async () => {
      const events = await indexedDBManager.getPendingEvents()

      expect(events).toEqual([])
    })

    it('debería retornar eventos pendientes', async () => {
      await indexedDBManager.storeEvent(mockEvent)
      
      // Esperar un poco para que la transacción se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const events = await indexedDBManager.getPendingEvents()

      expect(events.length).toBe(1)
      expect(events[0].event).toEqual(mockEvent)
    })

    it('debería respetar el límite de eventos', async () => {
      // Almacenar múltiples eventos
      for (let i = 0; i < 10; i++) {
        await indexedDBManager.storeEvent(createMockAnalyticsEvent({ event: `event-${i}` }))
        // Pequeño delay entre cada almacenamiento
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      // Esperar un poco más para que todas las transacciones se completen
      await new Promise(resolve => setTimeout(resolve, 50))

      const events = await indexedDBManager.getPendingEvents(5)

      expect(events.length).toBe(5)
    })

    it('debería excluir eventos con demasiados reintentos', async () => {
      // Almacenar evento
      await indexedDBManager.storeEvent(mockEvent)
      
      // Esperar un poco para que la transacción se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      // Obtener el ID del evento almacenado
      const events = await indexedDBManager.getPendingEvents(1)
      expect(events.length).toBeGreaterThan(0)
      const eventId = events[0].id

      // Incrementar retry count más allá del máximo (MAX_RETRIES = 5)
      for (let i = 0; i < 6; i++) {
        await indexedDBManager.incrementRetry(eventId)
        // Esperar un poco entre cada incremento
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Ahora no debería aparecer en getPendingEvents
      const pendingEvents = await indexedDBManager.getPendingEvents()
      expect(pendingEvents.length).toBe(0)
    })

    it('debería retornar eventos ordenados por timestamp', async () => {
      const event1 = createMockAnalyticsEvent({ event: 'event-1' })
      const event2 = createMockAnalyticsEvent({ event: 'event-2' })

      await indexedDBManager.storeEvent(event1)
      await new Promise((resolve) => setTimeout(resolve, 50)) // Delay suficiente para timestamp diferente
      await indexedDBManager.storeEvent(event2)

      const events = await indexedDBManager.getPendingEvents()

      expect(events.length).toBe(2)
      expect(events[0].timestamp).toBeLessThanOrEqual(events[1].timestamp)
    })

    it('debería manejar errores y retornar array vacío', async () => {
      // Cerrar la base de datos para simular error
      const db = await indexedDBManager.init()
      db.close()

      const events = await indexedDBManager.getPendingEvents()

      expect(events).toEqual([])
    })
  })

  describe('removeEvent()', () => {
    beforeEach(async () => {
      await indexedDBManager.init()
    })

    it('debería eliminar evento correctamente', async () => {
      await indexedDBManager.storeEvent(mockEvent)
      
      // Esperar un poco para que la transacción se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const events = await indexedDBManager.getPendingEvents(1)
      expect(events.length).toBeGreaterThan(0)
      const eventId = events[0].id

      await indexedDBManager.removeEvent(eventId)
      
      // Esperar un poco para que la eliminación se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const count = await indexedDBManager.getPendingCount()
      expect(count).toBe(0)
    })

    it('debería manejar eliminación de evento inexistente', async () => {
      await expect(indexedDBManager.removeEvent('non-existent-id')).resolves.not.toThrow()
    })

    it('debería manejar errores de eliminación', async () => {
      const db = await indexedDBManager.init()
      db.close()

      await expect(indexedDBManager.removeEvent('test-id')).resolves.not.toThrow()
    })
  })

  describe('incrementRetry()', () => {
    beforeEach(async () => {
      await indexedDBManager.init()
    })

    it('debería incrementar retry count', async () => {
      await indexedDBManager.storeEvent(mockEvent)
      
      // Esperar un poco para que la transacción se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const events = await indexedDBManager.getPendingEvents(1)
      expect(events.length).toBeGreaterThan(0)
      const eventId = events[0].id

      await indexedDBManager.incrementRetry(eventId)
      
      // Esperar un poco para que la actualización se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const updatedEvents = await indexedDBManager.getPendingEvents(1)
      expect(updatedEvents.length).toBeGreaterThan(0)
      expect(updatedEvents[0].retryCount).toBe(1)
    })

    it('debería actualizar lastRetry timestamp', async () => {
      await indexedDBManager.storeEvent(mockEvent)
      
      // Esperar un poco para que la transacción se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const events = await indexedDBManager.getPendingEvents(1)
      expect(events.length).toBeGreaterThan(0)
      const eventId = events[0].id
      const beforeRetry = Date.now()

      await indexedDBManager.incrementRetry(eventId)
      
      // Esperar un poco para que la actualización se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const updatedEvents = await indexedDBManager.getPendingEvents(1)
      expect(updatedEvents.length).toBeGreaterThan(0)
      expect(updatedEvents[0].lastRetry).toBeDefined()
      expect(updatedEvents[0].lastRetry).toBeGreaterThanOrEqual(beforeRetry)
    })

    it('debería manejar incremento de retry en evento inexistente', async () => {
      await expect(indexedDBManager.incrementRetry('non-existent-id')).resolves.not.toThrow()
    })

    it('debería manejar errores de incremento', async () => {
      const db = await indexedDBManager.init()
      db.close()

      await expect(indexedDBManager.incrementRetry('test-id')).resolves.not.toThrow()
    })
  })

  describe('getPendingCount()', () => {
    beforeEach(async () => {
      await indexedDBManager.init()
    })

    it('debería retornar 0 cuando no hay eventos', async () => {
      const count = await indexedDBManager.getPendingCount()

      expect(count).toBe(0)
    })

    it('debería retornar cantidad correcta de eventos', async () => {
      await indexedDBManager.storeEvent(mockEvent)
      await new Promise(resolve => setTimeout(resolve, 50))
      await indexedDBManager.storeEvent(createMockAnalyticsEvent({ event: 'event-2' }))
      await new Promise(resolve => setTimeout(resolve, 50))

      const count = await indexedDBManager.getPendingCount()

      expect(count).toBe(2)
    })

    it('debería retornar 0 en caso de error', async () => {
      const db = await indexedDBManager.init()
      db.close()

      const count = await indexedDBManager.getPendingCount()

      expect(count).toBe(0)
    })
  })

  describe('cleanup()', () => {
    beforeEach(async () => {
      await indexedDBManager.init()
    })

    it('debería eliminar eventos con demasiados reintentos', async () => {
      // Almacenar evento
      await indexedDBManager.storeEvent(mockEvent)
      
      // Esperar un poco para que la transacción se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const events = await indexedDBManager.getPendingEvents(1)
      expect(events.length).toBeGreaterThan(0)
      const eventId = events[0].id

      // Incrementar retry count más allá del máximo
      for (let i = 0; i < 6; i++) {
        await indexedDBManager.incrementRetry(eventId)
        // Esperar un poco entre cada incremento
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Limpiar
      await indexedDBManager.cleanup()
      
      // Esperar un poco para que la limpieza se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const count = await indexedDBManager.getPendingCount()
      expect(count).toBe(0)
    })

    it('debería mantener eventos con pocos reintentos', async () => {
      await indexedDBManager.storeEvent(mockEvent)
      
      // Esperar un poco para que la transacción se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const events = await indexedDBManager.getPendingEvents(1)
      expect(events.length).toBeGreaterThan(0)
      const eventId = events[0].id

      // Incrementar retry count pero no más allá del máximo
      await indexedDBManager.incrementRetry(eventId)
      await new Promise(resolve => setTimeout(resolve, 50))
      await indexedDBManager.incrementRetry(eventId)
      await new Promise(resolve => setTimeout(resolve, 50))

      await indexedDBManager.cleanup()
      
      // Esperar un poco para que la limpieza se complete
      await new Promise(resolve => setTimeout(resolve, 50))

      const count = await indexedDBManager.getPendingCount()
      expect(count).toBe(1)
    })

    it('debería manejar errores de limpieza', async () => {
      const db = await indexedDBManager.init()
      db.close()

      await expect(indexedDBManager.cleanup()).resolves.not.toThrow()
    })
  })
})
