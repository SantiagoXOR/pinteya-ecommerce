'use client'

// =====================================================
// TENANT CONTEXT
// Descripción: Context y Provider para acceder a la
// configuración del tenant en componentes cliente
// =====================================================

import { createContext, useContext, type ReactNode } from 'react'
import type { TenantPublicConfig } from '@/lib/tenant/types'

// ============================================================================
// CONTEXT
// ============================================================================

const TenantContext = createContext<TenantPublicConfig | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

interface TenantProviderProps {
  tenant: TenantPublicConfig
  children: ReactNode
}

/**
 * Provider para hacer disponible la configuración del tenant
 * en todos los componentes cliente
 */
export function TenantProvider({ tenant, children }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  )
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para acceder a la configuración del tenant
 * @throws Error si se usa fuera del TenantProvider
 */
export function useTenant(): TenantPublicConfig {
  const context = useContext(TenantContext)
  
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  
  return context
}

/**
 * Hook para acceder a la configuración del tenant
 * Versión segura que no lanza error si no hay provider
 */
export function useTenantSafe(): TenantPublicConfig | null {
  return useContext(TenantContext)
}

/**
 * Hook para obtener los colores del tema del tenant
 */
export function useTenantTheme() {
  const tenant = useTenant()
  
  return {
    primaryColor: tenant.primaryColor,
    primaryDark: tenant.primaryDark,
    primaryLight: tenant.primaryLight,
    secondaryColor: tenant.secondaryColor,
    accentColor: tenant.accentColor,
    backgroundGradientStart: tenant.backgroundGradientStart,
    backgroundGradientEnd: tenant.backgroundGradientEnd,
    headerBgColor: tenant.headerBgColor,
    borderRadius: tenant.themeConfig.borderRadius,
    fontFamily: tenant.themeConfig.fontFamily,
  }
}

/**
 * Hook para obtener los assets del tenant
 */
export function useTenantAssets() {
  const tenant = useTenant()
  
  return {
    logo: tenant.logoUrl || `/tenants/${tenant.slug}/logo.svg`,
    logoDark: tenant.logoDarkUrl || `/tenants/${tenant.slug}/logo-dark.svg`,
    favicon: tenant.faviconUrl || `/tenants/${tenant.slug}/favicon.svg`,
    ogImage: tenant.ogImageUrl || `/tenants/${tenant.slug}/og-image.png`,
    heroImage: (index: number) => `/tenants/${tenant.slug}/hero/hero${index}.webp`,
    promoBanner: `/tenants/${tenant.slug}/hero/promo-banner.webp`,
    shippingIcon: `/tenants/${tenant.slug}/icons/icon-envio.svg`,
  }
}

/**
 * Hook para obtener la configuración de analytics del tenant
 */
export function useTenantAnalytics() {
  const tenant = useTenant()
  
  return {
    ga4MeasurementId: tenant.ga4MeasurementId,
    metaPixelId: tenant.metaPixelId,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
  }
}

/**
 * Hook para obtener la configuración de contacto del tenant
 */
export function useTenantContact() {
  const tenant = useTenant()
  
  return {
    whatsappNumber: tenant.whatsappNumber,
    whatsappMessageTemplate: tenant.whatsappMessageTemplate,
    phone: tenant.contactPhone,
    address: tenant.contactAddress,
    city: tenant.contactCity,
    province: tenant.contactProvince,
    socialLinks: tenant.socialLinks,
    businessHours: tenant.businessHours,
  }
}

/**
 * Hook para obtener la configuración SEO del tenant
 */
export function useTenantSEO() {
  const tenant = useTenant()
  
  return {
    title: tenant.siteTitle,
    description: tenant.siteDescription,
    keywords: tenant.siteKeywords,
    ogImage: tenant.ogImageUrl,
    name: tenant.name,
    currency: tenant.currency,
    locale: tenant.locale,
  }
}
