// ===================================
// FIX: Indexar productos en product_categories
// ===================================
// Problema: Los productos nuevos tenían category_id en la tabla products
// pero no tenían entradas en product_categories (relación muchos-a-muchos).
// El endpoint de API filtra usando product_categories, por eso no aparecían.
//
// Solución: Crear entradas en product_categories para todos los productos
// que tienen category_id pero no tienen la relación.
// ===================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixProductCategoriesIndexing() {
  console.log('\n🔧 INICIANDO FIX: Indexación de productos en product_categories')
  console.log('='  .repeat(70))

  try {
    // 1. Verificar productos sin indexar
    console.log('\n📊 Paso 1: Verificando productos sin indexar...')
    
    const { data: unindexedProducts, error: checkError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        category_id,
        categories:categories(name, slug)
      `)
      .not('category_id', 'is', null)
    
    if (checkError) throw checkError

    console.log(`   Productos totales con category_id: ${unindexedProducts.length}`)

    // Verificar cuáles NO tienen entrada en product_categories
    let productsToFix = []
    
    for (const product of unindexedProducts) {
      const { data: existing, error } = await supabase
        .from('product_categories')
        .select('id')
        .eq('product_id', product.id)
        .eq('category_id', product.category_id)
        .single()
      
      if (error && error.code === 'PGRST116') { // No encontrado
        productsToFix.push(product)
      }
    }

    console.log(`   Productos SIN indexar: ${productsToFix.length}`)
    
    if (productsToFix.length === 0) {
      console.log('\n✅ Todos los productos ya están indexados correctamente')
      return
    }

    // 2. Mostrar productos a indexar
    console.log('\n📋 Productos que se van a indexar:')
    productsToFix.forEach(p => {
      console.log(`   • ${p.name} (ID: ${p.id}) → ${p.categories?.name || 'Sin categoría'}`)
    })

    // 3. Crear entradas en product_categories
    console.log('\n🔨 Paso 2: Creando entradas en product_categories...')
    
    const inserts = productsToFix.map(p => ({
      product_id: p.id,
      category_id: p.category_id
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('product_categories')
      .insert(inserts)
      .select()

    if (insertError) throw insertError

    console.log(`   ✅ Se crearon ${inserted.length} entradas exitosamente`)

    // 4. Verificar que ahora están indexados
    console.log('\n🔍 Paso 3: Verificando indexación...')
    
    const { data: verification, error: verifyError } = await supabase
      .from('product_categories')
      .select('product_id, category_id')
      .in('product_id', productsToFix.map(p => p.id))
    
    if (verifyError) throw verifyError

    console.log(`   ✅ Verificación exitosa: ${verification.length} productos indexados`)

    // 5. Resumen final
    console.log('\n' + '='.repeat(70))
    console.log('✅ FIX COMPLETADO CON ÉXITO')
    console.log('='.repeat(70))
    console.log(`\n📊 RESUMEN:`)
    console.log(`   • Productos indexados: ${inserted.length}`)
    console.log(`   • Todos los productos ahora aparecerán en sus categorías`)
    console.log(`\n🔄 PRÓXIMO PASO:`)
    console.log(`   • Refrescar el navegador (Ctrl+Shift+R)`)
    console.log(`   • Los productos nuevos ahora serán visibles\n`)

  } catch (error) {
    console.error('\n❌ Error al ejecutar el fix:', error)
    process.exit(1)
  }
}

// Ejecutar
fixProductCategoriesIndexing()

