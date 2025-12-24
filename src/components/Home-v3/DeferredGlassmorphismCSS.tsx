'use client'

import { useEffect } from 'react'

/**
 * ⚡ OPTIMIZACIÓN: Componente para cargar CSS glassmorphism de forma diferida
 * 
 * ⚠️ CRÍTICO: En móviles, NO cargar el CSS glassmorphism para evitar lag
 * El CSS se carga solo en desktop después del FCP para no bloquear el render inicial.
 */
export function DeferredGlassmorphismCSS() {
  useEffect(() => {
    // ⚡ OPTIMIZACIÓN CRÍTICA: Detectar si es móvil y NO cargar CSS glassmorphism
    const isMobile = window.innerWidth <= 768
    const isLowPerformance = 
      (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4 ||
      navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    // ⚡ CRÍTICO: No cargar CSS glassmorphism en móviles o dispositivos de bajo rendimiento
    if (isMobile || isLowPerformance) {
      return // No cargar CSS en móviles para evitar lag
    }
    
    // Solo cargar en desktop después del FCP
    const loadCSS = () => {
      // Importar el CSS dinámicamente después del FCP
      // Esto evita que el CSS bloquee el render inicial
      import('@/styles/home-v3-glassmorphism.css').catch(() => {
        // Si falla, el CSS puede no estar disponible
      })
    }

    // Cargar después de un delay para no interferir con FCP
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadCSS, { timeout: 2000 })
    } else {
      setTimeout(loadCSS, 1500)
    }
  }, [])

  return null
}
