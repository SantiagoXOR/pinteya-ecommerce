/**
 * Componente de Meta Pixel para Pinteya E-commerce
 * Maneja la carga e inicialización del pixel de Facebook/Instagram
 */

'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import {
  initMetaPixel,
  trackPageView,
  META_PIXEL_ID,
  isMetaPixelEnabled,
  waitForMetaPixel,
} from '@/lib/meta-pixel'

const MetaPixel: React.FC = () => {
  const pathname = usePathname()
  const [isPixelLoaded, setIsPixelLoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)

  // ⚡ CRITICAL: Cargar Meta Pixel solo después de LCP y primera interacción del usuario
  // Esto evita que Meta Pixel bloquee la ruta crítica (5,863ms según Lighthouse)
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
      const loadPixel = () => {
        // ⚡ OPTIMIZACIÓN: Solo cargar si usuario está activo o después de delay extendido
        if (userActive) {
          setShouldLoad(true)
        } else {
          // Si usuario está inactivo, esperar más tiempo
          inactiveLoadTimeout = setTimeout(() => {
            if (!userActive) {
              setShouldLoad(true) // Cargar de todas formas después de delay extendido
            }
          }, 10000) // 10 segundos si usuario está inactivo
        }
      }

      // ⚡ OPTIMIZACIÓN: Detectar actividad del usuario (mouse movement, scroll, etc.)
      const activityEvents = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'scroll', 'pointerdown', 'pointermove']
      activityEvents.forEach(event => {
        document.addEventListener(event, markUserActive, { passive: true })
        activityListeners.push({ event, handler: markUserActive })
      })

      // Opción 1: Cargar después de interacción del usuario
      const interactionEvents = ['mousedown', 'touchstart', 'keydown', 'scroll']
      const onInteraction = () => {
        markUserActive()
        loadPixel()
      }

      interactionEvents.forEach(event => {
        document.addEventListener(event, onInteraction, { passive: true, once: true })
        interactionListeners.push({ event, handler: onInteraction })
      })

      // ⚡ OPTIMIZACIÓN: Aumentar delay a 6 segundos para dar más tiempo al contenido principal
      loadTimeout = setTimeout(loadPixel, 6000) // 6 segundos después de carga inicial (aumentado de 3s)
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

  // Manejar cuando Meta Pixel está listo
  const handlePixelLoad = async () => {
    try {
      if (typeof window !== 'undefined') {
        await waitForMetaPixel()
        setIsPixelLoaded(true)
      }
    } catch (error) {
      console.warn('Error loading Meta Pixel:', error)
      setIsPixelLoaded(false)
    }
  }

  // Track page views cuando el pixel está listo y cambia la ruta
  useEffect(() => {
    if (isPixelLoaded && isMetaPixelEnabled() && typeof window !== 'undefined') {
      try {
        trackPageView()
      } catch (error) {
        console.warn('Error tracking Meta Pixel page view:', error)
      }
    }
  }, [pathname, isPixelLoaded])

  // Solo renderizar si tenemos META_PIXEL_ID válido
  if (!META_PIXEL_ID || META_PIXEL_ID.length < 10) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ Meta Pixel no configurado. Configura NEXT_PUBLIC_META_PIXEL_ID en .env.local'
      )
    }
    return null
  }

  // ⚡ CRITICAL: No cargar Meta Pixel hasta después de LCP e interacción
  if (!shouldLoad) {
    return null
  }

  return (
    <>
      {META_PIXEL_ID && META_PIXEL_ID.length >= 10 && (
        <>
          {/* ⚡ PERFORMANCE: Carga diferida después de LCP e interacción para evitar bloqueo de ruta crítica */}
          <Script
            id='meta-pixel'
            strategy='lazyOnload'
            onLoad={handlePixelLoad}
            onError={error => {
              console.warn('Error loading Meta Pixel script:', error)
              setIsPixelLoaded(false)
            }}
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
          {/* Noscript fallback para usuarios sin JavaScript */}
          <noscript>
            <img
              height='1'
              width='1'
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=''
            />
          </noscript>
        </>
      )}
    </>
  )
}

export default MetaPixel


