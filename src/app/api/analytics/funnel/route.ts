/**
 * API Endpoint para análisis de embudo de conversión
 * GET /api/analytics/funnel?startDate=...&endDate=...
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
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()

    const metrics = await metricsCalculator.calculateAdvancedMetrics({
      startDate,
      endDate,
      tenantId,
    })

    if (!metrics.funnel) {
      return NextResponse.json({ error: 'Funnel analysis not available' }, { status: 500 })
    }

    return NextResponse.json(metrics.funnel)
  } catch (error) {
    console.error('Error en /api/analytics/funnel:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
