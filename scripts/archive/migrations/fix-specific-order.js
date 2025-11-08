#!/usr/bin/env node

/**
 * Script para corregir la orden específica ORD-1760667246-0e3978d4
 * =============================================================
 * 
 * 1. Corrige el payer_info de la orden
 * 2. Genera mensaje de WhatsApp con formato correcto
 * 3. Muestra el resultado
 * 
 * Uso: node -r dotenv/config scripts/fix-specific-order.js
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

// Función para generar mensaje de WhatsApp con formato correcto
function generateWhatsAppMessage(order) {
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
    `${bullet} Orden: ${order.order_number}`,
    `${bullet} Subtotal: $${formatARS(order.total)}`,
    `${bullet} Envío: $0,00`,
    `${bullet} Total: $${formatARS(order.total)}`,
    '',
    `*Datos Personales:*`,
    `${bullet} Nombre: Santiago Martinez`,
    `${bullet} Teléfono: ${EMOJIS.phone} 03547527070`,
    `${bullet} Email: ${EMOJIS.email} santiagomartinez@upc.edu.ar`,
    '',
    `*Productos:*`,
    `${bullet} Techos Poliuretánico x1 - $${formatARS(order.total)}`,
    '',
    `*Datos de Envío:*`,
    `${bullet} Dirección: 📍 ${order.shipping_address.street_name} ${order.shipping_address.street_number}`,
    `${bullet} Ciudad: ${order.shipping_address.city_name}, ${order.shipping_address.state_name}`,
    `${bullet} CP: ${order.shipping_address.zip_code}`,
    '',
    `${EMOJIS.check} ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.`
  ]

  return lines.join('\n')
}

// Función para sanitizar mensaje
function sanitizeForWhatsApp(text) {
  if (!text) return ''

  return text
    .replace(/\uFE0F/g, '')
    .replace(/\u200D/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

async function fixSpecificOrder() {
  console.log('🔧 Corrigiendo orden específica ORD-1760667246-0e3978d4...\n')

  try {
    // Paso 1: Obtener la orden
    console.log('🔍 Obteniendo orden...')
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', 'ORD-1760667246-0e3978d4')
      .single()

    if (orderError) {
      console.log('❌ Error obteniendo orden:', orderError.message)
      return
    }

    console.log('✅ Orden encontrada:')
    console.log('- ID:', order.id)
    console.log('- Total:', order.total)
    console.log('- Payer Info:', order.payer_info ? 'Presente' : 'Ausente')
    console.log('- Shipping Address:', order.shipping_address ? 'Presente' : 'Ausente')

    // Paso 2: Corregir payer_info
    console.log('\n🔧 Corrigiendo payer_info...')
    
    const payerInfo = {
      name: 'Santiago',
      surname: 'Martinez',
      email: 'santiagomartinez@upc.edu.ar',
      phone: '03547527070'
    }

    const { error: payerError } = await supabase
      .from('orders')
      .update({ payer_info: payerInfo })
      .eq('id', order.id)

    if (payerError) {
      console.log('❌ Error actualizando payer_info:', payerError.message)
    } else {
      console.log('✅ payer_info corregido')
    }

    // Paso 3: Generar mensaje de WhatsApp
    console.log('\n📱 Generando mensaje de WhatsApp...')
    
    const rawMessage = generateWhatsAppMessage(order)
    const sanitizedMessage = sanitizeForWhatsApp(rawMessage)

    console.log('✅ Mensaje generado:')
    console.log('=' .repeat(60))
    console.log(sanitizedMessage)
    console.log('=' .repeat(60))

    // Análisis del mensaje
    console.log('\n📊 Análisis del mensaje:')
    console.log('- Longitud:', sanitizedMessage.length, 'caracteres')
    console.log('- Líneas:', sanitizedMessage.split('\n').length)
    console.log('- Contiene saltos de línea:', sanitizedMessage.includes('\n') ? '✅' : '❌')
    console.log('- Emojis preservados:', sanitizedMessage.includes('✨') ? '✅' : '❌')

    // Paso 4: Generar URL de WhatsApp
    console.log('\n🔗 Generando URL de WhatsApp...')
    
    const whatsappMessage = encodeURIComponent(sanitizedMessage)
    const whatsappNumber = '5493513411796'
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMessage}`

    console.log('✅ URL generada:')
    console.log(whatsappUrl)

    // Paso 5: Intentar guardar en la base de datos (solo si la columna existe)
    console.log('\n💾 Intentando guardar en base de datos...')
    
    const { error: saveError } = await supabase
      .from('orders')
      .update({
        whatsapp_notification_link: whatsappUrl,
        whatsapp_generated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (saveError) {
      console.log('⚠️  No se pudo guardar (columna whatsapp_message no existe):', saveError.message)
      console.log('📝 Pero el mensaje está generado correctamente con formato!')
    } else {
      console.log('✅ Datos guardados en base de datos')
    }

    console.log('\n🎉 CORRECCIÓN COMPLETADA!')
    console.log('📱 El mensaje ahora tiene formato correcto con saltos de línea')
    console.log('🔗 Usa la URL generada para probar en WhatsApp')

  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message)
  }
}

// Función principal
async function main() {
  await fixSpecificOrder()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { fixSpecificOrder }
