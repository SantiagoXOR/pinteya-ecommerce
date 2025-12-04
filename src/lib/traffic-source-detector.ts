/**
 * Sistema de detección de origen de tráfico
 * Detecta si el usuario viene de Meta ads (Facebook/Instagram) mediante UTM parameters y referrer
 */

export interface TrafficSource {
  source: 'meta' | 'organic' | 'other'
  medium?: string
  campaign?: string
  referrer?: string
  detectedAt: number
}

const STORAGE_KEY = 'traffic_source'
const SESSION_DURATION = 30 * 60 * 1000 // 30 minutos

/**
 * Detecta el origen del tráfico desde la URL actual
 */
export const detectTrafficSource = (): TrafficSource => {
  if (typeof window === 'undefined') {
    return {
      source: 'organic',
      detectedAt: Date.now(),
    }
  }

  const urlParams = new URLSearchParams(window.location.search)
  const referrer = document.referrer || ''

  // Detectar UTM parameters
  const utmSource = urlParams.get('utm_source')?.toLowerCase() || ''
  const utmMedium = urlParams.get('utm_medium')?.toLowerCase() || ''
  const utmCampaign = urlParams.get('utm_campaign') || ''

  // Detectar referrer de Meta
  const isMetaReferrer =
    referrer.includes('facebook.com') ||
    referrer.includes('instagram.com') ||
    referrer.includes('m.facebook.com') ||
    referrer.includes('l.facebook.com') ||
    referrer.includes('lm.facebook.com')

  // Detectar si viene de Meta ads
  const isMetaSource =
    utmSource === 'facebook' ||
    utmSource === 'instagram' ||
    utmMedium === 'ads' ||
    (utmSource && utmMedium === 'cpc') ||
    isMetaReferrer

  const trafficSource: TrafficSource = {
    source: isMetaSource ? 'meta' : utmSource ? 'other' : 'organic',
    medium: utmMedium || undefined,
    campaign: utmCampaign || undefined,
    referrer: referrer || undefined,
    detectedAt: Date.now(),
  }

  // Guardar en sessionStorage para persistir durante la sesión
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trafficSource))
  } catch (error) {
    console.warn('Error guardando traffic source:', error)
  }

  return trafficSource
}

/**
 * Obtiene el origen de tráfico guardado (si existe y no ha expirado)
 */
export const getStoredTrafficSource = (): TrafficSource | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return null
    }

    const trafficSource: TrafficSource = JSON.parse(stored)
    const now = Date.now()

    // Verificar si la sesión sigue siendo válida
    if (now - trafficSource.detectedAt > SESSION_DURATION) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }

    return trafficSource
  } catch (error) {
    console.warn('Error leyendo traffic source:', error)
    return null
  }
}

/**
 * Obtiene el origen de tráfico actual (detecta o recupera del storage)
 */
export const getTrafficSource = (): TrafficSource => {
  // Primero intentar recuperar del storage
  const stored = getStoredTrafficSource()
  if (stored) {
    return stored
  }

  // Si no hay almacenado o expiró, detectar ahora
  return detectTrafficSource()
}

/**
 * Verifica si el tráfico actual viene de Meta ads
 */
export const isMetaTraffic = (): boolean => {
  const source = getTrafficSource()
  return source.source === 'meta'
}

/**
 * Limpia el origen de tráfico almacenado
 */
export const clearTrafficSource = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Error limpiando traffic source:', error)
  }
}

/**
 * Obtiene información detallada del origen para analytics
 */
export const getTrafficSourceForAnalytics = (): Record<string, any> => {
  const source = getTrafficSource()
  return {
    traffic_source: source.source,
    traffic_medium: source.medium || 'none',
    traffic_campaign: source.campaign || 'none',
    referrer: source.referrer || 'direct',
  }
}

