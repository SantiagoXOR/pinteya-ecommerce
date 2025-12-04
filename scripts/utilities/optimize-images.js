/**
 * Script para optimizar imágenes PNG a WebP y JPEG
 * Pinteya E-commerce - Optimización de imágenes
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

// Configuración
const EDITED_IMAGES_DIR = path.join(__dirname, '..', 'edited-images')
const OPTIMIZED_IMAGES_DIR = path.join(__dirname, '..', 'optimized-images')

// Configuración de optimización
const OPTIMIZATION_CONFIG = {
  webp: {
    quality: 85,
    effort: 6,
    lossless: false,
  },
  jpeg: {
    quality: 90,
    progressive: true,
    mozjpeg: true,
  },
  resize: {
    width: 800,
    height: 800,
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
}

// Crear directorios si no existen
function createDirectories() {
  if (!fs.existsSync(OPTIMIZED_IMAGES_DIR)) {
    fs.mkdirSync(OPTIMIZED_IMAGES_DIR, { recursive: true })
  }

  // Crear subdirectorios por marca
  const brands = ['plavicon', 'petrilac', 'poximix', 'sinteplast', 'galgo', 'genericos']
  brands.forEach(brand => {
    const brandDir = path.join(OPTIMIZED_IMAGES_DIR, brand)
    if (!fs.existsSync(brandDir)) {
      fs.mkdirSync(brandDir, { recursive: true })
    }
  })
}

// Función para optimizar una imagen
async function optimizeImage(inputPath, outputDir, filename) {
  try {
    const baseName = path.parse(filename).name
    const webpPath = path.join(outputDir, `${baseName}.webp`)
    const jpegPath = path.join(outputDir, `${baseName}.jpg`)

    // Leer imagen original
    const image = sharp(inputPath)
    const metadata = await image.metadata()

    console.log(
      `   📐 Original: ${metadata.width}x${metadata.height}, ${metadata.format}, ${Math.round(metadata.size / 1024)}KB`
    )

    // Redimensionar y optimizar para WebP
    await image
      .clone()
      .resize(OPTIMIZATION_CONFIG.resize)
      .webp(OPTIMIZATION_CONFIG.webp)
      .toFile(webpPath)

    // Redimensionar y optimizar para JPEG
    await image
      .clone()
      .resize(OPTIMIZATION_CONFIG.resize)
      .jpeg(OPTIMIZATION_CONFIG.jpeg)
      .toFile(jpegPath)

    // Obtener tamaños de archivos optimizados
    const webpStats = fs.statSync(webpPath)
    const jpegStats = fs.statSync(jpegPath)

    console.log(`   ✅ WebP: ${Math.round(webpStats.size / 1024)}KB`)
    console.log(`   ✅ JPEG: ${Math.round(jpegStats.size / 1024)}KB`)

    return {
      success: true,
      originalSize: metadata.size,
      webpSize: webpStats.size,
      jpegSize: jpegStats.size,
      webpPath: webpPath,
      jpegPath: jpegPath,
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Función para escanear imágenes editadas
function scanEditedImages() {
  const imageFiles = []

  if (!fs.existsSync(EDITED_IMAGES_DIR)) {
    console.log('⚠️ Directorio de imágenes editadas no encontrado:', EDITED_IMAGES_DIR)
    return imageFiles
  }

  // Escanear subdirectorios por marca
  const brands = ['plavicon', 'petrilac', 'poxipol', 'sinteplast', 'galgo', 'genericos']

  brands.forEach(brand => {
    const brandDir = path.join(EDITED_IMAGES_DIR, brand)

    if (fs.existsSync(brandDir)) {
      const files = fs.readdirSync(brandDir)

      files.forEach(file => {
        const fileExt = path.extname(file).toLowerCase()

        if (['.png', '.jpg', '.jpeg'].includes(fileExt)) {
          const localPath = path.join(brandDir, file)

          // Mapear poxipol a poximix
          const targetBrand = brand === 'poxipol' ? 'poximix' : brand

          imageFiles.push({
            brand: brand,
            targetBrand: targetBrand,
            filename: file,
            localPath: localPath,
            outputDir: path.join(OPTIMIZED_IMAGES_DIR, targetBrand),
          })
        }
      })
    }
  })

  return imageFiles
}

// Función principal para optimizar todas las imágenes
async function optimizeAllImages() {
  console.log('🚀 Iniciando optimización de imágenes...\n')

  // Verificar si Sharp está disponible
  try {
    await sharp({ create: { width: 1, height: 1, channels: 3, background: 'white' } })
      .png()
      .toBuffer()
    console.log('✅ Sharp disponible para optimización\n')
  } catch (error) {
    console.error('❌ Error: Sharp no está disponible. Instala con: npm install sharp')
    process.exit(1)
  }

  createDirectories()

  try {
    // Escanear archivos editados
    const imageFiles = scanEditedImages()

    if (imageFiles.length === 0) {
      console.log('⚠️ No se encontraron imágenes para optimizar')
      console.log(`📁 Asegúrate de que las imágenes estén en: ${EDITED_IMAGES_DIR}`)
      return
    }

    console.log(`📦 Encontradas ${imageFiles.length} imágenes para optimizar\n`)

    let successCount = 0
    let errorCount = 0
    let totalOriginalSize = 0
    let totalWebpSize = 0
    let totalJpegSize = 0
    const optimizationLog = []

    // Optimizar cada imagen
    for (const imageInfo of imageFiles) {
      console.log(`🔄 Optimizando: ${imageInfo.filename}`)

      const result = await optimizeImage(
        imageInfo.localPath,
        imageInfo.outputDir,
        imageInfo.filename
      )

      if (result.success) {
        successCount++
        totalOriginalSize += result.originalSize
        totalWebpSize += result.webpSize
        totalJpegSize += result.jpegSize

        optimizationLog.push({
          filename: imageInfo.filename,
          brand: imageInfo.targetBrand,
          originalSize: result.originalSize,
          webpSize: result.webpSize,
          jpegSize: result.jpegSize,
          webpSavings: (
            ((result.originalSize - result.webpSize) / result.originalSize) *
            100
          ).toFixed(1),
          jpegSavings: (
            ((result.originalSize - result.jpegSize) / result.originalSize) *
            100
          ).toFixed(1),
        })
      } else {
        errorCount++
        optimizationLog.push({
          filename: imageInfo.filename,
          brand: imageInfo.targetBrand,
          error: result.error,
        })
      }

      console.log('') // Línea en blanco
    }

    // Guardar log de optimización
    const logPath = path.join(__dirname, '..', 'optimization-log.json')
    fs.writeFileSync(logPath, JSON.stringify(optimizationLog, null, 2))

    // Resumen final
    console.log('📊 Resumen de optimización:')
    console.log(`✅ Imágenes optimizadas: ${successCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    console.log(`📦 Total procesadas: ${successCount + errorCount}`)

    if (successCount > 0) {
      const originalSizeMB = (totalOriginalSize / 1024 / 1024).toFixed(2)
      const webpSizeMB = (totalWebpSize / 1024 / 1024).toFixed(2)
      const jpegSizeMB = (totalJpegSize / 1024 / 1024).toFixed(2)

      const webpSavings = (((totalOriginalSize - totalWebpSize) / totalOriginalSize) * 100).toFixed(
        1
      )
      const jpegSavings = (((totalOriginalSize - totalJpegSize) / totalOriginalSize) * 100).toFixed(
        1
      )

      console.log('\n💾 Estadísticas de compresión:')
      console.log(`📁 Tamaño original: ${originalSizeMB} MB`)
      console.log(`🎯 WebP optimizado: ${webpSizeMB} MB (${webpSavings}% reducción)`)
      console.log(`📷 JPEG optimizado: ${jpegSizeMB} MB (${jpegSavings}% reducción)`)
    }

    // Resumen por marca
    const brandSummary = {}
    optimizationLog.forEach(item => {
      if (!brandSummary[item.brand]) {
        brandSummary[item.brand] = { success: 0, errors: 0 }
      }
      if (item.error) {
        brandSummary[item.brand].errors++
      } else {
        brandSummary[item.brand].success++
      }
    })

    console.log('\n📁 Resumen por marca:')
    Object.entries(brandSummary).forEach(([brand, stats]) => {
      console.log(`   ${brand.toUpperCase()}: ${stats.success} exitosas, ${stats.errors} errores`)
    })

    console.log(`\n📄 Log detallado guardado en: ${logPath}`)
    console.log(`📂 Imágenes optimizadas en: ${OPTIMIZED_IMAGES_DIR}`)

    if (successCount > 0) {
      console.log('\n🎉 ¡Optimización completada exitosamente!')
      console.log('📝 Próximo paso: Ejecutar script de subida con imágenes optimizadas')
    }
  } catch (error) {
    console.error('\n💥 Error en la optimización:', error)
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  optimizeAllImages()
    .then(() => {
      console.log('\n🎉 Proceso de optimización completado!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Error:', error)
      process.exit(1)
    })
}

module.exports = { optimizeAllImages }
