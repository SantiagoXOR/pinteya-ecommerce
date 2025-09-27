'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSwipeGestures } from './useSwipeGestures'
import { useRouter } from 'next/navigation'

export interface MobileCheckoutNavigationConfig {
  /** Habilitar gestos de swipe */
  enableSwipeGestures?: boolean
  /** Habilitar vibración háptica */
  enableHapticFeedback?: boolean
  /** Callback cuando se swipe hacia atrás */
  onSwipeBack?: () => void
  /** Callback cuando se swipe hacia adelante */
  onSwipeForward?: () => void
  /** Habilitar navegación por teclado */
  enableKeyboardNavigation?: boolean
}

export interface MobileCheckoutNavigationReturn {
  /** Ref para el contenedor principal */
  containerRef: React.RefObject<HTMLDivElement>
  /** Estado de si está en mobile */
  isMobile: boolean
  /** Función para ir hacia atrás */
  goBack: () => void
  /** Función para ir hacia adelante */
  goForward: () => void
  /** Función para vibración háptica */
  triggerHapticFeedback: (type?: 'light' | 'medium' | 'heavy') => void
  /** Estado de si el usuario está interactuando */
  isInteracting: boolean
}

/**
 * Hook para mejorar la navegación móvil en el checkout
 * Incluye gestos táctiles, feedback háptico y navegación por teclado
 */
export const useMobileCheckoutNavigation = (
  config: MobileCheckoutNavigationConfig = {}
): MobileCheckoutNavigationReturn => {
  const {
    enableSwipeGestures = true,
    enableHapticFeedback = true,
    onSwipeBack,
    onSwipeForward,
    enableKeyboardNavigation = true,
  } = config

  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)

  // Detectar si estamos en mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
        userAgent
      )
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Función para vibración háptica
  const triggerHapticFeedback = useCallback(
    (type: 'light' | 'medium' | 'heavy' = 'light') => {
      if (!enableHapticFeedback || !isMobile) {
        return
      }

      try {
        // Vibración háptica moderna
        if ('vibrate' in navigator) {
          const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
          }
          navigator.vibrate(patterns[type])
        }

        // Feedback háptico en iOS (si está disponible)
        if ('hapticFeedback' in window) {
          const feedbackTypes = {
            light: 'impactLight',
            medium: 'impactMedium',
            heavy: 'impactHeavy',
          }
          // @ts-ignore - API experimental
          window.hapticFeedback?.[feedbackTypes[type]]?.()
        }
      } catch (error) {
        console.debug('Haptic feedback not available:', error)
      }
    },
    [enableHapticFeedback, isMobile]
  )

  // Funciones de navegación
  const goBack = useCallback(() => {
    triggerHapticFeedback('light')
    onSwipeBack?.() || router.back()
  }, [router, triggerHapticFeedback, onSwipeBack])

  const goForward = useCallback(() => {
    triggerHapticFeedback('light')
    onSwipeForward?.()
  }, [triggerHapticFeedback, onSwipeForward])

  // Configurar gestos de swipe
  const containerRef = useSwipeGestures({
    enabled: enableSwipeGestures && isMobile,
    threshold: 80, // Threshold más alto para evitar activaciones accidentales
    preventDefaultTouchmove: true,
    onSwipeRight: () => {
      // Swipe derecha = ir hacia atrás
      setIsInteracting(true)
      goBack()
      setTimeout(() => setIsInteracting(false), 300)
    },
    onSwipeLeft: () => {
      // Swipe izquierda = ir hacia adelante (si está disponible)
      setIsInteracting(true)
      goForward()
      setTimeout(() => setIsInteracting(false), 300)
    },
  })

  // Navegación por teclado
  useEffect(() => {
    if (!enableKeyboardNavigation) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Solo activar si no estamos en un input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          goBack()
          break
        case 'ArrowLeft':
          if (event.altKey) {
            event.preventDefault()
            goBack()
          }
          break
        case 'ArrowRight':
          if (event.altKey) {
            event.preventDefault()
            goForward()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardNavigation, goBack, goForward])

  // Detectar interacciones táctiles
  useEffect(() => {
    if (!isMobile) {
      return
    }

    const handleTouchStart = () => setIsInteracting(true)
    const handleTouchEnd = () => {
      setTimeout(() => setIsInteracting(false), 100)
    }

    const element = containerRef.current
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true })
      element.addEventListener('touchend', handleTouchEnd, { passive: true })

      return () => {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isMobile, containerRef])

  return {
    containerRef,
    isMobile,
    goBack,
    goForward,
    triggerHapticFeedback,
    isInteracting,
  }
}

export default useMobileCheckoutNavigation
