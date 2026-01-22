/**
 * Helpers para Tests Multitenant
 * Funciones utilitarias para crear mocks y datos de prueba
 */

import { NextRequest } from 'next/server'
import type { TenantConfig, TenantPublicConfig } from '@/lib/tenant/types'
import { mockTenants, extractPublicConfig } from './setup'

/**
 * Crea un NextRequest mock con headers de tenant
 */
export function createTenantRequest(
  tenantSlug: string,
  options?: {
    host?: string
    path?: string
    method?: string
  }
): NextRequest {
  const tenant = mockTenants[tenantSlug]
  if (!tenant) {
    throw new Error(`Tenant ${tenantSlug} not found in mockTenants`)
  }

  const host = options?.host || 
    (tenant.customDomain || `${tenant.subdomain}.pintureriadigital.com`)
  const path = options?.path || '/'
  const method = options?.method || 'GET'

  const url = `https://${host}${path}`
  const request = new NextRequest(url, {
    method,
    headers: {
      host,
      'x-tenant-domain': host,
      'x-tenant-subdomain': tenant.subdomain || '',
      ...(tenant.customDomain && { 'x-tenant-custom-domain': tenant.customDomain }),
    },
  })

  return request
}

/**
 * Override global para getTenantConfig (tests que usan implementación real).
 */
export function setTenantConfigOverride(tenant: TenantConfig | Record<string, unknown>): void {
  ;(globalThis as { __TENANT_TEST_GET_CONFIG__?: () => Promise<TenantConfig> }).__TENANT_TEST_GET_CONFIG__ =
    async () => tenant as TenantConfig
}

/**
 * Override global para getTenantPublicConfig.
 */
export function setTenantPublicConfigOverride(config: TenantPublicConfig): void {
  ;(globalThis as { __TENANT_TEST_GET_PUBLIC_CONFIG__?: () => Promise<TenantPublicConfig> }).__TENANT_TEST_GET_PUBLIC_CONFIG__ =
    async () => config
}

/**
 * Override global para createAdminClient (tests integración/seguridad).
 */
export function setSupabaseFactoryOverride(factory: () => unknown): void {
  ;(globalThis as { __TENANT_TEST_SUPABASE_FACTORY__?: () => unknown }).__TENANT_TEST_SUPABASE_FACTORY__ =
    factory
}

/**
 * Limpia overrides globales de tenant y Supabase (llamar en afterEach).
 */
export function clearTenantOverrides(): void {
  delete (globalThis as { __TENANT_TEST_GET_CONFIG__?: unknown }).__TENANT_TEST_GET_CONFIG__
  delete (globalThis as { __TENANT_TEST_GET_PUBLIC_CONFIG__?: unknown }).__TENANT_TEST_GET_PUBLIC_CONFIG__
  delete (globalThis as { __TENANT_TEST_IS_ADMIN_REQUEST__?: unknown }).__TENANT_TEST_IS_ADMIN_REQUEST__
  delete (globalThis as { __TENANT_TEST_SUPABASE_FACTORY__?: unknown }).__TENANT_TEST_SUPABASE_FACTORY__
}

/** @deprecated Use setTenantConfigOverride(tenant) instead */
export function mockTenantConfig(tenantSlug: string, _mockFn?: jest.Mock): void {
  const tenant = mockTenants[tenantSlug]
  if (!tenant) throw new Error(`Tenant ${tenantSlug} not found in mockTenants`)
  setTenantConfigOverride(tenant)
}

/** @deprecated Use setTenantPublicConfigOverride(extractPublicConfig(tenant)) instead */
export function mockTenantPublicConfig(tenantSlug: string, _mockFn?: jest.Mock): void {
  const tenant = mockTenants[tenantSlug]
  if (!tenant) throw new Error(`Tenant ${tenantSlug} not found in mockTenants`)
  setTenantPublicConfigOverride(extractPublicConfig(tenant))
}

/**
 * Crea datos de prueba para un tenant específico
 */
export function createTenantData(tenantId: string) {
  const tenant = Object.values(mockTenants).find(t => t.id === tenantId)
  if (!tenant) {
    throw new Error(`Tenant with id ${tenantId} not found`)
  }

  return {
    orders: [
      {
        id: `order-1-${tenantId}`,
        tenant_id: tenantId,
        user_id: `user-1-${tenantId}`,
        total: 10000,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      {
        id: `order-2-${tenantId}`,
        tenant_id: tenantId,
        user_id: `user-2-${tenantId}`,
        total: 20000,
        status: 'completed',
        created_at: new Date().toISOString(),
      },
    ],
    products: [
      {
        id: 1,
        name: 'Producto 1',
        price: 5000,
        stock: 10,
        tenant_products: [
          {
            tenant_id: tenantId,
            product_id: 1,
            price: 5000,
            stock: 10,
            is_visible: true,
            is_featured: false,
          },
        ],
      },
      {
        id: 2,
        name: 'Producto 2',
        price: 8000,
        stock: 5,
        tenant_products: [
          {
            tenant_id: tenantId,
            product_id: 2,
            price: 8000,
            stock: 5,
            is_visible: true,
            is_featured: true,
          },
        ],
      },
    ],
    users: [
      {
        id: `user-1-${tenantId}`,
        tenant_id: tenantId,
        email: `user1@${tenant.slug}.com`,
        first_name: 'Usuario',
        last_name: 'Uno',
      },
      {
        id: `user-2-${tenantId}`,
        tenant_id: tenantId,
        email: `user2@${tenant.slug}.com`,
        first_name: 'Usuario',
        last_name: 'Dos',
      },
    ],
    cartItems: [
      {
        id: `cart-1-${tenantId}`,
        tenant_id: tenantId,
        user_id: `user-1-${tenantId}`,
        product_id: 1,
        quantity: 2,
      },
    ],
    analyticsEvents: [
      {
        id: `event-1-${tenantId}`,
        tenant_id: tenantId,
        event_type: 'page_view',
        created_at: new Date().toISOString(),
      },
    ],
  }
}

/**
 * Crea un mock de Supabase client con datos de tenant
 */
export function createMockSupabaseClient(tenantId: string) {
  const tenantData = createTenantData(tenantId)
  
  const mockClient = {
    from: jest.fn((table: string) => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn(),
      }

      // Mock de respuestas según la tabla
      if (table === 'orders') {
        mockQuery.select.mockResolvedValue({
          data: tenantData.orders,
          error: null,
        })
        mockQuery.single.mockResolvedValue({
          data: tenantData.orders[0],
          error: null,
        })
      } else if (table === 'products') {
        mockQuery.select.mockResolvedValue({
          data: tenantData.products,
          error: null,
        })
      } else if (table === 'user_profiles') {
        mockQuery.select.mockResolvedValue({
          data: tenantData.users,
          error: null,
        })
        mockQuery.single.mockResolvedValue({
          data: tenantData.users[0],
          error: null,
        })
      } else if (table === 'cart_items') {
        mockQuery.select.mockResolvedValue({
          data: tenantData.cartItems,
          error: null,
        })
      } else if (table === 'analytics_events_optimized') {
        mockQuery.select.mockResolvedValue({
          data: tenantData.analyticsEvents,
          error: null,
        })
      }

      return mockQuery
    }),
    rpc: jest.fn(),
  }

  return mockClient
}

/**
 * Verifica que una query de Supabase filtra por tenant_id
 */
export function expectTenantFilter(
  queryMock: jest.Mock,
  tenantId: string,
  callIndex: number = 0
): void {
  const calls = queryMock.mock.calls
  const eqCalls = calls.filter((call) => call[0] === 'tenant_id')
  
  expect(eqCalls.length).toBeGreaterThan(0)
  expect(eqCalls[callIndex]).toEqual(['tenant_id', tenantId])
}

/**
 * Crea headers mock para Next.js
 */
export function createMockHeaders(tenantSlug: string): Headers {
  const tenant = mockTenants[tenantSlug]
  if (!tenant) {
    throw new Error(`Tenant ${tenantSlug} not found in mockTenants`)
  }

  const host = tenant.customDomain || `${tenant.subdomain}.pintureriadigital.com`
  const headers = new Headers()
  headers.set('host', host)
  headers.set('x-tenant-domain', host)
  if (tenant.subdomain) {
    headers.set('x-tenant-subdomain', tenant.subdomain)
  }
  if (tenant.customDomain) {
    headers.set('x-tenant-custom-domain', tenant.customDomain)
  }

  return headers
}
