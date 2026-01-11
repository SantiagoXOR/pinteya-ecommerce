'use server'

import 'server-only'
import { cache } from 'react'
import { createPublicClient } from '@/lib/integrations/supabase/server'
import { BESTSELLER_PRODUCTS_SLUGS, PRODUCT_LIMITS } from '@/lib/products/constants'
// Usaremos adaptación manual para evitar dependencias de client components
import type { Product } from '@/types/product'

/**
 * Adapta un producto de la base de datos al formato esperado por componentes
 */
function adaptProduct(dbProduct: any): Product {
  // Obtener imágenes del producto
  let images: string[] = []
  let firstImage = '/images/products/placeholder.svg'
  
  if (dbProduct.images) {
    if (Array.isArray(dbProduct.images)) {
      images = dbProduct.images
    } else if (typeof dbProduct.images === 'object') {
      // Si es un objeto con estructura { previews: [], thumbnails: [] }
      images = dbProduct.images.previews || dbProduct.images.thumbnails || []
    }
  }
  
  if (dbProduct.image_url) {
    images = [dbProduct.image_url, ...images]
  }
  
  firstImage = images[0] || dbProduct.image_url || '/images/products/placeholder.svg'

  return {
    id: dbProduct.id,
    title: dbProduct.name || '',
    name: dbProduct.name || '',
    price: dbProduct.price || 0,
    discountedPrice: dbProduct.discounted_price || dbProduct.price || 0,
    brand: dbProduct.brand || '',
    slug: dbProduct.slug || `product-${dbProduct.id}`,
    description: dbProduct.description || '',
    stock: dbProduct.stock || 0,
    image_url: firstImage,
    images: images,
    image: firstImage,
    reviews: 0,
    imgs: {
      thumbnails: images,
      previews: images,
    },
    categoryId: dbProduct.category_id,
    isNew: false,
  }
}

/**
 * Obtiene productos bestseller desde el servidor
 * Sin categoría: 10 productos específicos hardcodeados
 * Con categoría: Todos los productos de la categoría (limit 20)
 */
export const getBestSellerProducts = cache(
  async (categorySlug: string | null = null): Promise<Product[]> => {
    const supabase = createPublicClient()

    try {
      if (categorySlug) {
        // Con categoría: obtener todos los productos de la categoría
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single()

        if (categoryError || !category) {
          console.error('Error fetching category:', categoryError)
          return []
        }

        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', category.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(PRODUCT_LIMITS.CATEGORY)

        if (productsError) {
          console.error('Error fetching products by category:', productsError)
          return []
        }

        // Adaptar productos al formato esperado por componentes
        return (products?.map(adaptProduct) || []) as Product[]
      } else {
        // Sin categoría: obtener productos específicos por slug
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .in('slug', BESTSELLER_PRODUCTS_SLUGS)
          .eq('is_active', true)

        if (error) {
          console.error('Error fetching bestseller products:', error)
          return []
        }

        console.log(`✅ getBestSellerProducts: Found ${products?.length || 0} products from database`)

        // Ordenar productos según la prioridad de BESTSELLER_PRODUCTS_SLUGS
        const orderedProducts = BESTSELLER_PRODUCTS_SLUGS.map(slug =>
          products?.find(p => p.slug === slug)
        ).filter(Boolean)

        console.log(`✅ getBestSellerProducts: Ordered ${orderedProducts.length} products by priority`)

        // Adaptar productos al formato esperado por componentes
        const adaptedProducts = orderedProducts.map(adaptProduct) as Product[]

        // Limitar a 10 productos
        const limitedProducts = adaptedProducts.slice(0, PRODUCT_LIMITS.BESTSELLER)
        console.log(`✅ getBestSellerProducts: Returning ${limitedProducts.length} products`)
        return limitedProducts
      }
    } catch (error) {
      console.error('Error in getBestSellerProducts:', error)
      return []
    }
  }
)

/**
 * Preload pattern: Inicia el fetch temprano sin esperar el resultado
 * Debe ser async porque Next.js interpreta exports de 'use server' como Server Actions
 */
export async function preloadBestSellerProducts(categorySlug: string | null = null) {
  void getBestSellerProducts(categorySlug)
}
