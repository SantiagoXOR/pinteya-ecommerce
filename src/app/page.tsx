import { Metadata } from 'next'
// ⚡ FASE 1: CSS glassmorphism movido a carga diferida via DeferredCSS (solo en desktop)
import { QueryClient, dehydrate, Hydrate } from '@tanstack/react-query'
import { productQueryKeys } from '@/hooks/queries/productQueryKeys'
import { getCategoriesServer, getBestSellerProductsServer } from '@/lib/server/data-server'
import Home from '@/components/Home'
import { HeroImageServer } from '@/components/Home/sections/HeroImageServer'
import type { Category } from '@/lib/categories/types'
import type { Product } from '@/types/product'
import { getTenantPublicConfig } from '@/lib/tenant/tenant-service'
import { getTenantAssetPath } from '@/lib/tenant/tenant-assets'

// ⚡ Metadata dinámica basada en el tenant
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantPublicConfig()
  const tenantName = tenant?.name || 'E-commerce'
  const tenantSlug = tenant?.slug || 'pinteya'
  const heroImageUrl = `/tenants/${tenantSlug}/hero/hero1.webp`
  
  return {
    title: `${tenantName} - Tu Pinturería Online | Envío Gratis +$50.000`,
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
      title: `${tenantName} - Tu Pinturería Online | Las Mejores Marcas`,
      description:
        `Descubre la mejor selección de pinturas, herramientas y productos de ferretería en ${tenantName}. Marcas reconocidas y envío gratis en compras superiores a $50.000.`,
      images: [
        {
          url: heroImageUrl,
          width: 1200,
          height: 433,
          alt: `${tenantName} - Tu Pinturería Online`,
        },
      ],
    },
    other: {
      'preload-hero-image': heroImageUrl,
    },
  }
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
  
  // ✅ FIX: Pre-popular el cache de React Query con productos bestseller
  // Esto evita que useBestSellerProducts tenga que hacer fetch inicial
  queryClient.setQueryData(
    productQueryKeys.bestseller(null),
    bestSellerProducts
  )

  // ⚡ LCP: Hero imagen en servidor para que esté en el HTML inicial (no espera hidratación)
  const tenant = await getTenantPublicConfig()
  const heroUrl = getTenantAssetPath(tenant, 'hero/hero1.webp', '/images/hero/hero2/hero1.webp')
  const heroAlt = `${tenant?.name || 'PinteYa'} - Pintá rápido, fácil y cotiza al instante`

  return (
    <Hydrate state={dehydrate(queryClient)}>
      <Home categories={categories} bestSellerProducts={bestSellerProducts} heroImageServer={<HeroImageServer heroUrl={heroUrl} alt={heroAlt} />} />
    </Hydrate>
  )
}
