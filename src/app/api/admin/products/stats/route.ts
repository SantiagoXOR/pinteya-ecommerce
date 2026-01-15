// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { supabaseAdmin } from '@/lib/integrations/supabase'

/**
 * GET /api/admin/products/stats
 * Obtener estadísticas reales de productos desde Supabase
 * ✅ CORREGIDO: Considera el stock efectivo (producto + variantes)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const authResult = await requireAdminAuth()

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    // ✅ CORREGIDO: Calcular stock efectivo considerando variantes
    // Un producto tiene stock efectivo = suma de variantes activas si tiene variantes,
    // o stock del producto si no tiene variantes
    
    // Obtener todos los productos
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, stock, is_active')

    if (productsError) {
      throw productsError
    }

    const productIds = products?.map(p => p.id) || []
    
    // Obtener stock de variantes activas por producto
    const { data: variants, error: variantsError } = await supabaseAdmin
      .from('product_variants')
      .select('product_id, stock, is_active')
      .eq('is_active', true)
      .in('product_id', productIds)

    if (variantsError) {
      throw variantsError
    }

    // Calcular stock total de variantes por producto
    const variantStockByProduct: Record<number, number> = {}
    const productsWithVariants: Set<number> = new Set()
    
    variants?.forEach(variant => {
      const productId = variant.product_id
      productsWithVariants.add(productId)
      if (!variantStockByProduct[productId]) {
        variantStockByProduct[productId] = 0
      }
      variantStockByProduct[productId] += Number(variant.stock) || 0
    })

    // Calcular estadísticas
    let totalProducts = 0
    let activeProducts = 0
    let lowStockProducts = 0
    let noStockProducts = 0

    products?.forEach(product => {
      totalProducts++
      
      if (product.is_active) {
        activeProducts++
      }

      // ✅ Calcular stock efectivo: si tiene variantes, usar suma de variantes; si no, usar stock del producto
      const hasVariants = productsWithVariants.has(product.id)
      const variantStock = variantStockByProduct[product.id] || 0
      const effectiveStock = hasVariants 
        ? variantStock 
        : (product.stock !== null && product.stock !== undefined ? Number(product.stock) || 0 : 0)

      // Clasificar según stock efectivo
      if (effectiveStock <= 0) {
        noStockProducts++
      } else if (effectiveStock > 0 && effectiveStock <= 10) {
        lowStockProducts++
      }
    })

    const stats = {
      total_products: totalProducts,
      active_products: activeProducts,
      low_stock_products: lowStockProducts,
      no_stock_products: noStockProducts,
    }

    return NextResponse.json({
      success: true,
      stats,
      source: 'effective_stock_calculation',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error en GET /api/admin/products/stats:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
