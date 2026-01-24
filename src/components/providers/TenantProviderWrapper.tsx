// =====================================================
// TENANT PROVIDER WRAPPER
// Descripción: Wrapper que combina TenantProvider con
// TenantThemeStyles para uso en el layout
// =====================================================

import { type ReactNode } from 'react'
import { getTenantPublicConfig, getTenantConfig } from '@/lib/tenant'
import { TenantProvider } from '@/contexts/TenantContext'
import { TenantAnalytics } from '@/components/Analytics/TenantAnalytics'

interface TenantProviderWrapperProps {
  children: ReactNode
}

/**
 * Server Component que carga la configuración del tenant
 * y provee el contexto + analytics a los children
 * 
 * NOTA: TenantThemeStyles se renderiza en el <head> del layout
 * para que las variables CSS estén disponibles antes del CSS inline
 */
export async function TenantProviderWrapper({ children }: TenantProviderWrapperProps) {
  try {
    const tenant = await getTenantPublicConfig()
    
    return (
      <TenantProvider tenant={tenant}>
        {/* MULTITENANT: Analytics dinámicos por tenant (GA4 + Meta Pixel) */}
        <TenantAnalytics />
        {children}
      </TenantProvider>
    )
  } catch (error) {
    // Si hay error cargando el tenant, loguear pero no romper el renderizado
    console.error('[TenantProviderWrapper] Error cargando tenant:', error)
    // Usar tenant por defecto para evitar romper el renderizado
    const defaultTenant = await getTenantPublicConfig().catch(() => {
      // Si incluso el fallback falla, usar valores mínimos
      return {
        id: '00000000-0000-0000-0000-000000000000',
        slug: 'pinteya',
        name: 'Pinteya',
        subdomain: 'pinteya',
        customDomain: null,
        logoUrl: null,
        logoDarkUrl: null,
        faviconUrl: null,
        primaryColor: '#f27a1d',
        primaryDark: '#bd4811',
        primaryLight: '#f9be78',
        secondaryColor: '#00f269',
        accentColor: '#f9a007',
        backgroundGradientStart: '#000000',
        backgroundGradientEnd: '#eb6313',
        headerBgColor: '#bd4811',
        scrollingBannerLocationText: null,
        scrollingBannerShippingText: null,
        scrollingBannerLocationBgColor: null,
        scrollingBannerShippingBgColor: null,
        themeConfig: { borderRadius: '0.5rem', fontFamily: 'Plus Jakarta Sans' },
        ga4MeasurementId: null,
        metaPixelId: null,
        whatsappNumber: null,
        whatsappMessageTemplate: null,
        siteTitle: null,
        siteDescription: null,
        siteKeywords: [],
        ogImageUrl: null,
        socialLinks: { facebook: null, instagram: null, twitter: null, youtube: null },
        contactPhone: null,
        contactAddress: null,
        contactCity: null,
        contactProvince: null,
        currency: 'ARS',
        locale: 'es_AR',
        businessHours: {},
      } as any
    })
    
    return (
      <TenantProvider tenant={defaultTenant}>
        <TenantAnalytics />
        {children}
      </TenantProvider>
    )
  }
}

/**
 * Server Component que genera los scripts de analytics
 * Debe usarse dentro del <head> o al inicio del <body>
 */
export async function TenantAnalyticsWrapper() {
  const tenant = await getTenantConfig()
  
  if (!tenant.ga4MeasurementId && !tenant.metaPixelId) {
    return null
  }
  
  // Retorna un componente cliente que renderiza los scripts
  return <TenantAnalytics />
}
