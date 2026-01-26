// =====================================================
// SERVICIO: NOTIFICACIONES PUSH PARA CLIENTES
// Descripción: Sistema de notificaciones push usando Web Push API
// =====================================================

import { createClient } from '@/lib/integrations/supabase/server'

// =====================================================
// INTERFACES
// =====================================================

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, any>
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface ShipmentNotificationData {
  shipmentId: string
  trackingNumber: string
  status: string
  statusLabel: string
  location?: string
  estimatedDelivery?: string
  orderId?: number
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

/**
 * Convierte una suscripción push a formato para almacenar en BD
 */
export function serializeSubscription(subscription: PushSubscription): string {
  return JSON.stringify(subscription)
}

/**
 * Convierte una suscripción almacenada a formato PushSubscription
 */
export function deserializeSubscription(serialized: string): PushSubscription {
  return JSON.parse(serialized)
}

/**
 * Crea payload de notificación para actualización de envío
 */
export function createShipmentNotificationPayload(
  data: ShipmentNotificationData
): PushNotificationPayload {
  const statusEmojis: Record<string, string> = {
    pending: '📦',
    confirmed: '✅',
    picked_up: '🚚',
    in_transit: '🚛',
    out_for_delivery: '📍',
    delivered: '🎉',
    exception: '⚠️',
    cancelled: '❌',
  }

  const emoji = statusEmojis[data.status] || '📦'

  return {
    title: `${emoji} Actualización de Envío`,
    body: `Tu envío ${data.trackingNumber} está ahora: ${data.statusLabel}${
      data.location ? ` - ${data.location}` : ''
    }`,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `shipment-${data.shipmentId}`,
    requireInteraction: data.status === 'out_for_delivery',
    data: {
      type: 'shipment_update',
      shipmentId: data.shipmentId,
      trackingNumber: data.trackingNumber,
      status: data.status,
      orderId: data.orderId,
      url: data.orderId ? `/mis-ordenes/${data.orderId}` : '/mis-ordenes',
    },
    actions:
      data.status === 'out_for_delivery'
        ? [
            {
              action: 'view',
              title: 'Ver Detalles',
            },
            {
              action: 'track',
              title: 'Rastrear',
            },
          ]
        : undefined,
  }
}

// =====================================================
// SERVICIO PRINCIPAL
// =====================================================

export class PushNotificationService {
  private vapidPublicKey: string
  private vapidPrivateKey: string

  constructor() {
    // En producción, estas keys deben venir de variables de entorno
    this.vapidPublicKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || ''
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''

    if (!this.vapidPublicKey) {
      console.warn('VAPID public key no configurada. Las notificaciones push no funcionarán.')
    }
  }

  /**
   * Guarda una suscripción push para un usuario
   */
  async saveSubscription(
    userId: string,
    subscription: PushSubscription,
    tenantId: string
  ): Promise<boolean> {
    try {
      const supabase = await createClient()

      const serialized = serializeSubscription(subscription)

      // Verificar si ya existe una suscripción con este endpoint
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint)
        .eq('tenant_id', tenantId)
        .single()

      if (existing) {
        // Actualizar suscripción existente
        const { error } = await supabase
          .from('push_subscriptions')
          .update({
            subscription: serialized,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        return !error
      } else {
        // Crear nueva suscripción
        const { error } = await supabase.from('push_subscriptions').insert({
          user_id: userId,
          tenant_id: tenantId,
          endpoint: subscription.endpoint,
          subscription: serialized,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        return !error
      }
    } catch (error) {
      console.error('Error guardando suscripción push:', error)
      return false
    }
  }

  /**
   * Obtiene todas las suscripciones de un usuario
   */
  async getUserSubscriptions(userId: string, tenantId: string): Promise<PushSubscription[]> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('active', true)

      if (error) {
        throw error
      }

      return (data || []).map(row => deserializeSubscription(row.subscription))
    } catch (error) {
      console.error('Error obteniendo suscripciones:', error)
      return []
    }
  }

  /**
   * Obtiene suscripciones de un usuario para un envío específico
   */
  async getSubscriptionsForShipment(
    orderId: number,
    tenantId: string
  ): Promise<Array<{ userId: string; subscription: PushSubscription }>> {
    try {
      const supabase = await createClient()

      // Obtener el usuario de la orden
      const { data: order } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .eq('tenant_id', tenantId)
        .single()

      if (!order) {
        return []
      }

      // Obtener suscripciones del usuario
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('user_id, subscription')
        .eq('user_id', order.user_id)
        .eq('tenant_id', tenantId)
        .eq('active', true)

      if (!subscriptions) {
        return []
      }

      return subscriptions.map(sub => ({
        userId: sub.user_id,
        subscription: deserializeSubscription(sub.subscription),
      }))
    } catch (error) {
      console.error('Error obteniendo suscripciones para envío:', error)
      return []
    }
  }

  /**
   * Envía una notificación push
   */
  async sendNotification(
    subscription: PushSubscription,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      // En el servidor, necesitamos usar web-push library
      // Por ahora, retornamos true y la lógica real se hará en el endpoint API
      return true
    } catch (error) {
      console.error('Error enviando notificación push:', error)
      return false
    }
  }

  /**
   * Envía notificación de actualización de envío
   * Nota: Esta función prepara los datos, pero el envío real se hace desde el endpoint API
   */
  async sendShipmentUpdateNotification(
    orderId: number,
    shipmentData: ShipmentNotificationData,
    tenantId: string
  ): Promise<number> {
    // Esta función ahora solo retorna el conteo de suscripciones
    // El envío real se hace desde el endpoint API que tiene acceso a web-push
    const subscriptions = await this.getSubscriptionsForShipment(orderId, tenantId)
    return subscriptions.length
  }

  /**
   * Elimina una suscripción
   */
  async removeSubscription(
    userId: string,
    endpoint: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      const supabase = await createClient()

      const { error } = await supabase
        .from('push_subscriptions')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('endpoint', endpoint)
        .eq('tenant_id', tenantId)

      return !error
    } catch (error) {
      console.error('Error eliminando suscripción:', error)
      return false
    }
  }

  /**
   * Obtiene la VAPID public key
   */
  getVapidPublicKey(): string {
    return this.vapidPublicKey
  }
}

// =====================================================
// INSTANCIA SINGLETON
// =====================================================

let pushNotificationService: PushNotificationService | null = null

export function getPushNotificationService(): PushNotificationService {
  if (!pushNotificationService) {
    pushNotificationService = new PushNotificationService()
  }
  return pushNotificationService
}
