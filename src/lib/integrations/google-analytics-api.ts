/**
 * Google Analytics 4 Data API Integration
 * Permite consultar eventos y métricas directamente desde GA4
 *
 * Documentación: https://developers.google.com/analytics/devguides/reporting/data/v1
 *
 * REQUISITOS:
 * 1. Habilitar "Google Analytics Data API" en Google Cloud Console
 * 2. Crear Service Account con permisos de lectura
 * 3. Agregar el email del Service Account a GA4 con rol "Viewer"
 * 4. Configurar variables de entorno (ver GUIA-CREDENCIALES-ANALYTICS.md)
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data'
import {
  GA4EventsResponse,
  GA4PurchaseData,
  GA4UserJourney,
  GA4RealtimeEvent,
  GA4QueryOptions,
} from '@/types/external-analytics'

// Cliente de GA4 Data API (singleton)
let analyticsClient: BetaAnalyticsDataClient | null = null

/**
 * Obtener o crear cliente de GA4
 */
function getGA4Client(): BetaAnalyticsDataClient {
  if (analyticsClient) {
    return analyticsClient
  }

  // Verificar que estamos en el servidor
  if (typeof window !== 'undefined') {
    throw new Error('GA4 Data API solo puede ejecutarse en el servidor')
  }

  // Verificar credenciales
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON

  if (!credentialsPath && !credentialsJson) {
    throw new Error(
      'Credenciales de Google no configuradas. ' +
        'Configura GOOGLE_APPLICATION_CREDENTIALS o GOOGLE_CREDENTIALS_JSON'
    )
  }

  // Crear cliente con credenciales JSON directamente o desde archivo
  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson)
      analyticsClient = new BetaAnalyticsDataClient({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
        projectId: credentials.project_id,
      })
    } catch (error) {
      throw new Error('Error parseando GOOGLE_CREDENTIALS_JSON: ' + (error as Error).message)
    }
  } else {
    // Usar archivo de credenciales
    analyticsClient = new BetaAnalyticsDataClient()
  }

  return analyticsClient
}

/**
 * Obtener Property ID de GA4
 */
function getPropertyId(): string {
  const propertyId = process.env.GA4_PROPERTY_ID

  if (!propertyId) {
    throw new Error(
      'GA4_PROPERTY_ID no configurado. ' +
        'Obtén el ID numérico de tu propiedad GA4 (no el Measurement ID G-XXX)'
    )
  }

  return propertyId
}

/**
 * Consultar eventos de GA4 por rango de fechas
 *
 * @param startDate - Fecha de inicio (YYYY-MM-DD o "7daysAgo", "30daysAgo", etc.)
 * @param endDate - Fecha de fin (YYYY-MM-DD o "today", "yesterday")
 * @param eventName - Filtrar por nombre de evento (opcional)
 * @param options - Opciones adicionales de consulta
 */
export async function queryGA4Events(
  startDate: string,
  endDate: string,
  eventName?: string,
  options: GA4QueryOptions = {}
): Promise<GA4EventsResponse> {
  const client = getGA4Client()
  const propertyId = getPropertyId()

  try {
    const dimensionFilter = eventName
      ? {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              value: eventName,
              matchType: 'EXACT' as const,
            },
          },
        }
      : undefined

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'eventName' },
        { name: 'date' },
        ...(options.includeDimensions?.map(d => ({ name: d })) || []),
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'eventValue' },
        ...(options.includeMetrics?.map(m => ({ name: m })) || []),
      ],
      dimensionFilter,
      limit: options.limit || 10000,
      offset: options.offset || 0,
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: true }],
    })

    const events =
      response.rows?.map(row => ({
        eventName: row.dimensionValues?.[0]?.value || '',
        date: row.dimensionValues?.[1]?.value || '',
        eventCount: parseInt(row.metricValues?.[0]?.value || '0', 10),
        eventValue: parseFloat(row.metricValues?.[1]?.value || '0'),
        additionalDimensions: options.includeDimensions?.reduce(
          (acc, dim, index) => {
            acc[dim] = row.dimensionValues?.[index + 2]?.value || ''
            return acc
          },
          {} as Record<string, string>
        ),
        additionalMetrics: options.includeMetrics?.reduce(
          (acc, metric, index) => {
            acc[metric] = parseFloat(row.metricValues?.[index + 2]?.value || '0')
            return acc
          },
          {} as Record<string, number>
        ),
      })) || []

    return {
      success: true,
      events,
      rowCount: response.rowCount || 0,
      metadata: {
        propertyId,
        dateRange: { startDate, endDate },
        eventNameFilter: eventName,
      },
    }
  } catch (error) {
    console.error('Error consultando GA4 events:', error)
    return {
      success: false,
      events: [],
      rowCount: 0,
      error: (error as Error).message,
      metadata: {
        propertyId,
        dateRange: { startDate, endDate },
        eventNameFilter: eventName,
      },
    }
  }
}

/**
 * Buscar evento de purchase por transaction_id
 *
 * NOTA: GA4 puede tener un delay de 24-48h para datos históricos.
 * Para datos recientes, usa queryGA4RealTimeEvents()
 *
 * @param transactionId - ID de la transacción a buscar
 */
export async function queryGA4PurchaseByTransactionId(
  transactionId: string
): Promise<GA4PurchaseData | null> {
  const client = getGA4Client()
  const propertyId = getPropertyId()

  try {
    // Buscar en los últimos 30 días
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [
        { name: 'transactionId' },
        { name: 'date' },
        { name: 'deviceCategory' },
        { name: 'country' },
        { name: 'city' },
      ],
      metrics: [
        { name: 'purchaseRevenue' },
        { name: 'transactions' },
        { name: 'itemsPurchased' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'transactionId',
          stringFilter: {
            value: transactionId,
            matchType: 'EXACT' as const,
          },
        },
      },
      limit: 1,
    })

    if (!response.rows || response.rows.length === 0) {
      return null
    }

    const row = response.rows[0]

    return {
      transactionId: row.dimensionValues?.[0]?.value || '',
      date: row.dimensionValues?.[1]?.value || '',
      deviceCategory: row.dimensionValues?.[2]?.value || '',
      country: row.dimensionValues?.[3]?.value || '',
      city: row.dimensionValues?.[4]?.value || '',
      revenue: parseFloat(row.metricValues?.[0]?.value || '0'),
      transactions: parseInt(row.metricValues?.[1]?.value || '0', 10),
      itemsPurchased: parseInt(row.metricValues?.[2]?.value || '0', 10),
      found: true,
    }
  } catch (error) {
    console.error('Error buscando purchase en GA4:', error)
    return null
  }
}

/**
 * Obtener journey de usuario por session_id
 *
 * @param sessionId - ID de la sesión de GA4
 */
export async function queryGA4UserJourney(sessionId: string): Promise<GA4UserJourney | null> {
  const client = getGA4Client()
  const propertyId = getPropertyId()

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [
        { name: 'sessionId' },
        { name: 'eventName' },
        { name: 'dateHour' },
        { name: 'pagePath' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionId',
          stringFilter: {
            value: sessionId,
            matchType: 'EXACT' as const,
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'dateHour' }, desc: false }],
      limit: 1000,
    })

    if (!response.rows || response.rows.length === 0) {
      return null
    }

    const events = response.rows.map(row => ({
      eventName: row.dimensionValues?.[1]?.value || '',
      dateHour: row.dimensionValues?.[2]?.value || '',
      pagePath: row.dimensionValues?.[3]?.value || '',
      eventCount: parseInt(row.metricValues?.[0]?.value || '0', 10),
    }))

    return {
      sessionId,
      events,
      totalEvents: events.reduce((sum, e) => sum + e.eventCount, 0),
      startTime: events[0]?.dateHour,
      endTime: events[events.length - 1]?.dateHour,
    }
  } catch (error) {
    console.error('Error obteniendo journey de GA4:', error)
    return null
  }
}

/**
 * Obtener eventos en tiempo real (últimos 30 minutos)
 *
 * NOTA: Esta es la única forma de obtener datos "frescos" de GA4
 */
export async function getGA4RealTimeEvents(): Promise<GA4RealtimeEvent[]> {
  const client = getGA4Client()
  const propertyId = getPropertyId()

  try {
    const [response] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [
        { name: 'eventName' },
        { name: 'minutesAgo' },
        { name: 'deviceCategory' },
        { name: 'country' },
      ],
      metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
      limit: 100,
    })

    return (
      response.rows?.map(row => ({
        eventName: row.dimensionValues?.[0]?.value || '',
        minutesAgo: parseInt(row.dimensionValues?.[1]?.value || '0', 10),
        deviceCategory: row.dimensionValues?.[2]?.value || '',
        country: row.dimensionValues?.[3]?.value || '',
        eventCount: parseInt(row.metricValues?.[0]?.value || '0', 10),
        activeUsers: parseInt(row.metricValues?.[1]?.value || '0', 10),
      })) || []
    )
  } catch (error) {
    console.error('Error obteniendo eventos en tiempo real:', error)
    return []
  }
}

/**
 * Obtener métricas de e-commerce de GA4
 */
export async function getGA4EcommerceMetrics(
  startDate: string,
  endDate: string
): Promise<{
  totalRevenue: number
  transactions: number
  averageOrderValue: number
  itemsPurchased: number
  addToCarts: number
  checkouts: number
  conversionRate: number
}> {
  const client = getGA4Client()
  const propertyId = getPropertyId()

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'purchaseRevenue' },
        { name: 'transactions' },
        { name: 'averagePurchaseRevenue' },
        { name: 'itemsPurchased' },
        { name: 'addToCarts' },
        { name: 'checkouts' },
        { name: 'purchaserConversionRate' },
      ],
    })

    const row = response.rows?.[0]

    return {
      totalRevenue: parseFloat(row?.metricValues?.[0]?.value || '0'),
      transactions: parseInt(row?.metricValues?.[1]?.value || '0', 10),
      averageOrderValue: parseFloat(row?.metricValues?.[2]?.value || '0'),
      itemsPurchased: parseInt(row?.metricValues?.[3]?.value || '0', 10),
      addToCarts: parseInt(row?.metricValues?.[4]?.value || '0', 10),
      checkouts: parseInt(row?.metricValues?.[5]?.value || '0', 10),
      conversionRate: parseFloat(row?.metricValues?.[6]?.value || '0'),
    }
  } catch (error) {
    console.error('Error obteniendo métricas de e-commerce:', error)
    return {
      totalRevenue: 0,
      transactions: 0,
      averageOrderValue: 0,
      itemsPurchased: 0,
      addToCarts: 0,
      checkouts: 0,
      conversionRate: 0,
    }
  }
}

/**
 * Verificar conexión con GA4
 */
export async function verifyGA4Connection(): Promise<{
  connected: boolean
  propertyId: string | null
  error?: string
}> {
  try {
    const propertyId = getPropertyId()
    const client = getGA4Client()

    // Hacer una consulta simple para verificar conexión
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '1daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 1,
    })

    return {
      connected: true,
      propertyId,
    }
  } catch (error) {
    return {
      connected: false,
      propertyId: process.env.GA4_PROPERTY_ID || null,
      error: (error as Error).message,
    }
  }
}

/**
 * Obtener resumen de eventos por tipo
 */
export async function getGA4EventsSummary(
  startDate: string,
  endDate: string
): Promise<Array<{ eventName: string; count: number; value: number }>> {
  const client = getGA4Client()
  const propertyId = getPropertyId()

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }, { name: 'eventValue' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 50,
    })

    return (
      response.rows?.map(row => ({
        eventName: row.dimensionValues?.[0]?.value || '',
        count: parseInt(row.metricValues?.[0]?.value || '0', 10),
        value: parseFloat(row.metricValues?.[1]?.value || '0'),
      })) || []
    )
  } catch (error) {
    console.error('Error obteniendo resumen de eventos:', error)
    return []
  }
}
