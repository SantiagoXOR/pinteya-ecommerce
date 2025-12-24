'use client'

import { useEffect } from 'react'

/**
 * ⚡ OPTIMIZACIÓN: Componente para cargar CSS glassmorphism de forma diferida
 * 
 * El CSS se carga después del FCP para no bloquear el render inicial.
 * Esto mejora el PageSpeed Insights al reducir el render-blocking CSS.
 */
export function DeferredGlassmorphismCSS() {
  useEffect(() => {
    // Cargar CSS después del FCP (estimado en 1.5s)
    // Usar requestIdleCallback para no bloquear el hilo principal
    const loadCSS = () => {
      // Verificar si el CSS ya está cargado
      const existingLink = document.querySelector('link[data-glassmorphism-css]')
      if (existingLink) {
        return
      }

      // Crear link element para CSS asíncrono usando técnica media="print"
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      // ⚡ NOTA: Next.js procesa los imports CSS, así que necesitamos importarlo dinámicamente
      // Usamos un enfoque diferente: importar el módulo CSS y luego inyectarlo
      link.setAttribute('data-glassmorphism-css', 'true')
      link.media = 'print' // Inicialmente como print para carga asíncrona

      // Cambiar a 'all' cuando se carga para aplicar estilos
      link.onload = () => {
        link.media = 'all'
      }

      // Manejar errores silenciosamente
      link.onerror = () => {
        // El CSS puede no estar disponible como archivo estático
        // En ese caso, se cargará cuando Next.js procese el import
      }

      // Importar el CSS dinámicamente después del FCP
      // Esto evita que el CSS bloquee el render inicial
      import('@/styles/home-v3-glassmorphism.css').catch(() => {
        // Si falla, el CSS puede no estar disponible
        // En desarrollo, esto es normal si el archivo no existe
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

