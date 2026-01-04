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
    </Hydrate>
  )
}
