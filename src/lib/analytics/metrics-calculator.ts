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
  ProductAnalytics,
  FunnelAnalysis,
  InteractionMetrics,
  SearchAnalytics,
  CategoryPerformance,
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
  visitor_hash?: string // ID persistente para usuarios anónimos recurrentes
  page_id?: number
  created_at: string
  // Nuevos campos de metadata de productos
  product_id?: number
  product_name?: string
  category_name?: string
  price?: number
  quantity?: number
  // Nuevos campos de tracking de elementos
  element_selector?: string
  element_x?: number
  element_y?: number
  element_width?: number
  element_height?: number
  device_type?: string
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
    
    // Nuevas métricas detalladas
    const products = this.calculateProductAnalytics(events)
    const funnel = this.calculateFunnelAnalysis(events)
    const interactions = this.calculateInteractionMetrics(events)
    const search = this.calculateSearchAnalytics(events)

    return {
      ecommerce,
      engagement,
      trends,
      devices,
      categories,
      behavior,
      retention,
      products,
      funnel,
      interactions,
      search,
    }
  }

  /**
   * Obtener eventos desde la base de datos
   */
  async fetchEvents(params: MetricsQueryParams): Promise<RawEvent[]> {
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
          visitor_hash,
          page_id,
          created_at,
          product_id,
          product_name,
          category_name,
          price,
          quantity,
          element_selector,
          element_x,
          element_y,
          element_width,
          element_height,
          device_type,
          analytics_event_types(name),
          analytics_categories(name),
          analytics_actions(name),
          analytics_pages(path)
        `)
        .gte('created_at', Math.floor(new Date(params.startDate).getTime() / 1000))
        .lte('created_at', Math.floor(new Date(params.endDate).getTime() / 1000))

      // MULTITENANT: Filtrar por tenant_id si está disponible
      if (params.tenantId) {
        query = query.eq('tenant_id', params.tenantId)
      }

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
    // Convertir created_at de segundos a milisegundos si es necesario
    // Los timestamps UNIX en segundos son típicamente de 10 dígitos (ej: 1768788256)
    // Los timestamps en milisegundos son de 13 dígitos (ej: 1768788256000)
    const createdAtMs = typeof event.created_at === 'number' && event.created_at < 10000000000
      ? event.created_at * 1000  // Convertir de segundos a milisegundos
      : event.created_at
    
    return {
      eventName: event.analytics_event_types?.name || event.event_name || 'unknown',
      category: event.analytics_categories?.name || event.category || 'unknown',
      action: event.analytics_actions?.name || event.action || 'unknown',
      label: event.label,
      value: event.value,
      userId: event.user_id || null, // Asegurar que sea null si no existe, no undefined
      // Usar visitor_hash como identificador de usuario anónimo si no hay user_id
      visitorId: event.visitor_hash?.toString() || null,
      sessionId: event.session_hash?.toString() || event.session_id || '',
      page: event.analytics_pages?.path || event.page || '',
      createdAt: createdAtMs,
      // Nuevos campos de metadata
      metadata: {
        productId: event.product_id?.toString(),
        productName: event.product_name,
        category: event.category_name,
        price: event.price,
        quantity: event.quantity,
        elementSelector: event.element_selector,
        elementPosition: event.element_x !== undefined && event.element_y !== undefined
          ? { x: event.element_x, y: event.element_y }
          : undefined,
        elementDimensions: event.element_width !== undefined && event.element_height !== undefined
          ? { width: event.element_width, height: event.element_height }
          : undefined,
        deviceType: event.device_type,
      },
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
      e =>
        e.page?.includes('/category/') ||
        e.action === 'view_category' ||
        e.eventName === 'view_category'
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
    
    // Contar usuarios únicos: priorizar userId (autenticados), pero usar visitorId para anónimos
    const uniqueUsers = new Set(
      normalized
        .filter(e => 
          (e.userId != null && e.userId !== undefined && e.userId !== '') ||
          (e.visitorId != null && e.visitorId !== undefined && e.visitorId !== '')
        )
        .map(e => e.userId || e.visitorId) // Preferir userId, fallback a visitorId
    ).size
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

    // Productos más vistos (agrupar por productId; usar product_name de metadata cuando exista)
    const productViewEvents = normalized.filter(e => e.action === 'view_item')
    const productViewCounts = productViewEvents.reduce(
      (acc, event) => {
        const productId = event.metadata?.productId || event.label || 'unknown'
        const productName = event.metadata?.productName || event.label || 'Unknown Product'
        const key = productId
        if (!acc[key]) acc[key] = { count: 0, productName }
        acc[key].count += 1
        if (productName && productName !== 'Unknown Product') acc[key].productName = productName
        return acc
      },
      {} as Record<string, { count: number; productName: string }>
    )

    const topProducts = Object.entries(productViewCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([productId, { count: views, productName }]) => ({ productId, productName, views }))

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
   * Usa userId para usuarios autenticados y visitorId para usuarios anónimos
   */
  private analyzeRetention(events: RawEvent[]): RetentionAnalysis {
    const normalized = events.map(e => this.normalizeEvent(e))
    const userSessions: Record<string, Set<string>> = {}

    normalized.forEach(event => {
      // Usar userId si existe, sino usar visitorId para usuarios anónimos
      const userIdentifier = event.userId || event.visitorId
      if (userIdentifier) {
        if (!userSessions[userIdentifier]) {
          userSessions[userIdentifier] = new Set()
        }
        userSessions[userIdentifier].add(event.sessionId)
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

  /**
   * Calcular métricas detalladas de productos
   */
  calculateProductAnalytics(events: RawEvent[]): ProductAnalytics {
    const normalized = events.map(e => this.normalizeEvent(e))
    
    // Productos agregados al carrito
    const cartAdditions = normalized.filter(
      e => e.action === 'add_to_cart' || e.action === 'add'
    )
    
    const productAdditionsMap = new Map<string, {
      productId: string
      productName: string
      category: string
      additions: number
      revenue: number
      prices: number[]
    }>()

    cartAdditions.forEach(event => {
      // Priorizar campos directos de la BD sobre metadata
      let productId = event.product_id?.toString() || event.metadata?.productId || event.metadata?.item_id
      
      // Si no hay productId pero hay label, intentar extraerlo
      if (!productId && event.label) {
        const labelMatch = event.label.match(/(\d+)/)
        if (labelMatch) {
          productId = labelMatch[1]
        } else if (!isNaN(Number(event.label))) {
          productId = event.label
        } else {
          productId = event.label // Usar label completo como fallback
        }
      }
      
      if (!productId) productId = 'unknown'
      
      // Obtener productName - priorizar BD, luego metadata, luego intentar buscar por ID
      let productName = event.product_name || event.metadata?.productName || event.metadata?.item_name
      
      // Si no hay productName pero tenemos productId, usar formato descriptivo
      if (!productName && productId && productId !== 'unknown') {
        // Si productId es numérico, intentar buscar en tabla products
        if (!isNaN(Number(productId))) {
          productName = `Producto #${productId}` // Formato temporal hasta que se busque en BD
        } else {
          productName = productId // Usar el ID como nombre si no es numérico
        }
      }
      
      if (!productName) productName = 'Unknown Product'
      
      const category = event.category_name || event.metadata?.category || event.metadata?.category_name || 'Unknown'
      const price = event.price || event.value || event.metadata?.price || 0
      const quantity = event.quantity || event.metadata?.quantity || 1

      const key = `${productId}:${productName}`
      if (!productAdditionsMap.has(key)) {
        productAdditionsMap.set(key, {
          productId,
          productName,
          category,
          additions: 0,
          revenue: 0,
          prices: [],
        })
      }

      const product = productAdditionsMap.get(key)!
      product.additions += quantity
      product.revenue += price * quantity
      product.prices.push(price)
    })

    const topProductsAddedToCart = Array.from(productAdditionsMap.values())
      .map(product => ({
        productId: product.productId,
        productName: product.productName,
        category: product.category,
        totalAdditions: product.additions,
        totalRevenue: product.revenue,
        averagePrice: product.prices.length > 0
          ? product.prices.reduce((a, b) => a + b, 0) / product.prices.length
          : 0,
        conversionRate: 0, // Se calculará después con datos de checkout
      }))
      .sort((a, b) => b.totalAdditions - a.totalAdditions)
      .slice(0, 20)

    // Productos más vistos
    const productViews = normalized.filter(
      e => e.action === 'view_item' || e.page?.includes('/product/') || e.page?.includes('/buy/')
    )

    const productViewsMap = new Map<string, {
      productId: string
      productName: string
      category: string
      views: number
    }>()

    productViews.forEach(event => {
      // Priorizar campos directos de la BD sobre metadata
      let productId = event.product_id?.toString() || event.metadata?.productId || event.metadata?.item_id
      
      // Si no hay productId pero hay label, intentar extraerlo
      if (!productId && event.label) {
        const labelMatch = event.label.match(/(\d+)/)
        if (labelMatch) {
          productId = labelMatch[1]
        } else if (!isNaN(Number(event.label))) {
          productId = event.label
        } else {
          productId = event.label // Usar label completo como fallback
        }
      }
      
      if (!productId) productId = 'unknown'
      
      // Obtener productName - priorizar BD, luego metadata
      let productName = event.product_name || event.metadata?.productName || event.metadata?.item_name
      
      // Si no hay productName pero tenemos productId, usar formato descriptivo
      if (!productName && productId && productId !== 'unknown') {
        if (!isNaN(Number(productId))) {
          productName = `Producto #${productId}`
        } else {
          productName = productId
        }
      }
      
      if (!productName) productName = 'Unknown Product'
      
      const category = event.category_name || event.metadata?.category || event.metadata?.category_name || 'Unknown'
      const key = `${productId}:${productName}`

      if (!productViewsMap.has(key)) {
        productViewsMap.set(key, {
          productId,
          productName,
          category,
          views: 0,
        })
      }

      productViewsMap.get(key)!.views++
    })

    const topProductsViewed = Array.from(productViewsMap.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 20)

    // Productos por categoría
    const categoryMap = new Map<string, { count: number; revenue: number }>()
    normalized.forEach(event => {
      const category = event.metadata?.category || event.metadata?.category_name || 'Unknown'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, revenue: 0 })
      }
      const cat = categoryMap.get(category)!
      cat.count++
      if (event.action === 'purchase' && event.value) {
        cat.revenue += event.value
      }
    })

    const productsByCategory = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count)

    // Distribución de valores de carrito (simplificado)
    const cartValues = cartAdditions
      .map(e => e.value || 0)
      .filter(v => v > 0)
      .sort((a, b) => a - b)

    const cartValueDistribution = [
      { range: '0-100', count: cartValues.filter(v => v <= 100).length },
      { range: '101-500', count: cartValues.filter(v => v > 100 && v <= 500).length },
      { range: '501-1000', count: cartValues.filter(v => v > 500 && v <= 1000).length },
      { range: '1000+', count: cartValues.filter(v => v > 1000).length },
    ]

    return {
      topProductsAddedToCart,
      topProductsViewed,
      productsByCategory,
      cartValueDistribution,
    }
  }

  /**
   * Calcular análisis de embudo de conversión
   */
  calculateFunnelAnalysis(events: RawEvent[]): FunnelAnalysis {
    const normalized = events.map(e => this.normalizeEvent(e))
    
    // Identificar pasos del embudo usando sesiones únicas
    // Product View: event_name === 'product_view' O eventos con product_id no nulo
    const productViewSessions = new Set<string>()
    const productViewEvents = normalized.filter(
      e => 
        e.eventName === 'product_view' || 
        e.action === 'view_item' || 
        e.page?.includes('/product/') || 
        e.page?.includes('/buy/') ||
        (e.metadata?.productId != null && e.metadata.productId !== '')
    )
    productViewEvents.forEach(e => {
      if (e.sessionId) productViewSessions.add(e.sessionId)
    })
    const productViews = productViewSessions.size

    // Cart Additions: sesiones únicas
    const cartAdditionSessions = new Set<string>()
    const cartAdditionEvents = normalized.filter(
      e => e.action === 'add_to_cart' || e.action === 'add'
    )
    cartAdditionEvents.forEach(e => {
      if (e.sessionId) cartAdditionSessions.add(e.sessionId)
    })
    const cartAdditions = cartAdditionSessions.size

    // Checkout Starts: sesiones únicas
    const checkoutStartSessions = new Set<string>()
    const checkoutStartEvents = normalized.filter(
      e => e.action === 'begin_checkout' || e.eventName === 'begin_checkout'
    )
    checkoutStartEvents.forEach(e => {
      if (e.sessionId) checkoutStartSessions.add(e.sessionId)
    })
    const checkoutStarts = checkoutStartSessions.size

    // Purchases: sesiones únicas
    const purchaseSessions = new Set<string>()
    const purchaseEvents = normalized.filter(
      e => e.action === 'purchase' && e.eventName === 'purchase'
    )
    purchaseEvents.forEach(e => {
      if (e.sessionId) purchaseSessions.add(e.sessionId)
    })
    const purchases = purchaseSessions.size

    // Calcular tiempos promedio entre pasos
    const sessionSteps: Record<string, Array<{ step: string; time: number }>> = {}
    normalized.forEach(event => {
      const sessionId = event.sessionId
      if (!sessionSteps[sessionId]) {
        sessionSteps[sessionId] = []
      }

      let step = ''
      // Product View: priorizar eventName sobre action
      if (
        event.eventName === 'product_view' ||
        event.action === 'view_item' || 
        event.page?.includes('/product/') ||
        event.page?.includes('/buy/') ||
        (event.metadata?.productId != null && event.metadata.productId !== '')
      ) {
        step = 'product_view'
      } else if (event.action === 'add_to_cart' || event.action === 'add') {
        step = 'add_to_cart'
      } else if (event.action === 'begin_checkout' || event.eventName === 'begin_checkout') {
        step = 'begin_checkout'
      } else if (event.action === 'purchase' && event.eventName === 'purchase') {
        step = 'purchase'
      }

      if (step) {
        sessionSteps[sessionId].push({
          step,
          time: new Date(event.createdAt).getTime(),
        })
      }
    })

    // Calcular tiempos promedio
    const stepTimes: Record<string, number[]> = {}
    Object.values(sessionSteps).forEach(steps => {
      steps.sort((a, b) => a.time - b.time)
      for (let i = 1; i < steps.length; i++) {
        const fromStep = steps[i - 1].step
        const toStep = steps[i].step
        const duration = steps[i].time - steps[i - 1].time
        const key = `${fromStep}_${toStep}`
        if (!stepTimes[key]) {
          stepTimes[key] = []
        }
        stepTimes[key].push(duration)
      }
    })

    // Calcular conversión y abandono con validaciones
    const calcConversionRate = (current: number, previous: number): number => {
      if (previous === 0) return 0
      const rate = (current / previous) * 100
      return Math.min(100, Math.max(0, rate))
    }

    const calcDropOffRate = (current: number, previous: number): number => {
      if (previous === 0) return 0
      const rate = ((previous - current) / previous) * 100
      return Math.min(100, Math.max(0, rate))
    }

    const calcDropOffCount = (current: number, previous: number): number => {
      return Math.max(0, previous - current)
    }

    const productViewToCartRate = calcConversionRate(cartAdditions, productViews)
    const cartToCheckoutRate = calcConversionRate(checkoutStarts, cartAdditions)
    const checkoutToPurchaseRate = calcConversionRate(purchases, checkoutStarts)
    const totalConversionRate = calcConversionRate(purchases, productViews)

    const steps: FunnelAnalysis['steps'] = [
      {
        step: 'product_view',
        count: productViews,
        conversionRate: productViewToCartRate,
        averageTime: 0,
        dropOffRate: calcDropOffRate(cartAdditions, productViews),
      },
      {
        step: 'add_to_cart',
        count: cartAdditions,
        conversionRate: cartToCheckoutRate,
        averageTime: stepTimes['product_view_add_to_cart']
          ? stepTimes['product_view_add_to_cart'].reduce((a, b) => a + b, 0) /
            stepTimes['product_view_add_to_cart'].length /
            1000
          : 0,
        dropOffRate: calcDropOffRate(checkoutStarts, cartAdditions),
      },
      {
        step: 'begin_checkout',
        count: checkoutStarts,
        conversionRate: checkoutToPurchaseRate,
        averageTime: stepTimes['add_to_cart_begin_checkout']
          ? stepTimes['add_to_cart_begin_checkout'].reduce((a, b) => a + b, 0) /
            stepTimes['add_to_cart_begin_checkout'].length /
            1000
          : 0,
        dropOffRate: calcDropOffRate(purchases, checkoutStarts),
      },
      {
        step: 'purchase',
        count: purchases,
        conversionRate: 100,
        averageTime: stepTimes['begin_checkout_purchase']
          ? stepTimes['begin_checkout_purchase'].reduce((a, b) => a + b, 0) /
            stepTimes['begin_checkout_purchase'].length /
            1000
          : 0,
        dropOffRate: 0,
      },
    ]

    const dropOffPoints = [
      {
        fromStep: 'product_view',
        toStep: 'add_to_cart',
        dropOffCount: calcDropOffCount(cartAdditions, productViews),
        dropOffRate: calcDropOffRate(cartAdditions, productViews),
      },
      {
        fromStep: 'add_to_cart',
        toStep: 'begin_checkout',
        dropOffCount: calcDropOffCount(checkoutStarts, cartAdditions),
        dropOffRate: calcDropOffRate(checkoutStarts, cartAdditions),
      },
      {
        fromStep: 'begin_checkout',
        toStep: 'purchase',
        dropOffCount: calcDropOffCount(purchases, checkoutStarts),
        dropOffRate: calcDropOffRate(purchases, checkoutStarts),
      },
    ]

    return {
      steps,
      dropOffPoints,
      totalConversionRate,
    }
  }

  /**
   * Calcular métricas de interacciones
   */
  calculateInteractionMetrics(events: RawEvent[]): InteractionMetrics {
    const normalized = events.map(e => this.normalizeEvent(e))

    // Tipos de interacción
    const interactionCounts: Record<string, number> = {}
    normalized.forEach(event => {
      const type = event.action || event.eventName
      if (['click', 'hover', 'scroll', 'focus', 'input'].includes(type)) {
        interactionCounts[type] = (interactionCounts[type] || 0) + 1
      }
    })

    const totalInteractions = Object.values(interactionCounts).reduce((a, b) => a + b, 0)
    const topInteractions = Object.entries(interactionCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalInteractions > 0 ? (count / totalInteractions) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // Interacciones por página
    const pageInteractionsMap = new Map<string, {
      clicks: number
      hovers: number
      scrolls: number
      times: number[]
    }>()

    normalized.forEach(event => {
      const page = event.page || 'unknown'
      if (!pageInteractionsMap.has(page)) {
        pageInteractionsMap.set(page, {
          clicks: 0,
          hovers: 0,
          scrolls: 0,
          times: [],
        })
      }

      const pageData = pageInteractionsMap.get(page)!
      // Priorizar action sobre eventName para mayor flexibilidad
      const actionType = event.action || event.eventName
      if (actionType === 'click') pageData.clicks++
      if (actionType === 'hover') pageData.hovers++
      if (actionType === 'scroll') pageData.scrolls++
      pageData.times.push(new Date(event.createdAt).getTime())
    })

    const pageInteractions = Array.from(pageInteractionsMap.entries())
      .map(([page, data]) => ({
        page,
        clicks: data.clicks,
        hovers: data.hovers,
        scrolls: data.scrolls,
        averageTime: data.times.length > 1
          ? (data.times[data.times.length - 1] - data.times[0]) / 1000 / data.times.length
          : 0,
      }))
      .sort((a, b) => b.clicks + b.hovers + b.scrolls - (a.clicks + a.hovers + a.scrolls))

    // Flujo de usuario
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

    const userJourney = Object.entries(userFlows)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([flow, count]) => ({ flow, count }))

    // Páginas de salida y entrada
    const exitPagesMap = new Map<string, number>()
    const entryPagesMap = new Map<string, number>()
    const sessionFirstPages: Record<string, string> = {}
    const sessionLastPages: Record<string, string> = {}

    normalized.forEach(event => {
      const sessionId = event.sessionId
      const page = event.page || 'unknown'

      if (!sessionFirstPages[sessionId]) {
        sessionFirstPages[sessionId] = page
        entryPagesMap.set(page, (entryPagesMap.get(page) || 0) + 1)
      }

      sessionLastPages[sessionId] = page
    })

    Object.values(sessionLastPages).forEach(page => {
      exitPagesMap.set(page, (exitPagesMap.get(page) || 0) + 1)
    })

    const totalSessions = Object.keys(sessionLastPages).length
    const exitPages = Array.from(exitPagesMap.entries())
      .map(([page, count]) => ({
        page,
        count,
        percentage: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const entryPages = Array.from(entryPagesMap.entries())
      .map(([page, count]) => ({
        page,
        count,
        percentage: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      topInteractions,
      pageInteractions,
      userJourney,
      exitPages,
      entryPages,
    }
  }

  /**
   * Calcular métricas de búsqueda
   */
  calculateSearchAnalytics(events: RawEvent[]): SearchAnalytics {
    const normalized = events.map(e => this.normalizeEvent(e))

    // Filtro flexible: priorizar action sobre eventName
    const searchEvents = normalized.filter(
      e =>
        e.action === 'search' ||
        e.action === 'search_query' ||
        (e.category === 'search' && (e.action === 'search' || e.action === 'search_query')) ||
        e.eventName === 'search' ||
        e.eventName === 'search_query'
    )

    const queryCounts: Record<string, number> = {}
    const queryConversions: Record<string, number> = {}

    searchEvents.forEach(event => {
      const query = event.label || 'unknown'
      queryCounts[query] = (queryCounts[query] || 0) + 1

      // Buscar si hubo conversión después de esta búsqueda
      const sessionId = event.sessionId
      const searchTime = new Date(event.createdAt).getTime()
      const hasConversion = normalized.some(
        e =>
          e.sessionId === sessionId &&
          new Date(e.createdAt).getTime() > searchTime &&
          (e.action === 'purchase' || e.action === 'add_to_cart')
      )

      if (hasConversion) {
        queryConversions[query] = (queryConversions[query] || 0) + 1
      }
    })

    const topQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({
        query,
        count,
        conversionRate: queryConversions[query]
          ? (queryConversions[query] / count) * 100
          : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    // Búsquedas sin resultados (simplificado - asumimos que si no hay conversión y count es bajo, no hay resultados)
    const noResults = topQueries
      .filter(q => q.count <= 1 && q.conversionRate === 0)
      .map(q => ({ query: q.query, count: q.count }))

    const totalSearches = searchEvents.length
    const totalConversions = Object.values(queryConversions).reduce((a, b) => a + b, 0)
    const conversionRate = totalSearches > 0 ? (totalConversions / totalSearches) * 100 : 0

    return {
      topQueries,
      noResults,
      conversionRate,
    }
  }

  /**
   * Calcular performance de categorías de productos
   */
  calculateCategoryPerformance(events: RawEvent[]): CategoryPerformance[] {
    const normalized = events.map(e => this.normalizeEvent(e))
    
    // Filtrar eventos con product_id y category_name (categorías de productos, no categorías de eventos)
    const productEvents = normalized.filter(
      e => e.metadata?.productId != null && e.metadata?.category != null && e.metadata.category !== ''
    )

    // Agrupar por categoría
    const categoryMap = new Map<string, {
      category: string
      totalEvents: number
      sessions: Set<string>
      users: Set<string>
      views: number
      cartAdditions: number
      purchases: number
      revenue: number
    }>()

    productEvents.forEach(event => {
      const category = event.metadata?.category || 'unknown'
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          totalEvents: 0,
          sessions: new Set<string>(),
          users: new Set<string>(),
          views: 0,
          cartAdditions: 0,
          purchases: 0,
          revenue: 0,
        })
      }

      const catData = categoryMap.get(category)!
      catData.totalEvents++

      if (event.sessionId) {
        catData.sessions.add(event.sessionId)
      }

      if (event.userId) {
        catData.users.add(event.userId)
      }

      // Contar vistas (product_view, view_item, o eventos con product_id)
      if (
        event.eventName === 'product_view' ||
        event.action === 'view_item' ||
        (event.metadata?.productId != null && (event.action === 'view' || event.eventName === 'page_view'))
      ) {
        catData.views++
      }

      // Contar agregados al carrito
      if (event.action === 'add_to_cart' || event.action === 'add') {
        catData.cartAdditions++
      }

      // Contar compras y revenue
      if (event.action === 'purchase' && event.eventName === 'purchase') {
        catData.purchases++
        const price = event.metadata?.price || event.value || 0
        const quantity = event.metadata?.quantity || 1
        catData.revenue += price * quantity
      }
    })

    // Convertir a array y calcular tasas de conversión
    const categoryPerformance = Array.from(categoryMap.values())
      .map(cat => ({
        category: cat.category,
        totalEvents: cat.totalEvents,
        uniqueSessions: cat.sessions.size,
        uniqueUsers: cat.users.size,
        views: cat.views,
        cartAdditions: cat.cartAdditions,
        purchases: cat.purchases,
        totalRevenue: cat.revenue,
        conversionRate: cat.views > 0 ? (cat.purchases / cat.views) * 100 : 0,
      }))
      .sort((a, b) => b.totalEvents - a.totalEvents)

    return categoryPerformance
  }
}

export const metricsCalculator = new MetricsCalculator()
