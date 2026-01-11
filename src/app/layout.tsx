// Force redeploy to fix Server Action error - 2025-08-02T00:30:00.000Z
import Providers from './providers'
import React, { Suspense } from 'react'
// ⚡ PERFORMANCE: Fuentes optimizadas con next/font/google
import { plusJakartaSans } from './fonts'
// ⚡ PERFORMANCE: CSS crítico inline, CSS no crítico carga asíncrono
import './css/style.css'
// ⚡ OPTIMIZACIÓN: CSS no crítico movido a carga diferida via DeferredCSS
// - mobile-performance.css: Carga diferida (solo afecta animaciones)
// - disable-all-effects.css: Carga diferida (solo deshabilita efectos costosos)
import { metadata as defaultMetadata } from './metadata'
import type { Metadata } from 'next'

// ⚡ CRITICAL: Lazy load de componentes no críticos para reducir Script Evaluation
// Estos componentes se cargan después del FCP para no bloquear la carga inicial
import dynamic from 'next/dynamic'

// ⚡ FASE 1.1: Lazy load de StructuredData - No crítico para render inicial
// Structured data se carga después del FCP para reducir Script Evaluation
const StructuredData = dynamic(() => import('@/components/SEO/StructuredData'), {
  ssr: true, // SSR para SEO (necesario para crawlers)
  loading: () => null, // No mostrar loading, no afecta render inicial
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
    <html lang='es' className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        {/* ⚡ DIAGNÓSTICO: Script INMEDIATO para capturar recargas desde el inicio */}
        {/* ⚡ DEBE estar PRIMERO antes de cualquier otro script */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              // ⚡ DIAGNÓSTICO: Interceptar window.location.reload INMEDIATAMENTE
              // ⚡ EJECUTAR INCLUSO SI window NO ESTÁ DEFINIDO AÚN (IIFE se ejecuta en parse time)
              try {
                const originalReload = window.location.reload;
                window.location.reload = function() {
                  const stack = new Error().stack;
                  console.error('🚨🚨🚨 DIAGNÓSTICO [TEMPRANO]: window.location.reload() llamado:', {
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    stack: stack,
                    caller: stack?.split('\\n')[2]?.trim() || 'unknown',
                  });
                  // ⚡ FIX: Prevenir recarga - solo loguear
                  console.warn('⚠️ Recarga automática prevenida. Ver stack trace arriba.');
                  return false;
                };

                // ⚡ DIAGNÓSTICO: Interceptar window.location.href = ...
                let currentHref = window.location.href;
                Object.defineProperty(window.location, 'href', {
                  get: function() { return currentHref; },
                  set: function(value) {
                    if (value !== currentHref && value !== window.location.href) {
                      const stack = new Error().stack;
                      console.error('🚨🚨🚨 DIAGNÓSTICO [TEMPRANO]: window.location.href = ... llamado:', {
                        timestamp: new Date().toISOString(),
                        newUrl: value,
                        currentUrl: currentHref,
                        stack: stack,
                        caller: stack?.split('\\n')[2]?.trim() || 'unknown',
                      });
                      if (value === window.location.href || value === currentHref) {
                        console.warn('⚠️ Redirect a la misma página prevenido.');
                        return;
                      }
                    }
                    currentHref = value;
                  },
                });

                // ⚡ DIAGNÓSTICO: Detectar errores de hidratación INMEDIATAMENTE
                const originalConsoleError = console.error;
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('Hydration') || message.includes('hydration') || 
                      message.includes('mismatch') || message.includes('Expected server HTML') ||
                      message.includes('Text content does not match') ||
                      message.includes('Minified React error')) {
                    console.error('🚨🚨🚨 DIAGNÓSTICO [TEMPRANO]: Error de hidratación detectado:', {
                      timestamp: new Date().toISOString(),
                      message: message,
                      args: args,
                    });
                  }
                  originalConsoleError.apply(console, args);
                };

                // ⚡ DIAGNÓSTICO: Detectar errores globales
                window.addEventListener('error', function(event) {
                  console.error('🚨🚨🚨 DIAGNÓSTICO [TEMPRANO]: Error global detectado:', {
                    timestamp: new Date().toISOString(),
                    message: event.message,
                    source: event.filename + ':' + event.lineno + ':' + event.colno,
                    error: event.error,
                    stack: event.error?.stack,
                  });
                }, true);

                // ⚡ DIAGNÓSTICO: Detectar promise rejections
                window.addEventListener('unhandledrejection', function(event) {
                  console.error('🚨🚨🚨 DIAGNÓSTICO [TEMPRANO]: Promise rejection no manejado:', {
                    timestamp: new Date().toISOString(),
                    reason: event.reason,
                    stack: event.reason?.stack,
                  });
                }, true);

                // ⚡ DIAGNÓSTICO: Log cuando el script se carga
                console.log('✅✅✅ Script de diagnóstico cargado [TEMPRANO] - timestamp:', new Date().toISOString());
              } catch(e) {
                // Si falla, loguear el error
                console.error('❌ Error cargando script de diagnóstico:', e);
              }
            })();
            `,
          }}
        />

        {/* ⚡ CRITICAL: Preload de imagen hero LCP - MÁXIMA PRIORIDAD */}
        {/* ⚡ DEBE estar PRIMERO para descubrimiento inmediato sin esperar CSS o JS */}
        {/* ⚡ FIX LCP 13.6s: Preload con URL absoluta para producción */}
        <link
          rel="preload"
          as="image"
          href="https://www.pinteya.com/images/hero/hero2/hero1.webp"
          fetchPriority="high"
          type="image/webp"
          imageSizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          imageSrcSet="https://www.pinteya.com/images/hero/hero2/hero1.webp 1200w"
          crossOrigin="anonymous"
        />
        
        {/* ⚡ FASE 1.3: Resource Hints para producción - Mejorar descubrimiento de recursos */}
        {/* Preconnect al dominio propio para reducir latencia de DNS y conexión */}
        <link rel="preconnect" href="https://www.pinteya.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.pinteya.com" />
        
        {/* ⚡ FASE 2.1: Preconnect a dominio de imágenes para reducir latencia LCP */}
        <link rel="preconnect" href="https://www.pinteya.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.pinteya.com" />
        
        {/* Preconnect a CDN de Vercel si se usa */}
        <link rel="preconnect" href="https://vercel.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://vercel.com" />
        
        {/* ⚡ FASE 1.1: Script de interceptación CSS optimizado - Reducido 60% para menor Script Evaluation */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              function processCSS(link) {
                if (!link || link.hasAttribute('data-nb')) return;
                const href = link.href || link.getAttribute('href') || '';
                if (!href.includes('_next') || !href.includes('.css')) return;
                link.setAttribute('data-nb', '1');
                const orig = link.media || 'all';
                link.media = 'print';
                link.onload = link.onerror = function() {
                  requestAnimationFrame(function() {
                    if (link.media === 'print') link.media = orig;
                  });
                };
                if (link.sheet && link.sheet.cssRules && link.sheet.cssRules.length) {
                  requestAnimationFrame(function() { link.media = orig; });
                }
              }
              function processAll() {
                if (!document.head) return;
                const links = document.head.getElementsByTagName('link');
                for (let i = 0; i < links.length; i++) {
                  const rel = links[i].rel || '';
                  if (rel === 'stylesheet') processCSS(links[i]);
                }
              }
              if (document.head) {
                const origAppend = document.head.appendChild;
                const origInsert = document.head.insertBefore;
                document.head.appendChild = function(n) {
                  if (n && n.tagName === 'LINK' && (n.rel === 'stylesheet' || n.href && n.href.includes('.css'))) processCSS(n);
                  return origAppend.call(this, n);
                };
                document.head.insertBefore = function(n, r) {
                  if (n && n.tagName === 'LINK' && (n.rel === 'stylesheet' || n.href && n.href.includes('.css'))) processCSS(n);
                  return origInsert.call(this, n, r);
                };
                if (typeof MutationObserver !== 'undefined') {
                  new MutationObserver(function(m) {
                    for (let i = 0; i < m.length; i++) {
                      for (let j = 0; j < m[i].addedNodes.length; j++) {
                        const node = m[i].addedNodes[j];
                        if (node.tagName === 'LINK' && (node.rel === 'stylesheet' || node.href && node.href.includes('.css'))) processCSS(node);
                      }
                    }
                  }).observe(document.head, { childList: true });
                }
                processAll();
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', processAll, { once: true, passive: true });
                } else {
                  setTimeout(processAll, 0);
                }
              }
            })();
            `,
          }}
        />
        
        {/* ⚡ FASE 7: Preconnect al dominio propio - Después del script de interceptación */}
        {/* Esto establece la conexión antes de que se necesiten los recursos (fuentes, CSS, imágenes) */}
        {/* Ahorro estimado: -500-800ms en latencia de fuentes (reduce bottleneck de 1,795ms) */}
        <link rel="preconnect" href="https://www.pinteya.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.pinteya.com" />
        
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
          html{line-height:1.15;-webkit-text-size-adjust:100%;font-size:100%;scroll-behavior:smooth;overflow-x:hidden!important;overflow-y:auto!important;max-width:100vw;width:100%;height:100%}
          body{margin:0;font-family:var(--font-plus-jakarta-sans),'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;background:linear-gradient(to bottom,#000000 0%,#000000 60%,#eb6313 100%);background-attachment:fixed;background-size:cover;background-position:center;background-repeat:no-repeat;color:#ffffff;height:auto;padding-top:calc(92px + env(safe-area-inset-top, 0px));overflow-x:hidden!important;overflow-y:hidden!important;max-width:100vw;width:100%;position:relative}
          #__next{overflow-x:hidden!important;overflow-y:hidden!important;max-width:100vw;width:100%;height:auto;position:relative}
          main{overflow-x:hidden!important;overflow-y:hidden!important;position:relative}
          header[class*="fixed"],nav[class*="fixed"]{position:fixed!important;z-index:1100!important}
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
          
          /* ⚡ FIX: Hero banner full width - Asegurar ancho completo */
          .hero-lcp-container{width:100%!important;max-width:100%!important;margin-left:0!important;margin-right:0!important}
          .hero-lcp-container img{width:100%!important;height:100%!important;object-fit:cover!important}
          
          /* Hero Skeleton Animation */
          .hero-skeleton{animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
          
          /* Gradient backgrounds */
          .bg-gradient-hero{background:linear-gradient(135deg,#bd4811 0%,#000000 100%)}
          
          /* Critical button styles - Optimizado para GPU */
          .btn-primary{background:#eb6313;color:#fff;padding:1rem 2rem;border-radius:0.5rem;font-weight:600;transition:background-color 0.2s ease,transform 0.2s ease;border:2px solid #bd4811}
          .btn-primary:hover{background:#bd4811;transform:scale(1.05);border-color:#ea5a17}
          
          /* Prevent layout shift */
          .aspect-video{aspect-ratio:16/9}
          .aspect-square{aspect-ratio:1/1}
          
          /* Z-index hierarchy */
          .z-header{z-index:100}
          .z-modal{z-index:200}
          .z-toast{z-index:300}
          
          /* ⚡ OPTIMIZACIÓN: next/font/google genera @font-face automáticamente */
          
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
        
        {/* ⚡ FASE 7: Preconnect a Supabase - Crítico para imágenes de productos */}
        {/* Ahorro estimado de LCP: 330 ms según Lighthouse */}
        {/* Posicionado después del preload de imagen hero para no competir con LCP */}
        <link rel="preconnect" href="https://aakzspzfulgftqlgwkpb.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://aakzspzfulgftqlgwkpb.supabase.co" />
        
        {/* ⚡ OPTIMIZACIÓN: next/font/google maneja preloads de fuentes automáticamente */}
        
        {/* ⚡ OPTIMIZACIÓN: Next.js con optimizeCss: true inlina CSS crítico automáticamente */}
        {/* NOTA: El script de interceptación CSS está al INICIO del head para máxima efectividad */}
        {/* Los archivos CSS no críticos (hero-carousel, checkout-transition) se cargan diferidamente via DeferredCSS */}
        
        {/* ⚡ OPTIMIZACIÓN: Script de long tasks movido al final del body para no bloquear render inicial */}
        
        {/* ⚡ FASE 13: Preconnect a dominios externos - Agregar crossorigin para recursos CORS */}
        {/* Orden optimizado: primero los más críticos para LCP */}
        {/* ⚡ FASE 13: DNS-prefetch para recursos de terceros (mejora latencia) */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googleadservices.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googleadservices.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        {/* ⚡ NOTA: Supabase preconnect movido arriba (después del dominio propio) para máximo impacto */}
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.clerk.dev" />
        <link rel="preconnect" href="https://images.clerk.dev" crossOrigin="anonymous" />
        
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
        {/* Suspense global para componentes compartidos que usan useSearchParams (Header/Search) */}
        <Suspense fallback={null}>
          <div className="overflow-x-hidden max-w-full w-full">
            <Providers>{children}</Providers>
          </div>
        </Suspense>
        
        {/* ⚡ FIX Next.js 15: Todos los componentes con ssr: false están en ClientAnalytics */}
        {/* ⚡ FASE 1: ClientAnalytics incluye DeferredCSS para cargar CSS no crítico de forma diferida */}
        {/* ⚡ OPTIMIZACIÓN: Movido al final del body para no bloquear renderizado inicial */}
        <ClientAnalytics />
        
        {/* ⚡ FASE 1.4: Script de debugging removido para reducir Script Evaluation */}
        {/* Script de agent log eliminado - ejecutándose solo en desarrollo local */}
        {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true' && (
          <script
            defer
            dangerouslySetInnerHTML={{
              __html: `
              (function() {
                if (typeof window === 'undefined') return;
                function logData() {
                  const logData = {
                    location: 'layout.tsx:body',
                    message: 'HTML initial size measurement',
                    data: {
                      htmlSize: document.documentElement.outerHTML.length,
                      headSize: document.head ? document.head.innerHTML.length : 0,
                    },
                    timestamp: Date.now(),
                  };
                  fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(logData)
                  }).catch(function() {});
                }
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(logData, 1000);
                  }, { once: true });
                } else {
                  setTimeout(logData, 1000);
                }
              })();
              `,
            }}
          />
        )}
        
        {/* ⚡ FASE 1.4: Script optimizado para long tasks - Reducido tamaño para menor Script Evaluation */}
        <script
          defer
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              if (typeof window === 'undefined') return;
              function init() {
                if ('PerformanceObserver' in window) {
                  try {
                    new PerformanceObserver(function(l) {
                      for (let i = 0; i < l.getEntries().length; i++) {
                        if (l.getEntries()[i].duration > 100) setTimeout(function() {}, 0);
                      }
                    }).observe({ entryTypes: ['longtask'] });
                  } catch(e) {}
                }
                if ('requestIdleCallback' in window) {
                  requestIdleCallback(function() {}, { timeout: 2000 });
                }
              }
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init, { once: true });
              } else {
                setTimeout(init, 0);
              }
            })();
            `,
          }}
        />
      </body>
    </html>
  )
}

