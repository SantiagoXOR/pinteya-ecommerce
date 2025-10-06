#!/usr/bin/env node

/**
 * Script para sincronizar URLs de imágenes de productos con la estructura real del storage
 * Pinteya E-commerce - Octubre 2025
 * 
 * PROBLEMA: Las URLs en la BD no coinciden con los archivos reales en storage
 * SOLUCIÓN: Mapear automáticamente productos con sus imágenes reales
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Función para obtener todos los archivos del storage
async function getAllStorageFiles() {
  console.log('📁 Obteniendo lista de archivos del storage...')
  
  const { data: files, error } = await supabase
    .storage
    .from('product-images')
    .list('', {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    })

  if (error) {
    console.error('❌ Error obteniendo archivos:', error)
    return []
  }

  // Obtener archivos de subcarpetas también
  const allFiles = []
  
  for (const item of files) {
    if (item.name && !item.name.includes('.')) {
      // Es una carpeta, obtener archivos dentro
      const { data: subFiles, error: subError } = await supabase
        .storage
        .from('product-images')
        .list(item.name, {
          limit: 1000,
          offset: 0
        })
      
      if (!subError && subFiles) {
        subFiles.forEach(file => {
          if (file.name.includes('.')) {
            allFiles.push({
              name: `${item.name}/${file.name}`,
              fullUrl: `${supabaseUrl}/storage/v1/object/public/product-images/${item.name}/${file.name}`
            })
          }
        })
      }
    } else if (item.name && item.name.includes('.')) {
      // Es un archivo en la raíz
      allFiles.push({
        name: item.name,
        fullUrl: `${supabaseUrl}/storage/v1/object/public/product-images/${item.name}`
      })
    }
  }

  console.log(`✅ Encontrados ${allFiles.length} archivos en storage`)
  return allFiles
}

// Función para obtener todos los productos
async function getAllProducts() {
  console.log('🛍️ Obteniendo productos de la base de datos...')
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, brand, images')
    .order('id')

  if (error) {
    console.error('❌ Error obteniendo productos:', error)
    return []
  }

  console.log(`✅ Encontrados ${products.length} productos`)
  return products
}

// Función para encontrar la mejor coincidencia de imagen para un producto
function findBestImageMatch(product, storageFiles) {
  const searchTerms = [
    product.slug,
    product.name.toLowerCase().replace(/\s+/g, '-'),
    product.name.toLowerCase().replace(/\s+/g, ''),
    product.brand?.toLowerCase()
  ].filter(Boolean)

  // Buscar coincidencias exactas primero
  for (const term of searchTerms) {
    const exactMatch = storageFiles.find(file => 
      file.name.toLowerCase().includes(term.toLowerCase())
    )
    if (exactMatch) {
      return exactMatch
    }
  }

  // Buscar coincidencias parciales
  const productWords = product.name.toLowerCase().split(' ')
  const matches = storageFiles.filter(file => {
    const fileName = file.name.toLowerCase()
    return productWords.some(word => 
      word.length > 3 && fileName.includes(word)
    )
  })

  // Retornar la mejor coincidencia (más palabras coincidentes)
  if (matches.length > 0) {
    return matches.reduce((best, current) => {
      const bestScore = productWords.filter(word => 
        best.name.toLowerCase().includes(word)
      ).length
      const currentScore = productWords.filter(word => 
        current.name.toLowerCase().includes(word)
      ).length
      return currentScore > bestScore ? current : best
    })
  }

  return null
}

// Función principal
async function syncProductImageUrls() {
  console.log('🚀 Iniciando sincronización de URLs de imágenes...\n')

  try {
    // Obtener datos
    const [storageFiles, products] = await Promise.all([
      getAllStorageFiles(),
      getAllProducts()
    ])

    console.log('\n📊 Análisis de coincidencias:')
    console.log('=' .repeat(50))

    const updates = []
    let matchedCount = 0
    let unmatchedCount = 0

    for (const product of products) {
      const bestMatch = findBestImageMatch(product, storageFiles)
      
      if (bestMatch) {
        matchedCount++
        const currentUrl = Array.isArray(product.images) ? product.images[0] : null
        
        if (currentUrl !== bestMatch.fullUrl) {
          updates.push({
            id: product.id,
            name: product.name,
            currentUrl,
            newUrl: bestMatch.fullUrl,
            fileName: bestMatch.name
          })
          
          console.log(`✅ ${product.name}`)
          console.log(`   📁 ${bestMatch.name}`)
          console.log(`   🔗 ${bestMatch.fullUrl}`)
        } else {
          console.log(`✅ ${product.name} (ya sincronizado)`)
        }
      } else {
        unmatchedCount++
        console.log(`❌ ${product.name} - No se encontró imagen`)
      }
    }

    console.log('\n📈 Resumen:')
    console.log('=' .repeat(50))
    console.log(`✅ Productos con imagen: ${matchedCount}`)
    console.log(`❌ Productos sin imagen: ${unmatchedCount}`)
    console.log(`🔄 Actualizaciones necesarias: ${updates.length}`)

    if (updates.length > 0) {
      console.log('\n🔄 Aplicando actualizaciones...')
      
      for (const update of updates) {
        const { error } = await supabase
          .from('products')
          .update({ images: [update.newUrl] })
          .eq('id', update.id)

        if (error) {
          console.error(`❌ Error actualizando ${update.name}:`, error)
        } else {
          console.log(`✅ Actualizado: ${update.name}`)
        }
      }

      console.log(`\n🎉 ¡Sincronización completada! ${updates.length} productos actualizados.`)
    } else {
      console.log('\n✅ Todas las URLs ya están sincronizadas.')
    }

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error)
    process.exit(1)
  }
}

// Ejecutar script
if (require.main === module) {
  syncProductImageUrls()
}

module.exports = { syncProductImageUrls }