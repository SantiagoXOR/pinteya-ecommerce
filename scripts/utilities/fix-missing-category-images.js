#!/usr/bin/env node

/**
 * Script para corregir imágenes de categorías faltantes
 * Pinteya E-commerce - Enero 2025
 */

require('dotenv').config({ path: '.env.local' })

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

// Imágenes problemáticas identificadas en los logs
const problematicImages = ['categories-01.png', 'categories-07.png']

/**
 * Verifica si una imagen está disponible
 */
async function verifyImage(imageName) {
  try {
    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/categories/${imageName}`

    console.log(`🔍 Verificando: ${imageName}`)
    console.log(`   URL: ${imageUrl}`)

    const response = await fetch(imageUrl, { method: 'HEAD' })

    if (response.ok) {
      console.log(`✅ ${imageName} - Disponible (${response.status})`)
      return true
    } else {
      console.log(`❌ ${imageName} - No disponible (${response.status})`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${imageName} - Error: ${error.message}`)
    return false
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🔍 Verificando imágenes problemáticas de categorías...\n')

  let availableCount = 0
  let unavailableCount = 0
  const missingImages = []

  for (const imageName of problematicImages) {
    const isAvailable = await verifyImage(imageName)
    if (isAvailable) {
      availableCount++
    } else {
      unavailableCount++
      missingImages.push(imageName)
    }
    console.log('') // Línea en blanco
  }

  console.log('📊 Resumen:')
  console.log(`✅ Disponibles: ${availableCount}`)
  console.log(`❌ No disponibles: ${unavailableCount}`)
  console.log(`📁 Total verificadas: ${problematicImages.length}`)

  if (missingImages.length > 0) {
    console.log('\n🚨 IMÁGENES FALTANTES:')
    missingImages.forEach(img => console.log(`   - ${img}`))

    console.log('\n🔧 SOLUCIONES RECOMENDADAS:')
    console.log('1. Crear imágenes placeholder para estas categorías')
    console.log('2. Actualizar el mapeo en update-category-icons.js')
    console.log('3. Usar imágenes existentes como alternativa')

    console.log('\n📝 COMANDOS PARA CORREGIR:')
    console.log('# Opción 1: Crear placeholders')
    console.log('node scripts/create-placeholder-images.js')
    console.log('')
    console.log('# Opción 2: Actualizar mapeo')
    console.log('# Editar scripts/update-category-icons.js')
    console.log('# Cambiar categories-01.png por placeholder.png')
    console.log('# Cambiar categories-07.png por placeholder.png')
  } else {
    console.log('\n🎉 ¡Todas las imágenes están disponibles!')
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { verifyImage, problematicImages }
