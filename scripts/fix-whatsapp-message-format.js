#!/usr/bin/env node

/**
 * Script para corregir el formato del mensaje de WhatsApp
 * ======================================================
 * 
 * Regenera el mensaje con formato correcto y saltos de línea
 * 
 * Uso: node -r dotenv/config scripts/fix-whatsapp-message-format.js
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

// Función para generar mensaje con formato correcto
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

async function fixMessageFormat() {
  console.log('🔧 Corrigiendo formato del mensaje de WhatsApp...\n')

  try {
    // Obtener la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', 'ORD-1760667246-0e3978d4')
      .single()

    if (orderError) {
      console.log('❌ Error obteniendo orden:', orderError.message)
      return
    }

    console.log('✅ Orden encontrada:', order.order_number)

    // Generar mensaje con formato correcto
    const correctMessage = generateWhatsAppMessage(order)

    console.log('\n📱 Mensaje generado con formato correcto:')
    console.log('=' .repeat(60))
    console.log(correctMessage)
    console.log('=' .repeat(60))

    // Análisis del mensaje
    console.log('\n📊 Análisis del mensaje:')
    console.log('- Longitud:', correctMessage.length, 'caracteres')
    console.log('- Líneas:', correctMessage.split('\n').length)
    console.log('- Contiene saltos de línea:', correctMessage.includes('\n') ? '✅' : '❌')

    // Actualizar en la base de datos
    console.log('\n💾 Actualizando mensaje en base de datos...')
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ whatsapp_message: correctMessage })
      .eq('id', order.id)

    if (updateError) {
      console.log('❌ Error actualizando mensaje:', updateError.message)
    } else {
      console.log('✅ Mensaje actualizado correctamente en la base de datos')

      // Verificar que se guardó correctamente
      console.log('\n🔍 Verificando que se guardó correctamente...')
      
      const { data: verifyOrder, error: verifyError } = await supabase
        .from('orders')
        .select('whatsapp_message')
        .eq('id', order.id)
        .single()

      if (verifyError) {
        console.log('❌ Error verificando:', verifyError.message)
      } else {
        console.log('✅ Mensaje verificado en BD:')
        console.log('- Líneas guardadas:', verifyOrder.whatsapp_message.split('\n').length)
        console.log('- Saltos de línea preservados:', verifyOrder.whatsapp_message.includes('\n') ? '✅' : '❌')
      }
    }

    console.log('\n🎉 ¡CORRECCIÓN COMPLETADA!')
    console.log('📱 El mensaje ahora tiene formato correcto con saltos de línea')
    console.log('💾 Guardado correctamente en la base de datos')

  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message)
  }
}

// Función principal
async function main() {
  await fixMessageFormat()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { fixMessageFormat }
