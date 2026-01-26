// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Route para generar journeys de usuario
 * Con soporte multitenant completo
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { getTenantConfig } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    // ===================================
    // MULTITENANT: Obtener configuración del tenant
    // ===================================
    const tenant = await getTenantConfig()
    const tenantId = tenant.id

    const { searchParams } = new URL(request.url)
    const identifier = searchParams.get('identifier')
    const identifierType = searchParams.get('identifierType') || 'session' // 'session' | 'visitor' | 'user'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!identifier) {
      return NextResponse.json({ error: 'identifier es requerido' }, { status: 400 })
    }

    if (!['session', 'visitor', 'user'].includes(identifierType)) {
      return NextResponse.json(
        { error: 'identifierType debe ser: session, visitor o user' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Servicio de base de datos no disponible' }, { status: 503 })
    }

    // Construir query según el tipo de identificador
    let query = supabase
      .from('analytics_events_optimized')
      .select(`
        id,
        created_at,
        session_hash,
        visitor_hash,
        user_id,
        event_type,
        category_id,
        action_id,
        label,
        value,
        page_id,
        product_id,
        product_name,
        category_name,
        price,
        quantity,
        device_type,
        analytics_event_types(name),
        analytics_categories(name),
        analytics_actions(name),
        analytics_pages(path)
      `)
      .eq('tenant_id', tenantId) // MULTITENANT: Filtrar por tenant
      .order('created_at', { ascending: true })

    // Aplicar filtro según el tipo de identificador
    if (identifierType === 'session') {
      query = query.eq('session_hash', parseInt(identifier) || 0)
    } else if (identifierType === 'visitor') {
      query = query.eq('visitor_hash', identifier)
    } else if (identifierType === 'user') {
      query = query.eq('user_id', identifier)
    }

    // Aplicar filtros de fecha
    if (startDate) {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
      query = query.gte('created_at', startTimestamp)
    }

    if (endDate) {
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)
      query = query.lte('created_at', endTimestamp)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error obteniendo journey:', error)
      return NextResponse.json({ error: 'Error obteniendo journey' }, { status: 500 })
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        identifier,
        identifierType,
        events: [],
        timeline: [],
        pages: [],
        actions: [],
        cartState: [],
        conversionPoints: [],
        abandonmentPoints: [],
      })
    }

    // Construir timeline y análisis del journey
    const timeline = events.map((event: any, index: number) => {
      const prevEvent = index > 0 ? events[index - 1] : null
      const timeSincePrev = prevEvent
        ? new Date(event.created_at * 1000).getTime() - new Date(prevEvent.created_at * 1000).getTime()
        : 0

      return {
        eventId: event.id,
        timestamp: event.created_at,
        eventType: event.analytics_event_types?.name || 'unknown',
        category: event.analytics_categories?.name || 'unknown',
        action: event.analytics_actions?.name || 'unknown',
        page: event.analytics_pages?.path || 'unknown',
        label: event.label,
        value: event.value,
        productId: event.product_id,
        productName: event.product_name,
        price: event.price,
        quantity: event.quantity,
        timeSincePrev: timeSincePrev / 1000, // en segundos
      }
    })

    // Extraer páginas únicas en orden
    const pages = Array.from(
      new Map(
        events
          .map((event: any) => event.analytics_pages?.path)
          .filter(Boolean)
          .map((page: string, index: number) => [page, index])
      ).keys()
    )

    // Extraer acciones únicas
    const actions = Array.from(
      new Set(events.map((event: any) => event.analytics_actions?.name).filter(Boolean))
    )

    // Identificar estado del carrito en cada punto
    const cartState = events.map((event: any) => {
      const action = event.analytics_actions?.name || ''
      const isCartAction = action === 'add_to_cart' || action === 'add' || action === 'remove_from_cart' || action === 'remove'
      const isCheckout = action === 'begin_checkout'
      const isPurchase = action === 'purchase'

      return {
        timestamp: event.created_at,
        hasItems: isCartAction && (action === 'add_to_cart' || action === 'add'),
        itemCount: event.quantity || 0,
        totalValue: event.price ? event.price * (event.quantity || 1) : 0,
        inCheckout: isCheckout,
        purchased: isPurchase,
      }
    })

    // Identificar puntos de conversión
    const conversionPoints = events
      .filter((event: any) => event.analytics_actions?.name === 'purchase')
      .map((event: any) => ({
        timestamp: event.created_at,
        page: event.analytics_pages?.path || 'unknown',
        value: event.value || 0,
      }))

    // Identificar puntos de abandono (último evento de carrito sin purchase posterior)
    const abandonmentPoints: any[] = []
    let lastCartEvent: any = null

    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i]
      const action = event.analytics_actions?.name || ''

      if (action === 'purchase') {
        // Si hay un purchase, no hay abandono
        break
      }

      if (action === 'add_to_cart' || action === 'add' || action === 'begin_checkout') {
        if (!lastCartEvent) {
          lastCartEvent = event
        }
      }
    }

    if (lastCartEvent && conversionPoints.length === 0) {
      abandonmentPoints.push({
        timestamp: lastCartEvent.created_at,
        page: lastCartEvent.analytics_pages?.path || 'unknown',
        lastAction: lastCartEvent.analytics_actions?.name || 'unknown',
        cartValue: lastCartEvent.price ? lastCartEvent.price * (lastCartEvent.quantity || 1) : 0,
      })
    }

    return NextResponse.json({
      identifier,
      identifierType,
      events: timeline,
      timeline,
      pages,
      actions,
      cartState,
      conversionPoints,
      abandonmentPoints,
      summary: {
        totalEvents: events.length,
        totalPages: pages.length,
        totalActions: actions.length,
        hasConversion: conversionPoints.length > 0,
        hasAbandonment: abandonmentPoints.length > 0,
        duration: events.length > 1
          ? (events[events.length - 1].created_at - events[0].created_at) / 60 // en minutos
          : 0,
      },
    })
  } catch (error) {
    console.error('Error procesando journey:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
