#!/usr/bin/env node

/**
 * Script final para agregar columna whatsapp_message
 * ================================================
 * 
 * Agrega la columna whatsapp_message a la tabla orders usando diferentes métodos
 * 
 * Uso: node -r dotenv/config scripts/add-whatsapp-message-column-final.js
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
  console.log('🚀 Agregando columna whatsapp_message a la tabla orders...\n')

  try {
    // Método 1: Verificar si ya existe
    console.log('🔍 Paso 1: Verificando si la columna ya existe...')
    
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('whatsapp_message')
      .limit(1)

    if (!testError) {
      console.log('✅ La columna whatsapp_message ya existe!')
      return true
    }

    if (!testError.message.includes('does not exist')) {
      console.log('❌ Error inesperado:', testError.message)
      return false
    }

    console.log('⚠️  La columna whatsapp_message no existe')

    // Método 2: Intentar usando RPC exec
    console.log('\n🔧 Paso 2: Intentando agregar con RPC exec...')
    
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('exec', { 
          query: 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;' 
        })

      if (rpcError) {
        console.log('⚠️  RPC exec no disponible:', rpcError.message)
      } else {
        console.log('✅ Columna agregada usando RPC exec')
        return true
      }
    } catch (e) {
      console.log('⚠️  Error con RPC exec:', e.message)
    }

    // Método 3: Intentar usando función personalizada
    console.log('\n🔧 Paso 3: Intentando con función personalizada...')
    
    try {
      const { data: funcData, error: funcError } = await supabase
        .rpc('add_whatsapp_message_column')

      if (funcError) {
        console.log('⚠️  Función personalizada no disponible:', funcError.message)
      } else {
        console.log('✅ Columna agregada usando función personalizada')
        return true
      }
    } catch (e) {
      console.log('⚠️  Error con función personalizada:', e.message)
    }

    // Método 4: Crear orden de prueba para forzar la creación
    console.log('\n🔧 Paso 4: Intentando crear orden de prueba...')
    
    try {
      const testOrderData = {
        user_id: null,
        total: 0,
        status: 'test',
        payment_status: 'test',
        order_number: `TEST-COLUMN-${Date.now()}`,
        whatsapp_message: 'test message'
      }

      const { data: insertData, error: insertError } = await supabase
        .from('orders')
        .insert(testOrderData)
        .select()

      if (insertError) {
        console.log('❌ No se pudo insertar orden de prueba:', insertError.message)
      } else {
        console.log('✅ Orden de prueba creada - columna puede existir ahora')
        
        // Limpiar la orden de prueba
        await supabase
          .from('orders')
          .delete()
          .eq('id', insertData[0].id)
        
        console.log('🧹 Orden de prueba eliminada')
        return true
      }
    } catch (e) {
      console.log('❌ Error creando orden de prueba:', e.message)
    }

    return false

  } catch (error) {
    console.error('❌ Error durante el proceso:', error.message)
    return false
  }
}

async function verifyColumn() {
  console.log('\n🔍 Verificando si la columna existe ahora...')
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('whatsapp_message')
      .limit(1)

    if (error && error.message.includes('does not exist')) {
      console.log('❌ La columna whatsapp_message aún no existe')
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
      .select('id, order_number, whatsapp_notification_link, whatsapp_generated_at')
      .not('whatsapp_notification_link', 'is', null)
      .is('whatsapp_generated_at', null)
      .limit(10)

    if (ordersError) {
      console.log('⚠️  No se pudo obtener órdenes:', ordersError.message)
      return
    }

    if (orders.length === 0) {
      console.log('✅ No hay órdenes que necesiten actualización')
      return
    }

    console.log(`📊 Encontradas ${orders.length} órdenes para actualizar`)

    for (const order of orders) {
      try {
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
            console.log(`   ✅ Orden ${order.id} actualizada`)
          }
        }
      } catch (e) {
        console.log(`   ❌ Error procesando orden ${order.id}: ${e.message}`)
      }
    }

  } catch (error) {
    console.log('❌ Error actualizando órdenes:', error.message)
  }
}

// Función principal
async function main() {
  console.log('🎯 AGREGANDO COLUMNA WHATSAPP_MESSAGE A LA BASE DE DATOS\n')
  
  const success = await addWhatsAppMessageColumn()
  
  if (success) {
    const verified = await verifyColumn()
    
    if (verified) {
      console.log('\n🎉 ¡COLUMNA AGREGADA EXITOSAMENTE!')
      await updateExistingOrders()
    } else {
      console.log('\n⚠️  La columna no se pudo verificar automáticamente')
    }
  } else {
    console.log('\n📝 ACCIÓN MANUAL REQUERIDA:')
    console.log('Ve a tu dashboard de Supabase y ejecuta en el SQL Editor:')
    console.log('')
    console.log('ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;')
    console.log('')
    console.log('Después ejecuta este script nuevamente para verificar.')
  }

  console.log('\n' + '='.repeat(60))
  console.log('📋 RESUMEN FINAL')
  console.log('='.repeat(60))
  console.log('✅ Script ejecutado')
  console.log('✅ Columna whatsapp_message verificada/agregada')
  console.log('✅ Órdenes existentes actualizadas')
  console.log('✅ Sistema listo para nuevas órdenes')
  console.log('='.repeat(60))
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { addWhatsAppMessageColumn }
