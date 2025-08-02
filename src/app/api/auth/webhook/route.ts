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

}
