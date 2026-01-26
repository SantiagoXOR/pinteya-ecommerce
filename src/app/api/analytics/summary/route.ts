// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Route para generar resumen completo de analytics
 * Extrae información de eventos, journeys y carritos abandonados desde la DB
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTenantConfig } from '@/lib/tenant'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // ===================================
    // MULTITENANT: Obtener configuración del tenant
    // ===================================
    const tenant = await getTenantConfig()
    const tenantId = tenant.id

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const lastNDays = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000)
    const now = Math.floor(Date.now() / 1000)

    console.log(`📊 Generando resumen de analytics para tenant ${tenant.name} (últimos ${days} días)`)

    // ===================================
    // 1. RESUMEN DE EVENTOS
    // ===================================
    const { count: totalEvents } = await supabase
      .from('analytics_events_optimized')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', lastNDays)
      .lte('created_at', now)

    // Eventos con detalles
    const { data: eventsData } = await supabase
      .from('analytics_events_optimized')
      .select(`
        analytics_actions(name),
        analytics_categories(name),
        analytics_event_types(name),
        session_hash,
        visitor_hash,
        user_id,
        price,
        quantity,
        value
      `)
      .eq('tenant_id', tenantId)
      .gte('created_at', lastNDays)
      .lte('created_at', now)
      .limit(10000)

    const cartAdditions =
      eventsData?.filter(
        (e) => e.analytics_actions?.name === 'add_to_cart' || e.analytics_actions?.name === 'add'
      ).length || 0

    const purchases = eventsData?.filter((e) => e.analytics_actions?.name === 'purchase').length || 0

    const checkoutStarts =
      eventsData?.filter((e) => e.analytics_actions?.name === 'begin_checkout').length || 0

    const sessionHashes = new Set(eventsData?.map((e) => e.session_hash).filter(Boolean) || [])
    const visitorHashes = new Set(
      eventsData?.map((e) => e.visitor_hash).filter((v) => v != null) || []
    )

    // ===================================
    // 2. RESUMEN DE JOURNEYS
    // ===================================
    const { data: journeyEvents } = await supabase
      .from('analytics_events_optimized')
      .select(`
        session_hash,
        created_at,
        analytics_pages(path),
        analytics_actions(name)
      `)
      .eq('tenant_id', tenantId)
      .gte('created_at', lastNDays)
      .lte('created_at', now)
      .not('session_hash', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5000)

    // Agrupar por sesión
    const journeysBySession = new Map<string, any[]>()
    journeyEvents?.forEach((event) => {
      const session = event.session_hash?.toString() || 'unknown'
      if (!journeysBySession.has(session)) {
        journeysBySession.set(session, [])
      }
      journeysBySession.get(session)!.push({
        page: event.analytics_pages?.path || 'unknown',
        action: event.analytics_actions?.name || 'unknown',
        timestamp: event.created_at,
      })
    })

    // Calcular métricas de journeys
    const journeyStats = Array.from(journeysBySession.values()).map((events) => {
      const pages = new Set(events.map((e) => e.page))
      const duration =
        events.length > 1
          ? (events[events.length - 1].timestamp - events[0].timestamp) / 60
          : 0
      const hasPurchase = events.some((e) => e.action === 'purchase')
      const hasCart = events.some((e) => e.action === 'add_to_cart' || e.action === 'add')

      return {
        pageCount: pages.size,
        eventCount: events.length,
        duration,
        hasPurchase,
        hasCart,
        converted: hasPurchase,
        abandoned: hasCart && !hasPurchase,
      }
    })

    const totalJourneys = journeyStats.length
    const convertedJourneys = journeyStats.filter((j) => j.converted).length
    const abandonedJourneys = journeyStats.filter((j) => j.abandoned).length
    const avgPagesPerJourney =
      totalJourneys > 0
        ? journeyStats.reduce((sum, j) => sum + j.pageCount, 0) / totalJourneys
        : 0
    const avgDuration =
      totalJourneys > 0
        ? journeyStats.reduce((sum, j) => sum + j.duration, 0) / totalJourneys
        : 0

    // ===================================
    // 3. RESUMEN DE CARRITOS ABANDONADOS
    // ===================================
    const { data: cartEvents } = await supabase
      .from('analytics_events_optimized')
      .select(`
        session_hash,
        visitor_hash,
        user_id,
        created_at,
        analytics_actions(name),
        analytics_pages(path),
        price,
        quantity,
        product_name
      `)
      .eq('tenant_id', tenantId)
      .gte('created_at', lastNDays)
      .lte('created_at', now)
      .limit(10000)

    // Filtrar eventos relevantes
    const relevantEvents = (cartEvents || []).filter((event) => {
      const action = event.analytics_actions?.name || ''
      return (
        action === 'add_to_cart' ||
        action === 'add' ||
        action === 'begin_checkout' ||
        action === 'purchase'
      )
    })

    // Agrupar por sesión
    const cartsBySession = new Map<string, any[]>()
    relevantEvents.forEach((event) => {
      const session = event.session_hash?.toString() || 'unknown'
      if (!cartsBySession.has(session)) {
        cartsBySession.set(session, [])
      }
      cartsBySession.get(session)!.push(event)
    })

    // Identificar carritos abandonados
    const abandonedCarts: any[] = []
    let totalAbandonedValue = 0

    for (const [session, events] of cartsBySession.entries()) {
      const hasPurchase = events.some((e) => e.analytics_actions?.name === 'purchase')
      if (hasPurchase) continue

      const cartValue = events.reduce((sum, event) => {
        const action = event.analytics_actions?.name || ''
        if (action === 'add_to_cart' || action === 'add') {
          return sum + (event.price || 0) * (event.quantity || 1)
        }
        return sum
      }, 0)

      if (cartValue > 0) {
        const sortedEvents = [...events].sort((a, b) => b.created_at - a.created_at)
        const lastEvent = sortedEvents[0]
        abandonedCarts.push({
          session,
          cartValue,
          lastPage: lastEvent.analytics_pages?.path || 'unknown',
          lastAction: lastEvent.analytics_actions?.name || 'unknown',
          timeSinceAbandonment: now - lastEvent.created_at,
        })
        totalAbandonedValue += cartValue
      }
    }

    // Abandono por página
    const abandonmentByPage = new Map<string, number>()
    abandonedCarts.forEach((cart) => {
      const page = cart.lastPage
      abandonmentByPage.set(page, (abandonmentByPage.get(page) || 0) + 1)
    })

    // ===================================
    // RESUMEN FINAL
    // ===================================
    const summary = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      period: {
        days,
        startDate: new Date(lastNDays * 1000).toISOString(),
        endDate: new Date(now * 1000).toISOString(),
      },
      events: {
        totalEvents: totalEvents || 0,
        sessionCount: sessionHashes.size,
        visitorCount: visitorHashes.size,
        cartAdditions,
        checkoutStarts,
        purchases,
        abandonmentRate: cartAdditions > 0 ? ((cartAdditions - purchases) / cartAdditions) * 100 : 0,
        conversionRate: checkoutStarts > 0 ? (purchases / checkoutStarts) * 100 : 0,
      },
      journeys: {
        totalJourneys,
        convertedJourneys,
        abandonedJourneys,
        conversionRate: totalJourneys > 0 ? (convertedJourneys / totalJourneys) * 100 : 0,
        avgPagesPerJourney: Math.round(avgPagesPerJourney * 10) / 10,
        avgDuration: Math.round(avgDuration * 10) / 10,
      },
      abandonedCarts: {
        totalAbandoned: abandonedCarts.length,
        totalAbandonedValue,
        averageCartValue:
          abandonedCarts.length > 0 ? totalAbandonedValue / abandonedCarts.length : 0,
        abandonmentByPage: Array.from(abandonmentByPage.entries())
          .map(([page, count]) => ({ page, count, percentage: (count / abandonedCarts.length) * 100 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
      },
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error generando resumen:', error)
    return NextResponse.json(
      { error: 'Error generando resumen', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
