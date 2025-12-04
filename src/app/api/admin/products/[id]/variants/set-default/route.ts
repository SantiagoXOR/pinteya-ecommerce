// ===================================
// PINTEYA E-COMMERCE - API DE MARCAR VARIANTE COMO DEFAULT
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { createSecurityLogger } from '@/lib/logging/security-logger'

// ===================================
// POST /api/admin/products/[id]/variants/set-default - Marcar variante como default
// ===================================
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  const securityLogger = createSecurityLogger(request)

  return withRateLimit(request, RATE_LIMIT_CONFIGS.admin, async () => {
    try {
      const params = await context.params
      const productId = parseInt(params.id)
      const body = await request.json()
      const { variantId } = body

      if (isNaN(productId) || !variantId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Se requiere productId y variantId válidos',
            data: null,
          },
          { status: 400 }
        )
      }

      const supabase = getSupabaseClient()

      // Verificar que la variante existe y pertenece al producto
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('id, product_id, is_active')
        .eq('id', variantId)
        .eq('product_id', productId)
        .single()

      if (variantError || !variant) {
        securityLogger.logSuspiciousActivity(
          securityLogger.context,
          'Variant not found for set-default',
          {
            variantId,
            productId,
            endpoint: '/api/admin/products/[id]/variants/set-default',
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

      if (!variant.is_active) {
        return NextResponse.json(
          {
            success: false,
            error: 'No se puede marcar una variante inactiva como predeterminada',
            data: null,
          },
          { status: 400 }
        )
      }

      // Transaction: Desmarcar todas las variantes del producto y marcar la nueva
      // Paso 1: Desmarcar todas
      const { error: unsetError } = await supabase
        .from('product_variants')
        .update({ is_default: false })
        .eq('product_id', productId)

      if (unsetError) {
        securityLogger.logApiError(
          securityLogger.context,
          new Error(unsetError.message),
          {
            productId,
            variantId,
            step: 'unset-all-defaults',
            endpoint: '/api/admin/products/[id]/variants/set-default',
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

      // Paso 2: Marcar la nueva como default
      const { error: setError } = await supabase
        .from('product_variants')
        .update({ is_default: true })
        .eq('id', variantId)
        .eq('product_id', productId)

      if (setError) {
        securityLogger.logApiError(
          securityLogger.context,
          new Error(setError.message),
          {
            productId,
            variantId,
            step: 'set-new-default',
            endpoint: '/api/admin/products/[id]/variants/set-default',
          }
        )

        return NextResponse.json(
          {
            success: false,
            error: 'Error al marcar variante como predeterminada',
            data: null,
          },
          { status: 500 }
        )
      }

      console.log(
        `[VARIANT] Variant set as default successfully: ${variantId} for product ${productId}`
      )

      return NextResponse.json({
        success: true,
        data: null,
        message: 'Variante marcada como predeterminada exitosamente',
      })
    } catch (error: any) {
      securityLogger.logApiError(
        securityLogger.context,
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: '/api/admin/products/[id]/variants/set-default',
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

