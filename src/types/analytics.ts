/**
 * Tipos para integración de Google Analytics y Meta en Analytics Dashboard
 */

// Google Analytics Embed API Types
export interface GAEmbedConfig {
  measurementId: string
  viewId?: string
  startDate?: string
  endDate?: string
}

export interface GAEmbedReport {
  type: 'LINE' | 'BAR' | 'TABLE' | 'PIE'
  query: {
    metrics: string[]
    dimensions?: string[]
    'start-date'?: string
    'end-date'?: string
  }
  chart?: {
    container: string
    type?: string
    options?: Record<string, any>
  }
}

export interface GAMetrics {
  sessions: number
  users: number
  pageViews: number
  bounceRate: number
  avgSessionDuration: number
  conversions: number
  revenue: number
}

// Meta Pixel Analytics Types
export interface MetaPixelEvent {
  eventName: string
  timestamp: string
  eventId?: string
  metadata?: Record<string, any>
}

export interface MetaPixelMetrics {
  totalEvents: number
  addToCart: number
  initiateCheckout: number
  purchase: number
  viewContent: number
  search: number
  eventsByDate: Array<{
    date: string
    count: number
    eventType: string
  }>
}

export interface MetaMetrics {
  pixelId: string
  eventsTracked: MetaPixelMetrics
  lastEventDate?: string
  eventsManagerUrl: string
}

// Comparison Types
export interface AnalyticsSource {
  name: 'own' | 'google' | 'meta'
  label: string
  available: boolean
  lastUpdated?: string
}

export interface ComparisonMetrics {
  source: AnalyticsSource
  sessions?: number
  users?: number
  conversions?: number
  revenue?: number
  cartAdditions?: number
  checkoutStarts?: number
}

export interface AnalyticsComparison {
  own: ComparisonMetrics
  google?: ComparisonMetrics
  meta?: ComparisonMetrics
}


