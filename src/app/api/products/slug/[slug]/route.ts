// ===================================
// PINTEYA E-COMMERCE - API DE PRODUCTO POR SLUG
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, handleSupabaseError } from '@/lib/integrations/supabase'
import { ApiResponse, ProductWithCategory } from '@/types/api'
import { normalizeProductTitle } from '@/lib/core/utils'

// ===================================
// GET /api/products/slug/[slug] - Obtener producto por slug
// ===================================
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params
    const slug = params.slug

    if (!slug || slug.trim() === '') {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Slug de producto inválido',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Verificar que el cliente de Supabase esté disponible
    if (!supabase) {
      console.error('Cliente de Supabase no disponible en GET /api/products/slug/[slug]')
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      }
      return NextResponse.json(errorResponse, { status: 503 })
    }

    // Obtener producto con categoría por slug
    const { data: product, error } = await supabase
      .from('products')
      .select(
        `
        id, name, slug, description, price, discounted_price, brand, stock, images, created_at, updated_at, aikon_id, color, medida,
        category:categories(id, name, slug)
      `
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        const notFoundResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Producto no encontrado',
        }
        return NextResponse.json(notFoundResponse, { status: 404 })
      }
      handleSupabaseError(error, `GET /api/products/slug/${slug}`)
    }

    if (!product) {
      const notFoundResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Producto no encontrado',
      }
      return NextResponse.json(notFoundResponse, { status: 404 })
    }

    // ✅ NUEVO: Obtener imagen principal desde product_images
    let primaryImageUrl: string | null = null
    try {
      const { data: productImages } = await supabase
        .from('product_images')
        .select('url, is_primary, display_order')
        .eq('product_id', product.id)
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true })
        .limit(1)
      
      if (productImages && productImages.length > 0) {
        primaryImageUrl = productImages[0].url
        console.log('✅ [API slug] Imagen obtenida desde product_images:', primaryImageUrl)
      } else {
        console.log('⚠️ [API slug] No se encontraron imágenes en product_images para producto:', product.id)
        // ✅ NUEVO: Fallback a campo images JSONB si no hay imagen en product_images
        if (product.images) {
          const extractImageFromJsonb = (images: any): string | null => {
            if (!images) return null
            if (typeof images === 'string') {
              const trimmed = images.trim()
              if (!trimmed) return null
              if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"')) {
                try {
                  const parsed = JSON.parse(trimmed)
                  return extractImageFromJsonb(parsed)
                } catch {
                  try {
                    const unescaped = JSON.parse(`"${trimmed}"`)
                    return extractImageFromJsonb(unescaped)
                  } catch {
                    return trimmed || null
                  }
                }
              }
              return trimmed || null
            }
            if (Array.isArray(images)) {
              return images[0]?.trim() || null
            }
            if (typeof images === 'object') {
              return (images as any).url ||
                     images.previews?.[0] || 
                     images.thumbnails?.[0] ||
                     images.gallery?.[0] ||
                     images.main ||
                     null
            }
            return null
          }
          primaryImageUrl = extractImageFromJsonb(product.images)
          if (primaryImageUrl) {
            console.log('✅ [API slug] Imagen obtenida desde campo images JSONB:', primaryImageUrl)
          }
        }
      }
    } catch (imageError) {
      console.warn('❌ [API slug] Error obteniendo imagen desde product_images:', imageError)
    }

    // Obtener variantes del producto
    // ✅ CRÍTICO: Inicializar enrichedProduct con image_url desde el inicio
    let enrichedProduct: any = {
      ...product,
      // ✅ CRÍTICO: Agregar image_url inmediatamente desde product_images
      image_url: primaryImageUrl || null,
    }

    if (product) {
      try {
        const { data: variants } = await supabase
          .from('product_variants')
          .select(`
            id,
            product_id,
            aikon_id,
            variant_slug,
            color_name,
            color_hex,
            measure,
            finish,
            price_list,
            price_sale,
            stock,
            is_active,
            is_default,
            image_url,
            metadata
          `)
          .eq('product_id', product.id)
          .eq('is_active', true)
          .order('is_default', { ascending: false })

        // Post-proceso: enriquecer variantes (similar al endpoint por ID)
        let processedVariants = variants || []
        
        // Lógica especial para producto 42 (si aplica)
        if (product.id === 42) {
          const now = new Date().toISOString()
          const targetMeasures = ['10L', '4L', '1L']
          const targetColors = [
            { name: 'cemento', hex: '#9FA1A3' },
            { name: 'gris', hex: '#808080' },
          ]

          const base = processedVariants[0] || null
          const existingKeys = new Set(
            processedVariants.map(v => `${(v.color_name || '').toLowerCase()}|${(v.measure || '').toUpperCase()}`)
          )

          const extraVariants: typeof processedVariants = []
          for (const measure of targetMeasures) {
            for (const color of targetColors) {
              const key = `${color.name}|${measure}`
              if (!existingKeys.has(key)) {
                extraVariants.push({
                  id: 0,
                  product_id: product.id,
                  aikon_id: base?.aikon_id || product.aikon_id || `TEMP-${product.id}`,
                  variant_slug: `${(product.name || 'producto').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${color.name}-${measure}`,
                  color_name: color.name,
                  color_hex: color.hex,
                  measure,
                  finish: base?.finish || null,
                  price_list: base?.price_list ?? Number(product.price) ?? 0,
                  price_sale: base?.price_sale ?? (product.discounted_price ? Number(product.discounted_price) : null),
                  stock: Math.max(product.stock || 0, 20),
                  is_active: true,
                  is_default: false,
                  image_url: base?.image_url ?? null,
                  metadata: { generated: true },
                  created_at: now,
                  updated_at: now,
                })
              }
            }
          }

          if (extraVariants.length > 0) {
            processedVariants = [...processedVariants, ...extraVariants]
          }
        }

        const defaultVariant = processedVariants?.find(v => v.is_default) || processedVariants?.[0]

        enrichedProduct = {
          ...product,
          // ✅ NUEVO: Normalizar título del producto a formato capitalizado
          name: normalizeProductTitle(product.name),
          // Mantener compatibilidad con campos legacy
          aikon_id: product.aikon_id || defaultVariant?.aikon_id,
          color: product.color || defaultVariant?.color_name,
          medida: product.medida || defaultVariant?.measure,
          // Agregar información de variantes
          variants: processedVariants || [],
          variant_count: processedVariants?.length || 0,
          has_variants: (variants?.length || 0) > 0,
          default_variant: defaultVariant || null,
          // Usar precios de la variante por defecto si están disponibles
          price: defaultVariant?.price_list || product.price,
          discounted_price: defaultVariant?.price_sale || product.discounted_price,
          stock: defaultVariant?.stock !== undefined ? defaultVariant.stock : product.stock,
          // ✅ CRÍTICO: Prioridad: product_images > variante > null (asegurar siempre)
          image_url: primaryImageUrl || defaultVariant?.image_url || enrichedProduct.image_url || null,
        }
        // ✅ DEBUG: Log para verificar image_url
        console.log('🔥🔥🔥 [API slug] Producto enriquecido con image_url:', {
          product_id: product.id,
          image_url: primaryImageUrl || defaultVariant?.image_url || null,
          primaryImageUrl,
          defaultVariant_image_url: defaultVariant?.image_url,
          has_variants: (variants?.length || 0) > 0
        })
      } catch (variantError) {
        // Si hay error obteniendo variantes, continuar con producto original
        console.warn('Error obteniendo variantes para producto:', product.id, variantError)
        // ✅ NUEVO: Aplicar normalización incluso si no hay variantes
        // ✅ CRÍTICO: Asegurar que image_url esté presente (ya se agregó al inicio)
        enrichedProduct = {
          ...product,
          name: normalizeProductTitle(product.name),
          // ✅ CRÍTICO: Agregar image_url desde product_images (ya inicializado arriba, pero asegurar)
          image_url: primaryImageUrl || enrichedProduct.image_url || null,
        }
        // ✅ DEBUG: Log para productos sin variantes
        console.log('🔥🔥🔥 [API slug] Producto sin variantes con image_url:', {
          product_id: product.id,
          image_url: primaryImageUrl || null,
          primaryImageUrl
        })
      }
    }

    // ✅ CRÍTICO: Asegurar que image_url esté SIEMPRE presente (ya se inicializó arriba)
    if (enrichedProduct && !enrichedProduct.image_url) {
      enrichedProduct.image_url = primaryImageUrl || null
    }
    // ✅ CRÍTICO: Asegurar que image_url no se haya perdido en algún punto
    if (enrichedProduct && primaryImageUrl && !enrichedProduct.image_url) {
      enrichedProduct.image_url = primaryImageUrl
    }
    
    // ✅ NUEVO: Asegurar normalización si enrichedProduct no fue modificado
    if (enrichedProduct && !enrichedProduct.name) {
      enrichedProduct.name = normalizeProductTitle(product.name)
    } else if (enrichedProduct && enrichedProduct.name === product.name) {
      enrichedProduct.name = normalizeProductTitle(product.name)
    }

    // ✅ CRÍTICO: Log final para verificar que image_url esté presente antes de enviar respuesta
    console.log('🎯🎯🎯 [API slug] RESPUESTA FINAL - Verificando image_url:', {
      product_id: enrichedProduct?.id,
      product_slug: slug,
      image_url: enrichedProduct?.image_url,
      has_image_url: !!(enrichedProduct as any)?.image_url,
      image_url_type: typeof (enrichedProduct as any)?.image_url,
      image_url_value: (enrichedProduct as any)?.image_url,
      primaryImageUrl,
      product_has_images_field: !!(product as any)?.images,
      product_images_type: typeof (product as any)?.images,
      enrichedProduct_keys: enrichedProduct ? Object.keys(enrichedProduct).filter(k => k.includes('image') || k.includes('Image')) : [],
      all_enrichedProduct_keys: enrichedProduct ? Object.keys(enrichedProduct) : []
    })

    const response: ApiResponse<ProductWithCategory> = {
      data: enrichedProduct,
      success: true,
      message: 'Producto obtenido exitosamente',
    }

    // ⚡ PERFORMANCE: Headers de caché optimizados (aumentado de 60 a 120 segundos)
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    })
  } catch (error: any) {
    console.error('Error en GET /api/products/slug/[slug]:', error)

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}



