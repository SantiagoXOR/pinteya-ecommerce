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

export interface AnalyticsMetrics {
  ecommerce: EcommerceMetrics
  engagement: EngagementMetrics
  trends: TrendsData
  devices?: DeviceAnalysis
  categories?: CategoryAnalysis
  behavior?: BehaviorAnalysis
  retention?: RetentionAnalysis
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
