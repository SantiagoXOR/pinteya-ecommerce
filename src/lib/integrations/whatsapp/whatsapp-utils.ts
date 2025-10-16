/**
 * Utilidades para compatibilidad de mensajes en WhatsApp.
 *
 * Objetivo: minimizar problemas de renderizado de emojis y mantener saltos de línea
 * en diferentes clientes (móvil, desktop, web) removiendo caracteres problemáticos.
 */

/**
 * Elimina Variation Selector-16 (\uFE0F) y Zero Width Joiner (\u200D),
 * conservando espacios y saltos de línea. Estos caracteres pueden romper
 * el renderizado de emojis o producir bloques sin formato en ciertos clientes.
 */
export function sanitizeForWhatsApp(text: string): string {
  if (!text) return ''

  return text
    // Quitar VS16 (variation selector) y ZWJ (zero width joiner)
    .replace(/\uFE0F/g, '')
    .replace(/\u200D/g, '')
    // Normalizar espacios múltiples, sin tocar los saltos de línea
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/**
 * Conjunto de emojis simples y confiables para mensajes.
 * Elegidos para buena compatibilidad sin necesidad de ZWJ/VS16.
 */
export const EMOJIS = {
  // Básicos seguros
  check: '✅',
  phone: '📞',
  email: '📧',
  pin: '📍',
  money: '💸',
  truck: '🚚',
  calendar: '📅',
  receipt: '🧾',
  info: 'ℹ️',
  warn: '❗',
  bullet: '•',

  // Alias según guía
  telefono: '📞',
  ubicacion: '📍',
  dinero: '💸',
  reloj: '⏱️', // se degrada a "⏱" tras sanitizar
  nota: '📝',
  moto: '🏍️', // se degrada a "🏍" tras sanitizar
  auto: '🚗',
} as const

export type EmojiName = keyof typeof EMOJIS

/**
 * Número en formato E.164 (solo dígitos) para construir URLs.
 * Usa env WHATSAPP_BUSINESS_NUMBER si está disponible; cae a valor conocido.
 */
export const WHATSAPP_NUMBER_E164: string = (() => {
  const raw = process.env.WHATSAPP_BUSINESS_NUMBER || '5493513411796'
  return String(raw).replace(/\D/g, '')
})()

/**
 * Genera la URL de WhatsApp correcta según si hay texto o no.
 * - Con texto: api.whatsapp.com/send?phone=...&text=...
 * - Sin texto: wa.me/<phone>
 */
export function getWhatsAppUrl(message?: string): string {
  const phone = WHATSAPP_NUMBER_E164
  if (message && message.trim().length > 0) {
    const text = encodeURIComponent(message)
    return `https://api.whatsapp.com/send?phone=${phone}&text=${text}`
  }
  return `https://wa.me/${phone}`
}

/**
 * Genera mensaje de WhatsApp específico para órdenes de MercadoPago
 * Similar al mensaje de pago contra entrega pero adaptado para MercadoPago
 */
export function generateMercadoPagoWhatsAppMessage(order: any): string {
  const lines: string[] = [
    `¡Hola! He completado mi pago con MercadoPago`,
    '',
    `${EMOJIS.receipt} *Orden #${order.id}*`,
    `${EMOJIS.bullet} Cliente: ${order.payer_name} ${order.payer_surname}`,
    `${EMOJIS.bullet} Email: ${EMOJIS.email} ${order.payer_email}`,
    `${EMOJIS.bullet} Teléfono: ${EMOJIS.phone} ${order.payer_phone}`,
    '',
    `🛍️ *Productos:*`,
  ]

  order.items?.forEach((item: any, index: number) => {
    lines.push(`${index + 1}. ${item.product_name} x${item.quantity} - $${item.unit_price.toFixed(2)}`)
  })

  lines.push('', `${EMOJIS.money} *Total: $${order.total_amount.toFixed(2)}*`, '')
  lines.push(`💳 *Método de pago:* MercadoPago`)
  lines.push(`${EMOJIS.calendar} *Fecha del pago:* ${new Date(order.created_at).toLocaleDateString('es-AR')}`)
  lines.push('')
  lines.push(`${EMOJIS.check} Pago confirmado y aprobado`)
  lines.push('')
  lines.push(`${EMOJIS.info} Gracias por tu compra. Nuestro equipo te contactará en las próximas horas.`)

  const message = sanitizeForWhatsApp(lines.join('\n'))
  return message
}