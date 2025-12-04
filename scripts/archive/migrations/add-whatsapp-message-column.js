#!/usr/bin/env node

/**
 * Script para agregar la columna whatsapp_message faltante
 * =======================================================
 * 
 * Agrega la columna whatsapp_message que falta en la tabla orders
 * 
 * Uso: node -r dotenv/config scripts/add-whatsapp-message-column.js
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

async function addWhatsAppMessageColumn() {
  console.log('🔧 Agregando columna whatsapp_message a la tabla orders...\n')

  try {
    // Verificar si la columna ya existe
    console.log('🔍 Verificando si la columna ya existe...')
    
    const { data: testOrder, error: testError } = await supabase
      .from('orders')
      .select('whatsapp_message')
      .limit(1)

    if (!testError) {
      console.log('✅ La columna whatsapp_message ya existe!')
      return
    }

    if (!testError.message.includes('does not exist')) {
      console.log('❌ Error inesperado:', testError.message)
      return
    }

    console.log('⚠️  La columna whatsapp_message no existe. Intentando agregarla...')

    // Como no podemos ejecutar ALTER TABLE directamente desde el cliente,
    // vamos a mostrar las instrucciones manuales
    console.log('\n📝 INSTRUCCIONES MANUALES:')
    console.log('Para agregar la columna faltante, ejecuta este SQL en el Supabase SQL Editor:')
    console.log('')
    console.log('ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;')
    console.log('')
    console.log('Después de ejecutar el SQL, vuelve a ejecutar este script para verificar.')

    // Verificar si hay órdenes que necesitan generar mensajes de WhatsApp
    console.log('\n🔍 Verificando órdenes que necesitan mensajes de WhatsApp...')
    
    const { data: ordersWithoutMessage, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, created_at')
      .is('whatsapp_generated_at', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (ordersError) {
      console.log('⚠️  No se pudo verificar órdenes sin mensaje de WhatsApp')
    } else {
      console.log(`📊 Órdenes sin mensaje de WhatsApp: ${ordersWithoutMessage.length}`)
      if (ordersWithoutMessage.length > 0) {
        console.log('🔍 Últimas órdenes sin mensaje:')
        ordersWithoutMessage.forEach(order => {
          console.log(`- ID ${order.id}: ${order.order_number} (${order.created_at})`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message)
  }
}

// Función principal
async function main() {
  await addWhatsAppMessageColumn()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { addWhatsAppMessageColumn }
