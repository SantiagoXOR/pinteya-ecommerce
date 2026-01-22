/**
 * Tests Unitarios - Tenant Context
 * 
 * Verifica:
 * - TenantProvider provee configuración correctamente
 * - useTenant() retorna configuración del tenant
 * - useTenant() lanza error si se usa fuera del provider
 * - useTenantSafe() retorna null si no hay provider
 * - useTenantTheme() retorna colores del tema
 * - useTenantAssets() retorna paths de assets
 * - useTenantAnalytics() retorna configuración de analytics
 * - useTenantContact() retorna información de contacto
 * - useTenantSEO() retorna configuración SEO
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, renderHook } from '@testing-library/react'
import React from 'react'
import {
  TenantProvider,
  useTenant,
  useTenantSafe,
  useTenantTheme,
  useTenantAssets,
  useTenantAnalytics,
  useTenantContact,
  useTenantSEO,
} from '@/contexts/TenantContext'
import { extractPublicConfig, mockTenants } from '../setup'

describe('Tenant Context', () => {
  const pinteyaPublic = extractPublicConfig(mockTenants.pinteya)

  describe('TenantProvider', () => {
    it('should provide tenant config to children', () => {
      const TestComponent = () => {
        const tenant = useTenant()
        return <div data-testid="tenant-name">{tenant.name}</div>
      }

      const { getByTestId } = render(
        <TenantProvider tenant={pinteyaPublic}>
          <TestComponent />
        </TenantProvider>
      )

      expect(getByTestId('tenant-name').textContent).toBe('Pinteya')
    })
  })

  describe('useTenant', () => {
    it('should return tenant config when inside provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider tenant={pinteyaPublic}>{children}</TenantProvider>
      )

      const { result } = renderHook(() => useTenant(), { wrapper })

      expect(result.current).toBeDefined()
      expect(result.current.slug).toBe('pinteya')
      expect(result.current.name).toBe('Pinteya')
    })

    it('should throw error when used outside provider', () => {
      // Suprimir console.error para este test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useTenant())
      }).toThrow('useTenant must be used within a TenantProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('useTenantSafe', () => {
    it('should return tenant config when inside provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider tenant={pinteyaPublic}>{children}</TenantProvider>
      )

      const { result } = renderHook(() => useTenantSafe(), { wrapper })

      expect(result.current).toBeDefined()
      expect(result.current?.slug).toBe('pinteya')
    })

    it('should return null when used outside provider', () => {
      const { result } = renderHook(() => useTenantSafe())

      expect(result.current).toBeNull()
    })
  })

  describe('useTenantTheme', () => {
    it('should return theme colors', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider tenant={pinteyaPublic}>{children}</TenantProvider>
      )

      const { result } = renderHook(() => useTenantTheme(), { wrapper })

      expect(result.current.primaryColor).toBe('#f27a1d')
      expect(result.current.primaryDark).toBe('#bd4811')
      expect(result.current.primaryLight).toBe('#f9be78')
      expect(result.current.secondaryColor).toBe('#00f269')
      expect(result.current.accentColor).toBe('#f9a007')
      expect(result.current.headerBgColor).toBe('#bd4811')
      expect(result.current.borderRadius).toBe('0.5rem')
      expect(result.current.fontFamily).toBe('Plus Jakarta Sans')
    })
  })

  describe('useTenantAssets', () => {
    it('should return asset paths', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider tenant={pinteyaPublic}>{children}</TenantProvider>
      )

      const { result } = renderHook(() => useTenantAssets(), { wrapper })

      expect(result.current.logo).toBe('/tenants/pinteya/logo.svg')
      expect(result.current.logoDark).toBe('/tenants/pinteya/logo-dark.svg')
      expect(result.current.favicon).toBe('/tenants/pinteya/favicon.svg')
      expect(result.current.ogImage).toBe('/tenants/pinteya/og-image.png')
      expect(result.current.heroImage(1)).toBe('/tenants/pinteya/hero/hero1.webp')
      expect(result.current.promoBanner).toBe('/tenants/pinteya/hero/promo-banner.webp')
    })

    it('should use tenant logoUrl when available', () => {
      const tenantWithLogo = {
        ...pinteyaPublic,
        logoUrl: '/custom/logo.svg',
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider tenant={tenantWithLogo}>{children}</TenantProvider>
      )

      const { result } = renderHook(() => useTenantAssets(), { wrapper })

      expect(result.current.logo).toBe('/custom/logo.svg')
    })
  })

  describe('useTenantAnalytics', () => {
    it('should return analytics configuration', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider tenant={pinteyaPublic}>{children}</TenantProvider>
      )

      const { result } = renderHook(() => useTenantAnalytics(), { wrapper })

      expect(result.current.ga4MeasurementId).toBe('G-PINTEYA123')
      expect(result.current.metaPixelId).toBe('123456789012345')
      expect(result.current.tenantId).toBe(mockTenants.pinteya.id)
      expect(result.current.tenantSlug).toBe('pinteya')
    })
  })

  describe('useTenantContact', () => {
    it('should return contact information', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider tenant={pinteyaPublic}>{children}</TenantProvider>
      )

      const { result } = renderHook(() => useTenantContact(), { wrapper })

      expect(result.current.whatsappNumber).toBe('5493516323002')
      expect(result.current.phone).toBe('5493516323002')
      expect(result.current.address).toBe('Córdoba, Argentina')
      expect(result.current.city).toBe('Córdoba')
      expect(result.current.province).toBe('Córdoba')
      expect(result.current.socialLinks).toBeDefined()
      expect(result.current.businessHours).toBeDefined()
    })
  })

  describe('useTenantSEO', () => {
    it('should return SEO configuration', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider tenant={pinteyaPublic}>{children}</TenantProvider>
      )

      const { result } = renderHook(() => useTenantSEO(), { wrapper })

      expect(result.current.title).toBe('Pinteya - Tu Pinturería Online')
      expect(result.current.description).toBe(
        'Pinturería online especializada en productos de pintura profesional'
      )
      expect(result.current.keywords).toEqual(['pinturería', 'pintura', 'online', 'Córdoba'])
      expect(result.current.ogImage).toBe('/tenants/pinteya/og-image.png')
      expect(result.current.name).toBe('Pinteya')
      expect(result.current.currency).toBe('ARS')
      expect(result.current.locale).toBe('es_AR')
    })
  })
})
