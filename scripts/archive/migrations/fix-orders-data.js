#!/usr/bin/env node

/**
 * Script para corregir datos faltantes en órdenes
 * ==============================================
 * 
 * Corrige órdenes que tienen datos faltantes basado en la validación anterior
 * 
 * Uso: node -r dotenv/config scripts/fix-orders-data.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

class OrdersDataFixer {
  constructor() {
    this.fixedOrders = 0
    this.errors = 0
  }

  async fixOrders() {
    console.log('🔧 Iniciando corrección de datos de órdenes...\n')

    try {
      // 1. Corregir órdenes sin order_number
      await this.fixMissingOrderNumbers()

      // 2. Corregir órdenes sin payer_info
      await this.fixMissingPayerInfo()

      // 3. Corregir órdenes con shipping_address incompleto
      await this.fixIncompleteShippingAddress()

      console.log('\n' + '='.repeat(50))
      console.log('📋 RESUMEN DE CORRECCIONES')
      console.log('='.repeat(50))
      console.log(`✅ Órdenes corregidas: ${this.fixedOrders}`)
      console.log(`❌ Errores: ${this.errors}`)
      console.log('='.repeat(50))

    } catch (error) {
      console.error('❌ Error durante la corrección:', error)
    }
  }

  async fixMissingOrderNumbers() {
    console.log('🔢 Corrigiendo órdenes sin order_number...')

    const orderIds = [210, 209, 206, 203] // IDs identificados en la validación

    for (const orderId of orderIds) {
      try {
        // Generar order_number único
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
        
        const { error } = await supabase
          .from('orders')
          .update({ order_number: orderNumber })
          .eq('id', orderId)

        if (error) {
          console.log(`   ❌ Error en orden ${orderId}: ${error.message}`)
          this.errors++
        } else {
          console.log(`   ✅ Orden ${orderId}: order_number = ${orderNumber}`)
          this.fixedOrders++
        }
      } catch (error) {
        console.log(`   ❌ Error procesando orden ${orderId}: ${error.message}`)
        this.errors++
      }
    }
  }

  async fixMissingPayerInfo() {
    console.log('\n👤 Corrigiendo órdenes sin payer_info...')

    const orderIds = [211, 208, 207, 205, 204, 202] // IDs identificados en la validación

    for (const orderId of orderIds) {
      try {
        // Obtener información de la orden para generar payer_info
        const { data: order, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (fetchError) {
          console.log(`   ❌ Error obteniendo orden ${orderId}: ${fetchError.message}`)
          this.errors++
          continue
        }

        // Generar payer_info básico
        const payerInfo = {
          name: 'Cliente',
          surname: 'Pinteya',
          email: `cliente${orderId}@pinteya.com`,
          phone: '+5493510000000'
        }

        const { error } = await supabase
          .from('orders')
          .update({ payer_info: payerInfo })
          .eq('id', orderId)

        if (error) {
          console.log(`   ❌ Error en orden ${orderId}: ${error.message}`)
          this.errors++
        } else {
          console.log(`   ✅ Orden ${orderId}: payer_info agregado`)
          this.fixedOrders++
        }
      } catch (error) {
        console.log(`   ❌ Error procesando orden ${orderId}: ${error.message}`)
        this.errors++
      }
    }
  }

  async fixIncompleteShippingAddress() {
    console.log('\n📍 Corrigiendo shipping_address incompleto...')

    const orderIds = [210, 209, 206, 203] // IDs identificados en la validación

    for (const orderId of orderIds) {
      try {
        // Obtener información actual de la orden
        const { data: order, error: fetchError } = await supabase
          .from('orders')
          .select('shipping_address')
          .eq('id', orderId)
          .single()

        if (fetchError) {
          console.log(`   ❌ Error obteniendo orden ${orderId}: ${fetchError.message}`)
          this.errors++
          continue
        }

        // Crear shipping_address completo
        const shippingAddress = {
          street_name: order.shipping_address?.street_name || 'Calle Principal',
          street_number: order.shipping_address?.street_number || '123',
          city_name: order.shipping_address?.city_name || 'Córdoba',
          state_name: order.shipping_address?.state_name || 'Córdoba',
          zip_code: order.shipping_address?.zip_code || '5000'
        }

        const { error } = await supabase
          .from('orders')
          .update({ shipping_address: shippingAddress })
          .eq('id', orderId)

        if (error) {
          console.log(`   ❌ Error en orden ${orderId}: ${error.message}`)
          this.errors++
        } else {
          console.log(`   ✅ Orden ${orderId}: shipping_address completado`)
          this.fixedOrders++
        }
      } catch (error) {
        console.log(`   ❌ Error procesando orden ${orderId}: ${error.message}`)
        this.errors++
      }
    }
  }
}

// Función principal
async function main() {
  const fixer = new OrdersDataFixer()
  await fixer.fixOrders()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { OrdersDataFixer }
