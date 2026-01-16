/**
 * Servicio centralizado de cálculos de métricas de analytics
 * Elimina duplicación de código y proporciona cálculos consistentes
 */

import { createClient } from '@supabase/supabase-js'
import {
  AnalyticsMetrics,
  EcommerceMetrics,
  EngagementMetrics,
  TrendsData,
  DeviceAnalysis,
  CategoryAnalysis,
  BehaviorAnalysis,
  RetentionAnalysis,
  MetricsQueryParams,
} from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RawEvent {
  id: string
  event_type?: number
  category_id?: number
  action_id?: number
  label?: string
  value?: number
  user_id?: string
  session_hash?: string
  page_id?: number
  created_at: string
  // Campos de lookup (cuando se hace JOIN)
  analytics_event_types?: { name: string }
  analytics_categories?: { name: string }
  analytics_actions?: { name: string }
  analytics_pages?: { path: string }
  // Campos de tabla antigua (compatibilidad)
  event_name?: string
  category?: string
  action?: string
  page?: string
  session_id?: string
}

class MetricsCalculator {
  /**
   * Calcular métricas completas desde eventos
   */
  async calculateMetrics(params: MetricsQueryParams): Promise<AnalyticsMetrics> {
    const events = await this.fetchEvents(params)

    const ecommerce = this.calculateEcommerceMetrics(events)
    const engagement = this.calculateEngagementMetrics(events)
    const trends = this.calculateTrends(events)

    return {
      ecommerce,
      engagement,
      trends,
    }
  }

  /**
   * Calcular métricas con análisis avanzado
   */
  async calculateAdvancedMetrics(params: MetricsQueryParams): Promise<AnalyticsMetrics> {
    const events = await this.fetchEvents(params)

    const ecommerce = this.calculateEcommerceMetrics(events)
    const engagement = this.calculateEngagementMetrics(events)
    const trends = this.calculateTrends(events)
    const devices = this.analyzeDevices(events)
    const categories = this.analyzeCategories(events)
    const behavior = this.analyzeBehavior(events, engagement)
    const retention = this.analyzeRetention(events)

    return {
      ecommerce,
      engagement,
      trends,
      devices,
      categories,
      behavior,
      retention,
    }
  }

  /**
   * Obtener eventos desde la base de datos
   */
  private async fetchEvents(params: MetricsQueryParams): Promise<RawEvent[]> {
    try {
      // Usar tabla optimizada directamente
      let query = supabase
        .from('analytics_events_optimized')
        .select(`
          id,
          event_type,
          category_id,
          action_id,
          label,
          value,
          user_id,
          session_hash,
          page_id,
          created_at,
          analytics_event_types(name),
          analytics_categories(name),
          analytics_actions(name),
          analytics_pages(path)
        `)
        .gte('created_at', Math.floor(new Date(params.startDate).getTime() / 1000))
        .lte('created_at', Math.floor(new Date(params.endDate).getTime() / 1000))

      if (params.userId) {
        query = query.eq('user_id', params.userId)
      }

      if (params.sessionId) {
        // Para session_id necesitamos hacer hash del sessionId proporcionado
        // Por ahora, usamos un filtro más simple
        query = query.eq('session_hash', this.hashSessionId(params.sessionId))
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error obteniendo eventos:', error)
        return []
      }

      return (data as RawEvent[]) || []
    } catch (error) {
      console.error('Error en fetchEvents:', error)
      return []
    }
  }

  /**
   * Hash de session ID (debe coincidir con la función en la BD)
   */
  private hashSessionId(sessionId: string): number {
    // Implementación simple de hash (debe coincidir con HASHTEXT de PostgreSQL)
    let hash = 0
    for (let i = 0; i < sessionId.length; i++) {
      const char = sessionId.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Normalizar evento para trabajar con ambos formatos
   */
  private normalizeEvent(event: RawEvent) {
    return {
      eventName: event.analytics_event_types?.name || event.event_name || 'unknown',
      category: event.analytics_categories?.name || event.category || 'unknown',
      action: event.analytics_actions?.name || event.action || 'unknown',
      label: event.label,
      value: event.value,
      userId: event.user_id,
      sessionId: event.session_hash?.toString() || event.session_id || '',
      page: event.analytics_pages?.path || event.page || '',
      createdAt: event.created_at,
    }
  }

  /**
   * Calcular métricas de e-commerce
   */
  private calculateEcommerceMetrics(events: RawEvent[]): EcommerceMetrics {
    const normalized = events.map(e => this.normalizeEvent(e))
    const ecommerceEvents = normalized.filter(e => e.category === 'shop' || e.category === 'ecommerce')

    const cartAdditions = ecommerceEvents.filter(
      e => e.action === 'add_to_cart' || e.action === 'add'
    ).length
    const cartRemovals = ecommerceEvents.filter(
      e => e.action === 'remove_from_cart' || e.action === 'remove'
    ).length
    const checkoutStarts = ecommerceEvents.filter(e => e.action === 'begin_checkout').length
    const checkoutCompletions = ecommerceEvents.filter(e => e.action === 'purchase').length
    const productViews = normalized.filter(
      e => e.page?.includes('/product/') || e.page?.includes('/buy/') || e.action === 'view_item'
    ).length
    const categoryViews = normalized.filter(
      e => e.page?.includes('/category/') || e.action === 'view_category'
    ).length

    const searchEvents = normalized.filter(
      e =>
        (e.category === 'search' && (e.action === 'search' || e.action === 'search_query')) ||
        e.eventName === 'search' ||
        e.eventName === 'search_query'
    )
    const searchQueries = searchEvents.length

    const conversionRate = checkoutStarts > 0 ? (checkoutCompletions / checkoutStarts) * 100 : 0
    const cartAbandonmentRate =
      cartAdditions > 0 ? ((cartAdditions - checkoutCompletions) / cartAdditions) * 100 : 0
    const productToCartRate = productViews > 0 ? (cartAdditions / productViews) * 100 : 0

    const purchaseEvents = ecommerceEvents.filter(e => e.action === 'purchase')
    const totalValue = purchaseEvents.reduce((sum, event) => sum + (event.value || 0), 0)
    const averageOrderValue = purchaseEvents.length > 0 ? totalValue / purchaseEvents.length : 0

    return {
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
    }
  }

  /**
   * Calcular métricas de engagement
   */
  private calculateEngagementMetrics(events: RawEvent[]): EngagementMetrics {
    const normalized = events.map(e => this.normalizeEvent(e))

    const uniqueSessions = new Set(normalized.map(e => e.sessionId)).size
    const uniqueUsers = new Set(normalized.filter(e => e.userId).map(e => e.userId)).size
    const averageEventsPerSession = uniqueSessions > 0 ? normalized.length / uniqueSessions : 0

    // Calcular duración de sesión
    const sessionDurations = this.calculateSessionDurations(normalized)
    const averageSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
        : 0

    // Páginas más visitadas
    const pageViews = normalized.filter(e => e.action === 'view' || e.eventName === 'page_view')
    const pageViewCounts = pageViews.reduce(
      (acc, event) => {
        const page = event.page || 'unknown'
        acc[page] = (acc[page] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const topPages = Object.entries(pageViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }))

    // Productos más vistos
    const productViewEvents = normalized.filter(e => e.action === 'view_item')
    const productViewCounts = productViewEvents.reduce(
      (acc, event) => {
        const productId = event.label || 'unknown'
        const productName = event.label || 'Unknown Product'
        const key = `${productId}:${productName}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const topProducts = Object.entries(productViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, views]) => {
        const [productId, productName] = key.split(':')
        return { productId, productName, views }
      })

    return {
      uniqueSessions,
      uniqueUsers,
      averageEventsPerSession: Math.round(averageEventsPerSession * 100) / 100,
      averageSessionDuration: Math.round(averageSessionDuration / 1000), // en segundos
      topPages,
      topProducts,
    }
  }

  /**
   * Calcular duraciones de sesión
   */
  private calculateSessionDurations(events: Array<ReturnType<typeof this.normalizeEvent>>): number[] {
    const sessionEvents = events.reduce(
      (acc, event) => {
        const sessionId = event.sessionId
        if (!acc[sessionId]) {
          acc[sessionId] = []
        }
        acc[sessionId].push(new Date(event.createdAt).getTime())
        return acc
      },
      {} as Record<string, number[]>
    )

    return Object.values(sessionEvents).map(timestamps => {
      if (timestamps.length < 2) {
        return 0
      }
      const sorted = timestamps.sort((a, b) => a - b)
      return sorted[sorted.length - 1] - sorted[0]
    })
  }

  /**
   * Calcular tendencias
   */
  private calculateTrends(events: RawEvent[]): TrendsData {
    const normalized = events.map(e => this.normalizeEvent(e))

    // Tendencias diarias
    const dailyCounts = normalized.reduce(
      (acc, event) => {
        const date = new Date(event.createdAt).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const dailyEvents = Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))

    // Tendencias horarias
    const hourlyCounts = normalized.reduce(
      (acc, event) => {
        const hour = new Date(event.createdAt).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      },
      {} as Record<number, number>
    )

    const hourlyEvents = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyCounts[hour] || 0,
    }))

    return {
      dailyEvents,
      hourlyEvents,
    }
  }

  /**
   * Análisis de dispositivos
   */
  private analyzeDevices(events: RawEvent[]): DeviceAnalysis {
    const deviceCounts: Record<string, number> = {}
    const browserCounts: Record<string, number> = {}

    events.forEach(event => {
      // Para eventos optimizados, necesitamos obtener user_agent de otra forma
      // Por ahora, usamos un análisis básico
      const userAgent = 'Unknown' // TODO: Obtener de metadata o tabla relacionada
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

  /**
   * Análisis de categorías
   */
  private analyzeCategories(events: RawEvent[]): CategoryAnalysis {
    const normalized = events.map(e => this.normalizeEvent(e))
    const categoryCounts: Record<string, number> = {}
    const categoryRevenue: Record<string, number> = {}

    normalized.forEach(event => {
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
        percentage: normalized.length > 0 ? (count / normalized.length) * 100 : 0,
      })),
      revenue: Object.entries(categoryRevenue).map(([category, revenue]) => ({
        category,
        revenue,
      })),
    }
  }

  /**
   * Análisis de comportamiento
   */
  private analyzeBehavior(
    events: RawEvent[],
    engagement: EngagementMetrics
  ): BehaviorAnalysis {
    const normalized = events.map(e => this.normalizeEvent(e))

    // Análisis de flujo de usuario
    const userFlows: Record<string, number> = {}
    const previousPages: Record<string, string> = {}

    normalized.forEach(event => {
      const sessionId = event.sessionId
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

    normalized.forEach(event => {
      const sessionId = event.sessionId
      const page = event.page || 'unknown'
      const time = new Date(event.createdAt).getTime()

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

    // Calcular bounce rate
    const sessionEventCounts: Record<string, number> = {}
    normalized.forEach(event => {
      const sessionId = event.sessionId
      sessionEventCounts[sessionId] = (sessionEventCounts[sessionId] || 0) + 1
    })

    const bounceSessions = Object.values(sessionEventCounts).filter(count => count === 1).length
    const totalSessions = engagement.uniqueSessions
    const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0

    return {
      topFlows: Object.entries(userFlows)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([flow, count]) => ({ flow, count })),
      averagePageTimes,
      bounceRate: Math.round(bounceRate * 100) / 100,
    }
  }

  /**
   * Análisis de retención
   */
  private analyzeRetention(events: RawEvent[]): RetentionAnalysis {
    const normalized = events.map(e => this.normalizeEvent(e))
    const userSessions: Record<string, Set<string>> = {}

    normalized.forEach(event => {
      if (event.userId) {
        if (!userSessions[event.userId]) {
          userSessions[event.userId] = new Set()
        }
        userSessions[event.userId].add(event.sessionId)
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
}

export const metricsCalculator = new MetricsCalculator()
