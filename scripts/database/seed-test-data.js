#!/usr/bin/env node

// =====================================================
// SCRIPT: SEED TEST DATA
// Descripción: Crear datos de prueba para el panel administrativo
// Incluye: Órdenes, productos, usuarios, envíos
// =====================================================

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

// =====================================================
// CONFIGURACIÓN
// =====================================================

console.log('🔧 Configurando Supabase...')
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada' : 'FALTANTE')
console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'FALTANTE')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// =====================================================
// DATOS DE PRUEBA
// =====================================================

const testUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    clerk_user_id: 'user_test_001',
    email: 'juan.perez@test.com',
    first_name: 'Juan',
    last_name: 'Pérez',
    phone: '+54 11 1234-5678',
    role_id: 'customer',
    is_active: true,
    created_at: new Date('2024-01-15').toISOString(),
    updated_at: new Date('2024-01-15').toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    clerk_user_id: 'user_test_002',
    email: 'maria.garcia@test.com',
    first_name: 'María',
    last_name: 'García',
    phone: '+54 11 2345-6789',
    role_id: 'customer',
    is_active: true,
    created_at: new Date('2024-02-20').toISOString(),
    updated_at: new Date('2024-02-20').toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    clerk_user_id: 'user_test_003',
    email: 'carlos.lopez@test.com',
    first_name: 'Carlos',
    last_name: 'López',
    phone: '+54 11 3456-7890',
    role_id: 'customer',
    is_active: true,
    created_at: new Date('2024-03-10').toISOString(),
    updated_at: new Date('2024-03-10').toISOString(),
  },
]

const testOrders = [
  {
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    status: 'confirmed',
    total: 15750.0,
    payment_id: 'mp_test_001',
    shipping_address: {
      street_name: 'Av. Corrientes',
      street_number: '1234',
      city_name: 'Buenos Aires',
      state_name: 'CABA',
      zip_code: '1043',
      country: 'Argentina',
    },
    external_reference: 'ORD-2024-001',
    created_at: new Date('2024-08-15').toISOString(),
    updated_at: new Date('2024-08-15').toISOString(),
  },
  {
    user_id: '550e8400-e29b-41d4-a716-446655440002',
    status: 'processing',
    total: 8900.0,
    payment_id: 'mp_test_002',
    shipping_address: {
      street_name: 'Calle Florida',
      street_number: '567',
      city_name: 'La Plata',
      state_name: 'Buenos Aires',
      zip_code: '1900',
      country: 'Argentina',
    },
    external_reference: 'ORD-2024-002',
    created_at: new Date('2024-08-20').toISOString(),
    updated_at: new Date('2024-08-22').toISOString(),
  },
  {
    user_id: '550e8400-e29b-41d4-a716-446655440003',
    status: 'pending',
    total: 12300.0,
    payment_id: 'mp_test_003',
    shipping_address: {
      street_name: 'Av. Santa Fe',
      street_number: '890',
      city_name: 'Córdoba',
      state_name: 'Córdoba',
      zip_code: '5000',
      country: 'Argentina',
    },
    external_reference: 'ORD-2024-003',
    created_at: new Date('2024-09-01').toISOString(),
    updated_at: new Date('2024-09-01').toISOString(),
  },
  {
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    status: 'shipped',
    total: 22100.0,
    payment_id: 'mp_test_004',
    shipping_address: {
      street_name: 'Av. Rivadavia',
      street_number: '1500',
      city_name: 'Buenos Aires',
      state_name: 'CABA',
      zip_code: '1033',
      country: 'Argentina',
    },
    external_reference: 'ORD-2024-004',
    created_at: new Date('2024-08-25').toISOString(),
    updated_at: new Date('2024-08-30').toISOString(),
  },
  {
    user_id: '550e8400-e29b-41d4-a716-446655440002',
    status: 'delivered',
    total: 6750.0,
    payment_id: 'mp_test_005',
    shipping_address: {
      street_name: 'Calle San Martín',
      street_number: '234',
      city_name: 'Rosario',
      state_name: 'Santa Fe',
      zip_code: '2000',
      country: 'Argentina',
    },
    external_reference: 'ORD-2024-005',
    created_at: new Date('2024-08-10').toISOString(),
    updated_at: new Date('2024-08-18').toISOString(),
  },
]

// Simplificado: Solo crear órdenes básicas sin items por ahora
const testOrderItemsTemplate = []

// =====================================================
// FUNCIONES DE SEEDING
// =====================================================

async function seedUsers() {
  console.log('🔄 Insertando usuarios de prueba...')

  for (const user of testUsers) {
    const { error } = await supabase.from('user_profiles').upsert(user, { onConflict: 'id' })

    if (error) {
      console.error(`❌ Error insertando usuario ${user.email}:`, error)
    } else {
      console.log(`✅ Usuario insertado: ${user.email}`)
    }
  }
}

async function seedOrders() {
  console.log('🔄 Insertando órdenes de prueba...')

  for (const order of testOrders) {
    const { error } = await supabase.from('orders').upsert(order, { onConflict: 'id' })

    if (error) {
      console.error(`❌ Error insertando orden ${order.order_number}:`, error)
    } else {
      console.log(`✅ Orden insertada: ${order.order_number}`)
    }
  }
}

async function seedOrderItems() {
  console.log('🔄 Saltando items de órdenes por ahora...')
  console.log('✅ Items de órdenes: 0 (simplificado)')
}

async function cleanTestData() {
  console.log('🧹 Limpiando datos de prueba existentes...')

  // Eliminar órdenes con external_reference de prueba
  await supabase.from('orders').delete().like('external_reference', 'ORD-2024-%')
  await supabase
    .from('user_profiles')
    .delete()
    .in(
      'id',
      testUsers.map(u => u.id)
    )

  console.log('✅ Datos de prueba limpiados')
}

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function seedTestData() {
  try {
    console.log('🚀 INICIANDO SEED DE DATOS DE PRUEBA')
    console.log('===================================')

    // Limpiar datos existentes
    await cleanTestData()

    // Insertar nuevos datos
    await seedUsers()
    await seedOrders()
    await seedOrderItems()

    console.log('===================================')
    console.log('✅ SEED COMPLETADO EXITOSAMENTE')
    console.log(`📊 Usuarios: ${testUsers.length}`)
    console.log(`📋 Órdenes: ${testOrders.length}`)
    console.log(`📦 Items: ${testOrderItems.length}`)
  } catch (error) {
    console.error('❌ Error en seed:', error)
    process.exit(1)
  }
}

// =====================================================
// CLI
// =====================================================

if (require.main === module) {
  const command = process.argv[2]

  switch (command) {
    case 'clean':
      cleanTestData()
      break
    case 'seed':
    default:
      seedTestData()
      break
  }
}

module.exports = { seedTestData, cleanTestData }
