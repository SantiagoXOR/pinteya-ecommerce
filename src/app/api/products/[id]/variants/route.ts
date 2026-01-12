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

      // ✅ CORREGIDO: No crear variante temporal automáticamente
      // Si un producto no tiene variantes, simplemente devolver array vacío
      // Esto permite que productos como rodillos existan sin variantes
      let processedVariants: ProductVariant[] = variants || []

      // Log de éxito - usando console.log para eventos informativos
      // Enriquecer variantes específicas para el producto 42 (cemento/gris y medidas 10L, 4L, 1L)
      if (productId === 42) {
        const now = new Date().toISOString()

        // Medidas objetivo y colores requeridos
        const targetMeasures = ['10L', '4L', '1L']
        const targetColors = [
          { name: 'cemento', hex: '#9FA1A3' },
          { name: 'gris', hex: '#808080' },
        ]

        // Determinar datos base para precio y aikon_id
        const base = processedVariants[0]

        // Evitar duplicados por combinación color + medida
        const existingKeys = new Set(
          processedVariants.map(v => `${(v.color_name || '').toLowerCase()}|${(v.measure || '').toUpperCase()}`)
        )

        const extraVariants: ProductVariant[] = []
        for (const measure of targetMeasures) {
          for (const color of targetColors) {
            const key = `${color.name}|${measure}`
            if (!existingKeys.has(key)) {
              extraVariants.push({
                id: 0,
                product_id: productId,
                aikon_id: base?.aikon_id || `TEMP-${productId}`,
                variant_slug: `recuplast-frentes-${color.name}-${measure}`,
                color_name: color.name,
                color_hex: color.hex,
                measure,
                finish: base?.finish || null,
                price_list: base?.price_list ?? 0,
                price_sale: base?.price_sale ?? null,
                stock: 20, // asegurar stock disponible
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
