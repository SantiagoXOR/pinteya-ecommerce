// Force redeploy to fix Server Action error - 2025-08-02T00:30:00.000Z
import Providers from './providers'
import React, { Suspense } from 'react'
// ⚡ PERFORMANCE: Fuentes optimizadas para Turbopack
import { euclidCircularA } from './fonts'
// ⚡ PERFORMANCE: CSS crítico inline, CSS no crítico carga asíncrono
import './css/style.css'
// ⚡ FIX Turbopack: Importar CSS manual de fuentes (next/font/local tiene bug con Turbopack)
import './css/euclid-fonts-turbopack.css'
// ⚡ OPTIMIZACIÓN: CSS para móviles de bajo rendimiento (prefers-reduced-motion, animaciones optimizadas)
import '@/styles/mobile-performance.css'
import { metadata as defaultMetadata } from './metadata'
import type { Metadata } from 'next'

// ⚡ CRITICAL: Lazy load de componentes no críticos para reducir Script Evaluation
// Estos componentes se cargan después del FCP para no bloquear la carga inicial
import dynamic from 'next/dynamic'

// ⚡ PERFORMANCE: Componentes críticos (carga inmediata)
// Solo componentes esenciales para render inicial
const StructuredData = dynamic(() => import('@/components/SEO/StructuredData'), {
  ssr: true, // SSR para SEO
})

// ⚡ FIX Next.js 15: Componentes con ssr: false deben estar en Client Components
// Mover todos los dynamic imports con ssr: false a un componente cliente
import ClientAnalytics from '@/components/Performance/ClientAnalytics'

// ⚡ PERFORMANCE: Structured data - Import estático para SSR (necesario para SEO)
import {
  organizationStructuredData,
  websiteStructuredData,
  storeStructuredData,
} from '@/lib/structured-data'

export const metadata: Metadata = defaultMetadata
export { viewport } from './viewport'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ⚡ DEBUG: Simplificar layout para identificar el problema
  return (
    <html lang='es' className={euclidCircularA.variable} suppressHydrationWarning>
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
          html{line-height:1.15;-webkit-text-size-adjust:100%;font-size:100%;scroll-behavior:smooth;overflow-x:hidden!important;max-width:100vw;width:100%}
          body{margin:0;font-family:var(--font-euclid),'Euclid Circular A',system-ui,-apple-system,sans-serif;background:linear-gradient(to bottom,#000000 0%,#000000 60%,#eb6313 100%);background-attachment:fixed;background-size:cover;background-position:center;background-repeat:no-repeat;color:#ffffff;min-height:100vh;padding-top:calc(92px + env(safe-area-inset-top, 0px));overflow-x:hidden!important;max-width:100vw;width:100%}
          #__next{overflow-x:hidden;max-width:100vw;width:100%}
          @media(min-width:1024px){body{padding-top:calc(105px + env(safe-area-inset-top, 0px))}}
          @media(max-width:768px){body{padding-bottom:calc(64px + env(safe-area-inset-bottom, 0px))}}
          img,picture,video{max-width:100%;height:auto;display:block}
          button,input,select,textarea{font:inherit}
          h1,h2,h3,h4,h5,h6{font-weight:bold;line-height:1.2}
          a{text-decoration:none;color:inherit}
          header{background-color:#bd4811;position:fixed;top:env(safe-area-inset-top, 0px);left:0;right:0;z-index:100;box-shadow:0 4px 6px -1px rgba(0,0,0,0.5);border-radius:0 0 1.5rem 1.5rem}
          
          /* Critical Hero Styles */
          .hero-section{min-height:320px;background:linear-gradient(135deg,#bd4811,#000000);position:relative;overflow:hidden}
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
          .bg-gradient-hero{background:linear-gradient(135deg,#bd4811 0%,#000000 100%)}
          
          /* Critical button styles */
          .btn-primary{background:#eb6313;color:#fff;padding:1rem 2rem;border-radius:0.5rem;font-weight:600;transition:all 0.2s;border:2px solid #bd4811}
          .btn-primary:hover{background:#bd4811;transform:scale(1.05);border-color:#ea5a17}
          
          /* Prevent layout shift */
          .aspect-video{aspect-ratio:16/9}
          .aspect-square{aspect-ratio:1/1}
          
          /* Z-index hierarchy */
          .z-header{z-index:100}
          .z-modal{z-index:200}
          .z-toast{z-index:300}
          
          /* ⚡ CRITICAL: @font-face Regular inline para eliminar dependencia del CSS externo */
          /* Esto reduce la latencia de ruta crítica de 2,271 ms */
          @font-face{font-family:'Euclid Circular A';src:url('/fonts/EuclidCircularA-Regular.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap;unicode-range:U+0020-007F,U+00A0-00FF,U+0100-017F}
          @font-face{font-family:'Euclid Circular A Fallback';ascent-override:93.26%;descent-override:24.99%;line-gap-override:0.00%;size-adjust:107.23%;src:local('Arial')}
          
          /* ⚡ LEGIBILIDAD: Textos oscuros por defecto en contenedores blancos - EXCLUYENDO product cards */
          /* Aplicar color por defecto al contenedor (sin !important para que clases de color lo sobrescriban) */
          .bg-white:not([data-testid*="product-card"]):not([data-testid*="commercial-product-card"]){color:#111827}
          /* Inputs, selects y textareas - color explícito con !important */
          .bg-white:not([data-testid*="product-card"]):not([data-testid*="commercial-product-card"]) input,
          .bg-white:not([data-testid*="product-card"]):not([data-testid*="commercial-product-card"]) select,
          .bg-white:not([data-testid*="product-card"]):not([data-testid*="commercial-product-card"]) textarea{color:#111827!important}
          /* Placeholders en gris medio */
          .bg-white:not([data-testid*="product-card"]):not([data-testid*="commercial-product-card"]) input::placeholder,
          .bg-white:not([data-testid*="product-card"]):not([data-testid*="commercial-product-card"]) textarea::placeholder{color:#6b7280!important}
          /* Contenedores grises también */
          .bg-gray-50:not([data-testid*="product-card"]):not([data-testid*="commercial-product-card"]),
          .bg-gray-100:not([data-testid*="product-card"]):not([data-testid*="commercial-product-card"]){color:#111827}
          .bg-gray-50:not([data-testid*="product-card"]):not([data-testid*="commercial-product-card"]) input,
          .bg-gray-50:not([data-testid*="product-card"]):not([data-testid*="commercial-product-card"]) select,
          .bg-gray-100:not([data-testid*="product-card"]):not([data-testid*="commercial-product-card"]) input{color:#111827!important}
        `}} />
        
        {/* ⚡ CRITICAL: Preconnect al dominio propio DEBE estar ANTES de cualquier preload */}
        {/* Esto establece la conexión antes de que se necesiten los recursos CSS */}
        <link rel="preconnect" href="https://www.pinteya.com" />
        <link rel="dns-prefetch" href="https://www.pinteya.com" />
        
        {/* ⚡ CRITICAL: Preconnect a Supabase ANTES de cualquier recurso que lo use */}
        {/* Ahorro estimado de LCP: 330 ms según Lighthouse */}
        {/* Posicionado inmediatamente después del dominio propio para máximo impacto */}
        <link rel="preconnect" href="https://aakzspzfulgftqlgwkpb.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://aakzspzfulgftqlgwkpb.supabase.co" />
        
        {/* ⚡ CRITICAL: Preload de imagen LCP del hero - POSICIONADO PRIMERO para máxima prioridad */}
        {/* Esto elimina el retraso de 1,570ms en la carga de recursos */}
        {/* La imagen estática se renderiza inmediatamente sin esperar JavaScript */}
        <link
          rel="preload"
          as="image"
          href="/images/hero/hero2/hero1.webp"
          fetchPriority="high"
          type="image/webp"
          crossOrigin="anonymous"
        />
        {/* ⚡ AVIF para navegadores que lo soportan (mejor compresión) */}
        <link
          rel="preload"
          as="image"
          href="/images/hero/hero2/hero1.avif"
          fetchPriority="high"
          type="image/avif"
          crossOrigin="anonymous"
        />
        
        {/* ⚡ CRITICAL: Preload de fuente Regular (crítica) - ANTES de otros recursos */}
        {/* Esto reduce la latencia de ruta crítica de 2,271 ms */}
        <link
          rel="preload"
          href="/fonts/EuclidCircularA-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          fetchPriority="high"
        />
        
        {/* ⚡ PERFORMANCE: Fuentes SemiBold y Bold se cargan diferidamente cuando se necesitan */}
        {/* next/font maneja el preload automáticamente, pero agregamos preload explícito para Regular */}
        
        {/* ⚡ OPTIMIZACIÓN: Next.js con optimizeCss: true inlina CSS crítico automáticamente */}
        {/* NOTA: No preloadamos CSS chunks con hash hardcodeado porque Next.js regenera el hash en cada build */}
        {/* El script inline de NonBlockingCSS ya convierte los CSS a carga no bloqueante de manera dinámica */}
        {/* Los archivos CSS no críticos (hero-carousel, checkout-transition) se cargan diferidamente via DeferredCSS */}
        {/* NonBlockingCSS convierte los CSS generados por Next.js a carga no bloqueante */}
        {/* Esto elimina ~1,200ms de render-blocking según Lighthouse */}
        
        {/* ⚡ CRITICAL: Script inline mejorado - Ejecutar INMEDIATAMENTE después de CSS crítico */}
        {/* ⚡ OPTIMIZACIÓN V3: Ejecución inmediata sin esperar DOMContentLoaded para máxima efectividad */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              // ⚡ EJECUCIÓN INMEDIATA: No esperar DOMContentLoaded
              // Ejecutar inmediatamente para convertir CSS antes de que Next.js lo inserte
              function convertCSSToNonBlocking() {
                const stylesheets = document.querySelectorAll('head link[rel="stylesheet"]:not([data-non-blocking])');
                stylesheets.forEach(function(link) {
                  const href = link.getAttribute('href') || '';
                  if (href.includes('_next/static/css') || href.includes('.css')) {
                    link.setAttribute('data-non-blocking', 'true');
                    if (link.sheet) return; // Ya cargado
                    
                    // Preload + media="print" + onload
                    const preload = document.createElement('link');
                    preload.rel = 'preload';
                    preload.as = 'style';
                    preload.href = href;
                    document.head.insertBefore(preload, link);
                    
                    const originalMedia = link.media || 'all';
                    link.media = 'print';
                    
                    link.onload = function() {
                      link.media = originalMedia;
                      if (preload.parentNode) preload.parentNode.removeChild(preload);
                    };
                    
                    link.onerror = function() {
                      link.media = originalMedia;
                      if (preload.parentNode) preload.parentNode.removeChild(preload);
                    };
                    
                    // Fallback después de 3 segundos
                    setTimeout(function() {
                      if (link.media === 'print') {
                        link.media = originalMedia;
                        if (preload.parentNode) preload.parentNode.removeChild(preload);
                      }
                    }, 3000);
                  }
                });
              }
              
              // Ejecutar inmediatamente
              convertCSSToNonBlocking();
              
              // También en DOMContentLoaded por si acaso
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', convertCSSToNonBlocking);
              }
              
              // MutationObserver para CSS dinámico
              if (typeof MutationObserver !== 'undefined') {
                new MutationObserver(convertCSSToNonBlocking).observe(document.head, {
                  childList: true,
                  subtree: false
                });
              }
            })();
            `,
          }}
        />
        
        {/* ⚡ CRITICAL: Script para dividir tareas largas y mejorar interactividad */}
        {/* Evita que tareas >50ms bloqueen el hilo principal */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              // ⚡ OPTIMIZACIÓN: Dividir tareas largas en tareas más pequeñas
              // Esto mejora la interactividad evitando que tareas >50ms bloqueen el hilo principal
              
              // Monitorear tareas largas (solo en desarrollo)
              if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
                try {
                  const observer = new PerformanceObserver(function(list) {
                    for (const entry of list.getEntries()) {
                      const duration = entry.duration;
                      // Tareas >50ms son consideradas largas y bloquean interactividad
                      if (duration > 50) {
                        console.warn('[Long Task] Tarea larga detectada:', duration.toFixed(2) + 'ms', entry);
                      }
                    }
                  });
                  
                  observer.observe({ entryTypes: ['longtask'] });
                } catch (e) {
                  // PerformanceObserver puede no estar disponible en algunos navegadores
                }
              }
              
              // ⚡ OPTIMIZACIÓN: Usar requestIdleCallback para diferir trabajo no crítico
              // Esto permite que el navegador ejecute trabajo cuando el hilo principal esté libre
              if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                // Diferir inicialización de componentes no críticos
                requestIdleCallback(function() {
                  // Trabajo no crítico se ejecuta aquí cuando el navegador esté idle
                  // Esto evita bloquear el hilo principal durante la carga inicial
                }, { timeout: 2000 });
              }
            })();
            `,
          }}
        />
        
        {/* ⚡ PERFORMANCE: Preconnect a dominios externos - Agregar crossorigin para recursos CORS */}
        {/* Orden optimizado: primero los más críticos para LCP */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googleadservices.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        {/* ⚡ NOTA: Supabase preconnect movido arriba (después del dominio propio) para máximo impacto */}
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
      </head>
      <body>
        {/* ⚡ FIX Next.js 15: Todos los componentes con ssr: false están en ClientAnalytics */}
        {/* ⚡ TEMPORAL: Comentado para debug del Internal Server Error */}
        {/* <ClientAnalytics /> */}
        
        {/* Suspense global para componentes compartidos que usan useSearchParams (Header/Search) */}
        <Suspense fallback={null}>
          <div className="overflow-x-hidden max-w-full w-full">
            <Providers>{children}</Providers>
          </div>
        </Suspense>
      </body>
    </html>
  )
}
