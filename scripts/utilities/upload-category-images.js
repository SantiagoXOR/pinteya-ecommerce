#!/usr/bin/env node

/**
 * Script para subir imágenes de categorías al storage de Supabase
 * Pinteya E-commerce - Enero 2025
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

// Lista de imágenes de categorías a subir
const categoryImages = [
  'decoraciones.png',
  'exteriores.png',
  'humedades.png',
  'interiores.png',
  'maderas.png',
  'preparaciones.png',
  'profesionales.png',
  'reparaciones.png',
  'sinteticos.png',
  'techos.png',
  'terminaciones.png',
]

/**
 * Sube una imagen al storage de Supabase
 */
async function uploadImage(imageName) {
  try {
    const imagePath = path.join(process.cwd(), 'public', 'images', 'categories', imageName)

    // Verificar que el archivo existe
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  Archivo no encontrado: ${imagePath}`)
      return false
    }

    // Leer el archivo
    const imageBuffer = fs.readFileSync(imagePath)

    // URL del storage de Supabase
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/product-images/categories/${imageName}`

    console.log(`📤 Subiendo: ${imageName}...`)

    // Realizar la subida
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'image/png',
        'x-upsert': 'true', // Sobrescribir si ya existe
      },
      body: imageBuffer,
    })

    if (response.ok) {
      console.log(`✅ ${imageName} subida exitosamente`)
      return true
    } else {
      const errorText = await response.text()
      console.log(`❌ Error subiendo ${imageName}: ${response.status} - ${errorText}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Error subiendo ${imageName}:`, error.message)
    return false
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando subida de imágenes de categorías...\n')

  let successCount = 0
  let failCount = 0

  for (const imageName of categoryImages) {
    const success = await uploadImage(imageName)
    if (success) {
      successCount++
    } else {
      failCount++
    }

    // Pequeña pausa entre subidas
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n📊 Resumen:')
  console.log(`✅ Exitosas: ${successCount}`)
  console.log(`❌ Fallidas: ${failCount}`)
  console.log(`📁 Total: ${categoryImages.length}`)

  if (successCount === categoryImages.length) {
    console.log('\n🎉 ¡Todas las imágenes se subieron correctamente!')
  } else {
    console.log('\n⚠️  Algunas imágenes no se pudieron subir. Revisa los errores arriba.')
  }
}

// Ejecutar el script
main().catch(console.error)
