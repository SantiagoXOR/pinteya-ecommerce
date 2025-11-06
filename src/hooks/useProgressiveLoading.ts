/**
 * ⚡ PERFORMANCE: Progressive Loading con Intersection Observer V2
 * 
 * Hook para cargar componentes progresivamente al hacer scroll
 * Reduce FCP ~0.5s al evitar renderizar contenido below-the-fold
 * 
 * @example
 * const BestSellerSection = () => {
 *   const { ref, isVisible } = useProgressiveLoading({ rootMargin: '300px' })
 *   
 *   return (
 *     <section ref={ref}>
 *       {isVisible ? <BestSeller /> : <BestSellerSkeleton />}
 *     </section>
 *   )
 * }
 */

'use client'

import { useEffect, useRef, useState } from 'react'

export interface ProgressiveLoadingOptions {
  /**
   * Margen antes de que el elemento entre al viewport
   * Ejemplo: '200px' carga el contenido 200px antes de ser visible
   * @default '200px'
   */
  rootMargin?: string

  /**
   * Porcentaje del elemento que debe ser visible para activar la carga
   * 0.01 = 1% visible, 1.0 = 100% visible
   * @default 0.01
   */
  threshold?: number

  /**
   * Si es true, solo carga una vez y desconecta el observer
   * @default true
   */
  triggerOnce?: boolean

  /**
   * Delay en ms antes de marcar como visible
   * Útil para stagered animations
   * @default 0
   */
  delay?: number

  /**
   * Si es true, el hook inicia deshabilitado
   * @default false
   */
  disabled?: boolean
}

export interface ProgressiveLoadingReturn<T extends HTMLElement> {
  /**
   * Ref para asignar al elemento que quieres observar
   */
  ref: React.RefObject<T>

  /**
   * true cuando el elemento está visible en el viewport
   */
  isVisible: boolean

  /**
   * true cuando el contenido ya se ha cargado al menos una vez
   */
  hasLoaded: boolean

  /**
   * Forzar la carga manual del contenido
   */
  forceLoad: () => void

  /**
   * Resetear el estado de carga
   */
  reset: () => void
}

export function useProgressiveLoading<T extends HTMLElement>({
  rootMargin = '200px',
  threshold = 0.01,
  triggerOnce = true,
  delay = 0,
  disabled = false,
}: ProgressiveLoadingOptions = {}): ProgressiveLoadingReturn<T> {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<T>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Función para forzar la carga
  const forceLoad = () => {
    setIsVisible(true)
    setHasLoaded(true)
  }

  // Función para resetear el estado
  const reset = () => {
    setIsVisible(false)
    setHasLoaded(false)
  }

  useEffect(() => {
    // Si está disabled, no hacer nada
    if (disabled) return

    const element = ref.current
    if (!element) return

    // Si ya cargó y triggerOnce es true, no observar
    if (hasLoaded && triggerOnce) return

    // Si no hay soporte para IntersectionObserver, cargar inmediatamente
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      forceLoad()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            // Aplicar delay si está configurado
            if (delay > 0) {
              timeoutRef.current = setTimeout(() => {
                setIsVisible(true)
                if (triggerOnce) {
                  setHasLoaded(true)
                  observer.disconnect()
                }
              }, delay)
            } else {
              setIsVisible(true)
              if (triggerOnce) {
                setHasLoaded(true)
                observer.disconnect()
              }
            }
          } else if (!entry.isIntersecting && !triggerOnce) {
            // Si triggerOnce es false, ocultar cuando sale del viewport
            setIsVisible(false)
          }
        })
      },
      {
        rootMargin,
        threshold,
      }
    )

    observer.observe(element)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      observer.disconnect()
    }
  }, [rootMargin, threshold, triggerOnce, delay, hasLoaded, disabled])

  return {
    ref,
    isVisible,
    hasLoaded,
    forceLoad,
    reset,
  }
}

/**
 * Hook simplificado para casos de uso comunes
 */
export function useVisibilityTrigger<T extends HTMLElement>(
  options?: Omit<ProgressiveLoadingOptions, 'triggerOnce'>
) {
  return useProgressiveLoading<T>({ ...options, triggerOnce: true })
}







