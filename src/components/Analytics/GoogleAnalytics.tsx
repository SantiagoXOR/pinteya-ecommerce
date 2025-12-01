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
import { useSlowConnection } from '@/hooks/useSlowConnection'

const GoogleAnalytics: React.FC = () => {
  const pathname = usePathname()
  const [isGALoaded, setIsGALoaded] = useState(false)
  const isSlowConnection = useSlowConnection()

  // Manejar cuando GA está listo
  const handleGALoad = async () => {
    try {
      if (typeof window !== 'undefined') {
        await waitForGA()
        setIsGALoaded(true)
        
        // Configurar Google Ads después de que GA esté listo
        if (window.gtag) {
          window.gtag('config', 'AW-17767977006')
        }
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

  // ID de Google tag proporcionado por Google Ads
  const GOOGLE_TAG_ID = 'G-MN070Y406E'
  const GOOGLE_ADS_ID = 'AW-17767977006'

  return (
    <>
      {GA_TRACKING_ID && GA_TRACKING_ID !== 'G-XXXXXXXXXX' && GA_TRACKING_ID.length >= 10 && (
        <>
          {/* ⚡ PERFORMANCE: lazyOnload carga GA DESPUÉS de FCP (-0.2s) */}
          {/* ⚡ PERFORMANCE: En conexiones lentas, usar requestIdleCallback para cargar aún más tarde */}
          {isSlowConnection ? (
            <Script
              strategy='lazyOnload'
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
              onLoad={() => {
                // En conexiones lentas, agregar delay adicional
                if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                  requestIdleCallback(handleGALoad, { timeout: 5000 })
                } else {
                  setTimeout(handleGALoad, 2000)
                }
              }}
              onError={error => {
                console.warn('Error loading Google Analytics script:', error)
                setIsGALoaded(false)
              }}
            />
          ) : (
            <Script
              strategy='lazyOnload'
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
              onLoad={handleGALoad}
              onError={error => {
                console.warn('Error loading Google Analytics script:', error)
                setIsGALoaded(false)
              }}
            />
          )}
          {/* Cargar también el script de Google tag con G-MN070Y406E si es diferente */}
          {GA_TRACKING_ID !== GOOGLE_TAG_ID && (
            <Script
              strategy='lazyOnload'
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
            />
          )}
          {isSlowConnection ? (
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
                  ${GA_TRACKING_ID !== GOOGLE_TAG_ID ? `gtag('config', '${GOOGLE_TAG_ID}');` : ''}
                  gtag('config', '${GOOGLE_ADS_ID}');
                `,
              }}
              onError={error => {
                console.warn('Error executing Google Analytics script:', error)
              }}
            />
          ) : (
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
                  ${GA_TRACKING_ID !== GOOGLE_TAG_ID ? `gtag('config', '${GOOGLE_TAG_ID}');` : ''}
                  gtag('config', '${GOOGLE_ADS_ID}');
                `,
              }}
              onError={error => {
                console.warn('Error executing Google Analytics script:', error)
              }}
            />
          )}
          {/* Script adicional para asegurar que Google tag se carga correctamente */}
          {GA_TRACKING_ID === GOOGLE_TAG_ID && (
            <Script
              id='google-tag-verification'
              strategy='lazyOnload'
              dangerouslySetInnerHTML={{
                __html: `
                  // Verificación adicional para Google tag G-MN070Y406E
                  if (typeof window.gtag === 'function') {
                    window.gtag('config', '${GOOGLE_TAG_ID}');
                  }
                `,
              }}
            />
          )}
        </>
      )}
    </>
  )
}

export default GoogleAnalytics
