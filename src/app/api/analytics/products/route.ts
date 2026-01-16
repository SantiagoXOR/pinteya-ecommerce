/**
 * API Endpoint para métricas detalladas de productos
 * GET /api/analytics/products?startDate=...&endDate=...&limit=...&sortBy=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { metricsCalculator } from '@/lib/analytics/metrics-calculator'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'additions' // additions, revenue, views

    const metrics = await metricsCalculator.calculateAdvancedMetrics({
      startDate,
      endDate,
    })

    if (!metrics.products) {
      return NextResponse.json({ error: 'Product analytics not available' }, { status: 500 })
    }

    // Aplicar filtros y ordenamiento
    let topProducts = [...metrics.products.topProductsAddedToCart]

    if (sortBy === 'revenue') {
      topProducts.sort((a, b) => b.totalRevenue - a.totalRevenue)
    } else if (sortBy === 'views') {
      // Combinar con productos más vistos
      const viewedMap = new Map(
        metrics.products.topProductsViewed.map(p => [p.productId, p.views])
      )
      topProducts = topProducts.map(p => ({
        ...p,
        views: viewedMap.get(p.productId) || 0,
      }))
      topProducts.sort((a, b) => b.views - a.views)
    }

    topProducts = topProducts.slice(0, limit)

    return NextResponse.json({
      topProductsAddedToCart: topProducts,
      topProductsViewed: metrics.products.topProductsViewed.slice(0, limit),
      productsByCategory: metrics.products.productsByCategory,
      cartValueDistribution: metrics.products.cartValueDistribution,
      summary: {
        totalProducts: topProducts.length,
        totalAdditions: topProducts.reduce((sum, p) => sum + p.totalAdditions, 0),
        totalRevenue: topProducts.reduce((sum, p) => sum + p.totalRevenue, 0),
      },
    })
  } catch (error) {
    console.error('Error en /api/analytics/products:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
