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
    let userActive = false
    let idleTimer: NodeJS.Timeout | null = null
    let loadTimeout: NodeJS.Timeout | null = null
    let inactiveLoadTimeout: NodeJS.Timeout | null = null
    const IDLE_THRESHOLD = 10000 // 10 segundos de inactividad

    // ⚡ FIX: Guardar referencias a listeners para poder removerlos
    const activityListeners: Array<{ event: string; handler: () => void }> = []
    const interactionListeners: Array<{ event: string; handler: () => void }> = []
    let loadHandler: (() => void) | null = null

    // ⚡ OPTIMIZACIÓN: Detectar actividad del usuario
    const markUserActive = () => {
      userActive = true
      if (idleTimer) {
        clearTimeout(idleTimer)
      }
      // Resetear idle timer
      idleTimer = setTimeout(() => {
        userActive = false
      }, IDLE_THRESHOLD)
    }

    // Esperar a que el LCP se complete y el usuario interactúe
    const loadAfterLCP = () => {
      // Cargar después de LCP estimado (2.5s) o primera interacción
      const loadAnalytics = () => {
        // ⚡ OPTIMIZACIÓN: Solo cargar si usuario está activo o después de delay extendido
        if (userActive) {
          setShouldLoad(true)
        } else {
          // Si usuario está inactivo, esperar más tiempo
          inactiveLoadTimeout = setTimeout(() => {
            if (!userActive) {
              setShouldLoad(true) // Cargar de todas formas después de delay extendido
            }
          }, 12000) // 12 segundos si usuario está inactivo
        }
      }

      // ⚡ OPTIMIZACIÓN: Detectar actividad del usuario (mouse movement, scroll, etc.)
      const activityEvents = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'scroll', 'pointerdown', 'pointermove']
      activityEvents.forEach(event => {
        document.addEventListener(event, markUserActive, { passive: true })
        activityListeners.push({ event, handler: markUserActive })
      })

      // ⚡ OPTIMIZACIÓN: Cargar después de interacción del usuario o después de LCP + delay
      // ⚡ FASE 18: Aumentar delay para cargar analytics más tarde (reduce unused JS)
      const interactionEvents = ['mousedown', 'touchstart', 'keydown', 'scroll', 'pointerdown']
      const onInteraction = () => {
        markUserActive()
        // ⚡ FASE 18: Delay adicional de 2s después de interacción para no bloquear LCP
        setTimeout(() => {
          loadAnalytics()
        }, 2000)
      }

      interactionEvents.forEach(event => {
        document.addEventListener(event, onInteraction, { passive: true, once: true })
        interactionListeners.push({ event, handler: onInteraction })
      })

      // ⚡ OPTIMIZACIÓN: Aumentar delay a 8 segundos para dar más tiempo al contenido principal
      // Google Tag Manager es pesado (153 KiB), mejor cargarlo después de que todo esté listo
      loadTimeout = setTimeout(loadAnalytics, 8000) // 8 segundos después de carga inicial (aumentado de 4s)
      loadHandler = loadAfterLCP
    }

    // Esperar a que el DOM esté listo
    if (document.readyState === 'complete') {
      loadAfterLCP()
    } else {
      window.addEventListener('load', loadAfterLCP, { once: true })
      loadHandler = loadAfterLCP
    }

    // ⚡ FIX: Cleanup completo - remover todos los listeners
    return () => {
      // Limpiar timers
      if (idleTimer) {
        clearTimeout(idleTimer)
      }
      if (loadTimeout) {
        clearTimeout(loadTimeout)
      }
      if (inactiveLoadTimeout) {
        clearTimeout(inactiveLoadTimeout)
      }

      // Remover activity listeners
      activityListeners.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler)
      })

      // Remover interaction listeners (aunque usan once: true, es mejor ser explícito)
      interactionListeners.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler)
      })

      // Remover load handler si existe
      if (loadHandler) {
        window.removeEventListener('load', loadHandler)
      }
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
