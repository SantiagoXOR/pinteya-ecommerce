/**
 * Hook unificado para lazy loading
 * 
 * Combina múltiples estrategias de lazy loading en una sola API:
 * - viewport: Carga cuando el elemento entra al viewport (IntersectionObserver)
 * - delay: Carga después de un delay fijo
 * - lcp: Carga después de detectar LCP
 * - immediate: Carga inmediatamente
 * - adaptive: Carga basada en rendimiento del dispositivo
 */

'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useProgressiveLoading } from './useProgressiveLoading'
import { useDeferredHydration } from './useDeferredHydration'
import { useLCPDetection } from './useLCPDetection'
import { useDevicePerformance, type PerformanceLevel } from './useDevicePerformance'
import type { LazyStrategy, LazySectionConfig } from '@/config/lazy-loading.config'
import { getLazyDelay } from '@/config/lazy-loading.config'

export interface UseUnifiedLazyLoadingOptions {
  /** Estrategia de lazy loading */
  strategy: LazyStrategy
  /** Margen antes de que el elemento entre al viewport (solo para 'viewport') */
  rootMargin?: string
  /** Threshold para IntersectionObserver (0-1, solo para 'viewport') */
  threshold?: number
  /** Delay en ms (solo para 'delay' o 'adaptive') */
  delay?: number
  /** Si debe respetar el nivel de rendimiento del dispositivo (solo para 'adaptive') */
  respectPerformance?: boolean
  /** Delay key para estrategia 'adaptive' */
  delayKey?: string
  /** Si el componente está deshabilitado */
  disabled?: boolean
}

export interface UseUnifiedLazyLoadingReturn<T extends HTMLElement = HTMLDivElement> {
  /** Ref para asignar al elemento que quieres observar */
  ref: React.RefObject<T>
  /** true cuando el contenido debe mostrarse */
  isVisible: boolean
  /** true cuando el contenido ya se ha cargado al menos una vez */
  hasLoaded: boolean
  /** Forzar la carga manual del contenido */
  forceLoad: () => void
  /** Resetear el estado de carga */
  reset: () => void
}

/**
 * Hook unificado para lazy loading con múltiples estrategias
 */
export function useUnifiedLazyLoading<T extends HTMLElement = HTMLDivElement>({
  strategy,
  rootMargin = '200px',
  threshold = 0.01,
  delay,
  respectPerformance = false,
  delayKey,
  disabled = false,
}: UseUnifiedLazyLoadingOptions): UseUnifiedLazyLoadingReturn<T> {
  const [isVisible, setIsVisible] = useState(strategy === 'immediate')
  const [hasLoaded, setHasLoaded] = useState(strategy === 'immediate')
  const ref = useRef<T>(null)
  const performanceLevel = useDevicePerformance()
  
  // Estrategia: immediate - Cargar inmediatamente
  if (strategy === 'immediate' || disabled) {
    return {
      ref,
      isVisible: true,
      hasLoaded: true,
      forceLoad: () => {},
      reset: () => {},
    }
  }
  
  // Estrategia: viewport - Usar IntersectionObserver
  if (strategy === 'viewport') {
    const {
      ref: viewportRef,
      isVisible: viewportVisible,
      hasLoaded: viewportLoaded,
      forceLoad: viewportForceLoad,
      reset: viewportReset,
    } = useProgressiveLoading<T>({
      rootMargin,
      threshold,
      triggerOnce: true,
      delay: 0,
      disabled,
    })
    
    return {
      ref: viewportRef as React.RefObject<T>,
      isVisible: viewportVisible,
      hasLoaded: viewportLoaded,
      forceLoad: viewportForceLoad,
      reset: viewportReset,
    }
  }
  
  // Estrategia: delay - Cargar después de un delay fijo
  if (strategy === 'delay') {
    const shouldHydrate = useDeferredHydration({
      minDelay: delay || 0,
      maxDelay: delay || 0,
      useIdleCallback: false,
    })
    
    useEffect(() => {
      if (shouldHydrate && !hasLoaded) {
        setIsVisible(true)
        setHasLoaded(true)
      }
    }, [shouldHydrate, hasLoaded])
    
    const forceLoad = useCallback(() => {
      setIsVisible(true)
      setHasLoaded(true)
    }, [])
    
    const reset = useCallback(() => {
      setIsVisible(false)
      setHasLoaded(false)
    }, [])
    
    return {
      ref,
      isVisible,
      hasLoaded,
      forceLoad,
      reset,
    }
  }
  
  // Estrategia: lcp - Cargar después de detectar LCP
  if (strategy === 'lcp') {
    const { shouldLoad: shouldLoadAfterLCP } = useLCPDetection({
      delayAfterLCP: delay || 1000,
      maxWaitTime: delay ? delay * 2 : 3000,
      useIdleCallback: true,
    })
    
    useEffect(() => {
      if (shouldLoadAfterLCP && !hasLoaded) {
        setIsVisible(true)
        setHasLoaded(true)
      }
    }, [shouldLoadAfterLCP, hasLoaded])
    
    const forceLoad = useCallback(() => {
      setIsVisible(true)
      setHasLoaded(true)
    }, [])
    
    const reset = useCallback(() => {
      setIsVisible(false)
      setHasLoaded(false)
    }, [])
    
    return {
      ref,
      isVisible,
      hasLoaded,
      forceLoad,
      reset,
    }
  }
  
  // Estrategia: adaptive - Cargar basado en rendimiento del dispositivo
  if (strategy === 'adaptive') {
    const adaptiveDelay = delayKey
      ? getLazyDelay(delayKey, performanceLevel)
      : delay || 0
    
    const shouldHydrate = useDeferredHydration({
      minDelay: adaptiveDelay,
      maxDelay: adaptiveDelay,
      useIdleCallback: adaptiveDelay > 0,
    })
    
    useEffect(() => {
      if (shouldHydrate && !hasLoaded) {
        setIsVisible(true)
        setHasLoaded(true)
      }
    }, [shouldHydrate, hasLoaded])
    
    const forceLoad = useCallback(() => {
      setIsVisible(true)
      setHasLoaded(true)
    }, [])
    
    const reset = useCallback(() => {
      setIsVisible(false)
      setHasLoaded(false)
    }, [])
    
    return {
      ref,
      isVisible,
      hasLoaded,
      forceLoad,
      reset,
    }
  }
  
  // Fallback: immediate
  return {
    ref,
    isVisible: true,
    hasLoaded: true,
    forceLoad: () => {},
    reset: () => {},
  }
}

/**
 * Helper para crear opciones desde una configuración de sección
 */
export function createLazyOptionsFromConfig(
  config: LazySectionConfig,
  delayKey?: string
): UseUnifiedLazyLoadingOptions {
  return {
    strategy: config.strategy,
    rootMargin: config.rootMargin,
    threshold: config.threshold,
    delay: config.delay,
    respectPerformance: config.respectPerformance,
    delayKey,
  }
}
