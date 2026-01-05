/**
 * Componente que convierte los links CSS generados por Next.js a carga no bloqueante
 * ⚡ OPTIMIZACIÓN: Usa la técnica media="print" que luego cambia a "all" cuando se carga
 * 
 * Este componente intercepta los links CSS generados automáticamente por Next.js
 * y los convierte a carga asíncrona para eliminar render-blocking.
 */

'use client'

import { useEffect } from 'react'

export function NonBlockingCSS() {
  useEffect(() => {
    // Convertir todos los links CSS a carga no bloqueante
    const convertCSSToNonBlocking = () => {
      // Obtener todos los links de stylesheet en el head
      const stylesheets = document.querySelectorAll<HTMLLinkElement>(
        'head link[rel="stylesheet"]'
      )

      stylesheets.forEach((link) => {
        // Solo procesar CSS de Next.js (que tienen hashes o están en _next)
        const href = link.getAttribute('href') || ''
        const isNextJSCSS = href.includes('_next/static/css') || href.includes('.css')

        if (isNextJSCSS && link.media !== 'print') {
          // Ya tiene un onload handler? No procesar de nuevo
          if (link.hasAttribute('data-non-blocking')) {
            return
          }

          // Marcar como procesado
          link.setAttribute('data-non-blocking', 'true')

          // Guardar el media original
          const originalMedia = link.media || 'all'

          // Si ya está cargado, no hacer nada
          if (link.sheet) {
            return
          }

          // ⚡ TÉCNICA: media="print" para carga no bloqueante
          // El navegador descarga el CSS pero no lo aplica hasta que cambiamos a "all"
          link.media = 'print'

          // Cambiar a 'all' cuando se carga
          const onLoad = () => {
            link.media = originalMedia
            link.removeEventListener('load', onLoad)
            link.removeEventListener('error', onError)
          }

          const onError = () => {
            // Si falla, restaurar media original
            link.media = originalMedia
            link.removeEventListener('load', onLoad)
            link.removeEventListener('error', onError)
          }

          link.addEventListener('load', onLoad)
          link.addEventListener('error', onError)

          // Fallback: si después de 3 segundos no se ha cargado, restaurar
          setTimeout(() => {
            if (link.media === 'print') {
              link.media = originalMedia
            }
          }, 3000)
        }
      })
    }

    // Ejecutar inmediatamente para CSS ya presente
    convertCSSToNonBlocking()

    // Ejecutar después de un pequeño delay para CSS que se carga después
    const timeoutId = setTimeout(convertCSSToNonBlocking, 100)

    // Observar cambios en el DOM para CSS que se carga dinámicamente
    const observer = new MutationObserver(() => {
      convertCSSToNonBlocking()
    })

    observer.observe(document.head, {
      childList: true,
      subtree: false,
    })

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [])

  return null
}




















