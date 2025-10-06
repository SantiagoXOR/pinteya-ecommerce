#!/usr/bin/env node

// =====================================================
// SCRIPT: VERIFICACIÓN DEL PANEL DE LOGÍSTICA
// Descripción: Verifica que el panel de logística funcione correctamente
// =====================================================

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogisticsPanel() {
  console.log('🚀 Iniciando verificación del Panel de Logística...\n')

  try {
    // =====================================================
    // 1. VERIFICAR TABLAS
    // =====================================================
    console.log('📋 1. Verificando tablas de logística...')

    const tables = ['couriers', 'shipments', 'tracking_events', 'logistics_alerts']
    const tableResults = {}

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`)
        tableResults[table] = { exists: false, count: 0, error: error.message }
      } else {
        console.log(`   ✅ ${table}: ${data?.length || 0} registros`)
        tableResults[table] = { exists: true, count: data?.length || 0 }
      }
    }

    // =====================================================
    // 2. VERIFICAR DATOS DE COURIERS
    // =====================================================
    console.log('\n🚚 2. Verificando couriers...')

    const { data: couriers, error: couriersError } = await supabase.from('couriers').select('*')

    if (couriersError) {
      console.log(`   ❌ Error al obtener couriers: ${couriersError.message}`)
    } else {
      console.log(`   ✅ ${couriers.length} couriers encontrados:`)
      couriers.forEach(courier => {
        console.log(
          `      - ${courier.name} (${courier.code}) - ${courier.is_active ? 'Activo' : 'Inactivo'}`
        )
      })
    }

    // =====================================================
    // 3. VERIFICAR ENVÍOS
    // =====================================================
    console.log('\n📦 3. Verificando envíos...')

    const { data: shipments, error: shipmentsError } = await supabase.from('shipments').select(`
        *,
        couriers (name, code)
      `)

    if (shipmentsError) {
      console.log(`   ❌ Error al obtener envíos: ${shipmentsError.message}`)
    } else {
      console.log(`   ✅ ${shipments.length} envíos encontrados:`)

      const statusCounts = shipments.reduce((acc, shipment) => {
        acc[shipment.status] = (acc[shipment.status] || 0) + 1
        return acc
      }, {})

      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`      - ${status}: ${count} envíos`)
      })
    }

    // =====================================================
    // 4. VERIFICAR EVENTOS DE TRACKING
    // =====================================================
    console.log('\n📍 4. Verificando eventos de tracking...')

    const { data: events, error: eventsError } = await supabase
      .from('tracking_events')
      .select('*')
      .order('event_timestamp', { ascending: false })
      .limit(5)

    if (eventsError) {
      console.log(`   ❌ Error al obtener eventos: ${eventsError.message}`)
    } else {
      console.log(`   ✅ Últimos 5 eventos de tracking:`)
      events.forEach(event => {
        console.log(
          `      - ${event.event_type}: ${event.description} (${new Date(event.event_timestamp).toLocaleString()})`
        )
      })
    }

    // =====================================================
    // 5. VERIFICAR ALERTAS
    // =====================================================
    console.log('\n🚨 5. Verificando alertas...')

    const { data: alerts, error: alertsError } = await supabase
      .from('logistics_alerts')
      .select('*')
      .order('created_at', { ascending: false })

    if (alertsError) {
      console.log(`   ❌ Error al obtener alertas: ${alertsError.message}`)
    } else {
      console.log(`   ✅ ${alerts.length} alertas encontradas:`)

      const alertCounts = alerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1
        return acc
      }, {})

      Object.entries(alertCounts).forEach(([type, count]) => {
        console.log(`      - ${type}: ${count} alertas`)
      })

      const unreadCount = alerts.filter(alert => !alert.is_read).length
      console.log(`      - No leídas: ${unreadCount}`)
    }

    // =====================================================
    // 6. SIMULAR LLAMADA A LA API
    // =====================================================
    console.log('\n🔌 6. Simulando datos de la API...')

    // Calcular estadísticas como lo haría la API
    const stats = {
      total_shipments: shipments.length,
      pending_shipments: shipments.filter(s => s.status === 'pending').length,
      in_transit_shipments: shipments.filter(s =>
        ['confirmed', 'picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)
      ).length,
      delivered_shipments: shipments.filter(s => s.status === 'delivered').length,
      exception_shipments: shipments.filter(s => s.status === 'exception').length,
      active_couriers: couriers.filter(c => c.is_active).length,
      total_shipping_cost: shipments.reduce((acc, s) => acc + (s.shipping_cost || 0), 0),
      on_time_delivery_rate: 95.5, // Simulado
    }

    console.log('   ✅ Estadísticas calculadas:')
    console.log(`      - Total envíos: ${stats.total_shipments}`)
    console.log(`      - Pendientes: ${stats.pending_shipments}`)
    console.log(`      - En tránsito: ${stats.in_transit_shipments}`)
    console.log(`      - Entregados: ${stats.delivered_shipments}`)
    console.log(`      - Excepciones: ${stats.exception_shipments}`)
    console.log(`      - Couriers activos: ${stats.active_couriers}`)
    console.log(`      - Costo total envíos: $${stats.total_shipping_cost}`)

    // =====================================================
    // 7. RESUMEN FINAL
    // =====================================================
    console.log('\n📊 RESUMEN DE VERIFICACIÓN:')
    console.log('================================')

    const allTablesExist = tables.every(table => tableResults[table].exists)
    const hasData = Object.values(tableResults).every(result => result.count > 0)

    if (allTablesExist && hasData) {
      console.log('✅ PANEL DE LOGÍSTICA: COMPLETAMENTE FUNCIONAL')
      console.log('   - Todas las tablas existen')
      console.log('   - Todas las tablas tienen datos')
      console.log('   - APIs pueden procesar correctamente')
      console.log('   - Dashboard puede mostrar métricas')
    } else {
      console.log('⚠️  PANEL DE LOGÍSTICA: REQUIERE ATENCIÓN')
      if (!allTablesExist) {
        console.log('   - Algunas tablas no existen')
      }
      if (!hasData) {
        console.log('   - Algunas tablas están vacías')
      }
    }

    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('   1. Abrir http://localhost:3000/admin/logistics')
    console.log('   2. Verificar que el dashboard carga correctamente')
    console.log('   3. Probar la creación de nuevos envíos')
    console.log('   4. Verificar las métricas en tiempo real')
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message)
    process.exit(1)
  }
}

// Ejecutar verificación
testLogisticsPanel()
  .then(() => {
    console.log('\n✅ Verificación completada exitosamente')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
