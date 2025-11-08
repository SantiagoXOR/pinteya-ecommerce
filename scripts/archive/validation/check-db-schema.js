#!/usr/bin/env node

// =====================================================
// SCRIPT: VERIFICAR ESQUEMA DE BASE DE DATOS
// Descripción: Verificar estructura actual de tablas en Supabase
// =====================================================

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTableSchema(tableName) {
  console.log(`\n🔍 Verificando tabla: ${tableName}`)
  console.log('='.repeat(50))

  try {
    // Intentar obtener una fila para ver la estructura
    const { data, error } = await supabase.from(tableName).select('*').limit(1)

    if (error) {
      console.log(`❌ Error: ${error.message}`)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Tabla existe y tiene datos')
      console.log('📋 Columnas encontradas:')
      Object.keys(data[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof data[0][column]}`)
      })
      console.log(`📊 Total registros: ${data.length} (muestra)`)
    } else {
      console.log('✅ Tabla existe pero está vacía')
      console.log('📋 Intentando insertar registro de prueba para ver estructura...')

      // Intentar insertar un registro mínimo para ver qué columnas acepta
      const testData = { id: 'test-id-' + Date.now() }
      const { error: insertError } = await supabase.from(tableName).insert(testData)

      if (insertError) {
        console.log(`❌ Error en inserción de prueba: ${insertError.message}`)
      }
    }
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`)
  }
}

async function checkAllTables() {
  console.log('🚀 VERIFICANDO ESQUEMA DE BASE DE DATOS')
  console.log('=====================================')

  const tables = [
    'user_profiles',
    'orders',
    'order_items',
    'products',
    'categories',
    'shipments',
    'couriers',
  ]

  for (const table of tables) {
    await checkTableSchema(table)
  }

  console.log('\n=====================================')
  console.log('✅ VERIFICACIÓN COMPLETADA')
}

async function listAllTables() {
  console.log('\n🔍 LISTANDO TODAS LAS TABLAS DISPONIBLES')
  console.log('========================================')

  try {
    // Usar una consulta SQL directa para listar tablas
    const { data, error } = await supabase.rpc('get_table_list')

    if (error) {
      console.log('❌ No se pudo obtener lista de tablas:', error.message)
      console.log('💡 Intentando método alternativo...')

      // Método alternativo: probar tablas conocidas
      const knownTables = ['products', 'categories', 'orders', 'order_items', 'user_profiles']
      for (const table of knownTables) {
        const { data: testData, error: testError } = await supabase.from(table).select('*').limit(1)

        if (!testError) {
          console.log(`✅ Tabla encontrada: ${table}`)
        }
      }
    } else {
      console.log('✅ Tablas encontradas:', data)
    }
  } catch (error) {
    console.log('❌ Error listando tablas:', error.message)
  }
}

// =====================================================
// CLI
// =====================================================

if (require.main === module) {
  const command = process.argv[2]

  switch (command) {
    case 'list':
      listAllTables()
      break
    case 'check':
    default:
      checkAllTables()
      break
  }
}

module.exports = { checkTableSchema, checkAllTables }
