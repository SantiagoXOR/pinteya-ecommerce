#!/usr/bin/env node

/**
 * Script: Convertir y subir imagen de categoría a Supabase Storage
 * Uso: node scripts/utilities/convert-and-upload-category-image.js piscinas
 *
 * - Convierte PNG origen a JPG y WebP optimizados
 * - Sube ambos formatos a bucket 'product-images' en carpeta 'categories/'
 */

require('dotenv').config({ path: '.env.local' })

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas (.env.local)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const BUCKET_NAME = 'product-images'
const CATEGORIES_FOLDER = 'categories'

async function convertImageVariants(inputPngPath, baseName) {
  const image = sharp(inputPngPath).resize({ fit: 'inside', withoutEnlargement: true })

  // Salidas en memoria
  const jpgBuffer = await image
    .jpeg({ quality: 85, mozjpeg: true, progressive: true })
    .toBuffer()

  const webpBuffer = await image.webp({ quality: 80 }).toBuffer()

  return {
    jpg: { buffer: jpgBuffer, fileName: `${baseName}.jpg`, contentType: 'image/jpeg' },
    webp: { buffer: webpBuffer, fileName: `${baseName}.webp`, contentType: 'image/webp' },
  }
}

async function uploadToStorage(fileObj) {
  const remotePath = `${CATEGORIES_FOLDER}/${fileObj.fileName}`
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(remotePath, fileObj.buffer, { contentType: fileObj.contentType, upsert: true })

  if (error) throw error

  const { data: publicUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(remotePath)
  return { path: data.path, publicUrl: publicUrl.publicUrl }
}

async function main() {
  const categoryArg = process.argv[2]
  if (!categoryArg) {
    console.error('Uso: node scripts/utilities/convert-and-upload-category-image.js <nombre>')
    console.error('Ejemplo: node scripts/utilities/convert-and-upload-category-image.js piscinas')
    process.exit(1)
  }

  const inputPath = path.join(process.cwd(), 'public', 'images', 'categories', `${categoryArg}.png`)

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Archivo no encontrado: ${inputPath}`)
    process.exit(1)
  }

  console.log(`🔧 Convirtiendo ${categoryArg}.png a JPG y WebP optimizados...`)

  try {
    const variants = await convertImageVariants(inputPath, categoryArg)

    console.log('📤 Subiendo variantes al Storage...')
    const jpgResult = await uploadToStorage(variants.jpg)
    console.log(`✅ JPG subido: ${jpgResult.publicUrl}`)

    const webpResult = await uploadToStorage(variants.webp)
    console.log(`✅ WebP subido: ${webpResult.publicUrl}`)

    console.log('\n🎉 Proceso completado correctamente')
    console.log('📝 Resumen:')
    console.log(`- Bucket: ${BUCKET_NAME}`)
    console.log(`- Carpeta: ${CATEGORIES_FOLDER}`)
    console.log(`- JPG: ${jpgResult.publicUrl}`)
    console.log(`- WebP: ${webpResult.publicUrl}`)
  } catch (error) {
    console.error('💥 Error durante la conversión o subida:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}