/**
 * @deprecated Este hook está deprecado. Usa useProgressiveLoading o useUnifiedLazyLoading en su lugar.
 * 
 * Este hook se mantiene solo para compatibilidad. Internamente usa useProgressiveLoading.
 * 
 * Para nuevo código, usa:
 * - useProgressiveLoading para lazy loading basado en viewport
 * - useUnifiedLazyLoading para estrategias unificadas (viewport, delay, lcp, adaptive)
 */

'use client'

import { RefObject } from 'react'
import { useProgressiveLoading } from './useProgressiveLoading'

/**
 * Hook para detectar cuando un elemento es visible usando IntersectionObserver
 * 
 * @deprecated Usa useProgressiveLoading o useUnifiedLazyLoading en su lugar
 * 
 * @param options - Opciones de IntersectionObserver
 * @returns [ref, isIntersecting] - ref para el elemento e isIntersecting indica si es visible
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [RefObject<HTMLElement>, boolean] {
  const { ref, isVisible } = useProgressiveLoading<HTMLElement>({
    rootMargin: options.rootMargin || '50px',
    threshold: options.threshold || 0.01,
    triggerOnce: false, // Mantener comportamiento original (actualiza cuando entra/sale del viewport)
    disabled: false,
  })

  return [ref, isVisible]
}

