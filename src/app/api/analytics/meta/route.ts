/**
 * API Route para Meta Marketing API
 *
 * Endpoints:
 * GET /api/analytics/meta?type=events&startDate=X&endDate=Y
 * GET /api/analytics/meta?type=stats
 * GET /api/analytics/meta?type=conversion&startDate=X&endDate=Y
 * GET /api/analytics/meta?type=status
 * GET /api/analytics/meta?type=local&startDate=X&endDate=Y (datos locales legacy)
 * POST /api/analytics/meta (enviar evento via Conversions API)
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateMetaPixelMetrics } from '@/lib/integrations/meta-pixel-analytics'
import {
  queryMetaEvents,
  getMetaPixelStats,
  getMetaConversionEvents,
  verifyMetaConnection,
  sendServerEvent,
  sendPurchaseEvent,
} from '@/lib/integrations/meta-marketing-api'
import { MetaAPIRequest, MetaServerEvent } from '@/types/external-analytics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const type = (searchParams.get('type') || 'local') as MetaAPIRequest['type'] | 'local'
    const startDate =
      searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]

    switch (type) {
      // Datos desde Meta Marketing API
      case 'events': {
        const result = await queryMetaEvents(startDate, endDate)
        return NextResponse.json(result)
      }

      case 'stats': {
        const stats = await getMetaPixelStats()
        return NextResponse.json({
          success: !stats.error,
          stats,
        })
      }

      case 'conversion': {
        const conversions = await getMetaConversionEvents(startDate, endDate)
        return NextResponse.json({
          success: true,
          conversions,
          dateRange: { startDate, endDate },
        })
      }

      case 'status': {
        const status = await verifyMetaConnection()
        return NextResponse.json({
          success: status.connected,
          status,
          timestamp: new Date().toISOString(),
        })
      }

      // Datos locales (legacy - desde base de datos)
      case 'local':
      default: {
        const metrics = await calculateMetaPixelMetrics(startDate, endDate)
        return NextResponse.json({
          success: true,
          metrics,
          source: 'local_database',
          note: 'Datos de eventos trackeados localmente. Para datos reales de Meta, usa type=events',
          period: { startDate, endDate },
        })
      }
    }
  } catch (error) {
    console.error('Error en API de Meta:', error)

    const errorMessage = (error as Error).message
    const isConfigError =
      errorMessage.includes('no configurado') ||
      errorMessage.includes('META_') ||
      errorMessage.includes('token')

    return NextResponse.json(
      {
        success: false,
        error: isConfigError
          ? 'Meta Marketing API no configurado correctamente'
          : 'Error al obtener métricas de Meta',
        details: errorMessage,
        configurationRequired: isConfigError,
        documentation: isConfigError ? '/docs/GUIA-CREDENCIALES-ANALYTICS.md' : undefined,
      },
      { status: isConfigError ? 503 : 500 }
    )
  }
}

/**
 * POST - Enviar evento via Conversions API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar que hay datos de evento
    if (!body.eventName && !body.type) {
      return NextResponse.json(
        {
          success: false,
          error: 'eventName o type requerido',
          example: {
            eventName: 'Purchase',
            customData: { value: 100, currency: 'ARS' },
          },
        },
        { status: 400 }
      )
    }

    // Tipo especial para purchases
    if (body.type === 'purchase') {
      if (!body.orderId || body.revenue === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: 'Para type=purchase se requiere orderId y revenue',
          },
          { status: 400 }
        )
      }

      const result = await sendPurchaseEvent({
        orderId: body.orderId,
        revenue: body.revenue,
        currency: body.currency || 'ARS',
        items: body.items,
        userData: body.userData,
        eventSourceUrl: body.eventSourceUrl,
        eventId: body.eventId,
      })

      return NextResponse.json(result)
    }

    // Evento genérico
    const event: MetaServerEvent = {
      eventName: body.eventName,
      eventTime: body.eventTime,
      eventId: body.eventId,
      eventSourceUrl: body.eventSourceUrl,
      actionSource: body.actionSource || 'website',
      userData: body.userData,
      customData: body.customData,
      testEventCode: body.testEventCode,
    }

    const result = await sendServerEvent(event)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error enviando evento a Meta CAPI:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al enviar evento a Meta Conversions API',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}


