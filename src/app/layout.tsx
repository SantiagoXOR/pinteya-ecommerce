// Force redeploy to fix Server Action error - 2025-08-02T00:30:00.000Z
import Providers from './providers'
import { Suspense } from 'react'
// ⚡ PERFORMANCE: Fuentes optimizadas con next/font (elimina 610ms de render-blocking)
import { euclidCircularA } from './fonts'
// ⚡ PERFORMANCE: CSS crítico inline, CSS no crítico carga asíncrono
import './css/style.css'
// NOTA: euclid-circular-a-font.css ya no es necesario, next/font lo maneja automáticamente
// CSS no crítico se carga asíncronamente después del FCP
import { metadata as defaultMetadata } from './metadata'
import StructuredData from '@/components/SEO/StructuredData'
import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics'
import MetaPixel from '@/components/Analytics/MetaPixel'
import GoogleAds from '@/components/Analytics/GoogleAds'
import { ClientErrorSuppression } from '@/components/ErrorSuppression/ClientErrorSuppression'
import PerformanceTracker from '@/components/PerformanceTracker'
import { DeferredCSS } from '@/components/Performance/DeferredCSS'
import { NonBlockingCSS } from '@/components/Performance/NonBlockingCSS'
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
    <html lang='es' className={euclidCircularA.variable}>
      <head>
        {/* ⚡ CRITICAL CSS - Inline para FCP rápido (-0.2s) */}
        <style dangerouslySetInnerHTML={{__html: `
          /* CSS Variables - Inline para eliminar archivo bloqueante */
          :root{
            --background:0 0% 100%;
            --foreground:222.2 84% 4.9%;
            --card:0 0% 100%;
            --card-foreground:222.2 84% 4.9%;
            --popover:0 0% 100%;
            --popover-foreground:222.2 84% 4.9%;
            --primary:222.2 47.4% 11.2%;
            --primary-foreground:210 40% 98%;
            --secondary:210 40% 96%;
            --secondary-foreground:222.2 84% 4.9%;
            --muted:210 40% 96%;
            --muted-foreground:215.4 16.3% 46.9%;
            --accent:210 40% 96%;
            --accent-foreground:222.2 84% 4.9%;
            --destructive:0 84.2% 60.2%;
            --destructive-foreground:210 40% 98%;
            --border:214.3 31.8% 91.4%;
            --input:214.3 31.8% 91.4%;
            --ring:222.2 84% 4.9%;
            --radius:0.5rem;
            --chart-1:12 76% 61%;
            --chart-2:173 58% 39%;
            --chart-3:197 37% 24%;
            --chart-4:43 74% 66%;
            --chart-5:27 87% 67%;
          }
          .dark{
            --background:222.2 84% 4.9%;
            --foreground:210 40% 98%;
            --card:222.2 84% 4.9%;
            --card-foreground:210 40% 98%;
            --popover:222.2 84% 4.9%;
            --popover-foreground:210 40% 98%;
            --primary:210 40% 98%;
            --primary-foreground:222.2 47.4% 11.2%;
            --secondary:217.2 32.6% 17.5%;
            --secondary-foreground:210 40% 98%;
            --muted:217.2 32.6% 17.5%;
            --muted-foreground:215 20.2% 65.1%;
            --accent:217.2 32.6% 17.5%;
            --accent-foreground:210 40% 98%;
            --destructive:0 62.8% 30.6%;
            --destructive-foreground:210 40% 98%;
            --border:217.2 32.6% 17.5%;
            --input:217.2 32.6% 17.5%;
            --ring:212.7 26.8% 83.9%;
            --chart-1:220 70% 50%;
            --chart-2:160 60% 45%;
            --chart-3:30 80% 55%;
            --chart-4:280 65% 60%;
            --chart-5:340 75% 55%;
          }
          
          /* Reset y base styles */
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{line-height:1.15;-webkit-text-size-adjust:100%;font-size:100%;scroll-behavior:smooth}
          body{margin:0;font-family:var(--font-euclid),'Euclid Circular A',system-ui,-apple-system,sans-serif;background:linear-gradient(180deg,#ffd549 0%,#fff4c6 50%,#ffffff 100%);background-attachment:fixed;color:#1f2937;padding-top:92px}
          @media(min-width:1024px){body{padding-top:105px}}
          img,picture,video{max-width:100%;height:auto;display:block}
          button,input,select,textarea{font:inherit}
          h1,h2,h3,h4,h5,h6{font-weight:bold;line-height:1.2}
          a{text-decoration:none;color:inherit}
          header{background-color:#f97316;position:fixed;top:0;left:0;right:0;z-index:100;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);border-radius:0 0 1.5rem 1.5rem}
          
          /* Critical Hero Styles */
          .hero-section{min-height:320px;background:linear-gradient(135deg,#f97316,#ea580c);position:relative;overflow:hidden}
          @media(min-width:1024px){.hero-section{min-height:500px}}
          
          /* Critical Hero Carousel Styles - Mínimos para evitar layout shift mientras carga CSS diferido */
          .hero-carousel{position:relative;width:100%;min-height:400px}
          .hero-carousel .swiper{width:100%;height:100%;min-height:inherit;cursor:grab}
          .hero-carousel .swiper:active{cursor:grabbing}
          .hero-carousel .swiper-slide{width:100%;height:100%;min-height:inherit;position:relative}
          .hero-carousel .swiper-slide>div{width:100%;height:100%;min-height:inherit}
          @media(max-width:639px){.hero-carousel{min-height:420px}}
          @media(min-width:1024px){.hero-carousel{min-height:500px}}
          
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
        
        {/* ⚡ CRITICAL: Preconnect al dominio propio DEBE estar ANTES de cualquier preload */}
        {/* Esto establece la conexión antes de que se necesiten los recursos CSS */}
        <link rel="preconnect" href="https://www.pinteya.com" />
        <link rel="dns-prefetch" href="https://www.pinteya.com" />
        
        {/* ⚡ CRITICAL: Preload de imagen LCP del hero - POSICIONADO PRIMERO para máxima prioridad */}
        {/* Esto elimina el retraso de 2,270ms en la carga de recursos */}
        {/* La imagen estática se renderiza inmediatamente sin esperar JavaScript */}
        <link
          rel="preload"
          as="image"
          href="/images/hero/hero2/hero1.webp"
          fetchPriority="high"
          type="image/webp"
        />
        {/* ⚡ AVIF para navegadores que lo soportan (mejor compresión) */}
        <link
          rel="preload"
          as="image"
          href="/images/hero/hero2/hero1.avif"
          fetchPriority="high"
          type="image/avif"
        />
        
        {/* ⚡ PERFORMANCE: next/font maneja el preload automáticamente */}
        {/* Las fuentes se inlinean automáticamente en el CSS, eliminando el request bloqueante */}
        
        {/* ⚡ OPTIMIZACIÓN: Next.js con optimizeCss: true inlina CSS crítico automáticamente */}
        {/* Los archivos CSS no críticos (hero-carousel, checkout-transition) se cargan diferidamente via DeferredCSS */}
        {/* NonBlockingCSS convierte los CSS generados por Next.js a carga no bloqueante */}
        {/* Esto elimina ~1,010ms de render-blocking según Lighthouse */}
        
        {/* ⚡ CRITICAL: Script inline para convertir CSS a no bloqueante ANTES de que React se hidrate */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              function convertCSSToNonBlocking() {
                const stylesheets = document.querySelectorAll('head link[rel="stylesheet"]');
                stylesheets.forEach(function(link) {
                  const href = link.getAttribute('href') || '';
                  const isNextJSCSS = href.includes('_next/static/css') || href.includes('.css');
                  
                  if (isNextJSCSS && link.media !== 'print' && !link.hasAttribute('data-non-blocking')) {
                    link.setAttribute('data-non-blocking', 'true');
                    const originalMedia = link.media || 'all';
                    
                    // Si ya está cargado, no hacer nada
                    if (link.sheet) return;
                    
                    // Técnica media="print" para carga no bloqueante
                    link.media = 'print';
                    
                    link.onload = function() {
                      link.media = originalMedia;
                      link.onload = null;
                      link.onerror = null;
                    };
                    
                    link.onerror = function() {
                      link.media = originalMedia;
                      link.onload = null;
                      link.onerror = null;
                    };
                    
                    // Fallback después de 3 segundos
                    setTimeout(function() {
                      if (link.media === 'print') {
                        link.media = originalMedia;
                      }
                    }, 3000);
                  }
                });
              }
              
              // Ejecutar inmediatamente
              convertCSSToNonBlocking();
              
              // Ejecutar después de un pequeño delay para CSS que se carga después
              setTimeout(convertCSSToNonBlocking, 50);
              
              // Observar cambios en el DOM
              if (typeof MutationObserver !== 'undefined') {
                const observer = new MutationObserver(convertCSSToNonBlocking);
                observer.observe(document.head, { childList: true, subtree: false });
              }
            })();
            `,
          }}
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
        
        {/* ⚡ CRITICAL: Convertir CSS de Next.js a carga no bloqueante (ejecutar primero) */}
        <NonBlockingCSS />
        
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
