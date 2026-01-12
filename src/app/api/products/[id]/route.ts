// ===================================
// PINTEYA E-COMMERCE - API DE PRODUCTO INDIVIDUAL
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, handleSupabaseError } from '@/lib/integrations/supabase'
import { validateData, ProductSchema } from '@/lib/validations'
import { ApiResponse, ProductWithCategory } from '@/types/api'
import { normalizeProductTitle } from '@/lib/core/utils'

// ===================================
// GET /api/products/[id] - Obtener producto por ID
// ===================================
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    // Validar parámetro ID
    const id = parseInt(params.id, 10)
    if (isNaN(id) || id <= 0) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de producto inválido',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Verificar que el cliente de Supabase esté disponible
    if (!supabase) {
      console.error('Cliente de Supabase no disponible en GET /api/products/[id]')
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      }
      return NextResponse.json(errorResponse, { status: 503 })
    }

    // Obtener producto con categoría y variantes
    const { data: product, error } = await supabase
      .from('products')
      .select(
        `
        id, name, slug, description, price, discounted_price, brand, stock, images, created_at, updated_at, aikon_id, color, medida,
        category:categories(id, name, slug)
      `
      )
      .eq('id', id)
      .single()

    // ✅ NUEVO: Obtener imágenes desde product_images (prioridad sobre campo images JSONB)
    let primaryImageUrl: string | null = null
    if (product) {
      const { data: productImages } = await supabase
        .from('product_images')
        .select('url, is_primary')
        .eq('product_id', id)
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true })
        .limit(1)
      
      primaryImageUrl = productImages?.[0]?.url || null
    }

    // ✅ NUEVO: Obtener ficha técnica del producto
    let technicalSheet: { id: string; url: string; title: string | null; original_filename: string | null; file_size: number | null } | null = null
    if (product) {
      const { data: sheet } = await supabase
        .from('product_technical_sheets')
        .select('id, url, title, original_filename, file_size')
        .eq('product_id', id)
        .single()
      
      technicalSheet = sheet || null
    }

    if (error) {
      if (error.code === 'PGRST116') {
        const notFoundResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Producto no encontrado',
        }
        return NextResponse.json(notFoundResponse, { status: 404 })
      }
      handleSupabaseError(error, `GET /api/products/${id}`)
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
          .eq('product_id', id)
          .eq('is_active', true)
          .order('is_default', { ascending: false })

        // Post-proceso: enriquecer variantes para el producto 42 con medidas faltantes y color cemento/gris
        let processedVariants = variants || []
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
          // ✅ CORREGIDO: Parsear medida si viene como string de array
          medida: (() => {
            const rawMedida = product.medida || defaultVariant?.measure
            if (!rawMedida) return null
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
          // Agregar información de variantes
          variants: processedVariants || [],
          variant_count: processedVariants?.length || 0,
          has_variants: (variants?.length || 0) > 0,
          default_variant: defaultVariant || null,
          // Usar precios de la variante por defecto si están disponibles
          price: defaultVariant?.price_list || product.price,
          discounted_price: defaultVariant?.price_sale || product.discounted_price,
          stock: defaultVariant?.stock !== undefined ? defaultVariant.stock : product.stock,
          // ✅ NUEVO: Agregar image_url desde product_images si está disponible
          image_url: primaryImageUrl || defaultVariant?.image_url || null,
          // ✅ NUEVO: Agregar ficha técnica
          technical_sheet: technicalSheet,
          technical_sheet_url: technicalSheet?.url || null,
        }
      } catch (variantError) {
        // Si hay error obteniendo variantes, continuar con producto original
        console.warn('Error obteniendo variantes para producto:', id, variantError)
      }
    }

    // ✅ NUEVO: Si no se enriqueció el producto, agregar image_url y parsear medida directamente
    if (!enrichedProduct && product) {
      // ✅ CORREGIDO: Parsear medida si viene como string de array
      let parsedMedida = product.medida
      if (parsedMedida && typeof parsedMedida === 'string' && parsedMedida.trim().startsWith('[') && parsedMedida.trim().endsWith(']')) {
        try {
          const parsed = JSON.parse(parsedMedida)
          parsedMedida = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : parsedMedida
        } catch {
          // Si falla el parse, usar la medida original
        }
      }
      
      enrichedProduct = {
        ...product,
        // ✅ NUEVO: Normalizar título del producto a formato capitalizado
        name: normalizeProductTitle(product.name),
        medida: parsedMedida,
        image_url: primaryImageUrl || null,
        // ✅ NUEVO: Agregar ficha técnica
        technical_sheet: technicalSheet,
        technical_sheet_url: technicalSheet?.url || null,
      }
    } else if (enrichedProduct && !enrichedProduct.image_url) {
      enrichedProduct.image_url = primaryImageUrl || null
    }
    
    // ✅ NUEVO: Asegurar que la ficha técnica esté presente en enrichedProduct
    if (enrichedProduct && !enrichedProduct.technical_sheet) {
      enrichedProduct.technical_sheet = technicalSheet
      enrichedProduct.technical_sheet_url = technicalSheet?.url || null
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
    console.error('Error en GET /api/products/[id]:', error)

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// ===================================
// PUT /api/products/[id] - Actualizar producto (Admin)
// ===================================
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    // TODO: Verificar permisos de administrador
    // const { userId } = auth();
    // if (!userId || !isAdmin(userId)) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    // Validar parámetro ID
    const id = parseInt(params.id, 10)
    if (isNaN(id) || id <= 0) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de producto inválido',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const body = await request.json()

    // Validar datos del producto (permitir actualizaciones parciales)
    const productData = validateData(ProductSchema.partial(), body)

    const supabase = getSupabaseClient(true) // Usar cliente admin

    // Verificar que el cliente administrativo esté disponible
    if (!supabase) {
      console.error('Cliente administrativo de Supabase no disponible en PUT /api/products/[id]')
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio administrativo no disponible',
      }
      return NextResponse.json(errorResponse, { status: 503 })
    }

    // Actualizar producto
    const { data: product, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select(
        `
        *,
        category:categories(id, name, slug)
      `
      )
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
      handleSupabaseError(error, `PUT /api/products/${id}`)
    }

    const response: ApiResponse<ProductWithCategory> = {
      data: product,
      success: true,
      message: 'Producto actualizado exitosamente',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error en PUT /api/products/[id]:', error)

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// ===================================
// DELETE /api/products/[id] - Eliminar producto (Admin)
// ===================================
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    // TODO: Verificar permisos de administrador
    // const { userId } = auth();
    // if (!userId || !isAdmin(userId)) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    // Validar parámetro ID
    const id = parseInt(params.id, 10)
    if (isNaN(id) || id <= 0) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de producto inválido',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const supabase = getSupabaseClient(true) // Usar cliente admin

    // Verificar que el cliente administrativo esté disponible
    if (!supabase) {
      console.error('Cliente administrativo de Supabase no disponible en DELETE /api/products/[id]')
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio administrativo no disponible',
      }
      return NextResponse.json(errorResponse, { status: 503 })
    }

    // Eliminar producto
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
      handleSupabaseError(error, `DELETE /api/products/${id}`)
    }

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: 'Producto eliminado exitosamente',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error en DELETE /api/products/[id]:', error)

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
