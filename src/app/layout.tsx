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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es'>
      <head>
        {/* ⚡ PERFORMANCE: Preload fuentes críticas para evitar FOIT */}
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
        <link
          rel='preload'
          href='/fonts/EuclidCircularA-Medium.woff2'
          as='font'
          type='font/woff2'
          crossOrigin='anonymous'
        />
        
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
