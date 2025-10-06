#!/usr/bin/env node

/**
 * CONFIGURACIÓN DE CRON JOBS PARA ANALYTICS - PINTEYA E-COMMERCE
 * Configura limpieza automática y mantenimiento de la base de datos
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Configuraciones de cron jobs
 */
const CRON_JOBS = [
  {
    name: 'cleanup-analytics-weekly',
    schedule: '0 2 * * 0', // Domingos a las 2 AM
    command: `SELECT cleanup_old_analytics_events(30);`,
    description: 'Limpieza semanal de eventos de analytics mayores a 30 días',
  },
  {
    name: 'vacuum-analytics-daily',
    schedule: '0 3 * * *', // Todos los días a las 3 AM
    command: `VACUUM ANALYZE analytics_events_optimized;`,
    description: 'Mantenimiento diario de la tabla de analytics',
  },
  {
    name: 'update-analytics-stats',
    schedule: '0 1 * * *', // Todos los días a la 1 AM
    command: `REFRESH MATERIALIZED VIEW IF EXISTS analytics_daily_stats;`,
    description: 'Actualización de estadísticas diarias de analytics',
  },
]

/**
 * Verificar si pg_cron está disponible
 */
async function checkPgCronAvailability() {
  try {
    const { data, error } = await supabase.rpc('pg_cron_version')

    if (error) {
      console.log('ℹ️  pg_cron no está disponible en este plan de Supabase')
      console.log('   Configurando alternativas...')
      return false
    }

    console.log('✅ pg_cron disponible:', data)
    return true
  } catch (error) {
    console.log('ℹ️  pg_cron no está disponible, usando alternativas')
    return false
  }
}

/**
 * Configurar cron jobs usando pg_cron
 */
async function setupPgCronJobs() {
  console.log('🔧 Configurando cron jobs con pg_cron...')

  for (const job of CRON_JOBS) {
    try {
      // Eliminar job existente si existe
      await supabase.rpc('cron.unschedule', { job_name: job.name })

      // Crear nuevo job
      const { data, error } = await supabase.rpc('cron.schedule', {
        job_name: job.name,
        schedule: job.schedule,
        command: job.command,
      })

      if (error) {
        console.error(`❌ Error configurando ${job.name}:`, error.message)
      } else {
        console.log(`✅ Configurado: ${job.name} - ${job.description}`)
      }
    } catch (error) {
      console.error(`❌ Error con ${job.name}:`, error.message)
    }
  }
}

/**
 * Configurar alternativas sin pg_cron
 */
async function setupAlternativeScheduling() {
  console.log('🔧 Configurando sistema alternativo de limpieza...')

  // Crear función que se puede llamar desde la aplicación
  const setupFunction = `
    CREATE OR REPLACE FUNCTION schedule_analytics_maintenance()
    RETURNS TABLE (
      task TEXT,
      status TEXT,
      details TEXT
    ) AS $$
    DECLARE
      cleanup_result RECORD;
      vacuum_result TEXT;
    BEGIN
      -- Limpieza de eventos antiguos
      BEGIN
        SELECT * INTO cleanup_result FROM cleanup_old_analytics_events(30);
        RETURN QUERY SELECT 
          'cleanup'::TEXT, 
          'success'::TEXT, 
          format('Deleted %s events, freed %s', cleanup_result.deleted_count, cleanup_result.size_freed)::TEXT;
      EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'cleanup'::TEXT, 'error'::TEXT, SQLERRM::TEXT;
      END;
      
      -- Vacuum de la tabla
      BEGIN
        EXECUTE 'VACUUM ANALYZE analytics_events_optimized';
        RETURN QUERY SELECT 'vacuum'::TEXT, 'success'::TEXT, 'Table maintenance completed'::TEXT;
      EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'vacuum'::TEXT, 'error'::TEXT, SQLERRM::TEXT;
      END;
      
      RETURN;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: setupFunction })

    if (error) {
      console.error('❌ Error configurando función de mantenimiento:', error.message)
    } else {
      console.log('✅ Función de mantenimiento configurada')
      console.log('   Llama a schedule_analytics_maintenance() desde tu aplicación')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

/**
 * Crear vista materializada para estadísticas
 */
async function createMaterializedViews() {
  console.log('📊 Creando vistas materializadas para estadísticas...')

  const createStatsView = `
    CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_stats AS
    SELECT 
      DATE(TO_TIMESTAMP(created_at)) as date,
      COUNT(*) as total_events,
      COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
      COUNT(DISTINCT session_hash) as unique_sessions,
      COUNT(*) FILTER (WHERE event_type = 1) as page_views,
      COUNT(*) FILTER (WHERE event_type = 4) as product_views,
      COUNT(*) FILTER (WHERE event_type = 5) as cart_additions,
      COUNT(*) FILTER (WHERE event_type = 8) as purchases
    FROM analytics_events_optimized
    WHERE created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '90 days')::INTEGER
    GROUP BY DATE(TO_TIMESTAMP(created_at))
    ORDER BY date DESC;
    
    CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_daily_stats_date 
    ON analytics_daily_stats(date);
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createStatsView })

    if (error) {
      console.error('❌ Error creando vista materializada:', error.message)
    } else {
      console.log('✅ Vista materializada de estadísticas creada')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 CONFIGURACIÓN DE MANTENIMIENTO AUTOMÁTICO DE ANALYTICS')
  console.log('========================================================')

  try {
    // Verificar disponibilidad de pg_cron
    const hasPgCron = await checkPgCronAvailability()

    if (hasPgCron) {
      await setupPgCronJobs()
    } else {
      await setupAlternativeScheduling()
    }

    // Crear vistas materializadas
    await createMaterializedViews()

    console.log('\n✅ CONFIGURACIÓN COMPLETADA')
    console.log('\n📋 PRÓXIMOS PASOS:')

    if (hasPgCron) {
      console.log('1. Los cron jobs se ejecutarán automáticamente')
      console.log('2. Monitorea los logs en Supabase Dashboard')
    } else {
      console.log('1. Configura un cron job externo para llamar a la API de limpieza')
      console.log('2. Ejemplo: curl -X POST "tu-app.com/api/admin/analytics/cleanup"')
      console.log('3. O llama a schedule_analytics_maintenance() desde tu aplicación')
    }

    console.log('4. Revisa las estadísticas en /api/admin/analytics/cleanup')
  } catch (error) {
    console.error('❌ Error en configuración:', error.message)
    process.exit(1)
  }
}

// Ejecutar configuración
if (require.main === module) {
  main()
}

module.exports = { main, CRON_JOBS }
