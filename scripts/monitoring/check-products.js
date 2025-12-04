// Script para verificar el estado actual de los productos
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProducts() {
  console.log('🔍 Verificando estado de productos...')

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, discounted_price, stock')
      .order('id')
      .limit(10)

    if (error) {
      console.error('❌ Error al obtener productos:', error)
      return
    }

    if (!products || products.length === 0) {
      console.log('⚠️ No se encontraron productos en la base de datos')
      return
    }

    console.log(`📦 Productos encontrados: ${products.length}`)
    console.log('')

    products.forEach((product, index) => {
      const hasDiscount = product.discounted_price && product.discounted_price < product.price
      const discountPercent = hasDiscount
        ? Math.round(((product.price - product.discounted_price) / product.price) * 100)
        : 0

      console.log(`${index + 1}. ${product.name}`)
      console.log(`   💰 Precio: $${product.price}`)
      console.log(
        `   💸 Precio con descuento: ${product.discounted_price ? `$${product.discounted_price}` : 'No configurado'}`
      )
      console.log(`   🏷️ Descuento: ${hasDiscount ? `${discountPercent}%` : 'Sin descuento'}`)
      console.log(`   📦 Stock: ${product.stock}`)
      console.log('')
    })
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkProducts()
