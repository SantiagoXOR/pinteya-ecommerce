// =====================================================
// SCRIPT: CREAR TABLAS DE LOGÍSTICA
// Descripción: Script para crear tablas de drivers y rutas
// =====================================================

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.error(
    'Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createLogisticsTables() {
  console.log('🚀 Iniciando creación de tablas de logística...')

  try {
    // Insertar drivers de prueba directamente
    console.log('📦 Insertando drivers de prueba...')

    const driversData = [
      {
        name: 'Carlos Rodríguez',
        phone: '+54 11 1234-5678',
        email: 'carlos@pinteya.com',
        vehicle_type: 'Camioneta',
        license_plate: 'ABC123',
        status: 'available',
        max_capacity: 30,
      },
      {
        name: 'María González',
        phone: '+54 11 2345-6789',
        email: 'maria@pinteya.com',
        vehicle_type: 'Furgón',
        license_plate: 'DEF456',
        status: 'available',
        max_capacity: 50,
      },
      {
        name: 'Juan Pérez',
        phone: '+54 11 3456-7890',
        email: 'juan@pinteya.com',
        vehicle_type: 'Motocicleta',
        license_plate: 'GHI789',
        status: 'available',
        max_capacity: 10,
      },
      {
        name: 'Ana Martínez',
        phone: '+54 11 4567-8901',
        email: 'ana@pinteya.com',
        vehicle_type: 'Camión',
        license_plate: 'JKL012',
        status: 'available',
        max_capacity: 100,
      },
      {
        name: 'Luis Fernández',
        phone: '+54 11 5678-9012',
        email: 'luis@pinteya.com',
        vehicle_type: 'Camioneta',
        license_plate: 'MNO345',
        status: 'busy',
        max_capacity: 30,
      },
    ]

    // Verificar si las tablas existen
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['drivers', 'optimized_routes'])

    if (tablesError) {
      console.log('⚠️ No se pudo verificar las tablas existentes. Continuando...')
    }

    const existingTables = tables ? tables.map(t => t.table_name) : []
    console.log('📋 Tablas existentes:', existingTables)

    if (!existingTables.includes('drivers')) {
      console.log('⚠️ Tabla drivers no existe. Necesitas crearla manualmente en Supabase.')
      console.log('📝 SQL para crear tabla drivers:')
      console.log(`
CREATE TABLE drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  vehicle_type VARCHAR(100) NOT NULL,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  current_location JSONB,
  max_capacity INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `)
    } else {
      console.log('✅ Tabla drivers ya existe')

      // Insertar drivers de prueba
      for (const driver of driversData) {
        const { error } = await supabase
          .from('drivers')
          .upsert(driver, { onConflict: 'license_plate' })

        if (error) {
          console.log(`⚠️ Error insertando driver ${driver.name}:`, error.message)
        } else {
          console.log(`✅ Driver ${driver.name} insertado/actualizado`)
        }
      }
    }

    if (!existingTables.includes('optimized_routes')) {
      console.log('⚠️ Tabla optimized_routes no existe. Necesitas crearla manualmente en Supabase.')
      console.log('📝 SQL para crear tabla optimized_routes:')
      console.log(`
CREATE TABLE optimized_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  shipments JSONB NOT NULL DEFAULT '[]',
  total_distance DECIMAL(10,2) DEFAULT 0,
  estimated_time INTEGER DEFAULT 0,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  start_location JSONB,
  waypoints JSONB NOT NULL DEFAULT '[]',
  optimization_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `)
    } else {
      console.log('✅ Tabla optimized_routes ya existe')
    }

    console.log('🎉 ¡Proceso completado!')
    console.log('')
    console.log('📊 Resumen:')
    console.log('  📋 Verificación de tablas completada')
    console.log('  👥 Drivers de prueba procesados')
    console.log('')
    console.log('🔧 Si las tablas no existen, cópialas y pégalas en el SQL Editor de Supabase')
  } catch (error) {
    console.error('❌ Error durante el proceso:', error)
    process.exit(1)
  }
}

// Ejecutar migración
createLogisticsTables()
