// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { getTenantConfig } from '@/lib/tenant'

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

    // ===================================
    // MULTITENANT: Obtener configuración del tenant
    // ===================================
    const tenant = await getTenantConfig()
    const tenantId = tenant.id

    // ✅ CORREGIDO: Calcular stock efectivo considerando variantes y tenant_products
    // Un producto tiene stock efectivo = suma de variantes activas si tiene variantes,
    // o stock de tenant_products si no tiene variantes
    
    // Obtener productos visibles del tenant desde tenant_products
    const { data: tenantProducts, error: tenantProductsError } = await supabaseAdmin
      .from('tenant_products')
      .select('product_id, stock, is_visible')
      .eq('tenant_id', tenantId)
      .eq('is_visible', true)

    if (tenantProductsError) {
      throw tenantProductsError
    }

    const productIds = tenantProducts?.map(tp => tp.product_id) || []
    
    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          total_products: 0,
          active_products: 0,
          low_stock_products: 0,
          no_stock_products: 0,
        },
        source: 'tenant_products',
        timestamp: new Date().toISOString(),
      })
    }

    // Obtener productos del tenant
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, stock, is_active')
      .in('id', productIds)

    if (productsError) {
      throw productsError
    }

    // Ya tenemos productIds desde tenantProducts, usar esos
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

    // Crear mapa de stock de tenant_products
    const tenantStockByProduct: Record<number, number> = {}
    tenantProducts?.forEach(tp => {
      tenantStockByProduct[tp.product_id] = Number(tp.stock) || 0
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

      // ✅ Calcular stock efectivo: si tiene variantes, usar suma de variantes; si no, usar stock de tenant_products
      const hasVariants = productsWithVariants.has(product.id)
      const variantStock = variantStockByProduct[product.id] || 0
      const tenantStock = tenantStockByProduct[product.id] ?? (product.stock !== null && product.stock !== undefined ? Number(product.stock) : 0)
      const effectiveStock = hasVariants 
        ? variantStock 
        : tenantStock

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
