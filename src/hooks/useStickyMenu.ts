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
    const handleScroll = () => {
      // Obtener posición de scroll con fallback para compatibilidad
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0

      // Activar sticky si el scroll supera el threshold
      setIsSticky(scrollY > threshold)
    }

    // Agregar event listener para scroll
    window.addEventListener('scroll', handleScroll)

    // Cleanup: remover event listener al desmontar
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return { isSticky }
}

export default useStickyMenu
