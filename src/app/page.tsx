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

  return (
    <Hydrate state={dehydrate(queryClient)}>
      {/* ⚡ FASE 2: Imagen hero renderizada en Server Component para descubrimiento temprano */}
      {/* ⚡ OPTIMIZACIÓN LCP: Contenedores simplificados para reducir delay de renderizado */}
      {/* ⚡ CRITICAL: Esta imagen DEBE permanecer visible para que Lighthouse la detecte como LCP */}
      {/* ⚡ LCP FIX: Contenedor simplificado con altura mínima para prevenir CLS y asegurar visibilidad */}
      <div 
        className="relative w-full hero-lcp-container" 
        style={{ 
          marginTop: 0, 
          position: 'relative',
          minHeight: '277px',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.25rem 0.5rem',
        }}
      >
        {/* ⚡ FASE 2: Contenedor simplificado - menos anidación = menos delay */}
        <div 
          className="relative w-full overflow-hidden" 
          style={{ 
            aspectRatio: '2.77', 
            minHeight: '277px',
            height: 'auto',
            width: '100%',
            position: 'relative',
          }}
        >
          {/* ⚡ FASE 2: Imagen hero estática - optimizada para LCP */}
          {/* Usar <img> estático para evitar duplicación de requests con Next.js Image */}
          {/* El preload en layout.tsx asegura descubrimiento temprano */}
          {/* ⚡ CRITICAL: Esta imagen DEBE ser el LCP - optimizada para carga inmediata */}
          {/* ⚡ LCP FIX: Asegurar que la imagen esté visible y en el viewport desde el primer render */}
          <img
            src="/images/hero/hero2/hero1.webp"
            alt="Pintá rápido, fácil y cotiza al instante - Pinteya"
            width={1200}
            height={433}
            fetchPriority="high"
            loading="eager"
            decoding="sync"
            className="hero-static-image"
            id="hero-lcp-image"
            data-lcp="true"
            data-hero="true"
            data-largest-contentful-paint="true"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            srcSet="/images/hero/hero2/hero1.webp 1200w"
            style={{ 
              width: '100%', 
              height: 'auto', 
              aspectRatio: '1200/433',
              objectFit: 'contain',
              display: 'block',
              position: 'relative',
              zIndex: 1,
              visibility: 'visible',
              opacity: 1,
              pointerEvents: 'auto',
              minHeight: '277px',
              minWidth: '100%',
              margin: 0,
              padding: 0,
              // ⚡ LCP FIX: Remover transition que puede retrasar la visibilidad
              // transition: 'opacity 0.5s ease-in-out',
              // ⚡ LCP FIX: Asegurar que la imagen esté en el viewport desde el primer render
              top: 0,
              left: 0,
              right: 0,
              // ⚡ LCP FIX: Asegurar que no esté oculta por CSS
              clipPath: 'none',
              clip: 'auto',
              // ⚡ LCP FIX: Asegurar que la imagen tenga contenido visible
              contentVisibility: 'auto',
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
            function logHeroImageData(message, hypothesisId) {
              const img = document.getElementById('hero-lcp-image');
              if (!img) return;
              const rect = img.getBoundingClientRect();
              const styles = window.getComputedStyle(img);
              const logData = {
                location: 'page.tsx:script:heroImage',
                message: message,
                data: {
                  timestamp: Date.now(),
                  timeSincePageLoad: performance.now(),
                  isVisible: img.offsetWidth > 0 && img.offsetHeight > 0,
                  inViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
                  opacity: styles.opacity,
                  zIndex: styles.zIndex,
                  position: styles.position,
                  display: styles.display,
                  visibility: styles.visibility,
                  width: rect.width,
                  height: rect.height,
                  top: rect.top,
                  left: rect.left,
                  complete: img.complete,
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight,
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'initial',
                hypothesisId: hypothesisId
              };
              fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
              }).catch(function() {});
            }
            function checkHeroImageVisibility() {
              logHeroImageData('Hero image visibility check', 'B');
            }
            function initHeroImageMonitoring() {
              const img = document.getElementById('hero-lcp-image');
              if (!img) {
                setTimeout(initHeroImageMonitoring, 100);
                return;
              }
              // Log cuando la imagen se carga
              if (img.complete) {
                logHeroImageData('Hero image already loaded', 'B');
              } else {
                img.addEventListener('load', function() {
                  logHeroImageData('Hero image loaded', 'B');
                }, { once: true });
                img.addEventListener('error', function() {
                  logHeroImageData('Hero image load error', 'B');
                }, { once: true });
              }
              // Verificaciones periódicas de visibilidad
              setTimeout(checkHeroImageVisibility, 100);
              setTimeout(checkHeroImageVisibility, 1000);
              setTimeout(checkHeroImageVisibility, 5000);
              setTimeout(checkHeroImageVisibility, 10000);
              setTimeout(checkHeroImageVisibility, 15000);
            }
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', initHeroImageMonitoring, { once: true });
            } else {
              setTimeout(initHeroImageMonitoring, 0);
            }
          })();
          `,
        }}
      />
      {/* #endregion */}
    </Hydrate>
  )
}
