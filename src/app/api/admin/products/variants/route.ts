// ===================================
// PINTEYA E-COMMERCE - API ADMIN DE VARIANTES DE PRODUCTOS
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, handleSupabaseError, supabaseAdmin } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { createSecurityLogger } from '@/lib/logging/security-logger'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

// Tipo para variante de producto
interface ProductVariant {
  id: number
  product_id: number
  aikon_id: number
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

      console.log('📥 [POST Variant] Datos recibidos:', JSON.stringify(body, null, 2))

      // Validar campos requeridos - Usar verificación más estricta
      if (!body.product_id || (typeof body.product_id !== 'number' && isNaN(parseInt(String(body.product_id))))) {
        return NextResponse.json(
          {
            success: false,
            error: 'Campo requerido: product_id debe ser un número válido',
            data: null,
          },
          { status: 400 }
        )
      }

      // Convertir a number si viene como string (caso edge desde frontend)
      const aikonId = typeof body.aikon_id === 'string' ? parseInt(body.aikon_id, 10) : body.aikon_id
      
      if (!aikonId || typeof aikonId !== 'number' || aikonId <= 0 || aikonId > 999999) {
        return NextResponse.json(
          {
            success: false,
            error: 'Campo requerido: aikon_id debe ser un número entre 1 y 999999',
            data: null,
          },
          { status: 400 }
        )
      }

      if (body.price_list === undefined || body.price_list === null || (typeof body.price_list === 'number' && (isNaN(body.price_list) || body.price_list <= 0))) {
        return NextResponse.json(
          {
            success: false,
            error: 'Campo requerido: price_list debe ser un número mayor a 0',
            data: null,
          },
          { status: 400 }
        )
      }

      // Usar supabaseAdmin para evitar problemas con RLS (Row Level Security)
      const supabase = supabaseAdmin

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

      // Verificar que el aikon_id no existe (incluir información del producto que lo usa)
      const { data: existingVariant, error: existingVariantError } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          color_name,
          measure,
          products!inner(id, name)
        `)
        .eq('aikon_id', body.aikon_id)
        .single()

      if (existingVariant && !existingVariantError) {
        const productName = (existingVariant as any).products?.name || 'Producto desconocido'
        const variantInfo = existingVariant.color_name || existingVariant.measure 
          ? ` (${[existingVariant.color_name, existingVariant.measure].filter(Boolean).join(', ')})`
          : ''
        
        return NextResponse.json(
          {
            success: false,
            error: `El código Aikon "${body.aikon_id}" ya está en uso por el producto "${productName}"${variantInfo}`,
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

      // ✅ Preparar datos de inserción con validación de tipos
      const insertData: any = {
        product_id: parseInt(String(body.product_id), 10),
        aikon_id: aikonId,
        variant_slug: variantSlug,
        color_name: body.color_name && typeof body.color_name === 'string' && body.color_name.trim() !== '' ? body.color_name.trim() : null,
        color_hex: body.color_hex && typeof body.color_hex === 'string' && body.color_hex.trim() !== '' ? body.color_hex.trim() : null,
        measure: body.measure && typeof body.measure === 'string' && body.measure.trim() !== '' ? body.measure.trim() : null,
        finish: body.finish && typeof body.finish === 'string' && body.finish.trim() !== '' ? body.finish.trim() : null,
        price_list: parseFloat(String(body.price_list)),
        price_sale: body.price_sale && body.price_sale !== null && body.price_sale !== '' ? parseFloat(String(body.price_sale)) : null,
        stock: body.stock !== undefined && body.stock !== null ? parseInt(String(body.stock), 10) : 0,
        is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
        is_default: body.is_default === true,
        image_url: body.image_url && typeof body.image_url === 'string' && body.image_url.trim() !== '' ? body.image_url.trim() : null,
        metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
      }

      // Validar que price_list sea válido después del parseFloat
      if (isNaN(insertData.price_list) || insertData.price_list <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'price_list debe ser un número mayor a 0',
            data: null,
          },
          { status: 400 }
        )
      }

      console.log('📦 [POST Variant] Datos preparados para insertar:', JSON.stringify(insertData, null, 2))

      // ✅ VALIDACIÓN: Asegurar que color_hex no exceda 7 caracteres (formato #RRGGBB)
      if (insertData.color_hex && insertData.color_hex.length > 7) {
        console.warn(`⚠️ [POST Variant] color_hex truncado de ${insertData.color_hex.length} a 7 caracteres: ${insertData.color_hex}`)
        insertData.color_hex = insertData.color_hex.substring(0, 7)
      }

      // ✅ VALIDACIÓN: Asegurar que finish no exceda 100 caracteres (por si acaso)
      if (insertData.finish && insertData.finish.length > 100) {
        insertData.finish = insertData.finish.substring(0, 100)
        console.warn(`⚠️ [POST Variant] Finish truncado a 100 caracteres: ${insertData.finish}`)
      }

      // ✅ DEBUG: Log del valor de finish antes de insertar
      console.log(`🔍 [POST Variant] Insertando variante con finish:`, {
        finish: insertData.finish,
        finishLength: insertData.finish?.length,
        finishType: typeof insertData.finish,
        insertDataKeys: Object.keys(insertData),
      })

      // Crear variante
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .insert(insertData)
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

        console.error('[API] Error creating variant:', variantError)
        console.error('[API] Variant error details:', {
          message: variantError.message,
          code: variantError.code,
          details: variantError.details,
          hint: variantError.hint,
        })
        console.error('[API] Variant data being inserted:', JSON.stringify({
          product_id: body.product_id,
          aikon_id: body.aikon_id,
          color_name: body.color_name,
          color_hex: body.color_hex,
          measure: body.measure,
          finish: body.finish,
          finishLength: body.finish?.length,
          price_list: body.price_list,
          price_sale: body.price_sale,
          stock: body.stock,
        }, null, 2))

        return NextResponse.json(
          {
            success: false,
            error: variantError.message || 'Error al crear variante',
            data: null,
            details: variantError.details || null,
          },
          { status: 500 }
        )
      }

      // ✅ NUEVO: Guardar color en la paleta si no existe (DESPUÉS de crear la variante)
      if (insertData.color_name && insertData.color_hex) {
        try {
          const colorNameLower = insertData.color_name.toLowerCase().trim()
          
          // Verificar si el color ya existe en la paleta (case-insensitive)
          const { data: existingColor } = await supabaseAdmin
            .from('color_palette')
            .select('id')
            .ilike('name', colorNameLower)
            .maybeSingle()

          // Si no existe, guardarlo
          if (!existingColor) {
            // ✅ VALIDACIÓN: Asegurar que hex no exceda 7 caracteres
            const hexValue = insertData.color_hex.trim().substring(0, 7)
            const { error: colorError } = await supabaseAdmin
              .from('color_palette')
              .insert({
                name: insertData.color_name.trim(),
                display_name: insertData.color_name.trim(),
                hex: hexValue,
                category: 'Personalizado',
                family: 'Personalizados',
                is_popular: false,
                description: `Color personalizado agregado automáticamente: ${insertData.color_name}`,
              } as any)

            if (colorError) {
              console.warn(`⚠️ [POST Variant] No se pudo guardar color en paleta: ${colorError.message}`)
              // No fallar la creación de la variante si falla el guardado del color
            } else {
              console.log(`✅ [POST Variant] Color "${insertData.color_name}" guardado en paleta automáticamente`)
            }
          }
        } catch (error) {
          console.warn(`⚠️ [POST Variant] Error al verificar/guardar color en paleta:`, error)
          // No fallar la creación de la variante si falla el guardado del color
        }
      }

      // ✅ NUEVO: Guardar medida en la paleta si no existe (DESPUÉS de crear la variante)
      if (insertData.measure) {
        try {
          const measureTrimmed = insertData.measure.trim()
          const measureLower = measureTrimmed.toLowerCase()
          
          // Extraer tipo de unidad de la medida
          const unitTypeMatch = measureTrimmed.match(/(L|KG|CC|ml|g|Nº|N°|N)/i)
          const unitType = unitTypeMatch ? unitTypeMatch[1].toUpperCase() : null
          
          // Determinar categoría basada en el tipo de unidad
          let category = 'Personalizado'
          if (unitType === 'L' || unitType === 'ML' || unitType === 'CC') {
            category = 'Volumen'
          } else if (unitType === 'KG' || unitType === 'G') {
            category = 'Peso'
          } else if (unitType === 'Nº' || unitType === 'N°' || unitType === 'N') {
            category = 'Unidad'
          }
          
          // Verificar si la medida ya existe en la paleta (case-insensitive)
          const { data: existingMeasure } = await supabaseAdmin
            .from('measure_palette')
            .select('id')
            .ilike('measure', measureLower)
            .maybeSingle()

          // Si no existe, guardarla
          if (!existingMeasure) {
            const { error: measureError } = await supabaseAdmin
              .from('measure_palette')
              .insert({
                measure: measureTrimmed,
                category: category,
                unit_type: unitType,
                is_popular: false,
                description: `Medida personalizada agregada automáticamente: ${measureTrimmed}`,
              } as any)

            if (measureError) {
              console.warn(`⚠️ [POST Variant] No se pudo guardar medida en paleta: ${measureError.message}`)
              // No fallar la creación de la variante si falla el guardado de la medida
            } else {
              console.log(`✅ [POST Variant] Medida "${measureTrimmed}" guardada en paleta automáticamente`)
            }
          }
        } catch (error) {
          console.warn(`⚠️ [POST Variant] Error al verificar/guardar medida en paleta:`, error)
          // No fallar la creación de la variante si falla el guardado de la medida
        }
      }

      // ✅ NUEVO: Guardar terminación en la paleta si no existe (DESPUÉS de crear la variante)
      if (insertData.finish) {
        try {
          const finishTrimmed = insertData.finish.trim()
          const finishLower = finishTrimmed.toLowerCase()
          
          // Determinar categoría basada en el tipo de producto (podría mejorarse con más contexto)
          // Por ahora, categoría genérica
          const category = 'General'
          
          // Verificar si la terminación ya existe en la paleta (case-insensitive)
          const { data: existingFinish } = await supabaseAdmin
            .from('finish_palette')
            .select('id')
            .ilike('finish', finishLower)
            .maybeSingle()

          // Si no existe, guardarla
          if (!existingFinish) {
            const { error: finishError } = await supabaseAdmin
              .from('finish_palette')
              .insert({
                finish: finishTrimmed,
                category: category,
                is_popular: false,
                description: `Terminación personalizada agregada automáticamente: ${finishTrimmed}`,
              } as any)

            if (finishError) {
              console.warn(`⚠️ [POST Variant] No se pudo guardar terminación en paleta: ${finishError.message}`)
              // No fallar la creación de la variante si falla el guardado de la terminación
            } else {
              console.log(`✅ [POST Variant] Terminación "${finishTrimmed}" guardada en paleta automáticamente`)
            }
          }
        } catch (error) {
          console.warn(`⚠️ [POST Variant] Error al verificar/guardar terminación en paleta:`, error)
          // No fallar la creación de la variante si falla el guardado de la terminación
        }
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