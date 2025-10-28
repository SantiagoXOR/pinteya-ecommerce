// ===================================
// PINTEYA E-COMMERCE - API DE VARIANTE INDIVIDUAL
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, handleSupabaseError } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { createSecurityLogger } from '@/lib/logging/security-logger'

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
// GET /api/products/[id]/variants/[variantId] - Obtener variante específica
// ===================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; variantId: string }> }
): Promise<NextResponse<ApiResponse<ProductVariant>>> {
  const securityLogger = createSecurityLogger(request)

  return withRateLimit(request, RATE_LIMIT_CONFIGS.products, async () => {
    try {
      const params = await context.params
      const productId = parseInt(params.id)
      const variantId = parseInt(params.variantId)

      if (isNaN(productId) || productId <= 0 || isNaN(variantId) || variantId <= 0) {
        securityLogger.logSuspiciousActivity(
          securityLogger.context,
          'Invalid product or variant ID provided',
          {
            productId: params.id,
            variantId: params.variantId,
            endpoint: '/api/products/[id]/variants/[variantId]',
          }
        )

        return NextResponse.json(
          {
            success: false,
            error: 'ID de producto o variante inválido',
            data: null,
          },
          { status: 400 }
        )
      }

      const supabase = getSupabaseClient()

      // Obtener variante específica
      const { data: variant, error: variantError } = await supabase
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
          updated_at
        `)
        .eq('id', variantId)
        .eq('product_id', productId)
        .eq('is_active', true)
        .single()

      if (variantError || !variant) {
        securityLogger.logSuspiciousActivity(
          securityLogger.context,
          'Variant not found',
          {
            productId,
            variantId,
            endpoint: '/api/products/[id]/variants/[variantId]',
          }
        )

        return NextResponse.json(
          {
            success: false,
            error: 'Variante no encontrada',
            data: null,
          },
          { status: 404 }
        )
      }

      // Log de éxito - usando console.log para eventos informativos
      console.log(`[VARIANT] Variant fetched successfully: ${variantId} for product ${productId}`)

      return NextResponse.json({
        success: true,
        data: variant,
        error: null,
      })
    } catch (error: any) {
      securityLogger.logApiError(
        securityLogger.context,
        error instanceof Error ? error : new Error(String(error)),
        {
          productId,
          variantId,
          endpoint: '/api/products/[id]/variants/[variantId]',
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
// PUT /api/products/[id]/variants/[variantId] - Actualizar variante (Admin only)
// ===================================
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; variantId: string }> }
): Promise<NextResponse<ApiResponse<ProductVariant>>> {
  const securityLogger = createSecurityLogger(request)

  return withRateLimit(request, RATE_LIMIT_CONFIGS.admin, async () => {
    try {
      const params = await context.params
      const productId = parseInt(params.id)
      const variantId = parseInt(params.variantId)

      if (isNaN(productId) || isNaN(variantId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'ID de producto o variante inválido',
            data: null,
          },
          { status: 400 }
        )
      }

      const body = await request.json()
      const supabase = getSupabaseClient()

      // Verificar que la variante existe
      const { data: existingVariant, error: existingError } = await supabase
        .from('product_variants')
        .select('id, product_id, aikon_id')
        .eq('id', variantId)
        .eq('product_id', productId)
        .single()

      if (existingError || !existingVariant) {
        return NextResponse.json(
          {
            success: false,
            error: 'Variante no encontrada',
            data: null,
          },
          { status: 404 }
        )
      }

      // Preparar datos de actualización
      const updateData: any = {}
      updateData.updated_at = new Date().toISOString()

      if (body.color_name !== undefined) updateData.color_name = body.color_name
      if (body.color_hex !== undefined) updateData.color_hex = body.color_hex
      if (body.measure !== undefined) updateData.measure = body.measure
      if (body.finish !== undefined) updateData.finish = body.finish
      if (body.price_list !== undefined) updateData.price_list = parseFloat(body.price_list)
      if (body.price_sale !== undefined) updateData.price_sale = body.price_sale ? parseFloat(body.price_sale) : null
      if (body.stock !== undefined) updateData.stock = parseInt(body.stock)
      if (body.is_active !== undefined) updateData.is_active = body.is_active
      if (body.is_default !== undefined) updateData.is_default = body.is_default
      if (body.image_url !== undefined) updateData.image_url = body.image_url
      if (body.metadata !== undefined) updateData.metadata = body.metadata

      console.log('[VARIANT UPDATE] Updating variant:', { variantId, productId, updateData })

      // Actualizar variante
      const { data: updatedVariant, error: updateError } = await supabase
        .from('product_variants')
        .update(updateData)
        .eq('id', variantId)
        .eq('product_id', productId)
        .select()
        .single()

      if (updateError) {
        console.error('[VARIANT UPDATE] Error:', updateError)
        securityLogger.logApiError(
          securityLogger.context,
          new Error(updateError.message),
          {
            productId,
            variantId,
            endpoint: '/api/products/[id]/variants/[variantId]',
          }
        )

        return NextResponse.json(
          {
            success: false,
            error: 'Error al actualizar variante',
            data: null,
          },
          { status: 500 }
        )
      }

      // Log de éxito - usando console.log para eventos informativos
      console.log(`[VARIANT] Variant updated successfully: ${variantId} for product ${productId}`)

      return NextResponse.json({
        success: true,
        data: updatedVariant,
        error: null,
      })
    } catch (error: any) {
      securityLogger.logApiError(
        securityLogger.context,
        error instanceof Error ? error : new Error(String(error)),
        {
          productId,
          variantId,
          endpoint: '/api/products/[id]/variants/[variantId]',
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
// DELETE /api/products/[id]/variants/[variantId] - Eliminar variante (Admin only)
// ===================================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; variantId: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  const securityLogger = createSecurityLogger(request)

  return withRateLimit(request, RATE_LIMIT_CONFIGS.admin, async () => {
    try {
      const params = await context.params
      const productId = parseInt(params.id)
      const variantId = parseInt(params.variantId)

      if (isNaN(productId) || isNaN(variantId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'ID de producto o variante inválido',
            data: null,
          },
          { status: 400 }
        )
      }

      const supabase = getSupabaseClient()

      // Verificar que la variante existe y no es la única variante del producto
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, is_default')
        .eq('product_id', productId)
        .eq('is_active', true)

      if (variantsError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Error al verificar variantes',
            data: null,
          },
          { status: 500 }
        )
      }

      if (variants.length <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: 'No se puede eliminar la única variante del producto',
            data: null,
          },
          { status: 400 }
        )
      }

      const variantToDelete = variants.find(v => v.id === variantId)
      if (!variantToDelete) {
        return NextResponse.json(
          {
            success: false,
            error: 'Variante no encontrada',
            data: null,
          },
          { status: 404 }
        )
      }

      // Si es la variante por defecto, asignar otra como defecto
      if (variantToDelete.is_default) {
        const newDefaultVariant = variants.find(v => v.id !== variantId)
        if (newDefaultVariant) {
          await supabase
            .from('product_variants')
            .update({ is_default: true })
            .eq('id', newDefaultVariant.id)
        }
      }

      // Eliminar variante (soft delete)
      const { error: deleteError } = await supabase
        .from('product_variants')
        .update({ is_active: false })
        .eq('id', variantId)
        .eq('product_id', productId)

      if (deleteError) {
        securityLogger.logApiError(
          securityLogger.context,
          new Error(deleteError.message),
          {
            productId,
            variantId,
            endpoint: '/api/products/[id]/variants/[variantId]',
          }
        )

        return NextResponse.json(
          {
            success: false,
            error: 'Error al eliminar variante',
            data: null,
          },
          { status: 500 }
        )
      }

      // Log de éxito - usando console.log para eventos informativos
      console.log(`[VARIANT] Variant deleted successfully: ${variantId} for product ${productId}`)

      return NextResponse.json({
        success: true,
        data: null,
        message: 'Variante eliminada exitosamente',
      })
    } catch (error: any) {
      securityLogger.logApiError(
        securityLogger.context,
        error instanceof Error ? error : new Error(String(error)),
        {
          productId,
          variantId,
          endpoint: '/api/products/[id]/variants/[variantId]',
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