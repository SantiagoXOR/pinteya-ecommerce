// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - STREAMING API ENDPOINT
// ===================================

import { NextRequest } from 'next/server';
import { logger, LogCategory } from '@/lib/enterprise/logger';
import { realTimeMetricsStreaming, StreamingUtils, StreamEventType } from '@/lib/monitoring/real-time-metrics-streaming';

/**
 * GET - Establece conexión de Server-Sent Events
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const subscriptionsParam = searchParams.get('subscriptions');
    const filtersParam = searchParams.get('filters');

    // Parsear suscripciones
    let subscriptions: StreamEventType[] = [StreamEventType.METRICS_UPDATE, StreamEventType.ALERT_CREATED];
    if (subscriptionsParam) {
      try {
        subscriptions = JSON.parse(subscriptionsParam);
      } catch (error) {
        logger.warn(LogCategory.API, 'Invalid subscriptions parameter', { subscriptionsParam });
      }
    }

    // Parsear filtros
    let filters;
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch (error) {
        logger.warn(LogCategory.API, 'Invalid filters parameter', { filtersParam });
      }
    }

    // Crear configuración del cliente
    const clientConfig = {
      clientId,
      subscriptions,
      filters,
      rateLimit: {
        maxEventsPerSecond: 15,
        burstLimit: 50
      }
    };

    logger.info(LogCategory.API, 'SSE connection requested', {
      clientId,
      subscriptions,
      filters
    });

    // Crear stream de respuesta
    const stream = new ReadableStream({
      start(controller) {
        // Función para enviar eventos al cliente
        const sendEvent = async (event: any) => {
          try {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
            return true;
          } catch (error) {
            logger.error(LogCategory.API, 'Error sending SSE event', error as Error);
            return false;
          }
        };

        // Registrar cliente en el sistema de streaming
        const client = realTimeMetricsStreaming.registerClient(clientConfig, sendEvent);

        // Enviar evento de conexión establecida
        sendEvent({
          type: 'connection_established',
          data: {
            clientId,
            timestamp: Date.now(),
            subscriptions,
            message: 'Conexión de streaming establecida exitosamente'
          },
          timestamp: Date.now(),
          id: `connection_${clientId}`
        });

        // Manejar cierre de conexión
        request.signal.addEventListener('abort', () => {
          client.disconnect();
          controller.close();
          logger.info(LogCategory.API, 'SSE connection closed', { clientId });
        });
      },

      cancel() {
        logger.info(LogCategory.API, 'SSE stream cancelled', { clientId });
      }
    });

    // Configurar headers para SSE
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no' // Para nginx
    });

    return new Response(stream, { headers });

  } catch (error) {
    logger.error(LogCategory.API, 'Error establishing SSE connection', error as Error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error establishing streaming connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * POST - Envía evento personalizado al stream
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, clientId } = body;

    if (!type || !data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: type, data'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar tipo de evento
    if (!Object.values(StreamEventType).includes(type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid event type',
          validTypes: Object.values(StreamEventType)
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Crear evento personalizado
    const event = {
      type,
      data,
      timestamp: Date.now(),
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Enviar evento según el tipo
    switch (type) {
      case StreamEventType.ALERT_CREATED:
        realTimeMetricsStreaming.createAlertEvent(data);
        break;
      
      case StreamEventType.ALERT_RESOLVED:
        realTimeMetricsStreaming.createAlertResolvedEvent(data.alertId);
        break;
      
      case StreamEventType.BUDGET_VIOLATION:
        realTimeMetricsStreaming.createBudgetViolationEvent(data);
        break;
      
      case StreamEventType.SYSTEM_STATUS:
        realTimeMetricsStreaming.createSystemStatusEvent(data);
        break;
      
      default:
        // Para otros tipos, usar broadcast genérico
        // realTimeMetricsStreaming.broadcastEvent(event);
        break;
    }

    logger.info(LogCategory.API, 'Custom streaming event sent', {
      type,
      clientId,
      eventId: event.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        eventId: event.id,
        timestamp: event.timestamp,
        message: 'Event sent successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error(LogCategory.API, 'Error sending custom streaming event', error as Error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error sending custom event',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * OPTIONS - Maneja preflight CORS
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}










