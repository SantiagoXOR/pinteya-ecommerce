'use client'

// =====================================================
// TENANT CONTEXT
// Descripción: Context y Provider para acceder a la
// configuración del tenant en componentes cliente
// =====================================================

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { TenantPublicConfig } from '@/lib/tenant/types'
import { getTenantAssetPath } from '@/lib/tenant/tenant-assets'

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

/** Sincroniza tenant.slug para que las APIs (getProducts, /api/products/related) usen el mismo tenant */
function useTenantSlugForApi(slug: string | undefined) {
  useEffect(() => {
    if (typeof window !== 'undefined' && slug) {
      ;(window as any).__API_TENANT_SLUG__ = slug
    }
    return () => {
      if (typeof window !== 'undefined') delete (window as any).__API_TENANT_SLUG__
    }
  }, [slug])
}

/**
 * Provider para hacer disponible la configuración del tenant
 * en todos los componentes cliente
 */
export function TenantProvider({ tenant, children }: TenantProviderProps) {
  useTenantSlugForApi(tenant?.slug)
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
 * Hook para obtener los assets del tenant desde Supabase Storage
 * Retorna URLs de Supabase Storage con fallback a rutas locales
 */
export function useTenantAssets() {
  const tenant = useTenant()
  
  return {
    logo: tenant.logoUrl || getTenantAssetPath(tenant, 'logo.svg', `/tenants/${tenant.slug}/logo.svg`),
    logoDark: tenant.logoDarkUrl || getTenantAssetPath(tenant, 'logo-dark.svg', `/tenants/${tenant.slug}/logo-dark.svg`),
    favicon: tenant.faviconUrl || getTenantAssetPath(tenant, 'favicon.svg', `/tenants/${tenant.slug}/favicon.svg`),
    ogImage: tenant.ogImageUrl || getTenantAssetPath(tenant, 'og-image.png', `/tenants/${tenant.slug}/og-image.png`),
    heroImage: (index: number) => getTenantAssetPath(tenant, `hero/hero${index}.webp`, `/tenants/${tenant.slug}/hero/hero${index}.webp`),
    promoBanner: getTenantAssetPath(tenant, 'hero/promo-banner.webp', `/tenants/${tenant.slug}/hero/promo-banner.webp`),
    // Fallback a ruta local que existe (public/images/icons/); /tenants/{slug}/icons/ suele estar vacío en repo
    shippingIcon: getTenantAssetPath(tenant, 'icons/icon-envio.svg', '/images/icons/icon-envio.svg'),
    /** Asset "Tu pedido en mano" / pago al recibir (por tenant) */
    pagoAlRecibir: getTenantAssetPath(tenant, 'pagoalrecibir.png', `/tenants/${tenant.slug}/pagoalrecibir.png`),
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
    supportEmail: tenant.supportEmail,
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
