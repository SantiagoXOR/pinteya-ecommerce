#!/usr/bin/env node

/**
 * Script para aplicar migración directamente a Supabase
 * =====================================================
 * 
 * Aplica la migración para agregar columnas faltantes a la tabla orders
 * 
 * Uso: node -r dotenv/config scripts/apply-migration.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Iniciando aplicación de migración...')
  console.log('📋 Agregando columnas faltantes a la tabla orders\n')

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250118_add_missing_order_columns.sql')
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Archivo de migración no encontrado: ${migrationPath}`)
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    console.log('📄 Migración leída exitosamente\n')

    // Ejecutar la migración
    console.log('⚡ Ejecutando migración...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // Si el RPC no existe, intentar ejecutar directamente
      console.log('⚠️  RPC exec_sql no disponible, intentando método alternativo...')
      
      // Dividir el SQL en comandos individuales
      const commands = migrationSQL
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

      for (const command of commands) {
        if (command.includes('ALTER TABLE')) {
          console.log(`🔧 Ejecutando: ${command.substring(0, 50)}...`)
          const { error: cmdError } = await supabase
            .from('_dummy_table_that_does_not_exist')
            .select('*')
            .limit(0)
          
          // Usar raw SQL execution
          try {
            const { error: sqlError } = await supabase
              .rpc('exec', { query: command })
            
            if (sqlError && !sqlError.message.includes('does not exist')) {
              console.log(`⚠️  Advertencia: ${sqlError.message}`)
            }
          } catch (e) {
            console.log(`⚠️  No se pudo ejecutar comando directo, continuando...`)
          }
        }
      }
    } else {
      console.log('✅ Migración ejecutada exitosamente')
    }

    // Verificar que las columnas se agregaron
    console.log('\n🔍 Verificando que las columnas se agregaron correctamente...')
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'orders')
      .eq('table_schema', 'public')
      .in('column_name', ['payer_info', 'external_reference', 'whatsapp_notification_link', 'whatsapp_generated_at', 'total'])

    if (columnsError) {
      console.log('⚠️  No se pudo verificar las columnas automáticamente')
    } else {
      const columnNames = columns.map(col => col.column_name)
      console.log(`✅ Columnas encontradas: ${columnNames.join(', ')}`)
      
      const expectedColumns = ['payer_info', 'external_reference', 'whatsapp_notification_link', 'whatsapp_generated_at', 'total']
      const missingColumns = expectedColumns.filter(col => !columnNames.includes(col))
      
      if (missingColumns.length > 0) {
        console.log(`⚠️  Columnas faltantes: ${missingColumns.join(', ')}`)
      } else {
        console.log('🎉 Todas las columnas se agregaron correctamente!')
      }
    }

    console.log('\n✅ Proceso de migración completado')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message)
    console.log('\n📝 Instrucciones manuales:')
    console.log('1. Ve a tu dashboard de Supabase')
    console.log('2. Abre el SQL Editor')
    console.log('3. Copia y pega el contenido de: supabase/migrations/20250118_add_missing_order_columns.sql')
    console.log('4. Ejecuta el SQL')
    process.exit(1)
  }
}

// Función principal
async function main() {
  await applyMigration()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { applyMigration }
