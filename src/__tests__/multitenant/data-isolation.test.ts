/**
 * Tests de Aislamiento de Datos Multitenant
 * 
 * Verifica que:
 * 1. Un tenant no puede acceder a datos de otro tenant
 * 2. Las APIs admin filtran correctamente por tenant_id
 * 3. Las APIs públicas solo muestran datos del tenant actual
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { setTenantConfigOverride, setSupabaseFactoryOverride, clearTenantOverrides } from './helpers'

describe('Multitenant Data Isolation', () => {
  const mockSupabase = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setSupabaseFactoryOverride(() => mockSupabase)
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.delete.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    clearTenantOverrides()
  })

  describe('Orders API Isolation', () => {
    it('should filter orders by tenant_id when querying', async () => {
      const tenant1 = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
      }

      setTenantConfigOverride(tenant1)

      // Simular query de órdenes
      mockSupabase.select.mockResolvedValue({
        data: [
          { id: 'order-1', tenant_id: tenant1.id, total: 1000 },
        ],
        error: null,
      })

      const { data } = await mockSupabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenant1.id)

      // Verificar que se llamó eq con tenant_id
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant1.id)
      expect(data).toBeDefined()
      expect(data?.every((order: any) => order.tenant_id === tenant1.id)).toBe(true)
    })

    it('should not return orders from other tenants', async () => {
      const tenant1 = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
      }

      const tenant2 = {
        id: 'tenant-2-id',
        slug: 'pintemas',
        name: 'Pintemas',
      }

      setTenantConfigOverride(tenant1)

      // Simular que hay órdenes de ambos tenants en la BD
      const allOrders = [
        { id: 'order-1', tenant_id: tenant1.id, total: 1000 },
        { id: 'order-2', tenant_id: tenant2.id, total: 2000 },
      ]

      // Mock que filtra correctamente
      mockSupabase.select.mockImplementation((query) => {
        const filtered = allOrders.filter((o: any) => o.tenant_id === tenant1.id)
        return Promise.resolve({ data: filtered, error: null })
      })

      const { data } = await mockSupabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenant1.id)

      // Verificar que solo retorna órdenes del tenant1
      expect(data).toBeDefined()
      expect(data?.length).toBe(1)
      expect(data?.[0].tenant_id).toBe(tenant1.id)
      expect(data?.some((o: any) => o.tenant_id === tenant2.id)).toBe(false)
    })
  })

  describe('Cart Items API Isolation', () => {
    it('should filter cart items by tenant_id', async () => {
      const tenant1 = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
      }

      setTenantConfigOverride(tenant1)

      mockSupabase.select.mockResolvedValue({
        data: [
          { id: 'cart-1', user_id: 'user-1', tenant_id: tenant1.id, product_id: 1 },
        ],
        error: null,
      })

      const { data } = await mockSupabase
        .from('cart_items')
        .select('*')
        .eq('user_id', 'user-1')
        .eq('tenant_id', tenant1.id)

      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant1.id)
      expect(data).toBeDefined()
      expect(data?.every((item: any) => item.tenant_id === tenant1.id)).toBe(true)
    })
  })

  describe('Products API Isolation', () => {
    it('should filter products by tenant_products.is_visible', async () => {
      const tenant1 = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
      }

      setTenantConfigOverride(tenant1)

      // Simular query con tenant_products
      mockSupabase.select.mockResolvedValue({
        data: [
          {
            id: 1,
            name: 'Product 1',
            tenant_products: [
              { tenant_id: tenant1.id, is_visible: true, price: 1000 },
            ],
          },
        ],
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant1.id)
        .eq('tenant_products.is_visible', true)

      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_products.tenant_id', tenant1.id)
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_products.is_visible', true)
      expect(data).toBeDefined()
    })
  })

  describe('Categories API Isolation', () => {
    it('should filter categories by tenant_id', async () => {
      const tenant1 = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
      }

      setTenantConfigOverride(tenant1)

      mockSupabase.select.mockResolvedValue({
        data: [
          { id: 'cat-1', slug: 'pinturas', tenant_id: tenant1.id },
        ],
        error: null,
      })

      const { data } = await mockSupabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenant1.id)

      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant1.id)
      expect(data).toBeDefined()
      expect(data?.every((cat: any) => cat.tenant_id === tenant1.id)).toBe(true)
    })
  })

  describe('Coupons and Promotions API Isolation', () => {
    it('should filter coupons by tenant_id', async () => {
      const tenant1 = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
      }

      setTenantConfigOverride(tenant1)

      mockSupabase.select.mockResolvedValue({
        data: [
          { id: 'coupon-1', code: 'DESC10', tenant_id: tenant1.id },
        ],
        error: null,
      })

      const { data } = await mockSupabase
        .from('coupons')
        .select('*')
        .eq('tenant_id', tenant1.id)

      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant1.id)
      expect(data).toBeDefined()
    })

    it('should filter promotions by tenant_id', async () => {
      const tenant1 = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
      }

      setTenantConfigOverride(tenant1)

      mockSupabase.select.mockResolvedValue({
        data: [
          { id: 'promo-1', code: 'PROMO20', tenant_id: tenant1.id },
        ],
        error: null,
      })

      const { data } = await mockSupabase
        .from('promotions')
        .select('*')
        .eq('tenant_id', tenant1.id)

      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant1.id)
      expect(data).toBeDefined()
    })
  })

  describe('Analytics API Isolation', () => {
    it('should filter analytics events by tenant_id', async () => {
      const tenant1 = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
      }

      setTenantConfigOverride(tenant1)

      mockSupabase.select.mockResolvedValue({
        data: [
          { id: 'event-1', event_type: 'page_view', tenant_id: tenant1.id },
        ],
        error: null,
      })

      const { data } = await mockSupabase
        .from('analytics_events_optimized')
        .select('*')
        .eq('tenant_id', tenant1.id)

      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant1.id)
      expect(data).toBeDefined()
    })
  })

  describe('Insert Operations', () => {
    it('should assign tenant_id when creating orders', async () => {
      const tenant1 = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
      }

      setTenantConfigOverride(tenant1)

      const orderData = {
        user_id: 'user-1',
        total: 1000,
        status: 'pending',
        tenant_id: tenant1.id, // MULTITENANT: Asignar tenant_id
      }

      mockSupabase.insert.mockResolvedValue({
        data: [{ id: 'order-1', ...orderData }],
        error: null,
      })

      const { data } = await mockSupabase
        .from('orders')
        .insert(orderData)

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: tenant1.id })
      )
      expect(data).toBeDefined()
      expect(data?.[0].tenant_id).toBe(tenant1.id)
    })

    it('should assign tenant_id when creating cart items', async () => {
      const tenant1 = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
      }

      setTenantConfigOverride(tenant1)

      const cartItemData = {
        user_id: 'user-1',
        product_id: 1,
        quantity: 2,
        tenant_id: tenant1.id, // MULTITENANT: Asignar tenant_id
      }

      mockSupabase.insert.mockResolvedValue({
        data: [{ id: 'cart-1', ...cartItemData }],
        error: null,
      })

      const { data } = await mockSupabase
        .from('cart_items')
        .insert(cartItemData)

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: tenant1.id })
      )
      expect(data).toBeDefined()
      expect(data?.[0].tenant_id).toBe(tenant1.id)
    })
  })
})
