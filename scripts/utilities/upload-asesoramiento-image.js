/**
 * Script para optimizar y subir la imagen de asesoramiento al bucket de Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') })

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Configuración
const BUCKET = 'product-images'
const INPUT_IMAGE = path.join(__dirname, '..', '..', 'public', 'images', 'promo', 'asesoramiento.png')
const REMOTE_PATH = 'promo/asesoramiento.webp'
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp-optimized')

// Configuración de optimización
const OPTIMIZATION_CONFIG = {
  width: 800, // Ancho máximo para banner/promo
  height: 600, // Alto máximo
  quality: 85,
  effort: 6, // Máximo esfuerzo de compresión
}

async function optimizeImage() {
  try {
    console.log('🎨 Optimizando imagen...')
    console.log(`   Entrada: ${INPUT_IMAGE}`)

    // Verificar que el archivo existe
    if (!fs.existsSync(INPUT_IMAGE)) {
      throw new Error(`Archivo no encontrado: ${INPUT_IMAGE}`)
    }

    // Crear directorio temporal si no existe
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true })
    }

    const tempPath = path.join(TEMP_DIR, 'asesoramiento.webp')
    const originalStats = fs.statSync(INPUT_IMAGE)
    const originalSize = originalStats.size

    console.log(`   Tamaño original: ${(originalSize / 1024).toFixed(2)} KB`)

    // Obtener metadata de la imagen original
    const metadata = await sharp(INPUT_IMAGE).metadata()
    console.log(`   Dimensiones originales: ${metadata.width}x${metadata.height}`)

    // Optimizar: redimensionar y convertir a WebP
    await sharp(INPUT_IMAGE)
      .resize(OPTIMIZATION_CONFIG.width, OPTIMIZATION_CONFIG.height, {
        fit: 'inside',
        withoutEnlargement: true, // No agrandar si es más pequeña
      })
      .webp({
        quality: OPTIMIZATION_CONFIG.quality,
        effort: OPTIMIZATION_CONFIG.effort,
      })
      .toFile(tempPath)

    const optimizedStats = fs.statSync(tempPath)
    const optimizedSize = optimizedStats.size
    const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1)

    console.log(`   ✅ Optimizada: ${(optimizedSize / 1024).toFixed(2)} KB (${reduction}% reducción)`)

    return { tempPath, originalSize, optimizedSize }
  } catch (error) {
    console.error(`❌ Error optimizando imagen:`, error.message)
    throw error
  }
}

async function uploadImage(filePath) {
  try {
    console.log('\n📤 Subiendo imagen a Supabase Storage...')
    console.log(`   Destino: ${REMOTE_PATH}`)

    // Leer el archivo optimizado
    const fileBuffer = fs.readFileSync(filePath)

    // Verificar si el archivo ya existe y eliminarlo primero
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET)
      .list('promo', {
        search: 'asesoramiento.webp',
      })

    if (existingFiles && existingFiles.length > 0) {
      console.log('   ⚠️  Archivo ya existe, reemplazando...')
      await supabase.storage
        .from(BUCKET)
        .remove([REMOTE_PATH])
    }

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(REMOTE_PATH, fileBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600',
      })

    if (error) {
      throw new Error(`Error al subir: ${error.message}`)
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(REMOTE_PATH)

    console.log(`   ✅ Subida exitosa`)
    console.log(`   🔗 URL pública: ${urlData.publicUrl}`)

    return urlData.publicUrl
  } catch (error) {
    console.error(`❌ Error subiendo imagen:`, error.message)
    throw error
  }
}

async function cleanup() {
  // Limpiar directorio temporal
  if (fs.existsSync(TEMP_DIR)) {
    const files = fs.readdirSync(TEMP_DIR)
    for (const file of files) {
      fs.unlinkSync(path.join(TEMP_DIR, file))
    }
    fs.rmdirSync(TEMP_DIR)
    console.log('\n🧹 Archivos temporales eliminados')
  }
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('🚀 OPTIMIZACIÓN Y SUBIDA DE IMAGEN')
  console.log('   Imagen: asesoramiento.png')
  console.log('═══════════════════════════════════════════\n')

  try {
    // Optimizar imagen
    const { tempPath } = await optimizeImage()

    // Subir imagen
    const publicUrl = await uploadImage(tempPath)

    // Limpiar archivos temporales
    await cleanup()

    console.log('\n═══════════════════════════════════════════')
    console.log('✅ PROCESO COMPLETADO EXITOSAMENTE')
    console.log('═══════════════════════════════════════════')
    console.log(`\n🔗 URL de la imagen: ${publicUrl}`)
    console.log(`\n💡 Usa esta URL en el componente HelpCard\n`)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('\n❌ Error en el proceso:', error.message)
    await cleanup()
    process.exit(1)
  }
}

main()
  .then(({ success, url }) => {
    if (success) {
      console.log('✨ Listo para usar en el componente\n')
      process.exit(0)
    }
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })





