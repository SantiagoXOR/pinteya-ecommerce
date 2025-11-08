#!/usr/bin/env node

/**
 * Script para probar el formato de WhatsApp
 * =======================================
 * 
 * Genera un mensaje de WhatsApp de prueba para verificar el formato
 * 
 * Uso: node scripts/test-whatsapp-format.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Función para generar mensaje de WhatsApp (copiada de create-cash-order)
function generateWhatsAppMessage(orderData, products) {
  const EMOJIS = {
    bullet: '•',
    phone: '📞',
    email: '📧',
    check: '✅'
  }

  const formatARS = (v) => Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const bullet = EMOJIS.bullet

  const lines = [
    `✨ *¡Gracias por tu compra en Pinteya!* 🛍`,
    `🤝 Te compartimos el detalle para coordinar la entrega:`,
    '',
    `*Detalle de Orden:*`,
    `${bullet} Orden: ${orderData.order_number || orderData.id}`,
    `${bullet} Subtotal: $${formatARS(orderData.itemsSubtotal)}`,
    `${bullet} Envío: $${formatARS(orderData.shippingCost)}`,
    `${bullet} Total: $${formatARS(orderData.totalAmount)}`,
    '',
    `*Datos Personales:*`,
    `${bullet} Nombre: ${orderData.payer.name} ${orderData.payer.surname}`,
    `${bullet} Teléfono: ${EMOJIS.phone} ${orderData.payer.phone.area_code}${orderData.payer.phone.number}`,
    `${bullet} Email: ${EMOJIS.email} ${orderData.payer.email}`,
    '',
    `*Productos:*`,
  ]

  for (const item of orderData.items) {
    const product = products.find(p => p.id.toString() === item.id.toString())
    if (product) {
      const lineTotal = product.price * item.quantity
      lines.push(`${bullet} ${product.name} x${item.quantity} - $${formatARS(lineTotal)}`)
    }
  }

  // Datos de envío
  lines.push('', `*Datos de Envío:*`)
  lines.push(`${bullet} Dirección: 📍 ${orderData.shipping.street_name} ${orderData.shipping.street_number}`)
  lines.push(`${bullet} Ciudad: ${orderData.shipping.city_name}, ${orderData.shipping.state_name}`)
  lines.push(`${bullet} CP: ${orderData.shipping.zip_code}`)
  lines.push('', `${EMOJIS.check} ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.`)

  return lines.join('\n')
}

// Función para sanitizar mensaje (copiada de whatsapp-utils)
function sanitizeForWhatsApp(text) {
  if (!text) return ''

  return text
    // Quitar VS16 (variation selector) y ZWJ (zero width joiner)
    .replace(/\uFE0F/g, '')
    .replace(/\u200D/g, '')
    // Normalizar espacios múltiples, sin tocar los saltos de línea
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

async function testWhatsAppFormat() {
  console.log('🧪 Probando formato de mensaje de WhatsApp...\n')

  try {
    // Obtener una orden válida de la base de datos
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        payer_info,
        shipping_address,
        created_at
      `)
      .eq('id', 211) // Usar una de las órdenes que corregimos
      .single()

    if (orderError) {
      throw new Error(`Error al obtener orden: ${orderError.message}`)
    }

    console.log(`📋 Usando orden: ${order.id} (${order.order_number})`)

    // Crear datos de prueba basados en la orden real
    const testOrderData = {
      id: order.id,
      order_number: order.order_number,
      totalAmount: order.total || 50000,
      itemsSubtotal: order.total || 50000,
      shippingCost: 0,
      payer: {
        name: order.payer_info?.name || 'Santiago',
        surname: order.payer_info?.surname || 'Martinez',
        email: order.payer_info?.email || 'santiago@example.com',
        phone: {
          area_code: '0354',
          number: '7527070'
        }
      },
      items: [
        {
          id: '1',
          quantity: 1,
          price: order.total || 50000
        }
      ],
      shipping: order.shipping_address || {
        street_name: 'Arturo Orgaz',
        street_number: '510',
        city_name: 'Córdoba',
        state_name: 'Córdoba',
        zip_code: '5000'
      }
    }

    // Productos de prueba
    const testProducts = [
      {
        id: '1',
        name: 'Techos Poliuretánico',
        price: order.total || 50000
      }
    ]

    // Generar mensaje
    console.log('📝 Generando mensaje...')
    const rawMessage = generateWhatsAppMessage(testOrderData, testProducts)
    const sanitizedMessage = sanitizeForWhatsApp(rawMessage)

    console.log('\n' + '='.repeat(60))
    console.log('📱 MENSAJE DE WHATSAPP GENERADO')
    console.log('='.repeat(60))
    console.log(sanitizedMessage)
    console.log('='.repeat(60))

    // Mostrar análisis del mensaje
    console.log('\n📊 ANÁLISIS DEL MENSAJE:')
    console.log(`- Longitud total: ${sanitizedMessage.length} caracteres`)
    console.log(`- Número de líneas: ${sanitizedMessage.split('\n').length}`)
    console.log(`- Contiene saltos de línea: ${sanitizedMessage.includes('\n') ? '✅' : '❌'}`)
    console.log(`- Emojis preservados: ${sanitizedMessage.includes('✨') && sanitizedMessage.includes('🛍') ? '✅' : '❌'}`)

    // Generar URL de WhatsApp
    const whatsappMessage = encodeURIComponent(sanitizedMessage)
    const whatsappNumber = '5493513411796' // Número de Pinteya
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMessage}`

    console.log('\n🔗 URL DE WHATSAPP:')
    console.log(whatsappUrl.substring(0, 100) + '...')

    console.log('\n✅ Prueba completada exitosamente!')
    console.log('📱 El mensaje debería mostrarse correctamente en WhatsApp con saltos de línea')

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message)
  }
}

// Función principal
async function main() {
  await testWhatsAppFormat()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { testWhatsAppFormat }
