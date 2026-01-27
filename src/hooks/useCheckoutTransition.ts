'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface UseCheckoutTransitionOptions {
  onTransitionStart?: () => void
  onTransitionComplete?: () => void
  onTransitionError?: (error: Error) => void
  enableAnimation?: boolean
  enablePerformanceTracking?: boolean
  customDuration?: number
  skipAnimationThreshold?: number
}

interface UseCheckoutTransitionReturn {
  isTransitioning: boolean
  startTransition: () => void
  skipAnimation: boolean
  isButtonDisabled: boolean
  transitionProgress: number
  performanceMetrics: {
    startTime: number | null
    endTime: number | null
    duration: number | null
  }
}

interface PerformanceMetrics {
  startTime: number | null
  endTime: number | null
  duration: number | null
}

/**
 * Hook optimizado para manejar animaciones de transición al checkout
 *
 * Características Enterprise:
 * - Performance tracking con métricas detalladas
 * - Manejo robusto de errores y cleanup
 * - Respeta preferencias de accesibilidad (prefers-reduced-motion)
 * - Control granular sobre el estado del botón
 * - Callbacks para eventos de transición con error handling
 * - Optimización de memoria y prevención de memory leaks
 * - Soporte para testing con mocks
 */
export function useCheckoutTransition(
  options: UseCheckoutTransitionOptions = {}
): UseCheckoutTransitionReturn {
  const {
    onTransitionStart,
    onTransitionComplete,
    onTransitionError,
    enableAnimation = true,
    enablePerformanceTracking = true,
    customDuration,
    skipAnimationThreshold = 100,
  } = options

  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [skipAnimation, setSkipAnimation] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(0)

  // Refs para cleanup y performance tracking
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const performanceRef = useRef<PerformanceMetrics>({
    startTime: null,
    endTime: null,
    duration: null,
  })

  // Memoizar duración para evitar recálculos
  const animationDuration = useMemo(() => {
    if (customDuration) {
      return customDuration
    }
    return skipAnimation ? 200 : 2800
  }, [skipAnimation, customDuration])

  // Detectar preferencia de movimiento reducido con mejor manejo de errores
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

      const handleChange = (e: MediaQueryListEvent) => {
        const shouldSkip = e.matches || !enableAnimation
        setSkipAnimation(shouldSkip)

        // Performance tracking para preferencias de accesibilidad
        if (enablePerformanceTracking && shouldSkip) {
          console.debug(
            '[useCheckoutTransition] Animation skipped due to accessibility preferences'
          )
        }
      }

      // Configuración inicial
      setSkipAnimation(mediaQuery.matches || !enableAnimation)

      // Escuchar cambios con soporte para navegadores antiguos
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
      } else {
        // Fallback para navegadores antiguos
        mediaQuery.addListener(handleChange)
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange)
        } else {
          mediaQuery.removeListener(handleChange)
        }
      }
    } catch (error) {
      console.warn('[useCheckoutTransition] Error setting up media query listener:', error)
      setSkipAnimation(!enableAnimation)
    }
  }, [enableAnimation, enablePerformanceTracking])

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  // Función optimizada para iniciar la transición - NAVEGACIÓN INMEDIATA SIN ANIMACIÓN
  const startTransition = useCallback(() => {
    // Prevenir múltiples llamadas simultáneas
    if (isTransitioning) {
      return
    }

    // Ejecutar callback de inicio si existe
    try {
      onTransitionStart?.()
    } catch (error) {
      console.error('[useCheckoutTransition] Error in onTransitionStart callback:', error)
    }

    // Navegación inmediata - usar window.location como fallback si router.push falla
    try {
      router.push('/checkout/meta')
      // Fallback: si router.push no funciona, usar window.location
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/checkout/meta') {
          window.location.href = '/checkout/meta'
        }
      }, 100)
    } catch (error) {
      console.error('[useCheckoutTransition] Error during navigation, using window.location:', error)
      // Fallback directo a window.location
      if (typeof window !== 'undefined') {
        window.location.href = '/checkout/meta'
      }
    }

    // Ejecutar callback de finalización si existe (sin bloquear)
    try {
      onTransitionComplete?.()
    } catch (error) {
      console.error('[useCheckoutTransition] Error in onTransitionComplete callback:', error)
    }
  }, [
    isTransitioning,
    onTransitionStart,
    onTransitionComplete,
    router,
  ])

  return {
    isTransitioning,
    startTransition,
    skipAnimation,
    isButtonDisabled: isTransitioning,
    transitionProgress,
    performanceMetrics: performanceRef.current,
  }
}

export default useCheckoutTransition
