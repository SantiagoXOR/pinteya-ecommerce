/**
 * Componente para cargar CSS no crítico de forma asíncrona
 * Mejora FCP al no bloquear el renderizado inicial
 * 
 * Técnica: Carga CSS con media="print" inicialmente, luego cambia a "all"
 * Esto permite que el navegador descargue el CSS sin bloquear el renderizado
 */

'use client'

import { useEffect } from 'react'

interface AsyncCSSLoaderProps {
  /**
   * Ruta relativa al CSS desde la raíz pública
   * Ejemplo: '/styles/checkout-mobile.css'
   */
  href: string
  /**
   * Media query inicial (default: 'print' para carga asíncrona)
   */
  media?: string
}

export function AsyncCSSLoader({ href, media = 'print' }: AsyncCSSLoaderProps) {
  useEffect(() => {
    // Esperar a que el DOM esté listo y después del FCP
    const loadCSS = () => {
      // Verificar si el CSS ya está cargado
      const existingLink = document.querySelector(`link[href="${href}"]`)
      if (existingLink) {
        return
      }

      // Crear link element para CSS asíncrono
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.media = media

      // Cambiar a 'all' cuando se carga para aplicar estilos
      link.onload = () => {
        link.media = 'all'
      }

      // Manejar errores silenciosamente (no crítico)
      link.onerror = () => {
        // Solo log en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Failed to load non-critical CSS: ${href}`)
        }
      }

      document.head.appendChild(link)
    }

    // Cargar después de un pequeño delay para no interferir con FCP
    // Usar requestIdleCallback si está disponible, sino setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadCSS, { timeout: 2000 })
    } else {
      setTimeout(loadCSS, 100)
    }
  }, [href, media])

  return null
}

