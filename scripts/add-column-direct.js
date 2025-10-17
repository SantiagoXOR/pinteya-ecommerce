#!/usr/bin/env node

/**
 * Script para agregar columna whatsapp_message directamente
 * ========================================================
 * 
 * Intenta agregar la columna usando diferentes métodos
 * 
 * Uso: node -r dotenv/config scripts/add-column-direct.js
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

async function addColumnDirect() {
  console.log('🚀 Intentando agregar columna whatsapp_message directamente...\n')

  try {
    // Método 1: Intentar usando RPC
    console.log('🔧 Método 1: Usando RPC exec...')
    
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('exec', { 
        query: 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;' 
      })

    if (rpcError) {
      console.log('⚠️  RPC exec no disponible:', rpcError.message)
    } else {
      console.log('✅ Columna agregada usando RPC')
      return true
    }

    // Método 2: Intentar usando una función personalizada
    console.log('\n🔧 Método 2: Usando función personalizada...')
    
    const { data: funcData, error: funcError } = await supabase
      .rpc('add_whatsapp_message_column')

    if (funcError) {
      console.log('⚠️  Función personalizada no disponible:', funcError.message)
    } else {
      console.log('✅ Columna agregada usando función personalizada')
      return true
    }

    // Método 3: Verificar si ya existe
    console.log('\n🔧 Método 3: Verificando si ya existe...')
    
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

    console.log('❌ La columna whatsapp_message no existe y no se pudo agregar automáticamente')
    
    // Método 4: Crear una orden de prueba para forzar la creación
    console.log('\n🔧 Método 4: Intentando crear orden de prueba...')
    
    const testOrderData = {
      user_id: null,
      total: 0,
      status: 'test',
      payment_status: 'test',
      order_number: `TEST-${Date.now()}`,
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

// Función principal
async function main() {
  const success = await addColumnDirect()
  
  if (success) {
    await verifyColumn()
  } else {
    console.log('\n📝 ACCIÓN MANUAL REQUERIDA:')
    console.log('Ve a tu dashboard de Supabase y ejecuta:')
    console.log('')
    console.log('ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;')
    console.log('')
    console.log('Luego ejecuta: node -r dotenv/config scripts/fix-whatsapp-complete.js')
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { addColumnDirect }
