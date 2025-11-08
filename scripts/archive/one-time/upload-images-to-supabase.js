/**
 * Script para subir imágenes optimizadas a Supabase Storage
 * Organiza por marca y actualiza las URLs en product_variants
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const WEBP_DIR = 'c:/Users/marti/Desktop/image-products-webp'
const BUCKET_NAME = 'product-images'

// Mapeo de archivos a carpetas de marca
const BRAND_FOLDERS = {
  'plavipint-fibrado-plavicon.webp': 'plavicon',
  'plavicon-fibrado-plavicon.webp': 'plavicon',
  'piscinas-solvente-plavipint-plavicon.webp': 'plavicon',
  'sellador-multi-uso-plavicon.webp': 'plavicon',
  'techos-poliuretanico.webp': 'plavicon',
  'removedor-gel-penta-petrilac.webp': 'petrilac',
  'protector-ladrillos-sellagres-petrilac.webp': 'petrilac',
  'impregnante-danzke-1l-petrilac.webp': 'petrilac',
  'lija-rubi-el-galgo.webp': 'galgo',
  'enduido-mas-color.webp': 'mas-color',
  'fijador-mas-color.webp': 'mas-color',
  'ladrillo-visto-mas-color.webp': 'mas-color',
  'latex-impulso-generico.webp': 'mas-color',
  'thinner-pintemas.webp': 'pintemas',
  'aguarras-pintemas.webp': 'pintemas',
  'diluyente-caucho-duxol.webp': 'duxol',
}

async function uploadImagesToSupabase() {
  console.log('☁️  Iniciando subida de imágenes a Supabase Storage...\n')

  const files = fs.readdirSync(WEBP_DIR).filter(file => file.endsWith('.webp'))
  
  console.log(`📁 Archivos WebP encontrados: ${files.length}\n`)

  const results = []
  let successCount = 0
  let errorCount = 0

  for (const fileName of files) {
    const filePath = path.join(WEBP_DIR, fileName)
    const brandFolder = BRAND_FOLDERS[fileName] || 'genericos'
    const storagePath = `${brandFolder}/${fileName}`

    try {
      console.log(`📤 Subiendo: ${fileName} → ${storagePath}`)

      // Leer el archivo
      const fileBuffer = fs.readFileSync(filePath)

      // Verificar si el archivo ya existe y eliminarlo
      const { data: existingFiles } = await supabase.storage
        .from(BUCKET_NAME)
        .list(brandFolder, {
          search: fileName,
        })

      if (existingFiles && existingFiles.length > 0) {
        console.log(`   ⚠️  Archivo existe, reemplazando...`)
        await supabase.storage
          .from(BUCKET_NAME)
          .remove([storagePath])
      }

      // Subir el archivo
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/webp',
          upsert: true,
        })

      if (error) {
        throw error
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath)

      const publicUrl = urlData.publicUrl

      console.log(`   ✅ Subido correctamente`)
      console.log(`   🔗 URL: ${publicUrl}\n`)

      results.push({
        fileName,
        storagePath,
        publicUrl,
        success: true,
      })

      successCount++
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`)
      results.push({
        fileName,
        storagePath,
        error: error.message,
        success: false,
      })
      errorCount++
    }
  }

  // Resumen final
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DE SUBIDA')
  console.log('='.repeat(60))
  console.log(`Total de archivos: ${files.length}`)
  console.log(`Subidos exitosamente: ${successCount}`)
  console.log(`Errores: ${errorCount}`)
  console.log('='.repeat(60))

  // Guardar reporte
  const report = {
    date: new Date().toISOString(),
    bucket: BUCKET_NAME,
    totalFiles: files.length,
    successCount,
    errorCount,
    files: results,
  }

  fs.writeFileSync(
    path.join(WEBP_DIR, 'upload-report.json'),
    JSON.stringify(report, null, 2)
  )

  console.log(`\n📄 Reporte guardado en: ${WEBP_DIR}/upload-report.json`)

  if (errorCount === 0) {
    console.log(`\n✅ Todas las imágenes subidas correctamente!`)
  } else {
    console.log(`\n⚠️  Completado con ${errorCount} errores`)
  }

  return results
}

// Ejecutar
uploadImagesToSupabase()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })

