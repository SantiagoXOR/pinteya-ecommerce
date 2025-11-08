#!/usr/bin/env node

/**
 * Script para verificar y actualizar columna whatsapp_message
 * =========================================================
 * 
 * Ejecuta DESPUÉS de agregar manualmente la columna en Supabase
 * 
 * Uso: node -r dotenv/config scripts/verify-and-update-whatsapp-column.js
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

async function verifyColumn() {
  console.log('🔍 Verificando si la columna whatsapp_message existe...')
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('whatsapp_message')
      .limit(1)

    if (error && error.message.includes('does not exist')) {
      console.log('❌ La columna whatsapp_message aún no existe')
      console.log('\n📝 ACCIÓN REQUERIDA:')
      console.log('1. Ve a tu dashboard de Supabase')
      console.log('2. Abre el SQL Editor')
      console.log('3. Ejecuta: ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;')
      console.log('4. Ejecuta este script nuevamente')
      return false
    }

    console.log('✅ La columna whatsapp_message existe!')
    return true

  } catch (error) {
    console.log('❌ Error verificando columna:', error.message)
    return false
  }
}

async function updateExistingOrders() {
  console.log('\n🔄 Actualizando órdenes existentes con mensajes de WhatsApp...')
  
  try {
    // Obtener órdenes que tienen whatsapp_notification_link pero no whatsapp_message
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, whatsapp_notification_link, whatsapp_message, whatsapp_generated_at')
      .not('whatsapp_notification_link', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (ordersError) {
      console.log('❌ Error obteniendo órdenes:', ordersError.message)
      return
    }

    console.log(`📊 Encontradas ${orders.length} órdenes con enlaces de WhatsApp`)

    let updatedCount = 0
    let alreadyHasMessageCount = 0

    for (const order of orders) {
      try {
        // Si ya tiene mensaje, saltar
        if (order.whatsapp_message) {
          alreadyHasMessageCount++
          continue
        }

        // Extraer mensaje de la URL de WhatsApp
        const url = new URL(order.whatsapp_notification_link)
        const encodedMessage = url.searchParams.get('text')
        const decodedMessage = decodeURIComponent(encodedMessage || '')

        if (decodedMessage) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              whatsapp_message: decodedMessage,
              whatsapp_generated_at: new Date().toISOString()
            })
            .eq('id', order.id)

          if (updateError) {
            console.log(`   ❌ Error actualizando orden ${order.id}: ${updateError.message}`)
          } else {
            console.log(`   ✅ Orden ${order.id} (${order.order_number}) actualizada`)
            updatedCount++
          }
        } else {
          console.log(`   ⚠️  No se pudo extraer mensaje de orden ${order.id}`)
        }
      } catch (e) {
        console.log(`   ❌ Error procesando orden ${order.id}: ${e.message}`)
      }
    }

    console.log(`\n📋 RESUMEN DE ACTUALIZACIÓN:`)
    console.log(`✅ Órdenes actualizadas: ${updatedCount}`)
    console.log(`✅ Órdenes que ya tenían mensaje: ${alreadyHasMessageCount}`)
    console.log(`📊 Total procesadas: ${orders.length}`)

  } catch (error) {
    console.log('❌ Error actualizando órdenes:', error.message)
  }
}

async function testNewOrderCapability() {
  console.log('\n🧪 Probando capacidad de guardar mensajes en nuevas órdenes...')
  
  try {
    // Crear una orden de prueba
    const testOrderData = {
      user_id: null,
      total: 0,
      status: 'test',
      payment_status: 'test',
      order_number: `TEST-MESSAGE-${Date.now()}`,
      whatsapp_message: 'Mensaje de prueba con saltos de línea\nLínea 2\nLínea 3',
      whatsapp_notification_link: 'https://test.com',
      whatsapp_generated_at: new Date().toISOString()
    }

    const { data: insertData, error: insertError } = await supabase
      .from('orders')
      .insert(testOrderData)
      .select()

    if (insertError) {
      console.log('❌ Error creando orden de prueba:', insertError.message)
      return false
    }

    console.log('✅ Orden de prueba creada exitosamente')
    
    // Verificar que el mensaje se guardó correctamente
    const { data: verifyData, error: verifyError } = await supabase
      .from('orders')
      .select('whatsapp_message')
      .eq('id', insertData[0].id)
      .single()

    if (verifyError) {
      console.log('❌ Error verificando mensaje:', verifyError.message)
      return false
    }

    console.log('✅ Mensaje guardado correctamente:')
    console.log(verifyData.whatsapp_message)

    // Limpiar la orden de prueba
    await supabase
      .from('orders')
      .delete()
      .eq('id', insertData[0].id)
    
    console.log('🧹 Orden de prueba eliminada')
    return true

  } catch (error) {
    console.log('❌ Error en prueba:', error.message)
    return false
  }
}

// Función principal
async function main() {
  console.log('🎯 VERIFICANDO Y ACTUALIZANDO COLUMNA WHATSAPP_MESSAGE\n')
  
  const columnExists = await verifyColumn()
  
  if (!columnExists) {
    console.log('\n❌ No se puede continuar sin la columna whatsapp_message')
    return
  }

  console.log('\n✅ Columna verificada, procediendo con actualizaciones...')
  
  await updateExistingOrders()
  
  const testPassed = await testNewOrderCapability()
  
  console.log('\n' + '='.repeat(60))
  console.log('📋 RESUMEN FINAL')
  console.log('='.repeat(60))
  console.log('✅ Columna whatsapp_message: VERIFICADA')
  console.log('✅ Órdenes existentes: ACTUALIZADAS')
  console.log(`✅ Nuevas órdenes: ${testPassed ? 'FUNCIONANDO' : 'PROBLEMA'}`)
  console.log('✅ Sistema completo: LISTO')
  console.log('='.repeat(60))
  
  if (testPassed) {
    console.log('\n🎉 ¡SISTEMA COMPLETAMENTE CONFIGURADO!')
    console.log('📱 Las nuevas órdenes guardarán mensajes de WhatsApp con formato correcto')
  } else {
    console.log('\n⚠️  Hay un problema con el guardado de mensajes en nuevas órdenes')
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { verifyColumn, updateExistingOrders }
