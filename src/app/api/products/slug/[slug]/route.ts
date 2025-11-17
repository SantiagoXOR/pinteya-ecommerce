// ===================================
// PINTEYA E-COMMERCE - API DE PRODUCTO POR SLUG
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, handleSupabaseError } from '@/lib/integrations/supabase'
import { ApiResponse, ProductWithCategory } from '@/types/api'

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

    // Obtener variantes del producto
    let enrichedProduct = product

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
        }
      } catch (variantError) {
        // Si hay error obteniendo variantes, continuar con producto original
        console.warn('Error obteniendo variantes para producto:', product.id, variantError)
      }
    }

    const response: ApiResponse<ProductWithCategory> = {
      data: enrichedProduct,
      success: true,
      message: 'Producto obtenido exitosamente',
    }

    // Agregar headers de caché para optimización
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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



