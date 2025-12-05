// Force redeploy to fix Server Action error - 2025-08-02T00:30:00.000Z
import Providers from './providers'
import { Suspense } from 'react'
// ⚡ PERFORMANCE: CSS crítico inline, CSS no crítico carga asíncrono
import './css/style.css'
import './css/euclid-circular-a-font.css'
// CSS no crítico se carga asíncronamente después del FCP
import { metadata as defaultMetadata } from './metadata'
import StructuredData from '@/components/SEO/StructuredData'
import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics'
import MetaPixel from '@/components/Analytics/MetaPixel'
import GoogleAds from '@/components/Analytics/GoogleAds'
import { ClientErrorSuppression } from '@/components/ErrorSuppression/ClientErrorSuppression'
import PerformanceTracker from '@/components/PerformanceTracker'
import { DeferredCSS } from '@/components/Performance/DeferredCSS'
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
        {/* ⚡ CRITICAL CSS - Inline para FCP rápido (-0.2s) */}
        <style dangerouslySetInnerHTML={{__html: `
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{line-height:1.15;-webkit-text-size-adjust:100%;font-size:100%;scroll-behavior:smooth}
          body{margin:0;font-family:'Euclid Circular A',system-ui,-apple-system,sans-serif;background:linear-gradient(180deg,#ffd549 0%,#fff4c6 50%,#ffffff 100%);background-attachment:fixed;color:#1f2937;padding-top:92px}
          @media(min-width:1024px){body{padding-top:105px}}
          img,picture,video{max-width:100%;height:auto;display:block}
          button,input,select,textarea{font:inherit}
          h1,h2,h3,h4,h5,h6{font-weight:bold;line-height:1.2}
          a{text-decoration:none;color:inherit}
          header{background-color:#f97316;position:fixed;top:0;left:0;right:0;z-index:100;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);border-radius:0 0 1.5rem 1.5rem}
          
          /* Critical Hero Styles */
          .hero-section{min-height:320px;background:linear-gradient(135deg,#f97316,#ea580c);position:relative;overflow:hidden}
          @media(min-width:1024px){.hero-section{min-height:500px}}
          
          /* Hero Skeleton Animation */
          .hero-skeleton{animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
          
          /* Gradient backgrounds */
          .bg-gradient-hero{background:linear-gradient(135deg,#f97316 0%,#ea580c 100%)}
          
          /* Critical button styles */
          .btn-primary{background:#eb6313;color:#fff;padding:1rem 2rem;border-radius:0.5rem;font-weight:600;transition:all 0.2s}
          .btn-primary:hover{background:#bd4811;transform:scale(1.05)}
          
          /* Prevent layout shift */
          .aspect-video{aspect-ratio:16/9}
          .aspect-square{aspect-ratio:1/1}
          
          /* Z-index hierarchy */
          .z-header{z-index:100}
          .z-modal{z-index:200}
          .z-toast{z-index:300}
        `}} />
        
        {/* ⚡ PERFORMANCE: Preload de fuentes críticas */}
        <link
          rel="preload"
          href="/fonts/EuclidCircularA-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/EuclidCircularA-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* ⚡ PERFORMANCE: Preload de imagen hero crítica (LCP candidate) */}
        <link
          rel="preload"
          as="image"
          href="/images/hero/hero2/hero1.svg"
          fetchPriority="high"
        />
        
        {/* ⚡ PERFORMANCE: Preconnect a dominios externos - Agregar crossorigin para recursos CORS */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googleadservices.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://aakzspzfulgftqlgwkpb.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://aakzspzfulgftqlgwkpb.supabase.co" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://images.clerk.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.clerk.dev" />
        
        {/* Google Merchant Center Verification */}
        <meta
          name="google-site-verification"
          content="YoGAj7X-fCg9Xclet5ZnoNgCpzkuLd74sEzyfDI9WXs"
        />
        
        <StructuredData
          data={[organizationStructuredData, websiteStructuredData, storeStructuredData]}
        />
        <GoogleAnalytics />
        <MetaPixel />
        <GoogleAds />
      </head>
      <body>
        <ClientErrorSuppression />
        {/* <JsonSafetyInitializer /> */}
        {/* <DebugNotificationDisabler /> */}
        <PerformanceTracker />
        
        {/* ⚡ PERFORMANCE: CSS no crítico carga diferidamente después del FCP */}
        <DeferredCSS />
        
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
