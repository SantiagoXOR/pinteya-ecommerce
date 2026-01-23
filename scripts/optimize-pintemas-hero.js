#!/usr/bin/env node

/**
 * Script para optimizar imágenes hero de Pintemas de PNG a WebP
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const HERO_DIR = path.join(__dirname, '..', 'public', 'tenants', 'pintemas', 'hero')

// Configuración de optimización WebP
const WEBP_CONFIG = {
  quality: 85,
  effort: 6,
  alphaQuality: 100,
  lossless: false,
}

async function optimizeHeroImages() {
  console.log('🎨 Optimizando imágenes hero de Pintemas (PNG → WebP)...\n')

  try {
    // Verificar que el directorio existe
    if (!fs.existsSync(HERO_DIR)) {
      throw new Error(`Directorio no encontrado: ${HERO_DIR}`)
    }

    // Buscar archivos PNG
    const files = fs.readdirSync(HERO_DIR)
    const pngFiles = files.filter(file => file.endsWith('.png'))

    if (pngFiles.length === 0) {
      console.log('⚠️  No se encontraron archivos PNG para optimizar')
      return
    }

    console.log(`📁 Encontrados ${pngFiles.length} archivo(s) PNG:\n`)

    let totalOriginalSize = 0
    let totalOptimizedSize = 0

    for (const file of pngFiles) {
      const inputPath = path.join(HERO_DIR, file)
      const outputPath = path.join(HERO_DIR, file.replace('.png', '.webp'))

      console.log(`🔄 Procesando: ${file}`)

      // Obtener información de la imagen original
      const originalStats = fs.statSync(inputPath)
      const originalSizeKB = (originalStats.size / 1024).toFixed(2)
      totalOriginalSize += originalStats.size

      const metadata = await sharp(inputPath).metadata()
      console.log(`   📐 Dimensiones: ${metadata.width}x${metadata.height}`)
      console.log(`   📦 Tamaño original: ${originalSizeKB} KB`)

      // Convertir a WebP con optimización
      await sharp(inputPath)
        .webp(WEBP_CONFIG)
        .toFile(outputPath)

      // Obtener información de la imagen optimizada
      const optimizedStats = fs.statSync(outputPath)
      const optimizedSizeKB = (optimizedStats.size / 1024).toFixed(2)
      totalOptimizedSize += optimizedStats.size

      const saved = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1)

      console.log(`   ✅ WebP generado: ${optimizedSizeKB} KB`)
      console.log(`   💾 Ahorro: ${saved}%\n`)
    }

    // Resumen final
    const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(2)
    const totalOptimizedMB = (totalOptimizedSize / 1024 / 1024).toFixed(2)
    const totalSaved = ((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 RESUMEN DE OPTIMIZACIÓN')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Imágenes convertidas: ${pngFiles.length}`)
    console.log(`   Tamaño original total: ${totalOriginalMB} MB`)
    console.log(`   Tamaño optimizado total: ${totalOptimizedMB} MB`)
    console.log(`   Ahorro total: ${totalSaved}%`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n✅ Optimización completada exitosamente!')
    console.log(`📁 Archivos WebP generados en: ${HERO_DIR}`)

  } catch (error) {
    console.error('❌ Error durante la optimización:', error.message)
    process.exit(1)
  }
}

optimizeHeroImages()
