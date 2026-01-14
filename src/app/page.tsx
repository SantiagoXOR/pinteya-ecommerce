import { Metadata } from 'next'
import Image from 'next/image'
// ⚡ FASE 1: CSS glassmorphism movido a carga diferida via DeferredCSS (solo en desktop)
import { QueryClient, dehydrate, Hydrate } from '@tanstack/react-query'
import { productQueryKeys } from '@/hooks/queries/productQueryKeys'
import { getCategoriesServer, getBestSellerProductsServer } from '@/lib/server/data-server'
import Home from '@/components/Home'
import type { Category } from '@/lib/categories/types'
import type { Product } from '@/types/product'

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
        url: '/images/hero/hero2/hero1.webp',
        width: 1200,
        height: 433,
        alt: 'Pinteya - Tu Pinturería Online',
      },
    ],
  },
  other: {
    'preload-hero-image': '/images/hero/hero2/hero1.webp',
  },
}

// ⚡ PERFORMANCE: ISR - Revalidar cada 60 segundos para mejor cache
// ✅ Home-v3 configurado como ruta principal
export const revalidate = 60

export default async function HomePage() {
  // ⚡ OPTIMIZACIÓN CRÍTICA: Pre-cargar categorías y productos en el servidor
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

  // Pre-fetch categorías y productos bestseller en paralelo
  const [categories, bestSellerProducts] = await Promise.all([
    getCategoriesServer(),
    getBestSellerProductsServer(null),
  ])
  
  // Pre-popular el cache de React Query con las categorías
  queryClient.setQueryData(
    productQueryKeys.categoryListWithFilters({}),
    categories
  )

  return (
    <Hydrate state={dehydrate(queryClient)}>
      <Home categories={categories} bestSellerProducts={bestSellerProducts} />
    </Hydrate>
  )
}
