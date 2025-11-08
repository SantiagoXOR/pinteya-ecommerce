#!/usr/bin/env node

/**
 * Script para verificar la estructura real de la base de datos
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://aakzspzfulgftqlgwkpb.supabase.co'
const supabaseServiceKey = '[SUPABASE_SERVICE_ROLE_KEY_REMOVED]'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableStructure(tableName) {
  try {
    console.log(`\n📋 Estructura de tabla: ${tableName}`)
    console.log('='.repeat(40))

    // Obtener una muestra de datos para ver la estructura
    const { data, error } = await supabase.from(tableName).select('*').limit(1)

    if (error) {
      console.error(`❌ Error accediendo a ${tableName}:`, error.message)
      return
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      console.log('📊 Columnas disponibles:')
      columns.forEach(col => {
        const value = data[0][col]
        const type = typeof value
        console.log(`   - ${col}: ${type} (ejemplo: ${JSON.stringify(value)})`)
      })
    } else {
      console.log('📭 Tabla vacía')
    }
  } catch (error) {
    console.error(`❌ Error verificando ${tableName}:`, error)
  }
}

async function getProductStats() {
  try {
    console.log('\n📊 ESTADÍSTICAS REALES DE PRODUCTOS')
    console.log('=====================================')

    // Obtener todos los productos
    const { data: products, error } = await supabase.from('products').select('*')

    if (error) {
      console.error('Error obteniendo productos:', error)
      return
    }

    console.log(`📦 Total productos: ${products.length}`)

    if (products.length > 0) {
      // Analizar estructura
      const firstProduct = products[0]
      console.log('\n🔍 Estructura de producto:')
      Object.keys(firstProduct).forEach(key => {
        console.log(`   ${key}: ${typeof firstProduct[key]}`)
      })

      // Estadísticas básicas
      const withStock = products.filter(p => p.stock && p.stock > 0).length
      const lowStock = products.filter(p => p.stock && p.stock > 0 && p.stock <= 10).length
      const noStock = products.filter(p => !p.stock || p.stock === 0).length

      console.log('\n📈 Estadísticas de stock:')
      console.log(`   Con stock: ${withStock}`)
      console.log(`   Stock bajo (≤10): ${lowStock}`)
      console.log(`   Sin stock: ${noStock}`)

      // Marcas más comunes
      const brands = products.map(p => p.brand).filter(Boolean)
      const brandCounts = brands.reduce((acc, brand) => {
        acc[brand] = (acc[brand] || 0) + 1
        return acc
      }, {})

      console.log('\n🏷️ Marcas más comunes:')
      Object.entries(brandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([brand, count]) => {
          console.log(`   ${brand}: ${count} productos`)
        })
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
  }
}

async function main() {
  console.log('🔍 VERIFICACIÓN ESTRUCTURA BASE DE DATOS')
  console.log('=========================================')

  // Verificar tablas principales
  await checkTableStructure('products')
  await checkTableStructure('categories')
  await checkTableStructure('user_profiles')
  await checkTableStructure('user_roles')

  // Obtener estadísticas reales
  await getProductStats()

  console.log('\n✅ Verificación completada!')
}

main().catch(console.error)
