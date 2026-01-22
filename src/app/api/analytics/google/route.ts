/**
 * API Route para consultas a Google Analytics 4 Data API
 *
 * Endpoints:
 * GET /api/analytics/google?type=events&startDate=X&endDate=Y&eventName=Z
 * GET /api/analytics/google?type=purchase&transactionId=395
 * GET /api/analytics/google?type=journey&sessionId=XXX
 * GET /api/analytics/google?type=realtime
 * GET /api/analytics/google?type=ecommerce&startDate=X&endDate=Y
 * GET /api/analytics/google?type=status
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  queryGA4Events,
  queryGA4PurchaseByTransactionId,
  queryGA4UserJourney,
  getGA4RealTimeEvents,
  getGA4EcommerceMetrics,
  verifyGA4Connection,
  getGA4EventsSummary,
} from '@/lib/integrations/google-analytics-api'
import { GA4APIRequest } from '@/types/external-analytics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') as GA4APIRequest['type']
    const startDate = searchParams.get('startDate') || '7daysAgo'
    const endDate = searchParams.get('endDate') || 'today'
    const transactionId = searchParams.get('transactionId')
    const sessionId = searchParams.get('sessionId')
    const eventName = searchParams.get('eventName') || undefined

    // Verificar que el tipo es válido
    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetro "type" requerido',
          validTypes: ['events', 'purchase', 'journey', 'realtime', 'ecommerce', 'status', 'summary'],
        },
        { status: 400 }
      )
    }

    switch (type) {
      case 'events': {
        const result = await queryGA4Events(startDate, endDate, eventName)
        return NextResponse.json(result)
      }

      case 'purchase': {
        if (!transactionId) {
          return NextResponse.json(
            { success: false, error: 'transactionId requerido para type=purchase' },
            { status: 400 }
          )
        }
        const purchase = await queryGA4PurchaseByTransactionId(transactionId)
        return NextResponse.json({
          success: !!purchase,
          purchase,
          note: purchase
            ? undefined
            : 'Transacción no encontrada. GA4 puede tener un delay de 24-48h para datos históricos.',
        })
      }

      case 'journey': {
        if (!sessionId) {
          return NextResponse.json(
            { success: false, error: 'sessionId requerido para type=journey' },
            { status: 400 }
          )
        }
        const journey = await queryGA4UserJourney(sessionId)
        return NextResponse.json({
          success: !!journey,
          journey,
        })
      }

      case 'realtime': {
        const events = await getGA4RealTimeEvents()
        return NextResponse.json({
          success: true,
          events,
          totalEvents: events.reduce((sum, e) => sum + e.eventCount, 0),
          note: 'Eventos de los últimos 30 minutos',
        })
      }

      case 'ecommerce': {
        const metrics = await getGA4EcommerceMetrics(startDate, endDate)
        return NextResponse.json({
          success: true,
          metrics,
          dateRange: { startDate, endDate },
        })
      }

      case 'status': {
        const status = await verifyGA4Connection()
        return NextResponse.json({
          success: status.connected,
          status,
          timestamp: new Date().toISOString(),
        })
      }

      // Tipo adicional para resumen
      default: {
        if (type === 'summary') {
          const summary = await getGA4EventsSummary(startDate, endDate)
          return NextResponse.json({
            success: true,
            summary,
            dateRange: { startDate, endDate },
          })
        }

        return NextResponse.json(
          {
            success: false,
            error: `Tipo "${type}" no soportado`,
            validTypes: ['events', 'purchase', 'journey', 'realtime', 'ecommerce', 'status', 'summary'],
          },
          { status: 400 }
        )
      }
    }
  } catch (error) {
    console.error('Error en API de Google Analytics:', error)

    // Detectar errores de configuración
    const errorMessage = (error as Error).message
    const isConfigError =
      errorMessage.includes('no configurado') ||
      errorMessage.includes('Credenciales') ||
      errorMessage.includes('GOOGLE_')

    return NextResponse.json(
      {
        success: false,
        error: isConfigError
          ? 'Google Analytics no configurado correctamente'
          : 'Error interno al consultar Google Analytics',
        details: errorMessage,
        configurationRequired: isConfigError,
        documentation: isConfigError ? '/docs/GUIA-CREDENCIALES-ANALYTICS.md' : undefined,
      },
      { status: isConfigError ? 503 : 500 }
    )
  }
}
