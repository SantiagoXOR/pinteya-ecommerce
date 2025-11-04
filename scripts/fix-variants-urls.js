/**
 * Script para corregir URLs de variantes de Thinner y Aguarras
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

// Mapeo de URLs incorrectas a correctas
const URL_CORRECTIONS = {
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/+color/aguarras-pintemas.webp': 
    'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/aguarras-generico.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/+color/thinner-pintemas.webp': 
    'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/thinner-generico.webp'
}

async function main() {
  const isDryRun = !process.argv.includes('--apply')
  
  console.log('🔧 SCRIPT DE CORRECCIÓN DE URLs DE VARIANTES')
  console.log('='.repeat(70))
  console.log(`Modo: ${isDryRun ? '📊 DRY RUN (simulación)' : '✅ APLICAR CAMBIOS'}\n`)
  
  if (isDryRun) {
    console.log('⚠️  Ejecutando en modo simulación.')
    console.log('   Para aplicar los cambios, usa: node scripts/fix-variants-urls.js --apply\n')
  }
  
  console.log('='.repeat(70))
  console.log('\n🔍 Buscando variantes con URLs incorrectas...\n')
  
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('*')
    .in('product_id', [111, 112])
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  let corrected = 0
  let skipped = 0
  
  for (const variant of variants) {
    const currentUrl = variant.image_url
    const correctUrl = URL_CORRECTIONS[currentUrl]
    
    if (correctUrl) {
      console.log(`🔧 Variante ID: ${variant.id} (${variant.measure})`)
      console.log(`   Producto ID: ${variant.product_id}`)
      console.log(`   ❌ URL incorrecta: ${currentUrl.substring(0, 80)}...`)
      console.log(`   ✅ URL correcta: ${correctUrl}`)
      
      if (!isDryRun) {
        const { error: updateError } = await supabase
          .from('product_variants')
          .update({ 
            image_url: correctUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', variant.id)
        
        if (updateError) {
          console.log(`   ❌ Error actualizando: ${updateError.message}`)
        } else {
          console.log(`   ✅ ACTUALIZADO correctamente`)
          corrected++
        }
      } else {
        console.log(`   ℹ️  (Modo DRY RUN - no se aplicaron cambios)`)
        corrected++
      }
      console.log('')
    } else {
      skipped++
    }
  }
  
  console.log('='.repeat(70))
  console.log(`\n📊 RESUMEN:`)
  console.log(`   - Total de variantes revisadas: ${variants.length}`)
  console.log(`   - Variantes ${isDryRun ? 'que se corregirían' : 'corregidas'}: ${corrected}`)
  console.log(`   - Variantes sin cambios: ${skipped}`)
  
  if (isDryRun && corrected > 0) {
    console.log(`\n💡 Para aplicar los cambios, ejecuta:`)
    console.log(`   node scripts/fix-variants-urls.js --apply`)
  } else if (!isDryRun && corrected > 0) {
    console.log(`\n✅ ¡Corrección completada! Las imágenes ahora deberían cargar correctamente.`)
    console.log(`   Recarga la página para ver los cambios.`)
  }
  
  console.log('='.repeat(70))
}

main().catch(console.error)

