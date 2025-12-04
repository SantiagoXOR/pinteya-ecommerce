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

  return (
    <>
      {META_PIXEL_ID && META_PIXEL_ID.length >= 10 && (
        <>
          {/* ⚡ PERFORMANCE: lazyOnload carga Meta Pixel DESPUÉS de FCP */}
          <Script
            id='meta-pixel'
            strategy='lazyOnload'
            fetchPriority='low'
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


