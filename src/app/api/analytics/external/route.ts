/**
 * API Route para External Analytics Service
 * Servicio unificado que combina GA4, Meta y datos locales
 *
 * Endpoints:
 * GET /api/analytics/external?type=journey&orderId=XXX
 * GET /api/analytics/external?type=verify&transactionId=XXX
 * GET /api/analytics/external?type=compare&startDate=X&endDate=Y
 * GET /api/analytics/external?type=status
 * GET /api/analytics/external?type=summary&days=7
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrderJourney,
  verifyConversion,
  compareAnalytics,
  getExternalAnalyticsStatus,
  getAnalyticsSummary,
} from '@/lib/services/external-analytics.service'
import { ExternalAnalyticsAPIRequest } from '@/types/external-analytics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') as ExternalAnalyticsAPIRequest['type']
    const orderId = searchParams.get('orderId')
    const transactionId = searchParams.get('transactionId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const days = parseInt(searchParams.get('days') || '7', 10)

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetro "type" requerido',
          validTypes: ['journey', 'verify', 'compare', 'status', 'summary'],
        },
        { status: 400 }
      )
    }

    switch (type) {
      case 'journey': {
        if (!orderId) {
          return NextResponse.json(
            { success: false, error: 'orderId requerido para type=journey' },
            { status: 400 }
          )
        }

        const journey = await getOrderJourney(orderId)
        return NextResponse.json({
          success: true,
          journey,
        })
      }

      case 'verify': {
        const id = transactionId || orderId
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'transactionId u orderId requerido para type=verify' },
            { status: 400 }
          )
        }

        const verification = await verifyConversion(id)
        return NextResponse.json({
          success: true,
          verification,
        })
      }

      case 'compare': {
        const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const end = endDate || new Date().toISOString().split('T')[0]

        const comparison = await compareAnalytics(start, end)
        return NextResponse.json({
          success: true,
          comparison,
        })
      }

      case 'status': {
        const status = await getExternalAnalyticsStatus()
        return NextResponse.json({
          success: true,
          status,
        })
      }

      case 'summary': {
        const summary = await getAnalyticsSummary(days)
        return NextResponse.json({
          success: true,
          summary,
        })
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Tipo "${type}" no soportado`,
            validTypes: ['journey', 'verify', 'compare', 'status', 'summary'],
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error en External Analytics API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error en el servicio de analytics externos',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
