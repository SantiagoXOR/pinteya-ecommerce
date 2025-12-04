// ===================================
// PINTEYA E-COMMERCE - API ADMIN DE VARIANTES DE PRODUCTOS
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, handleSupabaseError } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { createSecurityLogger } from '@/lib/logging/security-logger'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

// Tipo para variante de producto
interface ProductVariant {
  id: number
  product_id: number
  aikon_id: string
  variant_slug: string
  color_name?: string
  color_hex?: string
  measure?: string
  finish?: string
  price_list: number
  price_sale?: number
  stock: number
  is_active: boolean
  is_default: boolean
  image_url?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

// ===================================
// GET /api/admin/products/variants - Obtener todas las variantes (Admin)
// ===================================
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ProductVariant[]>>> {
  const securityLogger = createSecurityLogger(request)

  return withRateLimit(request, RATE_LIMIT_CONFIGS.admin, async () => {
    try {
      // Verificar acceso de administrador
      const adminCheck = await requireAdminAuth()
      if (!adminCheck.success) {
        securityLogger.logPermissionDenied(
          securityLogger.context,
          'admin variants',
          'access'
        )

        return NextResponse.json(
          {
            success: false,
            error: adminCheck.error,
            data: null,
          },
          { status: adminCheck.status || 401 }
        )
      }

      const { searchParams } = new URL(request.url)
      const productId = searchParams.get('product_id')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const search = searchParams.get('search')
      const isActive = searchParams.get('is_active')

      const supabase = getSupabaseClient()

      // Construir query
      let query = supabase
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
          metadata,
          created_at,
          updated_at,
          products!inner(id, name, slug)
        `, { count: 'exact' })

      // Aplicar filtros
      if (productId) {
        query = query.eq('product_id', parseInt(productId))
      }

      if (isActive !== null) {
        query = query.eq('is_active', isActive === 'true')
      }

      if (search) {
        query = query.or(`aikon_id.ilike.%${search}%,color_name.ilike.%${search}%,measure.ilike.%${search}%`)
      }

      // Paginación
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      // Ordenar
      query = query.order('created_at', { ascending: false })

      const { data: variants, error: variantsError, count } = await query

      if (variantsError) {
        securityLogger.logApiError(
          securityLogger.context,
          new Error(variantsError.message),
          {
            endpoint: '/api/admin/products/variants',
            operation: 'fetch_variants',
          }
        )

        return NextResponse.json(
          {
            success: false,
            error: 'Error al obtener variantes',
            data: null,
          },
          { status: 500 }
        )
      }

      // Log de éxito - usando console.log para eventos informativos
      console.log(`[ADMIN] Variants fetched successfully: ${variants?.length || 0} variants`)

      return NextResponse.json({
        success: true,
        data: variants || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error: any) {
      securityLogger.logApiError(
        securityLogger.context,
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: '/api/admin/products/variants',
          operation: 'get_variants',
        }
      )

      return NextResponse.json(
        {
          success: false,
          error: 'Error interno del servidor',
          data: null,
        },
        { status: 500 }
      )
    }
  })
}

// ===================================
// POST /api/admin/products/variants - Crear nueva variante (Admin)
// ===================================
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ProductVariant>>> {
  const securityLogger = createSecurityLogger(request)

  return withRateLimit(request, RATE_LIMIT_CONFIGS.admin, async () => {
    try {
      // Verificar acceso de administrador
      const adminCheck = await requireAdminAuth()
      if (!adminCheck.success) {
        return NextResponse.json(
          {
            success: false,
            error: adminCheck.error,
            data: null,
          },
          { status: adminCheck.status || 401 }
        )
      }

      const body = await request.json()

      // Validar campos requeridos
      const requiredFields = ['product_id', 'aikon_id', 'price_list']
      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            {
              success: false,
              error: `Campo requerido: ${field}`,
              data: null,
            },
            { status: 400 }
          )
        }
      }

      const supabase = getSupabaseClient()

      // Verificar que el producto existe
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, slug')
        .eq('id', body.product_id)
        .single()

      if (productError || !product) {
        return NextResponse.json(
          {
            success: false,
            error: 'Producto no encontrado',
            data: null,
          },
          { status: 404 }
        )
      }

      // Verificar que el aikon_id no existe
      const { data: existingVariant } = await supabase
        .from('product_variants')
        .select('id')
        .eq('aikon_id', body.aikon_id)
        .single()

      if (existingVariant) {
        return NextResponse.json(
          {
            success: false,
            error: 'El código Aikon ya existe',
            data: null,
          },
          { status: 400 }
        )
      }

      // Generar slug único para la variante
      const baseSlug = `${product.slug}-${body.color_name || 'variant'}-${body.measure || 'default'}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      let variantSlug = baseSlug
      let counter = 1

      // Verificar unicidad del slug
      while (true) {
        const { data: existingSlug } = await supabase
          .from('product_variants')
          .select('id')
          .eq('variant_slug', variantSlug)
          .single()

        if (!existingSlug) break
        variantSlug = `${baseSlug}-${counter}`
        counter++
      }

      // Crear variante
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: body.product_id,
          aikon_id: body.aikon_id,
          variant_slug: variantSlug,
          color_name: body.color_name || null,
          color_hex: body.color_hex || null,
          measure: body.measure || null,
          finish: body.finish || null,
          price_list: parseFloat(body.price_list),
          price_sale: body.price_sale ? parseFloat(body.price_sale) : null,
          stock: parseInt(body.stock) || 0,
          is_active: body.is_active !== false,
          is_default: body.is_default === true,
          image_url: body.image_url || null,
          metadata: body.metadata || {},
        })
        .select()
        .single()

      if (variantError) {
        securityLogger.logApiError(
          securityLogger.context,
          new Error(variantError.message),
          {
            endpoint: '/api/admin/products/variants',
            operation: 'create_variant',
            productId: body.product_id,
          }
        )

        return NextResponse.json(
          {
            success: false,
            error: 'Error al crear variante',
            data: null,
          },
          { status: 500 }
        )
      }

      // Log de éxito - usando console.log para eventos informativos
      console.log(`[ADMIN] Variant created successfully: ${variant.id} for product ${body.product_id}`)

      return NextResponse.json({
        success: true,
        data: variant,
        message: 'Variante creada exitosamente',
      })
    } catch (error: any) {
      securityLogger.logApiError(
        securityLogger.context,
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: '/api/admin/products/variants',
          operation: 'create_variant',
        }
      )

      return NextResponse.json(
        {
          success: false,
          error: 'Error interno del servidor',
          data: null,
        },
        { status: 500 }
      )
    }
  })
}

// ===================================
// PUT /api/admin/products/variants - Actualización masiva de variantes (Admin)
// ===================================
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<{ updated: number }>>> {
  const securityLogger = createSecurityLogger(request)

  return withRateLimit(request, RATE_LIMIT_CONFIGS.admin, async () => {
    try {
      // Verificar acceso de administrador
      const adminCheck = await requireAdminAuth()
      if (!adminCheck.success) {
        return NextResponse.json(
          {
            success: false,
            error: adminCheck.error,
            data: null,
          },
          { status: adminCheck.status || 401 }
        )
      }

      const body = await request.json()
      const { variant_ids, updates } = body

      if (!variant_ids || !Array.isArray(variant_ids) || variant_ids.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'IDs de variantes requeridos',
            data: null,
          },
          { status: 400 }
        )
      }

      if (!updates || typeof updates !== 'object') {
        return NextResponse.json(
          {
            success: false,
            error: 'Datos de actualización requeridos',
            data: null,
          },
          { status: 400 }
        )
      }

      const supabase = getSupabaseClient()

      // Preparar datos de actualización
      const updateData: Partial<ProductVariant> = {}
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active
      if (updates.stock !== undefined) updateData.stock = parseInt(updates.stock)
      if (updates.price_list !== undefined) updateData.price_list = parseFloat(updates.price_list)
      if (updates.price_sale !== undefined) updateData.price_sale = updates.price_sale ? parseFloat(updates.price_sale) : null

      // Actualizar variantes
      const { data: updatedVariants, error: updateError } = await supabase
        .from('product_variants')
        .update(updateData)
        .in('id', variant_ids)
        .select('id')

      if (updateError) {
        securityLogger.logApiError(
          securityLogger.context,
          new Error(updateError.message),
          {
            endpoint: '/api/admin/products/variants',
            operation: 'bulk_update',
            variantIds: variant_ids,
          }
        )

        return NextResponse.json(
          {
            success: false,
            error: 'Error al actualizar variantes',
            data: null,
          },
          { status: 500 }
        )
      }

      // Log de éxito - usando console.log para eventos informativos
      console.log(`[ADMIN] Bulk variants updated successfully: ${variant_ids.length} variants`)

      return NextResponse.json({
        success: true,
        data: { updated: updatedVariants?.length || 0 },
        message: `${updatedVariants?.length || 0} variantes actualizadas`,
      })
    } catch (error: any) {
      securityLogger.logApiError(
        securityLogger.context,
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: '/api/admin/products/variants',
          operation: 'bulk_update',
        }
      )

      return NextResponse.json(
        {
          success: false,
          error: 'Error interno del servidor',
          data: null,
        },
        { status: 500 }
      )
    }
  })
}