/**
 * Script para verificar las variantes de Thinner y Aguarras
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
  console.log('🔍 Verificando variantes de Thinner y Aguarras...\n')
  
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('*')
    .in('product_id', [111, 112])
    .order('product_id', { ascending: true })
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`✅ Encontradas ${variants.length} variantes\n`)
  
  let foundBadUrl = false
  
  variants.forEach((variant, index) => {
    console.log(`${'='.repeat(70)}`)
    console.log(`Variante ${index + 1}`)
    console.log(`${'='.repeat(70)}`)
    console.log(`Product ID: ${variant.product_id}`)
    console.log(`Variant ID: ${variant.id}`)
    console.log(`Medida: ${variant.measure}`)
    console.log(`Color: ${variant.color_name || 'N/A'}`)
    console.log(`Image URL: ${variant.image_url || 'N/A'}`)
    console.log(`Price: $${variant.price_list}`)
    console.log(`Stock: ${variant.stock}`)
    
    // Verificar si tiene URLs problemáticas
    if (variant.image_url) {
      if (variant.image_url.includes('+color') || variant.image_url.includes('pintemas')) {
        console.log('❌ ¡ALERTA! Esta variante tiene una URL INCORRECTA')
        console.log(`   URL problemática: ${variant.image_url}`)
        foundBadUrl = true
      } else if (variant.image_url.includes('genericos')) {
        console.log('✅ URL correcta')
      }
    }
    console.log('')
  })
  
  console.log(`${'='.repeat(70)}`)
  
  if (foundBadUrl) {
    console.log('\n❌ SE ENCONTRARON URLs INCORRECTAS EN LAS VARIANTES')
    console.log('   Necesitas actualizar estas variantes para que usen las URLs correctas.')
  } else {
    console.log('\n✅ Todas las variantes tienen URLs correctas')
  }
}

main().catch(console.error)

