/**
 * Script para optimizar imágenes de productos a formato WebP
 * Convierte PNG/JPG a WebP con compresión y redimensionamiento
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const INPUT_DIR = 'c:/Users/marti/Desktop/image-products'
const OUTPUT_DIR = 'c:/Users/marti/Desktop/image-products-webp'

const OPTIMIZATION_CONFIG = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 85,
  effort: 6, // 0-6, mayor = mejor compresión pero más lento
}

async function optimizeImages() {
  console.log('🖼️  Iniciando optimización de imágenes...\n')

  // Crear directorio de salida si no existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`✅ Directorio creado: ${OUTPUT_DIR}\n`)
  }

  // Leer archivos del directorio
  const files = fs.readdirSync(INPUT_DIR).filter(file => 
    /\.(png|jpg|jpeg)$/i.test(file)
  )

  console.log(`📁 Archivos encontrados: ${files.length}\n`)

  let totalOriginalSize = 0
  let totalOptimizedSize = 0
  const results = []

  // Procesar cada imagen
  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file)
    const outputFileName = file.replace(/\.(png|jpg|jpeg)$/i, '.webp')
    const outputPath = path.join(OUTPUT_DIR, outputFileName)

    try {
      // Obtener tamaño original
      const originalStats = fs.statSync(inputPath)
      const originalSize = originalStats.size

      // Optimizar y convertir a WebP
      await sharp(inputPath)
        .resize(OPTIMIZATION_CONFIG.maxWidth, OPTIMIZATION_CONFIG.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: OPTIMIZATION_CONFIG.quality,
          effort: OPTIMIZATION_CONFIG.effort,
        })
        .toFile(outputPath)

      // Obtener tamaño optimizado
      const optimizedStats = fs.statSync(outputPath)
      const optimizedSize = optimizedStats.size

      const reduction = ((originalSize - optimizedSize) / originalSize) * 100

      totalOriginalSize += originalSize
      totalOptimizedSize += optimizedSize

      results.push({
        file,
        originalSize: (originalSize / 1024).toFixed(2) + ' KB',
        optimizedSize: (optimizedSize / 1024).toFixed(2) + ' KB',
        reduction: reduction.toFixed(1) + '%',
      })

      console.log(`✅ ${file}`)
      console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`)
      console.log(`   WebP: ${(optimizedSize / 1024).toFixed(2)} KB`)
      console.log(`   Reducción: ${reduction.toFixed(1)}%\n`)
    } catch (error) {
      console.error(`❌ Error procesando ${file}:`, error.message)
      results.push({
        file,
        error: error.message,
      })
    }
  }

  // Resumen final
  const totalReduction = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100

  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DE OPTIMIZACIÓN')
  console.log('='.repeat(60))
  console.log(`Total de archivos procesados: ${files.length}`)
  console.log(`Tamaño original total: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`Tamaño optimizado total: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`Reducción total: ${totalReduction.toFixed(1)}%`)
  console.log(`Ahorro de espacio: ${((totalOriginalSize - totalOptimizedSize) / 1024 / 1024).toFixed(2)} MB`)
  console.log('='.repeat(60))

  // Guardar reporte
  const report = {
    date: new Date().toISOString(),
    totalFiles: files.length,
    totalOriginalSize: (totalOriginalSize / 1024 / 1024).toFixed(2) + ' MB',
    totalOptimizedSize: (totalOptimizedSize / 1024 / 1024).toFixed(2) + ' MB',
    totalReduction: totalReduction.toFixed(1) + '%',
    files: results,
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'optimization-report.json'),
    JSON.stringify(report, null, 2)
  )

  console.log(`\n📄 Reporte guardado en: ${OUTPUT_DIR}/optimization-report.json`)
  console.log(`\n✅ Optimización completada!`)
  console.log(`📁 Imágenes optimizadas en: ${OUTPUT_DIR}`)
}

// Ejecutar
optimizeImages().catch(console.error)

