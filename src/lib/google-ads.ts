/**
 * Configuración de Google Ads Conversion Tracking para Pinteya E-commerce
 * Integración con el sistema de analytics para tracking de conversiones
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export const GOOGLE_ADS_CONVERSION_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID || ''
export const GOOGLE_ADS_CONVERSION_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || ''

// Verificar si Google Ads está habilitado y disponible
export const isGoogleAdsEnabled = (): boolean => {
  return (
    !!GOOGLE_ADS_CONVERSION_ID &&
    !!GOOGLE_ADS_CONVERSION_LABEL &&
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function'
  )
}

// Verificar si Google Ads está listo para usar
export const isGoogleAdsReady = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    Array.isArray(window.dataLayer)
  )
}

// Esperar a que Google Ads esté listo
export const waitForGoogleAds = (): Promise<void> => {
  return new Promise(resolve => {
    if (isGoogleAdsReady()) {
      resolve()
      return
    }

    const checkGoogleAds = () => {
      if (isGoogleAdsReady()) {
        resolve()
      } else {
        setTimeout(checkGoogleAds, 100)
      }
    }

    checkGoogleAds()
  })
}

// Trackear conversión de Google Ads
export const trackGoogleAdsConversion = (
  conversionLabel: string,
  value?: number,
  currency: string = 'ARS',
  transactionId?: string,
  additionalParams?: Record<string, any>
): void => {
  if (!isGoogleAdsEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Google Ads] Conversion tracking disabled - missing conversion ID or label')
    }
    return
  }

  try {
    const params: Record<string, any> = {
      send_to: `${GOOGLE_ADS_CONVERSION_ID}/${conversionLabel}`,
      value: value,
      currency: currency,
      ...additionalParams,
    }

    if (transactionId) {
      params.transaction_id = transactionId
    }

    window.gtag('event', 'conversion', params)

    if (process.env.NODE_ENV === 'development') {
      console.debug('[Google Ads] Conversion tracked:', {
        conversionLabel,
        value,
        currency,
        transactionId,
      })
    }
  } catch (error) {
    console.warn('[Google Ads] Error tracking conversion:', error)
  }
}

// Trackear compra completada (Purchase)
export const trackGoogleAdsPurchase = (
  transactionId: string,
  value: number,
  currency: string = 'ARS',
  items?: Array<{
    item_id: string
    item_name: string
    item_category?: string
    price: number
    quantity: number
  }>
): void => {
  if (!GOOGLE_ADS_CONVERSION_LABEL) {
    return
  }

  trackGoogleAdsConversion(
    GOOGLE_ADS_CONVERSION_LABEL,
    value,
    currency,
    transactionId,
    {
      items: items || [],
    }
  )
}

// Trackear inicio de checkout (Begin Checkout)
export const trackGoogleAdsBeginCheckout = (
  value: number,
  currency: string = 'ARS',
  items?: Array<{
    item_id: string
    item_name: string
    item_category?: string
    price: number
    quantity: number
  }>
): void => {
  // Para begin_checkout, necesitarías un conversion label específico
  // Por ahora, usamos el mismo label principal o puedes crear uno separado
  if (!GOOGLE_ADS_CONVERSION_LABEL) {
    return
  }

  trackGoogleAdsConversion(GOOGLE_ADS_CONVERSION_LABEL, value, currency, undefined, {
    event_category: 'ecommerce',
    event_label: 'begin_checkout',
    items: items || [],
  })
}

// Trackear agregar al carrito (Add to Cart)
export const trackGoogleAdsAddToCart = (
  value: number,
  currency: string = 'ARS',
  items?: Array<{
    item_id: string
    item_name: string
    item_category?: string
    price: number
    quantity: number
  }>
): void => {
  if (!GOOGLE_ADS_CONVERSION_LABEL) {
    return
  }

  trackGoogleAdsConversion(GOOGLE_ADS_CONVERSION_LABEL, value, currency, undefined, {
    event_category: 'ecommerce',
    event_label: 'add_to_cart',
    items: items || [],
  })
}

// Trackear conversión personalizada
export const trackGoogleAdsCustomConversion = (
  conversionLabel: string,
  value?: number,
  currency: string = 'ARS',
  additionalParams?: Record<string, any>
): void => {
  trackGoogleAdsConversion(conversionLabel, value, currency, undefined, additionalParams)
}

// Inicializar Google Ads (se llama automáticamente por el componente)
export const initGoogleAds = (): void => {
  if (!isGoogleAdsEnabled()) {
    return
  }

  // El dataLayer y gtag ya deberían estar inicializados por Google Analytics
  // Solo verificamos que estén disponibles
  if (typeof window !== 'undefined' && !window.dataLayer) {
    window.dataLayer = window.dataLayer || []
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[Google Ads] Initialized with Conversion ID:', GOOGLE_ADS_CONVERSION_ID)
  }
}


