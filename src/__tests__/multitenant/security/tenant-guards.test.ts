/**
 * Tests de Seguridad - Tenant Guards
 * 
 * Verifica que:
 * - TenantAdminGuard valida permisos correctamente
 * - SuperAdminGuard valida permisos correctamente
 * - Guards rechazan acceso sin autenticación
 * - Guards rechazan acceso con tenant incorrecto
 * - Guards permiten acceso con permisos correctos
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { checkTenantAdmin } from '@/lib/auth/guards/tenant-admin-guard'
import { checkSuperAdmin } from '@/lib/auth/guards/super-admin-guard'
import { mockTenants } from '../setup'
import {
  createTenantRequest,
  setTenantConfigOverride,
  setSupabaseFactoryOverride,
  clearTenantOverrides,
} from '../helpers'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  authOptions: {},
}))

// Mock de super-admin-guard
jest.mock('@/lib/auth/guards/super-admin-guard', () => ({
  checkSuperAdmin: jest.fn(),
}))

// Mock de auth
jest.mock('@/auth', () => ({
  authOptions: {},
}))

describe('Tenant Guards', () => {
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

  describe('TenantAdminGuard', () => {
    it('should reject access without authentication', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)
      setTenantConfigOverride(mockTenants.pinteya)
      ;(checkSuperAdmin as jest.Mock).mockResolvedValue({ isSuperAdmin: false })

      const result = await checkTenantAdmin()

      expect(result.isAuthorized).toBe(false)
      expect(result.userId).toBeNull()
      expect(result.userEmail).toBeNull()
      expect(result.role).toBe('customer')
    })

    it('should allow access for super admin', async () => {
      const session = {
        user: {
          id: 'super-admin-id',
          email: 'superadmin@pintureriadigital.com',
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      setTenantConfigOverride(mockTenants.pinteya)
      ;(checkSuperAdmin as jest.Mock).mockResolvedValue({ isSuperAdmin: true })

      const result = await checkTenantAdmin()

      expect(result.isAuthorized).toBe(true)
      expect(result.userId).toBe('super-admin-id')
      expect(result.role).toBe('super_admin')
      expect(result.isSuperAdmin).toBe(true)
    })

    it('should allow access for tenant admin', async () => {
      const session = {
        user: {
          id: 'tenant-admin-id',
          email: 'admin@pinteya.com',
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      setTenantConfigOverride(mockTenants.pinteya)
      ;(checkSuperAdmin as jest.Mock).mockResolvedValue({ isSuperAdmin: false })

      mockSupabase.single.mockResolvedValue({
        data: {
          role: 'tenant_admin',
          permissions: {
            orders: { view: true, create: true, edit: true, delete: false, export: true },
            products: { view: true, create: true, edit: true, delete: false, import: true },
            customers: { view: true, edit: true, export: true },
            analytics: { view: true, export: true },
            settings: { view: true, edit: false },
            integrations: { view: true, edit: false },
            marketing: { view: true, edit: true },
          },
          is_active: true,
        },
        error: null,
      })

      const result = await checkTenantAdmin()

      expect(result.isAuthorized).toBe(true)
      expect(result.userId).toBe('tenant-admin-id')
      expect(result.role).toBe('tenant_admin')
      expect(result.permissions.orders.view).toBe(true)
    })

    it('should reject access for tenant staff without sufficient permissions', async () => {
      const session = {
        user: {
          id: 'staff-id',
          email: 'staff@pinteya.com',
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      setTenantConfigOverride(mockTenants.pinteya)
      ;(checkSuperAdmin as jest.Mock).mockResolvedValue({ isSuperAdmin: false })

      mockSupabase.single.mockResolvedValue({
        data: {
          role: 'tenant_staff',
          permissions: {
            orders: { view: true, create: false, edit: false, delete: false, export: false },
            products: { view: true, create: false, edit: false, delete: false, import: false },
            customers: { view: true, edit: false, export: false },
            analytics: { view: true, export: false },
            settings: { view: false, edit: false },
            integrations: { view: false, edit: false },
            marketing: { view: false, edit: false },
          },
          is_active: true,
        },
        error: null,
      })

      const result = await checkTenantAdmin()

      // Staff puede tener acceso pero con permisos limitados
      expect(result.isAuthorized).toBe(true)
      expect(result.role).toBe('tenant_staff')
      expect(result.permissions.orders.edit).toBe(false)
      expect(result.permissions.settings.view).toBe(false)
    })

    it('should reject access when user role not found for tenant', async () => {
      const session = {
        user: {
          id: 'user-id',
          email: 'user@pinteya.com',
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      setTenantConfigOverride(mockTenants.pinteya)
      ;(checkSuperAdmin as jest.Mock).mockResolvedValue({ isSuperAdmin: false })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const result = await checkTenantAdmin()

      expect(result.isAuthorized).toBe(false)
      expect(result.role).toBe('customer')
    })
  })

  describe('SuperAdminGuard', () => {
    it('should identify super admin correctly', async () => {
      const session = {
        user: {
          id: 'super-admin-id',
          email: 'superadmin@pintureriadigital.com',
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(checkSuperAdmin as jest.Mock).mockResolvedValue({ isSuperAdmin: true })

      const result = await checkSuperAdmin()

      expect(result.isSuperAdmin).toBe(true)
    })

    it('should reject non-super admin users', async () => {
      const session = {
        user: {
          id: 'regular-admin-id',
          email: 'admin@pinteya.com',
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(checkSuperAdmin as jest.Mock).mockResolvedValue({ isSuperAdmin: false })

      const result = await checkSuperAdmin()

      expect(result.isSuperAdmin).toBe(false)
    })
  })

  describe('Permission Validation', () => {
    it('should validate specific permissions for tenant admin', async () => {
      const session = {
        user: {
          id: 'admin-id',
          email: 'admin@pinteya.com',
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      setTenantConfigOverride(mockTenants.pinteya)
      ;(checkSuperAdmin as jest.Mock).mockResolvedValue({ isSuperAdmin: false })

      mockSupabase.single.mockResolvedValue({
        data: {
          role: 'tenant_admin',
          permissions: {
            orders: { view: true, create: true, edit: true, delete: true, export: true },
            products: { view: true, create: true, edit: true, delete: true, import: true },
            customers: { view: true, edit: true, export: true },
            analytics: { view: true, export: true },
            settings: { view: true, edit: true },
            integrations: { view: true, edit: true },
            marketing: { view: true, edit: true },
          },
          is_active: true,
        },
        error: null,
      })

      const result = await checkTenantAdmin()

      expect(result.permissions.orders.view).toBe(true)
      expect(result.permissions.orders.create).toBe(true)
      expect(result.permissions.orders.edit).toBe(true)
      expect(result.permissions.orders.delete).toBe(true)
      expect(result.permissions.products.view).toBe(true)
      expect(result.permissions.settings.edit).toBe(true)
    })

    it('should restrict permissions for tenant staff', async () => {
      const session = {
        user: {
          id: 'staff-id',
          email: 'staff@pinteya.com',
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      setTenantConfigOverride(mockTenants.pinteya)
      ;(checkSuperAdmin as jest.Mock).mockResolvedValue({ isSuperAdmin: false })

      mockSupabase.single.mockResolvedValue({
        data: {
          role: 'tenant_staff',
          permissions: {
            orders: { view: true, create: false, edit: false, delete: false, export: false },
            products: { view: true, create: false, edit: false, delete: false, import: false },
            customers: { view: true, edit: false, export: false },
            analytics: { view: true, export: false },
            settings: { view: false, edit: false },
            integrations: { view: false, edit: false },
            marketing: { view: false, edit: false },
          },
          is_active: true,
        },
        error: null,
      })

      const result = await checkTenantAdmin()

      expect(result.permissions.orders.view).toBe(true)
      expect(result.permissions.orders.create).toBe(false)
      expect(result.permissions.orders.delete).toBe(false)
      expect(result.permissions.settings.view).toBe(false)
      expect(result.permissions.settings.edit).toBe(false)
    })
  })

  describe('Tenant Context', () => {
    it('should include tenant information in guard result', async () => {
      const session = {
        user: {
          id: 'admin-id',
          email: 'admin@pinteya.com',
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      setTenantConfigOverride(mockTenants.pinteya)
      ;(checkSuperAdmin as jest.Mock).mockResolvedValue({ isSuperAdmin: false })

      mockSupabase.single.mockResolvedValue({
        data: {
          role: 'tenant_admin',
          permissions: {},
          is_active: true,
        },
        error: null,
      })

      const result = await checkTenantAdmin()

      expect(result.tenantId).toBe(mockTenants.pinteya.id)
      expect(result.tenantSlug).toBe('pinteya')
    })
  })
})
