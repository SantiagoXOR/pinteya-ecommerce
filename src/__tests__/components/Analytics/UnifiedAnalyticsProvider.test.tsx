/**
 * Tests para UnifiedAnalyticsProvider.tsx
 * Verifica todos los métodos de tracking
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { UnifiedAnalyticsProvider, useUnifiedAnalytics } from '@/components/Analytics/UnifiedAnalyticsProvider'

// Mock de dependencias - crear mocks antes de importar
const mockSendEvent = jest.fn()
const mockInit = jest.fn()
const mockGetPendingCount = jest.fn()
const mockFlushPendingEvents = jest.fn()

jest.mock('@/lib/analytics/send-strategies', () => ({
  sendStrategies: {
    sendEvent: (...args: any[]) => mockSendEvent(...args),
  },
}))

jest.mock('@/lib/analytics/event-persistence', () => ({
  eventPersistence: {
    init: (...args: any[]) => mockInit(...args),
    getPendingCount: (...args: any[]) => mockGetPendingCount(...args),
    flushPendingEvents: (...args: any[]) => mockFlushPendingEvents(...args),
  },
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', email: 'test@example.com' },
    isLoaded: true,
  }),
}))

jest.mock('next/navigation', () => ({
  usePathname: () => '/test-page',
}))

describe('UnifiedAnalyticsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendEvent.mockResolvedValue({
      success: true,
      strategy: 'fetch-alternative',
    })
    mockInit.mockResolvedValue(undefined)
    mockGetPendingCount.mockResolvedValue(0)
    mockFlushPendingEvents.mockResolvedValue(0)
  })

  describe('Provider rendering', () => {
    it('debería renderizar provider sin errores', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      expect(result.current).toBeDefined()
      expect(result.current.isEnabled).toBe(true)
    })

    it('debería inicializar eventPersistence al montar', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      renderHook(() => useUnifiedAnalytics(), { wrapper })

      expect(mockInit).toHaveBeenCalled()
    })
  })

  describe('trackEvent()', () => {
    it('debería trackear evento básico', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      act(() => {
        result.current.trackEvent('test_event', 'test_category', 'test_action', 'test_label', 100)
      })

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'test_event',
          category: 'test_category',
          action: 'test_action',
          label: 'test_label',
          value: 100,
        })
      )
    })

    it('no debería trackear cuando está deshabilitado', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      // Limpiar mocks después del montaje inicial (que trackea page_view automáticamente)
      jest.clearAllMocks()

      act(() => {
        result.current.setEnabled(false)
      })

      act(() => {
        result.current.trackEvent('test_event', 'test_category', 'test_action')
      })

      expect(mockSendEvent).not.toHaveBeenCalled()
    })
  })

  describe('trackPageView()', () => {
    it('debería trackear vista de página', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      act(() => {
        result.current.trackPageView('/test-page')
      })

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'page_view',
          category: 'navigation',
          action: 'view',
          label: '/test-page',
        })
      )
    })

    it('debería usar pathname actual si no se proporciona página', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      act(() => {
        result.current.trackPageView()
      })

      expect(mockSendEvent).toHaveBeenCalled()
    })
  })

  describe('trackEcommerceEvent()', () => {
    it('debería trackear evento e-commerce', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      act(() => {
        result.current.trackEcommerceEvent('purchase', { value: 1000, currency: 'ARS' })
      })

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'ecommerce',
          category: 'shop',
          action: 'purchase',
          value: 1000,
        })
      )
    })
  })

  describe('trackProductView()', () => {
    it('debería trackear vista de producto', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      act(() => {
        result.current.trackProductView('product-123', 'Test Product', { price: 1000 })
      })

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'ecommerce',
          category: 'shop',
          action: 'view_item',
        })
      )
    })
  })

  describe('trackCartAction()', () => {
    it('debería trackear agregar al carrito', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      act(() => {
        result.current.trackCartAction('add', 'product-123', { price: 1000 })
      })

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'ecommerce',
          category: 'shop',
          action: 'add_to_cart',
        })
      )
    })

    it('debería trackear remover del carrito', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      act(() => {
        result.current.trackCartAction('remove', 'product-123')
      })

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'ecommerce',
          category: 'shop',
          action: 'remove_from_cart',
        })
      )
    })
  })

  describe('trackConversion()', () => {
    it('debería trackear conversión', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      act(() => {
        result.current.trackConversion('purchase', { orderId: 'order-123', value: 1000 })
      })

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'conversion',
          category: 'ecommerce',
          action: 'purchase',
        })
      )
    })
  })

  describe('trackSearch()', () => {
    it('debería trackear búsqueda', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      act(() => {
        result.current.trackSearch('test query', 10)
      })

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'search',
          category: 'search',
          action: 'search_query',
          label: 'test query',
          value: 10,
        })
      )
    })
  })

  describe('trackCategoryView()', () => {
    it('debería trackear vista de categoría', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      act(() => {
        result.current.trackCategoryView('paint', { categoryId: 'cat-123' })
      })

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'view_category',
          category: 'navigation',
          action: 'view',
          label: 'paint',
        })
      )
    })
  })

  describe('getPendingEventsCount()', () => {
    it('debería retornar cantidad de eventos pendientes', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      mockGetPendingCount.mockResolvedValue(5)

      const count = await result.current.getPendingEventsCount()

      expect(count).toBe(5)
      expect(mockGetPendingCount).toHaveBeenCalled()
    })
  })

  describe('flushPendingEvents()', () => {
    it('debería enviar eventos pendientes', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      mockFlushPendingEvents.mockResolvedValue(3)

      const count = await result.current.flushPendingEvents()

      expect(count).toBe(3)
      expect(mockFlushPendingEvents).toHaveBeenCalled()
    })
  })

  describe('setEnabled()', () => {
    it('debería habilitar/deshabilitar tracking', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UnifiedAnalyticsProvider>{children}</UnifiedAnalyticsProvider>
      )

      const { result } = renderHook(() => useUnifiedAnalytics(), { wrapper })

      expect(result.current.isEnabled).toBe(true)

      act(() => {
        result.current.setEnabled(false)
      })

      expect(result.current.isEnabled).toBe(false)
    })
  })

  describe('useAnalytics hook compatibility', () => {
    it('debería exportar useAnalytics como alias de useUnifiedAnalytics', () => {
      // Verificar que useAnalytics está disponible
      const { useAnalytics } = require('@/components/Analytics/UnifiedAnalyticsProvider')
      expect(useAnalytics).toBeDefined()
    })
  })
})
