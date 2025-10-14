#!/usr/bin/env node

/**
 * Replace or upload a single product image to Supabase Storage and optionally update DB.
 *
 * Usage:
 *   node scripts/utilities/replace-storage-image.js <localFilePath> <remoteKey> [productSlug]
 *
 * Examples:
 *   node scripts/utilities/replace-storage-image.js "temp_images/techos-poliuretanico-25kg-plavicon.jpg" "plavicon/techos-poliuretanico-25kg-plavicon.jpg" "techos-poliuretanico-25kg-plavicon"
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno faltantes. Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const BUCKET = 'product-images'

function guessContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.webp') return 'image/webp'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  return 'application/octet-stream'
}

async function main() {
  const [localFile, remoteKey, slug] = process.argv.slice(2)

  if (!localFile || !remoteKey) {
    console.log('Uso: node scripts/utilities/replace-storage-image.js <localFilePath> <remoteKey> [productSlug]')
    process.exit(1)
  }

  if (!fs.existsSync(localFile)) {
    console.error(`❌ No existe el archivo local: ${localFile}`)
    process.exit(1)
  }

  const fileBuffer = fs.readFileSync(localFile)
  const contentType = guessContentType(localFile)

  console.log(`\n🚀 Subiendo a Storage: ${remoteKey} (tipo: ${contentType})`)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(remoteKey, fileBuffer, { contentType, upsert: true })

  if (uploadError) {
    console.error('💥 Error al subir la imagen:', uploadError.message)
    process.exit(1)
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(remoteKey)
  const publicUrl = publicData?.publicUrl
  console.log(`✅ Subida OK. URL pública: ${publicUrl}`)

  if (!slug) {
    console.log('ℹ️ Sin slug: no se actualiza la base de datos. Proporciona un tercer argumento para actualizar products.images.main')
    process.exit(0)
  }

  // Actualizar la columna images del producto indicado por slug
  console.log(`\n🛠️ Actualizando BD para slug: ${slug}`)

  const { data: prodRows, error: fetchErr } = await supabase
    .from('products')
    .select('id, images')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle()

  if (fetchErr) {
    console.error('💥 Error obteniendo producto:', fetchErr.message)
    process.exit(1)
  }

  if (!prodRows) {
    console.error('❌ Producto no encontrado con ese slug')
    process.exit(1)
  }

  const currentImages = prodRows.images || {}
  const updatedImages = {
    ...currentImages,
    main: publicUrl,
  }
  // Si no hay thumbnail o gallery, los alineamos con main para evitar placeholders
  if (!updatedImages.thumbnail) updatedImages.thumbnail = publicUrl
  if (!Array.isArray(updatedImages.gallery) || updatedImages.gallery.length === 0) {
    updatedImages.gallery = [publicUrl]
  }

  const { error: updateErr } = await supabase
    .from('products')
    .update({ images: updatedImages })
    .eq('slug', slug)

  if (updateErr) {
    console.error('💥 Error actualizando imágenes en BD:', updateErr.message)
    process.exit(1)
  }

  console.log('✅ Base de datos actualizada: images.main (y faltantes) apuntan a la nueva URL')
}

main().catch(err => {
  console.error('💥 Error inesperado:', err)
  process.exit(1)
})