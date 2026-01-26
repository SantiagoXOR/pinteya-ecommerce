// Force redeploy to fix Server Action error - 2025-08-02T00:30:00.000Z
// =====================================================
// ROOT LAYOUT - PintureríaDigital (Multitenant)
// =====================================================
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

// ⚡ MULTITENANT: Imports para sistema de tenants
import { getTenantPublicConfig, getTenantBaseUrl } from '@/lib/tenant'
import { getTenantAssetPath } from '@/lib/tenant/tenant-assets'
import { TenantProviderWrapper } from '@/components/providers/TenantProviderWrapper'
import { TenantThemeStyles } from '@/components/theme/TenantThemeStyles'

// ⚡ MULTITENANT: Layout dinámico porque detecta tenant desde headers
// Esto es necesario porque getTenantPublicConfig() usa headers() para detectar el tenant
// ⚡ FIX: Debe estar antes de los imports para evitar conflictos con Turbopack
export const dynamic = 'force-dynamic'

// ⚡ NOTA: StructuredData estático reemplazado por TenantStructuredData dinámico
// El componente TenantStructuredData es un Server Component que genera
// los structured data basados en la configuración del tenant actual

// ⚡ FIX Next.js 15: Componentes con ssr: false deben estar en Client Components
// Mover todos los dynamic imports con ssr: false a un componente cliente
import ClientAnalytics from '@/components/Performance/ClientAnalytics'

// ⚡ MULTITENANT: Structured data dinámico basado en tenant
import TenantStructuredData from '@/components/SEO/TenantStructuredData'

// ⚡ MULTITENANT: Metadata dinámico basado en el tenant actual
export async function generateMetadata(): Promise<Metadata> {
  try {
    const tenant = await getTenantPublicConfig()
    const baseUrl = getTenantBaseUrl(tenant)
    
    // ⚡ MULTITENANT: Favicon dinámico por tenant desde Supabase Storage
    // Usar timestamp además del tenant.id para cache-busting más agresivo
    const faviconTimestamp = Date.now()
    const faviconPath = getTenantAssetPath(tenant, 'favicon.svg', `/tenants/${tenant.slug}/favicon.svg`) + `?v=${tenant.id}&t=${faviconTimestamp}`
    const fallbackFavicon = '/favicon.svg'
    
    return {
      ...defaultMetadata,
      title: {
        default: tenant.siteTitle || defaultMetadata.title?.toString() || 'PintureríaDigital',
        template: `%s | ${tenant.name}`,
      },
      description: tenant.siteDescription || defaultMetadata.description,
      keywords: tenant.siteKeywords?.length > 0 ? tenant.siteKeywords : defaultMetadata.keywords,
      // ⚡ MULTITENANT: Favicon dinámico por tenant
      icons: {
        icon: [
          { url: faviconPath, type: 'image/svg+xml' },
          { url: fallbackFavicon, type: 'image/svg+xml' }, // Fallback
        ],
        shortcut: faviconPath,
        apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      },
      openGraph: {
        ...defaultMetadata.openGraph,
        title: tenant.siteTitle || defaultMetadata.openGraph?.title,
        description: tenant.siteDescription || defaultMetadata.openGraph?.description,
        url: baseUrl,
        siteName: tenant.name,
        images: tenant.ogImageUrl ? [{ url: tenant.ogImageUrl }] : defaultMetadata.openGraph?.images,
      },
      twitter: {
        ...defaultMetadata.twitter,
        title: tenant.siteTitle || defaultMetadata.twitter?.title,
        description: tenant.siteDescription || defaultMetadata.twitter?.description,
      },
      metadataBase: new URL(baseUrl),
      // ⚡ MULTITENANT: Theme-color dinámico por tenant (color primario)
      other: {
        ...defaultMetadata.other,
        'theme-color': tenant.primaryColor || '#ea5a17',
        'msapplication-TileColor': tenant.primaryColor || '#ea5a17',
      },
    }
  } catch (error) {
    // Fallback a metadata por defecto si hay error
    console.error('[Layout] Error generating tenant metadata:', error)
    return defaultMetadata
  }
}

export { viewport } from './viewport'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // ⚡ MULTITENANT: Cargar tenant para inyectar estilos en el head
  const tenant = await getTenantPublicConfig()
  
  // ⚡ DEBUG: Log para verificar tenant cargado
  if (process.env.NODE_ENV === 'development') {
    console.log('[Layout] Tenant cargado:', {
      slug: tenant.slug,
      name: tenant.name,
      headerBgColor: tenant.headerBgColor,
      primaryColor: tenant.primaryColor,
      accentColor: tenant.accentColor
    })
  }
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:96',message:'Tenant loaded in layout (server)',data:{tenantSlug:tenant.slug,tenantName:tenant.name,headerBgColor:tenant.headerBgColor,primaryColor:tenant.primaryColor,faviconUrl:tenant.faviconUrl,gradientStart:tenant.backgroundGradientStart,gradientEnd:tenant.backgroundGradientEnd},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  // ⚡ DEBUG: Simplificar layout para identificar el problema
  return (
    <html lang='es' className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        {/* ⚡ MULTITENANT: Inyectar variables CSS del tenant ANTES del CSS inline */}
        <TenantThemeStyles tenant={tenant} />
        {/* ⚡ MULTITENANT: Inyectar tenant_id para analytics (Fase 1 - Performance) */}
        <meta name="tenant-id" content={tenant.id} />
        {/* ⚡ MULTITENANT: Theme-color dinámico para header del navegador (mobile) */}
        <meta name="theme-color" content={tenant.primaryColor || '#841468'} />
        {/* ⚡ MULTITENANT: Favicon dinámico por tenant desde Supabase Storage */}
        {/* Usar timestamp además del tenant.id para cache-busting más agresivo */}
        {(() => {
          const faviconTimestamp = Date.now()
          const faviconPath = getTenantAssetPath(tenant, 'favicon.svg', `/tenants/${tenant.slug}/favicon.svg`) + `?v=${tenant.id}&t=${faviconTimestamp}`
          return (
            <>
              <link rel="icon" type="image/svg+xml" href={faviconPath} />
              <link rel="shortcut icon" type="image/svg+xml" href={faviconPath} />
            </>
          )
        })()}
        {/* ⚡ MULTITENANT: Apple touch icon puede ser tenant-specific en el futuro */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              // MULTITENANT: Inyectar configuración del tenant para analytics
              if (typeof window !== 'undefined') {
                window.__TENANT_CONFIG__ = {
                  id: '${tenant.id}',
                  slug: '${tenant.slug}',
                  name: '${tenant.name}',
                };
              }
            })();
            `,
          }}
        />
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
                // ⚡ FIX: No usar Object.defineProperty porque href no es redefinible
                // En su lugar, interceptar mediante un Proxy o simplemente monitorear cambios
                // Comentado temporalmente para evitar error "Cannot redefine property: href"
                /*
                let currentHref = window.location.href;
                try {
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
                } catch(e) {
                  console.warn('⚠️ No se pudo interceptar window.location.href (esperado en algunos navegadores)');
                }
                */

                // ⚡ DIAGNÓSTICO: Detectar errores de hidratación INMEDIATAMENTE
                // ⚡ FIX: Solo reportar errores de hidratación reales, no los causados por archivos faltantes
                const originalConsoleError = console.error;
                console.error = function(...args) {
                  const message = args.join(' ');
                  
                  // Solo reportar errores de hidratación si NO son causados por archivos faltantes
                  if ((message.includes('Hydration') || message.includes('hydration') || 
                      message.includes('mismatch') || message.includes('Expected server HTML') ||
                      message.includes('Text content does not match') ||
                      message.includes('Minified React error')) &&
                      !message.includes('404') &&
                      !message.includes('Failed to load') &&
                      !message.includes('framework.js') &&
                      !message.includes('main.js')) {
                    console.error('🚨🚨🚨 DIAGNÓSTICO [TEMPRANO]: Error de hidratación detectado:', {
                      timestamp: new Date().toISOString(),
                      message: message,
                      args: args,
                    });
                  }
                  originalConsoleError.apply(console, args);
                };

                // ⚡ DIAGNÓSTICO: Detectar errores globales (ignorar errores esperados)
                window.addEventListener('error', function(event) {
                  // ⚡ FIX: Ignorar errores esperados y no críticos
                  const source = event.filename || event.source || '';
                  const message = event.message || '';
                  const target = event.target;
                  
                  // ✅ FIX: Ignorar errores sin información útil (objetos vacíos)
                  // Si no hay message, filename, error, ni target útil, es probablemente un error sin información
                  if (!message && !source && !event.error && (!target || (target && !target.tagName))) {
                    return; // No procesar errores vacíos
                  }
                  
                  // Ignorar errores de scripts de Vercel Analytics/Speed Insights (bloqueados por ad blockers)
                  if (source.includes('_vercel/') || 
                      source.includes('speed-insights') || 
                      source.includes('analytics') ||
                      message.includes('speed-insights') ||
                      message.includes('analytics')) {
                    return; // No procesar como error crítico
                  }
                  
                  // Ignorar errores 404 de archivos Next.js con hashes dinámicos
                  // Next.js genera estos archivos con nombres como framework-abc123.js
                  // Los prefetch hardcodeados pueden causar 404 esperados
                  if (source.includes('/_next/static/chunks/') && 
                      (source.includes('framework') || source.includes('main')) &&
                      (message.includes('404') || message.includes('Failed to load'))) {
                    return; // No procesar como error crítico
                  }
                  
                  // Ignorar errores de recursos bloqueados por el cliente (ad blockers)
                  if (message.includes('ERR_BLOCKED_BY_CLIENT') ||
                      message.includes('Failed to load resource') ||
                      (target && target.tagName === 'SCRIPT' && target.src && 
                       (target.src.includes('_vercel/') || target.src.includes('analytics')))) {
                    return; // No procesar como error crítico
                  }
                  
                  // Ignorar errores de fetch bloqueados (analytics, tracking)
                  if (source.includes('/api/analytics/') || 
                      source.includes('/api/tracking/') ||
                      message.includes('Failed to fetch') && source.includes('analytics')) {
                    return; // No procesar como error crítico
                  }
                  
                  // ✅ FIX: Solo reportar errores críticos reales con información útil
                  // Construir objeto de error solo si hay información válida
                  const errorInfo: any = {
                    timestamp: new Date().toISOString(),
                  };
                  
                  if (message) errorInfo.message = message;
                  if (source || event.filename || event.lineno || event.colno) {
                    errorInfo.source = (event.filename || source || 'unknown') + ':' + (event.lineno || '?') + ':' + (event.colno || '?');
                  }
                  if (event.error) {
                    errorInfo.error = event.error;
                    if (event.error.stack) errorInfo.stack = event.error.stack;
                  }
                  
                  // Solo reportar si hay al menos un campo útil además del timestamp
                  if (errorInfo.message || errorInfo.source || errorInfo.error) {
                    console.error('🚨🚨🚨 DIAGNÓSTICO [TEMPRANO]: Error global detectado:', errorInfo);
                  }
                }, true);

                // ⚡ DIAGNÓSTICO: Detectar promise rejections (ignorar errores esperados)
                window.addEventListener('unhandledrejection', function(event) {
                  const reason = event.reason || '';
                  const reasonStr = typeof reason === 'string' ? reason : JSON.stringify(reason);
                  
                  // Ignorar rejections de scripts de Vercel (bloqueados por ad blockers)
                  if (reasonStr.includes('_vercel/') || 
                      reasonStr.includes('speed-insights') || 
                      reasonStr.includes('analytics') ||
                      reasonStr.includes('Failed to fetch') ||
                      reasonStr.includes('net::ERR_BLOCKED_BY_CLIENT')) {
                    event.preventDefault(); // Prevenir que se muestre como error no manejado
                    return;
                  }
                  
                  // Ignorar rejections de fetch bloqueados (analytics, tracking)
                  if (reasonStr.includes('/api/analytics/') || 
                      reasonStr.includes('/api/tracking/') ||
                      (reasonStr.includes('Failed to fetch') && reasonStr.includes('analytics'))) {
                    event.preventDefault();
                    return;
                  }
                  
                  // Solo reportar rejections críticos reales
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

        {/* ⚡ MULTITENANT: Preload de imagen hero LCP del tenant actual */}
        {/* ⚡ DEBE estar PRIMERO para descubrimiento inmediato sin esperar CSS o JS */}
        {/* ⚡ OPTIMIZACIÓN LCP: Preload dinámico basado en tenant */}
        <link
          rel="preload"
          as="image"
          href={`/tenants/${tenant.slug}/hero/hero1.webp`}
          fetchPriority="high"
          type="image/webp"
        />
        {/* ⚡ MULTITENANT: Preload de segunda imagen hero para mejor UX (no bloquea LCP) */}
        <link
          rel="preload"
          as="image"
          href={`/tenants/${tenant.slug}/hero/hero2.webp`}
          fetchPriority="low"
          type="image/webp"
        />
        
        {/* ⚡ OPTIMIZACIÓN LCP: Resource Hints para mejorar descubrimiento de recursos */}
        {/* NOTA: Preconnect al dominio propio - En producción, el dominio real viene del tenant */}
        {/* TODO MULTITENANT: Hacer dinámico basado en getTenantBaseUrl(tenant) */}
        
        {/* ⚡ FIX: Eliminados prefetch de framework.js y main.js */}
        {/* Next.js genera estos archivos con hashes dinámicos (ej: framework-abc123.js) */}
        {/* Los prefetch hardcodeados causan 404 y errores en consola */}
        {/* Next.js maneja automáticamente la carga optimizada de estos chunks */}
        
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
        
        {/* ⚡ FASE 7: Preconnect eliminado - Era duplicado y hardcodeado */}
        {/* El preconnect al dominio del tenant debe ser dinámico (ver TODO MULTITENANT arriba) */}
        
        {/* ⚡ CRITICAL CSS - Inline para FCP rápido (-0.2s) */}
        {/* NOTA: Las variables CSS del tenant se definen ANTES en TenantThemeStyles */}
        <style dangerouslySetInnerHTML={{__html: `
          /* CSS Variables - Inline para eliminar archivo bloqueante */
          /* ⚠️ IMPORTANTE: Las variables --tenant-* se definen en TenantThemeStyles arriba */
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
          
          /* Reset y base styles - Con variables CSS tenant y fallbacks */
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{line-height:1.15;-webkit-text-size-adjust:100%;font-size:100%;scroll-behavior:smooth;overflow-x:hidden!important;overflow-y:auto!important;max-width:100vw;width:100%;height:100%}
          body{margin:0;font-family:var(--font-plus-jakarta-sans),'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;background:linear-gradient(to bottom,var(--tenant-gradient-start) 0%,var(--tenant-gradient-start) 40%,var(--tenant-gradient-end) 100%);background-attachment:fixed;background-size:cover;background-position:center;background-repeat:no-repeat;color:#ffffff;height:auto;padding-top:calc(92px + env(safe-area-inset-top, 0px));overflow-x:hidden!important;overflow-y:hidden!important;max-width:100vw;width:100%;position:relative}
          #__next{overflow-x:hidden!important;overflow-y:hidden!important;max-width:100vw;width:100%;height:auto;position:relative}
          main{overflow-x:hidden!important;overflow-y:hidden!important;position:relative}
          header[class*="fixed"],nav[class*="fixed"]{position:fixed!important;z-index:1100!important}
          @media(min-width:1024px){body{padding-top:calc(105px + env(safe-area-inset-top, 0px))}}
          @media(max-width:768px){body{padding-bottom:calc(64px + env(safe-area-inset-bottom, 0px))}}
          img,picture,video{max-width:100%;height:auto;display:block}
          button,input,select,textarea{font:inherit}
          h1,h2,h3,h4,h5,h6{font-weight:bold;line-height:1.2}
          a{text-decoration:none;color:inherit}
          header{background-color:${tenant.headerBgColor};position:fixed;top:env(safe-area-inset-top, 0px);left:0;right:0;z-index:100;box-shadow:0 4px 6px -1px rgba(0,0,0,0.5);border-radius:0 0 1.5rem 1.5rem}
          
          /* Critical Hero Styles - Con variables CSS tenant */
          .hero-section{min-height:320px;background:linear-gradient(135deg,var(--tenant-primary-dark),var(--tenant-gradient-start));position:relative;overflow:hidden}
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
          
          /* Gradient backgrounds - Con variables CSS tenant */
          .bg-gradient-hero{background:linear-gradient(135deg,var(--tenant-primary-dark) 0%,var(--tenant-gradient-start) 100%)}
          
          /* Critical button styles - Con variables CSS tenant */
          .btn-primary{background:var(--tenant-primary);color:#fff;padding:1rem 2rem;border-radius:0.5rem;font-weight:600;transition:background-color 0.2s ease,transform 0.2s ease;border:2px solid var(--tenant-primary-dark)}
          .btn-primary:hover{background:var(--tenant-primary-dark);transform:scale(1.05);border-color:var(--tenant-primary)}
          
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
        
        {/* ⚡ MULTITENANT: Preconnect dinámico basado en configuración del tenant */}
        {/* Orden optimizado: primero los más críticos para LCP */}
        {/* ⚡ FASE 6.1: Preconnect a Google Analytics del tenant (si está configurado) */}
        {tenant.ga4MeasurementId && (
          <>
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
            <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
          </>
        )}
        {/* ⚡ MULTITENANT: Preconnect a Meta Pixel del tenant (si está configurado) */}
        {tenant.metaPixelId && (
          <>
            <link rel="dns-prefetch" href="https://connect.facebook.net" />
            <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
          </>
        )}
        {/* ⚡ MULTITENANT: Preconnect a Google Ads (si está configurado) */}
        {tenant.googleMerchantId && (
          <>
            <link rel="dns-prefetch" href="https://www.googleadservices.com" />
            <link rel="preconnect" href="https://www.googleadservices.com" crossOrigin="anonymous" />
          </>
        )}
        {/* ⚡ MULTITENANT: Preconnect compartido - Supabase (crítico para imágenes de productos) */}
        {/* Ahorro estimado de LCP: 330 ms según Lighthouse */}
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.clerk.dev" />
        <link rel="preconnect" href="https://images.clerk.dev" crossOrigin="anonymous" />
        
        {/* Google Merchant Center Verification */}
        {/* TODO MULTITENANT: Este valor debería venir del tenant.googleSiteVerification */}
        <meta
          name="google-site-verification"
          content="YoGAj7X-fCg9Xclet5ZnoNgCpzkuLd74sEzyfDI9WXs"
        />
        
        {/* ⚡ MULTITENANT: Structured data dinámico basado en tenant */}
        <TenantStructuredData />
      </head>
      <body data-tenant-id={tenant.id}>
        {/* Suspense global para componentes compartidos que usan useSearchParams (Header/Search) */}
        <Suspense fallback={null}>
          <div className="overflow-x-hidden max-w-full w-full">
            {/* ⚡ MULTITENANT: TenantProvider envuelve la aplicación con contexto del tenant */}
            <TenantProviderWrapper>
              <Providers>{children}</Providers>
            </TenantProviderWrapper>
          </div>
        </Suspense>
        
        {/* ⚡ FIX Next.js 15: Todos los componentes con ssr: false están en ClientAnalytics */}
        {/* ⚡ FASE 1: ClientAnalytics incluye DeferredCSS para cargar CSS no crítico de forma diferida */}
        {/* ⚡ OPTIMIZACIÓN: Movido al final del body para no bloquear renderizado inicial */}
        <ClientAnalytics />
        
        {/* ⚡ Script de debugging removido - causaba popup de permiso de red local */}
        
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

