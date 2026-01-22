// =====================================================
// TENANT STRUCTURED DATA (MULTITENANT)
// Descripción: Server Component que genera structured data
// dinámicos basados en la configuración del tenant
// =====================================================

import { getTenantPublicConfig, getTenantBaseUrl } from '@/lib/tenant'
import { getTenantStructuredData } from '@/lib/structured-data'

/**
 * Server Component que genera JSON-LD structured data
 * dinámicamente basado en el tenant actual
 */
export default async function TenantStructuredData() {
  try {
    const tenant = await getTenantPublicConfig()
    const baseUrl = getTenantBaseUrl(tenant)
    
    // Generar structured data dinámicos
    const structuredData = getTenantStructuredData({
      ...tenant,
      siteDescription: tenant.siteDescription || `${tenant.name} - E-commerce`,
    })
    
    const jsonLdArray = [
      structuredData.organization,
      structuredData.website,
      structuredData.store,
    ]
    
    return (
      <>
        {jsonLdArray.map((item, index) => (
          <script
            key={`tenant-structured-data-${index}`}
            id={`tenant-structured-data-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(item),
            }}
          />
        ))}
      </>
    )
  } catch (error) {
    console.error('[TenantStructuredData] Error generating structured data:', error)
    // No renderizar nada si hay error - el SEO fallback se maneja en otro lugar
    return null
  }
}
