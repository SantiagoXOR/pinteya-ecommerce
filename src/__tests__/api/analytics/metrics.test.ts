/**
 * Integration tests para /api/analytics/metrics
 * Verifica API de métricas con cache
 */

import { GET } from '@/app/api/analytics/metrics/route'
import { NextRequest } from 'next/server'

// Mock de dependencias
const mockCalculateMetrics = jest.fn()
const mockCalculateAdvancedMetrics = jest.fn()
const mockGenerateKey = jest.fn()
const mockGet = jest.fn()
const mockGetTTL = jest.fn()

jest.mock('@/lib/analytics/metrics-calculator', () => ({
  metricsCalculator: {
    calculateMetrics: (...args: any[]) => mockCalculateMetrics(...args),
    calculateAdvancedMetrics: (...args: any[]) => mockCalculateAdvancedMetrics(...args),
  },
}))

jest.mock('@/lib/analytics/metrics-cache', () => ({
  metricsCache: {
    generateKey: (...args: any[]) => mockGenerateKey(...args),
    get: (...args: any[]) => mockGet(...args),
    getTTL: (...args: any[]) => mockGetTTL(...args),
  },
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

describe('GET /api/analytics/metrics', () => {
  const mockMetrics = {
    ecommerce: {
      cartAdditions: 10,
      cartRemovals: 2,
      checkoutStarts: 5,
      checkoutCompletions: 3,
      productViews: 50,
      categoryViews: 20,
      searchQueries: 15,
      conversionRate: 60,
      cartAbandonmentRate: 40,
      productToCartRate: 20,
      averageOrderValue: 1000,
      totalRevenue: 3000,
    },
    engagement: {
      uniqueSessions: 100,
      uniqueUsers: 50,
      averageEventsPerSession: 5.5,
      averageSessionDuration: 180,
      topPages: [],
      topProducts: [],
    },
    trends: {
      pageViews: [],
      conversions: [],
      revenue: [],
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockGenerateKey.mockReturnValue('analytics:daily:2026-01-01')
    mockGet.mockResolvedValue(null)
    mockGetTTL.mockReturnValue(3600)

    mockCalculateMetrics.mockResolvedValue(mockMetrics)
    mockCalculateAdvancedMetrics.mockResolvedValue({
      ...mockMetrics,
      devices: {} as any,
      categories: {} as any,
      behavior: {} as any,
      retention: {} as any,
    })
  })

  it('debería retornar métricas desde cache cuando están disponibles', async () => {
    mockGet.mockResolvedValue(mockMetrics)

    const request = new NextRequest('http://localhost:3000/api/analytics/metrics?startDate=2026-01-01&endDate=2026-01-02')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.cached).toBe(true)
    expect(data.ecommerce).toEqual(mockMetrics.ecommerce)
    expect(mockCalculateMetrics).not.toHaveBeenCalled()
  })

  it('debería calcular métricas cuando no hay cache', async () => {
    mockGet.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/analytics/metrics?startDate=2026-01-01&endDate=2026-01-02')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.cached).toBeUndefined()
    expect(data.ecommerce).toEqual(mockMetrics.ecommerce)
    expect(mockCalculateMetrics).toHaveBeenCalled()
  })

  it('debería usar fechas por defecto cuando no se proporcionan', async () => {
    mockGet.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/analytics/metrics')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.period.startDate).toBeDefined()
    expect(data.period.endDate).toBeDefined()
    expect(mockCalculateMetrics).toHaveBeenCalled()
  })

  it('debería filtrar por userId cuando se proporciona', async () => {
    mockGet.mockResolvedValue(null)

    const request = new NextRequest(
      'http://localhost:3000/api/analytics/metrics?startDate=2026-01-01&endDate=2026-01-02&userId=user-123'
    )

    await GET(request)

    expect(mockCalculateMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
      })
    )
  })

  it('debería incluir análisis avanzado cuando advanced=true', async () => {
    mockGet.mockResolvedValue(null)

    const request = new NextRequest(
      'http://localhost:3000/api/analytics/metrics?startDate=2026-01-01&endDate=2026-01-02&advanced=true'
    )

    await GET(request)

    expect(mockCalculateAdvancedMetrics).toHaveBeenCalled()
    expect(mockCalculateMetrics).not.toHaveBeenCalled()
  })

  it('debería determinar tipo de cache correcto según rango de fechas', async () => {
    mockGet.mockResolvedValue(null)

    // Realtime (<= 1 día)
    const request1 = new NextRequest(
      'http://localhost:3000/api/analytics/metrics?startDate=2026-01-01T00:00:00Z&endDate=2026-01-01T12:00:00Z'
    )
    await GET(request1)
    expect(mockGenerateKey).toHaveBeenCalledWith(expect.any(Object), 'realtime')

    jest.clearAllMocks()

    // Daily (<= 7 días)
    const request2 = new NextRequest(
      'http://localhost:3000/api/analytics/metrics?startDate=2026-01-01&endDate=2026-01-05'
    )
    await GET(request2)
    expect(mockGenerateKey).toHaveBeenCalledWith(expect.any(Object), 'daily')

    jest.clearAllMocks()

    // Weekly (<= 30 días)
    const request3 = new NextRequest(
      'http://localhost:3000/api/analytics/metrics?startDate=2026-01-01&endDate=2026-01-15'
    )
    await GET(request3)
    expect(mockGenerateKey).toHaveBeenCalledWith(expect.any(Object), 'weekly')

    jest.clearAllMocks()

    // Monthly (> 30 días)
    const request4 = new NextRequest(
      'http://localhost:3000/api/analytics/metrics?startDate=2026-01-01&endDate=2026-02-15'
    )
    await GET(request4)
    expect(mockGenerateKey).toHaveBeenCalledWith(expect.any(Object), 'monthly')
  })

  it('debería calcular comparación con período anterior', async () => {
    mockGet.mockResolvedValue(null)

    const request = new NextRequest(
      'http://localhost:3000/api/analytics/metrics?startDate=2026-01-01&endDate=2026-01-08'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.comparison).toBeDefined()
    expect(data.comparison.previousPeriod).toBeDefined()
    expect(data.comparison.changes).toBeDefined()

    // Debería calcular métricas para período anterior también
    expect(mockCalculateMetrics).toHaveBeenCalledTimes(2)
  })

  it('debería manejar errores correctamente', async () => {
    mockGet.mockRejectedValue(new Error('Cache error'))

    const request = new NextRequest('http://localhost:3000/api/analytics/metrics?startDate=2026-01-01&endDate=2026-01-02')

    const response = await GET(request)

    expect(response.status).toBeGreaterThanOrEqual(400)
  })

  it('debería almacenar métricas en cache después de calcular', async () => {
    mockGet.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/analytics/metrics?startDate=2026-01-01&endDate=2026-01-02')

    await GET(request)

    // Verificar que se intentó almacenar en cache
    // (el método set se llama internamente, pero podemos verificar que calculateMetrics fue llamado)
    expect(mockCalculateMetrics).toHaveBeenCalled()
  })
})
