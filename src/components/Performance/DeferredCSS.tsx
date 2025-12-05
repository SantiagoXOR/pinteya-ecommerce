/**
 * Componente para cargar CSS de forma diferida
 * Usa técnica media="print" para cargar CSS sin bloquear renderizado
 * ⚡ OPTIMIZACIÓN: Reduce bloqueo de renderizado en 810ms según Lighthouse
 */

'use client'

import { useEffect } from 'react'

export function DeferredCSS() {
  useEffect(() => {
    // Cargar CSS no crítico después del FCP usando técnica media="print"
    const loadDeferredCSS = () => {
      // Lista de CSS no críticos que pueden cargarse asíncronamente
      const nonCriticalCSS = [
        '@/styles/checkout-mobile.css',
        '@/styles/z-index-hierarchy.css',
      ]

      // Cargar cada CSS usando técnica media="print"
      nonCriticalCSS.forEach((cssPath) => {
        // Verificar si ya está cargado
        const existingLink = document.querySelector(`link[href*="${cssPath.split('/').pop()}"]`)
        if (existingLink) {
          return
        }

        // Crear link element con media="print" inicialmente
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = cssPath.replace('@/', '/')
        link.media = 'print'
        
        // Cambiar a 'all' cuando se carga para aplicar estilos
        link.onload = () => {
          link.media = 'all'
        }

        // Manejar errores silenciosamente
        link.onerror = () => {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Failed to load non-critical CSS: ${cssPath}`)
          }
        }

        document.head.appendChild(link)
      })
    }

    // Usar requestIdleCallback si está disponible para no interferir con el renderizado crítico
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadDeferredCSS, { timeout: 2000 })
    } else {
      // Fallback para navegadores que no soportan requestIdleCallback
      setTimeout(loadDeferredCSS, 100)
    }
  }, [])

  return null
}

