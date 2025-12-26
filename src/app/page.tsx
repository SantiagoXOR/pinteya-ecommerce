import HomeV3 from '@/components/Home-v3'
import { Metadata } from 'next'
import '@/styles/home-v3-glassmorphism.css'
import { createClient } from '@/lib/integrations/supabase/server'
import { Category } from '@/types/database'
import { QueryClient, dehydrate, Hydrate } from '@tanstack/react-query'
import { productQueryKeys } from '@/hooks/queries/productQueryKeys'

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
async function getCategoriesServerSide(): Promise<Category[]> {
  try {
    const supabase = await createClient()
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
      <HomeV3 />
    </Hydrate>
  )
}
