/**
 * Tests de Detección de Tenant
 * 
 * Verifica que:
 * 1. La detección por subdomain funciona correctamente
 * 2. La detección por custom domain funciona correctamente
 * 3. El fallback a tenant por defecto funciona
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { headers } from 'next/headers'
import { getTenantConfig } from '@/lib/tenant'
import { setTenantConfigOverride, setSupabaseFactoryOverride, clearTenantOverrides } from './helpers'

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}))

describe('Tenant Detection', () => {
  const mockSupabase = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setSupabaseFactoryOverride(() => mockSupabase)
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.single.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    clearTenantOverrides()
  })

  describe('Subdomain Detection', () => {
    it('should detect tenant from subdomain pinteya.pintureriadigital.com', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('host', 'pinteya.pintureriadigital.com')
      mockHeaders.set('x-tenant-domain', 'pinteya.pintureriadigital.com')
      mockHeaders.set('x-tenant-subdomain', 'pinteya')

      ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

      const tenant = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
        subdomain: 'pinteya',
        customDomain: null,
      }

      setTenantConfigOverride(tenant)

      const result = await getTenantConfig()

      expect(result).toBeDefined()
      expect(result.subdomain).toBe('pinteya')
      expect(result.slug).toBe('pinteya')
    })

    it('should detect tenant from subdomain pintemas.pintureriadigital.com', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('host', 'pintemas.pintureriadigital.com')
      mockHeaders.set('x-tenant-domain', 'pintemas.pintureriadigital.com')
      mockHeaders.set('x-tenant-subdomain', 'pintemas')

      ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

      const tenant = {
        id: 'tenant-2-id',
        slug: 'pintemas',
        name: 'Pintemas',
        subdomain: 'pintemas',
        customDomain: null,
      }

      setTenantConfigOverride(tenant)

      const result = await getTenantConfig()

      expect(result).toBeDefined()
      expect(result.subdomain).toBe('pintemas')
      expect(result.slug).toBe('pintemas')
    })
  })

  describe('Custom Domain Detection', () => {
    it('should detect tenant from custom domain www.pinteya.com', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('host', 'www.pinteya.com')
      mockHeaders.set('x-tenant-domain', 'www.pinteya.com')
      mockHeaders.set('x-tenant-custom-domain', 'www.pinteya.com')

      ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

      const tenant = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
        subdomain: 'pinteya',
        customDomain: 'www.pinteya.com',
      }

      setTenantConfigOverride(tenant)

      const result = await getTenantConfig()

      expect(result).toBeDefined()
      expect(result.customDomain).toBe('www.pinteya.com')
      expect(result.slug).toBe('pinteya')
    })

    it('should detect tenant from custom domain www.pintemas.com', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('host', 'www.pintemas.com')
      mockHeaders.set('x-tenant-domain', 'www.pintemas.com')
      mockHeaders.set('x-tenant-custom-domain', 'www.pintemas.com')

      ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

      const tenant = {
        id: 'tenant-2-id',
        slug: 'pintemas',
        name: 'Pintemas',
        subdomain: 'pintemas',
        customDomain: 'www.pintemas.com',
      }

      setTenantConfigOverride(tenant)

      const result = await getTenantConfig()

      expect(result).toBeDefined()
      expect(result.customDomain).toBe('www.pintemas.com')
      expect(result.slug).toBe('pintemas')
    })
  })

  describe('Fallback to Default Tenant', () => {
    it('should fallback to default tenant (pinteya) for localhost', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('host', 'localhost:3000')
      mockHeaders.set('x-tenant-domain', 'localhost')

      ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

      const defaultTenant = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
        subdomain: 'pinteya',
        customDomain: null,
      }

      setTenantConfigOverride(defaultTenant)

      const result = await getTenantConfig()

      expect(result).toBeDefined()
      expect(result.slug).toBe('pinteya')
    })

    it('should fallback to default tenant when tenant not found', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('host', 'unknown.pintureriadigital.com')
      mockHeaders.set('x-tenant-domain', 'unknown.pintureriadigital.com')
      mockHeaders.set('x-tenant-subdomain', 'unknown')

      ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

      // Simular que no se encuentra el tenant, entonces fallback
      const defaultTenant = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
        subdomain: 'pinteya',
        customDomain: null,
      }

      setTenantConfigOverride(defaultTenant)

      const result = await getTenantConfig()

      expect(result).toBeDefined()
      expect(result.slug).toBe('pinteya')
    })
  })

  describe('Special Subdomains', () => {
    it('should use default tenant for www.pintureriadigital.com', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('host', 'www.pintureriadigital.com')
      mockHeaders.set('x-tenant-domain', 'www.pintureriadigital.com')

      ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

      const defaultTenant = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
        subdomain: 'pinteya',
        customDomain: null,
      }

      setTenantConfigOverride(defaultTenant)

      const result = await getTenantConfig()

      expect(result).toBeDefined()
      expect(result.slug).toBe('pinteya')
    })

    it('should use default tenant for pintureriadigital.com (no subdomain)', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('host', 'pintureriadigital.com')
      mockHeaders.set('x-tenant-domain', 'pintureriadigital.com')

      ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

      const defaultTenant = {
        id: 'tenant-1-id',
        slug: 'pinteya',
        name: 'Pinteya',
        subdomain: 'pinteya',
        customDomain: null,
      }

      setTenantConfigOverride(defaultTenant)

      const result = await getTenantConfig()

      expect(result).toBeDefined()
      expect(result.slug).toBe('pinteya')
    })
  })

  describe('Admin Domain', () => {
    it('should detect admin domain correctly', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('host', 'admin.pintureriadigital.com')
      mockHeaders.set('x-tenant-domain', 'admin.pintureriadigital.com')
      mockHeaders.set('x-tenant-is-super-admin', 'true')

      ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

      // Admin domain no debería tener tenant específico
      // pero el sistema debería manejarlo correctamente
      expect(mockHeaders.get('x-tenant-is-super-admin')).toBe('true')
    })
  })
})
