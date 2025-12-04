/**
 * Script para subir imágenes a Supabase Storage usando API REST
 */

const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'TU_SUPABASE_URL'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'TU_SUPABASE_ANON_KEY'

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

async function uploadImage(fileName, brandFolder) {
  const filePath = path.join(WEBP_DIR, fileName)
  const storagePath = `${brandFolder}/${fileName}`
  
  // Leer archivo
  const fileBuffer = fs.readFileSync(filePath)
  
  // URL de la API de Storage
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${storagePath}`
  
  try {
    // Subir archivo usando POST (upsert)
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'image/webp',
        'x-upsert': 'true', // Sobrescribir si existe
      },
      body: fileBuffer,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const result = await response.json()
    return {
      success: true,
      path: storagePath,
      publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`,
    }
  } catch (error) {
    return {
      success: false,
      path: storagePath,
      error: error.message,
    }
  }
}

async function uploadAllImages() {
  console.log('☁️  Subiendo imágenes a Supabase Storage...\n')
  console.log(`🔗 URL: ${SUPABASE_URL}`)
  console.log(`📦 Bucket: ${BUCKET_NAME}\n`)
  
  const files = fs.readdirSync(WEBP_DIR).filter(file => file.endsWith('.webp'))
  
  console.log(`📁 Archivos a subir: ${files.length}\n`)
  
  const results = []
  let successCount = 0
  let errorCount = 0
  
  for (const fileName of files) {
    const brandFolder = BRAND_FOLDERS[fileName] || 'genericos'
    
    console.log(`📤 Subiendo: ${fileName} → ${brandFolder}/`)
    
    const result = await uploadImage(fileName, brandFolder)
    
    if (result.success) {
      console.log(`   ✅ Éxito`)
      console.log(`   🔗 ${result.publicUrl}\n`)
      successCount++
    } else {
      console.log(`   ❌ Error: ${result.error}\n`)
      errorCount++
    }
    
    results.push({
      fileName,
      brandFolder,
      ...result,
    })
    
    // Pausa pequeña para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  // Resumen
  console.log('\n' + '='.repeat(80))
  console.log('📊 RESUMEN DE SUBIDA')
  console.log('='.repeat(80))
  console.log(`Total de archivos: ${files.length}`)
  console.log(`✅ Subidos exitosamente: ${successCount}`)
  console.log(`❌ Errores: ${errorCount}`)
  console.log('='.repeat(80))
  
  // Guardar reporte
  const report = {
    date: new Date().toISOString(),
    bucket: BUCKET_NAME,
    supabaseUrl: SUPABASE_URL,
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
    console.log(`\n✅ ¡Todas las imágenes subidas correctamente!`)
  } else {
    console.log(`\n⚠️  Completado con ${errorCount} errores`)
  }
  
  return { successCount, errorCount, results }
}

// Ejecutar
uploadAllImages()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })

