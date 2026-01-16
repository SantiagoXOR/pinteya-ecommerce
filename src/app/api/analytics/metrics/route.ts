// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Route para métricas de analytics
 * Usa servicio centralizado de cálculos con cache
 */

import { NextRequest, NextResponse } from 'next/server'
import { metricsCalculator } from '@/lib/analytics/metrics-calculator'
import { metricsCache } from '@/lib/analytics/metrics-cache'
import { MetricsQueryParams } from '@/lib/analytics/types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate =
      searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')
    const includeAdvanced = searchParams.get('advanced') === 'true'

    const params: MetricsQueryParams = {
      startDate,
      endDate,
      userId: userId || undefined,
      sessionId: sessionId || undefined,
    }

    // Determinar tipo de cache según rango de fechas
    const daysDiff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    let cacheType: 'realtime' | 'daily' | 'weekly' | 'monthly' = 'daily'
    if (daysDiff <= 1) {
      cacheType = 'realtime'
    } else if (daysDiff <= 7) {
      cacheType = 'daily'
    } else if (daysDiff <= 30) {
      cacheType = 'weekly'
    } else {
      cacheType = 'monthly'
    }

    // Intentar obtener desde cache
    const cacheKey = metricsCache.generateKey(params, cacheType)
    const cached = await metricsCache.get(cacheKey)

    if (cached) {
      return NextResponse.json({
        ...cached,
        period: {
          startDate,
          endDate,
        },
        cached: true,
      })
    }

    // Calcular métricas usando servicio centralizado
    const metrics = includeAdvanced
      ? await metricsCalculator.calculateAdvancedMetrics(params)
      : await metricsCalculator.calculateMetrics(params)

    // Obtener métricas adicionales de órdenes
    const additionalMetrics = await getAdditionalMetrics(startDate, endDate, userId || undefined)

    // Calcular comparación con período anterior
    const periodDuration = new Date(endDate).getTime() - new Date(startDate).getTime()
    const previousStartDate = new Date(new Date(startDate).getTime() - periodDuration).toISOString()
    const previousEndDate = startDate

    const previousParams: MetricsQueryParams = {
      startDate: previousStartDate,
      endDate: previousEndDate,
      userId: userId || undefined,
      sessionId: sessionId || undefined,
    }

    const previousMetrics = includeAdvanced
      ? await metricsCalculator.calculateAdvancedMetrics(previousParams)
      : await metricsCalculator.calculateMetrics(previousParams)

    const comparison = calculateChanges(metrics, previousMetrics)

    const result = {
      ...metrics,
      ...additionalMetrics,
      period: {
        startDate,
        endDate,
      },
      comparison: {
        previousPeriod: previousMetrics,
        changes: comparison,
      },
    }

    // Almacenar en cache
    const ttl = metricsCache.getTTL(cacheType)
    await metricsCache.set(cacheKey, metrics, ttl)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error calculando métricas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Funciones helper mantenidas para compatibilidad (deprecated - usar metricsCalculator)
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

async function getPreviousPeriodMetrics(startDate: string, endDate: string, userId?: string) {
  try {
    const params: MetricsQueryParams = {
      startDate,
      endDate,
      userId: userId || undefined,
    }

    const metrics = await metricsCalculator.calculateMetrics(params)
    const additionalMetrics = await getAdditionalMetrics(startDate, endDate, userId)

    return {
      ...metrics,
      ...additionalMetrics,
    }
  } catch (error) {
    console.error('Error obteniendo métricas del período anterior:', error)
    return null
  }
}

function calculateChanges(current: any, previous: any) {
  if (!previous) {
    return null
  }

  const calculateChange = (currentVal: number, previousVal: number) => {
    if (previousVal === 0) return currentVal > 0 ? 100 : 0
    return ((currentVal - previousVal) / previousVal) * 100
  }

  return {
    ecommerce: {
      productViews: calculateChange(current.ecommerce?.productViews || 0, previous.ecommerce?.productViews || 0),
      cartAdditions: calculateChange(current.ecommerce?.cartAdditions || 0, previous.ecommerce?.cartAdditions || 0),
      checkoutStarts: calculateChange(current.ecommerce?.checkoutStarts || 0, previous.ecommerce?.checkoutStarts || 0),
      checkoutCompletions: calculateChange(
        current.ecommerce?.checkoutCompletions || 0,
        previous.ecommerce?.checkoutCompletions || 0
      ),
      conversionRate: calculateChange(current.ecommerce?.conversionRate || 0, previous.ecommerce?.conversionRate || 0),
      totalRevenue: calculateChange(current.orders?.totalRevenue || 0, previous.orders?.totalRevenue || 0),
    },
    engagement: {
      uniqueSessions: calculateChange(current.engagement?.uniqueSessions || 0, previous.engagement?.uniqueSessions || 0),
      uniqueUsers: calculateChange(current.engagement?.uniqueUsers || 0, previous.engagement?.uniqueUsers || 0),
      averageSessionDuration: calculateChange(
        current.engagement?.averageSessionDuration || 0,
        previous.engagement?.averageSessionDuration || 0
      ),
    },
  }
}

// Función deprecated - ahora se usa calculateAdvancedMetrics del servicio
function calculateAdvancedAnalysis(events: any[], currentMetrics: any, previousMetrics: any) {
  // Esta función se mantiene solo para compatibilidad
  // El análisis avanzado ahora se hace en metricsCalculator.calculateAdvancedMetrics
  return {
    devices: currentMetrics.devices || {},
    categories: currentMetrics.categories || {},
    behavior: currentMetrics.behavior || {},
    retention: currentMetrics.retention || {},
  }
}

function analyzeDevices(events: any[]) {
  const deviceCounts: Record<string, number> = {}
  const browserCounts: Record<string, number> = {}

  events.forEach(event => {
    const userAgent = event.user_agent || ''
    let device = 'Unknown'
    let browser = 'Unknown'

    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      device = 'Mobile'
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      device = 'Tablet'
    } else {
      device = 'Desktop'
    }

    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'

    deviceCounts[device] = (deviceCounts[device] || 0) + 1
    browserCounts[browser] = (browserCounts[browser] || 0) + 1
  })

  const total = events.length
  return {
    devices: Object.entries(deviceCounts).map(([device, count]) => ({
      device,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    })),
    browsers: Object.entries(browserCounts).map(([browser, count]) => ({
      browser,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    })),
  }
}

function analyzeCategories(events: any[]) {
  const categoryCounts: Record<string, number> = {}
  const categoryRevenue: Record<string, number> = {}

  events.forEach(event => {
    const category = event.category || 'unknown'
    categoryCounts[category] = (categoryCounts[category] || 0) + 1

    if (event.action === 'purchase' && event.value) {
      categoryRevenue[category] = (categoryRevenue[category] || 0) + (event.value || 0)
    }
  })

  return {
    distribution: Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: events.length > 0 ? (count / events.length) * 100 : 0,
    })),
    revenue: Object.entries(categoryRevenue).map(([category, revenue]) => ({
      category,
      revenue,
    })),
  }
}

function analyzeBehavior(events: any[], metrics: any) {
  // Análisis de flujo de usuario
  const userFlows: Record<string, number> = {}
  const previousPages: Record<string, string> = {}

  events.forEach(event => {
    const sessionId = event.session_id
    const page = event.page || 'unknown'

    if (previousPages[sessionId]) {
      const flow = `${previousPages[sessionId]} → ${page}`
      userFlows[flow] = (userFlows[flow] || 0) + 1
    }

    previousPages[sessionId] = page
  })

  // Análisis de tiempo en página
  const pageTimes: Record<string, number[]> = {}
  const sessionPages: Record<string, Array<{ page: string; time: number }>> = {}

  events.forEach(event => {
    const sessionId = event.session_id
    const page = event.page || 'unknown'
    const time = new Date(event.created_at).getTime()

    if (!sessionPages[sessionId]) {
      sessionPages[sessionId] = []
    }
    sessionPages[sessionId].push({ page, time })
  })

  Object.values(sessionPages).forEach(pages => {
    pages.sort((a, b) => a.time - b.time)
    for (let i = 1; i < pages.length; i++) {
      const page = pages[i - 1].page
      const duration = pages[i].time - pages[i - 1].time
      if (!pageTimes[page]) {
        pageTimes[page] = []
      }
      pageTimes[page].push(duration)
    }
  })

  const averagePageTimes = Object.entries(pageTimes).map(([page, times]) => ({
    page,
    averageTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : 0, // en segundos
  }))

  return {
    topFlows: Object.entries(userFlows)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([flow, count]) => ({ flow, count })),
    averagePageTimes,
    bounceRate: calculateBounceRate(events, metrics),
  }
}

function calculateBounceRate(events: any[], metrics: any) {
  // Una sesión con solo 1 evento se considera "bounce"
  const sessionEventCounts: Record<string, number> = {}
  events.forEach(event => {
    const sessionId = event.session_id
    sessionEventCounts[sessionId] = (sessionEventCounts[sessionId] || 0) + 1
  })

  const bounceSessions = Object.values(sessionEventCounts).filter(count => count === 1).length
  const totalSessions = metrics.engagement.uniqueSessions

  return totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0
}

function analyzeRetention(events: any[]) {
  // Análisis de usuarios recurrentes
  const userSessions: Record<string, Set<string>> = {}

  events.forEach(event => {
    if (event.user_id) {
      if (!userSessions[event.user_id]) {
        userSessions[event.user_id] = new Set()
      }
      userSessions[event.user_id].add(event.session_id)
    }
  })

  const returningUsers = Object.values(userSessions).filter(sessions => sessions.size > 1).length
  const totalUsers = Object.keys(userSessions).length

  return {
    returningUsers,
    newUsers: totalUsers - returningUsers,
    retentionRate: totalUsers > 0 ? (returningUsers / totalUsers) * 100 : 0,
    averageSessionsPerUser:
      totalUsers > 0
        ? Object.values(userSessions).reduce((sum, sessions) => sum + sessions.size, 0) / totalUsers
        : 0,
  }
}
