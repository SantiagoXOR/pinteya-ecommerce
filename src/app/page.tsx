import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Image from 'next/image'
// ⚡ FASE 1: CSS glassmorphism movido a carga diferida via DeferredCSS (solo en desktop)
import { createPublicClient } from '@/lib/integrations/supabase/server'
import { Category } from '@/types/database'
import { QueryClient, dehydrate, Hydrate } from '@tanstack/react-query'
import { productQueryKeys } from '@/hooks/queries/productQueryKeys'

// ⚡ FASE 19: Lazy load de HomeV3 para reducir bundle inicial y bloqueo del main thread
// Esto permite que la imagen hero se cargue primero sin esperar el JavaScript de HomeV3
const HomeV3 = dynamic(() => import('@/components/Home-v3'), {
  ssr: true, // Mantener SSR para SEO
  loading: () => null, // No mostrar loading, la imagen hero ya está visible
})

// ⚡ FASE 23: HeroOptimized se carga dinámicamente para reducir bundle inicial
// El carousel se renderiza después del LCP, pero el componente debe estar disponible
// ⚡ FIX: ssr: true es requerido en Server Components, pero HeroOptimized es Client Component
// El componente se hidratará en el cliente y no mostrará el carousel hasta que se monte
const HeroOptimized = dynamic(() => import('@/components/Home-v3/HeroOptimized'), {
  ssr: true, // Requerido en Server Components - el componente se hidratará en el cliente
  loading: () => null, // No mostrar loading, la imagen estática ya está visible
})

export const metadata: Metadata = {
  title: 'Pinteya - Tu Pinturería Online | Envío Gratis +$50.000',
  description:
    'Descubre la mejor selección de pinturas, herramientas y productos de ferretería. Marcas reconocidas como Sherwin Williams, Petrilac, Sinteplast y más. Envío gratis en compras superiores a $50.000.',
  keywords: [
    'pinturería online',
    'pinturas',
    'ferretería',
    'corralón',
    'Sherwin Williams',
    'Petrilac',
    'Sinteplast',
    'Plavicon',
    'herramientas',
    'construcción',
    'decoración',
    'envío gratis',
    'Argentina',
  ],
  openGraph: {
    title: 'Pinteya - Tu Pinturería Online | Las Mejores Marcas',
    description:
      'Descubre la mejor selección de pinturas, herramientas y productos de ferretería en Pinteya. Marcas reconocidas y envío gratis en compras superiores a $50.000.',
    images: [
      {
        url: '/images/hero/hero-bg.jpg',
        width: 1200,
        height: 630,
        alt: 'Pinteya - Tu Pinturería Online',
      },
    ],
  },
}

// ⚡ PERFORMANCE: ISR - Revalidar cada 60 segundos para mejor cache
// ✅ Home-v3 configurado como ruta principal
export const revalidate = 60

// ⚡ OPTIMIZACIÓN CRÍTICA: Pre-cargar categorías en el servidor para evitar re-renders
// Usa createPublicClient (sin cookies) para permitir renderizado estático (ISR)
async function getCategoriesServerSide(): Promise<Category[]> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .limit(50) // Limitar para performance

    if (error) {
      console.error('Error obteniendo categorías en servidor:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error en getCategoriesServerSide:', error)
    return []
  }
}

export default async function HomePage() {
  // ⚡ OPTIMIZACIÓN CRÍTICA: Pre-cargar categorías en el servidor
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 60 * 1000, // 10 minutos
        // gcTime se usa en React Query v5, cacheTime en v4
        // @ts-ignore - Compatibilidad con diferentes versiones
        gcTime: 30 * 60 * 1000, // 30 minutos
      },
    },
  })

  // Pre-fetch categorías en el servidor
  const categories = await getCategoriesServerSide()
  
  // Pre-popular el cache de React Query con las categorías
  queryClient.setQueryData(
    productQueryKeys.categoryListWithFilters({}),
    categories
  )

  // ⚡ OPTIMIZACIÓN: Prefetching removido del servidor
  // Los hooks optimizados (useFilteredProducts, useBestSellerProducts) ya manejan el cache
  // y no harán peticiones duplicadas gracias a refetchOnMount: false y staleTime aumentado
  // El prefetching en el servidor requiere URLs absolutas y no es necesario ya que React Query
  // manejará el cache automáticamente en el cliente

  return (
    <Hydrate state={dehydrate(queryClient)}>
      {/* ⚡ FASE 2: Imagen hero renderizada en Server Component para descubrimiento temprano */}
      {/* ⚡ OPTIMIZACIÓN LCP: Contenedores simplificados para reducir delay de renderizado */}
      {/* ⚡ CRITICAL: Esta imagen DEBE permanecer visible para que Lighthouse la detecte como LCP */}
      {/* ⚡ LCP FIX: Contenedor simplificado con altura mínima para prevenir CLS y asegurar visibilidad */}
      {/* ⚡ FIX CLS + LCP: Contenedor con dimensiones fijas y posición en viewport */}
      <div 
        className="relative w-full hero-lcp-container" 
        style={{ 
          marginTop: 0, 
          position: 'relative',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.25rem 0.5rem',
          overflow: 'hidden', // ⚡ FIX CLS: Prevenir overflow que cause shifts
          // ⚡ FIX LCP: Asegurar que esté en el viewport inicialmente
          scrollMarginTop: '0px',
        }}
      >
        {/* ⚡ FIX CLS CRÍTICO: Contenedor con dimensiones ABSOLUTAS fijas desde el inicio */}
        {/* ⚡ CRITICAL: Altura fija calculada para prevenir cualquier layout shift */}
        <div 
          className="relative w-full" 
          style={{ 
            aspectRatio: '1200/433', 
            width: '100%',
            height: 'clamp(277px, calc(100vw * 433 / 1200), 433px)', // ⚡ FIX CLS: Altura fija calculada
            minHeight: '277px', // Mobile: mínimo 277px
            maxHeight: '433px', // Desktop: máximo 433px
            position: 'relative',
            overflow: 'hidden',
            display: 'block', // ⚡ FIX CLS: display block explícito
          }}
        >
          {/* ⚡ FIX CLS + LCP: Imagen hero con dimensiones ABSOLUTAS fijas */}
          {/* ⚡ CRITICAL: Dimensiones fijas previenen layout shifts y aseguran detección LCP */}
          {/* ⚡ OPTIMIZACIÓN PRODUCCIÓN: Asegurar que la imagen se carga inmediatamente sin bloqueos */}
          <img
            src="/images/hero/hero2/hero1.webp"
            alt="Pintá rápido, fácil y cotiza al instante - Pinteya"
            width={1200}
            height={433}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="hero-static-image"
            id="hero-lcp-image"
            data-lcp="true"
            data-hero="true"
            data-largest-contentful-paint="true"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            srcSet="/images/hero/hero2/hero1.webp 1200w"
            style={{ 
              width: '100%', 
              height: '100%', // ⚡ FIX CLS CRÍTICO: height 100% en lugar de auto
              aspectRatio: '1200/433',
              objectFit: 'cover', // ⚡ FIX CLS: cover en lugar de contain para evitar shifts
              display: 'block',
              position: 'absolute', // ⚡ FIX CLS: absolute para no afectar layout
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              visibility: 'visible',
              opacity: 1,
              pointerEvents: 'auto',
              margin: 0,
              padding: 0,
              clipPath: 'none',
              clip: 'auto',
            }}
          />
          {/* ⚡ FASE 2: HeroOptimized renderiza el carousel aquí, en el mismo contenedor */}
          <HeroOptimized />
        </div>
      </div>
      <HomeV3 />
      {/* #region agent log */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          (function() {
            if (typeof window === 'undefined') return;
            const logEndpoint = 'http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d';
            function log(data) {
              const payload = {
                location: data.location || 'unknown',
                message: data.message || 'unknown',
                data: data.data || {},
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'lcp-cls-investigation',
                hypothesisId: data.hypothesisId || 'unknown'
              };
              fetch(logEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              }).catch(function() {});
            }
            // Log inicial para verificar que el script se ejecuta
            log({location: 'page.tsx:script:init', message: 'Script initialized', data: {timeSincePageLoad: performance.now()}, hypothesisId: 'INIT'});
            // H1: Verificar visibilidad inicial de imagen hero
            function logHeroImageData(message, hypothesisId) {
              const img = document.getElementById('hero-lcp-image');
              if (!img) {
                log({location: 'page.tsx:script:heroImage', message: 'Hero image not found', data: {}, hypothesisId: hypothesisId});
                return;
              }
              const rect = img.getBoundingClientRect();
              const styles = window.getComputedStyle(img);
              const container = img.closest('.hero-lcp-container');
              const containerRect = container ? container.getBoundingClientRect() : null;
              log({
                location: 'page.tsx:script:heroImage',
                message: message,
                data: {
                  timeSincePageLoad: performance.now(),
                  isVisible: img.offsetWidth > 0 && img.offsetHeight > 0,
                  inViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
                  viewportHeight: window.innerHeight,
                  viewportWidth: window.innerWidth,
                  opacity: styles.opacity,
                  zIndex: styles.zIndex,
                  position: styles.position,
                  display: styles.display,
                  visibility: styles.visibility,
                  width: rect.width,
                  height: rect.height,
                  top: rect.top,
                  left: rect.left,
                  bottom: rect.bottom,
                  right: rect.right,
                  complete: img.complete,
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight,
                  containerTop: containerRect ? containerRect.top : null,
                  containerHeight: containerRect ? containerRect.height : null,
                  elementsAbove: document.elementsFromPoint(rect.left + rect.width/2, rect.top + rect.height/2).filter(el => el !== img && el !== container).map(el => ({tag: el.tagName, id: el.id, className: el.className})).slice(0, 5)
                },
                hypothesisId: hypothesisId
              });
            }
            // H2: Verificar preload y tiempo de carga
            function logPreloadStatus() {
              const preloads = Array.from(document.querySelectorAll('link[rel="preload"][as="image"]'));
              const heroPreload = preloads.find(p => p.href && p.href.includes('hero1.webp'));
              log({
                location: 'page.tsx:script:preload',
                message: 'Preload status check',
                data: {
                  timeSincePageLoad: performance.now(),
                  heroPreloadExists: !!heroPreload,
                  heroPreloadHref: heroPreload ? heroPreload.href : null,
                  allPreloads: preloads.map(p => ({href: p.href, as: p.as}))
                },
                hypothesisId: 'H2'
              });
            }
            // H3: Detectar otros candidatos LCP
            function logLCPCandidates() {
              const images = Array.from(document.querySelectorAll('img'));
              const textElements = Array.from(document.querySelectorAll('h1, h2, h3, p, span')).filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top < window.innerHeight;
              });
              const candidates = [];
              images.forEach(img => {
                const rect = img.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top < window.innerHeight) {
                  candidates.push({
                    type: 'image',
                    src: img.src,
                    id: img.id,
                    size: rect.width * rect.height,
                    top: rect.top,
                    left: rect.left
                  });
                }
              });
              textElements.slice(0, 10).forEach(el => {
                const rect = el.getBoundingClientRect();
                candidates.push({
                  type: 'text',
                  tag: el.tagName,
                  text: el.textContent.substring(0, 50),
                  size: rect.width * rect.height,
                  top: rect.top,
                  left: rect.left
                });
              });
              candidates.sort((a, b) => b.size - a.size);
              log({
                location: 'page.tsx:script:lcpCandidates',
                message: 'LCP candidates detected',
                data: {
                  timeSincePageLoad: performance.now(),
                  candidates: candidates.slice(0, 5),
                  heroImageRank: candidates.findIndex(c => c.id === 'hero-lcp-image')
                },
                hypothesisId: 'H3'
              });
            }
            // H4: Verificar elementos que cubren la imagen
            function logCoveringElements() {
              const img = document.getElementById('hero-lcp-image');
              if (!img) return;
              const rect = img.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const elements = document.elementsFromPoint(centerX, centerY);
              const covering = elements.filter(el => {
                if (el === img || el === document.body || el === document.documentElement) return false;
                const elRect = el.getBoundingClientRect();
                const styles = window.getComputedStyle(el);
                return elRect.width > 0 && elRect.height > 0 && 
                       styles.opacity !== '0' && 
                       styles.visibility !== 'hidden' &&
                       styles.display !== 'none' &&
                       parseInt(styles.zIndex || '0') >= parseInt(window.getComputedStyle(img).zIndex || '1');
              });
              log({
                location: 'page.tsx:script:coveringElements',
                message: 'Elements covering hero image',
                data: {
                  timeSincePageLoad: performance.now(),
                  coveringElements: covering.map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    className: el.className,
                    zIndex: window.getComputedStyle(el).zIndex,
                    opacity: window.getComputedStyle(el).opacity,
                    position: window.getComputedStyle(el).position
                  }))
                },
                hypothesisId: 'H4'
              });
            }
            // H5: Verificar dimensiones y posición
            function logDimensions() {
              const img = document.getElementById('hero-lcp-image');
              if (!img) return;
              const rect = img.getBoundingClientRect();
              const styles = window.getComputedStyle(img);
              log({
                location: 'page.tsx:script:dimensions',
                message: 'Hero image dimensions check',
                data: {
                  timeSincePageLoad: performance.now(),
                  computedWidth: styles.width,
                  computedHeight: styles.height,
                  actualWidth: rect.width,
                  actualHeight: rect.height,
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight,
                  aspectRatio: rect.width / rect.height,
                  expectedAspectRatio: 1200 / 433,
                  isOffscreen: rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth
                },
                hypothesisId: 'H5'
              });
            }
            // CLS: Rastrear cambios de layout
            let lastLayoutHeight = 0;
            const clsObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                  log({
                    location: 'page.tsx:script:cls',
                    message: 'Layout shift detected',
                    data: {
                      timeSincePageLoad: performance.now(),
                      value: entry.value,
                      sources: entry.sources.map(s => ({
                        node: s.node ? s.node.tagName + (s.node.id ? '#' + s.node.id : '') + (s.node.className ? '.' + s.node.className.split(' ')[0] : '') : 'unknown',
                        previousRect: s.previousRect,
                        currentRect: s.currentRect
                      }))
                    },
                    hypothesisId: 'CLS1'
                  });
                }
              }
            });
            try {
              clsObserver.observe({entryTypes: ['layout-shift']});
            } catch(e) {}
            // CLS: Monitorear cambios de minHeight en componentes lazy
            function monitorLazyComponents() {
              const lazyContainers = Array.from(document.querySelectorAll('[style*="min-height"]'));
              lazyContainers.forEach(container => {
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                      const newStyle = container.getAttribute('style');
                      const oldMinHeight = mutation.oldValue ? (mutation.oldValue.match(/min-height[^;]*/) || [null])[0] : null;
                      const newMinHeight = newStyle ? (newStyle.match(/min-height[^;]*/) || [null])[0] : null;
                      if (oldMinHeight !== newMinHeight) {
                        log({
                          location: 'page.tsx:script:lazyComponent',
                          message: 'Lazy component minHeight changed',
                          data: {
                            timeSincePageLoad: performance.now(),
                            element: container.tagName + (container.id ? '#' + container.id : '') + (container.className ? '.' + container.className.split(' ')[0] : ''),
                            oldMinHeight: oldMinHeight,
                            newMinHeight: newMinHeight,
                            rect: container.getBoundingClientRect()
                          },
                          hypothesisId: 'CLS1'
                        });
                      }
                    }
                  });
                });
                observer.observe(container, {attributes: true, attributeOldValue: true});
              });
            }
            // Inicialización
            function initMonitoring() {
              log({location: 'page.tsx:script:initMonitoring', message: 'initMonitoring called', data: {readyState: document.readyState, timeSincePageLoad: performance.now()}, hypothesisId: 'INIT'});
              const img = document.getElementById('hero-lcp-image');
              if (!img) {
                log({location: 'page.tsx:script:initMonitoring', message: 'Hero image not found, retrying', data: {timeSincePageLoad: performance.now()}, hypothesisId: 'INIT'});
                setTimeout(initMonitoring, 100);
                return;
              }
              log({location: 'page.tsx:script:initMonitoring', message: 'Hero image found, starting monitoring', data: {timeSincePageLoad: performance.now(), imgComplete: img.complete}, hypothesisId: 'INIT'});
              // LCP monitoring
              logHeroImageData('Hero image initial check', 'H1');
              logPreloadStatus();
              setTimeout(logLCPCandidates, 100);
              setTimeout(logCoveringElements, 200);
              setTimeout(logDimensions, 300);
              // CLS monitoring
              monitorLazyComponents();
              // Verificaciones periódicas
              [100, 500, 1000, 2000, 5000, 10000, 15000].forEach(delay => {
                setTimeout(() => {
                  logHeroImageData('Hero image periodic check', 'H1');
                  logLCPCandidates();
                  logCoveringElements();
                }, delay);
              });
              // Monitorear carga de imagen
              if (img.complete) {
                logHeroImageData('Hero image already loaded', 'H2');
              } else {
                img.addEventListener('load', () => logHeroImageData('Hero image loaded', 'H2'), { once: true });
                img.addEventListener('error', () => logHeroImageData('Hero image load error', 'H2'), { once: true });
              }
            }
            // Ejecutar inmediatamente y también cuando el DOM esté listo
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', initMonitoring, { once: true });
            } else {
              setTimeout(initMonitoring, 0);
            }
            // También intentar inmediatamente
            setTimeout(initMonitoring, 0);
          })();
          `,
        }}
      />
      {/* #endregion */}
    </Hydrate>
  )
}
