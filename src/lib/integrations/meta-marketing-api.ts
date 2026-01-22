/**
 * Meta Marketing API Integration
 * Permite consultar eventos del Pixel y enviar eventos server-side via Conversions API
 *
 * Documentación:
 * - Marketing API: https://developers.facebook.com/docs/marketing-api
 * - Conversions API: https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * REQUISITOS:
 * 1. Crear app en Meta for Developers
 * 2. Agregar producto "Marketing API"
 * 3. Generar token de acceso con permisos: ads_read, read_insights
 * 4. Verificar dominio en Business Manager
 * 5. Configurar variables de entorno (ver GUIA-CREDENCIALES-ANALYTICS.md)
 */

import {
  MetaEventsResponse,
  MetaPixelStats,
  MetaServerEvent,
  MetaConversionAPIResponse,
  MetaAdInsights,
} from '@/types/external-analytics'
import { createHash } from 'crypto'

const META_GRAPH_API_VERSION = 'v18.0'
const META_GRAPH_API_BASE = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`

/**
 * Obtener configuración de Meta
 */
function getMetaConfig() {
  const accessToken = process.env.META_ACCESS_TOKEN
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID
  const adAccountId = process.env.META_AD_ACCOUNT_ID

  if (!accessToken) {
    throw new Error(
      'META_ACCESS_TOKEN no configurado. ' +
        'Genera un token de acceso de larga duración en Meta for Developers'
    )
  }

  if (!pixelId) {
    throw new Error('META_PIXEL_ID o NEXT_PUBLIC_META_PIXEL_ID no configurado')
  }

  return { accessToken, pixelId, adAccountId }
}

/**
 * Hacer request a Meta Graph API
 */
async function metaGraphRequest<T>(
  endpoint: string,
  params: Record<string, string> = {},
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const { accessToken } = getMetaConfig()

  const url = new URL(`${META_GRAPH_API_BASE}${endpoint}`)
  url.searchParams.append('access_token', accessToken)

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (body && method === 'POST') {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url.toString(), options)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Meta API Error: ${JSON.stringify(error)}`)
  }

  return response.json()
}

/**
 * Consultar eventos del Pixel por rango de fechas
 *
 * NOTA: Meta no permite consultar eventos individuales por transaction_id.
 * Los eventos se consultan de forma agregada.
 *
 * @param startDate - Fecha de inicio (YYYY-MM-DD)
 * @param endDate - Fecha de fin (YYYY-MM-DD)
 */
export async function queryMetaEvents(
  startDate: string,
  endDate: string
): Promise<MetaEventsResponse> {
  const { pixelId } = getMetaConfig()

  try {
    // Obtener estadísticas de eventos del pixel
    const response = await metaGraphRequest<{
      data: Array<{
        event: string
        count: number
        value?: number
      }>
    }>(`/${pixelId}/stats`, {
      start_time: new Date(startDate).toISOString(),
      end_time: new Date(endDate).toISOString(),
      aggregation: 'event',
    })

    const eventsByType: Record<string, { count: number; value: number }> = {}

    response.data?.forEach(item => {
      eventsByType[item.event] = {
        count: item.count || 0,
        value: item.value || 0,
      }
    })

    return {
      success: true,
      pixelId,
      dateRange: { startDate, endDate },
      events: eventsByType,
      totalEvents: Object.values(eventsByType).reduce((sum, e) => sum + e.count, 0),
    }
  } catch (error) {
    console.error('Error consultando eventos de Meta:', error)
    return {
      success: false,
      pixelId,
      dateRange: { startDate, endDate },
      events: {},
      totalEvents: 0,
      error: (error as Error).message,
    }
  }
}

/**
 * Obtener estadísticas del Pixel
 */
export async function getMetaPixelStats(): Promise<MetaPixelStats> {
  const { pixelId } = getMetaConfig()

  try {
    // Obtener información del pixel
    const pixelInfo = await metaGraphRequest<{
      id: string
      name: string
      last_fired_time?: string
      is_unavailable?: boolean
    }>(`/${pixelId}`, {
      fields: 'id,name,last_fired_time,is_unavailable',
    })

    // Obtener eventos de los últimos 7 días
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const eventsResponse = await queryMetaEvents(
      sevenDaysAgo.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    )

    return {
      pixelId: pixelInfo.id,
      pixelName: pixelInfo.name,
      lastFiredTime: pixelInfo.last_fired_time || null,
      isUnavailable: pixelInfo.is_unavailable || false,
      last7DaysEvents: eventsResponse.events,
      totalEventsLast7Days: eventsResponse.totalEvents,
      eventsManagerUrl: `https://business.facebook.com/events_manager2/list/pixel/${pixelId}`,
    }
  } catch (error) {
    console.error('Error obteniendo stats del Pixel:', error)
    const { pixelId } = getMetaConfig()
    return {
      pixelId,
      pixelName: 'Unknown',
      lastFiredTime: null,
      isUnavailable: true,
      last7DaysEvents: {},
      totalEventsLast7Days: 0,
      eventsManagerUrl: `https://business.facebook.com/events_manager2/list/pixel/${pixelId}`,
      error: (error as Error).message,
    }
  }
}

/**
 * Hash de datos de usuario para Conversions API (privacidad)
 */
function hashUserData(value: string): string {
  return createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
}

/**
 * Enviar evento server-side via Conversions API
 *
 * Mejora la redundancia del tracking enviando eventos desde el servidor
 * además del Pixel del cliente.
 *
 * @param event - Datos del evento a enviar
 */
export async function sendServerEvent(event: MetaServerEvent): Promise<MetaConversionAPIResponse> {
  const { pixelId, accessToken } = getMetaConfig()

  try {
    // Preparar datos de usuario hasheados
    const userData: Record<string, string> = {}

    if (event.userData?.email) {
      userData.em = hashUserData(event.userData.email)
    }
    if (event.userData?.phone) {
      userData.ph = hashUserData(event.userData.phone)
    }
    if (event.userData?.firstName) {
      userData.fn = hashUserData(event.userData.firstName)
    }
    if (event.userData?.lastName) {
      userData.ln = hashUserData(event.userData.lastName)
    }
    if (event.userData?.city) {
      userData.ct = hashUserData(event.userData.city)
    }
    if (event.userData?.state) {
      userData.st = hashUserData(event.userData.state)
    }
    if (event.userData?.zipCode) {
      userData.zp = hashUserData(event.userData.zipCode)
    }
    if (event.userData?.country) {
      userData.country = hashUserData(event.userData.country)
    }
    if (event.userData?.externalId) {
      userData.external_id = hashUserData(event.userData.externalId)
    }
    if (event.userData?.clientIpAddress) {
      userData.client_ip_address = event.userData.clientIpAddress
    }
    if (event.userData?.clientUserAgent) {
      userData.client_user_agent = event.userData.clientUserAgent
    }
    if (event.userData?.fbc) {
      userData.fbc = event.userData.fbc
    }
    if (event.userData?.fbp) {
      userData.fbp = event.userData.fbp
    }

    // Preparar evento
    const eventData = {
      event_name: event.eventName,
      event_time: event.eventTime || Math.floor(Date.now() / 1000),
      event_id: event.eventId,
      event_source_url: event.eventSourceUrl,
      action_source: event.actionSource || 'website',
      user_data: userData,
      custom_data: event.customData,
    }

    const response = await fetch(`${META_GRAPH_API_BASE}/${pixelId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [eventData],
        access_token: accessToken,
        ...(event.testEventCode && { test_event_code: event.testEventCode }),
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Meta CAPI Error: ${JSON.stringify(result)}`)
    }

    return {
      success: true,
      eventsReceived: result.events_received || 1,
      fbTraceId: result.fbtrace_id,
      messages: result.messages || [],
    }
  } catch (error) {
    console.error('Error enviando evento a Meta CAPI:', error)
    return {
      success: false,
      eventsReceived: 0,
      error: (error as Error).message,
    }
  }
}

/**
 * Enviar evento de Purchase via Conversions API
 */
export async function sendPurchaseEvent(data: {
  orderId: string
  revenue: number
  currency: string
  items?: Array<{ id: string; name: string; quantity: number; price: number }>
  userData?: MetaServerEvent['userData']
  eventSourceUrl?: string
  eventId?: string
}): Promise<MetaConversionAPIResponse> {
  return sendServerEvent({
    eventName: 'Purchase',
    eventId: data.eventId || `purchase_${data.orderId}_${Date.now()}`,
    eventSourceUrl: data.eventSourceUrl,
    userData: data.userData,
    customData: {
      value: data.revenue,
      currency: data.currency,
      order_id: data.orderId,
      content_type: 'product',
      contents: data.items?.map(item => ({
        id: item.id,
        quantity: item.quantity,
        item_price: item.price,
      })),
      num_items: data.items?.reduce((sum, item) => sum + item.quantity, 0) || 1,
    },
  })
}

/**
 * Obtener insights de ads (si hay cuenta publicitaria configurada)
 */
export async function getMetaAdInsights(
  startDate: string,
  endDate: string
): Promise<MetaAdInsights | null> {
  const { adAccountId } = getMetaConfig()

  if (!adAccountId) {
    return null // No hay cuenta publicitaria configurada
  }

  try {
    const response = await metaGraphRequest<{
      data: Array<{
        impressions: string
        clicks: string
        spend: string
        reach: string
        actions?: Array<{ action_type: string; value: string }>
      }>
    }>(`/act_${adAccountId}/insights`, {
      fields: 'impressions,clicks,spend,reach,actions',
      time_range: JSON.stringify({
        since: startDate,
        until: endDate,
      }),
      level: 'account',
    })

    const data = response.data?.[0]

    if (!data) {
      return null
    }

    const purchases =
      data.actions?.find(
        a => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
      ) || null

    return {
      impressions: parseInt(data.impressions || '0', 10),
      clicks: parseInt(data.clicks || '0', 10),
      spend: parseFloat(data.spend || '0'),
      reach: parseInt(data.reach || '0', 10),
      purchases: purchases ? parseInt(purchases.value, 10) : 0,
      dateRange: { startDate, endDate },
    }
  } catch (error) {
    console.error('Error obteniendo insights de Meta Ads:', error)
    return null
  }
}

/**
 * Verificar conexión con Meta
 */
export async function verifyMetaConnection(): Promise<{
  connected: boolean
  pixelId: string | null
  pixelName?: string
  adAccountId?: string | null
  error?: string
}> {
  try {
    const config = getMetaConfig()
    const stats = await getMetaPixelStats()

    return {
      connected: !stats.isUnavailable,
      pixelId: config.pixelId,
      pixelName: stats.pixelName,
      adAccountId: config.adAccountId || null,
    }
  } catch (error) {
    return {
      connected: false,
      pixelId: process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || null,
      error: (error as Error).message,
    }
  }
}

/**
 * Obtener eventos de conversión específicos
 */
export async function getMetaConversionEvents(
  startDate: string,
  endDate: string
): Promise<{
  purchases: number
  addToCarts: number
  initiateCheckouts: number
  viewContents: number
  searches: number
  totalConversionValue: number
}> {
  const eventsResponse = await queryMetaEvents(startDate, endDate)

  return {
    purchases: eventsResponse.events['Purchase']?.count || 0,
    addToCarts: eventsResponse.events['AddToCart']?.count || 0,
    initiateCheckouts: eventsResponse.events['InitiateCheckout']?.count || 0,
    viewContents: eventsResponse.events['ViewContent']?.count || 0,
    searches: eventsResponse.events['Search']?.count || 0,
    totalConversionValue:
      (eventsResponse.events['Purchase']?.value || 0) +
      (eventsResponse.events['AddToCart']?.value || 0),
  }
}
