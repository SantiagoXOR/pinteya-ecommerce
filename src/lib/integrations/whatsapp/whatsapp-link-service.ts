// ===================================
// PINTEYA E-COMMERCE - WHATSAPP LINK SERVICE
// Servicio para generar enlaces directos de WhatsApp con datos de orden
// ===================================

import { logger, LogLevel } from '@/lib/enterprise/logger'

// Configuración de WhatsApp
const WHATSAPP_CONFIG = {
  // Número de Pinteya (basado en la configuración existente)
  PINTEYA_PHONE: '+5411123456789', // Número de WhatsApp de Pinteya
  BASE_URL: 'https://wa.me',
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

    let message = `🎉 *NUEVA ORDEN CONFIRMADA - PINTEYA*\n\n`
    
    // Información básica de la orden
    message += `📋 *Datos de la Orden:*\n`
    message += `• Número: #${orderNumber}\n`
    message += `• Total: ${total}\n`
    message += `• Estado: ${status}\n`
    message += `• Fecha: ${new Date(createdAt).toLocaleString('es-AR')}\n`
    
    if (paymentId) {
      message += `• ID Pago: ${paymentId}\n`
    }
    
    message += `\n👤 *Datos del Cliente:*\n`
    message += `• Nombre: ${payerInfo.name}\n`
    message += `• Email: ${payerInfo.email}\n`
    
    if (payerInfo.phone) {
      message += `• Teléfono: ${payerInfo.phone}\n`
    }
    
    // Información de envío si está disponible
    if (shippingInfo) {
      message += `\n🚚 *Datos de Envío:*\n`
      message += `• Dirección: ${shippingInfo.address}\n`
      message += `• Ciudad: ${shippingInfo.city}\n`
      message += `• Código Postal: ${shippingInfo.postalCode}\n`
    }
    
    // Productos de la orden
    message += `\n🛒 *Productos Ordenados:*\n`
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`
      message += `   • Cantidad: ${item.quantity}\n`
      message += `   • Precio: ${item.price}\n\n`
    })
    
    message += `💰 *TOTAL: ${total}*\n\n`
    message += `✅ Pago confirmado exitosamente\n`
    message += `📦 Proceder con la preparación del pedido\n\n`
    message += `_Mensaje automático del sistema Pinteya E-commerce_`
    
    return message
  }

  /**
   * Genera el enlace de WhatsApp con el mensaje de la orden
   */
  public generateOrderWhatsAppLink(orderDetails: OrderDetails): string {
    try {
      const message = this.formatOrderMessage(orderDetails)
      const encodedMessage = encodeURIComponent(message)
      
      // Generar enlace de WhatsApp
      const whatsappLink = `${WHATSAPP_CONFIG.BASE_URL}/${WHATSAPP_CONFIG.PINTEYA_PHONE}?text=${encodedMessage}`
      
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
      return `${WHATSAPP_CONFIG.BASE_URL}/${WHATSAPP_CONFIG.PINTEYA_PHONE}?text=${encodedFallback}`
    }
  }

  /**
   * Genera un enlace de WhatsApp simple para notificaciones rápidas
   */
  public generateSimpleNotificationLink(orderNumber: string, total: string): string {
    const message = `🔔 Nueva orden: #${orderNumber} - Total: ${total} - Revisar sistema Pinteya`
    const encodedMessage = encodeURIComponent(message)
    return `${WHATSAPP_CONFIG.BASE_URL}/${WHATSAPP_CONFIG.PINTEYA_PHONE}?text=${encodedMessage}`
  }

  /**
   * Valida si el enlace de WhatsApp es válido
   */
  public validateWhatsAppLink(link: string): boolean {
    try {
      const url = new URL(link)
      return url.hostname === 'wa.me' && url.pathname.includes(WHATSAPP_CONFIG.PINTEYA_PHONE.replace('+', ''))
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