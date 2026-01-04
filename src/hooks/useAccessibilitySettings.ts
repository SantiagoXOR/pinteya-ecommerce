'use client'

import * as React from 'react'

export interface AccessibilitySettings {
  isLargeText: boolean
  prefersReducedMotion: boolean
}

/**
 * Hook para detectar preferencias de accesibilidad del sistema
 * - Detecta tipografía grande del sistema
 * - Detecta preferencia de movimiento reducido
 */
export const useAccessibilitySettings = (): AccessibilitySettings => {
  const [isLargeText, setIsLargeText] = React.useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    // Detectar tipografía grande
    // Usamos múltiples media queries para compatibilidad
    const checkLargeText = () => {
      // Media query estándar para tipografía grande
      const largeTextQuery = window.matchMedia('(prefers-font-size: large)')
      // Fallback: detectar si el tamaño de fuente base es mayor
      const minFontSizeQuery = window.matchMedia('(min-width: 1px)')
      
      // Verificar tamaño de fuente del sistema
      const computedStyle = window.getComputedStyle(document.documentElement)
      const fontSize = parseFloat(computedStyle.fontSize)
      
      // Considerar tipografía grande si:
      // 1. La media query indica large
      // 2. El tamaño de fuente base es >= 18px (típico para accesibilidad)
      const isLarge = largeTextQuery.matches || fontSize >= 18
      
      setIsLargeText(isLarge)
    }

    // Detectar movimiento reducido
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(reducedMotionQuery.matches)

    // Verificar inicialmente
    checkLargeText()

    // Listeners para cambios
    const largeTextHandler = (e: MediaQueryListEvent) => {
      setIsLargeText(e.matches)
    }

    const reducedMotionHandler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    // Agregar listeners
    const largeTextQuery = window.matchMedia('(prefers-font-size: large)')
    largeTextQuery.addEventListener('change', largeTextHandler)
    reducedMotionQuery.addEventListener('change', reducedMotionHandler)

    // Verificar periódicamente el tamaño de fuente (por si cambia dinámicamente)
    const intervalId = setInterval(checkLargeText, 1000)

    return () => {
      largeTextQuery.removeEventListener('change', largeTextHandler)
      reducedMotionQuery.removeEventListener('change', reducedMotionHandler)
      clearInterval(intervalId)
    }
  }, [])

  return { isLargeText, prefersReducedMotion }
}




