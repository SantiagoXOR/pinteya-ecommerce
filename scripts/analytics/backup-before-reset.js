/**
 * Script de backup de datos de analytics antes de reiniciar el sistema
 * Ejecutar antes de limpiar las tablas
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno SUPABASE no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function backupTable(tableName, outputFile) {
  try {
    console.log(`📦 Haciendo backup de ${tableName}...`)
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(`❌ Error en ${tableName}:`, error)
      return false
    }

    const backupDir = path.join(__dirname, '../../database/backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const filePath = path.join(backupDir, outputFile)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
    
    console.log(`✅ Backup de ${tableName} completado: ${data.length} registros guardados en ${filePath}`)
    return true
  } catch (error) {
    console.error(`❌ Error haciendo backup de ${tableName}:`, error)
    return false
  }
}

async function generateSQLBackup() {
  try {
    console.log('📦 Generando backup SQL...')
    
    const tables = [
      'analytics_events',
      'analytics_events_optimized',
      'analytics_metrics_daily',
      'user_interactions'
    ]

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const backupDir = path.join(__dirname, '../../database/backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const sqlFile = path.join(backupDir, `analytics_backup_${timestamp}.sql`)
    let sqlContent = `-- Backup de Analytics - ${new Date().toISOString()}\n`
    sqlContent += `-- Generado antes de reiniciar el sistema de analytics\n\n`

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.warn(`⚠️  No se pudo hacer backup de ${table}:`, error.message)
        continue
      }

      if (data && data.length > 0) {
        sqlContent += `-- Tabla: ${table} (${data.length} registros)\n`
        sqlContent += `-- INSERT INTO ${table} ...\n`
        sqlContent += `-- (Datos exportados en formato JSON en archivo separado)\n\n`
      } else {
        sqlContent += `-- Tabla: ${table} (vacía)\n\n`
      }
    }

    fs.writeFileSync(sqlFile, sqlContent, 'utf8')
    console.log(`✅ Backup SQL generado: ${sqlFile}`)
    return true
  } catch (error) {
    console.error('❌ Error generando backup SQL:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando backup de datos de analytics...\n')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]

  // Backup en formato JSON
  const results = await Promise.all([
    backupTable('analytics_events', `analytics_events_backup_${timestamp}.json`),
    backupTable('analytics_events_optimized', `analytics_events_optimized_backup_${timestamp}.json`),
    backupTable('analytics_metrics_daily', `analytics_metrics_daily_backup_${timestamp}.json`),
    backupTable('user_interactions', `user_interactions_backup_${timestamp}.json`)
  ])

  // Backup SQL
  await generateSQLBackup()

  const successCount = results.filter(r => r).length
  console.log(`\n✅ Backup completado: ${successCount}/${results.length} tablas respaldadas`)
  console.log(`📁 Archivos guardados en: database/backups/`)
}

main().catch(console.error)
