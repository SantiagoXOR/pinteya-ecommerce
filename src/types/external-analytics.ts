/**
 * Tipos para integraciones con APIs externas de Analytics
 * Google Analytics 4 Data API y Meta Marketing API
 */

// =====================================================
// GOOGLE ANALYTICS 4 DATA API TYPES
// =====================================================

export interface GA4QueryOptions {
  /** Dimensiones adicionales a incluir */
  includeDimensions?: string[]
  /** Métricas adicionales a incluir */
  includeMetrics?: string[]
  /** Límite de resultados */
  limit?: number
  /** Offset para paginación */
  offset?: number
}

export interface GA4Event {
  eventName: string
  date: string
  eventCount: number
  eventValue: number
  additionalDimensions?: Record<string, string>
  additionalMetrics?: Record<string, number>
}

export interface GA4EventsResponse {
  success: boolean
  events: GA4Event[]
  rowCount: number
  error?: string
  metadata: {
    propertyId: string
    dateRange: {
      startDate: string
      endDate: string
    }
    eventNameFilter?: string
  }
}

export interface GA4PurchaseData {
  transactionId: string
  date: string
  deviceCategory: string
  country: string
  city: string
  revenue: number
  transactions: number
  itemsPurchased: number
  found: boolean
}

export interface GA4JourneyEvent {
  eventName: string
  dateHour: string
  pagePath: string
  eventCount: number
}

export interface GA4UserJourney {
  sessionId: string
  events: GA4JourneyEvent[]
  totalEvents: number
  startTime?: string
  endTime?: string
}

export interface GA4RealtimeEvent {
  eventName: string
  minutesAgo: number
  deviceCategory: string
  country: string
  eventCount: number
  activeUsers: number
}

export interface GA4EcommerceMetrics {
  totalRevenue: number
  transactions: number
  averageOrderValue: number
  itemsPurchased: number
  addToCarts: number
  checkouts: number
  conversionRate: number
}

export interface GA4ConnectionStatus {
  connected: boolean
  propertyId: string | null
  error?: string
}

// =====================================================
// META MARKETING API TYPES
// =====================================================

export interface MetaEventsResponse {
  success: boolean
  pixelId: string
  dateRange: {
    startDate: string
    endDate: string
  }
  events: Record<string, { count: number; value: number }>
  totalEvents: number
  error?: string
}

export interface MetaPixelStats {
  pixelId: string
  pixelName: string
  lastFiredTime: string | null
  isUnavailable: boolean
  last7DaysEvents: Record<string, { count: number; value: number }>
  totalEventsLast7Days: number
  eventsManagerUrl: string
  error?: string
}

export interface MetaServerEventUserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  externalId?: string
  clientIpAddress?: string
  clientUserAgent?: string
  /** Facebook click ID (de URL param fbclid) */
  fbc?: string
  /** Facebook browser ID (de cookie _fbp) */
  fbp?: string
}

export interface MetaServerEvent {
  eventName: string
  eventTime?: number
  eventId?: string
  eventSourceUrl?: string
  actionSource?: 'website' | 'app' | 'email' | 'phone_call' | 'chat' | 'physical_store' | 'other'
  userData?: MetaServerEventUserData
  customData?: Record<string, unknown>
  /** Código para eventos de prueba (sandbox) */
  testEventCode?: string
}

export interface MetaConversionAPIResponse {
  success: boolean
  eventsReceived: number
  fbTraceId?: string
  messages?: string[]
  error?: string
}

export interface MetaAdInsights {
  impressions: number
  clicks: number
  spend: number
  reach: number
  purchases: number
  dateRange: {
    startDate: string
    endDate: string
  }
}

export interface MetaConnectionStatus {
  connected: boolean
  pixelId: string | null
  pixelName?: string
  adAccountId?: string | null
  error?: string
}

export interface MetaConversionEvents {
  purchases: number
  addToCarts: number
  initiateCheckouts: number
  viewContents: number
  searches: number
  totalConversionValue: number
}

// =====================================================
// UNIFIED EXTERNAL ANALYTICS TYPES
// =====================================================

export interface OrderJourney {
  orderId: string
  local: {
    events: Array<{
      eventName: string
      timestamp: string
      metadata?: Record<string, unknown>
    }>
    totalEvents: number
    purchaseEvent?: {
      timestamp: string
      revenue: number
      items: number
    }
  }
  googleAnalytics: {
    available: boolean
    purchase?: GA4PurchaseData | null
    journey?: GA4UserJourney | null
    error?: string
  }
  metaPixel: {
    available: boolean
    eventsSent: boolean
    error?: string
  }
  verification: {
    ga4PurchaseReceived: boolean
    metaPurchaseReceived: boolean
    dataMatch: boolean
    discrepancies?: string[]
  }
}

export interface AnalyticsComparison {
  dateRange: {
    startDate: string
    endDate: string
  }
  local: {
    sessions: number
    users: number
    pageViews: number
    addToCarts: number
    checkouts: number
    purchases: number
    revenue: number
  }
  googleAnalytics: {
    available: boolean
    sessions?: number
    users?: number
    pageViews?: number
    addToCarts?: number
    checkouts?: number
    purchases?: number
    revenue?: number
    error?: string
  }
  metaPixel: {
    available: boolean
    addToCarts?: number
    checkouts?: number
    purchases?: number
    revenue?: number
    error?: string
  }
  discrepancies: {
    metric: string
    local: number
    ga4?: number
    meta?: number
    percentageDiff: number
  }[]
}

export interface ExternalAnalyticsStatus {
  googleAnalytics: GA4ConnectionStatus
  metaPixel: MetaConnectionStatus
  lastChecked: string
}

// =====================================================
// API ROUTE REQUEST/RESPONSE TYPES
// =====================================================

export interface GA4APIRequest {
  type: 'events' | 'purchase' | 'journey' | 'realtime' | 'ecommerce' | 'status'
  startDate?: string
  endDate?: string
  transactionId?: string
  sessionId?: string
  eventName?: string
}

export interface MetaAPIRequest {
  type: 'events' | 'stats' | 'conversion' | 'status' | 'send-event'
  startDate?: string
  endDate?: string
  event?: MetaServerEvent
}

export interface ExternalAnalyticsAPIRequest {
  type: 'journey' | 'compare' | 'verify' | 'status'
  orderId?: string
  transactionId?: string
  startDate?: string
  endDate?: string
}
