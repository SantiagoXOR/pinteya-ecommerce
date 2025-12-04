// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Route para métricas de analytics
 * Calcula y devuelve métricas de conversión y comportamiento
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface MetricsQuery {
  startDate?: string
  endDate?: string
  userId?: string
  sessionId?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate =
      searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')

    // Construir query base usando vista unificada
    let baseQuery = supabase
      .from('analytics_events_unified')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (userId) {
      baseQuery = baseQuery.eq('user_id', userId)
    }

    if (sessionId) {
      baseQuery = baseQuery.eq('session_id', sessionId)
    }

    const { data: events, error } = await baseQuery

    if (error) {
      console.error('Error obteniendo eventos:', error)
      return NextResponse.json({ error: 'Error obteniendo eventos' }, { status: 500 })
    }

    // Calcular métricas
    const metrics = calculateMetrics(events || [])

    // Obtener métricas adicionales
    const additionalMetrics = await getAdditionalMetrics(startDate, endDate, userId || undefined)

    return NextResponse.json({
      ...metrics,
      ...additionalMetrics,
      period: {
        startDate,
        endDate,
      },
      totalEvents: events?.length || 0,
    })
  } catch (error) {
    console.error('Error calculando métricas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

function calculateMetrics(events: any[]) {
  const ecommerceEvents = events.filter(e => e.category === 'shop')
  const navigationEvents = events.filter(e => e.category === 'navigation')

  // Métricas básicas de e-commerce
  const cartAdditions = ecommerceEvents.filter(e => e.action === 'add_to_cart' || e.action === 'add').length
  const cartRemovals = ecommerceEvents.filter(e => e.action === 'remove_from_cart' || e.action === 'remove').length
  const checkoutStarts = ecommerceEvents.filter(e => e.action === 'begin_checkout').length
  const checkoutCompletions = ecommerceEvents.filter(e => e.action === 'purchase').length
  const productViews = navigationEvents.filter(e => e.page?.includes('/product/') || e.page?.includes('/buy/')).length
  const categoryViews = navigationEvents.filter(e => e.page?.includes('/category/')).length
  
  // Búsquedas: manejar ambos formatos (search_query y search)
  const searchEvents = events.filter(e => 
    (e.category === 'search' && (e.action === 'search' || e.action === 'search_query')) ||
    (e.event_name === 'search' || e.event_name === 'search_query')
  )
  const searchQueries = searchEvents.length

  // Calcular tasas de conversión
  const conversionRate = checkoutStarts > 0 ? (checkoutCompletions / checkoutStarts) * 100 : 0
  const cartAbandonmentRate =
    cartAdditions > 0 ? ((cartAdditions - checkoutCompletions) / cartAdditions) * 100 : 0
  const productToCartRate = productViews > 0 ? (cartAdditions / productViews) * 100 : 0

  // Calcular AOV (Average Order Value)
  const purchaseEvents = ecommerceEvents.filter(e => e.action === 'purchase')
  const totalValue = purchaseEvents.reduce((sum, event) => sum + (event.value || 0), 0)
  const averageOrderValue = purchaseEvents.length > 0 ? totalValue / purchaseEvents.length : 0

  // Métricas de sesión
  const uniqueSessions = new Set(events.map(e => e.session_id)).size
  const uniqueUsers = new Set(events.filter(e => e.user_id).map(e => e.user_id)).size
  const averageEventsPerSession = uniqueSessions > 0 ? events.length / uniqueSessions : 0

  // Páginas más visitadas
  const pageViews = navigationEvents.filter(e => e.action === 'view')
  const pageViewCounts = pageViews.reduce(
    (acc, event) => {
      const page = event.page || 'unknown'
      acc[page] = (acc[page] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const topPages = Object.entries(pageViewCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([page, views]) => ({ page, views: views as number }))

  // Productos más vistos
  const productViewEvents = ecommerceEvents.filter(e => e.action === 'view_item')
  const productViewCounts = productViewEvents.reduce(
    (acc, event) => {
      const productId = event.metadata?.item_id || 'unknown'
      const productName = event.metadata?.item_name || 'Unknown Product'
      const key = `${productId}:${productName}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const topProducts = Object.entries(productViewCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([key, views]) => {
      const [productId, productName] = key.split(':')
      return { productId, productName, views: views as number }
    })

  // Métricas de tiempo
  const sessionDurations = calculateSessionDurations(events)
  const averageSessionDuration =
    sessionDurations.length > 0
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0

  return {
    ecommerce: {
      cartAdditions,
      cartRemovals,
      checkoutStarts,
      checkoutCompletions,
      productViews,
      categoryViews,
      searchQueries,
      conversionRate: Math.round(conversionRate * 100) / 100,
      cartAbandonmentRate: Math.round(cartAbandonmentRate * 100) / 100,
      productToCartRate: Math.round(productToCartRate * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalRevenue: totalValue,
    },
    engagement: {
      uniqueSessions,
      uniqueUsers,
      averageEventsPerSession: Math.round(averageEventsPerSession * 100) / 100,
      averageSessionDuration: Math.round(averageSessionDuration / 1000), // en segundos
      topPages,
      topProducts,
    },
    trends: {
      dailyEvents: getDailyEventTrends(events),
      hourlyEvents: getHourlyEventTrends(events),
    },
  }
}

function calculateSessionDurations(events: any[]): number[] {
  const sessionEvents = events.reduce(
    (acc, event) => {
      const sessionId = event.session_id
      if (!acc[sessionId]) {
        acc[sessionId] = []
      }
      acc[sessionId].push(new Date(event.created_at).getTime())
      return acc
    },
    {} as Record<string, number[]>
  )

  return (Object.values(sessionEvents) as number[][]).map(timestamps => {
    if (timestamps.length < 2) {
      return 0
    }
    const sorted = timestamps.sort((a, b) => a - b)
    return sorted[sorted.length - 1] - sorted[0]
  })
}

function getDailyEventTrends(events: any[]) {
  const dailyCounts = events.reduce(
    (acc, event) => {
      const date = new Date(event.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return Object.entries(dailyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
}

function getHourlyEventTrends(events: any[]) {
  const hourlyCounts = events.reduce(
    (acc, event) => {
      const hour = new Date(event.created_at).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    },
    {} as Record<number, number>
  )

  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourlyCounts[hour] || 0,
  }))
}

async function getAdditionalMetrics(startDate: string, endDate: string, userId?: string) {
  try {
    // Obtener métricas de la base de datos principal
    let ordersQuery = supabase
      .from('orders')
      .select('total, created_at, user_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (userId) {
      ordersQuery = ordersQuery.eq('user_id', userId)
    }

    const { data: orders } = await ordersQuery

    const totalOrders = orders?.length || 0
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

    return {
      orders: {
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
    }
  } catch (error) {
    console.error('Error obteniendo métricas adicionales:', error)
    return {
      orders: {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      },
    }
  }
}
