/**
 * Script para encontrar TODOS los productos relacionados con thinner y aguarras
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
  console.log('🔍 Buscando TODOS los productos...\n')
  
  // Buscar todos los productos
  const { data: allProducts, error: error1 } = await supabase
    .from('products')
    .select('id, name, slug, images, brand')
  
  if (error1) {
    console.error('❌ Error:', error1.message)
    return
  }
  
  // Filtrar los que contengan thinner, aguarras o pintemas
  const products = allProducts.filter(p => {
    const searchText = `${p.name} ${p.slug} ${JSON.stringify(p.images || {})}`.toLowerCase()
    return searchText.includes('thinner') || searchText.includes('aguarras') || searchText.includes('pintemas')
  })
  
  const error = null
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`✅ Encontrados ${products.length} productos\n`)
  console.log('='.repeat(80))
  
  products.forEach((product, index) => {
    console.log(`\n${index + 1}. ${product.name}`)
    console.log(`   ID: ${product.id}`)
    console.log(`   Slug: ${product.slug}`)
    console.log(`   Marca: ${product.brand || 'N/A'}`)
    console.log(`   Imágenes:`)
    
    if (product.images) {
      const imagesStr = JSON.stringify(product.images, null, 2)
      imagesStr.split('\n').forEach(line => {
        console.log(`      ${line}`)
      })
    } else {
      console.log('      (sin imágenes)')
    }
  })
  
  console.log('\n' + '='.repeat(80))
}

main().catch(console.error)

