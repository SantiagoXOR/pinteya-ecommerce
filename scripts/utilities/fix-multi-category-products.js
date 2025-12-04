// ===================================
// FIX: Vincular productos a todas sus categorías
// ===================================
// Problema: Los productos nuevos solo tenían 1 categoría en product_categories,
// pero según el CSV deberían estar en múltiples categorías.
//
// Solución: Leer el CSV y crear todas las relaciones necesarias en product_categories.
// ===================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixMultiCategoryProducts() {
  console.log('\n🔧 INICIANDO FIX: Vinculación de productos a múltiples categorías')
  console.log('='.repeat(70))

  try {
    // Mapeo de categorías (nombre -> ID)
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug')
    
    const categoryMap = {}
    categories.forEach(c => {
      categoryMap[c.name.toUpperCase()] = c.id
      categoryMap[c.slug.toUpperCase()] = c.id
    })

    console.log('\n📊 Categorías disponibles:')
    categories.forEach(c => console.log(`   • ${c.name} (ID: ${c.id})`))

    // Productos que necesitan categorías adicionales
    const multiCategoryProducts = [
      // Membrana y Cielorraso
      { id: 116, name: 'Membrana Premium', categories: ['TECHOS', 'PAREDES'] },
      { id: 123, name: 'Cielorraso', categories: ['TECHOS', 'PAREDES'] },
      
      // Latex Premium
      { id: 195, name: 'Latex Premium Lavable', categories: ['PAREDES', 'TECHOS'] },
      { id: 199, name: 'Latex Premium Interior', categories: ['PAREDES', 'TECHOS'] },
      { id: 203, name: 'Latex Premium Exterior', categories: ['PAREDES', 'TECHOS'] },
      { id: 207, name: 'Latex Premium Int Ext Colores', categories: ['PAREDES', 'TECHOS'] },
      
      // Barnices y Esmaltes
      { id: 211, name: 'Barniz al Agua', categories: ['METALES-Y-MADERAS', 'PISOS', 'PAREDES'] },
      { id: 213, name: 'Esmalte al Agua', categories: ['METALES-Y-MADERAS', 'PAREDES'] },
      { id: 215, name: 'Hidrolaca Poliuretanica Pisos', categories: ['PISOS', 'METALES-Y-MADERAS', 'PAREDES'] },
      
      // Latex Expression
      { id: 223, name: 'Latex Expression Interior', categories: ['PAREDES', 'TECHOS'] },
      { id: 227, name: 'Latex Expression Exterior', categories: ['PAREDES', 'TECHOS'] },
      
      // Microcemento y Entonadores
      { id: 231, name: 'Microcemento Facil Fix', categories: ['PISOS', 'PAREDES'] },
      { id: 233, name: 'Entonadores', categories: ['COMPLEMENTOS', 'PAREDES', 'TECHOS'] },
      
      // Rodillos
      { id: 235, name: 'Rodillo Gold Flock', categories: ['COMPLEMENTOS', 'METALES-Y-MADERAS'] },
      { id: 238, name: 'Rodillo Mini Epoxi', categories: ['COMPLEMENTOS', 'METALES-Y-MADERAS'] },
      { id: 241, name: 'Rodillo Lanar Elefante', categories: ['COMPLEMENTOS', 'PAREDES', 'TECHOS', 'PISOS'] },
      
      // Pinceletas
      { id: 242, name: 'Pinceleta Obra V2 N40', categories: ['COMPLEMENTOS', 'PAREDES', 'TECHOS', 'PISOS'] },
      { id: 243, name: 'Pinceleta Black', categories: ['COMPLEMENTOS', 'PAREDES', 'TECHOS', 'PISOS'] },
      
      // Cinta
      { id: 245, name: 'Cinta Enmascarar Azul Pintor', categories: ['COMPLEMENTOS', 'METALES-Y-MADERAS', 'PAREDES', 'PISOS', 'TECHOS'] },
    ]

    console.log(`\n🔍 Procesando ${multiCategoryProducts.length} productos...`)

    let totalAdded = 0

    for (const product of multiCategoryProducts) {
      // Obtener categorías actuales
      const { data: currentCategories } = await supabase
        .from('product_categories')
        .select('category_id')
        .eq('product_id', product.id)
      
      const currentCategoryIds = currentCategories?.map(c => c.category_id) || []

      // Agregar categorías faltantes
      for (const catName of product.categories) {
        const categoryId = categoryMap[catName]
        
        if (!categoryId) {
          console.warn(`   ⚠️  Categoría no encontrada: ${catName}`)
          continue
        }

        // Si ya existe, skip
        if (currentCategoryIds.includes(categoryId)) {
          continue
        }

        // Insertar
        const { error } = await supabase
          .from('product_categories')
          .insert({ product_id: product.id, category_id: categoryId })
        
        if (error) {
          console.error(`   ❌ Error al agregar ${catName} a ${product.name}:`, error.message)
        } else {
          console.log(`   ✅ Agregado: ${product.name} → ${catName}`)
          totalAdded++
        }
      }
    }

    console.log('\n' + '='.repeat(70))
    console.log('✅ FIX COMPLETADO')
    console.log('='.repeat(70))
    console.log(`\n📊 RESUMEN:`)
    console.log(`   • Productos procesados: ${multiCategoryProducts.length}`)
    console.log(`   • Relaciones agregadas: ${totalAdded}`)
    console.log(`\n🔄 Los productos ahora aparecerán en todas sus categorías\n`)

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

// Ejecutar
fixMultiCategoryProducts()

