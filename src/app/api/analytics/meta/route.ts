/**
 * API Route para obtener métricas de Meta Pixel
 * Basado en eventos trackeados en nuestra base de datos
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateMetaPixelMetrics } from '@/lib/integrations/meta-pixel-analytics'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate =
      searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()

    const metrics = await calculateMetaPixelMetrics(startDate, endDate)

    return NextResponse.json({
      success: true,
      metrics,
      period: {
        startDate,
        endDate,
      },
    })
  } catch (error) {
    console.error('Error fetching Meta Pixel metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener métricas de Meta Pixel',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}


