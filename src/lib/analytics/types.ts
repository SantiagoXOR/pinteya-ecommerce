/**
 * Tipos compartidos para el sistema de analytics
 */

export interface AnalyticsEvent {
  event: string
  category: string
  action: string
  label?: string
  value?: number
  userId?: string
  sessionId: string
  page: string
  userAgent?: string
  metadata?: Record<string, any>
}

export interface EcommerceMetrics {
  cartAdditions: number
  cartRemovals: number
  checkoutStarts: number
  checkoutCompletions: number
  productViews: number
  categoryViews: number
  searchQueries: number
  conversionRate: number
  cartAbandonmentRate: number
  productToCartRate: number
  averageOrderValue: number
  totalRevenue: number
}

export interface EngagementMetrics {
  uniqueSessions: number
  uniqueUsers: number
  averageEventsPerSession: number
  averageSessionDuration: number
  topPages: Array<{ page: string; views: number }>
  topProducts: Array<{ productId: string; productName: string; views: number }>
}

export interface TrendsData {
  dailyEvents: Array<{ date: string; count: number }>
  hourlyEvents: Array<{ hour: number; count: number }>
}

export interface DeviceAnalysis {
  devices: Array<{ device: string; count: number; percentage: number }>
  browsers: Array<{ browser: string; count: number; percentage: number }>
}

export interface CategoryAnalysis {
  distribution: Array<{ category: string; count: number; percentage: number }>
  revenue: Array<{ category: string; revenue: number }>
}

export interface BehaviorAnalysis {
  topFlows: Array<{ flow: string; count: number }>
  averagePageTimes: Array<{ page: string; averageTime: number }>
  bounceRate: number
}

export interface RetentionAnalysis {
  returningUsers: number
  newUsers: number
  retentionRate: number
  averageSessionsPerUser: number
}

// Nuevas métricas detalladas
export interface ProductAnalytics {
  topProductsAddedToCart: Array<{
    productId: string
    productName: string
    category: string
    totalAdditions: number
    totalRevenue: number
    averagePrice: number
    conversionRate: number
  }>
  topProductsViewed: Array<{
    productId: string
    productName: string
    category: string
    views: number
  }>
  productsByCategory: Array<{
    category: string
    count: number
    revenue: number
  }>
  cartValueDistribution: Array<{
    range: string
    count: number
  }>
}

export interface FunnelStep {
  step: string
  count: number
  conversionRate: number
  averageTime: number
  dropOffRate: number
}

export interface FunnelAnalysis {
  steps: FunnelStep[]
  dropOffPoints: Array<{
    fromStep: string
    toStep: string
    dropOffCount: number
    dropOffRate: number
  }>
  totalConversionRate: number
}

export interface CategoryPerformance {
  category: string
  totalEvents: number
  uniqueSessions: number
  uniqueUsers: number
  totalRevenue: number
  conversionRate: number
  views: number
  cartAdditions: number
  purchases: number
}

export interface InteractionMetrics {
  topInteractions: Array<{
    type: string
    count: number
    percentage: number
  }>
  pageInteractions: Array<{
    page: string
    clicks: number
    hovers: number
    scrolls: number
    averageTime: number
  }>
  userJourney: Array<{
    flow: string
    count: number
  }>
  exitPages: Array<{
    page: string
    count: number
    percentage: number
  }>
  entryPages: Array<{
    page: string
    count: number
    percentage: number
  }>
}

export interface SearchAnalytics {
  topQueries: Array<{
    query: string
    count: number
    conversionRate: number
  }>
  noResults: Array<{
    query: string
    count: number
  }>
  conversionRate: number
}

export interface ElementMetrics {
  elementSelector: string
  elementPosition: { x: number; y: number }
  elementDimensions: { width: number; height: number }
  elementType?: string  // 'button', 'link', 'input', etc.
  interactions: {
    clicks: number
    hovers: number
    scrolls: number
    focuses?: number
    inputs?: number
    conversions: number
  }
  metrics: {
    totalInteractions: number
    uniqueUsers: number
    averageHoverTime: number
    conversionRate: number
    clickThroughRate: number
    interactionRate?: number  // % de usuarios que interactuaron
  }
  deviceBreakdown: {
    mobile: { interactions: number; users: number }
    desktop: { interactions: number; users: number }
  }
  timeline?: Array<{
    hour: number
    interactions: number
  }>
}

export interface AnalyticsMetrics {
  ecommerce: EcommerceMetrics
  engagement: EngagementMetrics
  trends: TrendsData
  devices?: DeviceAnalysis
  categories?: CategoryAnalysis
  behavior?: BehaviorAnalysis
  retention?: RetentionAnalysis
  // Nuevas métricas detalladas
  products?: ProductAnalytics
  funnel?: FunnelAnalysis
  interactions?: InteractionMetrics
  search?: SearchAnalytics
}

export interface MetricsQueryParams {
  startDate: string
  endDate: string
  userId?: string
  sessionId?: string
}

export interface MetricsComparison {
  previousPeriod: AnalyticsMetrics | null
  changes: {
    ecommerce?: {
      productViews?: number
      cartAdditions?: number
      checkoutStarts?: number
      checkoutCompletions?: number
      conversionRate?: number
      totalRevenue?: number
    }
    engagement?: {
      uniqueSessions?: number
      uniqueUsers?: number
      averageSessionDuration?: number
    }
  } | null
}
