/**
 * Componente para cargar CSS de forma diferida
 * Importa CSS solo cuando el componente se monta (después del FCP)
 */

'use client'

import { useEffect } from 'react'

export function DeferredCSS() {
  useEffect(() => {
    // Cargar CSS no crítico después del FCP usando requestIdleCallback
    const loadDeferredCSS = () => {
      // Importar CSS dinámicamente solo cuando el navegador está listo
      import('@/styles/checkout-mobile.css')
      import('@/styles/z-index-hierarchy.css')
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

