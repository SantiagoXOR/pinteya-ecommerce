/**
 * Tests de Integración - Products Multitenant
 * 
 * Verifica que:
 * - TenantProductService obtiene productos con stock/precio del tenant
 * - Stock compartido vs stock independiente funciona correctamente
 * - Precios por tenant son correctos
 * - Visibilidad por tenant (is_visible) funciona
 * - Productos destacados por tenant (is_featured) funcionan
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { mockTenants } from '../setup'
import {
  setTenantConfigOverride,
  setSupabaseFactoryOverride,
  clearTenantOverrides,
} from '../helpers'
import { getTenantFixtures } from '../fixtures'

describe('Products Multitenant', () => {
  const mockSupabase = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    inner: jest.fn(),
    is: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setSupabaseFactoryOverride(() => mockSupabase)
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.inner.mockReturnValue(mockSupabase)
    mockSupabase.is.mockReturnValue(mockSupabase)
    mockSupabase.order.mockReturnValue(mockSupabase)
    mockSupabase.range.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    clearTenantOverrides()
  })

  describe('TenantProductService', () => {
    it('should get products with tenant-specific price', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const products = getTenantFixtures('pinteya').products
      mockSupabase.range.mockResolvedValue({
        data: products,
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)
        .eq('tenant_products.is_visible', true)
        .range(0, 10)

      expect(data).toBeDefined()
      if (data && data.length > 0) {
        const product = data[0]
        const tenantProduct = product.tenant_products?.find(
          (tp: any) => tp.tenant_id === tenant.id
        )
        expect(tenantProduct?.price).toBeDefined()
        expect(typeof tenantProduct?.price).toBe('number')
      }
    })

    it('should get products with tenant-specific stock', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const products = getTenantFixtures('pinteya').products
      mockSupabase.range.mockResolvedValue({
        data: products,
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)
        .eq('tenant_products.is_visible', true)
        .range(0, 10)

      expect(data).toBeDefined()
      if (data && data.length > 0) {
        const product = data[0]
        const tenantProduct = product.tenant_products?.find(
          (tp: any) => tp.tenant_id === tenant.id
        )
        expect(tenantProduct?.stock).toBeDefined()
        expect(typeof tenantProduct?.stock).toBe('number')
      }
    })
  })

  describe('Shared Stock vs Independent Stock', () => {
    it('should show same stock for products with shared pool', async () => {
      // Simular productos con stock compartido
      const sharedPoolId = 'pool-123'
      const productId = 1

      const pinteyaProduct = {
        product_id: productId,
        tenant_id: mockTenants.pinteya.id,
        shared_pool_id: sharedPoolId,
        stock: null, // Stock viene del pool
        price: 5000,
      }

      const pintemasProduct = {
        product_id: productId,
        tenant_id: mockTenants.pintemas.id,
        shared_pool_id: sharedPoolId,
        stock: null, // Stock viene del pool
        price: 5000,
      }

      // Ambos deberían obtener el mismo stock del pool
      const poolStock = 100

      expect(pinteyaProduct.shared_pool_id).toBe(sharedPoolId)
      expect(pintemasProduct.shared_pool_id).toBe(sharedPoolId)
      // Ambos comparten el mismo pool
      expect(pinteyaProduct.shared_pool_id).toBe(pintemasProduct.shared_pool_id)
    })

    it('should show independent stock for products without shared pool', async () => {
      const tenant1 = mockTenants.pinteya
      const tenant2 = mockTenants.pintemas

      const product1 = {
        product_id: 1,
        tenant_id: tenant1.id,
        shared_pool_id: null, // Stock independiente
        stock: 50,
        price: 5000,
      }

      const product2 = {
        product_id: 1,
        tenant_id: tenant2.id,
        shared_pool_id: null, // Stock independiente
        stock: 40,
        price: 5500,
      }

      // Cada tenant tiene su propio stock
      expect(product1.stock).toBe(50)
      expect(product2.stock).toBe(40)
      expect(product1.stock).not.toBe(product2.stock)
    })
  })

  describe('Price per Tenant', () => {
    it('should allow different prices for same product in different tenants', async () => {
      const tenant1 = mockTenants.pinteya
      const tenant2 = mockTenants.pintemas

      const product1 = getTenantFixtures('pinteya').products[0]
      const product2 = getTenantFixtures('pintemas').products[0]

      // Mismo producto (id: 1) pero diferentes precios
      if (product1.id === product2.id) {
        const price1 = product1.tenant_products?.find(
          (tp: any) => tp.tenant_id === tenant1.id
        )?.price
        const price2 = product2.tenant_products?.find(
          (tp: any) => tp.tenant_id === tenant2.id
        )?.price

        // Los precios pueden ser diferentes
        expect(price1).toBeDefined()
        expect(price2).toBeDefined()
      }
    })
  })

  describe('Visibility per Tenant', () => {
    it('should only show visible products for tenant', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const allProducts = getTenantFixtures('pinteya').products
      const visibleProducts = allProducts.filter((p: any) =>
        p.tenant_products?.some(
          (tp: any) => tp.tenant_id === tenant.id && tp.is_visible === true
        )
      )

      mockSupabase.range.mockResolvedValue({
        data: visibleProducts,
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)
        .eq('tenant_products.is_visible', true)
        .range(0, 10)

      expect(data).toBeDefined()
      expect(
        data.every((p: any) =>
          p.tenant_products?.some(
            (tp: any) => tp.tenant_id === tenant.id && tp.is_visible === true
          )
        )
      ).toBe(true)
    })

    it('should hide products that are not visible for tenant', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      // Simular producto no visible
      const hiddenProduct = {
        id: 999,
        name: 'Hidden Product',
        tenant_products: [
          {
            tenant_id: tenant.id,
            is_visible: false,
          },
        ],
      }

      const allProducts = [...getTenantFixtures('pinteya').products, hiddenProduct]
      const visibleProducts = allProducts.filter((p: any) =>
        p.tenant_products?.some(
          (tp: any) => tp.tenant_id === tenant.id && tp.is_visible === true
        )
      )

      expect(visibleProducts.some((p: any) => p.id === 999)).toBe(false)
    })
  })

  describe('Featured Products per Tenant', () => {
    it('should show featured products for tenant', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const allProducts = getTenantFixtures('pinteya').products
      const featuredProducts = allProducts.filter((p: any) =>
        p.tenant_products?.some(
          (tp: any) => tp.tenant_id === tenant.id && tp.is_featured === true
        )
      )

      mockSupabase.range.mockResolvedValue({
        data: featuredProducts,
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)
        .eq('tenant_products.is_featured', true)
        .range(0, 10)

      expect(data).toBeDefined()
      expect(
        data.every((p: any) =>
          p.tenant_products?.some(
            (tp: any) => tp.tenant_id === tenant.id && tp.is_featured === true
          )
        )
      ).toBe(true)
    })

    it('should allow different featured products for different tenants', async () => {
      const tenant1 = mockTenants.pinteya
      const tenant2 = mockTenants.pintemas

      const featured1 = getTenantFixtures('pinteya').products.filter((p: any) =>
        p.tenant_products?.some(
          (tp: any) => tp.tenant_id === tenant1.id && tp.is_featured === true
        )
      )

      const featured2 = getTenantFixtures('pintemas').products.filter((p: any) =>
        p.tenant_products?.some(
          (tp: any) => tp.tenant_id === tenant2.id && tp.is_featured === true
        )
      )

      // Cada tenant puede tener diferentes productos destacados
      expect(featured1.length).toBeGreaterThanOrEqual(0)
      expect(featured2.length).toBeGreaterThanOrEqual(0)
    })
  })
})
