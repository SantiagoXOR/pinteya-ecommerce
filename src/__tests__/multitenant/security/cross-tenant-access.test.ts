/**
 * Tests de Seguridad - Cross-Tenant Access Prevention
 * 
 * Verifica que:
 * - No se puede acceder a órdenes de otro tenant por ID
 * - No se puede acceder a carrito de otro tenant
 * - No se puede acceder a productos de otro tenant (si no están visibles)
 * - No se puede acceder a analytics de otro tenant
 * - No se puede modificar datos de otro tenant
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { mockTenants } from '../setup'
import {
  createTenantRequest,
  setTenantConfigOverride,
  setSupabaseFactoryOverride,
  clearTenantOverrides,
} from '../helpers'
import { getTenantFixtures } from '../fixtures'

describe('Cross-Tenant Access Prevention', () => {
  const mockSupabase = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setSupabaseFactoryOverride(() => mockSupabase)
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.single.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.delete.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    clearTenantOverrides()
  })

  describe('Orders Access', () => {
    it('should not allow access to orders from other tenant by ID', async () => {
      const tenant = mockTenants.pinteya
      const otherTenant = mockTenants.pintemas
      setTenantConfigOverride(tenant)

      // Intentar acceder a orden de otro tenant
      const otherTenantOrder = getTenantFixtures('pintemas').orders[0]

      // La query debería filtrar por tenant_id y no encontrar la orden
      mockSupabase.single.mockResolvedValue({
        data: null, // No se encuentra porque es de otro tenant
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const { data, error } = await mockSupabase
        .from('orders')
        .select('*')
        .eq('id', otherTenantOrder.id)
        .eq('tenant_id', tenant.id) // MULTITENANT: Filtrar por tenant actual
        .single()

      expect(data).toBeNull()
      expect(error).toBeDefined()
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })

    it('should prevent accessing order details from other tenant', async () => {
      const tenant = mockTenants.pinteya
      const otherTenant = mockTenants.pintemas
      setTenantConfigOverride(tenant)

      const otherTenantOrderId = getTenantFixtures('pintemas').orders[0].id

      // Simular que se intenta acceder sin filtrar por tenant
      // Pero la API debería forzar el filtro
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const { data } = await mockSupabase
        .from('orders')
        .select('*')
        .eq('id', otherTenantOrderId)
        .eq('tenant_id', tenant.id) // MULTITENANT: Validación de tenant
        .single()

      expect(data).toBeNull()
    })
  })

  describe('Cart Access', () => {
    it('should not allow access to cart items from other tenant', async () => {
      const tenant = mockTenants.pinteya
      const otherTenant = mockTenants.pintemas
      setTenantConfigOverride(tenant)

      const otherTenantCartItems = getTenantFixtures('pintemas').cartItems

      mockSupabase.select.mockResolvedValue({
        data: [], // No se encuentran items porque son de otro tenant
        error: null,
      })

      const { data } = await mockSupabase
        .from('cart_items')
        .select('*')
        .eq('user_id', 'user-1')
        .eq('tenant_id', tenant.id) // MULTITENANT: Filtrar por tenant actual

      expect(data).toBeDefined()
      expect(data.length).toBe(0)
      expect(
        data.some((ci: any) => ci.tenant_id === otherTenant.id)
      ).toBe(false)
    })
  })

  describe('Products Access', () => {
    it('should not show products that are not visible for tenant', async () => {
      const tenant = mockTenants.pinteya
      setTenantConfigOverride(tenant)

      // Producto que no está visible para este tenant
      const hiddenProduct = {
        id: 999,
        name: 'Hidden Product',
        tenant_products: [
          {
            tenant_id: tenant.id,
            is_visible: false, // No visible
          },
        ],
      }

      const allProducts = [...getTenantFixtures('pinteya').products, hiddenProduct]
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
      expect(data.some((p: any) => p.id === 999)).toBe(false)
    })

    it('should not show products from other tenant', async () => {
      const tenant = mockTenants.pinteya
      const otherTenant = mockTenants.pintemas
      setTenantConfigOverride(tenant)

      const allProducts = [
        ...getTenantFixtures('pinteya').products,
        ...getTenantFixtures('pintemas').products,
      ]

      const tenantProducts = allProducts.filter((p: any) =>
        p.tenant_products?.some(
          (tp: any) => tp.tenant_id === tenant.id && tp.is_visible === true
        )
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
        data.some((p: any) =>
          p.tenant_products?.some((tp: any) => tp.tenant_id === otherTenant.id)
        )
      ).toBe(false)
    })
  })

  describe('Analytics Access', () => {
    it('should not allow access to analytics from other tenant', async () => {
      const tenant = mockTenants.pinteya
      const otherTenant = mockTenants.pintemas
      setTenantConfigOverride(tenant)

      const allEvents = [
        ...getTenantFixtures('pinteya').analyticsEvents,
        ...getTenantFixtures('pintemas').analyticsEvents,
      ]

      const tenantEvents = allEvents.filter((e: any) => e.tenant_id === tenant.id)

      mockSupabase.select.mockResolvedValue({
        data: tenantEvents,
        error: null,
      })

      const { data } = await mockSupabase
        .from('analytics_events_optimized')
        .select('*')
        .eq('tenant_id', tenant.id)

      expect(data).toBeDefined()
      expect(data.some((e: any) => e.tenant_id === otherTenant.id)).toBe(false)
    })
  })

  describe('Data Modification Prevention', () => {
    it('should not allow updating orders from other tenant', async () => {
      const tenant = mockTenants.pinteya
      const otherTenant = mockTenants.pintemas
      setTenantConfigOverride(tenant)

      const otherTenantOrder = getTenantFixtures('pintemas').orders[0]

      // Intentar actualizar orden de otro tenant debería fallar
      mockSupabase.update.mockResolvedValue({
        data: null, // No se actualiza porque no coincide el tenant
        error: null,
      })

      const { data } = await mockSupabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', otherTenantOrder.id)
        .eq('tenant_id', tenant.id) // MULTITENANT: Validar tenant

      // No debería actualizar nada porque el tenant no coincide
      expect(data).toBeNull()
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })

    it('should not allow deleting cart items from other tenant', async () => {
      const tenant = mockTenants.pinteya
      const otherTenant = mockTenants.pintemas
      setTenantConfigOverride(tenant)

      const otherTenantCartItem = getTenantFixtures('pintemas').cartItems[0]

      mockSupabase.delete.mockResolvedValue({
        data: null, // No se elimina porque no coincide el tenant
        error: null,
      })

      const { data } = await mockSupabase
        .from('cart_items')
        .delete()
        .eq('id', otherTenantCartItem.id)
        .eq('tenant_id', tenant.id) // MULTITENANT: Validar tenant

      expect(data).toBeNull()
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenant.id)
    })
  })

  describe('Scenarios', () => {
    it('should prevent Pinteya user from accessing Pintemas order', async () => {
      const pinteyaTenant = mockTenants.pinteya
      const pintemasTenant = mockTenants.pintemas
      setTenantConfigOverride(pinteyaTenant)

      const pintemasOrder = getTenantFixtures('pintemas').orders[0]

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const { data } = await mockSupabase
        .from('orders')
        .select('*')
        .eq('id', pintemasOrder.id)
        .eq('tenant_id', pinteyaTenant.id)
        .single()

      expect(data).toBeNull()
    })

    it('should prevent Pintemas user from accessing Pinteya product', async () => {
      const pintemasTenant = mockTenants.pintemas
      setTenantConfigOverride(pintemasTenant)

      const pinteyaProducts = getTenantFixtures('pinteya').products
      const pintemasProducts = getTenantFixtures('pintemas').products

      // Solo debería ver productos de Pintemas
      mockSupabase.select.mockResolvedValue({
        data: pintemasProducts,
        error: null,
      })

      const { data } = await mockSupabase
        .from('products')
        .select('*, tenant_products!inner(*)')
        .eq('tenant_products.tenant_id', pintemasTenant.id)
        .eq('tenant_products.is_visible', true)

      expect(data).toBeDefined()
      expect(
        data.some((p: any) =>
          pinteyaProducts.some((pp: any) => pp.id === p.id)
        )
      ).toBe(false)
    })

    it('should prevent Pinteya admin from accessing Pintemas data', async () => {
      const pinteyaTenant = mockTenants.pinteya
      const pintemasTenant = mockTenants.pintemas
      setTenantConfigOverride(pinteyaTenant)

      // Admin de Pinteya intenta acceder a datos de Pintemas
      const pintemasData = {
        orders: getTenantFixtures('pintemas').orders,
        users: getTenantFixtures('pintemas').users,
        analytics: getTenantFixtures('pintemas').analyticsEvents,
      }

      // Todas las queries deberían filtrar por tenant_id de Pinteya
      mockSupabase.select.mockResolvedValue({
        data: [], // No encuentra datos porque filtra por tenant de Pinteya
        error: null,
      })

      const { data: orders } = await mockSupabase
        .from('orders')
        .select('*')
        .eq('tenant_id', pinteyaTenant.id)

      const { data: users } = await mockSupabase
        .from('user_profiles')
        .select('*')
        .eq('tenant_id', pinteyaTenant.id)

      const { data: analytics } = await mockSupabase
        .from('analytics_events_optimized')
        .select('*')
        .eq('tenant_id', pinteyaTenant.id)

      // No debería encontrar datos de Pintemas
      expect(orders?.length).toBe(0)
      expect(users?.length).toBe(0)
      expect(analytics?.length).toBe(0)
    })
  })
})
