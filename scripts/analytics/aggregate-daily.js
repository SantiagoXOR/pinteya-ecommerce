/**
 * Script para agregar métricas diarias
 * Ejecutar periódicamente (cron job o manualmente)
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

async function refreshDailySummary() {
  try {
    console.log('🔄 Refrescando materialized view de métricas diarias...')

    const { error } = await supabase.rpc('refresh_analytics_daily_summary')

    if (error) {
      console.error('❌ Error refrescando materialized view:', error)
      process.exit(1)
    }

    console.log('✅ Materialized view actualizada correctamente')
  } catch (error) {
    console.error('❌ Error en script:', error)
    process.exit(1)
  }
}

async function main() {
  await refreshDailySummary()
}

main().catch(console.error)
