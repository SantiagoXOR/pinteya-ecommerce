/**
 * Tests para metrics-calculator.ts
 * Verifica cálculo de todas las métricas
 */

// Crear mock de Supabase ANTES de importar metricsCalculator
// porque metricsCalculator crea el cliente al importar el módulo
jest.mock('@supabase/supabase-js', () => {
  const { createMockSupabaseClient } = require('../../../../__tests__/setup/supabase-test-setup')
  const mockSupabaseInstance = createMockSupabaseClient()
  return {
    createClient: jest.fn(() => mockSupabaseInstance),
  }
})

// Importar después del mock
import { metricsCalculator } from '@/lib/analytics/metrics-calculator'
import { createClient } from '@supabase/supabase-js'
import { mockAnalyticsEvents, createMockSupabaseClient } from '../../../../__tests__/setup/supabase-test-setup'

describe('MetricsCalculator', () => {
  let mockSupabaseInstance: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    jest.clearAllMocks()
    // Obtener la instancia mockeada del cliente
    mockSupabaseInstance = (createClient as jest.Mock).mock.results[0]?.value || createMockSupabaseClient()
    // Resetear mocks del cliente mockeado
    mockSupabaseInstance.from.mockClear()
  })

  describe('calculateMetrics()', () => {
    it('debería calcular métricas básicas correctamente', async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAnalyticsEvents,
          error: null,
        }),
      } as any)

      const params = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
      }

      const metrics = await metricsCalculator.calculateMetrics(params)

      expect(metrics).toHaveProperty('ecommerce')
      expect(metrics).toHaveProperty('engagement')
      expect(metrics).toHaveProperty('trends')
    })

    it('debería filtrar eventos por fecha', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAnalyticsEvents,
          error: null,
        }),
      }

      mockSupabaseInstance.from.mockReturnValue(mockQuery as any)

      const params = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
      }

      await metricsCalculator.calculateMetrics(params)

      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', expect.any(Number))
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', expect.any(Number))
    })

    it('debería filtrar eventos por userId cuando se proporciona', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAnalyticsEvents,
          error: null,
        }),
      }

      mockSupabaseInstance.from.mockReturnValue(mockQuery as any)

      const params = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
        userId: 'user-123',
      }

      await metricsCalculator.calculateMetrics(params)

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('debería retornar métricas vacías cuando no hay eventos', async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any)

      const params = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
      }

      const metrics = await metricsCalculator.calculateMetrics(params)

      expect(metrics.ecommerce.cartAdditions).toBe(0)
      expect(metrics.ecommerce.totalRevenue).toBe(0)
      expect(metrics.engagement.uniqueSessions).toBe(0)
    })

    it('debería manejar errores de Supabase', async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      } as any)

      const params = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
      }

      const metrics = await metricsCalculator.calculateMetrics(params)

      // Debería retornar métricas vacías en caso de error
      expect(metrics.ecommerce.cartAdditions).toBe(0)
    })
  })

  describe('calculateAdvancedMetrics()', () => {
    it('debería calcular métricas avanzadas con análisis completo', async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAnalyticsEvents,
          error: null,
        }),
      } as any)

      const params = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
      }

      const metrics = await metricsCalculator.calculateAdvancedMetrics(params)

      expect(metrics).toHaveProperty('ecommerce')
      expect(metrics).toHaveProperty('engagement')
      expect(metrics).toHaveProperty('trends')
      expect(metrics).toHaveProperty('devices')
      expect(metrics).toHaveProperty('categories')
      expect(metrics).toHaveProperty('behavior')
      expect(metrics).toHaveProperty('retention')
    })
  })

  describe('calculateEcommerceMetrics()', () => {
    it('debería calcular métricas e-commerce correctamente', async () => {
      const events = [
        {
          id: '1',
          event_type: 5,
          category_id: 2,
          action_id: 7,
          label: 'product-123',
          value: 1000,
          user_id: null,
          session_hash: 1234567890,
          page_id: 1,
          created_at: Math.floor(Date.now() / 1000),
          analytics_event_types: { name: 'add_to_cart' },
          analytics_categories: { name: 'ecommerce' },
          analytics_actions: { name: 'add' },
          analytics_pages: { path: '/product/123' },
        },
        {
          id: '2',
          event_type: 8,
          category_id: 2,
          action_id: 9,
          label: 'order-456',
          value: 5000,
          user_id: 'user-123',
          session_hash: 1234567890,
          page_id: 2,
          created_at: Math.floor(Date.now() / 1000),
          analytics_event_types: { name: 'purchase' },
          analytics_categories: { name: 'ecommerce' },
          analytics_actions: { name: 'purchase' },
          analytics_pages: { path: '/checkout' },
        },
      ]

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: events,
          error: null,
        }),
      } as any)

      const params = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
      }

      const metrics = await metricsCalculator.calculateMetrics(params)

      expect(metrics.ecommerce.cartAdditions).toBe(1)
      expect(metrics.ecommerce.checkoutCompletions).toBe(1)
      expect(metrics.ecommerce.totalRevenue).toBe(5000)
      expect(metrics.ecommerce.averageOrderValue).toBe(5000)
    })

    it('debería calcular tasas de conversión correctamente', async () => {
      const events = [
        {
          id: '1',
          event_type: 5,
          category_id: 2,
          action_id: 7,
          label: 'product-123',
          value: 1000,
          user_id: null,
          session_hash: 1234567890,
          page_id: 1,
          created_at: Math.floor(Date.now() / 1000),
          analytics_event_types: { name: 'add_to_cart' },
          analytics_categories: { name: 'ecommerce' },
          analytics_actions: { name: 'add' },
          analytics_pages: { path: '/product/123' },
        },
        {
          id: '2',
          event_type: 7,
          category_id: 2,
          action_id: 1,
          label: 'checkout',
          value: null,
          user_id: null,
          session_hash: 1234567890,
          page_id: 2,
          created_at: Math.floor(Date.now() / 1000),
          analytics_event_types: { name: 'begin_checkout' },
          analytics_categories: { name: 'ecommerce' },
          analytics_actions: { name: 'view' },
          analytics_pages: { path: '/checkout' },
        },
        {
          id: '3',
          event_type: 8,
          category_id: 2,
          action_id: 9,
          label: 'order-456',
          value: 5000,
          user_id: null,
          session_hash: 1234567890,
          page_id: 3,
          created_at: Math.floor(Date.now() / 1000),
          analytics_event_types: { name: 'purchase' },
          analytics_categories: { name: 'ecommerce' },
          analytics_actions: { name: 'purchase' },
          analytics_pages: { path: '/checkout' },
        },
      ]

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: events,
          error: null,
        }),
      } as any)

      const params = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
      }

      const metrics = await metricsCalculator.calculateMetrics(params)

      // 1 checkout start, 1 completion = 100% conversion rate
      expect(metrics.ecommerce.conversionRate).toBe(100)
      // 1 cart addition, 1 completion = 0% abandonment
      expect(metrics.ecommerce.cartAbandonmentRate).toBe(0)
    })
  })

  describe('calculateEngagementMetrics()', () => {
    it('debería calcular sesiones únicas correctamente', async () => {
      const events = [
        {
          id: '1',
          event_type: 1,
          category_id: 1,
          action_id: 1,
          label: '/',
          value: null,
          user_id: null,
          session_hash: 1111111111,
          page_id: 1,
          created_at: Math.floor(Date.now() / 1000),
          analytics_event_types: { name: 'page_view' },
          analytics_categories: { name: 'navigation' },
          analytics_actions: { name: 'view' },
          analytics_pages: { path: '/' },
        },
        {
          id: '2',
          event_type: 1,
          category_id: 1,
          action_id: 1,
          label: '/products',
          value: null,
          user_id: null,
          session_hash: 2222222222,
          page_id: 2,
          created_at: Math.floor(Date.now() / 1000),
          analytics_event_types: { name: 'page_view' },
          analytics_categories: { name: 'navigation' },
          analytics_actions: { name: 'view' },
          analytics_pages: { path: '/products' },
        },
      ]

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: events,
          error: null,
        }),
      } as any)

      const params = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
      }

      const metrics = await metricsCalculator.calculateMetrics(params)

      expect(metrics.engagement.uniqueSessions).toBe(2)
      expect(metrics.engagement.averageEventsPerSession).toBe(1)
    })

    it('debería calcular usuarios únicos correctamente', async () => {
      const events = [
        {
          id: '1',
          event_type: 1,
          category_id: 1,
          action_id: 1,
          label: '/',
          value: null,
          user_id: 'user-1',
          session_hash: 1111111111,
          page_id: 1,
          created_at: Math.floor(Date.now() / 1000),
          analytics_event_types: { name: 'page_view' },
          analytics_categories: { name: 'navigation' },
          analytics_actions: { name: 'view' },
          analytics_pages: { path: '/' },
        },
        {
          id: '2',
          event_type: 1,
          category_id: 1,
          action_id: 1,
          label: '/products',
          value: null,
          user_id: 'user-2',
          session_hash: 2222222222,
          page_id: 2,
          created_at: Math.floor(Date.now() / 1000),
          analytics_event_types: { name: 'page_view' },
          analytics_categories: { name: 'navigation' },
          analytics_actions: { name: 'view' },
          analytics_pages: { path: '/products' },
        },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: events,
          error: null,
        }),
      }
      mockSupabaseInstance.from.mockReturnValue(mockQuery as any)

      const params = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
      }

      const metrics = await metricsCalculator.calculateMetrics(params)

      expect(metrics.engagement.uniqueUsers).toBe(2)
    })
  })

  describe('Manejo de errores', () => {
    it('debería manejar errores de conexión a Supabase', async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(new Error('Connection error')),
      } as any)

      const params = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
      }

      const metrics = await metricsCalculator.calculateMetrics(params)

      // Debería retornar métricas vacías
      expect(metrics.ecommerce.cartAdditions).toBe(0)
      expect(metrics.engagement.uniqueSessions).toBe(0)
    })
  })
})
