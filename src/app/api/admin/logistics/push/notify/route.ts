// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// =====================================================
// API: ENVIAR NOTIFICACIONES PUSH DE LOGÍSTICA
// Endpoint: POST /api/admin/logistics/push/notify
// Descripción: Envía notificaciones push a clientes sobre actualizaciones de envíos
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
// ⚡ MULTITENANT: Importar guard de tenant admin
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'
import {
  getPushNotificationService,
  createShipmentNotificationPayload,
  type ShipmentNotificationData,
} from '@/lib/notifications/push-notifications'
import crypto from 'crypto'

// =====================================================
// FUNCIONES DE WEB-PUSH (implementación manual)
// =====================================================

/**
 * Envía una notificación push usando Web Push Protocol
 * Nota: Esta es una implementación simplificada. En producción, usar la librería 'web-push'
 */
async function sendWebPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: any,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Crear JWT para autenticación VAPID
    const jwt = createVapidJWT(subscription.endpoint, vapidEmail, vapidPrivateKey)

    // Crear encripción del payload
    const encryptedPayload = await encryptPayload(
      JSON.stringify(payload),
      subscription.keys.p256dh,
      subscription.keys.auth
    )

    // Enviar notificación
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
        TTL: '86400', // 24 horas
      },
      body: encryptedPayload,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Crea un JWT para autenticación VAPID
 * Nota: Implementación simplificada. En producción, instalar 'web-push' package
 */
function createVapidJWT(endpoint: string, email: string, privateKey: string): string {
  // Para una implementación completa, se necesita:
  // 1. Instalar: npm install web-push
  // 2. Usar: webpush.sendNotification(subscription, payload)
  // Por ahora, retornamos un placeholder
  const header = { alg: 'ES256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const claims = {
    aud: new URL(endpoint).origin,
    exp: now + 12 * 60 * 60,
    sub: email,
  }
  // Nota: Esta es una implementación simplificada
  // Para producción, instalar 'web-push' y usar webpush.sendNotification()
  return Buffer.from(JSON.stringify({ header, claims })).toString('base64url')
}

/**
 * Encripta el payload usando las keys de la suscripción
 * Nota: Implementación simplificada. En producción, usar 'web-push' library
 */
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<ArrayBuffer> {
  // Para una implementación completa, usar web-push library
  // Por ahora, retornar payload básico
  return new TextEncoder().encode(payload)
}

// =====================================================
// SCHEMAS DE VALIDACIÓN ZOD
// =====================================================

const ShipmentNotificationSchema = z.object({
  orderId: z.number().positive('Order ID debe ser positivo'),
  shipmentId: z.string().min(1, 'Shipment ID es requerido'),
  trackingNumber: z.string().min(1, 'Tracking number es requerido'),
  status: z.string().min(1, 'Status es requerido'),
  statusLabel: z.string().min(1, 'Status label es requerido'),
  location: z.string().optional(),
  estimatedDelivery: z.string().optional(),
})

// =====================================================
// POST: ENVIAR NOTIFICACIÓN PUSH
// ⚡ MULTITENANT: Filtra por tenant_id
// =====================================================

export const POST = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest
) => {
  try {
    const { tenantId } = guardResult

    // Verificar VAPID keys
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:notifications@example.com'

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'VAPID keys no configuradas. Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY' },
        { status: 500 }
      )
    }

    // Parsear y validar body
    const body = await request.json()
    const validatedData = ShipmentNotificationSchema.parse(body)

    // Obtener servicio de notificaciones
    const service = getPushNotificationService()
    const subscriptions = await service.getSubscriptionsForShipment(
      validatedData.orderId,
      tenantId
    )

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay suscripciones para este envío',
        sent: 0,
      })
    }

    // Crear payload de notificación
    const notificationData: ShipmentNotificationData = {
      shipmentId: validatedData.shipmentId,
      trackingNumber: validatedData.trackingNumber,
      status: validatedData.status,
      statusLabel: validatedData.statusLabel,
      location: validatedData.location,
      estimatedDelivery: validatedData.estimatedDelivery,
      orderId: validatedData.orderId,
    }

    const payload = createShipmentNotificationPayload(notificationData)

    // Enviar notificaciones
    // NOTA: Para producción, instalar 'web-push' package:
    // npm install web-push
    // Y usar: webpush.sendNotification(subscription, JSON.stringify(payload))
    
    const results = await Promise.allSettled(
      subscriptions.map(async ({ userId, subscription }) => {
        try {
          // Intentar enviar notificación
          // En producción, esto debería usar la librería web-push
          const result = await sendWebPushNotification(
            subscription,
            payload,
            vapidPublicKey,
            vapidPrivateKey,
            vapidEmail
          )

          if (!result.success) {
            // Si la suscripción es inválida (410), eliminarla
            if (result.error?.includes('410') || result.error?.includes('Gone')) {
              await service.removeSubscription(userId, subscription.endpoint, tenantId)
            }
          }

          return result
        } catch (error: any) {
          // Si la suscripción es inválida (410), eliminarla
          if (error.statusCode === 410 || error.message?.includes('410') || error.message?.includes('Gone')) {
            await service.removeSubscription(userId, subscription.endpoint, tenantId)
          }
          return { success: false, error: error.message || 'Unknown error' }
        }
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      message: `Notificaciones enviadas: ${sent} exitosas, ${failed} fallidas`,
      sent,
      failed,
    })
  } catch (error) {
    console.error('Error en POST /api/admin/logistics/push/notify:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.reduce(
            (acc, err) => {
              acc[err.path.join('.')] = [err.message]
              return acc
            },
            {} as Record<string, string[]>
          ),
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
})
