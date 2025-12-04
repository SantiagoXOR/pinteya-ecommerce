/**
 * Script para optimizar imágenes con fondo blanco
 * Agrega fondo blanco a imágenes con transparencia
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const INPUT_DIR = 'c:/Users/marti/Desktop/image-products'
const OUTPUT_DIR = 'c:/Users/marti/Desktop/image-products-webp-white-bg'

const OPTIMIZATION_CONFIG = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 85,
  effort: 6,
  backgroundColor: { r: 255, g: 255, b: 255 }, // Fondo blanco
}

async function optimizeWithWhiteBackground() {
  console.log('🖼️  Optimizando imágenes con fondo blanco...\n')

  // Crear directorio de salida
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`✅ Directorio creado: ${OUTPUT_DIR}\n`)
  }

  const files = fs.readdirSync(INPUT_DIR).filter(file => 
    /\.(png|jpg|jpeg)$/i.test(file)
  )

  console.log(`📁 Archivos encontrados: ${files.length}\n`)

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file)
    const outputFileName = file.replace(/\.(png|jpg|jpeg)$/i, '.webp')
    const outputPath = path.join(OUTPUT_DIR, outputFileName)

    try {
      const originalStats = fs.statSync(inputPath)
      const originalSize = originalStats.size

      // Procesar imagen con fondo blanco
      await sharp(inputPath)
        // Redimensionar manteniendo aspecto
        .resize(OPTIMIZATION_CONFIG.maxWidth, OPTIMIZATION_CONFIG.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        // Agregar fondo blanco (reemplaza transparencia)
        .flatten({
          background: OPTIMIZATION_CONFIG.backgroundColor
        })
        // Convertir a WebP
        .webp({
          quality: OPTIMIZATION_CONFIG.quality,
          effort: OPTIMIZATION_CONFIG.effort,
        })
        .toFile(outputPath)

      const optimizedStats = fs.statSync(outputPath)
      const optimizedSize = optimizedStats.size
      const reduction = ((originalSize - optimizedSize) / originalSize) * 100

      console.log(`✅ ${file}`)
      console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`)
      console.log(`   WebP + fondo blanco: ${(optimizedSize / 1024).toFixed(2)} KB`)
      console.log(`   Reducción: ${reduction.toFixed(1)}%\n`)
    } catch (error) {
      console.error(`❌ Error procesando ${file}:`, error.message)
    }
  }

  console.log('\n✅ Optimización completada con fondo blanco!')
  console.log(`📁 Imágenes en: ${OUTPUT_DIR}`)
}

optimizeWithWhiteBackground().catch(console.error)

