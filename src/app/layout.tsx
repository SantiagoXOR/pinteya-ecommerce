// Force redeploy to fix Server Action error - 2025-08-02T00:30:00.000Z
import Providers from './providers'
import { Suspense } from 'react'
import './css/style.css'
import './css/euclid-circular-a-font.css'
import '../styles/checkout-mobile.css'
import '../styles/z-index-hierarchy.css'
import { metadata as defaultMetadata } from './metadata'
import StructuredData from '@/components/SEO/StructuredData'
import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics'
import { ClientErrorSuppression } from '@/components/ErrorSuppression/ClientErrorSuppression'
import {
  organizationStructuredData,
  websiteStructuredData,
  storeStructuredData,
} from '@/lib/structured-data'
import type { Metadata } from 'next'

// Vercel Analytics - Solo en producción
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = defaultMetadata
export { viewport } from './viewport'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es'>
      <head>
        {/* ⚡ CRITICAL CSS - Inline para FCP rápido */}
        <style dangerouslySetInnerHTML={{__html: `
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{line-height:1.15;-webkit-text-size-adjust:100%;font-size:100%}
          body{margin:0;font-family:'Euclid Circular A',system-ui,-apple-system,sans-serif;background:#fff;color:#1f2937}
          img,picture,video{max-width:100%;height:auto;display:block}
          button,input,select,textarea{font:inherit}
          h1,h2,h3,h4,h5,h6{font-weight:bold;line-height:1.2}
          a{text-decoration:none;color:inherit}
          header{background-color:#f97316;position:fixed;top:0;left:0;right:0;z-index:100;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)}
          .hero-section{min-height:320px;background:#fff}
          @media(min-width:1024px){.hero-section{min-height:500px}}
        `}} />
        
        {/* ⚡ PERFORMANCE: Preload fuentes críticas */}
        <link
          rel='preload'
          href='/fonts/EuclidCircularA-Regular.woff2'
          as='font'
          type='font/woff2'
          crossOrigin='anonymous'
        />
        <link
          rel='preload'
          href='/fonts/EuclidCircularA-Bold.woff2'
          as='font'
          type='font/woff2'
          crossOrigin='anonymous'
        />
        
        {/* ⚡ PERFORMANCE: Preconnect a dominios externos */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://aakzspzfulgftqlgwkpb.supabase.co" />
        
        <StructuredData
          data={[organizationStructuredData, websiteStructuredData, storeStructuredData]}
        />
        <GoogleAnalytics />
      </head>
      <body>
        <ClientErrorSuppression />
        {/* <JsonSafetyInitializer /> */}
        {/* <DebugNotificationDisabler /> */}
        {/* <PerformanceTracker /> */}
        {/* Suspense global para componentes compartidos que usan useSearchParams (Header/Search) */}
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
        
        {/* Vercel Analytics - Solo en producción */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}
