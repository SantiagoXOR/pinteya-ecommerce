// ===================================
// MIGRACIÓN: Extraer marcas de nombres de productos
// Fecha: 2025-06-29
// Descripción: Script para separar marca y nombre en productos existentes
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
// CONFIGURACIÓN DE MARCAS
// ===================================

const brandPatterns = [
  {
    brand: 'El Galgo',
    patterns: [/^(.+?)\s+galgo$/i, /^(.+?)\s+el\s+galgo$/i],
  },
  {
    brand: 'Plavicon',
    patterns: [/^(.+?)\s+plavicon$/i],
  },
  {
    brand: 'Akapol',
    patterns: [
      /^(.+?)\s+poxipol$/i, // Productos Poximix son marca Akapol
      /^poximix\s+(.+?)\s+poxipol$/i,
    ],
  },
  {
    brand: 'Sinteplast',
    patterns: [/^(.+?)\s+sinteplast$/i],
  },
  {
    brand: 'Petrilac',
    patterns: [/^(.+?)\s+petrilac$/i],
  },
  {
    brand: 'Sherwin Williams',
    patterns: [/^(.+?)\s+sherwin\s+williams$/i, /^sherwin\s+williams\s+(.+)$/i],
  },
]

// ===================================
// FUNCIONES DE EXTRACCIÓN
// ===================================

/**
 * Extrae marca y nombre limpio de un título de producto
 */
function extractBrandAndName(currentName) {
  console.log(`🔍 Analizando: "${currentName}"`)

  for (const { brand, patterns } of brandPatterns) {
    for (const pattern of patterns) {
      const match = currentName.match(pattern)
      if (match) {
        const cleanName = match[1].trim()
        console.log(`✅ Marca encontrada: ${brand} | Nombre: ${cleanName}`)
        return {
          brand: brand,
          name: cleanName,
        }
      }
    }
  }

  // Casos especiales para productos sin patrón claro
  const specialCases = {
    'Cinta Papel Blanca 36mm': { brand: 'Genérico', name: 'Cinta Papel Blanca 36mm' },
    'Bandeja Chata': { brand: 'Genérico', name: 'Bandeja Chata' },
    'Pinceleta Obra': { brand: 'Genérico', name: 'Pinceleta Obra' },
  }

  if (specialCases[currentName]) {
    const result = specialCases[currentName]
    console.log(`✅ Caso especial: ${result.brand} | Nombre: ${result.name}`)
    return result
  }

  // Fallback: mantener nombre original, marca genérica
  console.log(`⚠️ No se encontró patrón, usando marca genérica`)
  return {
    brand: 'Genérico',
    name: currentName,
  }
}

/**
 * Obtiene todos los productos de la base de datos
 */
async function getAllProducts() {
  console.log('📦 Obteniendo productos de la base de datos...')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug')
    .order('id')

  if (error) {
    console.error('❌ Error obteniendo productos:', error.message)
    throw error
  }

  console.log(`✅ ${products.length} productos obtenidos`)
  return products
}

/**
 * Actualiza un producto con marca y nombre separados
 */
async function updateProduct(productId, brand, cleanName) {
  console.log(`🔄 Actualizando producto ID ${productId}...`)

  const { data, error } = await supabase
    .from('products')
    .update({
      brand: brand,
      name: cleanName,
    })
    .eq('id', productId)
    .select()

  if (error) {
    console.error(`❌ Error actualizando producto ${productId}:`, error.message)
    return false
  }

  console.log(`✅ Producto ${productId} actualizado correctamente`)
  return true
}

// ===================================
// FUNCIÓN PRINCIPAL
// ===================================

async function migrateProductBrands() {
  console.log('🚀 Iniciando migración de marcas de productos...\n')

  try {
    // 1. Obtener todos los productos
    const products = await getAllProducts()

    if (products.length === 0) {
      console.log('⚠️ No se encontraron productos para migrar')
      return
    }

    // 2. Procesar cada producto
    let successCount = 0
    let errorCount = 0
    const results = []

    for (const product of products) {
      try {
        // Extraer marca y nombre
        const { brand, name } = extractBrandAndName(product.name)

        // Actualizar en base de datos
        const success = await updateProduct(product.id, brand, name)

        if (success) {
          successCount++
          results.push({
            id: product.id,
            original: product.name,
            brand: brand,
            name: name,
            status: 'success',
          })
        } else {
          errorCount++
          results.push({
            id: product.id,
            original: product.name,
            status: 'error',
          })
        }

        // Pausa entre actualizaciones
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`❌ Error procesando producto ${product.id}:`, error.message)
        errorCount++
        results.push({
          id: product.id,
          original: product.name,
          status: 'error',
          error: error.message,
        })
      }
    }

    // 3. Mostrar resumen
    console.log('\n📊 RESUMEN DE MIGRACIÓN:')
    console.log(`✅ Productos actualizados: ${successCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    console.log(`📦 Total procesados: ${products.length}`)

    // 4. Mostrar detalles
    console.log('\n📋 DETALLES DE MIGRACIÓN:')
    results.forEach(result => {
      if (result.status === 'success') {
        console.log(
          `✅ ID ${result.id}: "${result.original}" → Marca: "${result.brand}", Nombre: "${result.name}"`
        )
      } else {
        console.log(
          `❌ ID ${result.id}: "${result.original}" - Error: ${result.error || 'Desconocido'}`
        )
      }
    })

    // 5. Verificar resultados
    console.log('\n🔍 Verificando migración...')
    const { data: updatedProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, name, brand')
      .not('brand', 'is', null)
      .order('id')

    if (verifyError) {
      console.error('❌ Error verificando migración:', verifyError.message)
    } else {
      console.log(`✅ ${updatedProducts.length} productos tienen marca asignada`)
    }
  } catch (error) {
    console.error('❌ Error en migración:', error.message)
    process.exit(1)
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateProductBrands()
    .then(() => {
      console.log('\n🎉 Migración completada exitosamente')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Error en migración:', error)
      process.exit(1)
    })
}

module.exports = { migrateProductBrands, extractBrandAndName }
