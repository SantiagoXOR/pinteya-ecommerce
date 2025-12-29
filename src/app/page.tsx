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
const HeroOptimized = dynamic(() => import('@/components/Home-v3/HeroOptimized'), {
  ssr: false, // Client Component - no necesita SSR
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
      {/* ⚡ FASE 23: Imagen hero renderizada en Server Component para descubrimiento temprano */}
      {/* Esta imagen debe estar en EXACTAMENTE el mismo lugar que el hero banner del carousel */}
      {/* HeroOptimized renderiza el carousel en el mismo contenedor, por eso deben coincidir */}
      {/* ⚡ CRITICAL: Esta imagen DEBE permanecer visible para que Lighthouse la detecte como LCP */}
      <div className="relative w-full hero-lcp-container">
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 lg:px-6 pt-1 sm:pt-2 pb-1 sm:pb-1.5">
          <div 
            className="relative w-full overflow-hidden" 
            style={{ 
              aspectRatio: '2.77', 
              minHeight: '277px',
              height: 'auto',
            }}
          >
            {/* ⚡ FASE 23: Imagen hero estática - misma posición que el carousel */}
            {/* Usar <img> estático para evitar duplicación de requests con Next.js Image */}
            {/* El preload en layout.tsx asegura descubrimiento temprano */}
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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              style={{ 
                width: '100%', 
                height: 'auto', 
                aspectRatio: '1200/433',
                objectFit: 'contain',
                display: 'block',
                position: 'relative',
                zIndex: 10,
                visibility: 'visible',
                opacity: 1,
                pointerEvents: 'auto',
                minHeight: '277px',
                minWidth: '100%'
              }}
            />
            {/* ⚡ FASE 23: HeroOptimized renderiza el carousel aquí, en el mismo contenedor */}
            <HeroOptimized />
          </div>
        </div>
      </div>
      <HomeV3 />
    </Hydrate>
  )
}
