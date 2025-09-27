/**
 * Utilidad para limpiar localStorage corrupto manualmente
 * Útil para debugging y resolución de problemas JSON
 */

import { cleanCorruptedLocalStorage, STORAGE_KEYS } from '@/lib/json-utils'

/**
 * Limpia todo el localStorage de la aplicación
 */
export function clearAllPinteyaStorage(): void {
  if (typeof window === 'undefined') {
    console.warn('clearAllPinteyaStorage: No disponible en SSR')
    return
  }

  const keys = Object.values(STORAGE_KEYS)
  let clearedCount = 0

  keys.forEach(key => {
    try {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        clearedCount++
      }
    } catch (error) {
      console.warn(`Error clearing localStorage key ${key}:`, error)
    }
  })
}

/**
 * Limpia solo los datos corruptos de localStorage
 */
export function cleanCorruptedStorage(): number {
  if (typeof window === 'undefined') {
    console.warn('cleanCorruptedStorage: No disponible en SSR')
    return 0
  }

  const keys = Object.values(STORAGE_KEYS)
  const cleanedCount = cleanCorruptedLocalStorage(keys)

  if (cleanedCount > 0) {
  } else {
  }

  return cleanedCount
}

/**
 * Inspecciona el contenido de localStorage para debugging
 */
export function inspectLocalStorage(): void {
  if (typeof window === 'undefined') {
    console.warn('inspectLocalStorage: No disponible en SSR')
    return
  }

  const keys = Object.values(STORAGE_KEYS)

  keys.forEach(key => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        console.log(`📦 ${key}:`, {
          length: stored.length,
          preview: stored.substring(0, 100) + (stored.length > 100 ? '...' : ''),
          isValidJSON: (() => {
            try {
              JSON.parse(stored)
              return true
            } catch {
              return false
            }
          })(),
        })
      } else {
        console.log(`📦 ${key}: (empty)`)
      }
    } catch (error) {
      console.error(`❌ Error inspecting ${key}:`, error)
    }
  })
}

/**
 * Función para ejecutar desde la consola del navegador
 * Ejemplo: window.debugPinteyaStorage()
 */
export function setupDebugHelpers(): void {
  if (typeof window === 'undefined') {
    return
  }

  // Agregar funciones de debug al objeto window
  ;(window as any).debugPinteyaStorage = () => {
    console.log('- window.clearAllPinteyaStorage() - Clear all Pinteya localStorage')
    console.log('- window.cleanCorruptedStorage() - Clean only corrupted data')
    console.log('- window.inspectLocalStorage() - Inspect localStorage content')
  }
  ;(window as any).clearAllPinteyaStorage = clearAllPinteyaStorage
  ;(window as any).cleanCorruptedStorage = cleanCorruptedStorage
  ;(window as any).inspectLocalStorage = inspectLocalStorage

  console.log('🛠️ Debug helpers loaded. Type window.debugPinteyaStorage() for help.')
}

/**
 * Detecta y reporta problemas específicos de JSON
 */
export function detectJsonProblems(): void {
  if (typeof window === 'undefined') {
    console.warn('detectJsonProblems: No disponible en SSR')
    return
  }

  const keys = Object.values(STORAGE_KEYS)
  const problems: Array<{ key: string; issue: string; data: string }> = []

  keys.forEach(key => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        // Detectar problemas específicos
        if (stored === '""' || stored === "''") {
          problems.push({ key, issue: 'Empty quotes', data: stored })
        } else if (stored.includes('""') && stored.length < 5) {
          problems.push({ key, issue: 'Corrupted quotes', data: stored })
        } else if (stored.trim() === '') {
          problems.push({ key, issue: 'Empty string', data: stored })
        } else {
          try {
            JSON.parse(stored)
          } catch (parseError) {
            problems.push({ key, issue: 'Invalid JSON', data: stored.substring(0, 50) + '...' })
          }
        }
      }
    } catch (error) {
      problems.push({ key, issue: 'Access error', data: String(error) })
    }
  })

  if (problems.length > 0) {
    console.warn('❌ Found JSON problems:')
    problems.forEach(problem => {
      console.warn(`  ${problem.key}: ${problem.issue} - ${problem.data}`)
    })
  } else {
  }
}

// Auto-setup en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setupDebugHelpers()
}
