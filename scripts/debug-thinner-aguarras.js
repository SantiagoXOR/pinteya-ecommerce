/**
 * Script para Debuggear productos Thinner y Aguarras
 */

const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🔍 Buscando productos Thinner y Aguarras...\n')
  
  // Buscar por nombre
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .or('name.ilike.%thinner%,name.ilike.%aguarras%')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`✅ Encontrados ${products.length} productos\n`)
  
  products.forEach((product, index) => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`PRODUCTO ${index + 1}: ${product.name}`)
    console.log('='.repeat(60))
    console.log(`ID: ${product.id}`)
    console.log(`Slug: ${product.slug}`)
    console.log(`\n📸 IMÁGENES:`)
    console.log(JSON.stringify(product.images, null, 2))
    console.log(`\n💰 PRECIOS:`)
    console.log(`Precio: $${product.price}`)
    console.log(`Precio con descuento: $${product.discounted_price || 'N/A'}`)
    console.log(`\n📦 STOCK:`)
    console.log(`Stock: ${product.stock}`)
  })
  
  console.log(`\n${'='.repeat(60)}\n`)
}

main().catch(console.error)

