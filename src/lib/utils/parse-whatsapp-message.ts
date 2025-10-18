/**
 * Utilidad para parsear mensajes de WhatsApp de órdenes
 * Extrae información estructurada del mensaje formateado
 */

export interface ParsedOrderData {
  orderNumber: string
  total: string
  customerName: string
  phone: string
  email: string
  address: string
  city: string
  postalCode: string
  products: Array<{
    name: string
    quantity: number
    price: string
  }>
  paymentMethod?: string
  status?: string
}

/**
 * Parsea un mensaje de WhatsApp de orden y extrae la información estructurada
 */
export function parseWhatsAppOrderMessage(message: string): ParsedOrderData | null {
  if (!message) return null

  const data: Partial<ParsedOrderData> = {
    products: []
  }

  try {
    const lines = message.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Extraer número de orden - soportar ambos formatos
      // Formato nuevo: "• Orden: 299" (del whatsappLinkService)
      if (line.includes('• Orden:') && !line.includes('ORD-')) {
        const match = line.match(/• Orden:\s*#?(\d+)/)
        if (match) data.orderNumber = match[1]
      }
      // Formato antiguo: "🧾 *Orden #ORD-123*" (del frontend)
      else if (line.includes('🧾') && line.includes('Orden #')) {
        const match = line.match(/Orden #([A-Z0-9-]+)/i)
        if (match) data.orderNumber = match[1]
      }
      // Formato genérico: "Orden: 299" o "Orden #299"
      else if (line.includes('Orden:') || line.includes('Orden #')) {
        const match = line.match(/Orden[:\s#]+([A-Z0-9-]+)/i)
        if (match) data.orderNumber = match[1]
      }

      // Extraer total
      if (line.includes('Total:') && line.includes('$')) {
        const match = line.match(/Total:\s*\$?([\d.,]+)/)
        if (match) data.total = match[1]
      }

      // Extraer nombre - soportar ambos formatos
      // Formato nuevo: "• Nombre: Santiago Martinez" (del whatsappLinkService)
      if (line.includes('• Nombre:')) {
        const match = line.match(/• Nombre:\s*(.+)/)
        if (match) data.customerName = match[1].trim()
      }
      // Formato genérico: "Nombre: Santiago"
      else if (line.includes('Nombre:')) {
        const match = line.match(/Nombre:\s*(.+)/)
        if (match) data.customerName = match[1].trim()
      }

      // Extraer teléfono
      if (line.includes('Teléfono:') || line.includes('📞')) {
        const match = line.match(/Teléfono:.*?(\d[\d\s]+\d)/)
        if (match) data.phone = match[1].replace(/\s/g, '')
      }

      // Extraer email
      if (line.includes('Email:') || line.includes('📧')) {
        const match = line.match(/Email:.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
        if (match) data.email = match[1]
      }

      // Extraer dirección
      if (line.includes('Dirección:') || line.includes('📍')) {
        const match = line.match(/Dirección:.*?📍?\s*(.+)/)
        if (match) data.address = match[1].trim()
      }

      // Extraer ciudad
      if (line.includes('Ciudad:')) {
        const match = line.match(/Ciudad:\s*(.+)/)
        if (match) data.city = match[1].trim()
      }

      // Extraer código postal
      if (line.includes('CP:')) {
        const match = line.match(/CP:\s*(\d+)/)
        if (match) data.postalCode = match[1]
      }

      // Extraer método de pago
      if (line.includes('Método de pago:')) {
        const match = line.match(/Método de pago:\s*(.+)/)
        if (match) data.paymentMethod = match[1].trim()
      }

      // Extraer productos (líneas que empiezan con • o número seguido de punto)
      if ((line.startsWith('•') || /^\d+\./.test(line)) && line.includes('x') && line.includes('$')) {
        const productMatch = line.match(/[•\d.]\s*(.+?)\s+x(\d+)\s+-\s+\$?([\d.,]+)/)
        if (productMatch) {
          data.products!.push({
            name: productMatch[1].trim(),
            quantity: parseInt(productMatch[2]),
            price: productMatch[3]
          })
        }
      }

      // Extraer productos con formato más simple (solo •)
      if (line.startsWith('•') && !line.includes('Cliente:') && !line.includes('Teléfono:') && !line.includes('Email:') && !line.includes('Dirección:')) {
        // Si contiene "Producto" y tiene precio, es un producto
        if (line.includes('Producto') && line.includes('$')) {
          const simpleMatch = line.match(/•\s*(.+?)\s+x(\d+)\s+-\s+\$?([\d.,]+)/)
          if (simpleMatch) {
            data.products!.push({
              name: simpleMatch[1].trim(),
              quantity: parseInt(simpleMatch[2]),
              price: simpleMatch[3]
            })
          }
        }
      }
    }

    // Si no tenemos orderNumber, usar un ID por defecto
    if (!data.orderNumber) {
      data.orderNumber = 'ORD-' + Date.now()
    }

    // Si no tenemos total, usar 0
    if (!data.total) {
      data.total = '0'
    }

    // Si no tenemos customerName, usar "Cliente"
    if (!data.customerName) {
      data.customerName = 'Cliente'
    }

    return data as ParsedOrderData
  } catch (error) {
    console.error('Error parsing WhatsApp message:', error)
    return null
  }
}

/**
 * Formatea el mensaje para mostrar en HTML manteniendo los saltos de línea
 */
export function formatWhatsAppMessageForDisplay(message: string): string {
  if (!message) return ''
  
  return message
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}
