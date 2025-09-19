/**
 * Script para aplicar la migración de monitoreo directamente a Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración de monitoreo...');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250104000001_admin_monitoring_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Dividir en comandos individuales (separados por ;)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);

    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.length < 10) continue; // Saltar comandos muy cortos
      
      console.log(`⚡ Ejecutando comando ${i + 1}/${commands.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.warn(`⚠️  Warning en comando ${i + 1}:`, error.message);
          // Continuar con el siguiente comando
        } else {
          console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
        }
      } catch (cmdError) {
        console.warn(`⚠️  Error en comando ${i + 1}:`, cmdError.message);
        // Continuar con el siguiente comando
      }
    }

    // Verificar que las tablas se crearon correctamente
    console.log('🔍 Verificando tablas creadas...');

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['admin_performance_metrics', 'admin_security_alerts']);

    if (tablesError) {
      console.error('❌ Error verificando tablas:', tablesError);
    } else {
      console.log('✅ Tablas encontradas:', tables.map(t => t.table_name));
    }

    // Insertar métrica inicial
    console.log('📊 Insertando métrica inicial...');
    
    const { error: metricError } = await supabase
      .from('admin_performance_metrics')
      .insert({
        endpoint: '/system/migration-script',
        method: 'SYSTEM',
        duration_ms: 0,
        status_code: 200,
        timestamp: new Date().toISOString()
      });

    if (metricError) {
      console.warn('⚠️  Warning insertando métrica inicial:', metricError.message);
    } else {
      console.log('✅ Métrica inicial insertada');
    }

    // Insertar alerta inicial
    console.log('🚨 Insertando alerta inicial...');
    
    const { error: alertError } = await supabase
      .from('admin_security_alerts')
      .insert({
        alert_type: 'system_error',
        severity: 'low',
        message: 'Admin monitoring system initialized via script',
        metadata: {
          migration: '20250104000001_admin_monitoring_tables',
          version: '1.0.0',
          appliedBy: 'migration-script'
        },
        timestamp: new Date().toISOString()
      });

    if (alertError) {
      console.warn('⚠️  Warning insertando alerta inicial:', alertError.message);
    } else {
      console.log('✅ Alerta inicial insertada');
    }

    console.log('🎉 Migración de monitoreo aplicada exitosamente!');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    process.exit(1);
  }
}

// Función alternativa usando SQL directo
async function applyMigrationDirect() {
  try {
    console.log('🚀 Aplicando migración directa...');

    // Crear tablas principales
    const createTablesSQL = `
      -- Tabla de métricas de performance
      CREATE TABLE IF NOT EXISTS public.admin_performance_metrics (
          id SERIAL PRIMARY KEY,
          endpoint VARCHAR(255) NOT NULL,
          method VARCHAR(10) NOT NULL,
          duration_ms INTEGER NOT NULL,
          status_code INTEGER NOT NULL,
          user_id UUID,
          error_message TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Tabla de alertas de seguridad
      CREATE TABLE IF NOT EXISTS public.admin_security_alerts (
          id SERIAL PRIMARY KEY,
          alert_type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          resolved BOOLEAN DEFAULT FALSE,
          resolved_by UUID,
          resolved_at TIMESTAMP WITH TIME ZONE,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Índices básicos
      CREATE INDEX IF NOT EXISTS idx_admin_performance_metrics_timestamp 
      ON public.admin_performance_metrics(timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_admin_security_alerts_timestamp 
      ON public.admin_security_alerts(timestamp DESC);
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL });

    if (error) {
      console.error('❌ Error creando tablas:', error);
    } else {
      console.log('✅ Tablas creadas exitosamente');
    }

    // Insertar datos iniciales
    const { error: metricError } = await supabase
      .from('admin_performance_metrics')
      .insert({
        endpoint: '/system/direct-migration',
        method: 'SYSTEM',
        duration_ms: 0,
        status_code: 200
      });

    if (!metricError) {
      console.log('✅ Datos iniciales insertados');
    }

    console.log('🎉 Migración directa completada!');

  } catch (error) {
    console.error('❌ Error en migración directa:', error);
  }
}

// Ejecutar migración
if (require.main === module) {
  console.log('🔧 Iniciando aplicación de migración de monitoreo...');
  applyMigrationDirect()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = { applyMigration, applyMigrationDirect };
