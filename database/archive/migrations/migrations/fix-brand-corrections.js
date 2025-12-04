// ===================================
// CORRECCIONES POST-MIGRACIÓN: Ajustar marcas y nombres específicos
// Fecha: 2025-06-29
// Descripción: Corregir productos Poximix (marca Akapol) y lijas El Galgo
// ===================================

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Cargar variables de entorno
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ===================================
// CORRECCIONES ESPECÍFICAS
// ===================================

const corrections = [
  // Productos Poximix - Marca debe ser "Akapol"
  { id: 69, brand: 'Akapol', name: 'Poximix Interior 0.5kg' },
  { id: 70, brand: 'Akapol', name: 'Poximix Interior 1.25kg' },
  { id: 71, brand: 'Akapol', name: 'Poximix Interior 3kg' },
  { id: 72, brand: 'Akapol', name: 'Poximix Interior 5kg' },
  { id: 83, brand: 'Akapol', name: 'Poximix Exterior 0.5kg' },
  { id: 84, brand: 'Akapol', name: 'Poximix Exterior 1.25kg' },
  { id: 85, brand: 'Akapol', name: 'Poximix Exterior 3kg' },
  { id: 86, brand: 'Akapol', name: 'Poximix Exterior 5kg' },

  // Lijas El Galgo - Corregir nombres cortados
  { id: 87, brand: 'El Galgo', name: 'Lija al Agua Grano 40' },
  { id: 88, brand: 'El Galgo', name: 'Lija al Agua Grano 50' },
  { id: 89, brand: 'El Galgo', name: 'Lija al Agua Grano 80' },
  { id: 90, brand: 'El Galgo', name: 'Lija al Agua Grano 120' },
  { id: 91, brand: 'El Galgo', name: 'Lija al Agua Grano 180' },

  // Accesorios genéricos - Mejorar nombres
  { id: 92, brand: 'Genérico', name: 'Bandeja Chata para Pintura' },
  { id: 93, brand: 'Genérico', name: 'Pinceleta para Obra' },
]

// ===================================
// FUNCIÓN DE CORRECCIÓN
// ===================================

async function applyCorrections() {
  console.log('🔧 Iniciando correcciones post-migración...\n')

  let successCount = 0
  let errorCount = 0

  for (const correction of corrections) {
    try {
      console.log(`🔄 Corrigiendo producto ID ${correction.id}...`)
      console.log(`   Marca: "${correction.brand}" | Nombre: "${correction.name}"`)

      const { data, error } = await supabase
        .from('products')
        .update({
          brand: correction.brand,
          name: correction.name,
        })
        .eq('id', correction.id)
        .select()

      if (error) {
        console.error(`❌ Error corrigiendo producto ${correction.id}:`, error.message)
        errorCount++
        continue
      }

      console.log(`✅ Producto ${correction.id} corregido correctamente`)
      successCount++

      // Pausa entre correcciones
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`❌ Error en producto ${correction.id}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 RESUMEN DE CORRECCIONES:')
  console.log(`✅ Productos corregidos: ${successCount}`)
  console.log(`❌ Errores: ${errorCount}`)
  console.log(`📦 Total procesados: ${corrections.length}`)

  // Verificar correcciones
  console.log('\n🔍 Verificando correcciones...')

  // Verificar productos Poximix tienen marca Akapol
  const { data: poximixProducts, error: poximixError } = await supabase
    .from('products')
    .select('id, name, brand')
    .ilike('name', '%poximix%')

  if (poximixError) {
    console.error('❌ Error verificando productos Poximix:', poximixError.message)
  } else {
    console.log(`✅ ${poximixProducts.length} productos Poximix verificados:`)
    poximixProducts.forEach(product => {
      console.log(`   ID ${product.id}: "${product.name}" - Marca: "${product.brand}"`)
    })
  }

  // Verificar lijas El Galgo
  const { data: lijaProducts, error: lijaError } = await supabase
    .from('products')
    .select('id, name, brand')
    .ilike('name', '%lija%')

  if (lijaError) {
    console.error('❌ Error verificando lijas:', lijaError.message)
  } else {
    console.log(`✅ ${lijaProducts.length} productos de lija verificados:`)
    lijaProducts.forEach(product => {
      console.log(`   ID ${product.id}: "${product.name}" - Marca: "${product.brand}"`)
    })
  }
}

// Ejecutar correcciones si se llama directamente
if (require.main === module) {
  applyCorrections()
    .then(() => {
      console.log('\n🎉 Correcciones completadas exitosamente')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Error en correcciones:', error)
      process.exit(1)
    })
}

module.exports = { applyCorrections }
