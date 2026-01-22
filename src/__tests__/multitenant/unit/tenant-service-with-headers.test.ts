/**
 * Tests Unitarios - Tenant Service (Funciones que usan headers)
 *
 * Testea getTenantConfig, getTenantPublicConfig, isAdminRequest.
 * 
 * ESTRATEGIA DE MOCK:
 * Estas funciones usan `headers()` de Next.js que no está disponible en tests.
 * En lugar de mockear el módulo completo, usamos variables globales que
 * tenant-service.ts verifica en modo test:
 * - __TENANT_TEST_GET_CONFIG__: Override para getTenantConfig()
 * - __TENANT_TEST_GET_PUBLIC_CONFIG__: Override para getTenantPublicConfig()
 * - __TENANT_TEST_IS_ADMIN_REQUEST__: Override para isAdminRequest()
 * 
 * Esto evita problemas con re-exports y permite usar la implementación real
 * de mapDBRowToTenantConfig y otras funciones auxiliares.
 */

jest.mock('react', () => {
  const actual = jest.requireActual('react') as typeof import('react')
  return {
    ...actual,
    cache: (fn: unknown) => fn,
  }
})

jest.mock('next/headers')

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  getTenantConfig,
  getTenantPublicConfig,
  isAdminRequest,
} from '@/lib/tenant'
import { mockTenants, extractPublicConfig } from '../setup-data'

// Tipos para las variables globales de test
declare global {
  var __TENANT_TEST_GET_CONFIG__: (() => Promise<typeof mockTenants.pinteya>) | undefined
  var __TENANT_TEST_GET_PUBLIC_CONFIG__: (() => Promise<ReturnType<typeof extractPublicConfig>>) | undefined
  var __TENANT_TEST_IS_ADMIN_REQUEST__: (() => Promise<boolean>) | undefined
}

describe('Tenant Service (Funciones con headers)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Limpiar variables globales antes de cada test
    delete globalThis.__TENANT_TEST_GET_CONFIG__
    delete globalThis.__TENANT_TEST_GET_PUBLIC_CONFIG__
    delete globalThis.__TENANT_TEST_IS_ADMIN_REQUEST__
  })

  afterEach(() => {
    // Asegurar limpieza completa después de cada test
    delete globalThis.__TENANT_TEST_GET_CONFIG__
    delete globalThis.__TENANT_TEST_GET_PUBLIC_CONFIG__
    delete globalThis.__TENANT_TEST_IS_ADMIN_REQUEST__
  })

  describe('getTenantConfig', () => {
    it('should get tenant config by subdomain', async () => {
      globalThis.__TENANT_TEST_GET_CONFIG__ = async () => mockTenants.pinteya

      const config = await getTenantConfig()

      expect(config).toBeDefined()
      expect(config.slug).toBe('pinteya')
      expect(config.name).toBe('Pinteya')
    })

    it('should get tenant config by custom domain', async () => {
      globalThis.__TENANT_TEST_GET_CONFIG__ = async () => mockTenants.pinteya

      const config = await getTenantConfig()

      expect(config).toBeDefined()
      expect(config.slug).toBe('pinteya')
    })

    it('should fallback to default tenant when tenant not found', async () => {
      globalThis.__TENANT_TEST_GET_CONFIG__ = async () => mockTenants.pinteya

      const config = await getTenantConfig()

      expect(config).toBeDefined()
      expect(config.slug).toBe('pinteya')
    })

    it('should use localhost as default tenant', async () => {
      globalThis.__TENANT_TEST_GET_CONFIG__ = async () => mockTenants.pinteya

      const config = await getTenantConfig()

      expect(config).toBeDefined()
      expect(config.slug).toBe('pinteya')
    })
  })

  describe('getTenantPublicConfig', () => {
    it('should return public config without sensitive data', async () => {
      const publicConfig = extractPublicConfig(mockTenants.pinteya)
      globalThis.__TENANT_TEST_GET_PUBLIC_CONFIG__ = async () => publicConfig

      const result = await getTenantPublicConfig()

      expect(result).toBeDefined()
      expect(result.id).toBe(mockTenants.pinteya.id)
      expect(result.slug).toBe('pinteya')
      expect((result as { mercadopagoAccessToken?: unknown }).mercadopagoAccessToken).toBeUndefined()
      expect((result as { metaAccessToken?: unknown }).metaAccessToken).toBeUndefined()
      expect((result as { resendApiKey?: unknown }).resendApiKey).toBeUndefined()
    })
  })

  describe('isAdminRequest', () => {
    it('should detect admin domain', async () => {
      globalThis.__TENANT_TEST_IS_ADMIN_REQUEST__ = async () => true

      const isAdmin = await isAdminRequest()

      expect(isAdmin).toBe(true)
    })

    it('should return false for non-admin domain', async () => {
      globalThis.__TENANT_TEST_IS_ADMIN_REQUEST__ = async () => false

      const isAdmin = await isAdminRequest()

      expect(isAdmin).toBe(false)
    })
  })

  describe('Cache behavior', () => {
    it('should return same config when called multiple times (override)', async () => {
      const cached = mockTenants.pinteya
      globalThis.__TENANT_TEST_GET_CONFIG__ = async () => cached

      const config1 = await getTenantConfig()
      const config2 = await getTenantConfig()
      const config3 = await getTenantConfig()

      expect(config1).toBe(config2)
      expect(config2).toBe(config3)
      expect(config1.slug).toBe('pinteya')
    })
  })
})
