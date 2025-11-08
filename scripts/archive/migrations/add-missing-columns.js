#!/usr/bin/env node

/**
 * Script para agregar columnas faltantes directamente
 * ==================================================
 * 
 * Agrega las columnas faltantes a la tabla orders una por una
 * 
 * Uso: node -r dotenv/config scripts/add-missing-columns.js
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

async function addMissingColumns() {
  console.log('🚀 Agregando columnas faltantes a la tabla orders...\n')

  const columnsToAdd = [
    {
      name: 'payer_info',
      type: 'JSONB',
      description: 'Información del pagador'
    },
    {
      name: 'external_reference',
      type: 'VARCHAR(255)',
      description: 'Referencia externa'
    },
    {
      name: 'whatsapp_notification_link',
      type: 'TEXT',
      description: 'Enlace de WhatsApp'
    },
    {
      name: 'whatsapp_generated_at',
      type: 'TIMESTAMP WITH TIME ZONE',
      description: 'Fecha de generación WhatsApp'
    },
    {
      name: 'total',
      type: 'DECIMAL(12,2)',
      description: 'Total de la orden'
    }
  ]

  for (const column of columnsToAdd) {
    try {
      console.log(`🔧 Agregando columna: ${column.name} (${column.type})`)
      
      // Intentar agregar la columna usando una consulta que debería fallar si ya existe
      const { error } = await supabase
        .from('orders')
        .select(`${column.name}`)
        .limit(1)

      if (error && error.message.includes('does not exist')) {
        // La columna no existe, necesitamos agregarla
        console.log(`   ⚠️  Columna ${column.name} no existe - necesita ser agregada manualmente`)
        console.log(`   📝 SQL: ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`)
      } else {
        console.log(`   ✅ Columna ${column.name} ya existe`)
      }

    } catch (error) {
      console.log(`   ⚠️  No se pudo verificar columna ${column.name}: ${error.message}`)
    }
  }

  console.log('\n📋 RESUMEN DE COLUMNAS:')
  console.log('Para agregar las columnas faltantes, ejecuta estos comandos en el SQL Editor de Supabase:')
  console.log('')
  
  columnsToAdd.forEach(column => {
    console.log(`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`)
  })

  console.log('\n🔍 Verificando estructura actual de la tabla...')
  
  try {
    // Obtener información de las órdenes para ver qué columnas están disponibles
    const { data: sampleOrder, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.log('⚠️  No se pudo obtener muestra de orden:', error.message)
    } else {
      const availableColumns = Object.keys(sampleOrder)
      console.log('✅ Columnas disponibles en la tabla orders:')
      availableColumns.forEach(col => console.log(`   - ${col}`))
      
      const missingColumns = columnsToAdd.filter(col => !availableColumns.includes(col.name))
      if (missingColumns.length > 0) {
        console.log('\n❌ Columnas faltantes:')
        missingColumns.forEach(col => console.log(`   - ${col.name}`))
      } else {
        console.log('\n🎉 Todas las columnas están presentes!')
      }
    }
  } catch (error) {
    console.log('⚠️  Error al verificar estructura:', error.message)
  }
}

// Función principal
async function main() {
  await addMissingColumns()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { addMissingColumns }
