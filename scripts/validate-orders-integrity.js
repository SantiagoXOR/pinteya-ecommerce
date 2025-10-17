#!/usr/bin/env node

/**
 * Script de Validación de Integridad de Órdenes
 * =============================================
 * 
 * Este script valida que las órdenes en la base de datos tengan:
 * - order_number único y válido
 * - payer_info con datos completos
 * - shipping_address con estructura correcta
 * - whatsapp_message guardado
 * - order_items asociados correctamente
 * 
 * Uso: node scripts/validate-orders-integrity.js [limit]
 */

const { createAdminClient } = require('../src/lib/integrations/supabase/server')

class OrdersValidator {
  constructor() {
    this.supabase = createAdminClient()
    this.results = {
      success: true,
      errors: [],
      warnings: [],
      summary: {
        totalOrders: 0,
        validOrders: 0,
        ordersWithErrors: 0,
        ordersWithWarnings: 0
      }
    }
  }

  async validateOrders(limit = 50) {
    console.log('🔍 Iniciando validación de integridad de órdenes...')
    console.log(`📊 Analizando últimas ${limit} órdenes\n`)

    try {
      // Obtener órdenes con sus items
      const { data: orders, error: ordersError } = await this.supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          total,
          payer_info,
          shipping_address,
          whatsapp_message,
          whatsapp_generated_at,
          created_at,
          order_items (
            id,
            quantity,
            price
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (ordersError) {
        throw new Error(`Error al obtener órdenes: ${ordersError.message}`)
      }

      if (!orders || orders.length === 0) {
        this.results.warnings.push('No se encontraron órdenes en la base de datos')
        return this.results
      }

      this.results.summary.totalOrders = orders.length

      // Validar cada orden
      for (const order of orders) {
        const validationData = {
          id: order.id,
          order_number: order.order_number,
          total_amount: order.total_amount,
          total: order.total,
          payer_info: order.payer_info,
          shipping_address: order.shipping_address,
          whatsapp_message: order.whatsapp_message,
          whatsapp_generated_at: order.whatsapp_generated_at,
          created_at: order.created_at,
          items_count: order.order_items?.length || 0,
          items_total: order.order_items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || null
        }

        await this.validateSingleOrder(validationData)
      }

      // Calcular resumen final
      this.results.summary.validOrders = this.results.summary.totalOrders - this.results.summary.ordersWithErrors
      this.results.success = this.results.summary.ordersWithErrors === 0

      return this.results

    } catch (error) {
      console.error('❌ Error durante la validación:', error)
      this.results.success = false
      this.results.errors.push(`Error fatal: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return this.results
    }
  }

  async validateSingleOrder(order) {
    const orderErrors = []
    const orderWarnings = []

    // 1. Validar order_number
    if (!order.order_number) {
      orderErrors.push(`Orden ${order.id}: Falta order_number`)
    } else if (!order.order_number.startsWith('ORD-')) {
      orderWarnings.push(`Orden ${order.id}: order_number no tiene formato esperado (${order.order_number})`)
    }

    // 2. Validar payer_info
    if (!order.payer_info) {
      orderErrors.push(`Orden ${order.id}: Falta payer_info`)
    } else {
      const payer = order.payer_info
      if (!payer.name) orderErrors.push(`Orden ${order.id}: Falta name en payer_info`)
      if (!payer.email) orderErrors.push(`Orden ${order.id}: Falta email en payer_info`)
      if (!payer.phone && !payer.surname) {
        orderWarnings.push(`Orden ${order.id}: payer_info incompleto (falta phone o surname)`)
      }
    }

    // 3. Validar shipping_address
    if (!order.shipping_address) {
      orderErrors.push(`Orden ${order.id}: Falta shipping_address`)
    } else {
      const address = order.shipping_address
      const requiredFields = ['street_name', 'street_number', 'city_name', 'state_name', 'zip_code']
      for (const field of requiredFields) {
        if (!address[field]) {
          orderErrors.push(`Orden ${order.id}: Falta ${field} en shipping_address`)
        }
      }
    }

    // 4. Validar order_items
    if (order.items_count === 0) {
      orderErrors.push(`Orden ${order.id}: No tiene order_items asociados`)
    }

    // 5. Validar totales
    if (order.total_amount && order.items_total) {
      const difference = Math.abs(order.total_amount - order.items_total)
      if (difference > 0.01) { // Tolerancia de 1 centavo
        orderWarnings.push(`Orden ${order.id}: Desajuste en totales (orden: ${order.total_amount}, items: ${order.items_total})`)
      }
    }

    // 6. Validar whatsapp_message para órdenes recientes (últimos 7 días)
    const orderDate = new Date(order.created_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    if (orderDate > sevenDaysAgo) {
      if (!order.whatsapp_message) {
        orderWarnings.push(`Orden ${order.id}: Órden reciente sin whatsapp_message`)
      }
      if (!order.whatsapp_generated_at) {
        orderWarnings.push(`Orden ${order.id}: Órden reciente sin whatsapp_generated_at`)
      }
    }

    // Agregar errores y warnings al resultado general
    this.results.errors.push(...orderErrors)
    this.results.warnings.push(...orderWarnings)

    if (orderErrors.length > 0) {
      this.results.summary.ordersWithErrors++
    }
    if (orderWarnings.length > 0) {
      this.results.summary.ordersWithWarnings++
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60))
    console.log('📋 RESUMEN DE VALIDACIÓN DE ÓRDENES')
    console.log('='.repeat(60))

    const { summary } = this.results

    console.log(`📊 Total de órdenes analizadas: ${summary.totalOrders}`)
    console.log(`✅ Órdenes válidas: ${summary.validOrders}`)
    console.log(`❌ Órdenes con errores: ${summary.ordersWithErrors}`)
    console.log(`⚠️  Órdenes con advertencias: ${summary.ordersWithWarnings}`)

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:')
      console.log('-'.repeat(40))
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  ADVERTENCIAS:')
      console.log('-'.repeat(40))
      this.results.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`)
      })
    }

    console.log('\n' + '='.repeat(60))
    if (this.results.success) {
      console.log('🎉 VALIDACIÓN COMPLETADA EXITOSAMENTE')
    } else {
      console.log('🚨 VALIDACIÓN COMPLETADA CON ERRORES')
    }
    console.log('='.repeat(60))
  }
}

// Función principal
async function main() {
  const validator = new OrdersValidator()
  
  try {
    // Obtener límite de argumentos de línea de comandos
    const limit = process.argv[2] ? parseInt(process.argv[2]) : 50
    
    const results = await validator.validateOrders(limit)
    validator.printResults()
    
    // Salir con código de error si hay errores críticos
    if (!results.success) {
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { OrdersValidator }
