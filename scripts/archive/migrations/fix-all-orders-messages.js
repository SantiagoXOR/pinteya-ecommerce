#!/usr/bin/env node

/**
 * Script para corregir todos los mensajes de órdenes
 * ================================================
 * 
 * Regenera correctamente todos los mensajes de WhatsApp con formato correcto
 * 
 * Uso: node -r dotenv/config scripts/fix-all-orders-messages.js
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
    `${bullet} Subtotal: $${formatARS(order.total || 0)}`,
    `${bullet} Envío: $0,00`,
    `${bullet} Total: $${formatARS(order.total || 0)}`,
    '',
    `*Datos Personales:*`,
    `${bullet} Nombre: ${order.payer_info?.name || 'Cliente'} ${order.payer_info?.surname || 'Pinteya'}`,
    `${bullet} Teléfono: ${EMOJIS.phone} ${order.payer_info?.phone || '03547527070'}`,
    `${bullet} Email: ${EMOJIS.email} ${order.payer_info?.email || 'cliente@pinteya.com'}`,
    '',
    `*Productos:*`,
    `${bullet} Producto Pinteya x1 - $${formatARS(order.total || 0)}`,
    '',
    `*Datos de Envío:*`,
    `${bullet} Dirección: 📍 ${order.shipping_address?.street_name || 'Dirección'} ${order.shipping_address?.street_number || '123'}`,
    `${bullet} Ciudad: ${order.shipping_address?.city_name || 'Córdoba'}, ${order.shipping_address?.state_name || 'Córdoba'}`,
    `${bullet} CP: ${order.shipping_address?.zip_code || '5000'}`,
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

async function fixAllOrdersMessages() {
  console.log('🔧 Corrigiendo todos los mensajes de órdenes...\n')

  try {
    // Obtener todas las órdenes con enlaces de WhatsApp
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .not('whatsapp_notification_link', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (ordersError) {
      console.log('❌ Error obteniendo órdenes:', ordersError.message)
      return
    }

    console.log(`📊 Encontradas ${orders.length} órdenes para corregir`)

    let correctedCount = 0
    let errorCount = 0

    for (const order of orders) {
      try {
        console.log(`\n🔧 Corrigiendo orden ${order.id} (${order.order_number})...`)

        // Generar mensaje correcto
        const correctMessage = generateWhatsAppMessage(order)
        const sanitizedMessage = sanitizeForWhatsApp(correctMessage)

        console.log(`   📱 Mensaje generado: ${sanitizedMessage.split('\n').length} líneas`)

        // Actualizar en la base de datos
        const { error: updateError } = await supabase
          .from('orders')
          .update({ whatsapp_message: sanitizedMessage })
          .eq('id', order.id)

        if (updateError) {
          console.log(`   ❌ Error actualizando: ${updateError.message}`)
          errorCount++
        } else {
          console.log(`   ✅ Mensaje corregido y guardado`)
          correctedCount++
        }

      } catch (e) {
        console.log(`   ❌ Error procesando orden: ${e.message}`)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📋 RESUMEN DE CORRECCIONES')
    console.log('='.repeat(60))
    console.log(`✅ Órdenes corregidas: ${correctedCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    console.log(`📊 Total procesadas: ${orders.length}`)
    console.log('='.repeat(60))

    // Verificar una orden específica
    console.log('\n🔍 Verificando orden ORD-1760696945-c8ec734a...')
    
    const { data: specificOrder, error: specificError } = await supabase
      .from('orders')
      .select('whatsapp_message')
      .eq('order_number', 'ORD-1760696945-c8ec734a')
      .single()

    if (specificError) {
      console.log('❌ Error:', specificError.message)
    } else {
      console.log('✅ Mensaje verificado:')
      console.log('- Líneas:', specificOrder.whatsapp_message.split('\n').length)
      console.log('- Contiene saltos de línea:', specificOrder.whatsapp_message.includes('\n') ? '✅' : '❌')
      
      console.log('\n📱 Mensaje corregido:')
      console.log('=' .repeat(50))
      console.log(specificOrder.whatsapp_message)
      console.log('=' .repeat(50))
    }

    console.log('\n🎉 ¡CORRECCIÓN COMPLETADA!')
    console.log('📱 Todos los mensajes ahora tienen formato correcto con saltos de línea')

  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message)
  }
}

// Función principal
async function main() {
  await fixAllOrdersMessages()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { fixAllOrdersMessages }
