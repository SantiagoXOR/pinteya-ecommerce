/**
 * API Endpoint para análisis de categorías de productos
 * GET /api/analytics/categories?startDate=...&endDate=...
 * MULTITENANT: Filtra eventos por tenant_id del host actual.
 */

import { NextRequest, NextResponse } from 'next/server'
import { metricsCalculator } from '@/lib/analytics/metrics-calculator'
import { getTenantConfig } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantConfig()
    const tenantId = tenant.id

    const searchParams = request.nextUrl.searchParams
    const startDate =
      searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()

    const events = await metricsCalculator.fetchEvents({
      startDate,
      endDate,
      tenantId,
    })

    const categories = metricsCalculator.calculateCategoryPerformance(events)

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error en /api/analytics/categories:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
