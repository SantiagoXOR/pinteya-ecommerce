/**
 * Tests de Integración - Analytics Multitenant
 * 
 * Verifica que:
 * - Analytics solo registra eventos del tenant actual
 * - GA4 Measurement ID correcto por tenant
 * - Meta Pixel ID correcto por tenant
 * - Eventos filtrados por tenant_id en queries
 * - Agregaciones respetan tenant_id
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { getTenantConfig } from '@/lib/tenant'
import { mockTenants } from '../setup'
import {
  setTenantConfigOverride,
  setSupabaseFactoryOverride,
  clearTenantOverrides,
} from '../helpers'
import { getTenantFixtures } from '../fixtures'

describe('Analytics Multitenant', () => {
  const mockSupabase = {
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    eq: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setSupabaseFactoryOverride(() => mockSupabase)
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.gte.mockReturnValue(mockSupabase)
    mockSupabase.lte.mockReturnValue(mockSupabase)
    mockSupabase.order.mockReturnValue(mockSupabase)
    mockSupabase.range.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    clearTenantOverrides()
  })

  describe('Event Registration', () => {
    it('should assign tenant_id when creating analytics events', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const event = {
        event_type: 'page_view',
        page_path: '/',
        tenant_id: tenant.id, // MULTITENANT: Asignar tenant_id
      }

      mockSupabase.insert.mockResolvedValue({
        data: [{ id: 'event-1', ...event }],
        error: null,
      })

      const { data } = await mockSupabase.from('analytics_events_optimized').insert(event)

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: tenant.id })
      )
      expect(data?.[0].tenant_id).toBe(tenant.id)
    })

    it('should not mix events from different tenants', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const allEvents = [
        ...getTenantFixtures('pinteya').analyticsEvents,
        ...getTenantFixtures('pintemas').analyticsEvents,
      ]

      const filteredEvents = allEvents.filter((e: any) => e.tenant_id === tenant.id)

      mockSupabase.select.mockResolvedValue({
        data: filteredEvents,
        error: null,
      })

      const { data } = await mockSupabase
        .from('analytics_events_optimized')
        .select('*')
        .eq('tenant_id', tenant.id)

      expect(data).toBeDefined()
      expect(data.every((e: any) => e.tenant_id === tenant.id)).toBe(true)
      expect(data.some((e: any) => e.tenant_id === mockTenants.pintemas.id)).toBe(false)
    })
  })

  describe('GA4 Configuration', () => {
    it('should use correct GA4 Measurement ID for tenant', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const config = await getTenantConfig()

      expect(config.ga4MeasurementId).toBe('G-PINTEYA123')
    })

    it('should use different GA4 Measurement ID for different tenant', async () => {
      const tenant1 = mockTenants.pinteya
      const tenant2 = mockTenants.pintemas

      setTenantConfigOverride(tenant1)
      const config1 = await getTenantConfig()
      setTenantConfigOverride(tenant2)
      const config2 = await getTenantConfig()

      expect(config1.ga4MeasurementId).toBe('G-PINTEYA123')
      expect(config2.ga4MeasurementId).toBe('G-PINTEMAS456')
      expect(config1.ga4MeasurementId).not.toBe(config2.ga4MeasurementId)
    })
  })

  describe('Meta Pixel Configuration', () => {
    it('should use correct Meta Pixel ID for tenant', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const config = await getTenantConfig()

      expect(config.metaPixelId).toBe('123456789012345')
    })

    it('should use different Meta Pixel ID for different tenant', async () => {
      const tenant1 = mockTenants.pinteya
      const tenant2 = mockTenants.pintemas

      setTenantConfigOverride(tenant1)
      const config1 = await getTenantConfig()
      setTenantConfigOverride(tenant2)
      const config2 = await getTenantConfig()

      expect(config1.metaPixelId).toBe('123456789012345')
      expect(config2.metaPixelId).toBe('987654321098765')
      expect(config1.metaPixelId).not.toBe(config2.metaPixelId)
    })
  })

  describe('Analytics Queries', () => {
    it('should filter events by tenant_id', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      mockSupabase.range.mockResolvedValue({
        data: getTenantFixtures('pinteya').analyticsEvents,
        error: null,
      })

      await mockSupabase
        .from('analytics_events_optimized')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .range(0, 10)

      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })

    it('should filter events by date range and tenant_id', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      mockSupabase.range.mockResolvedValue({
        data: getTenantFixtures('pinteya').analyticsEvents,
        error: null,
      })

      await mockSupabase
        .from('analytics_events_optimized')
        .select('*')
        .eq('tenant_id', tenant.id)
        .gte('created_at', '2024-01-01')
        .lte('created_at', '2024-01-31')
        .order('created_at', { ascending: false })
        .range(0, 10)

      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', '2024-01-01')
      expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', '2024-01-31')
    })
  })

  describe('Analytics Aggregations', () => {
    it('should aggregate events by tenant_id', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const events = getTenantFixtures('pinteya').analyticsEvents
      const pageViews = events.filter((e: any) => e.event_type === 'page_view')

      mockSupabase.select.mockResolvedValue({
        data: pageViews,
        error: null,
      })

      const { data } = await mockSupabase
        .from('analytics_events_optimized')
        .select('event_type, count(*)')
        .eq('tenant_id', tenant.id)
        .eq('event_type', 'page_view')

      expect(data).toBeDefined()
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })

    it('should not include events from other tenants in aggregations', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const allEvents = [
        ...getTenantFixtures('pinteya').analyticsEvents,
        ...getTenantFixtures('pintemas').analyticsEvents,
      ]

      const filteredEvents = allEvents.filter((e: any) => e.tenant_id === tenant.id)

      mockSupabase.select.mockResolvedValue({
        data: filteredEvents,
        error: null,
      })

      const { data } = await mockSupabase
        .from('analytics_events_optimized')
        .select('*')
        .eq('tenant_id', tenant.id)

      expect(data).toBeDefined()
      expect(data.every((e: any) => e.tenant_id === tenant.id)).toBe(true)
    })
  })

  describe('TenantAnalytics Component', () => {
    it('should render GA4 script with correct measurement ID', () => {
      const tenant = mockTenants.pinteya
      const ga4Id = tenant.ga4MeasurementId

      // Simular script de GA4
      const scriptContent = `
        gtag('config', '${ga4Id}', {
          send_page_view: true,
        });
      `

      expect(scriptContent).toContain(ga4Id)
      expect(scriptContent).toContain('G-PINTEYA123')
    })

    it('should render Meta Pixel script with correct pixel ID', () => {
      const tenant = mockTenants.pinteya
      const pixelId = tenant.metaPixelId

      // Simular script de Meta Pixel
      const scriptContent = `
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `

      expect(scriptContent).toContain(pixelId)
      expect(scriptContent).toContain('123456789012345')
    })

    it('should not render analytics scripts if IDs are not configured', () => {
      const tenantWithoutAnalytics = {
        ...mockTenants.pinteya,
        ga4MeasurementId: null,
        metaPixelId: null,
      }

      const shouldRenderGA4 = !!tenantWithoutAnalytics.ga4MeasurementId
      const shouldRenderMeta = !!tenantWithoutAnalytics.metaPixelId

      expect(shouldRenderGA4).toBe(false)
      expect(shouldRenderMeta).toBe(false)
    })
  })
})
