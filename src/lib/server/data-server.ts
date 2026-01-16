'use server'

import 'server-only'
import { cache } from 'react'
import { createPublicClient } from '@/lib/integrations/supabase/server'
import { BESTSELLER_PRODUCTS_SLUGS, PRODUCT_LIMITS } from '@/lib/products/constants'
import { adaptApiProductToComponent } from '@/lib/adapters/product-adapter'
import type { Product } from '@/types/product'
import type { CategoryBase } from '@/lib/categories/types'
import type { ProductWithCategory } from '@/types/api'

/**
 * Obtiene todas las categorías activas desde el servidor
 */
export const getCategoriesServer = cache(async (): Promise<CategoryBase[]> => {
  const supabase = createPublicClient()

  try {
    // Intentar primero con display_order, si falla usar solo name
    let { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories with display_order:', error)
      // Fallback: solo ordenar por name si display_order falla
      const fallbackResult = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (fallbackResult.error) {
        console.error('Error fetching categories (fallback):', fallbackResult.error)
        return []
      }

      categories = fallbackResult.data
    }

    return (categories as CategoryBase[]) || []
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
    // ✅ FIX: Incluir variantes y default_variant para productos con variantes
    variants: dbProduct.variants || [],
    default_variant: dbProduct.default_variant || null,
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

        if (!products || products.length === 0) {
          return []
        }

        // ✅ FIX: Obtener variantes e imágenes para enriquecer productos
        const productIds = products.map(p => p.id)
        
        // Obtener variantes
        const { data: variants, error: variantsError } = await supabase
          .from('product_variants')
          .select('id, product_id, aikon_id, variant_slug, color_name, color_hex, measure, finish, price_list, price_sale, stock, is_active, is_default, image_url')
          .in('product_id', productIds)
          .eq('is_active', true)
          .order('is_default', { ascending: false })

        if (variantsError) {
          console.warn('Error fetching variants:', variantsError)
        }

        // Obtener imágenes desde product_images
        const { data: productImages, error: imagesError } = await supabase
          .from('product_images')
          .select('product_id, url, is_primary')
          .in('product_id', productIds)
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true })

        if (imagesError) {
          console.warn('Error fetching product images:', imagesError)
        }

        // Agrupar variantes e imágenes por producto
        const variantsByProduct = (variants || []).reduce((acc, variant) => {
          if (!acc[variant.product_id]) {
            acc[variant.product_id] = []
          }
          acc[variant.product_id].push(variant)
          return acc
        }, {} as Record<number, any[]>)

        const productImagesByProduct: Record<number, string | null> = {}
        productImages?.forEach((img: any) => {
          if (!productImagesByProduct[img.product_id]) {
            productImagesByProduct[img.product_id] = img.url
          }
        })

        // Enriquecer productos con variantes e imágenes
        const enrichedProducts = products.map(product => {
          const productVariants = variantsByProduct[product.id] || []
          const defaultVariant = productVariants.find((v: any) => v.is_default) || productVariants[0] || null
          
          // Calcular stock efectivo si tiene variantes
          const effectiveStock = productVariants.length > 0
            ? productVariants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
            : (product.stock !== null && product.stock !== undefined ? Number(product.stock) || 0 : 0)

          return {
            ...product,
            variants: productVariants,
            default_variant: defaultVariant,
            image_url: productImagesByProduct[product.id] || product.image_url || null,
            stock: effectiveStock,
          }
        })

        // Adaptar productos enriquecidos al formato esperado por componentes
        return (enrichedProducts.map(adaptProductForServer) || []) as Product[]
      } else {
        // Sin categoría: obtener 17 productos (10 específicos + 7 adicionales populares)
        // 1. Obtener productos específicos por slug
        const { data: specificProducts, error: specificError } = await supabase
          .from('products')
          .select('*')
          .in('slug', BESTSELLER_PRODUCTS_SLUGS)
          .eq('is_active', true)

        if (specificError) {
          console.error('Error fetching bestseller products:', specificError)
          return []
        }

        // Ordenar productos específicos según la prioridad de BESTSELLER_PRODUCTS_SLUGS
        const orderedSpecificProducts = BESTSELLER_PRODUCTS_SLUGS.map(slug =>
          specificProducts?.find(p => p.slug === slug)
        ).filter(Boolean)

        if (orderedSpecificProducts.length === 0) {
          return []
        }

        // 2. Obtener 7 productos adicionales populares (excluyendo los ya obtenidos)
        const specificProductIds = orderedSpecificProducts.map(p => p.id)
        const { data: additionalProductsRaw, error: additionalError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20) // Obtener más para asegurar que tengamos suficientes después de filtrar

        // Filtrar productos adicionales excluyendo los ya obtenidos
        const additionalProducts = (additionalProductsRaw || []).filter(
          p => !specificProductIds.includes(p.id)
        ).slice(0, 7)

        if (additionalError) {
          console.warn('Error fetching additional products:', additionalError)
        }

        // Combinar productos: primero los específicos, luego los adicionales
        const allProducts = [
          ...orderedSpecificProducts,
          ...(additionalProducts || [])
        ]

        // ✅ FIX: Obtener variantes e imágenes para enriquecer productos
        const productIds = allProducts.map(p => p.id)
        
        // Obtener variantes
        const { data: variants, error: variantsError } = await supabase
          .from('product_variants')
          .select('id, product_id, aikon_id, variant_slug, color_name, color_hex, measure, finish, price_list, price_sale, stock, is_active, is_default, image_url')
          .in('product_id', productIds)
          .eq('is_active', true)
          .order('is_default', { ascending: false })

        if (variantsError) {
          console.warn('Error fetching variants:', variantsError)
        }

        // Obtener imágenes desde product_images
        const { data: productImages, error: imagesError } = await supabase
          .from('product_images')
          .select('product_id, url, is_primary')
          .in('product_id', productIds)
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true })

        if (imagesError) {
          console.warn('Error fetching product images:', imagesError)
        }

        // Agrupar variantes e imágenes por producto
        const variantsByProduct = (variants || []).reduce((acc, variant) => {
          if (!acc[variant.product_id]) {
            acc[variant.product_id] = []
          }
          acc[variant.product_id].push(variant)
          return acc
        }, {} as Record<number, any[]>)

        const productImagesByProduct: Record<number, string | null> = {}
        productImages?.forEach((img: any) => {
          if (!productImagesByProduct[img.product_id]) {
            productImagesByProduct[img.product_id] = img.url
          }
        })

        // Enriquecer productos con variantes e imágenes
        const enrichedProducts = allProducts.map(product => {
          const productVariants = variantsByProduct[product.id] || []
          const defaultVariant = productVariants.find((v: any) => v.is_default) || productVariants[0] || null
          
          // Calcular stock efectivo si tiene variantes
          const effectiveStock = productVariants.length > 0
            ? productVariants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
            : (product.stock !== null && product.stock !== undefined ? Number(product.stock) || 0 : 0)

          return {
            ...product,
            variants: productVariants,
            default_variant: defaultVariant,
            image_url: productImagesByProduct[product.id] || product.image_url || null,
            stock: effectiveStock,
          }
        })

        // Adaptar productos enriquecidos al formato esperado por componentes
        const adaptedProducts = enrichedProducts.map(adaptProductForServer) as Product[]

        // Limitar a 17 productos (para mostrar 17 productos + 3 cards = 20 items)
        return adaptedProducts.slice(0, 17)
      }
    } catch (error) {
      console.error('Error in getBestSellerProductsServer:', error)
      return []
    }
  }
)
