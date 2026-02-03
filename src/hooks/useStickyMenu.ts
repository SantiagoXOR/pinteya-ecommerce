/**
 * Hook para manejar el comportamiento sticky de menús/headers
 * Basado en el scroll del usuario con threshold configurable
 */

import { useState, useEffect } from 'react'

interface UseStickyMenuReturn {
  isSticky: boolean
}

/**
 * Hook que detecta cuando el scroll supera un threshold para activar sticky behavior
 * @param threshold - Posición de scroll en píxeles para activar sticky (default: 80)
 * @returns objeto con isSticky boolean
 */
export const useStickyMenu = (threshold: number = 80): UseStickyMenuReturn => {
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const throttleMs = 120
    let lastExecution = 0
    let frameId: number | null = null

    const updateStickyState = () => {
      frameId = null
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0
      setIsSticky(scrollY > threshold)
    }

    const handleScroll = () => {
      const now = performance.now()
      if (now - lastExecution < throttleMs) {
        return
      }
      lastExecution = now

      if (frameId !== null) {
        return
      }

      frameId = requestAnimationFrame(updateStickyState)
    }

    updateStickyState()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [threshold])

  return { isSticky }
}

export default useStickyMenu
