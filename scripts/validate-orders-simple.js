#!/usr/bin/env node

/**
 * Script Simple de Validación de Órdenes
 * =====================================
 * 
 * Script básico para validar órdenes usando Supabase directamente
 * 
 * Uso: node scripts/validate-orders-simple.js [limit]
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas')
  console.log('Asegúrate de tener un archivo .env.local con estas variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

class SimpleOrdersValidator {
  constructor() {
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
    console.log('🔍 Iniciando validación simple de órdenes...')
    console.log(`📊 Analizando últimas ${limit} órdenes\n`)

    try {
      // Obtener órdenes
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          payer_info,
          shipping_address,
          created_at
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
      console.log(`📋 Encontradas ${orders.length} órdenes\n`)

      // Validar cada orden
      for (const order of orders) {
        this.validateSingleOrder(order)
      }

      // Calcular resumen final
      this.results.summary.validOrders = this.results.summary.totalOrders - this.results.summary.ordersWithErrors
      this.results.success = this.results.summary.ordersWithErrors === 0

      return this.results

    } catch (error) {
      console.error('❌ Error durante la validación:', error)
      this.results.success = false
      this.results.errors.push(`Error fatal: ${error.message}`)
      return this.results
    }
  }

  validateSingleOrder(order) {
    const orderErrors = []
    const orderWarnings = []

    console.log(`🔍 Validando orden: ${order.id}`)

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

    // 4. Validar columnas de WhatsApp (solo si están disponibles)
    // Nota: Estas validaciones se habilitarán cuando las columnas estén disponibles
    if (order.whatsapp_message !== undefined || order.whatsapp_generated_at !== undefined) {
      const orderDate = new Date(order.created_at)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      if (orderDate > sevenDaysAgo) {
        if (order.whatsapp_message !== undefined && !order.whatsapp_message) {
          orderWarnings.push(`Orden ${order.id}: Órden reciente sin whatsapp_message`)
        }
        if (order.whatsapp_generated_at !== undefined && !order.whatsapp_generated_at) {
          orderWarnings.push(`Orden ${order.id}: Órden reciente sin whatsapp_generated_at`)
        }
      }
    }

    // Mostrar estado de la orden
    if (orderErrors.length > 0) {
      console.log(`  ❌ Errores: ${orderErrors.length}`)
    } else if (orderWarnings.length > 0) {
      console.log(`  ⚠️  Advertencias: ${orderWarnings.length}`)
    } else {
      console.log(`  ✅ Válida`)
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
  const validator = new SimpleOrdersValidator()
  
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

module.exports = { SimpleOrdersValidator }
