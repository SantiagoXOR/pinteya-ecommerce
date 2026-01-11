import { getBestSellerProducts, preloadBestSellerProducts } from '@/lib/server/products-server'
import { getCategories, preloadCategories } from '@/lib/server/categories-server'
import HomeFast from '@/components/Home/HomeFast'
import type { Metadata } from 'next'
import type { Product } from '@/types/product'
import type { Category } from '@/types/category'

export const revalidate = 60 // ISR cada 60 segundos

export const metadata: Metadata = {
  title: 'Pinteya - Inicio Optimizado',
  description: 'Pinturas y productos de construcción con envío gratis',
}

export default async function HomeFastPage() {
  // Preload pattern: Iniciar fetch temprano
  await preloadCategories()
  await preloadBestSellerProducts(null)

  // Fetch datos en paralelo
  const [categories, bestSellerProducts] = await Promise.all([
    getCategories(),
    getBestSellerProducts(null),
  ])

  // Log para debugging
  console.log('📊 HomeFastPage data:', {
    categoriesCount: categories.length,
    productsCount: bestSellerProducts.length,
  })

  return <HomeFast categories={categories} bestSellerProducts={bestSellerProducts} />
}
