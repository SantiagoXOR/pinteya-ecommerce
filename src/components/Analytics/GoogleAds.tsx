/**
 * Componente de Google Ads Conversion Tracking para Pinteya E-commerce
 * Maneja la carga e inicialización del tag de conversión de Google Ads
 */

'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import {
  initGoogleAds,
  GOOGLE_ADS_CONVERSION_ID,
  GOOGLE_ADS_CONVERSION_LABEL,
  isGoogleAdsEnabled,
  waitForGoogleAds,
} from '@/lib/google-ads'

const GoogleAds: React.FC = () => {
  const [isGoogleAdsLoaded, setIsGoogleAdsLoaded] = useState(false)

  // Manejar cuando Google Ads está listo
  const handleGoogleAdsLoad = async () => {
    try {
      if (typeof window !== 'undefined') {
        await waitForGoogleAds()
        initGoogleAds()
        setIsGoogleAdsLoaded(true)
      }
    } catch (error) {
      console.warn('[Google Ads] Error loading Google Ads:', error)
      setIsGoogleAdsLoaded(false)
    }
  }

  // Solo renderizar si tenemos las variables de entorno configuradas
  if (
    !GOOGLE_ADS_CONVERSION_ID ||
    !GOOGLE_ADS_CONVERSION_LABEL ||
    GOOGLE_ADS_CONVERSION_ID === 'AW-XXXXXXXXX' ||
    GOOGLE_ADS_CONVERSION_LABEL === 'XXXXXXXXX' ||
    GOOGLE_ADS_CONVERSION_ID.length < 10
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        '⚠️ Google Ads no configurado. Configura NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID y NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL en .env.local'
      )
    }
    return null
  }

  // Google Ads usa el mismo gtag que Google Analytics, así que no necesitamos cargar un script adicional
  // Solo inicializamos cuando GA está listo
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      handleGoogleAdsLoad()
    }
  }, [])

  // No necesitamos renderizar scripts adicionales porque Google Ads usa el mismo gtag de GA4
  // El tracking se hace a través de las funciones en google-ads.ts que usan gtag
  return null
}

export default GoogleAds


