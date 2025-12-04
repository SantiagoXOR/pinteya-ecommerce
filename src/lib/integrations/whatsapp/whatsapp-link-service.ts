// ===================================
// PINTEYA E-COMMERCE - WHATSAPP LINK SERVICE
// Servicio para generar enlaces directos de WhatsApp con datos de orden
// ===================================

import { logger, LogLevel } from '@/lib/enterprise/logger'
import { sanitizeForWhatsApp, EMOJIS } from '@/lib/integrations/whatsapp/whatsapp-utils'

// Helper: normaliza el número para el formato requerido por wa.me (solo dígitos)
export function normalizeWhatsAppPhoneNumber(raw: string): string {
  try {
    let digits = (raw || '').replace(/\D/g, '')

    // Eliminar prefijo internacional con '00'
    if (digits.startsWith('00')) {
      digits = digits.slice(2)
    }

    // Si empieza con 0 (formato nacional), removerlo
    if (digits.startsWith('0')) {
      digits = digits.slice(1)
    }

    // Manejo Argentina: asegurar '549' y remover '15' tras código de área
    if (digits.startsWith('54')) {
      // Quitar posible '15' luego del código de área
      const after54 = digits.slice(2)
      const m = after54.match(/^(\d{2,4})15(\d+)$/)
      if (m) {
        digits = '54' + m[1] + m[2]
      }
      // Insertar '9' si falta (móvil)
      if (!digits.startsWith('549')) {
        digits = '549' + digits.slice(2)
      }
    } else {
      // Sin código país: asumir AR y agregar '549'
      const m = digits.match(/^(\d{2,4})15(\d+)$/)
      if (m) {
        digits = m[1] + m[2]
      }
      digits = '549' + digits
    }

    return digits
  } catch {
    return (raw || '').replace(/\D/g, '')
  }
}

// Configuración de WhatsApp
const WHATSAPP_CONFIG = {
  // Número de Pinteya en formato internacional (solo dígitos)
  PINTEYA_PHONE: normalizeWhatsAppPhoneNumber(process.env.WHATSAPP_BUSINESS_NUMBER || '5493513411796'),
  API_BASE: 'https://api.whatsapp.com/send',
  WAME_BASE: 'https://wa.me',
}

// Interfaces para los datos de la orden
export interface OrderDetails {
  id: string
  orderNumber: string
  total: string
  status: string
  paymentId?: string
  payerInfo: {
    name: string
    email: string
    phone?: string
  }
  shippingInfo?: {
    address: string
    city: string
    postalCode: string
  }
  items: Array<{
    name: string
    quantity: number
    price: string
  }>
  createdAt: string
}

export class WhatsAppLinkService {
  private static instance: WhatsAppLinkService

  public static getInstance(): WhatsAppLinkService {
    if (!WhatsAppLinkService.instance) {
      WhatsAppLinkService.instance = new WhatsAppLinkService()
    }
    return WhatsAppLinkService.instance
  }

  /**
   * Genera un mensaje formateado con los datos completos de la orden
   */
  private formatOrderMessage(orderDetails: OrderDetails): string {
    const {
      orderNumber,
      total,
      status,
      paymentId,
      payerInfo,
      shippingInfo,
      items,
      createdAt
    } = orderDetails

    const lines: string[] = [
      `*Nueva Orden Confirmada - Pinteya*`,
      '',
      `*Detalle de Orden:*`,
      `${EMOJIS.bullet} Número: #${orderNumber}`,
      `${EMOJIS.bullet} Total: ${total}`,
      `${EMOJIS.bullet} Estado: ${status}`,
      `${EMOJIS.bullet} Fecha: ${new Date(createdAt).toLocaleString('es-AR')}`,
    ]

    if (paymentId) {
      lines.push(`• ID Pago: ${paymentId}`)
    }

    lines.push('', `*${EMOJIS.nota} Datos Personales:*`)
    lines.push(`${EMOJIS.bullet} Nombre: ${payerInfo.name}`)
    lines.push(`${EMOJIS.bullet} Teléfono: ${payerInfo.phone ? `${EMOJIS.phone} ${payerInfo.phone}` : '—'}`)
    lines.push(`${EMOJIS.bullet} Email: ${EMOJIS.email} ${payerInfo.email}`)

    if (shippingInfo) {
      lines.push('', `*${EMOJIS.truck} Datos de Envío:*`)
      lines.push(`${EMOJIS.bullet} Dirección: ${shippingInfo.address}`)
      lines.push(`${EMOJIS.bullet} Ciudad: ${shippingInfo.city}`)
      lines.push(`${EMOJIS.bullet} Código Postal: ${shippingInfo.postalCode}`)
    }

    lines.push('', `*${EMOJIS.receipt} Productos:*`)
    items.forEach((item) => {
      lines.push(`${EMOJIS.bullet} ${item.name} x${item.quantity} - ${item.price}`)
    })

    lines.push('', `${EMOJIS.check} Pago confirmado exitosamente`)
    lines.push(`${EMOJIS.truck} Proceder con la preparación del pedido`)

    return sanitizeForWhatsApp(lines.join('\n'))
  }

  /**
   * Genera el enlace de WhatsApp con el mensaje de la orden
   */
  public generateOrderWhatsAppLink(orderDetails: OrderDetails): string {
    try {
      const message = this.formatOrderMessage(orderDetails)
      const encodedMessage = encodeURIComponent(message)
      const whatsappLink = `${WHATSAPP_CONFIG.API_BASE}?phone=${WHATSAPP_CONFIG.PINTEYA_PHONE}&text=${encodedMessage}`
      
      logger.info(LogLevel.INFO, 'WhatsApp link generated successfully', {
        orderNumber: orderDetails.orderNumber,
        linkLength: whatsappLink.length,
        messageLength: message.length
      })
      
      return whatsappLink
      
    } catch (error) {
      logger.error(LogLevel.ERROR, 'Error generating WhatsApp link', {
        orderNumber: orderDetails.orderNumber,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Enlace de fallback simple
      const fallbackMessage = `Nueva orden confirmada: #${orderDetails.orderNumber} - Total: ${orderDetails.total}`
      const encodedFallback = encodeURIComponent(fallbackMessage)
      return `${WHATSAPP_CONFIG.API_BASE}?phone=${WHATSAPP_CONFIG.PINTEYA_PHONE}&text=${encodedFallback}`
    }
  }

  /**
   * Nuevo: Genera enlace y retorna también el mensaje crudo para persistir
   */
  public generateOrderWhatsApp(orderDetails: OrderDetails): { link: string; message: string } {
    try {
      const message = this.formatOrderMessage(orderDetails)
      const encodedMessage = encodeURIComponent(message)
      const whatsappLink = `${WHATSAPP_CONFIG.API_BASE}?phone=${WHATSAPP_CONFIG.PINTEYA_PHONE}&text=${encodedMessage}`

      logger.info(LogLevel.INFO, 'WhatsApp link+message generated successfully', {
        orderNumber: orderDetails.orderNumber,
        linkLength: whatsappLink.length,
        messageLength: message.length
      })

      return { link: whatsappLink, message }

    } catch (error) {
      logger.error(LogLevel.ERROR, 'Error generating WhatsApp link+message', {
        orderNumber: orderDetails.orderNumber,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      const fallbackMessage = `Nueva orden confirmada: #${orderDetails.orderNumber} - Total: ${orderDetails.total}`
      const encodedFallback = encodeURIComponent(fallbackMessage)
      const fallbackLink = `${WHATSAPP_CONFIG.API_BASE}?phone=${WHATSAPP_CONFIG.PINTEYA_PHONE}&text=${encodedFallback}`
      return { link: fallbackLink, message: fallbackMessage }
    }
  }

  /**
   * Genera un enlace de WhatsApp simple para notificaciones rápidas
   */
  public generateSimpleNotificationLink(orderNumber: string, total: string): string {
    const message = sanitizeForWhatsApp(`${EMOJIS.info} Nueva orden: #${orderNumber} - Total: ${total} - Revisar sistema Pinteya`)
    const encodedMessage = encodeURIComponent(message)
    return `${WHATSAPP_CONFIG.API_BASE}?phone=${WHATSAPP_CONFIG.PINTEYA_PHONE}&text=${encodedMessage}`
  }

  /**
   * Valida si el enlace de WhatsApp es válido
   */
  public validateWhatsAppLink(link: string): boolean {
    try {
      const url = new URL(link)
      const isWaMe = url.hostname === 'wa.me' && url.pathname.includes(WHATSAPP_CONFIG.PINTEYA_PHONE)
      const isApi = url.hostname === 'api.whatsapp.com' && url.pathname.includes('send') && url.searchParams.get('phone') === WHATSAPP_CONFIG.PINTEYA_PHONE
      return isWaMe || isApi
    } catch {
      return false
    }
  }
}

// Instancia singleton
export const whatsappLinkService = WhatsAppLinkService.getInstance()

// Función helper para uso directo
export function createOrderWhatsAppLink(orderDetails: OrderDetails): string {
  return whatsappLinkService.generateOrderWhatsAppLink(orderDetails)
}

export function createSimpleWhatsAppNotification(orderNumber: string, total: string): string {
  return whatsappLinkService.generateSimpleNotificationLink(orderNumber, total)
}

// Helper nuevo: obtener enlace y mensaje
export function createOrderWhatsApp(orderDetails: OrderDetails): { link: string; message: string } {
  return whatsappLinkService.generateOrderWhatsApp(orderDetails)
}