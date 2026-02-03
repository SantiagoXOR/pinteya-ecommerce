'use client'

// =====================================================
// TENANT ANALYTICS
// Descripción: Componente cliente que inyecta los scripts
// de analytics (GA4, Meta Pixel) basados en el tenant
// =====================================================

import Script from 'next/script'
import { useTenantAnalytics } from '@/contexts/TenantContext'

/**
 * Componente que inyecta Google Analytics 4 y Meta Pixel
 * dinámicamente según la configuración del tenant
 */
export function TenantAnalytics() {
  const { ga4MeasurementId, metaPixelId, tenantId, tenantSlug } = useTenantAnalytics()
  
  return (
    <>
      {/* ========================================
          GOOGLE ANALYTICS 4
          ======================================== */}
      {ga4MeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`}
            strategy="lazyOnload"
          />
          <Script
            id="ga4-init"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4MeasurementId}', {
                  send_page_view: true,
                  custom_map: {
                    'dimension1': 'tenant_id',
                    'dimension2': 'tenant_slug'
                  }
                });
                gtag('set', 'user_properties', {
                  tenant_id: '${tenantId}',
                  tenant_slug: '${tenantSlug}'
                });
              `,
            }}
          />
        </>
      )}
      
      {/* ========================================
          META PIXEL (Facebook)
          ======================================== */}
      {metaPixelId && (
        <Script
          id="meta-pixel"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              
              fbq('init', '${metaPixelId}', {
                external_id: '${tenantId}'
              });
              fbq('track', 'PageView');
              
              // Custom parameter para tracking multitenant
              fbq('trackCustom', 'TenantIdentified', {
                tenant_id: '${tenantId}',
                tenant_slug: '${tenantSlug}'
              });
            `,
          }}
        />
      )}
    </>
  )
}

/**
 * Versión server-side del analytics (para SSR)
 * Usa las props directamente sin context
 */
interface ServerTenantAnalyticsProps {
  ga4MeasurementId: string | null
  metaPixelId: string | null
  tenantId: string
  tenantSlug: string
}

export function ServerTenantAnalytics({
  ga4MeasurementId,
  metaPixelId,
  tenantId,
  tenantSlug,
}: ServerTenantAnalyticsProps) {
  // Genera solo los scripts iniciales para SSR
  // El tracking real se hace en cliente
  
  const ga4Script = ga4MeasurementId ? `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.__GA4_ID__ = '${ga4MeasurementId}';
    window.__TENANT_ID__ = '${tenantId}';
    window.__TENANT_SLUG__ = '${tenantSlug}';
  ` : ''
  
  const metaScript = metaPixelId ? `
    window.__META_PIXEL_ID__ = '${metaPixelId}';
  ` : ''
  
  if (!ga4Script && !metaScript) {
    return null
  }
  
  return (
    <script
      id="tenant-analytics-init"
      dangerouslySetInnerHTML={{
        __html: ga4Script + metaScript,
      }}
    />
  )
}
