/**
 * Componente de Google Analytics para Pinteya E-commerce
 * Maneja la carga e inicialización de GA4
 */

'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import {
  initGA,
  trackPageView,
  GA_TRACKING_ID,
  isGAEnabled,
  waitForGA,
} from '@/lib/google-analytics'

const GoogleAnalytics: React.FC = () => {
  const pathname = usePathname()
  const [isGALoaded, setIsGALoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)

  // ⚡ CRITICAL: Cargar analytics solo después de LCP y primera interacción del usuario
  // Esto evita que Google Tag Manager (153 KiB, 162 ms) bloquee la ruta crítica
  useEffect(() => {
    // Esperar a que el LCP se complete y el usuario interactúe
    const loadAfterLCP = () => {
      // Cargar después de LCP estimado (2.5s) o primera interacción
      const loadAnalytics = () => {
        setShouldLoad(true)
      }

      // ⚡ OPTIMIZACIÓN: Cargar después de interacción del usuario (más agresivo)
      // Esto asegura que el contenido principal se carga primero
      const events = ['mousedown', 'touchstart', 'keydown', 'scroll', 'pointerdown']
      const onInteraction = () => {
        loadAnalytics()
        // ⚡ NOTA: No es necesario removeEventListener porque once: true lo hace automáticamente
      }

      events.forEach(event => {
        document.addEventListener(event, onInteraction, { passive: true, once: true })
      })

      // ⚡ OPTIMIZACIÓN: Aumentar delay a 4 segundos para dar más tiempo al contenido principal
      // Google Tag Manager es pesado (153 KiB), mejor cargarlo después de que todo esté listo
      setTimeout(loadAnalytics, 4000) // 4 segundos después de carga inicial (vs 3s anterior)
    }

    // Esperar a que el DOM esté listo
    if (document.readyState === 'complete') {
      loadAfterLCP()
    } else {
      window.addEventListener('load', loadAfterLCP, { once: true })
    }
  }, [])

  // Manejar cuando GA está listo
  const handleGALoad = async () => {
    try {
      if (typeof window !== 'undefined') {
        await waitForGA()
        setIsGALoaded(true)
      }
    } catch (error) {
      console.warn('Error loading Google Analytics:', error)
      setIsGALoaded(false)
    }
  }

  // Track page views cuando GA está listo y cambia la ruta
  useEffect(() => {
    if (isGALoaded && isGAEnabled() && typeof window !== 'undefined') {
      try {
        trackPageView(window.location.href)
      } catch (error) {
        console.warn('Error tracking page view:', error)
      }
    }
  }, [pathname, isGALoaded])

  // Solo renderizar si tenemos GA_TRACKING_ID válido
  if (!GA_TRACKING_ID || GA_TRACKING_ID === 'G-XXXXXXXXXX' || GA_TRACKING_ID.length < 10) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Google Analytics no configurado. Configura NEXT_PUBLIC_GA_ID en .env.local')
    }
    return null
  }

  // ⚡ CRITICAL: No cargar analytics hasta después de LCP e interacción
  if (!shouldLoad) {
    return null
  }

  return (
    <>
      {GA_TRACKING_ID && GA_TRACKING_ID !== 'G-XXXXXXXXXX' && GA_TRACKING_ID.length >= 10 && (
        <>
          {/* ⚡ PERFORMANCE: Carga diferida después de LCP e interacción para evitar bloqueo de ruta crítica */}
          <Script
            strategy='lazyOnload'
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            onLoad={handleGALoad}
            onError={error => {
              console.warn('Error loading Google Analytics script:', error)
              setIsGALoaded(false)
            }}
          />
          <Script
            id='google-analytics'
            strategy='lazyOnload'
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_TRACKING_ID}', {
                  page_title: document.title,
                  page_location: window.location.href,
                  send_page_view: false
                });
              `,
            }}
            onError={error => {
              console.warn('Error executing Google Analytics script:', error)
            }}
          />
        </>
      )}
    </>
  )
}

export default GoogleAnalytics
