/**
 * Utilidades para Google Analytics Embed API
 * Permite embebido de reportes de GA4 sin necesidad de credenciales adicionales
 */

import { GAEmbedConfig, GAEmbedReport } from '@/types/analytics'

declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void
      analytics: {
        auth: {
          authorize: (config: any, callback: (result: any) => void) => void
        }
        embed: {
          api: {
            ViewSelector: new (config: any) => any
            DataChart: new (config: any) => any
            TableChart: new (config: any) => any
          }
        }
      }
    }
  }
}

const GA_EMBED_API_URL = 'https://apis.google.com/js/api.js'
const GA_AUTH_API_URL = 'https://accounts.google.com/gsi/client'

/**
 * Cargar Google Analytics Embed API
 */
export const loadGAEmbedAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not available'))
      return
    }

    // Verificar si ya está cargado
    if (window.gapi?.analytics) {
      resolve()
      return
    }

    // Cargar GSI (Google Sign-In) primero
    const gsiScript = document.createElement('script')
    gsiScript.src = GA_AUTH_API_URL
    gsiScript.async = true
    gsiScript.defer = true
    gsiScript.onload = () => {
      // Luego cargar Embed API
      const embedScript = document.createElement('script')
      embedScript.src = GA_EMBED_API_URL
      embedScript.async = true
      embedScript.defer = true
      embedScript.onload = () => {
        if (window.gapi) {
          window.gapi.load('analytics', () => {
            resolve()
          })
        } else {
          reject(new Error('Failed to load Google APIs'))
        }
      }
      embedScript.onerror = () => reject(new Error('Failed to load Embed API'))
      document.head.appendChild(embedScript)
    }
    gsiScript.onerror = () => reject(new Error('Failed to load GSI'))
    document.head.appendChild(gsiScript)
  })
}

/**
 * Verificar si Embed API está disponible
 */
export const isGAEmbedAPIAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.gapi?.analytics
}

/**
 * Crear configuración para autorización
 */
export const createAuthConfig = (measurementId: string) => {
  return {
    clientid: measurementId,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    immediate: false,
  }
}

/**
 * Crear reporte de línea de tiempo
 */
export const createTimelineReport = (
  containerId: string,
  measurementId: string,
  metrics: string[] = ['sessions', 'users'],
  startDate: string = '7daysAgo',
  endDate: string = 'today'
): GAEmbedReport => {
  return {
    type: 'LINE',
    query: {
      metrics: metrics,
      'start-date': startDate,
      'end-date': endDate,
    },
    chart: {
      container: containerId,
      type: 'LINE',
      options: {
        width: '100%',
      },
    },
  }
}

/**
 * Crear reporte de tabla
 */
export const createTableReport = (
  containerId: string,
  measurementId: string,
  metrics: string[],
  dimensions: string[],
  startDate: string = '7daysAgo',
  endDate: string = 'today'
): GAEmbedReport => {
  return {
    type: 'TABLE',
    query: {
      metrics: metrics,
      dimensions: dimensions,
      'start-date': startDate,
      'end-date': endDate,
    },
    chart: {
      container: containerId,
      type: 'TABLE',
    },
  }
}

/**
 * Crear reporte de barras
 */
export const createBarReport = (
  containerId: string,
  measurementId: string,
  metrics: string[],
  dimensions: string[],
  startDate: string = '7daysAgo',
  endDate: string = 'today'
): GAEmbedReport => {
  return {
    type: 'BAR',
    query: {
      metrics: metrics,
      dimensions: dimensions,
      'start-date': startDate,
      'end-date': endDate,
    },
    chart: {
      container: containerId,
      type: 'BAR',
      options: {
        width: '100%',
      },
    },
  }
}

/**
 * Obtener URL de Google Analytics para el Measurement ID
 * Para GA4, la URL es diferente
 */
export const getGoogleAnalyticsUrl = (measurementId: string): string => {
  // Para GA4, usar la URL de reportes
  // El Measurement ID (G-XXXXXXXXXX) se usa para identificar la propiedad
  return `https://analytics.google.com/analytics/web/#/p${measurementId.replace('G-', '')}/reports/intelligenthome`
}

/**
 * Obtener URL alternativa de Google Analytics (más directa)
 */
export const getGoogleAnalyticsReportsUrl = (measurementId: string): string => {
  return `https://analytics.google.com/analytics/web/#/report-home/${measurementId.replace('G-', '')}`
}

