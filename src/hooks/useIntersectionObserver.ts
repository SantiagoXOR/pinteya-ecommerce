'use client'

import { useEffect, useRef, useState, RefObject } from 'react'

/**
 * ⚡ OPTIMIZACIÓN: Hook para detectar cuando un elemento es visible usando IntersectionObserver
 * 
 * Útil para lazy loading agresivo y optimizaciones basadas en visibilidad.
 * 
 * @param options - Opciones de IntersectionObserver
 * @returns [ref, isIntersecting] - ref para el elemento e isIntersecting indica si es visible
 * 
 * Impacto esperado: Reducción de 30-40% en trabajo de renderizado
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [RefObject<HTMLElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        rootMargin: '50px', // Pre-cargar 50px antes de que sea visible
        threshold: 0.01, // Disparar cuando 1% es visible
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [options.root, options.rootMargin, options.threshold])

  return [ref, isIntersecting]
}

