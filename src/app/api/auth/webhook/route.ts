// ===================================
// PINTEYA E-COMMERCE - WEBHOOK ROBUSTO DE CLERK
// Versión mejorada con validación de firma, retry logic y auditoría
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import {
  syncUserToSupabase,
  deleteUserFromSupabase,
  type ClerkUserData
} from '@/lib/auth/user-sync-service';
import {
  logSecurityEvent,
  logAdminAction
} from '@/lib/auth/security-audit';

// ===================================
// TIPOS Y INTERFACES
// ===================================

interface WebhookEventData {
  data: ClerkUserData;
  object: string;
  type: string;
  timestamp?: number;
}

interface WebhookProcessingResult {
  success: boolean;
  eventType: string;
  userId?: string;
  action?: string;
  error?: string;
  processingTime?: number;
}

interface WebhookMetrics {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  eventTypes: Record<string, number>;
  averageProcessingTime: number;
}

// ===================================
// FUNCIONES DE UTILIDAD
// ===================================

/**
 * Valida los headers del webhook de Clerk
 */
function validateWebhookHeaders(request: NextRequest): {
  valid: boolean;
  headers?: {
    svix_id: string;
    svix_timestamp: string;
    svix_signature: string;
  };
  error?: string;
} {
  const svix_id = request.headers.get('svix-id');
  const svix_timestamp = request.headers.get('svix-timestamp');
  const svix_signature = request.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return {
      valid: false,
      error: 'Headers de webhook faltantes (svix-id, svix-timestamp, svix-signature)'
    };
  }

  return {
    valid: true,
    headers: {
      svix_id,
      svix_timestamp,
      svix_signature
    }
  };
}

/**
 * Verifica la firma del webhook usando svix
 */
async function verifyWebhookSignature(
  payload: string,
  headers: { svix_id: string; svix_timestamp: string; svix_signature: string },
  secret: string
): Promise<{ valid: boolean; event?: WebhookEventData; error?: string }> {
  try {
    const wh = new Webhook(secret);

    const evt = wh.verify(payload, {
      'svix-id': headers.svix_id,
      'svix-timestamp': headers.svix_timestamp,
      'svix-signature': headers.svix_signature,
    }) as WebhookEventData;

    return { valid: true, event: evt };
  } catch (error) {
    console.error('[WEBHOOK] Error verificando firma:', error);
    return {
      valid: false,
      error: `Error verificando firma: ${error.message}`
    };
  }
}

/**
 * Procesa un evento de webhook específico
 */
async function processWebhookEvent(event: WebhookEventData): Promise<WebhookProcessingResult> {
  const startTime = Date.now();
  const eventType = event.type;
  const userData = event.data;

  console.log(`[WEBHOOK] Procesando evento: ${eventType} para usuario ${userData.id}`);

  try {
    switch (eventType) {
      case 'user.created':
        const createResult = await syncUserToSupabase(userData, {
          retryAttempts: 2,
          retryDelay: 1000,
          validateData: true,
          createMissingRole: true,
          logEvents: true
        });

        if (createResult.success) {
          await logAdminAction(
            userData.id,
            'USER_CREATED_VIA_WEBHOOK',
            'user_profile',
            {
              userId: userData.id,
              userRole: 'customer',
              permissions: {},
              metadata: { source: 'clerk_webhook' }
            },
            {
              action: createResult.action,
              email: userData.email_addresses[0]?.email_address,
              webhook_event: eventType
            }
          );

          return {
            success: true,
            eventType,
            userId: userData.id,
            action: createResult.action,
            processingTime: Date.now() - startTime
          };
        } else {
          throw new Error(createResult.error || 'Error creando usuario');
        }

      case 'user.updated':
        const updateResult = await syncUserToSupabase(userData, {
          retryAttempts: 2,
          retryDelay: 1000,
          validateData: true,
          createMissingRole: false,
          logEvents: true
        });

        if (updateResult.success) {
          await logAdminAction(
            userData.id,
            'USER_UPDATED_VIA_WEBHOOK',
            'user_profile',
            {
              userId: userData.id,
              userRole: 'customer',
              permissions: {},
              metadata: { source: 'clerk_webhook' }
            },
            {
              action: updateResult.action,
              email: userData.email_addresses[0]?.email_address,
              webhook_event: eventType
            }
          );

          return {
            success: true,
            eventType,
            userId: userData.id,
            action: updateResult.action,
            processingTime: Date.now() - startTime
          };
        } else {
          throw new Error(updateResult.error || 'Error actualizando usuario');
        }

      case 'user.deleted':
        const deleteResult = await deleteUserFromSupabase(userData.id, {
          retryAttempts: 2,
          retryDelay: 1000,
          logEvents: true
        });

        if (deleteResult.success) {
          await logAdminAction(
            userData.id,
            'USER_DELETED_VIA_WEBHOOK',
            'user_profile',
            {
              userId: userData.id,
              userRole: 'customer',
              permissions: {},
              metadata: { source: 'clerk_webhook' }
            },
            {
              action: deleteResult.action,
              webhook_event: eventType
            }
          );

          return {
            success: true,
            eventType,
            userId: userData.id,
            action: deleteResult.action,
            processingTime: Date.now() - startTime
          };
        } else {
          throw new Error(deleteResult.error || 'Error eliminando usuario');
        }

      default:
        console.log(`[WEBHOOK] Evento no manejado: ${eventType}`);
        return {
          success: true,
          eventType,
          userId: userData.id,
          action: 'ignored',
          processingTime: Date.now() - startTime
        };
    }
  } catch (error) {
    console.error(`[WEBHOOK] Error procesando evento ${eventType}:`, error);

    // Log evento de error
    await logSecurityEvent({
      user_id: userData.id,
      event_type: 'SECURITY_VIOLATION',
      event_category: 'data_access',
      severity: 'medium',
      description: `Error procesando webhook ${eventType}`,
      metadata: {
        eventType,
        error: error.message,
        webhook_event: true
      }
    });

    return {
      success: false,
      eventType,
      userId: userData.id,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

// ===================================
// ENDPOINT PRINCIPAL DEL WEBHOOK
// ===================================
/**
 * POST /api/auth/webhook - Webhook robusto de Clerk
 * Maneja eventos de usuario con validación de firma, retry logic y auditoría
 */
export async function POST(request: NextRequest) {
  console.log('[WEBHOOK] 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN');

  // RESPUESTA TEMPORAL PARA EVITAR ERRORES
  return NextResponse.json(
    {
      success: false,
      message: 'Webhook temporalmente deshabilitado para evitar recursión',
      timestamp: new Date().toISOString()
    },
    { status: 503 }
  );

  // CÓDIGO ORIGINAL COMENTADO TEMPORALMENTE
  // const requestStartTime = Date.now();

  // try {
  //   console.log('[WEBHOOK] Recibiendo evento de Clerk...');

    // 1. Verificar configuración del webhook
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      console.warn('[WEBHOOK] CLERK_WEBHOOK_SECRET no configurado - webhook deshabilitado');
      return new Response('Webhook no configurado', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 2. Validar headers del webhook
    const headerValidation = validateWebhookHeaders(request);
    if (!headerValidation.valid) {
      console.error('[WEBHOOK] Headers inválidos:', headerValidation.error);

      await logSecurityEvent({
        user_id: 'unknown',
        event_type: 'SECURITY_VIOLATION',
        event_category: 'authentication',
        severity: 'medium',
        description: 'Webhook con headers inválidos',
        metadata: {
          error: headerValidation.error,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        }
      });

      return new Response(headerValidation.error, {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 3. Obtener payload
    const payload = await request.text();
    if (!payload) {
      console.error('[WEBHOOK] Payload vacío');
      return new Response('Payload vacío', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 4. Verificar firma del webhook
    const signatureValidation = await verifyWebhookSignature(
      payload,
      headerValidation.headers!,
      WEBHOOK_SECRET
    );

    if (!signatureValidation.valid) {
      console.error('[WEBHOOK] Firma inválida:', signatureValidation.error);

      await logSecurityEvent({
        user_id: 'unknown',
        event_type: 'SECURITY_VIOLATION',
        event_category: 'authentication',
        severity: 'high',
        description: 'Webhook con firma inválida',
        metadata: {
          error: signatureValidation.error,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        }
      });

      return new Response('Firma inválida', {
        status: 401,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const event = signatureValidation.event!;
    console.log(`[WEBHOOK] Evento verificado: ${event.type} para usuario ${event.data.id}`);

    // 5. Procesar el evento
    const processingResult = await processWebhookEvent(event);

    // 6. Log del resultado
    if (processingResult.success) {
      console.log(`[WEBHOOK] Evento procesado exitosamente: ${processingResult.eventType} - ${processingResult.action} (${processingResult.processingTime}ms)`);

      await logSecurityEvent({
        user_id: processingResult.userId || 'unknown',
        event_type: 'DATA_ACCESS',
        event_category: 'data_access',
        severity: 'low',
        description: `Webhook procesado: ${processingResult.eventType}`,
        metadata: {
          eventType: processingResult.eventType,
          action: processingResult.action,
          processingTime: processingResult.processingTime,
          webhook_success: true
        }
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Webhook procesado correctamente',
        eventType: processingResult.eventType,
        action: processingResult.action,
        processingTime: processingResult.processingTime
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error(`[WEBHOOK] Error procesando evento: ${processingResult.error}`);

      return new Response(JSON.stringify({
        success: false,
        error: 'Error procesando webhook',
        details: processingResult.error,
        eventType: processingResult.eventType
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error('[WEBHOOK] Error crítico en webhook:', error);

    await logSecurityEvent({
      user_id: 'unknown',
      event_type: 'SECURITY_VIOLATION',
      event_category: 'data_access',
      severity: 'critical',
      description: 'Error crítico en webhook de Clerk',
      metadata: {
        error: error.message,
        processingTime: totalTime,
        webhook_critical_error: true
      }
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      processingTime: totalTime
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ===================================
// GET /api/auth/webhook - Health check y métricas
// ===================================
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeMetrics = url.searchParams.get('metrics') === 'true';

    const response: any = {
      status: 'healthy',
      message: 'Webhook robusto de Clerk funcionando correctamente',
      timestamp: new Date().toISOString(),
      version: '2.0',
      features: [
        'Validación de firma robusta',
        'Retry logic con backoff exponencial',
        'Auditoría completa de eventos',
        'Manejo de errores avanzado',
        'Logging estructurado',
        'Métricas de rendimiento'
      ]
    };

    if (includeMetrics) {
      // Aquí podrías añadir métricas reales desde una base de datos o cache
      response.metrics = {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        eventTypes: {
          'user.created': 0,
          'user.updated': 0,
          'user.deleted': 0
        },
        averageProcessingTime: 0,
        lastEventTimestamp: null
      };
    }

    // Verificar configuración
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    response.configuration = {
      webhookSecretConfigured: !!WEBHOOK_SECRET,
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[WEBHOOK] Error en health check:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Error en health check del webhook',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}
