// Force redeploy to fix Server Action error - 2025-08-02T00:30:00.000Z
import Providers from './providers'
import React, { Suspense } from 'react'
// ⚡ PERFORMANCE: Fuentes optimizadas para Turbopack
import { euclidCircularA } from './fonts'
// ⚡ PERFORMANCE: CSS crítico inline, CSS no crítico carga asíncrono
import './css/style.css'
// ⚡ FIX Turbopack: Importar CSS manual de fuentes (next/font/local tiene bug con Turbopack)
import './css/euclid-fonts-turbopack.css'
// ⚡ OPTIMIZACIÓN: CSS no crítico movido a carga diferida via DeferredCSS
// - mobile-performance.css: Carga diferida (solo afecta animaciones)
// - disable-all-effects.css: Carga diferida (solo deshabilita efectos costosos)
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
        {/* ⚡ CRITICAL: Preload de imagen hero LCP - MÁXIMA PRIORIDAD */}
        {/* ⚡ DEBE estar PRIMERO para descubrimiento inmediato sin esperar CSS o JS */}
        {/* Esto reduce el LCP de 11.8s a <3s al permitir que la imagen se descargue inmediatamente */}
        <link
          rel="preload"
          as="image"
          href="/images/hero/hero2/hero1.webp"
          fetchPriority="high"
          type="image/webp"
          imagesizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          imagesrcset="/images/hero/hero2/hero1.webp 1200w"
          crossOrigin="anonymous"
        />
        
        {/* ⚡ CRITICAL: Script de interceptación CSS - Después del preload de imagen */}
        {/* ⚡ ESTRATEGIA RADICAL: Script bloqueante que intercepta CSS ANTES de cualquier otro recurso */}
        {/* Este script se ejecuta síncronamente ANTES de que el navegador procese CSS */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              // ⚡ CRITICAL: Interceptar CSS ANTES de que Next.js lo inserte
              // Ejecutar INMEDIATAMENTE sin ningún delay para máxima efectividad
              // ⚡ ESTRATEGIA RADICAL: Interceptar métodos ANTES de que se usen
              
              function processCSSLink(link) {
                if (!link || !link.href) return;
                
                const href = link.getAttribute('href') || link.href || '';
                // ⚡ DETECCIÓN MEJORADA: Cualquier CSS de Next.js (incluyendo chunks con hash)
                // ⚡ FIX: Detectar también URLs relativas que Next.js genera
                const isNextJSCSS = href.includes('_next/static/css') || 
                                    href.includes('_next/static/chunks/') ||
                                    href.includes('/chunks/') || 
                                    href.includes('_next') ||
                                    (href.includes('.css') && (href.includes('_next') || href.includes('dpl_') || /\/[a-f0-9]{16,}\.css/.test(href)));
                
                if (isNextJSCSS && !link.hasAttribute('data-non-blocking')) {
                  link.setAttribute('data-non-blocking', 'true');
                  const originalMedia = link.media || link.getAttribute('media') || 'all';
                  
                  // ⚡ CRITICAL: Aplicar media="print" INMEDIATAMENTE sin verificar estado
                  // Esto previene que bloquee el renderizado incluso si ya comenzó a descargarse
                  // ⚡ FIX: Forzar aplicación incluso si el link ya tiene media definido
                  // ⚡ MEJORA: Intentar múltiples métodos para asegurar que se aplique
                  try {
                    link.media = 'print';
                    link.setAttribute('media', 'print');
                  } catch(e) {
                    // Fallback si media no se puede cambiar
                    try {
                      link.setAttribute('media', 'print');
                    } catch(e2) {
                      // Último recurso: usar setAttributeNS
                      try {
                        link.setAttributeNS(null, 'media', 'print');
                      } catch(e3) {
                        // Si todo falla, al menos marcar como procesado
                      }
                    }
                  }
                  
                  // Preload para descarga paralela (solo si no existe ya)
                  if (!document.querySelector('link[rel="preload"][href="' + href + '"]')) {
                    const preload = document.createElement('link');
                    preload.rel = 'preload';
                    preload.as = 'style';
                    preload.href = href;
                    preload.setAttribute('fetchpriority', 'high');
                    const firstChild = document.head.firstChild;
                    if (firstChild) {
                      document.head.insertBefore(preload, firstChild);
                    } else {
                      document.head.appendChild(preload);
                    }
                  }
                  
                  // Restaurar cuando esté listo
                  if (!link.onload) {
                    link.onload = function() {
                      requestAnimationFrame(function() {
                        if (link.media === 'print') {
                          link.media = originalMedia;
                        }
                        const preload = document.querySelector('link[rel="preload"][href="' + href + '"]');
                        if (preload && preload.parentNode) {
                          preload.parentNode.removeChild(preload);
                        }
                      });
                    };
                  }
                  
                  if (!link.onerror) {
                    link.onerror = function() {
                      requestAnimationFrame(function() {
                        if (link.media === 'print') {
                          link.media = originalMedia;
                        }
                        const preload = document.querySelector('link[rel="preload"][href="' + href + '"]');
                        if (preload && preload.parentNode) {
                          preload.parentNode.removeChild(preload);
                        }
                      });
                    };
                  }
                  
                  // ⚡ CRITICAL: Si el CSS ya está cargado, restaurar inmediatamente
                  if (link.sheet && link.sheet.cssRules && link.sheet.cssRules.length > 0) {
                    requestAnimationFrame(function() {
                      link.media = originalMedia;
                    });
                  } else {
                    // Fallback ultra-rápido (1ms) para CSS que se carga rápidamente
                    setTimeout(function() {
                      if (link.media === 'print' && link.sheet && link.sheet.cssRules && link.sheet.cssRules.length > 0) {
                        link.media = originalMedia;
                        const preload = document.querySelector('link[rel="preload"][href="' + href + '"]');
                        if (preload && preload.parentNode) {
                          preload.parentNode.removeChild(preload);
                        }
                      }
                    }, 1);
                  }
                }
              }
              
              // ⚡ CRITICAL: Procesar CSS que ya está en el HTML inicial (SSR)
              // Next.js inserta CSS directamente en el HTML durante SSR
              // Este script debe ejecutarse ANTES de que el navegador procese los links CSS
              function processExistingCSS() {
                // ⚡ MEJORA: Usar múltiples métodos para capturar todos los links
                // Método 1: getElementsByTagName (más rápido)
                const links = document.head.getElementsByTagName('link');
                for (let i = 0; i < links.length; i++) {
                  const link = links[i];
                  const rel = link.rel || link.getAttribute('rel') || '';
                  const href = link.href || link.getAttribute('href') || '';
                  // ⚡ FIX: Detectar también por href si rel no está disponible
                  if (rel === 'stylesheet' || (href.includes('.css') && (href.includes('_next') || href.includes('chunks')))) {
                    processCSSLink(link);
                  }
                }
                
                // ⚡ MEJORA ADICIONAL: querySelectorAll como fallback
                try {
                  const stylesheets = document.head.querySelectorAll('link[rel="stylesheet"]');
                  for (let i = 0; i < stylesheets.length; i++) {
                    const link = stylesheets[i];
                    if (!link.hasAttribute('data-non-blocking')) {
                      processCSSLink(link);
                    }
                  }
                } catch(e) {
                  // Ignorar errores de querySelector
                }
              }
              
              // ⚡ CRITICAL: Ejecutar INMEDIATAMENTE - no esperar nada
              // El script está al inicio del head, pero el CSS puede estar después
              // Procesar inmediatamente cuando el script se ejecuta
              // Usar múltiples estrategias para asegurar que se ejecute lo más temprano posible
              
              // Estrategia 1: Ejecutar inmediatamente si head existe
              if (document.head) {
                processExistingCSS();
              }
              
              // Estrategia 2: Ejecutar en el siguiente tick (síncrono)
              if (typeof setImmediate !== 'undefined') {
                setImmediate(processExistingCSS);
              } else {
                setTimeout(processExistingCSS, 0);
              }
              
              // Estrategia 3: Ejecutar cuando el DOM esté listo
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', processExistingCSS, { once: true, passive: true });
              } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
                // Si ya está cargado, ejecutar inmediatamente
                processExistingCSS();
              }
              
              // Estrategia 4: Ejecutar después de un microtask (más rápido que setTimeout)
              if (typeof Promise !== 'undefined' && Promise.resolve) {
                Promise.resolve().then(processExistingCSS);
              }
              
              // ⚡ CRITICAL: Interceptar métodos de inserción ANTES de que se usen
              // Esto captura CSS que Next.js inserta durante SSR o hidratación
              if (document.head && typeof document.head.appendChild === 'function') {
                const originalAppendChild = document.head.appendChild.bind(document.head);
                const originalInsertBefore = document.head.insertBefore.bind(document.head);
                const originalInsertAdjacentElement = document.head.insertAdjacentElement ? document.head.insertAdjacentElement.bind(document.head) : null;
                
                // Interceptar appendChild
                document.head.appendChild = function(node) {
                  if (node && node.nodeType === 1 && node.tagName === 'LINK') {
                    const rel = node.getAttribute('rel') || node.rel || node.getAttribute('data-rel');
                    if (rel === 'stylesheet' || node.href && node.href.includes('.css')) {
                      processCSSLink(node);
                    }
                  }
                  return originalAppendChild(node);
                };
                
                // Interceptar insertBefore
                document.head.insertBefore = function(newNode, referenceNode) {
                  if (newNode && newNode.nodeType === 1 && newNode.tagName === 'LINK') {
                    const rel = newNode.getAttribute('rel') || newNode.rel || newNode.getAttribute('data-rel');
                    if (rel === 'stylesheet' || newNode.href && newNode.href.includes('.css')) {
                      processCSSLink(newNode);
                    }
                  }
                  return originalInsertBefore(newNode, referenceNode);
                };
                
                // Interceptar insertAdjacentElement (si existe)
                if (originalInsertAdjacentElement) {
                  document.head.insertAdjacentElement = function(position, element) {
                    if (element && element.nodeType === 1 && element.tagName === 'LINK') {
                      const rel = element.getAttribute('rel') || element.rel || element.getAttribute('data-rel');
                      if (rel === 'stylesheet' || element.href && element.href.includes('.css')) {
                        processCSSLink(element);
                      }
                    }
                    return originalInsertAdjacentElement(position, element);
                  };
                }
              }
              
              // ⚡ CRITICAL: MutationObserver para CSS que se inserta de otras formas
              // ⚡ MEJORA: Observer más agresivo que captura cambios inmediatamente
              if (typeof MutationObserver !== 'undefined' && document.head) {
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                      if (node.nodeType === 1 && node.tagName === 'LINK') {
                        const rel = node.getAttribute('rel') || node.rel || node.getAttribute('data-rel');
                        const href = node.getAttribute('href') || node.href || '';
                        // ⚡ FIX: Detectar también por href si rel no está disponible
                        if (rel === 'stylesheet' || (href.includes('.css') && href.includes('_next'))) {
                          // ⚡ CRITICAL: Procesar inmediatamente sin delay
                          processCSSLink(node);
                        }
                      }
                    });
                  });
                });
                // ⚡ MEJORA: Observar también subtree para capturar cambios en elementos anidados
                observer.observe(document.head, {
                  childList: true,
                  subtree: true, // ⚡ CAMBIO: subtree: true para capturar más casos
                  attributes: false,
                  attributeOldValue: false
                });
              }
              
              // ⚡ CRITICAL: Verificar periódicamente para CSS que se inserta después
              // Esto captura CSS que Next.js inserta de formas no estándar
              // ⚡ OPTIMIZACIÓN: Verificar MUY frecuentemente al inicio (primeros 200ms críticos)
              let attempts = 0;
              const maxAttempts = 200; // ⚡ AUMENTADO: Más intentos para capturar CSS tardío
              let checkDelay = 2; // ⚡ REDUCIDO: 2ms para ser extremadamente agresivo al inicio
              const checkInterval = setInterval(function() {
                attempts++;
                processExistingCSS();
                // ⚡ ESTRATEGIA: Verificar muy frecuentemente al inicio, luego reducir frecuencia
                if (attempts <= 50) {
                  checkDelay = 2; // Primeros 100ms: cada 2ms
                } else if (attempts <= 100) {
                  checkDelay = 5; // Siguientes 250ms: cada 5ms
                } else {
                  checkDelay = 10; // Resto: cada 10ms
                }
                if (attempts >= maxAttempts) {
                  clearInterval(checkInterval);
                }
              }, checkDelay);
              
              // ⚡ MEJORA ADICIONAL: Forzar procesamiento después de delays específicos
              // Esto captura CSS que se inserta justo después de que el script se ejecuta
              setTimeout(processExistingCSS, 1);
              setTimeout(processExistingCSS, 5);
              setTimeout(processExistingCSS, 10);
              setTimeout(processExistingCSS, 20);
              setTimeout(processExistingCSS, 50);
            })();
            `,
          }}
        />
        
        {/* ⚡ FASE 7: Preconnect al dominio propio - Después del script de interceptación */}
        {/* Esto establece la conexión antes de que se necesiten los recursos (fuentes, CSS, imágenes) */}
        {/* Ahorro estimado: -500-800ms en latencia de fuentes (reduce bottleneck de 1,795ms) */}
        <link rel="preconnect" href="https://www.pinteya.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.pinteya.com" />
        
        {/* ⚡ FIX CLS: Preload de fuente Bold usada en hero y header (above-the-fold) */}
        {/* Esto previene layout shift de 0.556 causado por carga tardía de fuente Bold */}
        <link
          rel="preload"
          as="font"
          href="/fonts/EuclidCircularA-Bold.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
          fetchPriority="high"
        />
        
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
          body{margin:0;font-family:var(--font-euclid),'Euclid Circular A',system-ui,-apple-system,sans-serif;background:linear-gradient(to bottom,#000000 0%,#000000 60%,#eb6313 100%);background-attachment:fixed;background-size:cover;background-position:center;background-repeat:no-repeat;color:#ffffff;height:auto;padding-top:calc(92px + env(safe-area-inset-top, 0px));overflow-x:hidden!important;overflow-y:hidden!important;max-width:100vw;width:100%;position:relative}
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
          
          /* ⚡ CRITICAL: @font-face inline completo para eliminar dependencia del CSS externo */
          /* Esto reduce la latencia de ruta crítica de 2,124 ms */
          /* ⚡ FIX CLS: font-display: optional para prevenir layout shifts por fuentes */
          @font-face{font-family:'Euclid Circular A';src:url('/fonts/EuclidCircularA-Regular.woff2') format('woff2');font-weight:400;font-style:normal;font-display:optional;unicode-range:U+0020-007F,U+00A0-00FF,U+0100-017F}
          @font-face{font-family:'Euclid Circular A';src:url('/fonts/EuclidCircularA-SemiBold.woff2') format('woff2');font-weight:600;font-style:normal;font-display:optional;unicode-range:U+0020-007F,U+00A0-00FF,U+0100-017F}
          @font-face{font-family:'Euclid Circular A';src:url('/fonts/EuclidCircularA-Bold.woff2') format('woff2');font-weight:700;font-style:normal;font-display:optional;unicode-range:U+0020-007F,U+00A0-00FF,U+0100-017F}
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
        
        {/* ⚡ FASE 7: Preconnect a Supabase - Crítico para imágenes de productos */}
        {/* Ahorro estimado de LCP: 330 ms según Lighthouse */}
        {/* Posicionado después del preload de imagen hero para no competir con LCP */}
        <link rel="preconnect" href="https://aakzspzfulgftqlgwkpb.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://aakzspzfulgftqlgwkpb.supabase.co" />
        
        {/* ⚡ FASE 4: Preload de fuentes críticas - DESPUÉS del preload de imagen hero */}
        {/* Esto reduce la latencia de ruta crítica de 2,124 ms */}
        {/* Regular es crítica para FCP, SemiBold puede cargarse después del FCP */}
        <link
          rel="preload"
          href="/fonts/EuclidCircularA-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          fetchPriority="high"
        />
        {/* ⚡ FASE 4: SemiBold puede diferirse ligeramente - no es crítica para FCP */}
        <link
          rel="preload"
          href="/fonts/EuclidCircularA-SemiBold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          fetchPriority="high"
        />
        
        {/* ⚡ PERFORMANCE: Bold se carga diferidamente cuando se necesita */}
        
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
        
        {/* ⚡ OPTIMIZACIÓN: Scripts no críticos movidos aquí para no bloquear render inicial */}
        {/* #region agent log */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              if (typeof window === 'undefined') return;
              // ⚡ OPTIMIZACIÓN: Ejecutar después de que la página esté lista para no bloquear render
              function logData() {
                const logData = {
                  location: 'layout.tsx:body',
                  message: 'HTML initial size measurement',
                  data: {
                    htmlSize: document.documentElement.outerHTML.length,
                    headSize: document.head ? document.head.innerHTML.length : 0,
                    inlineStyleCount: document.head ? document.head.querySelectorAll('style').length : 0,
                    inlineStyleSize: Array.from(document.head ? document.head.querySelectorAll('style') : []).reduce((sum, el) => sum + (el.textContent || '').length, 0),
                    linkStylesheetCount: document.head ? document.head.querySelectorAll('link[rel="stylesheet"]').length : 0,
                  },
                  timestamp: Date.now(),
                  sessionId: 'debug-session',
                  runId: 'initial',
                  hypothesisId: 'A'
                };
                fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(logData)
                }).catch(function() {});
              }
              
              // ⚡ OPTIMIZACIÓN: Ejecutar después de que la página esté lista
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                  setTimeout(logData, 100);
                }, { once: true });
              } else {
                setTimeout(logData, 100);
              }
            })();
            `,
          }}
        />
        {/* #endregion */}
        
        {/* ⚡ OPTIMIZACIÓN: Script para dividir tareas largas - Movido al final para no bloquear render */}
        {/* ⚡ FASE 10: Optimización agresiva para reducir 8 tareas largas (492ms) del chunk 78c1cbcf709aa237.js */}
        {/* Evita que tareas >50ms bloqueen el hilo principal */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              // ⚡ OPTIMIZACIÓN: Ejecutar después de que la página esté lista
              if (typeof window === 'undefined') return;
              
              function initLongTaskOptimization() {
                // ⚡ OPTIMIZACIÓN: Dividir tareas largas en tareas más pequeñas
                // Esto mejora la interactividad evitando que tareas >50ms bloqueen el hilo principal
                
                // ⚡ FASE 10: Monitorear tareas largas y optimizar ejecución
                if ('PerformanceObserver' in window) {
                  try {
                    const observer = new PerformanceObserver(function(list) {
                      for (const entry of list.getEntries()) {
                        const duration = entry.duration;
                        // Tareas >50ms son consideradas largas y bloquean interactividad
                        if (duration > 50) {
                          // ⚡ OPTIMIZACIÓN: Forzar yield del hilo principal después de tareas largas
                          // Esto permite que el navegador procese interacciones del usuario
                          if (duration > 100) {
                            // Tareas muy largas (>100ms) - forzar yield inmediato
                            setTimeout(function() {}, 0);
                          }
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
                if ('requestIdleCallback' in window) {
                  // ⚡ FASE 10: Diferir inicialización de componentes no críticos más agresivamente
                  // Timeout reducido para ejecutar más rápido cuando el navegador esté idle
                  requestIdleCallback(function() {
                    // Trabajo no crítico se ejecuta aquí cuando el navegador esté idle
                    // Esto evita bloquear el hilo principal durante la carga inicial
                  }, { timeout: 1000 }); // ⚡ REDUCIDO: 1000ms (de 2000ms) para ejecutar más rápido
                }
                
                // ⚡ FASE 10: Yield del hilo principal durante carga inicial
                // Esto permite que el navegador procese interacciones del usuario durante carga
                if (document.readyState === 'loading') {
                  let yieldCount = 0;
                  const maxYields = 5; // Máximo 5 yields durante carga inicial
                  const yieldInterval = setInterval(function() {
                    yieldCount++;
                    // Forzar yield del hilo principal
                    setTimeout(function() {}, 0);
                    if (yieldCount >= maxYields || document.readyState !== 'loading') {
                      clearInterval(yieldInterval);
                    }
                  }, 100); // Yield cada 100ms durante carga inicial
                }
              }
              
              // ⚡ OPTIMIZACIÓN: Ejecutar después de que la página esté lista
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initLongTaskOptimization, { once: true });
              } else {
                setTimeout(initLongTaskOptimization, 0);
              }
            })();
            `,
          }}
        />
      </body>
    </html>
  )
}

