// ===================================
// PINTEYA E-COMMERCE - API DE DUPLICAR VARIANTE
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { createSecurityLogger } from '@/lib/logging/security-logger'

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
}

// ===================================
// POST /api/admin/products/variants/duplicate - Duplicar variante
// ===================================
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ProductVariant>>> {
  const securityLogger = createSecurityLogger(request)

  return withRateLimit(request, RATE_LIMIT_CONFIGS.admin, async () => {
    try {
      const body = await request.json()
      const { variantId, productId } = body

      if (!variantId || !productId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Se requiere variantId y productId',
            data: null,
          },
          { status: 400 }
        )
      }

      const supabase = getSupabaseClient()

      // Obtener variante original
      const { data: originalVariant, error: fetchError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('id', variantId)
        .eq('product_id', productId)
        .single()

      if (fetchError || !originalVariant) {
        securityLogger.logSuspiciousActivity(
          securityLogger.context,
          'Variant not found for duplication',
          {
            variantId,
            productId,
            endpoint: '/api/admin/products/variants/duplicate',
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

      // Generar nuevo aikon_id único
      let newAikonId = `${originalVariant.aikon_id}-COPIA`
      let counter = 1
      let isUnique = false

      while (!isUnique) {
        const { data: existingVariant } = await supabase
          .from('product_variants')
          .select('id')
          .eq('aikon_id', newAikonId)
          .single()

        if (!existingVariant) {
          isUnique = true
        } else {
          counter++
          newAikonId = `${originalVariant.aikon_id}-COPIA-${counter}`
        }
      }

      // Generar nuevo variant_slug único
      let newVariantSlug = `${originalVariant.variant_slug}-copia`
      let slugCounter = 1
      let isSlugUnique = false

      while (!isSlugUnique) {
        const { data: existingSlug } = await supabase
          .from('product_variants')
          .select('id')
          .eq('variant_slug', newVariantSlug)
          .single()

        if (!existingSlug) {
          isSlugUnique = true
        } else {
          slugCounter++
          newVariantSlug = `${originalVariant.variant_slug}-copia-${slugCounter}`
        }
      }

      // Crear copia de la variante
      const newVariant = {
        product_id: originalVariant.product_id,
        aikon_id: newAikonId,
        variant_slug: newVariantSlug,
        color_name: originalVariant.color_name,
        color_hex: originalVariant.color_hex,
        measure: originalVariant.measure,
        finish: originalVariant.finish,
        price_list: originalVariant.price_list,
        price_sale: originalVariant.price_sale,
        stock: originalVariant.stock,
        is_active: true,
        is_default: false, // Las copias nunca son default
        image_url: originalVariant.image_url,
        metadata: originalVariant.metadata,
      }

      // Insertar nueva variante
      const { data: duplicatedVariant, error: insertError } = await supabase
        .from('product_variants')
        .insert(newVariant)
        .select()
        .single()

      if (insertError || !duplicatedVariant) {
        securityLogger.logApiError(
          securityLogger.context,
          new Error(insertError?.message || 'Error al duplicar variante'),
          {
            variantId,
            productId,
            endpoint: '/api/admin/products/variants/duplicate',
          }
        )

        return NextResponse.json(
          {
            success: false,
            error: 'Error al duplicar variante',
            data: null,
          },
          { status: 500 }
        )
      }

      console.log(
        `[VARIANT] Variant duplicated successfully: ${variantId} → ${duplicatedVariant.id} for product ${productId}`
      )

      return NextResponse.json({
        success: true,
        data: duplicatedVariant,
        message: 'Variante duplicada exitosamente',
      })
    } catch (error: any) {
      securityLogger.logApiError(
        securityLogger.context,
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: '/api/admin/products/variants/duplicate',
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

