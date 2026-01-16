/**
 * Script para archivar eventos antiguos de analytics
 * Ejecutar mensualmente (cron job o manualmente)
 * Fallback local si Supabase Edge Functions no están disponibles
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno SUPABASE no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function archiveOldEvents(daysOld = 90, batchSize = 10000) {
  try {
    console.log(`🔄 Archivando eventos más antiguos de ${daysOld} días...`)

    const { data, error } = await supabase.rpc('archive_old_analytics_events', {
      p_days_old: daysOld,
      p_batch_size: batchSize,
    })

    if (error) {
      console.error('❌ Error archivando eventos:', error)
      process.exit(1)
    }

    if (data && data.length > 0) {
      const result = data[0]
      console.log(`✅ Eventos archivados: ${result.archived_count}`)
      console.log(`📅 Rango: ${result.date_range_start} - ${result.date_range_end}`)
    } else {
      console.log('ℹ️  No hay eventos antiguos para archivar')
    }
  } catch (error) {
    console.error('❌ Error en script:', error)
    process.exit(1)
  }
}

async function main() {
  const daysOld = parseInt(process.argv[2]) || 90
  const batchSize = parseInt(process.argv[3]) || 10000

  console.log(`🚀 Iniciando archivado de eventos...`)
  console.log(`📊 Parámetros: daysOld=${daysOld}, batchSize=${batchSize}\n`)

  await archiveOldEvents(daysOld, batchSize)
}

main().catch(console.error)
