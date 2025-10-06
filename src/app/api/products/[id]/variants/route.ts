// ===================================
// PINTEYA E-COMMERCE - API DE VARIANTES DE PRODUCTO
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, handleSupabaseError } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { createSecurityLogger } from '@/lib/logging/security-logger'

// Tipo para variante de producto actualizado
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
// GET /api/products/[id]/variants - Obtener variantes de un producto
// ===================================
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const securityLogger = createSecurityLogger(request)

  return withRateLimit(request, RATE_LIMIT_CONFIGS.products, async () => {
    try {
      const params = await context.params
      const productId = parseInt(params.id, 10)

      if (isNaN(productId) || productId <= 0) {
        securityLogger.logSuspiciousActivity(
          securityLogger.context,
          'Invalid product ID provided',
          {
            productId: params.id,
            endpoint: '/api/products/[id]/variants',
          }
        )

        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'ID de producto inválido',
        }
        return NextResponse.json(errorResponse, { status: 400 })
      }

      const supabase = getSupabaseClient()

      if (!supabase) {
        console.error('Cliente de Supabase no disponible en GET /api/products/[id]/variants')
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Servicio de base de datos no disponible',
        }
        return NextResponse.json(errorResponse, { status: 503 })
      }

      // Verificar que el producto existe y está activo
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, is_active')
        .eq('id', productId)
        .eq('is_active', true)
        .single()

      if (productError) {
        if (productError.code === 'PGRST116') {
          securityLogger.logSuspiciousActivity(
            securityLogger.context,
            'Product not found',
            {
              productId,
              error: productError.message,
            }
          )

          const notFoundResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Producto no encontrado',
          }
          return NextResponse.json(notFoundResponse, { status: 404 })
        }
        handleSupabaseError(productError, `GET /api/products/${productId}/variants`)
      }

      // Obtener variantes del producto desde la nueva tabla
      const { data: variants, error: variantsError } = await supabase
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
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('color_name', { ascending: true })
        .order('measure', { ascending: true })

      if (variantsError) {
        securityLogger.logApiError(
          securityLogger.context,
          new Error(variantsError.message),
          {
            productId,
            endpoint: '/api/products/[id]/variants',
          }
        )

        handleSupabaseError(variantsError, `GET /api/products/${productId}/variants - variants search`)
      }

      // Si no hay variantes en la nueva tabla, buscar en la tabla products (compatibilidad)
      let processedVariants: ProductVariant[] = variants || []

      if (processedVariants.length === 0) {
        // Fallback: crear variante temporal desde la tabla products
        const { data: productData, error: productDataError } = await supabase
          .from('products')
          .select('id, name, price, discounted_price, stock, aikon_id, color, medida')
          .eq('id', productId)
          .single()

        if (!productDataError && productData) {
          processedVariants = [{
            id: 0, // ID temporal
            product_id: productData.id,
            aikon_id: productData.aikon_id || `TEMP-${productData.id}`,
            variant_slug: `${productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-default`,
            color_name: productData.color || null,
            color_hex: null,
            measure: productData.medida || null,
            finish: null,
            price_list: parseFloat(productData.price) || 0,
            price_sale: productData.discounted_price ? parseFloat(productData.discounted_price) : null,
            stock: productData.stock || 0,
            is_active: true,
            is_default: true,
            image_url: null,
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]
        }
      }

      // Log de éxito - usando console.log para eventos informativos
      console.log(`[VARIANTS] Variants fetched successfully for product ${productId}: ${processedVariants.length} variants`)

      const response: ApiResponse<ProductVariant[]> = {
        data: processedVariants,
        success: true,
        message: `${processedVariants.length} variantes encontradas`,
      }

      return NextResponse.json(response)
    } catch (error: any) {
      securityLogger.logApiError(
        securityLogger.context,
        error instanceof Error ? error : new Error(String(error)),
        {
          productId: context.params,
        }
      )

      console.error('Error en GET /api/products/[id]/variants:', error)

      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: error.message || 'Error interno del servidor',
      }

      return NextResponse.json(errorResponse, { status: 500 })
    }
  })
}
