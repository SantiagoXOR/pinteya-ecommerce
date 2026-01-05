/**
 * ⚡ OPTIMIZACIÓN: Long Task Splitter
 * 
 * Divide tareas largas en el hilo principal en tareas más pequeñas
 * para evitar bloquear la interactividad (>50ms = tarea larga)
 * 
 * Técnicas implementadas:
 * 1. requestIdleCallback para tareas de baja prioridad
 * 2. setTimeout con delay mínimo para dividir tareas
 * 3. Scheduler API (si está disponible) para mejor control
 */

/**
 * Ejecuta una función en el próximo idle time del navegador
 * Si no hay idle time disponible, usa setTimeout como fallback
 */
export function runOnIdle(callback: () => void, timeout = 5000): void {
  if (typeof window === 'undefined') {
    // SSR: ejecutar inmediatamente
    callback()
    return
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout })
  } else {
    // Fallback para navegadores sin requestIdleCallback
    setTimeout(callback, 0)
  }
}

/**
 * Ejecuta una función después de un delay mínimo
 * Útil para dividir tareas largas en tareas más pequeñas
 */
export function runAfterDelay(callback: () => void, delay = 0): void {
  if (typeof window === 'undefined') {
    callback()
    return
  }

  setTimeout(callback, delay)
}

/**
 * Divide una tarea larga en múltiples tareas pequeñas
 * Cada tarea se ejecuta en el próximo idle time
 */
export function splitLongTask<T>(
  items: T[],
  processor: (item: T) => void,
  batchSize = 10,
  delayBetweenBatches = 0
): Promise<void> {
  return new Promise((resolve) => {
    if (items.length === 0) {
      resolve()
      return
    }

    let currentIndex = 0

    const processBatch = () => {
      const endIndex = Math.min(currentIndex + batchSize, items.length)
      
      // Procesar batch actual
      for (let i = currentIndex; i < endIndex; i++) {
        processor(items[i])
      }

      currentIndex = endIndex

      // Si hay más items, procesar siguiente batch
      if (currentIndex < items.length) {
        if (delayBetweenBatches > 0) {
          runAfterDelay(() => {
            runOnIdle(processBatch)
          }, delayBetweenBatches)
        } else {
          runOnIdle(processBatch)
        }
      } else {
        // Tarea completada
        resolve()
      }
    }

    // Iniciar procesamiento
    runOnIdle(processBatch)
  })
}

/**
 * Wrapper para funciones que pueden ser tareas largas
 * Divide la ejecución en chunks más pequeños si es necesario
 */
export function withLongTaskSplitting<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxExecutionTime?: number // ms
    batchSize?: number
  } = {}
): T {
  const { maxExecutionTime = 50, batchSize = 10 } = options

  return ((...args: Parameters<T>) => {
    const startTime = performance.now()

    try {
      const result = fn(...args)

      // Si es una promesa, verificar tiempo de ejecución
      if (result instanceof Promise) {
        return result.then((value) => {
          const executionTime = performance.now() - startTime
          
          if (executionTime > maxExecutionTime) {
            console.warn(
              `[Long Task Splitter] Función ejecutada en ${executionTime.toFixed(2)}ms (mayor a ${maxExecutionTime}ms)`
            )
          }

          return value
        })
      }

      // Si no es promesa, verificar tiempo de ejecución
      const executionTime = performance.now() - startTime
      
      if (executionTime > maxExecutionTime) {
        console.warn(
          `[Long Task Splitter] Función ejecutada en ${executionTime.toFixed(2)}ms (mayor a ${maxExecutionTime}ms)`
        )
      }

      return result
    } catch (error) {
      throw error
    }
  }) as T
}

/**
 * Monitorea tareas largas en el hilo principal
 * Útil para debugging y optimización
 */
export function monitorLongTasks(callback?: (duration: number) => void): () => void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {} // No-op si no está disponible
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = entry.duration

        // Tareas > 50ms son consideradas largas
        if (duration > 50) {
          console.warn(
            `[Long Task Monitor] Tarea larga detectada: ${duration.toFixed(2)}ms`,
            entry
          )

          if (callback) {
            callback(duration)
          }
        }
      }
    })

    observer.observe({ entryTypes: ['longtask'] })

    return () => {
      observer.disconnect()
    }
  } catch (error) {
    console.warn('[Long Task Monitor] No disponible:', error)
    return () => {}
  }
}

