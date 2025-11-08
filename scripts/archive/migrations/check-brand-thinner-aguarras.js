/**
 * Script para verificar la marca de Thinner y Aguarras
 */

const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🔍 Verificando productos Thinner y Aguarras...\n')
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, brand, images')
    .in('id', [111, 112])
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  products.forEach(product => {
    console.log('='.repeat(60))
    console.log(`Producto: ${product.name}`)
    console.log(`ID: ${product.id}`)
    console.log(`Slug: ${product.slug}`)
    console.log(`Marca: "${product.brand}"`)
    console.log(`Marca normalizada: "${(product.brand || '').toLowerCase().replace(/\s+/g, '-')}"`)
    console.log(`Imágenes:`)
    console.log(JSON.stringify(product.images, null, 2))
    
    // Verificar si la marca puede estar causando el problema
    if (product.brand && product.brand.includes('+')) {
      console.log('⚠️  ALERTA: La marca contiene el símbolo "+"')
      console.log(`   Esto podría estar causando que se construya un path como: +${product.brand.toLowerCase()}/`)
    }
  })
  
  console.log('='.repeat(60))
}

main().catch(console.error)

