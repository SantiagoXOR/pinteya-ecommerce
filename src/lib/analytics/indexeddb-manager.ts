/**
 * Manager de IndexedDB para persistencia de eventos de analytics
 * Permite almacenar eventos cuando fallan las solicitudes de red
 */

interface StoredEvent {
  id: string
  event: any
  timestamp: number
  retryCount: number
  lastRetry?: number
}

const DB_NAME = 'analytics_events_db'
const DB_VERSION = 1
const STORE_NAME = 'failed_events'
const MAX_EVENTS = 1000 // Máximo de eventos pendientes
const MAX_RETRIES = 5 // Máximo de intentos por evento

class IndexedDBManager {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null

  /**
   * Inicializar IndexedDB
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no está disponible'))
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('Error abriendo IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Crear object store si no existe
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
          objectStore.createIndex('retryCount', 'retryCount', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  /**
   * Almacenar evento fallido
   */
  async storeEvent(event: any): Promise<void> {
    try {
      const db = await this.init()

      const storedEvent: StoredEvent = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event,
        timestamp: Date.now(),
        retryCount: 0,
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      // Verificar límite de eventos
      const countRequest = store.count()
      countRequest.onsuccess = () => {
        const count = countRequest.result
        if (count >= MAX_EVENTS) {
          // Eliminar eventos más antiguos
          const index = store.index('timestamp')
          const cursorRequest = index.openCursor()
          cursorRequest.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
            if (cursor) {
              cursor.delete()
              cursor.continue()
            }
          }
        }
      }

      await new Promise<void>((resolve, reject) => {
        // Configurar handlers de transacción ANTES de iniciar la operación
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
        
        const request = store.add(storedEvent)
        request.onsuccess = () => {
          // La transacción se completará automáticamente cuando termine
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('Error almacenando evento en IndexedDB:', error)
    }
  }

  /**
   * Obtener eventos pendientes
   */
  async getPendingEvents(limit: number = 50): Promise<StoredEvent[]> {
    try {
      const db = await this.init()
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('timestamp')

      return new Promise((resolve, reject) => {
        const events: StoredEvent[] = []
        
        // Configurar handlers de transacción ANTES de iniciar la operación
        transaction.oncomplete = () => resolve(events)
        transaction.onerror = () => reject(transaction.error)
        
        const request = index.openCursor()

        request.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
          if (cursor && events.length < limit) {
            const event = cursor.value as StoredEvent
            // Solo eventos que no han excedido el máximo de reintentos
            if (event.retryCount < MAX_RETRIES) {
              events.push(event)
            }
            cursor.continue()
          }
          // Cuando cursor es null, la transacción se completará automáticamente
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('Error obteniendo eventos pendientes:', error)
      return []
    }
  }

  /**
   * Marcar evento como enviado exitosamente
   */
  async removeEvent(eventId: string): Promise<void> {
    try {
      const db = await this.init()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      await new Promise<void>((resolve, reject) => {
        // Configurar handlers de transacción ANTES de iniciar la operación
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
        
        const request = store.delete(eventId)
        request.onsuccess = () => {
          // La transacción se completará automáticamente cuando termine
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('Error eliminando evento de IndexedDB:', error)
    }
  }

  /**
   * Incrementar contador de reintentos
   */
  async incrementRetry(eventId: string): Promise<void> {
    try {
      const db = await this.init()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      return new Promise<void>((resolve, reject) => {
        // Configurar handlers de transacción ANTES de iniciar la operación
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
        
        const getRequest = store.get(eventId)
        getRequest.onsuccess = () => {
          const event = getRequest.result as StoredEvent
          if (event) {
            event.retryCount += 1
            event.lastRetry = Date.now()
            const putRequest = store.put(event)
            putRequest.onsuccess = () => {
              // La transacción se completará automáticamente cuando termine
            }
            putRequest.onerror = () => reject(putRequest.error)
          } else {
            resolve()
          }
        }
        getRequest.onerror = () => reject(getRequest.error)
      })
    } catch (error) {
      console.warn('Error incrementando retry count:', error)
    }
  }

  /**
   * Limpiar eventos antiguos o con demasiados reintentos
   */
  async cleanup(): Promise<void> {
    try {
      const db = await this.init()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('retryCount')

      return new Promise((resolve) => {
        const request = index.openCursor(IDBKeyRange.upperBound(MAX_RETRIES - 1, true))

        request.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
          if (cursor) {
            cursor.delete()
            cursor.continue()
          } else {
            resolve()
          }
        }

        request.onerror = () => resolve()
      })
    } catch (error) {
      console.warn('Error limpiando IndexedDB:', error)
    }
  }

  /**
   * Obtener cantidad de eventos pendientes
   */
  async getPendingCount(): Promise<number> {
    try {
      const db = await this.init()
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve) => {
        let countResult = 0
        
        // Configurar handlers de transacción ANTES de iniciar la operación
        transaction.oncomplete = () => resolve(countResult)
        transaction.onerror = () => resolve(0)
        
        const request = store.count()
        request.onsuccess = () => {
          countResult = request.result
        }
        request.onerror = () => resolve(0)
      })
    } catch (error) {
      return 0
    }
  }
}

export const indexedDBManager = new IndexedDBManager()
