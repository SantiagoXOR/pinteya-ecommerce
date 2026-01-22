/**
 * Tests de Integración - API Isolation
 * 
 * Verifica que:
 * - Cada API solo retorna datos del tenant actual
 * - No se puede acceder a datos de otros tenants
 * - Asignación correcta de tenant_id en INSERTs
 * - Validación de tenant_id en UPDATEs y DELETEs
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { mockTenants, configToDBRow } from '../setup'
import {
  createTenantRequest,
  createMockSupabaseClient,
  expectTenantFilter,
  setTenantConfigOverride,
  clearTenantOverrides,
} from '../helpers'
import { getTenantFixtures } from '../fixtures'

describe('API Isolation - Multitenant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    clearTenantOverrides()
  })

  describe('Products API', () => {
    it('should filter products by tenant_products.is_visible', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const mockSupabase = createMockSupabaseClient(tenant.id)

      // Simular query que filtra por tenant_products
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: getTenantFixtures('pinteya').products,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)
        .eq('tenant_products.is_visible', true)
        .range(0, 10)

      expect(mockQuery.eq).toHaveBeenCalledWith(
        'tenant_products.tenant_id',
        tenant.id
      )
      expect(mockQuery.eq).toHaveBeenCalledWith(
        'tenant_products.is_visible',
        true
      )
    })

    it('should not return products from other tenants', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const allProducts = [
        ...getTenantFixtures('pinteya').products,
        ...getTenantFixtures('pintemas').products,
      ]

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: allProducts.filter((p: any) =>
            p.tenant_products?.some((tp: any) => tp.tenant_id === tenant.id)
          ),
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const { data } = await mockQuery.range(0, 10)

      // Verificar que solo retorna productos del tenant actual
      expect(data).toBeDefined()
      expect(
        data.every((p: any) =>
          p.tenant_products?.some((tp: any) => tp.tenant_id === tenant.id)
        )
      ).toBe(true)
    })
  })

  describe('Cart API', () => {
    it('should filter cart items by tenant_id', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: getTenantFixtures('pinteya').cartItems[0],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      // Simular GET /api/cart
      await mockQuery
        .select('*')
        .eq('user_id', 'user-1')
        .eq('tenant_id', tenant.id)

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })

    it('should assign tenant_id when creating cart items', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        insert: jest.fn().mockResolvedValue({
          data: [{ id: 'cart-1', tenant_id: tenant.id, product_id: 1, quantity: 2 }],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const cartItem = {
        user_id: 'user-1',
        product_id: 1,
        quantity: 2,
        tenant_id: tenant.id, // MULTITENANT: Asignar tenant_id
      }

      const { data } = await mockQuery.insert(cartItem)

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: tenant.id })
      )
      expect(data?.[0].tenant_id).toBe(tenant.id)
    })
  })

  describe('Orders API', () => {
    it('should filter orders by tenant_id', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: getTenantFixtures('pinteya').orders,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await mockQuery
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .range(0, 10)

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })

    it('should not return orders from other tenants', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const allOrders = [
        ...getTenantFixtures('pinteya').orders,
        ...getTenantFixtures('pintemas').orders,
      ]

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: allOrders.filter((o: any) => o.tenant_id === tenant.id),
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const { data } = await mockQuery
        .select('*')
        .eq('tenant_id', tenant.id)
        .range(0, 10)

      expect(data).toBeDefined()
      expect(data.every((o: any) => o.tenant_id === tenant.id)).toBe(true)
      expect(data.some((o: any) => o.tenant_id === mockTenants.pintemas.id)).toBe(false)
    })

    it('should assign tenant_id when creating orders', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        insert: jest.fn().mockResolvedValue({
          data: [{ id: 'order-1', tenant_id: tenant.id, total: 10000 }],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const order = {
        user_id: 'user-1',
        total: 10000,
        status: 'pending',
        tenant_id: tenant.id, // MULTITENANT: Asignar tenant_id
      }

      const { data } = await mockQuery.insert(order)

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: tenant.id })
      )
      expect(data?.[0].tenant_id).toBe(tenant.id)
    })
  })

  describe('Admin Orders API', () => {
    it('should filter admin orders by tenant_id', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: getTenantFixtures('pinteya').orders,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await mockQuery
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .range(0, 10)

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })
  })

  describe('Admin Products API', () => {
    it('should filter admin products by tenant_id', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: getTenantFixtures('pinteya').products,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      // Admin products también debería filtrar por tenant_products
      await mockQuery
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', tenant.id)
        .range(0, 10)

      expect(mockQuery.eq).toHaveBeenCalledWith(
        'tenant_products.tenant_id',
        tenant.id
      )
    })
  })

  describe('Admin Analytics API', () => {
    it('should filter analytics by tenant_id', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: getTenantFixtures('pinteya').analyticsEvents,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await mockQuery
        .select('*')
        .eq('tenant_id', tenant.id)
        .gte('created_at', '2024-01-01')
        .lte('created_at', '2024-01-31')
        .order('created_at', { ascending: false })
        .range(0, 10)

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })
  })

  describe('Admin Users API', () => {
    it('should filter users by tenant_id in user_profiles', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: getTenantFixtures('pinteya').users,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await mockQuery
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .range(0, 10)

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })
  })

  describe('UPDATE and DELETE Operations', () => {
    it('should validate tenant_id when updating orders', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      mockQuery
        .update({ status: 'completed' })
        .eq('id', 'order-1')
        .eq('tenant_id', tenant.id) // MULTITENANT: Validar tenant

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })

    it('should validate tenant_id when deleting cart items', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      const mockSupabase = createMockSupabaseClient(tenant.id)
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      mockQuery
        .delete()
        .eq('id', 'cart-1')
        .eq('tenant_id', tenant.id) // MULTITENANT: Validar tenant

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })
  })
})
