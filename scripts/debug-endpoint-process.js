#!/usr/bin/env node

/**
 * Script para debuggear el proceso del endpoint
 * ============================================
 * 
 * Simula exactamente el proceso del endpoint create-cash-order
 * para encontrar dónde se pierden los saltos de línea
 * 
 * Uso: node -r dotenv/config scripts/debug-endpoint-process.js
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

// Función sanitizeForWhatsApp (copiada del código)
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

// Función para generar mensaje como en el endpoint
function generateMessage() {
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
    `${bullet} Orden: ORD-DEBUG-TEST`,
    `${bullet} Subtotal: $10.000,00`,
    `${bullet} Envío: $0,00`,
    `${bullet} Total: $10.000,00`,
    '',
    `*Datos Personales:*`,
    `${bullet} Nombre: Test User`,
    `${bullet} Teléfono: ${EMOJIS.phone} 1234567890`,
    `${bullet} Email: ${EMOJIS.email} test@example.com`,
    '',
    `*Productos:*`,
    `${bullet} Producto Test x1 - $10.000,00`,
    '',
    `*Datos de Envío:*`,
    `${bullet} Dirección: 📍 Test Street 123`,
    `${bullet} Ciudad: Test City, Test State`,
    `${bullet} CP: 12345`,
    '',
    `${EMOJIS.check} ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.`
  ]

  return lines.join('\n')
}

async function debugEndpointProcess() {
  console.log('🔍 Debuggeando proceso del endpoint create-cash-order...\n')

  try {
    // Paso 1: Generar mensaje
    console.log('📝 Paso 1: Generando mensaje...')
    const rawMessage = generateMessage()
    console.log('Mensaje original líneas:', rawMessage.split('\n').length)
    console.log('Contiene saltos de línea:', rawMessage.includes('\n') ? '✅' : '❌')

    // Paso 2: Aplicar sanitizeForWhatsApp
    console.log('\n🧹 Paso 2: Aplicando sanitizeForWhatsApp...')
    const sanitizedMessage = sanitizeForWhatsApp(rawMessage)
    console.log('Mensaje sanitizado líneas:', sanitizedMessage.split('\n').length)
    console.log('Contiene saltos de línea:', sanitizedMessage.includes('\n') ? '✅' : '❌')

    // Paso 3: Codificar para URL
    console.log('\n🔗 Paso 3: Codificando para URL...')
    const encodedMessage = encodeURIComponent(sanitizedMessage)
    console.log('Mensaje codificado contiene %0A:', encodedMessage.includes('%0A') ? '✅' : '❌')

    // Paso 4: Decodificar de URL
    console.log('\n📱 Paso 4: Decodificando de URL...')
    const decodedMessage = decodeURIComponent(encodedMessage)
    console.log('Mensaje decodificado líneas:', decodedMessage.split('\n').length)
    console.log('Contiene saltos de línea:', decodedMessage.includes('\n') ? '✅' : '❌')

    // Mostrar mensajes en cada paso
    console.log('\n📱 Mensaje original:')
    console.log('=' .repeat(50))
    console.log(rawMessage)
    console.log('=' .repeat(50))

    console.log('\n📱 Mensaje sanitizado:')
    console.log('=' .repeat(50))
    console.log(sanitizedMessage)
    console.log('=' .repeat(50))

    console.log('\n📱 Mensaje decodificado:')
    console.log('=' .repeat(50))
    console.log(decodedMessage)
    console.log('=' .repeat(50))

    // Paso 5: Simular guardado en BD
    console.log('\n💾 Paso 5: Simulando guardado en BD...')
    
    // Crear orden de prueba
    const testOrderData = {
      user_id: null,
      total: 10000,
      status: 'test',
      payment_status: 'test',
      order_number: `DEBUG-${Date.now()}`,
      whatsapp_message: sanitizedMessage,
      whatsapp_notification_link: `https://api.whatsapp.com/send?phone=5493513411796&text=${encodedMessage}`,
      whatsapp_generated_at: new Date().toISOString()
    }

    const { data: insertData, error: insertError } = await supabase
      .from('orders')
      .insert(testOrderData)
      .select()

    if (insertError) {
      console.log('❌ Error creando orden de prueba:', insertError.message)
      return
    }

    console.log('✅ Orden de prueba creada:', insertData[0].id)

    // Paso 6: Leer de BD
    console.log('\n📖 Paso 6: Leyendo de BD...')
    
    const { data: readOrder, error: readError } = await supabase
      .from('orders')
      .select('whatsapp_message, whatsapp_notification_link')
      .eq('id', insertData[0].id)
      .single()

    if (readError) {
      console.log('❌ Error leyendo orden:', readError.message)
      return
    }

    console.log('Mensaje leído de BD líneas:', readOrder.whatsapp_message.split('\n').length)
    console.log('Contiene saltos de línea:', readOrder.whatsapp_message.includes('\n') ? '✅' : '❌')

    console.log('\n📱 Mensaje leído de BD:')
    console.log('=' .repeat(50))
    console.log(readOrder.whatsapp_message)
    console.log('=' .repeat(50))

    // Paso 7: Decodificar URL guardada
    console.log('\n🔗 Paso 7: Decodificando URL guardada...')
    
    const url = new URL(readOrder.whatsapp_notification_link)
    const urlEncodedMessage = url.searchParams.get('text')
    const urlDecodedMessage = decodeURIComponent(urlEncodedMessage || '')
    
    console.log('Mensaje de URL decodificado líneas:', urlDecodedMessage.split('\n').length)
    console.log('Contiene saltos de línea:', urlDecodedMessage.includes('\n') ? '✅' : '❌')

    console.log('\n📱 Mensaje de URL decodificado:')
    console.log('=' .repeat(50))
    console.log(urlDecodedMessage)
    console.log('=' .repeat(50))

    // Limpiar orden de prueba
    await supabase
      .from('orders')
      .delete()
      .eq('id', insertData[0].id)
    
    console.log('\n🧹 Orden de prueba eliminada')

    console.log('\n🎯 CONCLUSIÓN:')
    console.log('El proceso de codificación/decodificación funciona correctamente.')
    console.log('El problema debe estar en otro lugar del flujo.')

  } catch (error) {
    console.error('❌ Error durante el debug:', error.message)
  }
}

// Función principal
async function main() {
  await debugEndpointProcess()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { debugEndpointProcess }
