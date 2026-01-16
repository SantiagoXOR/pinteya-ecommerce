/**
 * Setup de IndexedDB para tests
 * Usa fake-indexeddb para simular IndexedDB en ambiente de testing
 */

import 'fake-indexeddb/auto'

// Limpiar IndexedDB antes de cada test
export function clearIndexedDB() {
  return new Promise<void>((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase('analytics_events_db')
    deleteRequest.onsuccess = () => resolve()
    deleteRequest.onerror = () => reject(deleteRequest.error)
    deleteRequest.onblocked = () => {
      // Si hay conexiones abiertas, esperar un poco y reintentar
      setTimeout(() => {
        const retryRequest = indexedDB.deleteDatabase('analytics_events_db')
        retryRequest.onsuccess = () => resolve()
        retryRequest.onerror = () => reject(retryRequest.error)
      }, 100)
    }
  })
}

// Helper para verificar que IndexedDB está disponible
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

// Helper para obtener todos los eventos almacenados (para debugging)
export async function getAllStoredEvents(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('analytics_events_db', 1)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['failed_events'], 'readonly')
      const store = transaction.objectStore('failed_events')
      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || [])
      }

      getAllRequest.onerror = () => {
        reject(getAllRequest.error)
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}
