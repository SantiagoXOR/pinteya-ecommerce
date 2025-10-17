#!/usr/bin/env node

/**
 * Script para corregir el mensaje de la nueva orden
 * ================================================
 * 
 * Corrige el mensaje de la orden ORD-1760696945-c8ec734a
 * 
 * Uso: node -r dotenv/config scripts/fix-new-order-message.js
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
function generateCorrectMessage(order) {
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
    `${bullet} Subtotal: $${formatARS(order.total - 10000)}`,
    `${bullet} Envío: $10.000,00`,
    `${bullet} Total: $${formatARS(order.total)}`,
    '',
    `*Datos Personales:*`,
    `${bullet} Nombre: Santiago Martinez`,
    `${bullet} Teléfono: ${EMOJIS.phone} 03547527070`,
    `${bullet} Email: ${EMOJIS.email} santiagomartinez@upc.edu.ar`,
    '',
    `*Productos:*`,
    `${bullet} Sintético Converlux x1 - $${formatARS(order.total - 10000)}`,
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

async function fixNewOrderMessage() {
  console.log('🔧 Corrigiendo mensaje de la orden ORD-1760696945-c8ec734a...\n')

  try {
    // Obtener la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', 'ORD-1760696945-c8ec734a')
      .single()

    if (orderError) {
      console.log('❌ Error obteniendo orden:', orderError.message)
      return
    }

    console.log('✅ Orden encontrada:')
    console.log('- ID:', order.id)
    console.log('- Total:', order.total)
    console.log('- Shipping Address:', order.shipping_address ? 'Presente' : 'Ausente')

    // Generar mensaje correcto
    const correctMessage = generateCorrectMessage(order)

    console.log('\n📱 Mensaje corregido:')
    console.log('=' .repeat(60))
    console.log(correctMessage)
    console.log('=' .repeat(60))

    console.log('\n📊 Análisis del mensaje corregido:')
    console.log('- Líneas:', correctMessage.split('\n').length)
    console.log('- Contiene saltos de línea:', correctMessage.includes('\n') ? '✅' : '❌')
    console.log('- Longitud:', correctMessage.length, 'caracteres')

    // Actualizar en la base de datos
    console.log('\n💾 Actualizando mensaje en base de datos...')
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ whatsapp_message: correctMessage })
      .eq('id', order.id)

    if (updateError) {
      console.log('❌ Error actualizando mensaje:', updateError.message)
    } else {
      console.log('✅ Mensaje corregido y guardado en BD')

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

  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message)
  }
}

// Función principal
async function main() {
  await fixNewOrderMessage()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { fixNewOrderMessage }
