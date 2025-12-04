#!/usr/bin/env node

/**
 * Script para verificar las tablas de Supabase de Pinteya E-commerce
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function verifySupabaseTables() {
  console.log('🔍 VERIFICACIÓN DE TABLAS SUPABASE - PINTEYA E-COMMERCE')
  console.log('='.repeat(60))

  // Configuración
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno faltantes:')
    console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
    process.exit(1)
  }

  // Crear cliente con service role para acceso completo
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('\n📊 Verificando conexión a Supabase...')

    // Verificar conexión básica
    const { data: healthCheck, error: healthError } = await supabase
      .from('products')
      .select('count')
      .limit(1)

    if (healthError) {
      console.log('❌ Error de conexión:', healthError.message)
      return
    }

    console.log('✅ Conexión exitosa\n')

    // Verificar tablas conocidas del e-commerce
    console.log('📋 Verificando tablas del e-commerce...')
    const knownTables = [
      'products',
      'categories',
      'orders',
      'order_items',
      'user_profiles',
      'cart_items',
      'reviews',
      'inventory',
      'shipping_addresses',
      'payment_methods',
      'coupons',
    ]

    let tablesFound = []
    console.log('\n🔍 Verificando acceso a cada tabla...')

    for (const tableName of knownTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: ${count || 0} registros`)
          tablesFound.push(tableName)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: Error de acceso - ${err.message}`)
      }
    }

    console.log(`\n📊 Resumen: ${tablesFound.length}/${knownTables.length} tablas accesibles`)

    // Verificar estructura de tabla products (principal)
    console.log('\n🔍 Verificando estructura de tabla products...')
    const { data: productSample, error: productError } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (productError) {
      console.log('❌ Error al acceder a products:', productError.message)
    } else if (productSample && productSample.length > 0) {
      console.log('✅ Estructura de products:')
      console.log('Campos disponibles:', Object.keys(productSample[0]).join(', '))
    } else {
      console.log('⚠️  Tabla products existe pero está vacía')
    }

    // Verificar RLS (Row Level Security)
    console.log('\n🔒 Verificando políticas RLS...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd')
      .in('tablename', ['products', 'categories', 'orders'])

    if (policiesError) {
      console.log('⚠️  No se pudieron verificar las políticas RLS')
    } else if (policies && policies.length > 0) {
      console.log('✅ Políticas RLS encontradas:')
      policies.forEach(policy => {
        console.log(`  - ${policy.tablename}.${policy.policyname} (${policy.cmd})`)
      })
    } else {
      console.log('⚠️  No se encontraron políticas RLS configuradas')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Verificación completada')
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message)
    process.exit(1)
  }
}

// Ejecutar verificación
verifySupabaseTables().catch(console.error)
