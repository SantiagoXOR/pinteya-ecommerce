/**
 * Utilidades para analizar eventos del Meta Pixel trackeados
 * Basado en eventos que ya se están enviando al Pixel
 * 
 * NOTA: Estas funciones deben ejecutarse en el servidor (API routes)
 * ya que requieren SUPABASE_SERVICE_ROLE_KEY
 */

import { MetaPixelMetrics, MetaPixelEvent } from '@/types/analytics'
import { createClient } from '@supabase/supabase-js'

// Crear cliente de Supabase solo si estamos en el servidor
const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Esta función solo puede ejecutarse en el servidor')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Obtener eventos de Meta Pixel desde nuestra base de datos
 * Busca eventos que fueron trackeados y enviados al Pixel
 */
export async function getMetaPixelEvents(
  startDate: string,
  endDate: string
): Promise<MetaPixelEvent[]> {
  try {
    const supabase = getSupabaseClient()
    
    // Buscar eventos en analytics_events que corresponden a eventos de Meta Pixel
    // Los eventos de Meta se trackean como eventos de e-commerce
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .in('action', ['add_to_cart', 'begin_checkout', 'purchase', 'view_item', 'search'])
      .eq('category', 'shop')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching Meta Pixel events:', error)
      return []
    }

    return (
      data?.map(event => ({
        eventName: mapEventNameToMeta(event.action),
        timestamp: event.created_at,
        eventId: event.id,
        metadata: event.metadata || {},
      })) || []
    )
  } catch (error) {
    console.error('Error in getMetaPixelEvents:', error)
    return []
  }
}

/**
 * Mapear nombres de eventos a eventos de Meta Pixel
 */
function mapEventNameToMeta(action: string): string {
  const mapping: Record<string, string> = {
    add_to_cart: 'AddToCart',
    begin_checkout: 'InitiateCheckout',
    purchase: 'Purchase',
    view_item: 'ViewContent',
    search: 'Search',
  }
  return mapping[action] || action
}

/**
 * Calcular métricas de Meta Pixel desde eventos
 */
export async function calculateMetaPixelMetrics(
  startDate: string,
  endDate: string
): Promise<MetaPixelMetrics> {
  const events = await getMetaPixelEvents(startDate, endDate)

  const metrics: MetaPixelMetrics = {
    totalEvents: events.length,
    addToCart: events.filter(e => e.eventName === 'AddToCart').length,
    initiateCheckout: events.filter(e => e.eventName === 'InitiateCheckout').length,
    purchase: events.filter(e => e.eventName === 'Purchase').length,
    viewContent: events.filter(e => e.eventName === 'ViewContent').length,
    search: events.filter(e => e.eventName === 'Search').length,
    eventsByDate: [],
  }

  // Agrupar eventos por fecha
  const eventsByDate = new Map<string, Map<string, number>>()

  events.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0]
    if (!eventsByDate.has(date)) {
      eventsByDate.set(date, new Map())
    }
    const dateMap = eventsByDate.get(date)!
    dateMap.set(event.eventName, (dateMap.get(event.eventName) || 0) + 1)
  })

  eventsByDate.forEach((eventMap, date) => {
    eventMap.forEach((count, eventType) => {
      metrics.eventsByDate.push({
        date,
        count,
        eventType,
      })
    })
  })

  // Ordenar por fecha
  metrics.eventsByDate.sort((a, b) => a.date.localeCompare(b.date))

  return metrics
}

/**
 * Obtener URL de Meta Events Manager
 */
export function getMetaEventsManagerUrl(pixelId: string): string {
  return `https://business.facebook.com/events_manager2/list/pixel/${pixelId}`
}

/**
 * Obtener URL de Meta Pixel Helper (para debugging)
 */
export function getMetaPixelHelperUrl(): string {
  return 'https://www.facebook.com/events_manager2/list/pixel'
}

