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
  const tenant = await getTenantPublicConfig()
  
  return (
    <TenantProvider tenant={tenant}>
      {/* MULTITENANT: Analytics dinámicos por tenant (GA4 + Meta Pixel) */}
      <TenantAnalytics />
      {children}
    </TenantProvider>
  )
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
