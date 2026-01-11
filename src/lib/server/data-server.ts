'use server'

import 'server-only'
import { cache } from 'react'
import { createPublicClient } from '@/lib/integrations/supabase/server'
import { BESTSELLER_PRODUCTS_SLUGS, PRODUCT_LIMITS } from '@/lib/products/constants'
import { adaptApiProductToComponent } from '@/lib/adapters/product-adapter'
import type { Product } from '@/types/product'
import type { Category } from '@/types/category'
import type { ProductWithCategory } from '@/types/api'

/**
 * Obtiene todas las categorías activas desde el servidor
 */
export const getCategoriesServer = cache(async (): Promise<Category[]> => {
  const supabase = createPublicClient()

  try {
    // Intentar primero con display_order, si falla usar sort_order o name
    let { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories with display_order:', error)
      // Intentar sin display_order si falla
      const fallbackResult = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true })

      if (fallbackResult.error) {
        console.error('Error fetching categories (fallback):', fallbackResult.error)
        // Último intento: solo ordenar por name
        const lastResult = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true })

        if (lastResult.error) {
          console.error('Error fetching categories (last attempt):', lastResult.error)
          return []
        }

        categories = lastResult.data
      } else {
        categories = fallbackResult.data
      }
    }

    return (categories as Category[]) || []
  } catch (error) {
    console.error('Error in getCategoriesServer:', error)
    return []
  }
})

/**
 * Adapta un producto de la base de datos al formato esperado por componentes
 */
function adaptProductForServer(dbProduct: any): Product {
  // Crear objeto compatible con adaptApiProductToComponent
  const apiProduct: ProductWithCategory = {
    id: dbProduct.id,
    name: dbProduct.name || '',
    description: dbProduct.description || '',
    price: dbProduct.price || 0,
    discounted_price: dbProduct.discounted_price || dbProduct.price || 0,
    stock: dbProduct.stock || 0,
    slug: dbProduct.slug || `product-${dbProduct.id}`,
    image_url: dbProduct.image_url || null,
    images: dbProduct.images || null,
    brand: dbProduct.brand || null,
    category_id: dbProduct.category_id || null,
    is_active: dbProduct.is_active ?? true,
    created_at: dbProduct.created_at || new Date().toISOString(),
    updated_at: dbProduct.updated_at || new Date().toISOString(),
    category: dbProduct.category || null,
  }

  // Usar el adaptador existente
  return adaptApiProductToComponent(apiProduct)
}

/**
 * Obtiene productos bestseller desde el servidor
 * Sin categoría: 10 productos específicos hardcodeados
 * Con categoría: Todos los productos de la categoría (limit 20)
 */
export const getBestSellerProductsServer = cache(
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
        return (products?.map(adaptProductForServer) || []) as Product[]
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

        // Ordenar productos según la prioridad de BESTSELLER_PRODUCTS_SLUGS
        const orderedProducts = BESTSELLER_PRODUCTS_SLUGS.map(slug =>
          products?.find(p => p.slug === slug)
        ).filter(Boolean)

        // Adaptar productos al formato esperado por componentes
        const adaptedProducts = orderedProducts.map(adaptProductForServer) as Product[]

        // Limitar a 10 productos
        return adaptedProducts.slice(0, PRODUCT_LIMITS.BESTSELLER)
      }
    } catch (error) {
      console.error('Error in getBestSellerProductsServer:', error)
      return []
    }
  }
)
