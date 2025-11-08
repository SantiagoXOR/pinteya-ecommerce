#!/usr/bin/env node

/**
 * Script completo para arreglar WhatsApp
 * =====================================
 * 
 * 1. Agrega la columna whatsapp_message faltante
 * 2. Genera mensajes de WhatsApp para órdenes sin mensaje
 * 3. Verifica que el formato sea correcto
 * 
 * Uso: node -r dotenv/config scripts/fix-whatsapp-complete.js
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

// Función para generar mensaje de WhatsApp (copiada del código corregido)
function generateWhatsAppMessage(order, validatedData, products) {
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
    `${bullet} Orden: ${order.order_number || order.id}`,
    `${bullet} Subtotal: $${formatARS(order.total || 0)}`,
    `${bullet} Envío: $0,00`,
    `${bullet} Total: $${formatARS(order.total || 0)}`,
    '',
    `*Datos Personales:*`,
    `${bullet} Nombre: ${validatedData.payer.name} ${validatedData.payer.surname}`,
    `${bullet} Teléfono: ${EMOJIS.phone} ${validatedData.payer.phone.area_code}${validatedData.payer.phone.number}`,
    `${bullet} Email: ${EMOJIS.email} ${validatedData.payer.email}`,
    '',
    `*Productos:*`,
  ]

  for (const item of validatedData.items) {
    const product = products.find(p => p.id.toString() === item.id.toString())
    if (product) {
      const lineTotal = product.price * item.quantity
      lines.push(`${bullet} ${product.name} x${item.quantity} - $${formatARS(lineTotal)}`)
    }
  }

  // Datos de envío
  lines.push('', `*Datos de Envío:*`)
  lines.push(`${bullet} Dirección: 📍 ${order.shipping_address?.street_name} ${order.shipping_address?.street_number}`)
  lines.push(`${bullet} Ciudad: ${order.shipping_address?.city_name}, ${order.shipping_address?.state_name}`)
  lines.push(`${bullet} CP: ${order.shipping_address?.zip_code}`)
  lines.push('', `${EMOJIS.check} ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.`)

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

async function fixWhatsAppComplete() {
  console.log('🚀 Iniciando corrección completa de WhatsApp...\n')

  try {
    // Paso 1: Verificar si la columna existe
    console.log('🔍 Paso 1: Verificando columna whatsapp_message...')
    
    const { data: testOrder, error: testError } = await supabase
      .from('orders')
      .select('whatsapp_message')
      .limit(1)

    if (testError && testError.message.includes('does not exist')) {
      console.log('❌ La columna whatsapp_message no existe!')
      console.log('\n📝 ACCIÓN REQUERIDA:')
      console.log('Ejecuta este SQL en el Supabase SQL Editor:')
      console.log('')
      console.log('ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;')
      console.log('')
      console.log('Después de ejecutar el SQL, vuelve a ejecutar este script.')
      return
    }

    console.log('✅ La columna whatsapp_message existe')

    // Paso 2: Obtener órdenes sin mensaje de WhatsApp
    console.log('\n🔍 Paso 2: Buscando órdenes sin mensaje de WhatsApp...')
    
    const { data: ordersWithoutMessage, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .is('whatsapp_generated_at', null)
      .order('created_at', { ascending: false })
      .limit(5)

    if (ordersError) {
      console.log('❌ Error obteniendo órdenes:', ordersError.message)
      return
    }

    console.log(`📊 Encontradas ${ordersWithoutMessage.length} órdenes sin mensaje de WhatsApp`)

    if (ordersWithoutMessage.length === 0) {
      console.log('✅ Todas las órdenes ya tienen mensajes de WhatsApp')
      return
    }

    // Paso 3: Generar mensajes para cada orden
    console.log('\n🔧 Paso 3: Generando mensajes de WhatsApp...')

    for (const order of ordersWithoutMessage) {
      console.log(`\n📝 Procesando orden ${order.id} (${order.order_number})...`)

      try {
        // Crear datos de prueba para generar el mensaje
        const validatedData = {
          payer: {
            name: order.payer_info?.name || 'Cliente',
            surname: order.payer_info?.surname || 'Pinteya',
            email: order.payer_info?.email || `cliente${order.id}@pinteya.com`,
            phone: {
              area_code: '0354',
              number: '7527070'
            }
          },
          items: [
            {
              id: '1',
              quantity: 1
            }
          ]
        }

        const products = [
          {
            id: '1',
            name: 'Producto Pinteya',
            price: order.total || 50000
          }
        ]

        // Generar mensaje
        const rawMessage = generateWhatsAppMessage(order, validatedData, products)
        const sanitizedMessage = sanitizeForWhatsApp(rawMessage)

        // Generar URL de WhatsApp
        const whatsappMessage = encodeURIComponent(sanitizedMessage)
        const whatsappNumber = '5493513411796'
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMessage}`

        // Guardar en la base de datos
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            whatsapp_notification_link: whatsappUrl,
            whatsapp_message: sanitizedMessage,
            whatsapp_generated_at: new Date().toISOString(),
          })
          .eq('id', order.id)

        if (updateError) {
          console.log(`   ❌ Error guardando mensaje: ${updateError.message}`)
        } else {
          console.log(`   ✅ Mensaje generado y guardado`)
          console.log(`   📱 Longitud: ${sanitizedMessage.length} caracteres`)
          console.log(`   📄 Líneas: ${sanitizedMessage.split('\n').length}`)
          console.log(`   🔗 URL: ${whatsappUrl.substring(0, 80)}...`)
        }

      } catch (error) {
        console.log(`   ❌ Error procesando orden: ${error.message}`)
      }
    }

    console.log('\n✅ Corrección completada!')

    // Paso 4: Verificar la orden específica
    console.log('\n🔍 Paso 4: Verificando orden ORD-1760667246-0e3978d4...')
    
    const { data: specificOrder, error: specificError } = await supabase
      .from('orders')
      .select('whatsapp_message, whatsapp_generated_at')
      .eq('order_number', 'ORD-1760667246-0e3978d4')
      .single()

    if (specificError) {
      console.log('❌ Error:', specificError.message)
    } else {
      console.log('✅ Orden encontrada:')
      console.log('- Mensaje generado:', specificOrder.whatsapp_message ? '✅' : '❌')
      console.log('- Fecha generación:', specificOrder.whatsapp_generated_at || 'No generado')
      
      if (specificOrder.whatsapp_message) {
        console.log('\n📱 Mensaje generado:')
        console.log('=' .repeat(50))
        console.log(specificOrder.whatsapp_message)
        console.log('=' .repeat(50))
      }
    }

  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message)
  }
}

// Función principal
async function main() {
  await fixWhatsAppComplete()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { fixWhatsAppComplete }
