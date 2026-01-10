import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Image from 'next/image'
// ⚡ FASE 1: CSS glassmorphism movido a carga diferida via DeferredCSS (solo en desktop)
import { createPublicClient } from '@/lib/integrations/supabase/server'
import { Category } from '@/types/database'
import { QueryClient, dehydrate, Hydrate } from '@tanstack/react-query'
import { productQueryKeys } from '@/hooks/queries/productQueryKeys'

// ⚡ FASE 19: Lazy load de Home para reducir bundle inicial y bloqueo del main thread
// Esto permite que la imagen hero se cargue primero sin esperar el JavaScript de Home
const Home = dynamic(() => import('@/components/Home'), {
  ssr: true, // Mantener SSR para SEO
  loading: () => null, // No mostrar loading, la imagen hero ya está visible
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
      {/* ⚡ FIX: Hero se renderiza dentro de Home, no aquí para evitar duplicación */}
      <Home />
    </Hydrate>
  )
}
