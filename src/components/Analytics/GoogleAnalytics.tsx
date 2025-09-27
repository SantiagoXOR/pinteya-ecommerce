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

  return (
    <>
      {GA_TRACKING_ID && GA_TRACKING_ID !== 'G-XXXXXXXXXX' && GA_TRACKING_ID.length >= 10 && (
        <>
          <Script
            strategy='afterInteractive'
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            onLoad={handleGALoad}
            onError={error => {
              console.warn('Error loading Google Analytics script:', error)
              setIsGALoaded(false)
            }}
          />
          <Script
            id='google-analytics'
            strategy='afterInteractive'
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
