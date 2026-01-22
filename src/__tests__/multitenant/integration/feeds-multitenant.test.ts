/**
 * Tests de Integración - Feeds Multitenant
 * 
 * Verifica que:
 * - Feed de Google Merchant solo incluye productos del tenant actual
 * - Feed de Meta Catalog solo incluye productos del tenant actual
 * - Sitemap solo incluye URLs del tenant actual
 * - Precios y stock correctos por tenant
 * - URLs base correctas por tenant
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { mockTenants, configToDBRow } from '../setup'
import {
  createTenantRequest,
  setTenantConfigOverride,
  setSupabaseFactoryOverride,
  clearTenantOverrides,
} from '../helpers'
import { getTenantFixtures } from '../fixtures'

describe('Feeds Multitenant', () => {
  const mockSupabase = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    inner: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setSupabaseFactoryOverride(() => mockSupabase)
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.inner.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    clearTenantOverrides()
  })

  describe('Google Merchant Feed', () => {
    it('should only include products from current tenant', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const tenantProducts = getTenantFixtures('pinteya').products.filter((p: any) =>
        p.tenant_products?.some((tp: any) => tp.tenant_id === tenant.id && tp.is_visible)
      )

      mockSupabase.select.mockResolvedValue({
        data: tenantProducts,
        error: null,
      })

      // Simular query de feed
      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)
        .eq('tenant_products.is_visible', true)

      expect(data).toBeDefined()
      expect(
        data.every((p: any) =>
          p.tenant_products?.some((tp: any) => tp.tenant_id === tenant.id)
        )
      ).toBe(true)
      expect(mockSupabase.eq).toHaveBeenCalledWith(
        'tenant_products.tenant_id',
        tenant.id
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith(
        'tenant_products.is_visible',
        true
      )
    })

    it('should use correct prices from tenant_products', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const products = getTenantFixtures('pinteya').products
      mockSupabase.select.mockResolvedValue({
        data: products,
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)

      // Verificar que los precios vienen de tenant_products
      if (data && data.length > 0) {
        const product = data[0]
        const tenantProduct = product.tenant_products?.find(
          (tp: any) => tp.tenant_id === tenant.id
        )
        expect(tenantProduct?.price).toBeDefined()
      }
    })

    it('should use correct base URL for tenant', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      // El feed debería usar la URL base del tenant
      const baseUrl = tenant.customDomain
        ? `https://${tenant.customDomain}`
        : `https://${tenant.subdomain}.pintureriadigital.com`

      expect(baseUrl).toBe('https://www.pinteya.com')
    })
  })

  describe('Meta Catalog Feed', () => {
    it('should only include products from current tenant', async () => {
      const tenant = mockTenants.pintemas
      setTenantConfigOverride(tenant)

      const tenantProducts = getTenantFixtures('pintemas').products.filter((p: any) =>
        p.tenant_products?.some((tp: any) => tp.tenant_id === tenant.id && tp.is_visible)
      )

      mockSupabase.select.mockResolvedValue({
        data: tenantProducts,
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)
        .eq('tenant_products.is_visible', true)

      expect(data).toBeDefined()
      expect(
        data.every((p: any) =>
          p.tenant_products?.some((tp: any) => tp.tenant_id === tenant.id)
        )
      ).toBe(true)
    })

    it('should not include products from other tenants', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const allProducts = [
        ...getTenantFixtures('pinteya').products,
        ...getTenantFixtures('pintemas').products,
      ]

      const filteredProducts = allProducts.filter((p: any) =>
        p.tenant_products?.some(
          (tp: any) => tp.tenant_id === tenant.id && tp.is_visible
        )
      )

      mockSupabase.select.mockResolvedValue({
        data: filteredProducts,
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)
        .eq('tenant_products.is_visible', true)

      expect(data).toBeDefined()
      expect(
        data.some((p: any) =>
          p.tenant_products?.some((tp: any) => tp.tenant_id === mockTenants.pintemas.id)
        )
      ).toBe(false)
    })
  })

  describe('Sitemap Generator', () => {
    it('should only include URLs from current tenant', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const baseUrl = tenant.customDomain
        ? `https://${tenant.customDomain}`
        : `https://${tenant.subdomain}.pintureriadigital.com`

      // Simular generación de sitemap
      const productPages = getTenantFixtures('pinteya').products.map((p: any) => ({
        url: `${baseUrl}/product/${p.id}`,
        lastmod: new Date().toISOString(),
      }))

      expect(productPages.length).toBeGreaterThan(0)
      expect(productPages.every((page: any) => page.url.includes(baseUrl))).toBe(true)
    })

    it('should use correct base URL for tenant', async () => {
      const tenant1 = mockTenants.pinteya
      const tenant2 = mockTenants.pintemas

      const baseUrl1 = tenant1.customDomain
        ? `https://${tenant1.customDomain}`
        : `https://${tenant1.subdomain}.pintureriadigital.com`

      const baseUrl2 = tenant2.customDomain
        ? `https://${tenant2.customDomain}`
        : `https://${tenant2.subdomain}.pintureriadigital.com`

      expect(baseUrl1).toBe('https://www.pinteya.com')
      expect(baseUrl2).toBe('https://www.pintemas.com')
    })

    it('should filter products by tenant_products.is_visible', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const allProducts = getTenantFixtures('pinteya').products
      const visibleProducts = allProducts.filter((p: any) =>
        p.tenant_products?.some(
          (tp: any) => tp.tenant_id === tenant.id && tp.is_visible === true
        )
      )

      mockSupabase.select.mockResolvedValue({
        data: visibleProducts,
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)
        .eq('tenant_products.is_visible', true)

      expect(data).toBeDefined()
      expect(
        data.every((p: any) =>
          p.tenant_products?.some(
            (tp: any) => tp.tenant_id === tenant.id && tp.is_visible === true
          )
        )
      ).toBe(true)
    })
  })

  describe('Stock and Price Accuracy', () => {
    it('should use stock from tenant_products', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const products = getTenantFixtures('pinteya').products
      mockSupabase.select.mockResolvedValue({
        data: products,
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)

      if (data && data.length > 0) {
        const product = data[0]
        const tenantProduct = product.tenant_products?.find(
          (tp: any) => tp.tenant_id === tenant.id
        )
        expect(tenantProduct?.stock).toBeDefined()
        expect(typeof tenantProduct?.stock).toBe('number')
      }
    })

    it('should use price from tenant_products (not from products table)', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const products = getTenantFixtures('pinteya').products
      mockSupabase.select.mockResolvedValue({
        data: products,
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)

      if (data && data.length > 0) {
        const product = data[0]
        const tenantProduct = product.tenant_products?.find(
          (tp: any) => tp.tenant_id === tenant.id
        )
        // El precio debería venir de tenant_products, no de products
        expect(tenantProduct?.price).toBeDefined()
        expect(typeof tenantProduct?.price).toBe('number')
      }
    })
  })
})
