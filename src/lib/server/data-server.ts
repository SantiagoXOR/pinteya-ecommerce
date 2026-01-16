'use server'

import 'server-only'
import { cache } from 'react'
import { createPublicClient } from '@/lib/integrations/supabase/server'
import { BESTSELLER_PRODUCTS_SLUGS, PRODUCT_LIMITS } from '@/lib/products/constants'
import { adaptApiProductToComponent } from '@/lib/adapters/product-adapter'
import { normalizeProductTitle } from '@/lib/core/utils'
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
 * Obtiene los IDs de los productos más vistos según analytics
 * @param supabase - Cliente de Supabase
 * @param excludeIds - IDs de productos a excluir
 * @param limit - Número máximo de productos a retornar
 * @returns Array de IDs de productos más vistos
 */
async function getMostViewedProductIds(
  supabase: ReturnType<typeof createPublicClient>,
  excludeIds: number[],
  limit: number = 7
): Promise<number[]> {
  try {
    // Intentar consultar analytics_events_unified primero (vista unificada)
    // Si no existe, usar analytics_events como fallback
    let analyticsQuery = supabase
      .from('analytics_events_unified')
      .select('metadata, action, event_name')
      .or('action.eq.view_item,event_name.eq.view_item,action.eq.product_view,event_name.eq.product_view')
      .order('created_at', { ascending: false })
      .limit(1000) // Obtener suficientes eventos para procesar

    const { data: events, error: unifiedError } = await analyticsQuery

    // Si falla con analytics_events_unified, intentar con analytics_events
    let finalEvents = events
    if (unifiedError || !events || events.length === 0) {
      const { data: fallbackEvents, error: fallbackError } = await supabase
        .from('analytics_events')
        .select('metadata, action, event_name')
        .or('action.eq.view_item,event_name.eq.view_item,action.eq.product_view,event_name.eq.product_view')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (fallbackError) {
        console.warn('Error fetching analytics events for most viewed products:', fallbackError)
        return [] // Retornar vacío para usar fallback a created_at
      }

      finalEvents = fallbackEvents
    }

    if (!finalEvents || finalEvents.length === 0) {
      return [] // No hay datos de analytics, usar fallback
    }

    // Procesar eventos para contar vistas por producto
    const productViewCounts = new Map<number, number>()

    finalEvents.forEach((event: any) => {
      // Extraer product_id desde metadata
      let productId: number | null = null

      if (event.metadata) {
        // Intentar parsear metadata si es string
        let metadata = event.metadata
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata)
          } catch {
            // Si no se puede parsear, intentar extraer directamente
            const idMatch = metadata.match(/["']?item_id["']?\s*:\s*(\d+)/i) || 
                           metadata.match(/["']?product_id["']?\s*:\s*(\d+)/i)
            if (idMatch) {
              productId = parseInt(idMatch[1], 10)
            }
          }
        }

        // Si metadata es objeto, buscar item_id o product_id
        if (typeof metadata === 'object' && metadata !== null) {
          productId = metadata.item_id || metadata.product_id || null
          if (productId) {
            productId = parseInt(String(productId), 10)
          }
        }
      }

      // Si no se encontró en metadata, intentar desde la página (URL)
      if (!productId && event.page) {
        const pageMatch = event.page.match(/\/product\/(\d+)/) || 
                         event.page.match(/\/buy\/(\d+)/)
        if (pageMatch) {
          productId = parseInt(pageMatch[1], 10)
        }
      }

      if (productId && !isNaN(productId) && !excludeIds.includes(productId)) {
        productViewCounts.set(productId, (productViewCounts.get(productId) || 0) + 1)
      }
    })

    // Ordenar por cantidad de vistas y retornar los top IDs
    const sortedProductIds = Array.from(productViewCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => id)

    return sortedProductIds
  } catch (error) {
    console.warn('Error in getMostViewedProductIds:', error)
    return [] // Retornar vacío para usar fallback a created_at
  }
}

/**
 * Adapta un producto de la base de datos al formato esperado por componentes
 * Usa la misma lógica de enriquecimiento que la API /api/products
 */
function adaptProductForServer(dbProduct: any): Product {
  const defaultVariant = dbProduct.default_variant || (dbProduct.variants?.[0] || null)
  
  // Crear objeto compatible con adaptApiProductToComponent
  // ✅ FIX: Incluir todos los campos que la API incluye para que las imágenes y variantes funcionen
  const apiProduct: ProductWithCategory = {
    id: dbProduct.id,
    name: normalizeProductTitle(dbProduct.name || ''),
    description: dbProduct.description || '',
    price: dbProduct.price || 0,
    discounted_price: dbProduct.discounted_price || dbProduct.price || 0,
    original_price: dbProduct.price || 0,
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
    default_variant: defaultVariant,
    // ✅ FIX: Incluir color y medida desde default_variant como lo hace la API
    color: dbProduct.color || defaultVariant?.color_name || undefined,
    medida: (() => {
      const rawMedida = dbProduct.medida || defaultVariant?.measure
      if (!rawMedida) return undefined
      // Parsear medida si viene como string de array (igual que la API)
      if (typeof rawMedida === 'string' && rawMedida.trim().startsWith('[') && rawMedida.trim().endsWith(']')) {
        try {
          const parsed = JSON.parse(rawMedida)
          return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : rawMedida
        } catch {
          return rawMedida
        }
      }
      return rawMedida
    })(),
    // ✅ FIX: Incluir aikon_id desde default_variant
    aikon_id: dbProduct.aikon_id || defaultVariant?.aikon_id || undefined,
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

        // 2. Obtener 7 productos adicionales populares según analytics (excluyendo los ya obtenidos)
        const specificProductIds = orderedSpecificProducts.map(p => p.id)
        
        // Intentar obtener productos más vistos desde analytics
        const mostViewedIds = await getMostViewedProductIds(supabase, specificProductIds, 7)
        
        let additionalProducts: any[] = []
        
        if (mostViewedIds.length > 0) {
          // Obtener productos más vistos desde analytics
          const { data: analyticsProducts, error: analyticsError } = await supabase
            .from('products')
            .select('*')
            .in('id', mostViewedIds)
            .eq('is_active', true)

          if (!analyticsError && analyticsProducts) {
            // Ordenar según el orden de mostViewedIds para mantener prioridad
            const productsMap = new Map(analyticsProducts.map(p => [p.id, p]))
            additionalProducts = mostViewedIds
              .map(id => productsMap.get(id))
              .filter(Boolean) as any[]
          }

          // Si no hay suficientes productos desde analytics, completar con created_at
          if (additionalProducts.length < 7) {
            const needed = 7 - additionalProducts.length
            const additionalIds = [...specificProductIds, ...mostViewedIds]
            
            const { data: fallbackProducts, error: fallbackError } = await supabase
              .from('products')
              .select('*')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(needed * 3) // Obtener más para asegurar que tengamos suficientes después de filtrar

            if (!fallbackError && fallbackProducts) {
              // Filtrar en JavaScript para excluir IDs ya obtenidos
              const filtered = fallbackProducts.filter(
                p => !additionalIds.includes(p.id)
              ).slice(0, needed)
              
              additionalProducts = [
                ...additionalProducts,
                ...filtered
              ]
            }
          }
        } else {
          // Fallback: si no hay datos de analytics, usar created_at
          const { data: fallbackProducts, error: fallbackError } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(30) // Obtener más para asegurar que tengamos suficientes después de filtrar

          if (fallbackError) {
            console.warn('Error fetching additional products (fallback):', fallbackError)
          } else if (fallbackProducts) {
            // Filtrar en JavaScript para excluir IDs ya obtenidos
            additionalProducts = fallbackProducts.filter(
              p => !specificProductIds.includes(p.id)
            ).slice(0, 7)
          }
        }

        // Combinar productos: primero los específicos, luego los adicionales
        // Asegurar que additionalProducts tenga máximo 7 productos
        const limitedAdditionalProducts = (additionalProducts || []).slice(0, 7)
        let allProducts = [
          ...orderedSpecificProducts,
          ...limitedAdditionalProducts
        ]
        
        // ✅ FIX: Asegurar exactamente 17 productos
        // Si tenemos menos de 17, intentar completar con más productos
        if (allProducts.length < 17) {
          const needed = 17 - allProducts.length
          const existingIds = allProducts.map(p => p.id)
          
          const { data: extraProducts, error: extraError } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(needed * 3) // Obtener más para asegurar que tengamos suficientes después de filtrar
          
          if (!extraError && extraProducts) {
            // Filtrar en JavaScript para excluir IDs ya obtenidos
            const filtered = extraProducts.filter(p => !existingIds.includes(p.id)).slice(0, needed)
            allProducts = [...allProducts, ...filtered]
          }
        }
        
        // Limitar a exactamente 17 productos
        if (allProducts.length > 17) {
          allProducts = allProducts.slice(0, 17)
        }

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

        // Enriquecer productos con variantes e imágenes (igual que la API /api/products)
        const enrichedProducts = allProducts.map(product => {
          const productVariants = variantsByProduct[product.id] || []
          const defaultVariant = productVariants.find((v: any) => v.is_default) || productVariants[0] || null
          
          // Calcular stock efectivo si tiene variantes
          const effectiveStock = productVariants.length > 0
            ? productVariants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
            : (product.stock !== null && product.stock !== undefined ? Number(product.stock) || 0 : 0)

          // ✅ FIX: NO resolver image_url aquí, dejar que adaptApiProductToComponent lo haga con resolveProductImage
          // Solo establecer image_url desde product_images como prioridad, pero mantener todos los datos
          // para que resolveProductImage pueda hacer la resolución completa
          const imageUrlFromTable = productImagesByProduct[product.id] || null

          return {
            ...product,
            variants: productVariants,
            default_variant: defaultVariant,
            // ✅ FIX: Pasar image_url desde product_images (prioridad 1) pero mantener images JSONB
            // para que adaptApiProductToComponent pueda usar resolveProductImage con toda la información
            image_url: imageUrlFromTable || product.image_url || null,
            images: product.images || null, // Mantener images JSONB para resolución completa en adaptApiProductToComponent
            stock: effectiveStock,
            // ✅ FIX: Incluir color y medida desde default_variant como lo hace la API
            color: product.color || defaultVariant?.color_name || undefined,
            medida: (() => {
              const rawMedida = product.medida || defaultVariant?.measure
              if (!rawMedida) return undefined
              // Parsear medida si viene como string de array (igual que la API)
              if (typeof rawMedida === 'string' && rawMedida.trim().startsWith('[') && rawMedida.trim().endsWith(']')) {
                try {
                  const parsed = JSON.parse(rawMedida)
                  return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : rawMedida
                } catch {
                  return rawMedida
                }
              }
              return rawMedida
            })(),
            aikon_id: product.aikon_id || defaultVariant?.aikon_id || undefined,
          }
        })

        // Adaptar productos enriquecidos al formato esperado por componentes
        const adaptedProducts = enrichedProducts.map(adaptProductForServer) as Product[]

        // ✅ FIX: Asegurar exactamente 17 productos (para mostrar 17 productos + 3 cards = 20 items)
        // Si tenemos menos de 17, loguear para debug
        if (adaptedProducts.length < 17) {
          console.warn(`[getBestSellerProductsServer] Solo se obtuvieron ${adaptedProducts.length} productos en vez de 17`)
        }
        return adaptedProducts.slice(0, 17)
      }
    } catch (error) {
      console.error('Error in getBestSellerProductsServer:', error)
      return []
    }
  }
)
