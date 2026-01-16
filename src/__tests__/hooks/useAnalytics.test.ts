/**
 * useAnalytics Hook Tests
 * Enterprise-ready test suite for analytics tracking
 * Pinteya E-commerce
 */

import { renderHook, act } from '@testing-library/react'
import { useAnalytics, useRealTimeMetrics } from '@/hooks/useAnalytics'
import { analytics } from '@/lib/integrations/analytics'

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', email: 'test@example.com' },
    isLoaded: true,
  }),
}))

// Mock usePathname
jest.mock('next/navigation', () => ({
  usePathname: () => '/test-page',
}))

// Mock analytics lib - corregir ruta de import
jest.mock('@/lib/integrations/analytics', () => ({
  analytics: {
    trackEvent: jest.fn().mockResolvedValue(undefined),
    trackEcommerceEvent: jest.fn().mockResolvedValue(undefined),
    trackPageView: jest.fn().mockResolvedValue(undefined),
    trackConversion: jest.fn().mockResolvedValue(undefined),
    trackProductView: jest.fn().mockResolvedValue(undefined),
    trackAddToCart: jest.fn().mockResolvedValue(undefined),
    trackRemoveFromCart: jest.fn().mockResolvedValue(undefined),
    trackCheckoutStart: jest.fn().mockResolvedValue(undefined),
    trackPurchase: jest.fn().mockResolvedValue(undefined),
    trackSearch: jest.fn().mockResolvedValue(undefined),
    getEvents: jest.fn(() => []),
    getInteractions: jest.fn(() => []),
    getConversionMetrics: jest.fn(() => ({
      cartAdditions: 5,
      cartRemovals: 1,
      checkoutStarts: 3,
      checkoutCompletions: 2,
      productViews: 25,
      categoryViews: 8,
      searchQueries: 12,
      conversionRate: 0.08,
      averageOrderValue: 150.75,
      cartAbandonmentRate: 0.33,
    })),
    getSessionId: jest.fn(() => 'test-session-123'),
    initialize: jest.fn().mockResolvedValue(undefined),
    enable: jest.fn(),
    disable: jest.fn(),
    getMetrics: jest.fn(() => ({
      pageViews: 100,
      uniqueVisitors: 50,
      bounceRate: 0.3,
      avgSessionDuration: 180,
      conversionRate: 0.05,
      totalRevenue: 1000,
    })),
    isEnabled: true,
  },
}))

// Mock optimized analytics
jest.mock('@/lib/integrations/analytics/analytics-optimized', () => ({
  optimizedAnalytics: {
    trackEvent: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock window.gtag
Object.defineProperty(window, 'gtag', {
  value: jest.fn(),
  writable: true,
})

describe('useAnalytics Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAnalytics())

      expect(result.current.isEnabled).toBe(true)
      expect(result.current.sessionMetrics).toBeDefined()
      expect(typeof result.current.trackEvent).toBe('function')
      expect(typeof result.current.trackPageView).toBe('function')
      expect(typeof result.current.getSessionId).toBe('function')
    })

    it('should provide all required tracking functions', () => {
      const { result } = renderHook(() => useAnalytics())

      const expectedFunctions = [
        'trackEvent',
        'trackEcommerceEvent',
        'trackPageView',
        'trackConversion',
        'trackProductView',
        'trackAddToCart',
        'trackRemoveFromCart',
        'trackCheckoutStart',
        'trackPurchase',
        'trackSearch',
      ]

      expectedFunctions.forEach(funcName => {
        expect(typeof result.current[funcName]).toBe('function')
      })
    })
  })

  describe('Event Tracking', () => {
    it('should track generic events correctly', () => {
      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackEvent('test_event', 'test_category', 'test_action', 'test_label', 100)
      })

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'test_event',
        'test_category',
        'test_action',
        'test_label',
        100,
        {
          userEmail: undefined,
          userId: 'test-user-123',
        }
      )
    })

    it('should track product view events', () => {
      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackProductView('prod-123', 'Test Product', 'Electronics', 99.99)
      })

      expect(analytics.trackEcommerceEvent).toHaveBeenCalledWith('view_item', {
        item_id: 'prod-123',
        item_name: 'Test Product',
        item_category: 'Electronics',
        price: 99.99,
        currency: 'ARS',
        userId: 'test-user-123',
        userEmail: undefined,
      })
    })

    it('should track add to cart events', () => {
      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackAddToCart('prod-123', 'Test Product', 99.99, 2)
      })

      expect(analytics.trackEcommerceEvent).toHaveBeenCalledWith('add_to_cart', {
        item_id: 'prod-123',
        item_name: 'Test Product',
        price: 99.99,
        quantity: 2,
        currency: 'ARS',
        value: 199.98,
        userId: 'test-user-123',
        userEmail: undefined,
      })
    })

    it('should track checkout start events', () => {
      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackCheckoutStart(299.98, 3)
      })

      expect(analytics.trackEcommerceEvent).toHaveBeenCalledWith('begin_checkout', {
        value: 299.98,
        currency: 'ARS',
        num_items: 3,
        userId: 'test-user-123',
        userEmail: undefined,
      })
    })

    it('should track purchase events', () => {
      const { result } = renderHook(() => useAnalytics())
      const mockItems = [{ id: 'item1', name: 'Product 1', price: 99.99 }]

      act(() => {
        result.current.trackPurchase('order-123', 299.98, mockItems)
      })

      expect(analytics.trackEcommerceEvent).toHaveBeenCalledWith('purchase', {
        transaction_id: 'order-123',
        value: 299.98,
        currency: 'ARS',
        items: mockItems,
        userId: 'test-user-123',
        userEmail: undefined,
      })
    })

    it('should track search events', () => {
      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackSearch('test query', 15)
      })

      expect(analytics.trackEcommerceEvent).toHaveBeenCalledWith('search', {
        search_term: 'test query',
        results_count: 15,
        userId: 'test-user-123',
        userEmail: undefined,
      })
    })
  })

  describe('Data Retrieval', () => {
    it('should get events correctly', () => {
      const { result } = renderHook(() => useAnalytics())

      const events = result.current.getEvents()
      expect(analytics.getEvents).toHaveBeenCalled()
      expect(Array.isArray(events)).toBe(true)
    })

    it('should get session ID correctly', () => {
      const { result } = renderHook(() => useAnalytics())

      const sessionId = result.current.getSessionId()
      expect(analytics.getSessionId).toHaveBeenCalled()
      expect(sessionId).toBe('test-session-123')
    })

    it('should get conversion metrics correctly', () => {
      const { result } = renderHook(() => useAnalytics())

      const metrics = result.current.getConversionMetrics()
      expect(analytics.getConversionMetrics).toHaveBeenCalled()
      expect(metrics).toEqual({
        cartAdditions: 5,
        cartRemovals: 1,
        checkoutStarts: 3,
        checkoutCompletions: 2,
        productViews: 25,
        categoryViews: 8,
        searchQueries: 12,
        conversionRate: 0.08,
        averageOrderValue: 150.75,
        cartAbandonmentRate: 0.33,
      })
    })
  })

  describe('State Management', () => {
    it('should toggle enabled state correctly', () => {
      const { result } = renderHook(() => useAnalytics())

      expect(result.current.isEnabled).toBe(true)

      act(() => {
        result.current.setEnabled(false)
      })

      expect(result.current.isEnabled).toBe(false)

      act(() => {
        result.current.setEnabled(true)
      })

      expect(result.current.isEnabled).toBe(true)
    })

    it('should refresh metrics correctly', () => {
      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.refreshMetrics()
      })

      expect(analytics.getConversionMetrics).toHaveBeenCalled()
    })
  })
})

describe('useRealTimeMetrics Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should initialize with metrics from analytics', () => {
    const { result } = renderHook(() => useRealTimeMetrics())

    expect(result.current).toEqual({
      cartAdditions: 5,
      cartRemovals: 1,
      checkoutStarts: 3,
      checkoutCompletions: 2,
      productViews: 25,
      categoryViews: 8,
      searchQueries: 12,
      conversionRate: 0.08,
      averageOrderValue: 150.75,
      cartAbandonmentRate: 0.33,
    })
  })

  it('should update metrics at specified interval', () => {
    renderHook(() => useRealTimeMetrics(1000))

    expect(analytics.getConversionMetrics).toHaveBeenCalledTimes(1)

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(analytics.getConversionMetrics).toHaveBeenCalledTimes(2)

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(analytics.getConversionMetrics).toHaveBeenCalledTimes(3)
  })
})

// useComponentTracking tests skipped due to dependency on useOptimizedAnalytics
// This hook will be tested separately when useOptimizedAnalytics is properly mocked
