'use server'

import 'server-only'
import { cache } from 'react'
import { createPublicClient } from '@/lib/integrations/supabase/server'
import { BESTSELLER_PRODUCTS_SLUGS, PRODUCT_LIMITS } from '@/lib/products/constants'
import type { Product } from '@/types/product'

/**
 * Adapta un producto de la base de datos al formato esperado por componentes
 */
function adaptProduct(dbProduct: any): Product {
  const images = dbProduct.images 
    ? (Array.isArray(dbProduct.images) ? dbProduct.images : [dbProduct.images])
    : dbProduct.image_url 
      ? [dbProduct.image_url]
      : []

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
    image_url: dbProduct.image_url || images[0] || '/images/products/placeholder.svg',
    images: images,
    image: images[0] || dbProduct.image_url || '/images/products/placeholder.svg',
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
          .select(
            `
            id,
            name,
            description,
            price,
            stock,
            slug,
            image_url,
            images,
            brand,
            category_id,
            is_active,
            created_at,
            updated_at
          `
          )
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
          .select(
            `
            id,
            name,
            description,
            price,
            stock,
            slug,
            image_url,
            images,
            brand,
            category_id,
            is_active,
            created_at,
            updated_at
          `
          )
          .in('slug', BESTSELLER_PRODUCTS_SLUGS)
          .eq('is_active', true)

        if (error) {
          console.error('Error fetching bestseller products:', error)
          return []
        }

        // Ordenar productos según la prioridad de BESTSELLER_PRODUCTS_SLUGS
        const orderedProducts = BESTSELLER_PRODUCTS_SLUGS.map(slug =>
          products?.find(p => p.slug === slug)
        ).filter(Boolean)

        // Adaptar productos al formato esperado por componentes
        const adaptedProducts = orderedProducts.map(adaptProduct) as Product[]

        // Limitar a 10 productos
        return adaptedProducts.slice(0, PRODUCT_LIMITS.BESTSELLER)
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
