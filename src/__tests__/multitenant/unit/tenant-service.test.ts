/**
 * Tests Unitarios - Tenant Service
 *
 * Verifica:
 * - getTenantBySlug() obtiene tenant por slug
 * - getTenantById() obtiene tenant por ID
 * - getAllTenants() lista todos los tenants activos
 * - getTenantBaseUrl() genera URL base correcta
 *
 * Usa global __TENANT_TEST_SUPABASE_FACTORY__ (get-admin-client) para inyectar mock.
 * 
 * IMPORTANTE: El mock se configura ANTES de los imports para asegurar que
 * el módulo real no se ejecute antes de que el mock esté listo.
 */

// Mock de react cache antes de cualquier import
jest.mock('react', () => {
  const actual = jest.requireActual('react') as typeof import('react')
  return {
    ...actual,
    cache: (fn: unknown) => fn,
  }
})

jest.mock('next/headers')

// Referencia compartida para el mock factory
const GLOBAL_FACTORY_KEY = '__TENANT_TEST_SUPABASE_FACTORY__' as const
type GlobalWithFactory = typeof globalThis & {
  [K in typeof GLOBAL_FACTORY_KEY]?: () => unknown
}

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  getTenantBySlug,
  getTenantById,
  getAllTenants,
  getTenantBaseUrl,
} from '@/lib/tenant'
import { mockTenants, configToDBRow } from '../setup-data'

describe('Tenant Service', () => {
  /**
   * Crea un mock de Supabase con la cadena de métodos correcta.
   * Asegura que single() retorne una Promise con estructura { data, error }.
   */
  const createMockSupabase = () => {
    const chain = {
      from: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
      order: jest.fn(),
    }
    // Configurar cadena de métodos
    chain.from.mockReturnValue(chain)
    chain.select.mockReturnValue(chain)
    chain.eq.mockReturnValue(chain)
    chain.order.mockReturnValue(chain)
    // Asegurar que single() retorne una Promise
    chain.single.mockResolvedValue({ data: null, error: null })
    return chain
  }

  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    jest.clearAllMocks()
    // Crear nuevo mock para cada test
    mockSupabase = createMockSupabase()
    // Configurar el global factory para que get-admin-client lo use
    // Esto debe hacerse ANTES de que se llame a createAdminClient
    ;(globalThis as GlobalWithFactory)[GLOBAL_FACTORY_KEY] = () => mockSupabase
  })

  afterEach(() => {
    // Limpiar el global factory después de cada test
    delete (globalThis as GlobalWithFactory)[GLOBAL_FACTORY_KEY]
  })

  describe('getTenantBySlug', () => {
    it('should get tenant by slug', async () => {
      const dbRow = configToDBRow(mockTenants.pinteya)
      mockSupabase.single.mockResolvedValue({
        data: dbRow,
        error: null,
      })

      const tenant = await getTenantBySlug('pinteya')

      expect(tenant).toBeDefined()
      expect(tenant).not.toBeNull()
      expect(tenant?.slug).toBe('pinteya')
      expect(tenant?.name).toBe('Pinteya')
      expect(tenant?.id).toBe(mockTenants.pinteya.id)
      expect(mockSupabase.from).toHaveBeenCalledWith('tenants')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('slug', 'pinteya')
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('should return null when tenant not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const tenant = await getTenantBySlug('nonexistent')

      expect(tenant).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('tenants')
    })
  })

  describe('getTenantById', () => {
    it('should get tenant by ID', async () => {
      const dbRow = configToDBRow(mockTenants.pinteya)
      mockSupabase.single.mockResolvedValue({
        data: dbRow,
        error: null,
      })

      const tenant = await getTenantById(mockTenants.pinteya.id)

      expect(tenant).toBeDefined()
      expect(tenant).not.toBeNull()
      expect(tenant?.id).toBe(mockTenants.pinteya.id)
      expect(tenant?.slug).toBe('pinteya')
      expect(mockSupabase.from).toHaveBeenCalledWith('tenants')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockTenants.pinteya.id)
    })

    it('should return null when tenant not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const tenant = await getTenantById('nonexistent-id')

      expect(tenant).toBeNull()
    })
  })

  describe('getAllTenants', () => {
    it('should get all active tenants', async () => {
      const allTenants = [
        configToDBRow(mockTenants.pinteya),
        configToDBRow(mockTenants.pintemas),
      ]
      mockSupabase.order.mockResolvedValue({
        data: allTenants,
        error: null,
      })

      const tenants = await getAllTenants()

      expect(tenants).toBeDefined()
      expect(tenants.length).toBe(2)
      expect(tenants[0].slug).toBe('pinteya')
      expect(tenants[1].slug).toBe('pintemas')
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabase.order).toHaveBeenCalledWith('name')
    })

    it('should return empty array on error', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const tenants = await getAllTenants()

      expect(tenants).toEqual([])
    })
  })

  describe('getTenantBaseUrl', () => {
    it('should generate URL with custom domain', () => {
      const url = getTenantBaseUrl(mockTenants.pinteya)
      expect(url).toBe('https://www.pinteya.com')
    })

    it('should generate URL with subdomain', () => {
      const tenantWithoutCustom = { ...mockTenants.pinteya, customDomain: null }
      const url = getTenantBaseUrl(tenantWithoutCustom)
      expect(url).toBe('https://pinteya.pintureriadigital.com')
    })

    it('should generate URL with platform domain as fallback', () => {
      const tenantWithoutBoth = {
        ...mockTenants.pinteya,
        customDomain: null,
        subdomain: null,
      }
      const url = getTenantBaseUrl(tenantWithoutBoth)
      expect(url).toBe('https://pintureriadigital.com')
    })
  })
})
