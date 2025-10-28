// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { supabaseAdmin } from '@/lib/integrations/supabase'

/**
 * GET /api/admin/products/stats
 * Obtener estadísticas reales de productos desde Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const authResult = await requireAdminAuth()

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    // Obtener estadísticas directamente sin función RPC
    const [totalResult, activeResult, lowStockResult, noStockResult] = await Promise.all([
      // Total de productos
      supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),

      // Productos con stock > 0
      supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).gt('stock', 0),

      // Productos con stock bajo (1-10)
      supabaseAdmin
        .from('products')
        .select('id', { count: 'exact', head: true })
        .gt('stock', 0)
        .lte('stock', 10),

      // Productos sin stock
      supabaseAdmin
        .from('products')
        .select('id', { count: 'exact', head: true })
        .or('stock.eq.0,stock.is.null'),
    ])

    const stats = {
      total_products: totalResult.count || 0,
      active_products: activeResult.count || 0,
      low_stock_products: lowStockResult.count || 0,
      no_stock_products: noStockResult.count || 0,
    }

    return NextResponse.json({
      success: true,
      stats,
      source: 'direct_queries',
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
