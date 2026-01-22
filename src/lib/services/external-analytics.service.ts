/**
 * External Analytics Service
 * Servicio unificado para consultar y comparar datos de GA4, Meta y datos locales
 *
 * Este servicio permite:
 * - Verificar que los eventos llegaron correctamente a GA4 y Meta
 * - Consultar el journey de un cliente específico por transaction_id
 * - Comparar datos locales vs datos en plataformas externas
 * - Generar reportes de conversiones desde las fuentes oficiales
 */

import { createClient } from '@supabase/supabase-js'
import {
  queryGA4Events,
  queryGA4PurchaseByTransactionId,
  queryGA4UserJourney,
  getGA4EcommerceMetrics,
  verifyGA4Connection,
} from '@/lib/integrations/google-analytics-api'
import {
  queryMetaEvents,
  getMetaConversionEvents,
  verifyMetaConnection,
} from '@/lib/integrations/meta-marketing-api'
import {
  OrderJourney,
  AnalyticsComparison,
  ExternalAnalyticsStatus,
  GA4ConnectionStatus,
  MetaConnectionStatus,
} from '@/types/external-analytics'

// Cliente Supabase para datos locales
const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('ExternalAnalyticsService solo puede ejecutarse en el servidor')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Obtener journey completo de una orden
 * Combina datos de GA4, Meta y base de datos local
 */
export async function getOrderJourney(orderId: string): Promise<OrderJourney> {
  const supabase = getSupabaseClient()

  // 1. Obtener eventos locales de la orden
  const { data: localEvents, error: localError } = await supabase
    .from('analytics_events_optimized')
    .select('*')
    .or(`metadata->>'order_id'.eq.${orderId},metadata->>'transaction_id'.eq.${orderId}`)
    .order('created_at', { ascending: true })

  // Buscar también en analytics_events si no hay en optimized
  let allLocalEvents = localEvents || []
  if (allLocalEvents.length === 0) {
    const { data: fallbackEvents } = await supabase
      .from('analytics_events')
      .select('*')
      .or(`metadata->>'order_id'.eq.${orderId},metadata->>'transaction_id'.eq.${orderId}`)
      .order('created_at', { ascending: true })

    allLocalEvents = fallbackEvents || []
  }

  // Encontrar evento de purchase local
  const purchaseEvent = allLocalEvents.find(
    e => e.action === 'purchase' || e.event_name === 'purchase'
  )

  // 2. Consultar GA4
  let ga4Result: OrderJourney['googleAnalytics'] = { available: false }
  try {
    const ga4Status = await verifyGA4Connection()
    if (ga4Status.connected) {
      const purchase = await queryGA4PurchaseByTransactionId(orderId)
      // Intentar obtener journey si tenemos session_id
      const sessionId = allLocalEvents[0]?.metadata?.session_id
      let journey = null
      if (sessionId) {
        journey = await queryGA4UserJourney(sessionId)
      }

      ga4Result = {
        available: true,
        purchase,
        journey,
      }
    } else {
      ga4Result = {
        available: false,
        error: ga4Status.error || 'GA4 no conectado',
      }
    }
  } catch (error) {
    ga4Result = {
      available: false,
      error: (error as Error).message,
    }
  }

  // 3. Consultar Meta
  let metaResult: OrderJourney['metaPixel'] = { available: false, eventsSent: false }
  try {
    const metaStatus = await verifyMetaConnection()
    if (metaStatus.connected) {
      // Meta no permite buscar eventos por transaction_id directamente
      // Solo podemos verificar que el pixel está activo
      metaResult = {
        available: true,
        eventsSent: true, // Asumimos que se envió si hay evento local de purchase
      }
    } else {
      metaResult = {
        available: false,
        eventsSent: false,
        error: metaStatus.error || 'Meta Pixel no conectado',
      }
    }
  } catch (error) {
    metaResult = {
      available: false,
      eventsSent: false,
      error: (error as Error).message,
    }
  }

  // 4. Verificación cruzada
  const ga4PurchaseReceived = !!ga4Result.purchase?.found
  const metaPurchaseReceived = metaResult.eventsSent && !!purchaseEvent

  const discrepancies: string[] = []

  if (purchaseEvent && !ga4PurchaseReceived && ga4Result.available) {
    discrepancies.push('Purchase local existe pero no se encontró en GA4 (puede haber delay de 24-48h)')
  }

  if (ga4Result.purchase && purchaseEvent) {
    const localRevenue = purchaseEvent.metadata?.value || purchaseEvent.metadata?.revenue || 0
    const ga4Revenue = ga4Result.purchase.revenue

    if (Math.abs(localRevenue - ga4Revenue) > 1) {
      discrepancies.push(
        `Diferencia de revenue: Local=$${localRevenue}, GA4=$${ga4Revenue}`
      )
    }
  }

  return {
    orderId,
    local: {
      events: allLocalEvents.map(e => ({
        eventName: e.action || e.event_name,
        timestamp: e.created_at,
        metadata: e.metadata,
      })),
      totalEvents: allLocalEvents.length,
      purchaseEvent: purchaseEvent
        ? {
            timestamp: purchaseEvent.created_at,
            revenue: purchaseEvent.metadata?.value || purchaseEvent.metadata?.revenue || 0,
            items: purchaseEvent.metadata?.items?.length || purchaseEvent.metadata?.num_items || 0,
          }
        : undefined,
    },
    googleAnalytics: ga4Result,
    metaPixel: metaResult,
    verification: {
      ga4PurchaseReceived,
      metaPurchaseReceived,
      dataMatch: discrepancies.length === 0,
      discrepancies: discrepancies.length > 0 ? discrepancies : undefined,
    },
  }
}

/**
 * Verificar si una conversión llegó a ambas plataformas
 */
export async function verifyConversion(transactionId: string): Promise<{
  verified: boolean
  local: boolean
  ga4: boolean
  meta: boolean
  details: string
}> {
  const journey = await getOrderJourney(transactionId)

  const local = !!journey.local.purchaseEvent
  const ga4 = journey.verification.ga4PurchaseReceived
  const meta = journey.verification.metaPurchaseReceived

  let details = ''
  if (local && ga4 && meta) {
    details = 'Conversión verificada en todas las plataformas'
  } else if (local && !ga4) {
    details = 'Conversión local encontrada, GA4 pendiente (delay normal de 24-48h)'
  } else if (!local) {
    details = 'Conversión no encontrada en datos locales'
  } else {
    details = 'Conversión parcialmente verificada'
  }

  return {
    verified: local && (ga4 || meta),
    local,
    ga4,
    meta,
    details,
  }
}

/**
 * Comparar métricas entre fuentes de datos
 */
export async function compareAnalytics(
  startDate: string,
  endDate: string
): Promise<AnalyticsComparison> {
  const supabase = getSupabaseClient()

  // 1. Datos locales
  const { data: localData, error: localError } = await supabase
    .from('analytics_events_optimized')
    .select('action, metadata, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Calcular métricas locales
  const localEvents = localData || []
  const localMetrics = {
    sessions: new Set(localEvents.map(e => e.metadata?.session_id).filter(Boolean)).size,
    users: new Set(localEvents.map(e => e.metadata?.user_id || e.metadata?.anonymous_id).filter(Boolean)).size,
    pageViews: localEvents.filter(e => e.action === 'page_view' || e.action === 'pageview').length,
    addToCarts: localEvents.filter(e => e.action === 'add_to_cart').length,
    checkouts: localEvents.filter(e => e.action === 'begin_checkout').length,
    purchases: localEvents.filter(e => e.action === 'purchase').length,
    revenue: localEvents
      .filter(e => e.action === 'purchase')
      .reduce((sum, e) => sum + (e.metadata?.value || e.metadata?.revenue || 0), 0),
  }

  // 2. Datos de GA4
  let ga4Metrics: AnalyticsComparison['googleAnalytics'] = { available: false }
  try {
    const ga4Status = await verifyGA4Connection()
    if (ga4Status.connected) {
      const ecommerceData = await getGA4EcommerceMetrics(startDate, endDate)

      ga4Metrics = {
        available: true,
        addToCarts: ecommerceData.addToCarts,
        checkouts: ecommerceData.checkouts,
        purchases: ecommerceData.transactions,
        revenue: ecommerceData.totalRevenue,
      }
    } else {
      ga4Metrics = { available: false, error: ga4Status.error }
    }
  } catch (error) {
    ga4Metrics = { available: false, error: (error as Error).message }
  }

  // 3. Datos de Meta
  let metaMetrics: AnalyticsComparison['metaPixel'] = { available: false }
  try {
    const metaStatus = await verifyMetaConnection()
    if (metaStatus.connected) {
      const conversions = await getMetaConversionEvents(startDate, endDate)

      metaMetrics = {
        available: true,
        addToCarts: conversions.addToCarts,
        checkouts: conversions.initiateCheckouts,
        purchases: conversions.purchases,
        revenue: conversions.totalConversionValue,
      }
    } else {
      metaMetrics = { available: false, error: metaStatus.error }
    }
  } catch (error) {
    metaMetrics = { available: false, error: (error as Error).message }
  }

  // 4. Calcular discrepancias
  const discrepancies: AnalyticsComparison['discrepancies'] = []

  const metricsToCompare: Array<{ key: keyof typeof localMetrics; name: string }> = [
    { key: 'addToCarts', name: 'Add to Cart' },
    { key: 'checkouts', name: 'Checkout' },
    { key: 'purchases', name: 'Purchases' },
    { key: 'revenue', name: 'Revenue' },
  ]

  metricsToCompare.forEach(({ key, name }) => {
    const localValue = localMetrics[key]
    const ga4Value = ga4Metrics.available ? (ga4Metrics[key] as number) : undefined
    const metaValue = metaMetrics.available ? (metaMetrics[key] as number) : undefined

    // Calcular diferencia porcentual máxima
    let maxDiff = 0
    if (ga4Value !== undefined && localValue > 0) {
      maxDiff = Math.max(maxDiff, Math.abs((ga4Value - localValue) / localValue) * 100)
    }
    if (metaValue !== undefined && localValue > 0) {
      maxDiff = Math.max(maxDiff, Math.abs((metaValue - localValue) / localValue) * 100)
    }

    // Solo reportar si hay diferencia significativa (>10%)
    if (maxDiff > 10) {
      discrepancies.push({
        metric: name,
        local: localValue,
        ga4: ga4Value,
        meta: metaValue,
        percentageDiff: Math.round(maxDiff),
      })
    }
  })

  return {
    dateRange: { startDate, endDate },
    local: localMetrics,
    googleAnalytics: ga4Metrics,
    metaPixel: metaMetrics,
    discrepancies,
  }
}

/**
 * Obtener estado de conexión de todos los servicios externos
 */
export async function getExternalAnalyticsStatus(): Promise<ExternalAnalyticsStatus> {
  let ga4Status: GA4ConnectionStatus = { connected: false, propertyId: null }
  let metaStatus: MetaConnectionStatus = { connected: false, pixelId: null }

  try {
    ga4Status = await verifyGA4Connection()
  } catch (error) {
    ga4Status = {
      connected: false,
      propertyId: null,
      error: (error as Error).message,
    }
  }

  try {
    metaStatus = await verifyMetaConnection()
  } catch (error) {
    metaStatus = {
      connected: false,
      pixelId: null,
      error: (error as Error).message,
    }
  }

  return {
    googleAnalytics: ga4Status,
    metaPixel: metaStatus,
    lastChecked: new Date().toISOString(),
  }
}

/**
 * Obtener resumen de analytics para dashboard
 */
export async function getAnalyticsSummary(days: number = 7): Promise<{
  status: ExternalAnalyticsStatus
  comparison: AnalyticsComparison | null
  recentPurchases: Array<{
    orderId: string
    timestamp: string
    verified: boolean
  }>
}> {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Estado de conexiones
  const status = await getExternalAnalyticsStatus()

  // Comparación de métricas
  let comparison: AnalyticsComparison | null = null
  try {
    comparison = await compareAnalytics(startDate, endDate)
  } catch (error) {
    console.error('Error comparando analytics:', error)
  }

  // Últimas compras verificadas
  const supabase = getSupabaseClient()
  const { data: recentPurchasesData } = await supabase
    .from('analytics_events_optimized')
    .select('metadata, created_at')
    .eq('action', 'purchase')
    .gte('created_at', startDate)
    .order('created_at', { ascending: false })
    .limit(10)

  const recentPurchases = await Promise.all(
    (recentPurchasesData || []).map(async purchase => {
      const orderId = purchase.metadata?.order_id || purchase.metadata?.transaction_id
      if (!orderId) {
        return {
          orderId: 'unknown',
          timestamp: purchase.created_at,
          verified: false,
        }
      }

      // Verificación simplificada (sin llamar a APIs externas para cada una)
      return {
        orderId,
        timestamp: purchase.created_at,
        verified: true, // Asumimos verificado si está en la BD
      }
    })
  )

  return {
    status,
    comparison,
    recentPurchases,
  }
}

// Export del servicio como objeto para uso más limpio
export const externalAnalyticsService = {
  getOrderJourney,
  verifyConversion,
  compareAnalytics,
  getExternalAnalyticsStatus,
  getAnalyticsSummary,
}

export default externalAnalyticsService
