/**
 * Hook para diferir la hidratación de componentes no críticos
 * Usa requestIdleCallback para no bloquear el main thread
 */

import { useEffect, useState, useCallback } from 'react'

interface UseDeferredHydrationOptions {
  /**
   * Tiempo mínimo de espera antes de hidratar (ms)
   * @default 0
   */
  minDelay?: number
  
  /**
   * Tiempo máximo de espera si requestIdleCallback no está disponible (ms)
   * @default 2000
   */
  maxDelay?: number
  
  /**
   * Si debe usar requestIdleCallback
   * @default true
   */
  useIdleCallback?: boolean
  
  /**
   * Callback cuando la hidratación se activa
   */
  onHydrate?: () => void
}

/**
 * Hook para diferir la hidratación de componentes no críticos
 * Optimizado para reducir main thread work durante la carga inicial
 */
export const useDeferredHydration = (
  options: UseDeferredHydrationOptions = {}
): boolean => {
  const {
    minDelay = 0,
    maxDelay = 2000,
    useIdleCallback = true,
    onHydrate,
  } = options

  const [shouldHydrate, setShouldHydrate] = useState(false)

  const hydrate = useCallback(() => {
    setShouldHydrate(true)
    if (onHydrate) {
      onHydrate()
    }
  }, [onHydrate])

  useEffect(() => {
    // ⚡ OPTIMIZACIÓN: Esperar tiempo mínimo antes de hidratar
    const minDelayTimeout = setTimeout(() => {
      if (useIdleCallback && 'requestIdleCallback' in window) {
        // ⚡ OPTIMIZACIÓN: Usar requestIdleCallback para no bloquear main thread
        requestIdleCallback(
          () => {
            hydrate()
          },
          { timeout: maxDelay }
        )
      } else {
        // ⚡ FALLBACK: Usar setTimeout si requestIdleCallback no está disponible
        setTimeout(() => {
          hydrate()
        }, maxDelay)
      }
    }, minDelay)

    return () => {
      clearTimeout(minDelayTimeout)
    }
  }, [minDelay, maxDelay, useIdleCallback, hydrate])

  return shouldHydrate
}

